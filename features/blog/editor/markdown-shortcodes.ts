import type { Content } from '@tiptap/react'
import { createImageItemsFromUrls, toYouTubeEmbed } from './rich-block-extensions'

type MarkdownSegment = {
  kind: 'markdown'
  text: string
}

type ContentSegment = {
  kind: 'content'
  content: Content
}

export type ArticleMarkdownSegment = MarkdownSegment | ContentSegment

const shortcodeNames = new Set([
  'note',
  'quote',
  'tip',
  'info',
  'warning',
  'success',
  'button',
  'tabs',
  'accordion',
  'image',
  'gallery',
  'slider',
  'youtube',
  'video',
  'flow',
  'cards',
  'diagram',
  'timeline',
  'rich',
  'audio',
])

const calloutTitles = {
  note: '备注',
  quote: '引用',
  tip: '技巧',
  info: '信息',
  warning: '警告',
  success: '完成',
} as const

type CalloutTone = keyof typeof calloutTitles

export function hasArticleShortcodes(text: string) {
  return /(^|\n):::\s*(note|quote|tip|info|warning|success|button|tabs|accordion|image|gallery|slider|youtube|video|flow|cards|diagram|timeline|rich|audio)\b/i.test(
    text,
  )
}

export function splitArticleMarkdown(text: string): ArticleMarkdownSegment[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const segments: ArticleMarkdownSegment[] = []
  const markdownBuffer: string[] = []

  const flushMarkdown = () => {
    const markdown = markdownBuffer.join('\n').trim()
    markdownBuffer.length = 0
    if (markdown) segments.push({ kind: 'markdown', text: markdown })
  }

  for (let index = 0; index < lines.length; index += 1) {
    const start = lines[index].trim().match(/^:::\s*([a-z-]+)(?:\s+(.*))?$/i)
    if (!start) {
      markdownBuffer.push(lines[index])
      continue
    }

    const name = start[1].toLowerCase()
    if (!shortcodeNames.has(name)) {
      markdownBuffer.push(lines[index])
      continue
    }

    const closeIndex = findClosingFence(lines, index + 1)
    if (closeIndex === -1) {
      markdownBuffer.push(lines[index])
      continue
    }

    flushMarkdown()

    const content = parseShortcode(name, start[2] || '', lines.slice(index + 1, closeIndex))
    if (content) {
      segments.push({ kind: 'content', content })
    } else {
      segments.push({ kind: 'markdown', text: lines.slice(index, closeIndex + 1).join('\n') })
    }

    index = closeIndex
  }

  flushMarkdown()
  return segments
}

function findClosingFence(lines: string[], startIndex: number) {
  for (let index = startIndex; index < lines.length; index += 1) {
    if (lines[index].trim() === ':::') return index
  }
  return -1
}

function parseShortcode(name: string, params: string, rawLines: string[]): Content | null {
  const lines = rawLines.map((line) => line.trim()).filter(Boolean)

  if (isCalloutTone(name)) {
    return {
      type: 'articleCallout',
      attrs: {
        tone: name,
        title: params.trim() || calloutTitles[name],
        text: lines.join('\n') || `这是一条${calloutTitles[name]}。`,
      },
    }
  }

  switch (name) {
    case 'button':
      return parseButton(params, lines)
    case 'tabs':
      return parsePanels('articleTabs', lines)
    case 'accordion':
      return parsePanels('articleAccordion', lines)
    case 'image':
      return parseImage(params, lines)
    case 'gallery':
      return parseImages('articleGallery', lines)
    case 'slider':
      return parseImages('articleSlider', lines)
    case 'youtube':
      return parseYoutube(params, lines)
    case 'video':
      return parseVideo(params, lines)
    case 'flow':
      return parseFlow(lines)
    case 'cards':
      return parseCards(lines)
    case 'diagram':
      return parseDiagram(lines)
    case 'timeline':
      return parseTimeline(lines)
    case 'rich':
      return parseRich(lines)
    case 'audio':
      return parseAudio(params, lines)
    default:
      return null
  }
}

function parseButton(params: string, lines: string[]): Content | null {
  const [label, href, variant] = splitFields(lines[0] || params)
  if (!label || !href) return null

  return {
    type: 'articleButton',
    attrs: {
      label,
      href,
      variant: variant === 'secondary' ? 'secondary' : 'primary',
    },
  }
}

function parsePanels(type: 'articleTabs' | 'articleAccordion', lines: string[]): Content | null {
  const panels = lines
    .map((line) => {
      const [title, text] = splitFields(line)
      return title && text ? { title, text } : null
    })
    .filter((item): item is { title: string; text: string } => Boolean(item))

  if (!panels.length) return null
  return { type, attrs: type === 'articleTabs' ? { panels } : { items: panels } }
}

