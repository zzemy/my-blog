export type TocItem = {
  id: string
  text: string
  depth: number
}

export type TiptapNode = {
  type?: string
  text?: string
  attrs?: { level?: number }
  content?: TiptapNode[]
}

export function buildToc(content: TiptapNode | TiptapNode[] | null | undefined): TocItem[] {
  const toc: TocItem[] = []
  const idCount: Record<string, number> = {}

  const walk = (node: TiptapNode | TiptapNode[] | null | undefined) => {
    if (!node) return
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }

    if (node.type === 'heading' && node.attrs?.level) {
      const text = extractText(node)
      if (text) {
        let base = slugifyHeading(text)
        if (!base) base = 'section'
        let unique = base
        if (idCount[base] != null) {
          idCount[base] += 1
          unique = `${base}-${idCount[base]}`
        } else {
          idCount[base] = 0
        }
        toc.push({ id: unique, text, depth: node.attrs.level })
      }
    }

    if (node.content) {
      walk(node.content)
    }
  }

  walk(content)
  return toc
}

function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function extractText(node: TiptapNode | null | undefined): string {
  if (!node) return ''
  if (node.text) return node.text
  if (node.content) {
    return node.content.map(extractText).join('')
  }
  return ''
}
