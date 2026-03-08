'use client'

import { EditorContent, useEditor, Editor } from '@tiptap/react'
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
import { Placeholder } from '@tiptap/extension-placeholder'
import { CharacterCount } from '@tiptap/extension-character-count'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { Mathematics } from '@tiptap/extension-mathematics'
import { common, createLowlight } from 'lowlight'
import { useState, useRef } from 'react'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { MenuBar } from './menu-bar'
import { uploadImage } from '@/lib/upload-image'

const lowlight = createLowlight(common)

// Dual Theme Syntax Highlighting (Light & Dark)
const syntaxThemeCss = `
/* Light Theme (VS Code Light+) */
.hljs-comment,
.hljs-quote { color: #008000; font-style: italic; }
.hljs-keyword,
.hljs-selector-tag,
.hljs-literal,
.hljs-section,
.hljs-link { color: #0000ff; }
.hljs-name { color: #800000; }
.hljs-string,
.hljs-meta-string { color: #a31515; }
.hljs-attr { color: #ff0000; }
.hljs-variable,
.hljs-template-variable,
.hljs-template-tag,
.hljs-property { color: #001080; }
.hljs-title,
.hljs-title.function_,
.hljs-doctag { color: #795e26; }
.hljs-type,
.hljs-built_in,
.hljs-class .hljs-title { color: #267f99; }
.hljs-number,
.hljs-symbol,
.hljs-bullet { color: #098658; }
.hljs-regexp { color: #811f3f; }
.hljs-emphasis { font-style: italic; }
.hljs-strong { font-weight: bold; }
.hljs-meta { color: #0000ff; }

/* Dark Theme Overrides (VS Code Dark+) */
.dark .hljs-comment,
.dark .hljs-quote { color: #6a9955; }
.dark .hljs-keyword,
.dark .hljs-selector-tag,
.dark .hljs-literal,
.dark .hljs-section,
.dark .hljs-link { color: #569cd6; }
.dark .hljs-name { color: #569cd6; }
.dark .hljs-string,
.dark .hljs-meta-string { color: #ce9178; }
.dark .hljs-attr,
.dark .hljs-variable,
.dark .hljs-template-variable,
.dark .hljs-template-tag,
.dark .hljs-property { color: #9cdcfe; }
.dark .hljs-title,
.dark .hljs-title.function_,
.dark .hljs-doctag { color: #dcdcaa; }
.dark .hljs-type,
.dark .hljs-built_in,
.dark .hljs-class .hljs-title { color: #4ec9b0; }
.dark .hljs-number,
.dark .hljs-symbol,
.dark .hljs-bullet { color: #b5cea8; }
.dark .hljs-regexp { color: #d16969; }
.dark .hljs-meta { color: #569cd6; }
`

