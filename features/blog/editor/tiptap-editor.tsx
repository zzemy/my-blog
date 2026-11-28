'use client'

import { EditorContent, useEditor, Editor, ReactNodeViewRenderer } from '@tiptap/react'
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
import { Highlight } from '@tiptap/extension-highlight'
import { Typography } from '@tiptap/extension-typography'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { Mathematics } from '@tiptap/extension-mathematics'
import { common, createLowlight } from 'lowlight'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { toast } from 'sonner'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { MenuBar, SelectionBubbleMenu } from './menu-bar'
import { articleRichBlockExtensions } from './rich-block-extensions'
import { CodeBlockView } from './code-block-view'
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
  onActiveHeadingChange?: (outlineId: string | null) => void
  placeholder?: string
  editable?: boolean
  showMarkdownGuide?: boolean
}

export type TipTapEditorHandle = {
  importMarkdown: (markdown: string, mode: 'insert' | 'replace') => Promise<void>
  focusStart: () => void
  setContent: (content: Content | undefined) => void
  getSelectedText: () => string
  replaceSelection: (text: string) => void
  insertBelowSelection: (text: string) => void
}

export const TipTapEditor = forwardRef<TipTapEditorHandle, TipTapEditorProps>(function TipTapEditor(
  {
    content,
    onChange,
    onActiveHeadingChange,
    placeholder = '开始编写内容...',
    editable = true,
    showMarkdownGuide = false,
  },
  ref,
) {
  const [isUploading, setIsUploading] = useState(false)
  const editorRef = useRef<Editor | null>(null)
  const activeHeadingCallbackRef = useRef(onActiveHeadingChange)
  activeHeadingCallbackRef.current = onActiveHeadingChange

  const editor = useEditor({
    immediatelyRender: false,
    onCreate({ editor }) {
      editorRef.current = editor
    },
    extensions: [
      StarterKit.configure({
        codeBlock: false, // 使用 CodeBlockLowlight 替代
        link: false, // 使用下方自定义 Link 配置
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'article-link',
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
        resizable: true,
        HTMLAttributes: {
          class: 'article-table',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: '',
        },
      }),
      TableCell.extend({
        content: 'block+',
      }).configure({
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
          class: 'list-none pl-0',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'flex items-start gap-2',
        },
      }),
      Mathematics,
      Highlight,
      Typography,
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
        // 1. Image Paste Support (traverse all clipboard items so browser-copied images work even when text/html is index 0)
        const items = Array.from(event.clipboardData?.items ?? [])
        const imageFiles = items
          .filter((item) => item.type.startsWith('image/'))
          .map((item) => item.getAsFile())
          .filter((file): file is File => Boolean(file))

        if (imageFiles.length > 0) {
          event.preventDefault()
          setIsUploading(true)
          void (async () => {
            try {
              for (const file of imageFiles) {
                const url = await uploadImage(file)
                if (url) {
                  const currentEditor = editorRef.current
                  if (currentEditor) {
                    currentEditor.chain().focus().setImage({ src: url }).run()
                  }
                } else {
                  toast.error(`图片「${file.name || '剪贴板图片'}」上传失败`)
                }
              }
            } finally {
              setIsUploading(false)
            }
          })()
          return true
        }

        // 2. Skip Markdown paste interception when pasting inside a code block
        if (editorRef.current?.isActive('codeBlock')) {
          return false
        }

        // 3. Existing Markdown Support
        try {
          const text = event.clipboardData?.getData('text/markdown') || event.clipboardData?.getData('text/plain') || ''

          const looksMarkdown =
            /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|>|```|~~|[*_](?!\s)|`|[-*_]{3,}|!\[|\[|\||\$\$?|\\|<\/?[a-z]|\[\^)/i.test(
              text,
            )

          if (text && (looksMarkdown || hasArticleShortcodes(text))) {
            event.preventDefault()
            ;(async () => {
              try {
                await insertMarkdownContent(editorRef.current, text, 'insert')
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
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const files = Array.from(event.dataTransfer.files)
          const markdownFile = files.find(
            (file) => /\.(md|markdown|txt)$/i.test(file.name) || file.type === 'text/markdown',
          )
          if (markdownFile) {
            event.preventDefault()
            void markdownFile.text().then(async (content) => {
              if (!content.trim()) return
              await insertMarkdownContent(editorRef.current, content, 'insert')
              toast.success(`已导入「${markdownFile.name}」`)
            })
            return true
          }

          const imageFiles = files.filter((file) =>
            file.type.startsWith('image/'),
          )

          if (imageFiles.length > 0) {
            event.preventDefault()
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
            setIsUploading(true)

            void (async () => {
              try {
                let insertPos = coordinates?.pos ?? view.state.selection.to
                for (const file of imageFiles) {
                  const url = await uploadImage(file)
                  if (url) {
                    const { schema } = view.state
                    const node = schema.nodes.image.create({ src: url })
                    const safePos = Math.min(insertPos, view.state.doc.content.size)
                    const transaction = view.state.tr.insert(safePos, node)
                    view.dispatch(transaction)
                    insertPos = safePos + node.nodeSize
                  } else {
                    toast.error(`图片「${file.name}」上传失败`)
                  }
                }
              } finally {
                setIsUploading(false)
              }
            })()
            return true
          }
        }
        return false
      },
    },
  })

  useImperativeHandle(
    ref,
    () => ({
      async importMarkdown(markdown, mode) {
        await insertMarkdownContent(editorRef.current, markdown, mode)
      },
      focusStart() {
        editorRef.current?.commands.focus('start')
      },
      setContent(nextContent) {
        if (!editorRef.current) return
        editorRef.current.commands.setContent(nextContent ?? '')
      },
      getSelectedText() {
        const instance = editorRef.current
        if (!instance) return ''
        const { from, to } = instance.state.selection
        if (from === to) return ''
        return instance.state.doc.textBetween(from, to, '\n\n')
      },
      replaceSelection(text: string) {
        const instance = editorRef.current
        if (!instance) return
        void (async () => {
          try {
            const html = await markdownToHtml(text)
            instance.chain().focus().insertContent(html).run()
          } catch {
            instance.chain().focus().insertContent(text).run()
          }
        })()
      },
      insertBelowSelection(text: string) {
        const instance = editorRef.current
        if (!instance) return
        const { to } = instance.state.selection
        void (async () => {
          try {
            const html = await markdownToHtml(text)
            instance.chain().focus().insertContentAt(to, html).run()
          } catch {
            instance
              .chain()
              .focus()
              .insertContentAt(to, {
                type: 'paragraph',
                content: [{ type: 'text', text }],
              })
              .run()
          }
        })()
      },
    }),
    [],
  )

  useEffect(() => {
    if (!editor) return

    let frame = 0

    const assignHeadingIds = () => {
      window.cancelAnimationFrame(frame)

      frame = window.requestAnimationFrame(() => {
        let index = 0

        editor.state.doc.descendants((node, pos) => {
          if (node.type.name !== 'heading') return
          if (!node.textContent.trim()) return

          const dom = editor.view.nodeDOM(pos)
          const heading = getHeadingElement(dom)
          if (!heading) return

          index += 1
          heading.setAttribute('id', `outline-${index}`)
          heading.setAttribute('data-editor-outline-heading', String(index))
          heading.style.scrollMarginTop = '88px'
        })
      })
    }

    const reportActiveHeading = () => {
      if (!activeHeadingCallbackRef.current) return

      const cursorPos = editor.state.selection.from
      let headingIndex = 0
      let activeId: string | null = null

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== 'heading') return
        if (!node.textContent.trim()) return

        headingIndex += 1
        if (pos <= cursorPos) {
          activeId = `outline-${headingIndex}`
        }
      })

      activeHeadingCallbackRef.current(activeId)
    }

    assignHeadingIds()
    reportActiveHeading()
    editor.on('update', assignHeadingIds)
    editor.on('create', assignHeadingIds)
    editor.on('transaction', assignHeadingIds)
    editor.on('selectionUpdate', reportActiveHeading)
    editor.on('update', reportActiveHeading)

    return () => {
      window.cancelAnimationFrame(frame)
      editor.off('update', assignHeadingIds)
      editor.off('create', assignHeadingIds)
      editor.off('transaction', assignHeadingIds)
      editor.off('selectionUpdate', reportActiveHeading)
      editor.off('update', reportActiveHeading)
    }
  }, [editor])

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
        {editable && showMarkdownGuide && <MarkdownShortcodeGuide />}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
})

TipTapEditor.displayName = 'TipTapEditor'

async function insertMarkdownContent(editor: Editor | null, markdown: string, mode: 'insert' | 'replace') {
  if (!editor) return

  if (mode === 'replace') {
    editor.chain().focus().clearContent().run()
  }

  if (hasArticleShortcodes(markdown)) {
    const segments = splitArticleMarkdown(markdown)
    for (const segment of segments) {
      if (segment.kind === 'markdown') {
        const html = await markdownToHtml(segment.text)
        editor.chain().focus().insertContent(html).run()
      } else {
        editor.chain().focus().insertContent(segment.content).run()
      }
    }
    return
  }

  const html = await markdownToHtml(markdown)
  editor.chain().focus().insertContent(html).run()
}

function getHeadingElement(dom: globalThis.Node | null): HTMLElement | null {
  if (!(dom instanceof HTMLElement)) return null
  if (dom.matches('h1, h2, h3, h4, h5, h6')) return dom
  return dom.querySelector('h1, h2, h3, h4, h5, h6')
}
