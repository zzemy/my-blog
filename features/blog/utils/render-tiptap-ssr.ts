import type { TocItem, TiptapNode } from './toc'

type Mark = {
  type?: string
  attrs?: Record<string, unknown>
}

type FullNode = TiptapNode & {
  attrs?: Record<string, unknown>
  marks?: Mark[]
  content?: FullNode[]
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function sanitizeUrl(raw: unknown): string {
  if (typeof raw !== 'string') return '#'
  const trimmed = raw.trim()
  if (!trimmed) return '#'
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed
  try {
    const parsed = new URL(trimmed)
    if (
      parsed.protocol === 'http:' ||
      parsed.protocol === 'https:' ||
      parsed.protocol === 'mailto:'
    ) {
      return trimmed
    }
    return '#'
  } catch {
    return '#'
  }
}

function renderMarks(text: string, marks?: Mark[]): string {
  let out = escapeHtml(text)
  if (!marks || marks.length === 0) return out

  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        out = `<strong>${out}</strong>`
        break
      case 'italic':
        out = `<em>${out}</em>`
        break
      case 'strike':
        out = `<s>${out}</s>`
        break
      case 'underline':
        out = `<u>${out}</u>`
        break
      case 'code':
        out = `<code>${out}</code>`
        break
      case 'highlight': {
        const color = typeof mark.attrs?.color === 'string' ? mark.attrs.color : ''
        out = color
          ? `<mark style="background-color:${escapeHtml(color)}">${out}</mark>`
          : `<mark>${out}</mark>`
        break
      }
      case 'textStyle': {
        const color = typeof mark.attrs?.color === 'string' ? mark.attrs.color : ''
        if (color) {
          out = `<span style="color:${escapeHtml(color)}">${out}</span>`
        }
        break
      }
      case 'link': {
        const href = sanitizeUrl(mark.attrs?.href)
        const isExternal = /^https?:\/\//i.test(href)
        out = isExternal
          ? `<a href="${escapeHtml(href)}" class="article-link" target="_blank" rel="noopener noreferrer">${out}</a>`
          : `<a href="${escapeHtml(href)}" class="article-link">${out}</a>`
        break
      }
      default:
        break
    }
  }

  return out
}

function strAttr(attrs: Record<string, unknown> | undefined, key: string): string {
  const val = attrs?.[key]
  return typeof val === 'string' ? val.trim() : ''
}

function renderRichBlockFallback(node: FullNode): string {
  const attrs = node.attrs
  switch (node.type) {
    case 'articleCallout': {
      const title = strAttr(attrs, 'title')
      const text = strAttr(attrs, 'text')
      return `<aside class="rounded-xl border border-border/70 bg-muted/30 p-4 my-4">${title ? `<p class="font-semibold mb-1">${escapeHtml(title)}</p>` : ''}${text ? `<p>${escapeHtml(text)}</p>` : ''}</aside>`
    }
    case 'articleButton': {
      const label = strAttr(attrs, 'label') || '链接'
      const href = sanitizeUrl(attrs?.href)
      return `<p><a href="${escapeHtml(href)}" class="article-link">${escapeHtml(label)}</a></p>`
    }
    case 'articleTabs':
    case 'articleAccordion': {
      const panels = Array.isArray(attrs?.panels)
        ? (attrs.panels as Array<{ title?: string; text?: string }>)
        : []
      if (!panels.length) return ''
      return `<div class="space-y-3 my-4">${panels
        .map(
          (p) =>
            `<section><h4 class="font-semibold">${escapeHtml(p.title || '')}</h4><p>${escapeHtml(p.text || '')}</p></section>`,
        )
        .join('')}</div>`
    }
    case 'articleGallery':
    case 'articleSlider': {
      const items = Array.isArray(attrs?.items)
        ? (attrs.items as Array<{ src?: string; alt?: string; file?: string }>)
        : []
      if (!items.length) return ''
      return `<div class="grid gap-3 my-4">${items
        .filter((i) => i.src)
        .map(
          (i) =>
            `<figure><img src="${escapeHtml(sanitizeUrl(i.src))}" alt="${escapeHtml(i.alt || i.file || '')}" loading="lazy" class="article-image" /></figure>`,
        )
        .join('')}</div>`
    }
    case 'articleCards': {
      const cards = Array.isArray(attrs?.cards)
        ? (attrs.cards as Array<{ eyebrow?: string; title?: string; text?: string }>)
        : []
      if (!cards.length) return ''
      return `<div class="grid gap-3 my-4">${cards
        .map(
          (c) =>
            `<div>${c.eyebrow ? `<small>${escapeHtml(c.eyebrow)}</small>` : ''}<h4>${escapeHtml(c.title || '')}</h4><p>${escapeHtml(c.text || '')}</p></div>`,
        )
        .join('')}</div>`
    }
    case 'articleTimeline': {
      const items = Array.isArray(attrs?.items)
        ? (attrs.items as Array<{ label?: string; title?: string; text?: string }>)
        : []
      if (!items.length) return ''
      return `<ol class="my-4">${items
        .map(
          (item) =>
            `<li><strong>${escapeHtml(item.label || '')} ${escapeHtml(item.title || '')}</strong><p>${escapeHtml(item.text || '')}</p></li>`,
        )
        .join('')}</ol>`
    }
    case 'articleRichShowcase': {
      const title = strAttr(attrs, 'title')
      const text = strAttr(attrs, 'text')
      const image = strAttr(attrs, 'image')
      return `<section class="my-4">${image ? `<img src="${escapeHtml(sanitizeUrl(image))}" alt="${escapeHtml(title)}" loading="lazy" class="article-image" />` : ''}${title ? `<h3>${escapeHtml(title)}</h3>` : ''}${text ? `<p>${escapeHtml(text)}</p>` : ''}</section>`
    }
    default:
      return ''
  }
}

