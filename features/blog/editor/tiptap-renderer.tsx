'use client'

import 'katex/dist/katex.min.css'
import { useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react'
import { toast } from 'sonner'
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
  ssrHtml?: string
  className?: string
  toc?: TocItem[]
}

export function TipTapRenderer({
  content,
  ssrHtml,
  className = '',
  toc = [],
}: TipTapRendererProps) {
  const [lightboxState, setLightboxState] = useState<{
    images: Array<{ src: string; alt: string }>
    index: number
  } | null>(null)
  const [zoomScale, setZoomScale] = useState(1)
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

  // 将标题批量设置 id、scroll-margin-top 并注入可复制直达锚点按钮（与 buildToc 一致，跳过空标题）
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
        heading.style.scrollMarginTop = '88px'

        if (!heading.querySelector('.paragraph-anchor')) {
          const anchor = document.createElement('a')
          anchor.href = `#${item.id}`
          anchor.className = 'paragraph-anchor'
          anchor.textContent = '#'
          anchor.setAttribute('aria-label', `复制「${item.text}」段落链接`)
          anchor.title = '复制段落直达链接'
          anchor.addEventListener('click', (event) => {
            event.preventDefault()
            try {
              const targetUrl = new URL(window.location.href)
              targetUrl.hash = item.id
              window.history.replaceState(null, '', targetUrl.toString())
              void navigator.clipboard.writeText(targetUrl.toString())
              toast.success('段落直达链接已复制')
            } catch {
              // ignore clipboard failures
            }
          })
          heading.appendChild(anchor)
        }
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

  // 为表格包裹 .table-wrapper 确保中屏/窄屏横向流畅滚动
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom
    const tables = dom.querySelectorAll('table')
    tables.forEach((table) => {
      if (table.parentElement?.classList.contains('table-wrapper')) return
      const wrapper = document.createElement('div')
      wrapper.className = 'table-wrapper'
      table.parentNode?.insertBefore(wrapper, table)
      wrapper.appendChild(table)
    })
  }, [editor, content])

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
      if (link.classList.contains('paragraph-anchor')) return

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

  // 图片增强：点击多图灯箱 + 底部图注（figcaption）+ 加载失败优雅降级
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom

    const isZoomableImage = (img: HTMLElement) =>
      img.tagName === 'IMG' && !img.closest('button, a, [data-no-zoom]')

    const collectZoomableImages = () => {
      const list: Array<{ src: string; alt: string; el: HTMLImageElement }> = []
      dom.querySelectorAll('img').forEach((node) => {
        const img = node as HTMLImageElement
        if (isZoomableImage(img) && img.src && !img.dataset.loadFailed) {
          list.push({ src: img.src, alt: img.alt || '', el: img })
        }
      })
      return list
    }

    const clickHandler = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (target && isZoomableImage(target)) {
        const img = target as HTMLImageElement
        if (img.src && !img.dataset.loadFailed) {
          const all = collectZoomableImages()
          const idx = Math.max(0, all.findIndex((item) => item.el === img))
          setZoomScale(1)
          setLightboxState({
            images: all.map(({ src, alt }) => ({ src, alt })),
            index: idx,
          })
        }
      }
    }

    const enhanceImages = () => {
      dom.querySelectorAll('img').forEach((node) => {
        const img = node as HTMLImageElement
        img.loading = 'lazy'
        img.decoding = 'async'
        img.style.cursor = isZoomableImage(img) ? 'zoom-in' : ''

        // 正文独立图片自动渲染底部图注
        if (
          img.alt?.trim() &&
          !img.closest('[data-rich-block], figure') &&
          img.parentElement &&
          !img.dataset.captionMounted
        ) {
          img.dataset.captionMounted = '1'
          const figure = document.createElement('figure')
          figure.className = 'my-6 flex flex-col items-center gap-2'
          img.parentNode?.insertBefore(figure, img)
          figure.appendChild(img)
          const caption = document.createElement('figcaption')
          caption.className = 'text-center text-xs text-muted-foreground'
          caption.textContent = img.alt.trim()
          figure.appendChild(caption)
        }

        if (!img.dataset.errorBound) {
          img.dataset.errorBound = '1'
          img.addEventListener('error', () => {
            if (img.dataset.loadFailed) return
            img.dataset.loadFailed = '1'
            img.style.cursor = 'default'
            img.alt = img.alt || '图片加载失败'
            img.classList.add('opacity-50', 'min-h-[120px]', 'bg-muted/40', 'border', 'border-dashed', 'border-border')
          })
        }
      })
    }

    dom.addEventListener('click', clickHandler)
    enhanceImages()
    editor.on('update', enhanceImages)

    return () => {
      dom.removeEventListener('click', clickHandler)
      editor.off('update', enhanceImages)
    }
  }, [editor, content])

  // 键盘 ESC / 左右切换 / 滚轮缩放 + 锁定背景滚动
  useEffect(() => {
    if (!lightboxState) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxState(null)
      } else if (e.key === 'ArrowLeft') {
        setZoomScale(1)
        setLightboxState((prev) =>
          prev && prev.images.length > 1
            ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }
            : prev,
        )
      } else if (e.key === 'ArrowRight') {
        setZoomScale(1)
        setLightboxState((prev) =>
          prev && prev.images.length > 1
            ? { ...prev, index: (prev.index + 1) % prev.images.length }
            : prev,
        )
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [lightboxState])

  const activeLightboxImage = lightboxState ? lightboxState.images[lightboxState.index] : null

  return (
    <>
      {editor ? (
        <EditorContent editor={editor} />
      ) : ssrHtml ? (
        <div
          className={`article-content prose dark:prose-invert max-w-none article-font ${className}`}
          dangerouslySetInnerHTML={{ __html: ssrHtml }}
        />
      ) : null}
      {lightboxState && activeLightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="图片放大预览"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-black/88 p-4 backdrop-blur-sm"
          onClick={() => setLightboxState(null)}
          onWheel={(e) => {
            e.preventDefault()
            setZoomScale((prev) =>
              Math.min(3, Math.max(0.75, Number((prev + (e.deltaY < 0 ? 0.18 : -0.18)).toFixed(2)))),
            )
          }}
        >
          <div
            className="absolute right-4 top-4 flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxState.images.length > 1 && (
              <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1.5 font-mono text-xs text-white/85">
                {lightboxState.index + 1} / {lightboxState.images.length}
              </span>
            )}
            <button
              type="button"
              aria-label="缩小"
              onClick={() => setZoomScale((prev) => Math.max(0.75, Number((prev - 0.25).toFixed(2))))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/85 transition-colors hover:bg-black/80 hover:text-white"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="放大"
              onClick={() => setZoomScale((prev) => Math.min(3, Number((prev + 0.25).toFixed(2))))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/85 transition-colors hover:bg-black/80 hover:text-white"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="关闭预览"
              onClick={() => setLightboxState(null)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/85 transition-colors hover:bg-black/80 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {lightboxState.images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="上一张"
                onClick={(e) => {
                  e.stopPropagation()
                  setZoomScale(1)
                  setLightboxState((prev) =>
                    prev
                      ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }
                      : prev,
                  )
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/85 transition-colors hover:bg-black/80 hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="下一张"
                onClick={(e) => {
                  e.stopPropagation()
                  setZoomScale(1)
                  setLightboxState((prev) =>
                    prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : prev,
                  )
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/85 transition-colors hover:bg-black/80 hover:text-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeLightboxImage.src}
            alt={activeLightboxImage.alt || '图片预览'}
            onClick={(e) => e.stopPropagation()}
            style={{ transform: `scale(${zoomScale})` }}
            className="max-h-[82vh] max-w-[90vw] rounded-lg border border-white/10 shadow-2xl transition-transform duration-150"
          />
          {activeLightboxImage.alt && (
            <p className="max-w-2xl text-center text-xs text-white/80">{activeLightboxImage.alt}</p>
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
