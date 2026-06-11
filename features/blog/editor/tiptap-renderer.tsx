'use client'

import { useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { EditorContent, useEditor, ReactNodeViewRenderer } from '@tiptap/react'
import type { Content } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { Mathematics } from '@tiptap/extension-mathematics'
import { common, createLowlight } from 'lowlight'
import { articleRichBlockExtensions } from './rich-block-extensions'
import { CodeBlockView } from './code-block-view'
import { LinkPreview } from '@/shared/components/common/link-preview'

const lowlight = createLowlight(common)

interface TocItem {
  id: string
  text: string
  depth: number
}

interface TipTapRendererProps {
  content: Content
  className?: string
  toc?: TocItem[]
}

export function TipTapRenderer({ content, className = '', toc = [] }: TipTapRendererProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'article-link',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'article-image',
          referrerPolicy: 'no-referrer',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }).extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockView)
        },
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: {
          class: 'article-table',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: '',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: '',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: '',
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'list-none pl-0 my-4',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'flex items-start gap-2',
        },
      }),
      Mathematics,
      Color,
      TextStyle,
      ...articleRichBlockExtensions,
    ],
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: `article-content prose dark:prose-invert max-w-none article-font ${className}`,
      },
    },
  })

  // 将标题批量设置 id 和 scroll-margin-top
  const assignHeadingIds = useCallback(() => {
    if (!editor || !toc.length) return

    let index = 0
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name !== 'heading') return

      const item = toc[index]
      if (!item) return

      const heading = getHeadingElement(editor.view.nodeDOM(pos))
      if (heading) {
        heading.setAttribute('id', item.id)
        heading.style.scrollMarginTop = '96px'
      }

      index += 1
    })
  }, [editor, toc])

  // 给标题添加 id 和 scroll-margin-top，支持目录定位并避免被顶部遮挡
  useEffect(() => {
    assignHeadingIds()
    if (!editor) return
    const handler = () => assignHeadingIds()
    editor.on('update', handler)
    editor.on('create', handler)
    return () => {
      editor.off('update', handler)
      editor.off('create', handler)
    }
  }, [editor, assignHeadingIds])

  // 将纯文本中的 URL 自动转成可点击链接（避免内容里未显式插入链接时无法点击）
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom
    const urlRegex = /(https?:\/\/[^\s<>"]+)/g

    const walker = document.createTreeWalker(dom, NodeFilter.SHOW_TEXT)
    const targets: Text[] = []

    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      if (!node.nodeValue) continue
      if (!urlRegex.test(node.nodeValue)) continue
      const parent = node.parentElement
      if (!parent) continue
      // 跳过已在链接或代码块内的文本
      if (parent.closest('a, code, pre')) continue
      targets.push(node)
    }

    targets.forEach((node) => {
      const text = node.nodeValue || ''
      const parts = text.split(urlRegex)
      const frag = document.createDocumentFragment()

      parts.forEach((part, idx) => {
        if (!part) return
        // 奇数索引是被捕获的 URL 片段
        if (idx % 2 === 1) {
          const a = document.createElement('a')
          a.href = part
          a.textContent = part
          a.rel = 'noopener noreferrer'
          a.target = '_blank'
          a.className = 'article-link'
          frag.appendChild(a)
        } else {
          frag.appendChild(document.createTextNode(part))
        }
      })

      node.replaceWith(frag)
    })
  }, [editor, content])

  // Replace external anchors with LinkPreview components for hover cards
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom
    const roots: { unmount: () => void }[] = []

    const links = dom.querySelectorAll('a')
    links.forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return
      if (link.dataset.processed) return

      const href = link.getAttribute('href')
      if (!href || href.startsWith('/') || href.startsWith('#')) return

      link.dataset.processed = 'true'

      const container = document.createElement('span')
      link.parentNode?.insertBefore(container, link)

      const content = link.innerHTML
      const classes = link.className
      link.remove()

      const root = createRoot(container)
      roots.push(root)
      root.render(
        <LinkPreview url={href} className={classes}>
          <span dangerouslySetInnerHTML={{ __html: content }} />
        </LinkPreview>
      )
    })

    return () => {
      window.setTimeout(() => {
        roots.forEach((root) => root.unmount())
      }, 0)
    }
  }, [editor, content])

  // 图片点击放大（事件委托，避免重复绑定与动态内容遗漏）
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom
    const clickHandler = (e: Event) => {
      const target = e.target as HTMLElement
      if (target && target.tagName === 'IMG') {
        const img = target as HTMLImageElement
        if (img.src) setPreviewSrc(img.src)
      }
    }
    dom.addEventListener('click', clickHandler)
    // 设置鼠标样式
    const imgs = dom.querySelectorAll('img')
    imgs.forEach((node) => ((node as HTMLElement).style.cursor = 'zoom-in'))
    return () => dom.removeEventListener('click', clickHandler)
  }, [editor])

  // 键盘 ESC 关闭预览
  useEffect(() => {
    if (!previewSrc) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewSrc(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewSrc])

  return (
    <>
      <EditorContent editor={editor} />
      {previewSrc && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewSrc(null)}
        >
          {/* Intentional raw img for runtime external URL preview in modal overlay */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewSrc}
            alt="preview"
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl border border-white/10"
          />
        </div>
      )}
    </>
  )
}

function getHeadingElement(dom: globalThis.Node | null): HTMLElement | null {
  if (!(dom instanceof HTMLElement)) return null
  if (dom.matches('h1, h2, h3, h4, h5, h6')) return dom
  return dom.querySelector('h1, h2, h3, h4, h5, h6')
}
