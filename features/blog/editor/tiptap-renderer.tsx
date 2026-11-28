'use client'

import { useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { X } from 'lucide-react'
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
import { Highlight } from '@tiptap/extension-highlight'
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
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null)
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false,
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
          loading: 'lazy',
          decoding: 'async',
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
      Highlight,
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

  // 将标题批量设置 id 和 scroll-margin-top（与 buildToc 一致，跳过空标题）
  const assignHeadingIds = useCallback(() => {
    if (!editor || !toc.length) return

    let index = 0
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name !== 'heading') return
      if (!node.textContent.trim()) return

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

  // 将纯文本中的 URL 自动转成可点击链接（使用无状态检测正则，避免 /g lastIndex 污染）
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom
    const urlCheckRegex = /https?:\/\/[^\s<>"]+/
    const urlSplitRegex = /(https?:\/\/[^\s<>"]+)/g

    const walker = document.createTreeWalker(dom, NodeFilter.SHOW_TEXT)
    const targets: Text[] = []

    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      if (!node.nodeValue) continue
      if (!urlCheckRegex.test(node.nodeValue)) continue
      const parent = node.parentElement
      if (!parent) continue
      if (parent.closest('a, code, pre, [data-rich-block]')) continue
      targets.push(node)
    }

    targets.forEach((node) => {
      const text = node.nodeValue || ''
      const parts = text.split(urlSplitRegex)
      const frag = document.createDocumentFragment()

      parts.forEach((part, idx) => {
        if (!part) return
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

  // 仅对正文中的外部 http(s) 链接注入 LinkPreview 悬停卡片（跳过富文本块按钮与 mailto:）
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom
    const roots: { unmount: () => void }[] = []

    const links = dom.querySelectorAll('a')
    links.forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return
      if (link.dataset.processed) return
      if (link.closest('[data-rich-block]')) return

      const href = link.getAttribute('href')?.trim()
      if (!href || !/^https?:\/\//i.test(href)) return

      link.dataset.processed = 'true'

      const container = document.createElement('span')
      link.parentNode?.insertBefore(container, link)

      const linkContent = link.innerHTML
      const classes = link.className
      link.remove()

      const root = createRoot(container)
      roots.push(root)
      root.render(
        <LinkPreview url={href} className={classes}>
          <span dangerouslySetInnerHTML={{ __html: linkContent }} />
        </LinkPreview>
      )
    })

    return () => {
      window.setTimeout(() => {
        roots.forEach((root) => root.unmount())
      }, 0)
    }
  }, [editor, content])

  // 图片点击放大（排除按钮内缩略图如轮播指示图、链接内图片和显式禁用放大的图片）
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom

    const isZoomableImage = (img: HTMLElement) =>
      img.tagName === 'IMG' && !img.closest('button, a, [data-no-zoom]')

    const clickHandler = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (target && isZoomableImage(target)) {
        const img = target as HTMLImageElement
        if (img.src) {
          setPreviewImage({ src: img.src, alt: img.alt || '' })
        }
      }
    }

    const applyCursor = () => {
      dom.querySelectorAll('img').forEach((node) => {
        const el = node as HTMLElement
        el.style.cursor = isZoomableImage(el) ? 'zoom-in' : ''
      })
    }

    dom.addEventListener('click', clickHandler)
    applyCursor()
    editor.on('update', applyCursor)

    return () => {
      dom.removeEventListener('click', clickHandler)
      editor.off('update', applyCursor)
    }
  }, [editor, content])

  // 键盘 ESC 关闭预览并锁定背景滚动
  useEffect(() => {
    if (!previewImage) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImage(null)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [previewImage])

  return (
    <>
      <EditorContent editor={editor} />
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="图片放大预览"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            aria-label="关闭预览"
            onClick={() => setPreviewImage(null)}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/85 transition-colors hover:bg-black/80 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage.src}
            alt={previewImage.alt || '图片预览'}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[92vw] rounded-lg border border-white/10 shadow-2xl"
          />
          {previewImage.alt && (
            <p className="max-w-2xl text-center text-xs text-white/75">{previewImage.alt}</p>
          )}
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
