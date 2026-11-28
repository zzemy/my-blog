import type { JSONContent } from '@tiptap/react'
import { z } from 'zod'
import type { AiGlossaryEntry } from './types'
import { extractJsonFromLlmText } from './providers'

type JsonRecord = Record<string, unknown>

const SKIP_NODE_TYPES = new Set([
  'codeBlock',
  'mathematics',
  'inlineMath',
  'blockMath',
  'image',
  'horizontalRule',
])

const TRANSLATABLE_ATTR_KEYS = [
  'title',
  'text',
  'label',
  'caption',
  'eyebrow',
  'start',
  'question',
  'yes',
  'no',
  'end',
]
const TRANSLATABLE_LIST_KEYS = ['panels', 'items', 'cards']
const TRANSLATABLE_ITEM_KEYS = ['title', 'text', 'label', 'eyebrow']

interface ExtractedSegment {
  id: string
  text: string
  apply: (translated: string) => void
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null
}

function hasInlineCodeMark(node: JsonRecord): boolean {
  if (!Array.isArray(node.marks)) return false
  return node.marks.some((mark) => isRecord(mark) && mark.type === 'code')
}

function isPureUrlOrSymbol(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return true
  if (/^https?:\/\/\S+$/i.test(trimmed)) return true
  if (/^[\d\s.,:;!?@#$%^&*()_+\-=\[\]{}<>/\\|~`'"—–…]+$/.test(trimmed)) return true
  return false
}

function collectTranslatableSegments(node: unknown, segments: ExtractedSegment[]): void {
  if (!isRecord(node)) return

  const nodeType = typeof node.type === 'string' ? node.type : ''
  if (SKIP_NODE_TYPES.has(nodeType)) {
    return
  }

  // 1. 文本叶子节点（跳过行内 code mark）
  if (nodeType === 'text' && typeof node.text === 'string') {
    if (!hasInlineCodeMark(node) && !isPureUrlOrSymbol(node.text)) {
      const rawText = node.text
      const leadingSpaces = rawText.match(/^\s*/)?.[0] ?? ''
      const trailingSpaces = rawText.match(/\s*$/)?.[0] ?? ''
      const coreText = rawText.trim()
      const id = String(segments.length)
      segments.push({
        id,
        text: coreText,
        apply: (translated) => {
          node.text = `${leadingSpaces}${translated.trim()}${trailingSpaces}`
        },
      })
    }
    return
  }

  // 2. 自定义富文本块属性（Callout / Cards / Tabs / Accordion / Timeline 等）
  if (isRecord(node.attrs) && nodeType.startsWith('article')) {
    const attrs = node.attrs
    for (const key of TRANSLATABLE_ATTR_KEYS) {
      const value = attrs[key]
      if (typeof value === 'string' && !isPureUrlOrSymbol(value)) {
        const id = String(segments.length)
        segments.push({
          id,
          text: value.trim(),
          apply: (translated) => {
            attrs[key] = translated.trim()
          },
        })
      }
    }

    for (const listKey of TRANSLATABLE_LIST_KEYS) {
      const list = attrs[listKey]
      if (!Array.isArray(list)) continue
      for (const entry of list) {
        if (!isRecord(entry)) continue
        for (const field of TRANSLATABLE_ITEM_KEYS) {
          const value = entry[field]
          if (typeof value === 'string' && !isPureUrlOrSymbol(value)) {
            const id = String(segments.length)
            segments.push({
              id,
              text: value.trim(),
              apply: (translated) => {
                entry[field] = translated.trim()
              },
            })
          }
        }
      }
    }
  }

  // 3. 递归子节点
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      collectTranslatableSegments(child, segments)
    }
  }
}

function batchSegments(
  segments: ExtractedSegment[],
  maxCharsPerBatch = 1100,
  maxItemsPerBatch = 16,
): ExtractedSegment[][] {
  const batches: ExtractedSegment[][] = []
  let current: ExtractedSegment[] = []
  let currentChars = 0

  for (const segment of segments) {
    const nextChars = currentChars + segment.text.length
    if (
      current.length > 0 &&
      (nextChars > maxCharsPerBatch || current.length >= maxItemsPerBatch)
    ) {
      batches.push(current)
      current = []
      currentChars = 0
    }
    current.push(segment)
    currentChars += segment.text.length
  }

  if (current.length > 0) {
    batches.push(current)
  }

  return batches
}

const batchResponseSchema = z.object({
  translations: z.record(z.string(), z.string()),
})

function parseTranslationMap(rawOutput: string): Record<string, string> {
  const parsedJson = extractJsonFromLlmText(rawOutput)

  // 兼容模型直接返回 {"0": "..."} 或 {"translations": {"0": "..."}}
  const parsedWrapped = batchResponseSchema.safeParse(parsedJson)
  if (parsedWrapped.success) {
    return parsedWrapped.data.translations
  }

  if (isRecord(parsedJson)) {
    const direct: Record<string, string> = {}
    for (const [key, val] of Object.entries(parsedJson)) {
      if (typeof val === 'string') {
        direct[key] = val
      }
    }
    if (Object.keys(direct).length > 0) {
      return direct
    }
  }

  throw new Error('模型返回的 JSON 中缺少有效的翻译映射')
}

