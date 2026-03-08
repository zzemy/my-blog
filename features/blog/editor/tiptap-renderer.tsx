'use client'

import { useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { EditorContent, useEditor, NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
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
import { Check, Copy } from 'lucide-react'
import { LinkPreview } from '@/shared/components/common/link-preview'

const lowlight = createLowlight(common)

// Dual Theme Syntax Highlighting (Light & Dark)
const syntaxThemeCss = `
/* Light Theme (VS Code Light+) */
.hljs-comment,
.hljs-quote {
  color: #008000;
  font-style: italic;
}
.hljs-keyword,
.hljs-selector-tag,
.hljs-literal,
.hljs-section,
.hljs-link {
  color: #0000ff;
}
.hljs-name {
  color: #800000;
}
.hljs-string,
.hljs-meta-string {
  color: #a31515;
}
.hljs-attr {
  color: #ff0000;
}
.hljs-variable,
.hljs-template-variable,
.hljs-template-tag,
.hljs-property {
  color: #001080;
}
.hljs-title,
.hljs-title.function_,
.hljs-doctag {
  color: #795e26;
}
.hljs-type,
.hljs-built_in,
.hljs-class .hljs-title {
  color: #267f99;
}
.hljs-number,
.hljs-symbol,
.hljs-bullet {
  color: #098658;
}
.hljs-regexp {
  color: #811f3f;
}
.hljs-emphasis {
  font-style: italic;
}
.hljs-strong {
  font-weight: bold;
}
.hljs-meta {
  color: #0000ff;
}

/* Dark Theme Overrides (VS Code Dark+) */
.dark .hljs-comment,
.dark .hljs-quote {
  color: #6a9955;
}
.dark .hljs-keyword,
.dark .hljs-selector-tag,
.dark .hljs-literal,
.dark .hljs-section,
.dark .hljs-link {
  color: #569cd6;
}
.dark .hljs-name {
  color: #569cd6;
}
.dark .hljs-string,
.dark .hljs-meta-string {
  color: #ce9178;
}
.dark .hljs-attr,
.dark .hljs-variable,
.dark .hljs-template-variable,
.dark .hljs-template-tag,
.dark .hljs-property {
  color: #9cdcfe;
}
.dark .hljs-title,
.dark .hljs-title.function_,
.dark .hljs-doctag {
  color: #dcdcaa;
}
.dark .hljs-type,
.dark .hljs-built_in,
.dark .hljs-class .hljs-title {
  color: #4ec9b0;
}
.dark .hljs-number,
.dark .hljs-symbol,
.dark .hljs-bullet {
  color: #b5cea8;
}
.dark .hljs-regexp {
  color: #d16969;
}
.dark .hljs-meta {
  color: #569cd6;
}

/* Scrollbar Styling - Adaptive */
.code-window ::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}
.code-window ::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.2);
  border-radius: 9999px;
}
.dark .code-window ::-webkit-scrollbar-thumb {
  background-color: rgba(255,255,255,0.14);
}
.code-window ::-webkit-scrollbar-track {
  background-color: transparent;
}
`

const CodeBlock = ({ node: { textContent } }: { node: { textContent: string } }) => {
  const [copied, setCopied] = useState(false)

  const onCopy = () => {
    navigator.clipboard.writeText(textContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Calculate line numbers
  const lines = textContent.split('\n')
  // Reduce empty line at the end if it exists
  if (lines.length > 1 && lines[lines.length - 1].trim() === '') {
    lines.pop()
  }

  return (
    <NodeViewWrapper 
      className="code-window my-4 relative group rounded-xl overflow-hidden shadow-sm dark:shadow-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#1e1e1e]"
      style={{
        fontSize: '14px',
        lineHeight: '1.5',
        fontFamily: '"Menlo", "Monaco", "Consolas", "Courier New", monospace'
      }}
    >
      {/* Header / Title Bar */}
      <div 
        className="flex items-center justify-between px-4 py-1.5 bg-white dark:bg-[#1e1e1e]"
      >
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
        <button
          onClick={onCopy}
          className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-white opacity-0 group-hover:opacity-100"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      <div className="relative flex overflow-x-auto pt-1 pb-0">
        {/* Line Numbers */}
        <div 
          className="flex-shrink-0 flex flex-col items-end pr-4 pl-2 select-none text-[#237893] dark:text-[#858585] min-w-[3.5rem]"
          aria-hidden="true"
          style={{ fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}
        >
          {lines.map((_, i) => (
            <span key={i} className="block">{i + 1}</span>
          ))}
        </div>

        {/* Code Content */}
        <pre 
          className="flex-1 pl-6 pr-4 pb-0 !m-0 !bg-transparent overflow-visible scrollbar-hide !text-[#24292e] dark:!text-[#d4d4d4]"
          style={{ fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}
        >
          <NodeViewContent className="!bg-transparent !p-0 !whitespace-pre !font-inherit !text-inherit" />
        </pre>
      </div>
    </NodeViewWrapper>
  )
}

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
          class: 'text-blue-500 hover:text-blue-600 underline cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',          referrerPolicy: 'no-referrer',        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }).extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlock)
        },
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 dark:border-gray-700',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 dark:border-gray-700 px-4 py-2',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class:
            'border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800 font-bold',
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
    ],
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: `prose prose-xl dark:prose-invert max-w-none leading-relaxed article-font prose-headings:font-bold prose-headings:tracking-tight prose-p:my-6 prose-li:my-1.5 prose-li:leading-relaxed prose-code:text-sm prose-code:px-1.5 prose-code:py-0.5 ${className}`,
      },
    },
  })

  // 将标题批量设置 id 和 scroll-margin-top
  const assignHeadingIds = useCallback(() => {
    if (!editor || !toc.length) return
    const headings = editor.view.dom.querySelectorAll('h1, h2, h3, h4, h5, h6')
    toc.slice(0, headings.length).forEach((item, idx) => {
      const el = headings[idx] as HTMLElement
      if (el) {
        el.setAttribute('id', item.id)
        el.style.scrollMarginTop = '96px'
      }
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
          a.className = 'text-blue-500 hover:text-blue-600 underline cursor-pointer'
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
      roots.forEach((root) => root.unmount())
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
      <style>{syntaxThemeCss}</style>
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
