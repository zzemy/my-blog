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