/**
 * 纯服务端 TipTap JSON → 语义化 HTML 渲染器。
 * 供文章页 SSR（保证首屏与搜索引擎爬虫拿到完整正文）与动态 RSS/Atom Feed 复用。
 */
export function renderTiptapToHtml(
  content: unknown,
  toc: TocItem[] = [],
): string {
  if (!content) return ''
  if (typeof content === 'string') return content

  let headingIndex = 0

  const renderNode = (node: FullNode | null | undefined): string => {
    if (!node) return ''

    const childrenHtml = () =>
      Array.isArray(node.content) ? node.content.map(renderNode).join('') : ''

    switch (node.type) {
      case 'doc':
        return childrenHtml()
      case 'text':
        return renderMarks(node.text || '', node.marks)
      case 'hardBreak':
        return '<br />'
      case 'horizontalRule':
        return '<hr />'
      case 'paragraph': {
        const inner = childrenHtml()
        return `<p>${inner || '<br />'}</p>`
      }
      case 'heading': {
        const rawLevel = Number(node.attrs?.level ?? 2)
        const level = Math.min(6, Math.max(1, Number.isFinite(rawLevel) ? rawLevel : 2))
        const inner = childrenHtml()
        const plain = inner.replace(/<[^>]+>/g, '').trim()
        let idAttr = ''
        if (plain && toc[headingIndex]) {
          idAttr = ` id="${escapeHtml(toc[headingIndex].id)}" style="scroll-margin-top:96px"`
          headingIndex += 1
        }
        return `<h${level}${idAttr}>${inner}</h${level}>`
      }
      case 'blockquote':
        return `<blockquote>${childrenHtml()}</blockquote>`
      case 'bulletList':
        return `<ul>${childrenHtml()}</ul>`
      case 'orderedList': {
        const start = Number(node.attrs?.start)
        const startAttr = Number.isFinite(start) && start !== 1 ? ` start="${start}"` : ''
        return `<ol${startAttr}>${childrenHtml()}</ol>`
      }
      case 'listItem':
        return `<li>${childrenHtml()}</li>`
      case 'taskList':
        return `<ul class="list-none pl-0 my-4" data-type="taskList">${childrenHtml()}</ul>`
      case 'taskItem': {
        const checked = Boolean(node.attrs?.checked)
        return `<li class="flex items-start gap-2" data-checked="${checked ? 'true' : 'false'}"><input type="checkbox" disabled ${checked ? 'checked' : ''} /><div>${childrenHtml()}</div></li>`
      }
      case 'codeBlock': {
        const lang = strAttr(node.attrs, 'language')
        const rawCode = (node.content ?? []).map((child) => child.text || '').join('')
        return `<pre><code${lang ? ` class="language-${escapeHtml(lang)}"` : ''}>${escapeHtml(rawCode)}</code></pre>`
      }
      case 'image': {
        const src = sanitizeUrl(node.attrs?.src)
        const alt = strAttr(node.attrs, 'alt')
        const title = strAttr(node.attrs, 'title')
        return `<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${title ? ` title="${escapeHtml(title)}"` : ''} loading="lazy" decoding="async" referrerpolicy="no-referrer" class="article-image" />${alt ? `<figcaption class="mt-2 text-center text-xs text-muted-foreground">${escapeHtml(alt)}</figcaption>` : ''}</figure>`
      }
      case 'table':
        return `<div class="table-wrapper"><table class="article-table"><tbody>${childrenHtml()}</tbody></table></div>`
      case 'tableRow':
        return `<tr>${childrenHtml()}</tr>`
      case 'tableHeader':
        return `<th>${childrenHtml()}</th>`
      case 'tableCell':
        return `<td>${childrenHtml()}</td>`
      case 'inlineMath': {
        const latex = strAttr(node.attrs, 'latex')
        return `<code class="math-inline">${escapeHtml(latex)}</code>`
      }
      case 'blockMath': {
        const latex = strAttr(node.attrs, 'latex')
        return `<pre class="math-block"><code>${escapeHtml(latex)}</code></pre>`
      }
      default: {
        if (node.type?.startsWith('article')) {
          return renderRichBlockFallback(node)
        }
        return childrenHtml()
      }
    }
  }

  return renderNode(content as FullNode)
}