interface TipTapEditorProps {
  content?: Content
  onChange?: (content: Content) => void
  placeholder?: string
  editable?: boolean
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = '开始编写内容...',
  editable = true,
}: TipTapEditorProps) {
  const [isUploading, setIsUploading] = useState(false)
  const editorRef = useRef<Editor | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    onCreate({ editor }) {
      editorRef.current = editor
    },
    extensions: [
      StarterKit.configure({
        codeBlock: false, // 使用 CodeBlockLowlight 替代
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:text-blue-600 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
          referrerPolicy: 'no-referrer',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'rounded-lg bg-zinc-100 dark:bg-zinc-950 p-4 overflow-x-auto text-sm',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border border-zinc-200 dark:border-zinc-800',
        },
      }),
      TableCell.extend({
        content: 'block+',
      }).configure({
        HTMLAttributes: {
          class: 'border border-zinc-200 dark:border-zinc-800 px-4 py-2',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-zinc-200 dark:border-zinc-800 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 font-bold',
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'list-none pl-0',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'flex items-start gap-2',
        },
      }),
      Mathematics,
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
      Color,
      TextStyle,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px] leading-relaxed article-font ProseMirror',
      },
      handlePaste: (view, event) => {
        // 1. Image Paste Support
        const item = event.clipboardData?.items[0]
        if (item?.type.indexOf('image') === 0) {
          event.preventDefault()
          const file = item.getAsFile()
          if (file) {
            setIsUploading(true)
            uploadImage(file).then((url) => {
              if (url) {
                const { schema } = view.state
                const node = schema.nodes.image.create({ src: url })
                const transaction = view.state.tr.replaceSelectionWith(node)
                view.dispatch(transaction)
              } else {
                alert('图片上传失败，请检查 Supabase Storage 设置')
              }
            }).finally(() => {
              setIsUploading(false)
            })
          }
          return true
        }

        // 2. Existing Markdown Support
        try {
          const text = event.clipboardData?.getData('text/markdown') || event.clipboardData?.getData('text/plain') || ''
          
          // Include all common markdown triggers: math, tables, headers, lists, quotes, code, formatting, html, footnotes
          const looksMarkdown = /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|>|```|~~|[*_](?!\s)|`|[-*_]{3,}|!\[|\[|\||\$\$?|\\|<\/?[a-z]|\[\^)/i.test(text)
          
          if (text && looksMarkdown) {
             event.preventDefault()
             ;(async () => {
               // Strategy 1: Try full parse with Math
               try {
                 const file = await remark()
                   .use(remarkMath)
                   .use(remarkGfm)
                   .use(remarkRehype, {
                     handlers: {
                       math: (_state: unknown, node: { value?: string }) => {
                         // Build HAST node directly (mdast-util-to-hast 13+ passes state as first arg)
                         return {
                           type: 'element',
                           tagName: 'div',
                           properties: { 
                             'data-type': 'block-math', 
                             'data-latex': node.value || '' 
                           },
                           children: [{ type: 'text', value: node.value || '' }]
                         }
                       },
                       inlineMath: (_state: unknown, node: { value?: string }) => {
                         return {
                           type: 'element',
                           tagName: 'span',
                           properties: { 
                             'data-type': 'inline-math', 
                             'data-latex': node.value || '' 
                           },
                           children: [{ type: 'text', value: node.value || '' }]
                         }
                       }
                     }
                    })
                   .use(rehypeStringify)
                   .process(text)
                 
                 const html = String(file)
                 editorRef.current?.chain().focus().insertContent(html).run()
                 return
               } catch (error) {
                 console.warn('Math parsing failed, retrying without math...', error)
               }

               // Strategy 2: Try basic GFM parse (restore previous functionality)
               try {
                 const file = await remark()
                   .use(remarkGfm)
                   .use(remarkRehype)
                   .use(rehypeStringify)
                   .process(text)
                 
                 const html = String(file)
                 editorRef.current?.chain().focus().insertContent(html).run()
                 return
               } catch (error) {
                 console.error('Markdown processing completely failed', error)
               }

               // Strategy 3: Fallback to plain text
               editorRef.current?.chain().focus().insertContent(text).run()
             })()
             return true
          }
        } catch {}
        
        return false
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0]
          
          if (file.type.indexOf('image') === 0) {
            event.preventDefault()
            
            setIsUploading(true)
            uploadImage(file).then((url) => {
              if (url) {
                const { schema } = view.state
                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
                if (coordinates) {
                   const node = schema.nodes.image.create({ src: url })
                   const transaction = view.state.tr.insert(coordinates.pos, node)
                   view.dispatch(transaction)
                }
              } else {
                alert('图片上传失败，请检查 Supabase Storage 设置')
              }
            }).finally(() => {
              setIsUploading(false)
            })
            return true
          }
        }
        return false
      },
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-lg overflow-hidden relative admin-editor">
      {isUploading && (
        <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <div className="animate-pulse text-primary font-medium">图片上传中...</div>
        </div>
      )}
      {editable && <MenuBar editor={editor} />}
      <style>{syntaxThemeCss}</style>
      <EditorContent editor={editor} />
      {editable && editor && (
        <div className="border-t px-4 py-2 text-xs text-gray-500 flex justify-between">
          <span>{editor.storage.characterCount.characters()} 字符</span>
          <span>{editor.storage.characterCount.words()} 词</span>
        </div>
      )}
      <style>{`
        /* Dark theme */
        .dark .admin-editor {
          background: transparent;
          border: none;
          box-shadow: none;
        }
        .dark .admin-editor .ProseMirror {
          background: transparent;
          padding: 20px 24px 28px;
          min-height: 520px;
          line-height: 1.8;
          color: #e5e7eb;
        }
        .dark .admin-editor .ProseMirror h1,
        .dark .admin-editor .ProseMirror h2,
        .dark .admin-editor .ProseMirror h3,
        .dark .admin-editor .ProseMirror h4,
        .dark .admin-editor .ProseMirror h5,
        .dark .admin-editor .ProseMirror h6 {
          color: #f8fafc;
          letter-spacing: -0.01em;
        }
        .dark .admin-editor .ProseMirror p {
          color: #d1d5db;
        }
        /* Base code block style (both themes) */
        .admin-editor .ProseMirror pre {
          background: #0f172a;
          color: #e5e7eb;
          border: 1px solid #1f2937;
          border-radius: 10px;
          padding: 14px 16px;
          font-family: "JetBrains Mono", "Menlo", "Consolas", monospace;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
          position: relative;
          overflow: auto;
        }
        .dark .admin-editor .ProseMirror pre { color: #e5e7eb; }
        .dark .admin-editor .ProseMirror pre::before {
          content: 'code';
          position: absolute;
          top: 10px;
          right: 12px;
          font-size: 11px;
          color: rgba(229, 231, 235, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .dark .admin-editor .ProseMirror pre code {
          background: transparent;
          padding: 0;
        }
        .dark .admin-editor .ProseMirror li {
          padding-left: 6px;
        }
        .dark .admin-editor .ProseMirror ul,
        .dark .admin-editor .ProseMirror ol {
          margin-left: 1.2rem;
        }
        .dark .admin-editor .ProseMirror ul li::marker {
          color: #94a3b8;
        }
        .dark .admin-editor .ProseMirror code:not(pre code) {
          background: rgba(148, 163, 184, 0.15);
          color: #e5e7eb;
          padding: 0.15rem 0.35rem;
          border-radius: 6px;
          font-family: "JetBrains Mono", "Menlo", "Consolas", monospace;
          border: 1px solid rgba(148, 163, 184, 0.35);
        }
        .dark .admin-editor .ProseMirror blockquote {
          border-left: 3px solid #1f2937;
          background: rgba(31, 41, 55, 0.35);
          padding: 10px 14px;
          border-radius: 10px;
          color: #cbd5e1;
        }
        .dark .admin-editor .ProseMirror table {
          border: 1px solid #1f2937;
          border-radius: 8px;
          overflow: hidden;
          background: #0f172a;
        }
        .dark .admin-editor .ProseMirror th {
          background: #111827;
          color: #e5e7eb;
          border: 1px solid #1f2937;
        }
        .dark .admin-editor .ProseMirror tr:nth-child(odd) td {
          background: rgba(255,255,255,0.02);
        }
        .dark .admin-editor .ProseMirror td {
          border: 1px solid #1f2937;
        }
        .dark .admin-editor .ProseMirror hr {
          border-top: 1px dashed rgba(99, 102, 241, 0.4);
          margin: 1.5rem 0;
        }
        .dark .admin-editor .ProseMirror a {
          color: #8ab4f8;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .dark .admin-editor .ProseMirror img {
          border-radius: 12px;
          border: 1px solid #1f2937;
          box-shadow: 0 10px 30px rgba(0,0,0,0.35);
        }

        /* Light theme */
        .light .admin-editor {
          background: transparent;
          border: none;
          box-shadow: none;
        }
        .light .admin-editor .ProseMirror {
          background: transparent;
          padding: 18px 22px 24px;
          min-height: 520px;
          line-height: 1.8;
          color: #0f172a;
        }
        .light .admin-editor .ProseMirror h1,
        .light .admin-editor .ProseMirror h2,
        .light .admin-editor .ProseMirror h3,
        .light .admin-editor .ProseMirror h4,
        .light .admin-editor .ProseMirror h5,
        .light .admin-editor .ProseMirror h6 {
          color: #0f172a;
          letter-spacing: -0.01em;
        }
        .light .admin-editor .ProseMirror p {
          color: #111827;
        }
        .light .admin-editor .ProseMirror pre {
          background: #f8fafc;
          color: #0f172a;
          border: 1px solid #e2e8f0;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .light .admin-editor .ProseMirror pre::before {
          content: 'code';
          position: absolute;
          top: 10px;
          right: 12px;
          font-size: 11px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .light .admin-editor .ProseMirror pre code {
          background: transparent;
          padding: 0;
        }
        .light .admin-editor .ProseMirror li {
          padding-left: 6px;
        }
        .light .admin-editor .ProseMirror ul,
        .light .admin-editor .ProseMirror ol {
          margin-left: 1.2rem;
        }
        .light .admin-editor .ProseMirror ul li::marker {
          color: #9ca3af;
        }
        .light .admin-editor .ProseMirror code:not(pre code) {
          background: #e2e8f0;
          color: #0f172a;
          padding: 0.15rem 0.35rem;
          border-radius: 6px;
          font-family: "JetBrains Mono", "Menlo", "Consolas", monospace;
          border: 1px solid #cbd5e1;
        }
        .light .admin-editor .ProseMirror blockquote {
          border-left: 3px solid #cbd5e1;
          background: #f8fafc;
          padding: 10px 14px;
          border-radius: 10px;
          color: #0f172a;
        }
        .light .admin-editor .ProseMirror table {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          background: #ffffff;
        }
        .light .admin-editor .ProseMirror th {
          background: #f1f5f9;
          color: #0f172a;
          border: 1px solid #e2e8f0;
        }
        .light .admin-editor .ProseMirror tr:nth-child(odd) td {
          background: #f8fafc;
        }
        .light .admin-editor .ProseMirror td {
          border: 1px solid #e2e8f0;
        }
        .light .admin-editor .ProseMirror hr {
          border-top: 1px dashed rgba(99, 102, 241, 0.5);
          margin: 1.5rem 0;
        }
        .light .admin-editor .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .light .admin-editor .ProseMirror img {
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 12px 30px rgba(15,23,42,0.08);
        }
      `}</style>
    </div>
  )
}
