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
import { MenuBar, SelectionBubbleMenu } from './menu-bar'
import { articleRichBlockExtensions } from './rich-block-extensions'
import { hasArticleShortcodes, splitArticleMarkdown } from './markdown-shortcodes'
import { MarkdownShortcodeGuide } from './markdown-shortcode-guide'
import styles from './tiptap-editor.module.css'
import { uploadImage } from '@/lib/upload-image'

const lowlight = createLowlight(common)

async function markdownToHtml(markdown: string) {
  try {
    const file = await remark()
      .use(remarkMath)
      .use(remarkGfm)
      .use(remarkRehype, {
        handlers: {
          math: (_state: unknown, node: { value?: string }) => ({
            type: 'element',
            tagName: 'div',
            properties: {
              'data-type': 'block-math',
              'data-latex': node.value || '',
            },
            children: [{ type: 'text', value: node.value || '' }],
          }),
          inlineMath: (_state: unknown, node: { value?: string }) => ({
            type: 'element',
            tagName: 'span',
            properties: {
              'data-type': 'inline-math',
              'data-latex': node.value || '',
            },
            children: [{ type: 'text', value: node.value || '' }],
          }),
        },
      })
      .use(rehypeStringify)
      .process(markdown)

    return String(file)
  } catch (error) {
    console.warn('Math parsing failed, retrying without math...', error)
  }

  const file = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown)

  return String(file)
}

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
      ...articleRichBlockExtensions,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'article-content prose dark:prose-invert max-w-none focus:outline-none min-h-[500px] article-font',
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
          
          if (text && (looksMarkdown || hasArticleShortcodes(text))) {
             event.preventDefault()
             ;(async () => {
               try {
                 if (hasArticleShortcodes(text)) {
                   const segments = splitArticleMarkdown(text)
                   for (const segment of segments) {
                     if (segment.kind === 'markdown') {
                       const html = await markdownToHtml(segment.text)
                       editorRef.current?.chain().focus().insertContent(html).run()
                     } else {
                       editorRef.current?.chain().focus().insertContent(segment.content).run()
                     }
                   }
                   return
                 }

                 const html = await markdownToHtml(text)
                 editorRef.current?.chain().focus().insertContent(html).run()
                 return
               } catch (error) {
                 console.error('Markdown processing completely failed', error)
               }

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
    <div className={`relative admin-editor article-shell ${styles.editorShell}`}>
      {isUploading && (
        <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <div className="animate-pulse text-primary font-medium">图片上传中...</div>
        </div>
      )}
      <div className={styles.editorCanvas}>
        {editable && <MenuBar editor={editor} />}
        {editable && <SelectionBubbleMenu editor={editor} />}
        {editable && <MarkdownShortcodeGuide />}
        <EditorContent editor={editor} />
      </div>
      {editable && editor && (
        <div className={styles.editorStats}>
          <span>{editor.storage.characterCount.characters()} 字符</span>
          <span>{editor.storage.characterCount.words()} 词</span>
        </div>
      )}
    </div>
  )
}