export interface TranslateTipTapParams {
  content: JSONContent
  articleTitle: string
  targetLocaleLabel: string
  glossary?: AiGlossaryEntry[]
  customSystemPrompt?: string | null
  invokeBatch: (
    systemPrompt: string,
    userPrompt: string,
    options?: { jsonMode?: boolean },
  ) => Promise<string>
  onProgress?: (progress: {
    completedBatches: number
    totalBatches: number
    totalSegments: number
  }) => void
}

export async function translateTipTapContent(params: TranslateTipTapParams): Promise<{
  translatedContent: JSONContent
  totalSegments: number
  translatedSegments: number
}> {
  const cloned = JSON.parse(JSON.stringify(params.content)) as JSONContent
  const segments: ExtractedSegment[] = []
  collectTranslatableSegments(cloned, segments)

  if (segments.length === 0) {
    return {
      translatedContent: cloned,
      totalSegments: 0,
      translatedSegments: 0,
    }
  }

  const glossaryBlock =
    params.glossary && params.glossary.length > 0
      ? `\n\nTerminology Glossary (MUST strictly follow):\n${params.glossary
          .map((g) => `- "${g.source}" => "${g.target}"${g.note ? ` (${g.note})` : ''}`)
          .join('\n')}`
      : ''

  const systemPrompt =
    params.customSystemPrompt?.trim() ||
    `You are an expert technical blog translator. Translate each numbered text segment naturally and accurately into ${params.targetLocaleLabel}.
Rules:
1. Preserve technical accuracy, code identifiers, library names, API names, URLs, and Markdown/LaTeX symbols intact.
2. Keep the tone natural, clear, and idiomatic for native readers of ${params.targetLocaleLabel}.
3. Return ONLY a valid JSON object matching: {"translations": {"<id>": "<translated text>"}}.
4. Every input id MUST appear in "translations". Do not merge or skip entries.${glossaryBlock}`

  const plainSingleSystemPrompt = `You are an expert technical blog translator. Translate the given text accurately and naturally into ${params.targetLocaleLabel}. Preserve technical terms, code identifiers, and URLs. Return ONLY the translated text without quotes, markdown fences, or explanations.${glossaryBlock}`

  const translateSinglePlain = async (seg: ExtractedSegment): Promise<number> => {
    const userPrompt = `Article Title Context: ${params.articleTitle}\nTarget Language: ${params.targetLocaleLabel}\n\nText to translate:\n${seg.text}`
    const translated = (
      await params.invokeBatch(plainSingleSystemPrompt, userPrompt, { jsonMode: false })
    ).trim()
    if (translated) {
      seg.apply(translated)
      return 1
    }
    return 0
  }

  const translateBatchWithFallback = async (
    batch: ExtractedSegment[],
    depth = 0,
  ): Promise<number> => {
    const inputMap: Record<string, string> = {}
    for (const seg of batch) {
      inputMap[seg.id] = seg.text
    }

    const userPrompt = [
      `Article Title Context: ${params.articleTitle}`,
      `Target Language: ${params.targetLocaleLabel}`,
      `Translate the following JSON map values into ${params.targetLocaleLabel} and return {"translations": {...}} with the exact same keys:`,
      JSON.stringify(inputMap, null, 2),
    ].join('\n\n')

    // 尝试 JSON 批量翻译（失败后若有多段则自动二分拆批，单段则降级为纯文本翻译）
    try {
      const rawOutput = await params.invokeBatch(systemPrompt, userPrompt, { jsonMode: true })
      const map = parseTranslationMap(rawOutput)
      let count = 0
      const missing: ExtractedSegment[] = []

      for (const seg of batch) {
        const translated = map[seg.id]
        if (typeof translated === 'string' && translated.trim()) {
          seg.apply(translated)
          count += 1
        } else {
          missing.push(seg)
        }
      }

      // 补漏：若模型漏译少量条目，单独补译
      if (missing.length > 0 && missing.length <= 4 && depth < 2) {
        for (const seg of missing) {
          try {
            count += await translateSinglePlain(seg)
          } catch {
            // 保留原文，避免整篇失败
          }
        }
      }

      return count
    } catch (firstError) {
      if (batch.length > 1) {
        const mid = Math.ceil(batch.length / 2)
        const left = batch.slice(0, mid)
        const right = batch.slice(mid)
        const leftCount = await translateBatchWithFallback(left, depth + 1)
        const rightCount = await translateBatchWithFallback(right, depth + 1)
        return leftCount + rightCount
      }

      // 单段在 JSON 模式下仍失败时，降级为纯文本翻译，彻底规避 JSON 转义/格式问题
      if (batch.length === 1) {
        try {
          return await translateSinglePlain(batch[0])
        } catch {
          throw firstError
        }
      }

      throw firstError
    }
  }

  const batches = batchSegments(segments)
  let translatedSegments = 0

  params.onProgress?.({
    completedBatches: 0,
    totalBatches: batches.length,
    totalSegments: segments.length,
  })

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const batch = batches[batchIndex]
    translatedSegments += await translateBatchWithFallback(batch)

    params.onProgress?.({
      completedBatches: batchIndex + 1,
      totalBatches: batches.length,
      totalSegments: segments.length,
    })
  }

  return {
    translatedContent: cloned,
    totalSegments: segments.length,
    translatedSegments,
  }
}
