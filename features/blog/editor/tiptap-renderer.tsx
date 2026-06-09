'use client'

import { useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import { EditorContent, useEditor, NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import type { Content, NodeViewProps } from '@tiptap/react'
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
import { articleRichBlockExtensions } from './rich-block-extensions'
import { LinkPreview } from '@/shared/components/common/link-preview'

const lowlight = createLowlight(common)

// Dual Theme Syntax Highlighting (Light & Dark)
const syntaxThemeCss = `
/* Light Theme */
.hljs-comment,
.hljs-quote {
  color: #4f7d6b;
  font-style: italic;
}
.hljs-keyword,
.hljs-selector-tag,
.hljs-literal,
.hljs-section,
.hljs-link {
  color: #1d5fd1;
}
.hljs-name {
  color: #175e8f;
}
.hljs-string,
.hljs-meta-string {
  color: #2b7a78;
}
.hljs-attr {
  color: #0f6b9f;
}
.hljs-variable,
.hljs-template-variable,
.hljs-template-tag,
.hljs-property {
  color: #355c9d;
}
.hljs-title,
.hljs-title.function_,
.hljs-doctag {
  color: #2f6f8f;
}
.hljs-type,
.hljs-built_in,
.hljs-class .hljs-title {
  color: #267f99;
}
.hljs-number,
.hljs-symbol,
.hljs-bullet {
  color: #0f766e;
}
.hljs-regexp {
  color: #3c6f9f;
}
.hljs-emphasis {
  font-style: italic;
}
.hljs-strong {
  font-weight: bold;
}
.hljs-meta {
  color: #1d5fd1;
}

/* Dark Theme Overrides */
.dark .hljs-comment,
.dark .hljs-quote {
  color: #7aa397;
}
.dark .hljs-keyword,
.dark .hljs-selector-tag,
.dark .hljs-literal,
.dark .hljs-section,
.dark .hljs-link {
  color: #8ab4f8;
}
.dark .hljs-name {
  color: #7dcfff;
}
.dark .hljs-string,
.dark .hljs-meta-string {
  color: #8bd5ca;
}
.dark .hljs-attr,
.dark .hljs-variable,
.dark .hljs-template-variable,
.dark .hljs-template-tag,
.dark .hljs-property {
  color: #89ddff;
}
.dark .hljs-title,
.dark .hljs-title.function_,
.dark .hljs-doctag {
  color: #b4cafe;
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
  color: #7aa2f7;
}
.dark .hljs-meta {
  color: #8ab4f8;
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

const CodeBlock = ({ node }: NodeViewProps) => {
  const [copied, setCopied] = useState(false)
  const textContent = node.textContent
  const language = formatCodeLanguage(node.attrs.language)
  const fileName = getCodeFileName(node.attrs.language)

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
    <NodeViewWrapper className="code-window not-prose group relative">
      {/* Header / Title Bar */}
      <div className="code-window-header">
        <div className="code-window-titlebar">
          <span className="code-window-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="component-code-label">{language}</span>
          <span className="code-window-file">{fileName}</span>
        </div>
        <div className="code-window-tools">
          <button type="button" onClick={onCopy} className="code-window-copy" aria-label="复制代码">
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="code-window-body">
        {/* Line Numbers */}
        <div className="code-window-gutter" aria-hidden="true">
          {lines.map((_, i) => (
            <span key={i} className="block">{i + 1}</span>
          ))}
        </div>

        {/* Code Content */}
        <pre className="code-window-pre">
          <NodeViewContent className="!bg-transparent !p-0 !whitespace-pre !font-inherit !text-inherit" />
        </pre>
      </div>
    </NodeViewWrapper>
  )
}

function formatCodeLanguage(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return 'Code'
  const language = value.trim().toLowerCase()

  const labels: Record<string, string> = {
    c: 'C',
    cpp: 'C++',
    css: 'CSS',
    html: 'HTML',
    js: 'JavaScript',
    javascript: 'JavaScript',
    json: 'JSON',
    jsx: 'JSX',
    md: 'Markdown',
    markdown: 'Markdown',
    py: 'Python',
    python: 'Python',
    sh: 'Shell',
    shell: 'Shell',
    ts: 'TypeScript',
    tsx: 'TSX',
    typescript: 'TypeScript',
  }

  return labels[language] || value.trim()
}

function getCodeFileName(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return 'example.txt'
  const language = value.trim().toLowerCase()

  const extensions: Record<string, string> = {
    c: 'c',
    cpp: 'cpp',
    css: 'css',
    html: 'html',
    js: 'js',
    javascript: 'js',
    json: 'json',
    jsx: 'jsx',
    md: 'md',
    markdown: 'md',
    py: 'py',
    python: 'py',
    sh: 'sh',
    shell: 'sh',
    ts: 'ts',
    tsx: 'tsx',
    typescript: 'ts',
  }

  return `example.${extensions[language] || language}`
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
          return ReactNodeViewRenderer(CodeBlock)
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
