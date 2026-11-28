type NodeLike = {
  type?: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: Array<{ type?: string; attrs?: Record<string, unknown> }>
  content?: NodeLike[]
}

function renderInline(nodes?: NodeLike[]): string {
  if (!Array.isArray(nodes)) return ''
  return nodes
    .map((node) => {
      if (node.type === 'hardBreak') return '  \n'
      if (node.type === 'inlineMath') {
        const latex = typeof node.attrs?.latex === 'string' ? node.attrs.latex : ''
        return `$${latex}$`
      }
      if (node.type !== 'text') return renderInline(node.content)

      let text = node.text ?? ''
      for (const mark of node.marks ?? []) {
        switch (mark.type) {
          case 'code':
            text = `\`${text}\``
            break
          case 'bold':
            text = `**${text}**`
            break
          case 'italic':
            text = `*${text}*`
            break
          case 'strike':
            text = `~~${text}~~`
            break
          case 'link': {
            const href = typeof mark.attrs?.href === 'string' ? mark.attrs.href : ''
            if (href) text = `[${text}](${href})`
            break
          }
          default:
            break
        }
      }
      return text
    })
    .join('')
}

function renderBlock(node: NodeLike, indent = ''): string {
  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map((child) => renderBlock(child)).filter(Boolean).join('\n\n')
    case 'paragraph':
      return `${indent}${renderInline(node.content)}`
    case 'heading': {
      const level = Math.min(6, Math.max(1, Number(node.attrs?.level ?? 2)))
      return `${'#'.repeat(level)} ${renderInline(node.content)}`
    }
    case 'blockquote':
      return (node.content ?? [])
        .map((child) => renderBlock(child))
        .join('\n')
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')
    case 'bulletList':
      return (node.content ?? [])
        .map((item) => {
          const inner = (item.content ?? []).map((c) => renderBlock(c, `${indent}  `)).join('\n')
          return `${indent}- ${inner.trimStart()}`
        })
        .join('\n')
    case 'orderedList':
      return (node.content ?? [])
        .map((item, idx) => {
          const inner = (item.content ?? []).map((c) => renderBlock(c, `${indent}   `)).join('\n')
          return `${indent}${idx + 1}. ${inner.trimStart()}`
        })
        .join('\n')
    case 'taskList':
      return (node.content ?? [])
        .map((item) => {
          const checked = item.attrs?.checked ? 'x' : ' '
          const inner = (item.content ?? []).map((c) => renderBlock(c)).join(' ')
          return `- [${checked}] ${inner.trim()}`
        })
        .join('\n')
    case 'codeBlock': {
      const lang = typeof node.attrs?.language === 'string' ? node.attrs.language : ''
      const code = (node.content ?? []).map((c) => c.text ?? '').join('')
      return `\`\`\`${lang}\n${code}\n\`\`\``
    }
    case 'blockMath': {
      const latex = typeof node.attrs?.latex === 'string' ? node.attrs.latex : ''
      return `$$\n${latex}\n$$`
    }
    case 'horizontalRule':
      return '---'
    case 'image': {
      const src = typeof node.attrs?.src === 'string' ? node.attrs.src : ''
      const alt = typeof node.attrs?.alt === 'string' ? node.attrs.alt : ''
      return `![${alt}](${src})`
    }
    case 'table': {
      const rows = (node.content ?? []).map((row) =>
        (row.content ?? []).map((cell) => renderInline(cell.content?.[0]?.content).replace(/\|/g, '\\|')),
      )
      if (!rows.length) return ''
      const header = `| ${rows[0].join(' | ')} |`
      const divider = `| ${rows[0].map(() => '---').join(' | ')} |`
      const body = rows.slice(1).map((r) => `| ${r.join(' | ')} |`)
      return [header, divider, ...body].join('\n')
    }
    case 'articleCallout': {
      const tone = String(node.attrs?.tone ?? 'note').toUpperCase()
      const title = String(node.attrs?.title ?? '').trim()
      const text = String(node.attrs?.text ?? '').trim()
      const head = `> [!${tone}]${title ? ` ${title}` : ''}`
      return text ? `${head}\n> ${text.replace(/\n/g, '\n> ')}` : head
    }
    case 'articleButton': {
      const label = String(node.attrs?.label ?? '').trim()
      const href = String(node.attrs?.href ?? '').trim()
      return label && href ? `[${label}](${href})` : label
    }
    case 'articleTabs': {
      const panels = Array.isArray(node.attrs?.panels) ? (node.attrs?.panels as Array<Record<string, unknown>>) : []
      return panels
        .map((p) => `#### ${String(p.title ?? '').trim()}\n\n${String(p.text ?? '').trim()}`)
        .filter((s) => s.trim())
        .join('\n\n')
    }
    case 'articleAccordion': {
      const items = Array.isArray(node.attrs?.items) ? (node.attrs?.items as Array<Record<string, unknown>>) : []
      return items
        .map((it) => `<details>\n<summary>${String(it.title ?? '').trim()}</summary>\n\n${String(it.text ?? '').trim()}\n</details>`)
        .join('\n\n')
    }
    case 'articleGallery':
    case 'articleSlider': {
      const images = Array.isArray(node.attrs?.images) ? (node.attrs?.images as Array<Record<string, unknown>>) : []
      return images
        .map((img) => `![${String(img.alt ?? '').trim()}](${String(img.src ?? '').trim()})`)
        .filter((s) => !s.endsWith('()'))
        .join('\n\n')
    }
    case 'articleCards': {
      const cards = Array.isArray(node.attrs?.cards) ? (node.attrs?.cards as Array<Record<string, unknown>>) : []
      return cards
        .map((c) => `- **${String(c.title ?? '').trim()}**：${String(c.text ?? '').trim()}`)
        .join('\n')
    }
    case 'articleTimeline': {
      const items = Array.isArray(node.attrs?.items) ? (node.attrs?.items as Array<Record<string, unknown>>) : []
      return items
        .map((it) => `- **${String(it.label ?? '').trim()} · ${String(it.title ?? '').trim()}**：${String(it.text ?? '').trim()}`)
        .join('\n')
    }
    case 'articleFlow': {
      const parts = [node.attrs?.start, node.attrs?.question, node.attrs?.yes, node.attrs?.no, node.attrs?.end]
        .map((v) => String(v ?? '').trim())
        .filter(Boolean)
      return parts.length ? `> 流程：${parts.join(' -> ')}` : ''
    }
    case 'articleDiagram': {
      const items = Array.isArray(node.attrs?.items) ? (node.attrs?.items as Array<Record<string, unknown>>) : []
      const labels = items.map((it) => String(it.label ?? '').trim()).filter(Boolean)
      return labels.length ? `> 关系：${labels.join(' — ')}` : ''
    }
    case 'articleEmbed': {
      const src = String(node.attrs?.src ?? '').trim()
      const title = String(node.attrs?.title ?? '嵌入视频').trim()
      return src ? `[${title}](${src})` : ''
    }
    case 'articleAudio': {
      const src = String(node.attrs?.src ?? '').trim()
      const title = String(node.attrs?.title ?? '音频').trim()
      return src ? `[${title}](${src})` : ''
    }
    case 'articleRichShowcase': {
      const title = String(node.attrs?.title ?? '').trim()
      const text = String(node.attrs?.text ?? '').trim()
      const image = String(node.attrs?.image ?? '').trim()
      const primaryHref = String(node.attrs?.primaryHref ?? '').trim()
      const primaryLabel = String(node.attrs?.primaryLabel ?? '').trim()
      return [
        image ? `![${title}](${image})` : '',
        title ? `### ${title}` : '',
        text,
        primaryHref && primaryLabel ? `[${primaryLabel}](${primaryHref})` : '',
      ]
        .filter(Boolean)
        .join('\n\n')
    }
    default:
      return ''
  }
}

export function exportPostToMarkdown(meta: {
  title: string
  slug: string
  description?: string
  tags?: string[]
  publishedAt?: string
  content: unknown
}): string {
  const frontmatter = [
    '---',
    `title: "${meta.title.replace(/"/g, '\\"')}"`,
    `slug: "${meta.slug}"`,
    meta.description ? `description: "${meta.description.replace(/"/g, '\\"')}"` : null,
    meta.tags?.length ? `tags: [${meta.tags.map((t) => `"${t}"`).join(', ')}]` : null,
    meta.publishedAt ? `date: "${meta.publishedAt}"` : null,
    '---',
  ]
    .filter(Boolean)
    .join('\n')

  const body =
    meta.content && typeof meta.content === 'object'
      ? renderBlock(meta.content as NodeLike)
      : typeof meta.content === 'string'
        ? meta.content
        : ''

  return `${frontmatter}\n\n${body}\n`
}
