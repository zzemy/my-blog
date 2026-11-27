import crypto from 'crypto'

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null
}

function extractInlineText(node: unknown): string {
  if (!isRecord(node)) return ''
  if (typeof node.text === 'string') return node.text
  if (node.type === 'hardBreak') return '\n'
  if (node.type === 'inlineMath' || node.type === 'mathematics') {
    const latex = isRecord(node.attrs) && typeof node.attrs.latex === 'string' ? node.attrs.latex : ''
    return latex ? `$${latex}$` : ''
  }
  if (Array.isArray(node.content)) {
    return node.content.map(extractInlineText).join('')
  }
  return ''
}

function collectMarkdownLines(node: unknown, lines: string[], listDepth = 0): void {
  if (!isRecord(node)) return

  const type = typeof node.type === 'string' ? node.type : ''

  switch (type) {
    case 'doc': {
      if (Array.isArray(node.content)) {
        for (const child of node.content) {
          collectMarkdownLines(child, lines, listDepth)
        }
      }
      return
    }
    case 'heading': {
      const level = isRecord(node.attrs) && typeof node.attrs.level === 'number' ? node.attrs.level : 2
      const text = extractInlineText(node).trim()
      if (text) {
        lines.push(`${'#'.repeat(Math.min(Math.max(level, 1), 6))} ${text}`)
      }
      return
    }
    case 'paragraph': {
      const text = extractInlineText(node).trim()
      if (text) {
        lines.push(text)
      }
      return
    }
    case 'codeBlock': {
      const lang = isRecord(node.attrs) && typeof node.attrs.language === 'string' ? node.attrs.language : ''
      const code = extractInlineText(node).trim()
      const snippet = code.length > 400 ? `${code.slice(0, 400)}\n// ... (omitted)` : code
      if (snippet) {
        lines.push(`\`\`\`${lang}\n${snippet}\n\`\`\``)
      }
      return
    }
    case 'blockquote': {
      const inner: string[] = []
      if (Array.isArray(node.content)) {
        for (const child of node.content) {
          collectMarkdownLines(child, inner, listDepth)
        }
      }
      if (inner.length > 0) {
        lines.push(inner.map((line) => `> ${line}`).join('\n'))
      }
      return
    }
    case 'bulletList':
    case 'orderedList':
    case 'taskList': {
      if (Array.isArray(node.content)) {
        node.content.forEach((item, index) => {
          const inner: string[] = []
          collectMarkdownLines(item, inner, listDepth + 1)
          if (inner.length > 0) {
            const prefix = type === 'orderedList' ? `${index + 1}. ` : '- '
            const indent = '  '.repeat(listDepth)
            lines.push(`${indent}${prefix}${inner.join(' ')}`)
          }
        })
      }
      return
    }
    case 'listItem':
    case 'taskItem': {
      if (Array.isArray(node.content)) {
        for (const child of node.content) {
          collectMarkdownLines(child, lines, listDepth)
        }
      }
      return
    }
    case 'table': {
      if (Array.isArray(node.content)) {
        for (const row of node.content) {
          if (!isRecord(row) || !Array.isArray(row.content)) continue
          const cells = row.content.map((cell) => extractInlineText(cell).replace(/\s+/g, ' ').trim())
          if (cells.some(Boolean)) {
            lines.push(`| ${cells.join(' | ')} |`)
          }
        }
      }
      return
    }
    default: {
      // 处理自定义富文本卡片/提示框/标签页等属性里的文本
      if (isRecord(node.attrs)) {
        const attrs = node.attrs
        const attrTexts: string[] = []
        for (const key of ['eyebrow', 'title', 'text', 'label', 'caption', 'question', 'yes', 'no', 'start', 'end']) {
          const val = attrs[key]
          if (typeof val === 'string' && val.trim()) {
            attrTexts.push(val.trim())
          }
        }
        for (const listKey of ['panels', 'items', 'cards']) {
          const list = attrs[listKey]
          if (!Array.isArray(list)) continue
          for (const entry of list) {
            if (!isRecord(entry)) continue
            for (const field of ['eyebrow', 'title', 'text', 'label']) {
              const val = entry[field]
              if (typeof val === 'string' && val.trim()) {
                attrTexts.push(val.trim())
              }
            }
          }
        }
        if (attrTexts.length > 0) {
          lines.push(attrTexts.join(' - '))
        }
      }
      if (Array.isArray(node.content)) {
        for (const child of node.content) {
          collectMarkdownLines(child, lines, listDepth)
        }
      }
    }
  }
}

export function extractTextFromTipTap(content: unknown, maxChars = 14_000): string {
  if (!content) return ''
  if (typeof content === 'string') {
    return content.trim().slice(0, maxChars)
  }

  const lines: string[] = []
  collectMarkdownLines(content, lines)
  const combined = lines.join('\n\n').trim()

  if (combined.length <= maxChars) {
    return combined
  }

  // 保留开头与结尾，确保大模型既能看到导语也能看到结论
  const headSize = Math.floor(maxChars * 0.75)
  const tailSize = maxChars - headSize - 40
  return `${combined.slice(0, headSize)}\n\n[... 中间部分已略去 ...]\n\n${combined.slice(-tailSize)}`
}

export function computePostSourceHash(title: string, content: unknown): string {
  const payload = JSON.stringify({ title: title.trim(), content: content ?? null })
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex').slice(0, 16)
}
