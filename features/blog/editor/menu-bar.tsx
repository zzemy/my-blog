'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, ComponentType } from 'react'
import { Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import {
  Bold,
  CheckSquare,
  Code,
  CodeSquare,
  Columns3,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Info,
  Italic,
  Layers3,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Music2,
  Network,
  PanelTop,
  Play,
  Plus,
  Quote,
  Rows3,
  Table,
  Undo,
  Redo,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { uploadImage } from '@/lib/upload-image'
import { toYouTubeEmbed } from './rich-block-extensions'

interface MenuBarProps {
  editor: Editor
}

type InsertItem = {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  action: () => void
}

type InsertGroup = {
  title: string
  items: InsertItem[]
}

export function MenuBar({ editor }: MenuBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [open, setOpen] = useState(false)
  const [insertQuery, setInsertQuery] = useState('')

  useEffect(() => {
    const dom = editor.view.dom
    const openWithSlash = (event: KeyboardEvent) => {
      if (event.key !== '/') return
      if (event.altKey || event.ctrlKey || event.metaKey) return

      event.preventDefault()
      setOpen(true)
      setInsertQuery('')
    }

    dom.addEventListener('keydown', openWithSlash)
    return () => dom.removeEventListener('keydown', openWithSlash)
  }, [editor])

  const uploadInlineImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    uploadImage(file)
      .then((url) => {
        if (url) {
          editor.chain().focus().setImage({ src: url }).run()
        } else {
          alert('图片上传失败，请确保 Supabase Storage 已配置 Policies 允许上传。')
        }
      })
      .finally(() => {
        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      })
  }

  const run = (action: () => void) => {
    action()
    setOpen(false)
    setInsertQuery('')
  }

  const insertGroups: InsertGroup[] = [
    {
      title: '基础',
      items: [
        {
          title: '一级标题',
          description: '插入 H1 标题块',
          icon: Heading1,
          action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        },
        {
          title: '二级标题',
          description: '插入 H2 标题块',
          icon: Heading2,
          action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        },
        {
          title: '三级标题',
          description: '插入 H3 标题块',
          icon: Heading3,
          action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        },
        {
          title: '无序列表',
          description: '项目符号列表',
          icon: List,
          action: () => editor.chain().focus().toggleBulletList().run(),
        },
        {
          title: '有序列表',
          description: '编号列表',
          icon: ListOrdered,
          action: () => editor.chain().focus().toggleOrderedList().run(),
        },
        {
          title: '任务',
          description: '待办事项列表',
          icon: CheckSquare,
          action: () => editor.chain().focus().toggleTaskList().run(),
        },
        {
          title: '引用',
          description: '正文引用块',
          icon: Quote,
          action: () => editor.chain().focus().toggleBlockquote().run(),
        },
        {
          title: '代码块',
          description: '与发布页一致的代码窗口',
          icon: CodeSquare,
          action: () => editor.chain().focus().toggleCodeBlock().run(),
        },
        {
          title: '分割线',
          description: '插入水平分割线',
          icon: Minus,
          action: () => editor.chain().focus().setHorizontalRule().run(),
        },
      ],
    },
    {
      title: '媒体',
      items: [
        {
          title: '图片',
          description: '上传并插入单张图片',
          icon: ImageIcon,
          action: () => fileInputRef.current?.click(),
        },
        {
          title: '图集',
          description: '插入可编辑图片网格',
          icon: Rows3,
          action: () =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: 'articleGallery',
                attrs: { images: [] },
              })
              .run(),
        },
        {
          title: '轮播',
          description: '插入可编辑图片轮播',
          icon: Columns3,
          action: () =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: 'articleSlider',
                attrs: { images: [] },
              })
              .run(),
        },
        {
          title: 'YouTube',
          description: '插入视频嵌入块',
          icon: Play,
          action: () =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: 'articleEmbed',
                attrs: {
                  kind: 'youtube',
                  src: toYouTubeEmbed('https://www.youtube.com/watch?v=linlz7-Pnvw'),
                  title: 'YouTube 视频',
                },
              })
              .run(),
        },
        {
          title: '音频',
          description: '插入音频播放器',
          icon: Music2,
          action: () =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: 'articleAudio',
                attrs: {
                  src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                  title: '嵌入音频',
                  caption: '音频 · 正文宽度媒体控件',
                },
              })
              .run(),
        },
      ],
    },
    {
      title: '文章组件',
      items: [
        {
          title: '提示块',
          description: 'Callout / Note / Warning',
          icon: Info,
          action: () =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: 'articleCallout',
                attrs: { tone: 'note', title: '备注', text: '这是一条普通备注。' },
              })
              .run(),
        },
        {
          title: '按钮',
          description: '插入正文操作按钮',
          icon: LinkIcon,
          action: () =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: 'articleButton',
                attrs: { label: '按钮', href: 'https://emmmxx.xyz', variant: 'primary' },
              })
              .run(),
        },
        {
          title: '标签页',
          description: '多组内容切换',
          icon: PanelTop,
          action: () =>
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
              .run(),
        },
        {
          title: '折叠面板',
          description: '可展开的问答或说明',
          icon: FileText,
          action: () =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: 'articleAccordion',
                attrs: {
                  items: [
                    { title: '为什么需要折叠面板？', text: '为了在同一页里展示可折叠内容。' },
                    { title: '如何编辑？', text: '选中组件后在编辑入口中修改内容。' },
                  ],
                },
              })
              .run(),
        },
        {
          title: '展示块',
          description: '媒体、摘要和操作入口',
          icon: Layers3,
          action: () =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: 'articleRichShowcase',
                attrs: {
                  image: '',
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
              .run(),
        },
      ],
    },
    {
      title: '结构',
      items: [
        {
          title: '表格',
          description: '3 x 3 表格',
          icon: Table,
          action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
        },
        {
          title: '流程图',
          description: '简易流程节点',
          icon: CheckSquare,
          action: () =>
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
              .run(),
        },
        {
          title: '卡片',
          description: '三列摘要卡片',
          icon: Columns3,
          action: () =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: 'articleCards',
                attrs: {
                  cards: [
                    { eyebrow: '模式', title: '紧凑摘要卡片', text: '用于文章中的小型结论或阅读提示。' },
                    { eyebrow: '状态', title: '状态对比', text: '可承载就绪、预览、废弃等状态。' },
                    { eyebrow: '资源', title: '相关阅读', text: '适合链接到同系列文章或外部资料。' },
                  ],
                },
              })
              .run(),
        },
        {
          title: '关系图',
          description: '节点关系展示',
          icon: Network,
          action: () =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: 'articleDiagram',
                attrs: { items: [{ label: '内容源' }, { label: '渲染器' }, { label: '正文界面' }] },
              })
              .run(),
        },
        {
          title: '时间线',
          description: '阶段式说明',
          icon: Rows3,
          action: () =>
            editor
              .chain()
              .focus()
              .insertContent({
                type: 'articleTimeline',
                attrs: {
                  items: [
                    { label: '草稿', title: '收集内容块', text: '先把真实文章里会出现的内容块列全。' },
                    { label: '发布', title: '复用正文体系', text: '组件页和文章详情页使用同一套正文变量。' },
                  ],
                },
              })
              .run(),
        },
      ],
    },
  ]

  const normalizedQuery = insertQuery.trim().toLowerCase()
  const visibleGroups = insertGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!normalizedQuery) return true
        return `${group.title} ${item.title} ${item.description}`.toLowerCase().includes(normalizedQuery)
      }),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="doc-editor-toolbar" aria-label="插入内容块">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadInlineImage} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="doc-insert-trigger" aria-label="插入内容块">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span>插入块</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="doc-insert-menu">
          <label className="doc-insert-search">
            <Search className="h-4 w-4" />
            <input
              value={insertQuery}
              onChange={(event) => setInsertQuery(event.target.value)}
              placeholder="搜索块，或直接输入 / 打开菜单"
              autoFocus
            />
          </label>
          {visibleGroups.map((group) => (
            <section key={group.title} className="doc-insert-group">
              <h3>{group.title}</h3>
              <div>
                {group.items.map((item) => {
                  const Icon = item.icon

                  return (
                    <button key={`${group.title}-${item.title}`} type="button" onClick={() => run(item.action)}>
                      <Icon className="h-4 w-4" />
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.description}</small>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
          {!visibleGroups.length ? <p className="doc-insert-empty">没有匹配的内容块。</p> : null}
        </PopoverContent>
      </Popover>
      <div className="doc-history-actions" aria-label="历史操作">
        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} aria-label="撤销">
          <Undo className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} aria-label="重做">
          <Redo className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function SelectionBubbleMenu({ editor }: MenuBarProps) {
  const [linkInputOpen, setLinkInputOpen] = useState(false)
  const [linkValue, setLinkValue] = useState('')

  const openLinkInput = () => {
    const href = editor.getAttributes('link').href
    setLinkValue(typeof href === 'string' ? href : '')
    setLinkInputOpen(true)
  }

  const applyLink = () => {
    const href = linkValue.trim()

    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setLinkInputOpen(false)
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    setLinkInputOpen(false)
  }

  return (
    <BubbleMenu editor={editor} className="doc-selection-menu">
      <button
        type="button"
        className={editor.isActive('bold') ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label="加粗"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={editor.isActive('italic') ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label="斜体"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        aria-label="一级标题"
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="二级标题"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={editor.isActive('bulletList') ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="无序列表"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={editor.isActive('blockquote') ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="引用"
      >
        <Quote className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={editor.isActive('code') ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleCode().run()}
        aria-label="行内代码"
      >
        <Code className="h-4 w-4" />
      </button>
      <button type="button" onClick={openLinkInput} aria-label="链接">
        <LinkIcon className="h-4 w-4" />
      </button>
      {linkInputOpen ? (
        <form
          className="doc-selection-link-form"
          onSubmit={(event) => {
            event.preventDefault()
            applyLink()
          }}
        >
          <input
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            placeholder="https://"
            autoFocus
          />
          <button type="submit">应用</button>
        </form>
      ) : null}
    </BubbleMenu>
  )
}