function parseImage(params: string, lines: string[]): Content | null {
  const [src, alt, title] = splitFields(lines[0] || params)
  if (!src) return null

  return {
    type: 'image',
    attrs: {
      src,
      alt: alt || '图片说明',
      ...(title ? { title } : {}),
    },
  }
}

function parseImages(type: 'articleGallery' | 'articleSlider', lines: string[]): Content | null {
  const images = lines
    .map((line, index) => {
      const [src, alt, file] = splitFields(line)
      if (!src) return null
      const fallback = createImageItemsFromUrls(src)[0]
      return {
        src,
        file: file || fallback?.file || `image-${index + 1}.jpg`,
        alt: alt || fallback?.alt || `图片说明：image-${index + 1}.jpg`,
      }
    })
    .filter((item): item is { src: string; file: string; alt: string } => Boolean(item))

  if (!images.length) return null
  return { type, attrs: { images } }
}

function parseYoutube(params: string, lines: string[]): Content | null {
  const src = lines[0] || params.trim()
  if (!src) return null
  return {
    type: 'articleEmbed',
    attrs: {
      kind: 'youtube',
      src: toYouTubeEmbed(src),
      title: 'YouTube 视频',
    },
  }
}

function parseVideo(params: string, lines: string[]): Content | null {
  const values = parseKeyValues(lines)
  const src = values.src || lines[0] || params.trim()
  if (!src) return null

  return {
    type: 'articleEmbed',
    attrs: {
      kind: 'video',
      src,
      poster: values.poster || '',
      title: values.title || '自定义视频',
    },
  }
}

function parseFlow(lines: string[]): Content {
  const values = parseKeyValues(lines)

  return {
    type: 'articleFlow',
    attrs: {
      start: values.start || '开始',
      question: values.question || '内容完整？',
      yes: values.yes || '预览发布',
      no: values.no || '继续修改',
      end: values.end || '归档',
    },
  }
}

function parseCards(lines: string[]): Content | null {
  const cards = lines
    .map((line) => {
      const [eyebrow, title, text] = splitFields(line)
      return title && text ? { eyebrow, title, text } : null
    })
    .filter((item): item is { eyebrow: string; title: string; text: string } => Boolean(item))

  if (!cards.length) return null
  return { type: 'articleCards', attrs: { cards } }
}

function parseDiagram(lines: string[]): Content | null {
  const items = lines.map((label) => ({ label })).filter((item) => item.label)
  if (!items.length) return null
  return { type: 'articleDiagram', attrs: { items } }
}

function parseTimeline(lines: string[]): Content | null {
  const items = lines
    .map((line) => {
      const [label, title, text] = splitFields(line)
      return label && title && text ? { label, title, text } : null
    })
    .filter((item): item is { label: string; title: string; text: string } => Boolean(item))

  if (!items.length) return null
  return { type: 'articleTimeline', attrs: { items } }
}

function parseRich(lines: string[]): Content {
  const values = parseKeyValues(lines)

  return {
    type: 'articleRichShowcase',
    attrs: {
      image: values.image || '',
      alt: values.alt || '图片说明',
      eyebrow: values.eyebrow || '富文本块',
      title: values.title || '混合正文模块',
      text: values.text || '一个块里同时承载媒体、摘要、状态和操作入口。',
      primaryLabel: values.primaryLabel || values.primary_label || '',
      primaryHref: values.primaryHref || values.primary_href || '',
      secondaryLabel: values.secondaryLabel || values.secondary_label || '',
      secondaryHref: values.secondaryHref || values.secondary_href || '',
    },
  }
}

function parseAudio(params: string, lines: string[]): Content | null {
  const values = parseKeyValues(lines)
  const src = values.src || lines[0] || params.trim()
  if (!src) return null

  return {
    type: 'articleAudio',
    attrs: {
      src,
      title: values.title || '嵌入音频',
      caption: values.caption || '音频 · 正文宽度媒体控件',
    },
  }
}

function splitFields(line: string) {
  return line.split('|').map((part) => part.trim())
}

function parseKeyValues(lines: string[]) {
  return lines.reduce<Record<string, string>>((values, line) => {
    const match = line.match(/^([A-Za-z][\w-]*)\s*[:=]\s*(.*)$/)
    if (!match) return values
    values[match[1]] = match[2].trim()
    return values
  }, {})
}

function isCalloutTone(value: string): value is CalloutTone {
  return value in calloutTitles
}
