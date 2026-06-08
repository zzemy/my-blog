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
  LayoutGrid,
  Network,
  Clock3,
  Layers3,
  Music2,
  Play,
} from 'lucide-react'
import { createImageItemsFromUrls, toYouTubeEmbed } from './rich-block-extensions'

interface MenuBarProps {
  editor: Editor
}

const calloutTones = ['note', 'quote', 'tip', 'info', 'warning', 'success'] as const

type CalloutTone = (typeof calloutTones)[number]

const calloutDefaults: Record<CalloutTone, { title: string; text: string }> = {
  note: { title: '备注', text: '这是一条普通备注。' },
  quote: { title: '引用', text: '这是一条引用型提示。' },
  tip: { title: '技巧', text: '这是一条技巧提示。' },
  info: { title: '信息', text: '这是一条信息提示。' },
  warning: { title: '警告', text: '这是一条警告提示。' },
  success: { title: '完成', text: '这是一条完成状态。' },
}

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
    const toneInput = window.prompt('提示块类型：note / quote / tip / info / warning / success', 'note')
    if (toneInput === null) return
    const tone = normalizeCalloutTone(toneInput)
    const defaults = calloutDefaults[tone]
    const title = window.prompt('标题:', defaults.title)
    if (title === null) return
    const text = window.prompt('内容:', defaults.text)
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
    const label = window.prompt('按钮文本:', '按钮')
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
            { title: '结构', text: '第一组内容用于检查标签页结构。' },
            { title: '样式', text: '第二组内容用于检查标签切换状态。' },
            { title: '验证', text: '第三组内容用于检查移动端换行。' },
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
            { title: '为什么需要折叠面板？', text: '为了在同一页里提前看到真实文章会遇到的折叠内容状态。' },
            { title: '如何保持横向居中？', text: '正文容器负责宽度，组件只需要占满当前正文宽度。' },
            { title: '是否应该使用负边距？', text: '这里不使用负 margin，避免移动端出现横向滚动。' },
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
    const value = window.prompt('YouTube URL:', 'https://www.youtube.com/watch?v=linlz7-Pnvw')
    if (!value) return

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'articleEmbed',
        attrs: {
          kind: 'youtube',
          src: toYouTubeEmbed(value),
          title: 'YouTube 视频',
        },
      })
      .run()
  }

  const insertVideo = () => {
    const src = window.prompt('自定义视频 URL:', 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4')
    if (!src) return
    const poster = window.prompt('封面图 URL（可留空）:', '') || ''

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'articleEmbed',
        attrs: {
          kind: 'video',
          src,
          poster,
          title: '自定义视频',
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
          start: '开始',
          question: '内容完整？',
          yes: '预览发布',
          no: '继续修改',
          end: '归档',
        },
      })
      .run()
  }

  const insertCards = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'articleCards',
        attrs: {
          cards: [
            { eyebrow: '模式', title: '紧凑摘要卡片', text: '用于文章中的小型结论、资源组或阅读提示。' },
            { eyebrow: '状态', title: '状态对比', text: '可承载就绪、预览、废弃等状态。' },
            { eyebrow: '资源', title: '相关阅读', text: '适合链接到同系列文章、外部资料或下载内容。' },
          ],
        },
      })
      .run()
  }

  const insertDiagram = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'articleDiagram',
        attrs: {
          items: [{ label: '内容源' }, { label: '渲染器' }, { label: '正文界面' }],
        },
      })
      .run()
  }

  const insertTimeline = () => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'articleTimeline',
        attrs: {
          items: [
            { label: '草稿', title: '收集内容块', text: '先把真实文章里会出现的内容块列全。' },
            { label: '检查', title: '校准阅读节奏', text: '检查标题、列表、代码、表格和媒体是否稳定。' },
            { label: '发布', title: '复用正文体系', text: '组件页和文章详情页使用同一套正文变量。' },
          ],
        },
      })
      .run()
  }

  const insertRichShowcase = () => {
    const image = window.prompt('图片 URL（可留空）:', '')
    if (image === null) return

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'articleRichShowcase',
        attrs: {
          image,
          alt: '图片说明',
          eyebrow: '富文本块',
          title: '混合正文模块',
          text: '一个块里同时承载媒体、摘要、状态和操作入口。',
          primaryLabel: '查看图集',
          primaryHref: '#gallery',
          secondaryLabel: '查看文件',
          secondaryHref: '#files',
        },
      })
      .run()
  }

  const insertAudio = () => {
    const src = window.prompt('音频 URL:', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3')
    if (!src) return

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'articleAudio',
        attrs: {
          src,
          title: '嵌入音频',
          caption: '音频 · 正文宽度媒体控件',
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
      <Button variant="ghost" size="sm" onClick={insertCallout} title="提示块" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <Info className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertButton} title="按钮" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertTabs} title="标签页" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <Table className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertAccordion} title="折叠面板" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertImageCollection('articleGallery')}
        title="图集"
        className="hover:bg-gray-200 dark:hover:bg-zinc-800"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertImageCollection('articleSlider')}
        title="轮播"
        className="hover:bg-gray-200 dark:hover:bg-zinc-800"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertYoutube} title="YouTube" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <Play className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertVideo} title="自定义视频" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <Play className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertFlow} title="流程图" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <CheckSquare className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertCards} title="卡片" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertDiagram} title="关系图" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <Network className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertTimeline} title="时间线" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <Clock3 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertRichShowcase} title="富文本块" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <Layers3 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertAudio} title="音频" className="hover:bg-gray-200 dark:hover:bg-zinc-800">
        <Music2 className="h-4 w-4" />
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
