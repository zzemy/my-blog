'use client'

import { useRef, useState } from 'react'
import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { uploadImage } from '@/lib/upload-image'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table,
  CheckSquare,
  CodeSquare,
  Minus,
  Loader2,
  Info,
  Play,
} from 'lucide-react'
import { createImageItemsFromUrls, toYouTubeEmbed } from './rich-block-extensions'

interface MenuBarProps {
  editor: Editor
}

const calloutTones = ['note', 'quote', 'tip', 'info', 'warning', 'success'] as const

type CalloutTone = (typeof calloutTones)[number]

export function MenuBar({ editor }: MenuBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
        setIsUploading(true)
        uploadImage(file).then((url) => {
            if (url) {
                editor.chain().focus().setImage({ src: url }).run()
            } else {
                alert('图片上传失败，请确保 Supabase Storage 已配置 Policies 允许上传。')
            }
        }).finally(() => {
            setIsUploading(false)
            // Reset input so valid change events trigger even if same file is selected again
            if (fileInputRef.current) fileInputRef.current.value = ''
        })
    }
  }

  const addImage = () => {
    fileInputRef.current?.click()
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('链接 URL:', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run()
  }

  const insertCallout = () => {
    const toneInput = window.prompt('Notice 类型：note / quote / tip / info / warning / success', 'note')
    if (toneInput === null) return
    const tone = normalizeCalloutTone(toneInput)
    const title = window.prompt('标题:', tone[0].toUpperCase() + tone.slice(1))
    if (title === null) return
    const text = window.prompt('内容:', `This is a simple ${tone}.`)
    if (text === null) return

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'articleCallout',
        attrs: { tone, title, text },
      })
      .run()
  }

  const insertButton = () => {
    const label = window.prompt('按钮文本:', 'Button')
    if (!label) return
    const href = window.prompt('按钮链接:', 'https://emmmxx.xyz')
    if (href === null) return
    const variantInput = window.prompt('按钮样式：primary / secondary', 'primary')
    const variant = variantInput === 'secondary' ? 'secondary' : 'primary'

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'articleButton',
        attrs: { label, href, variant },
      })
      .run()
  }

  const insertTabs = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'articleTabs',
        attrs: {
          panels: [
            { title: 'Tab 1', text: 'Hey There, I am a tab' },
            { title: 'Tab 2', text: 'At vero eos et accusam et justo duo dolores et ea rebum.' },
            { title: 'Tab 3', text: 'Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.' },
          ],
        },
      })
      .run()
  }

  const insertAccordion = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'articleAccordion',
        attrs: {
          items: [
            { title: 'Why should you need to do this?', text: '为了在同一页里提前看到真实文章会遇到的折叠内容状态。' },
            { title: 'How can I adjust Horizontal centering', text: '正文容器负责宽度，组件只需要占满当前正文宽度。' },
            { title: 'Should you use Negative margin?', text: '这里不使用负 margin，避免移动端出现横向滚动。' },
          ],
        },
      })
      .run()
  }

  const insertImageCollection = (type: 'articleGallery' | 'articleSlider') => {
    const value = window.prompt('图片 URL，多个用英文逗号分隔:', '')
    if (!value) return
    const images = createImageItemsFromUrls(value)
    if (images.length === 0) return

    editor
      .chain()
      .focus()
      .insertContent({
        type,
        attrs: { images },
      })
      .run()
  }

  const insertYoutube = () => {
    const value = window.prompt('YouTube URL:', 'https://www.youtube.com/watch?v=ysz5S6PUM-U')
    if (!value) return

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'articleEmbed',
        attrs: {
          kind: 'youtube',
          src: toYouTubeEmbed(value),
          title: 'YouTube video',
        },
      })
      .run()
  }

  const insertVideo = () => {
    const src = window.prompt('Custom video URL:', 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4')
    if (!src) return
    const poster = window.prompt('Poster URL（可留空）:', '') || ''

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'articleEmbed',
        attrs: {
          kind: 'video',
          src,
          poster,
          title: 'Custom video',
        },
      })
      .run()
  }

  const insertFlow = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'articleFlow',
        attrs: {
          start: 'Start',
          question: 'Is it?',
          yes: 'OK',
          no: 'Rethink',
          end: 'End',
        },
      })
      .run()
  }

  return (
    <div className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-2 flex flex-wrap gap-1 sticky top-0 z-10">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />
      {/* 文本格式 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-gray-200 dark:bg-zinc-700' : 'hover:bg-gray-200 dark:hover:bg-zinc-800'}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-gray-200 dark:bg-zinc-700' : 'hover:bg-gray-200 dark:hover:bg-zinc-800'}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'bg-gray-200 dark:bg-zinc-700' : 'hover:bg-gray-200 dark:hover:bg-zinc-800'}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={editor.isActive('code') ? 'bg-gray-200 dark:bg-zinc-700' : 'hover:bg-gray-200 dark:hover:bg-zinc-800'}
      >
        <Code className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-gray-300 dark:bg-zinc-700 mx-1" />

      {/* 标题 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-zinc-700' : 'hover:bg-gray-200 dark:hover:bg-zinc-800'}
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-zinc-700' : 'hover:bg-gray-200 dark:hover:bg-zinc-800'}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 dark:bg-zinc-700' : 'hover:bg-gray-200 dark:hover:bg-zinc-800'}
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-gray-300 dark:bg-zinc-700 mx-1" />

      {/* 列表 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-zinc-700' : 'hover:bg-gray-200 dark:hover:bg-zinc-800'}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-zinc-700' : 'hover:bg-gray-200 dark:hover:bg-zinc-800'}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={editor.isActive('taskList') ? 'bg-gray-200 dark:bg-zinc-700' : 'hover:bg-gray-200 dark:hover:bg-zinc-800'}
      >
        <CheckSquare className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-gray-300 dark:bg-zinc-700 mx-1" />

      {/* 其他格式 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-zinc-700' : 'hover:bg-gray-200 dark:hover:bg-zinc-800'}
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive('codeBlock') ? 'bg-gray-200 dark:bg-zinc-700' : 'hover:bg-gray-200 dark:hover:bg-zinc-800'}
      >
        <CodeSquare className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="hover:bg-gray-200 dark:hover:bg-zinc-800"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-gray-300 dark:bg-zinc-700 mx-1" />

      {/* 插入 */}
      <Button variant="ghost" size="sm" onClick={setLink} className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={addImage}
        disabled={isUploading}
        className="hover:bg-gray-200 dark:hover:bg-zinc-800"
      >
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="sm" onClick={insertTable} className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <Table className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-gray-300 dark:bg-zinc-700 mx-1" />

      {/* 富文本块 */}
      <Button variant="ghost" size="sm" onClick={insertCallout} title="Notice" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <Info className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertButton} title="Button" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertTabs} title="Tabs" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <Table className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertAccordion} title="Accordion" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertImageCollection('articleGallery')}
        title="Gallery"
        className="hover:bg-gray-200 dark:hover:bg-zinc-800"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertImageCollection('articleSlider')}
        title="Slider"
        className="hover:bg-gray-200 dark:hover:bg-zinc-800"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertYoutube} title="YouTube" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <Play className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertVideo} title="Custom video" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <Play className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertFlow} title="Flow" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <CheckSquare className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-gray-300 dark:bg-zinc-700 mx-1" />

      {/* 撤销/重做 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="hover:bg-gray-200 dark:hover:bg-zinc-800"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="hover:bg-gray-200 dark:hover:bg-zinc-800"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  )
}

function normalizeCalloutTone(value: string): CalloutTone {
  return calloutTones.includes(value.trim().toLowerCase() as CalloutTone)
    ? (value.trim().toLowerCase() as CalloutTone)
    : 'note'
}
