'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, ComponentType, ReactNode } from 'react'
import type { Content, Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import {
  Bold,
  CheckSquare,
  Code,
  CodeSquare,
  Columns3,
  FileText,
  GripVertical,
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
  Redo,
  Rows3,
  Search,
  Table,
  Undo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { uploadImage } from '@/lib/upload-image'
import { toYouTubeEmbed } from './rich-block-extensions'

interface MenuBarProps {
  editor: Editor
}

type InsertTarget = {
  pos: number
  x: number
  y: number
}

type FloatingMenuStyle = {
  left: number
  top: number
}

type InsertItem = {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  action: (pos: number | null) => void
}

type InsertGroup = {
  title: string
  items: InsertItem[]
}

export function MenuBar({ editor }: MenuBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingImagePosRef = useRef<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [topMenuOpen, setTopMenuOpen] = useState(false)
  const [floatingTarget, setFloatingTarget] = useState<InsertTarget | null>(null)
  const [styleTarget, setStyleTarget] = useState<InsertTarget | null>(null)
  const [insertQuery, setInsertQuery] = useState('')

  const insertAt = (pos: number | null, content: Content) => {
    const chain = editor.chain().focus()

    if (typeof pos === 'number') {
      chain.insertContentAt(pos, content).run()
      return
    }

    chain.insertContent(content).run()
  }

  const focusAt = (pos: number | null) => {
    const chain = editor.chain().focus()
    return typeof pos === 'number' ? chain.setTextSelection(pos) : chain
  }

  const openFloatingMenu = useCallback((target: InsertTarget) => {
    setTopMenuOpen(false)
    setStyleTarget(null)
    setFloatingTarget(target)
    setInsertQuery('')
  }, [])

  const openStyleMenu = useCallback((target: InsertTarget) => {
    setTopMenuOpen(false)
    setFloatingTarget(null)
    setStyleTarget(target)
  }, [])

  const insertGroups: InsertGroup[] = [
      {
        title: '基础',
        items: [
          {
            title: '正文',
            description: '插入一个空白段落',
            icon: FileText,
            action: (pos) => insertAt(pos, { type: 'paragraph' }),
          },
          {
            title: '一级标题',
            description: '大章节标题',
            icon: Heading1,
            action: (pos) =>
              insertAt(pos, {
                type: 'heading',
                attrs: { level: 1 },
                content: [{ type: 'text', text: '一级标题' }],
              }),
          },
          {
            title: '二级标题',
            description: '段落标题',
            icon: Heading2,
            action: (pos) =>
              insertAt(pos, {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: '二级标题' }],
              }),
          },
          {
            title: '三级标题',
            description: '小节标题',
            icon: Heading3,
            action: (pos) =>
              insertAt(pos, {
                type: 'heading',
                attrs: { level: 3 },
                content: [{ type: 'text', text: '三级标题' }],
              }),
          },
          {
            title: '无序列表',
            description: '项目符号列表',
            icon: List,
            action: (pos) =>
              insertAt(pos, {
                type: 'bulletList',
                content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '列表项' }] }] }],
              }),
          },
          {
            title: '有序列表',
            description: '编号列表',
            icon: ListOrdered,
            action: (pos) =>
              insertAt(pos, {
                type: 'orderedList',
                content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '列表项' }] }] }],
              }),
          },
          {
            title: '任务',
            description: '待办事项',
            icon: CheckSquare,
            action: (pos) =>
              insertAt(pos, {
                type: 'taskList',
                content: [
                  {
                    type: 'taskItem',
                    attrs: { checked: false },
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: '待办事项' }] }],
                  },
                ],
              }),
          },
          {
            title: '引用',
            description: '正文引用块',
            icon: Quote,
            action: (pos) =>
              insertAt(pos, {
                type: 'blockquote',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '引用内容' }] }],
              }),
          },
          {
            title: '代码块',
            description: '与发布页一致的代码窗口',
            icon: CodeSquare,
            action: (pos) =>
              insertAt(pos, {
                type: 'codeBlock',
                attrs: { language: 'ts' },
                content: [{ type: 'text', text: 'console.log("hello")' }],
              }),
          },
          {
            title: '分割线',
            description: '插入水平分割线',
            icon: Minus,
            action: (pos) => insertAt(pos, { type: 'horizontalRule' }),
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
            action: (pos) => {
              pendingImagePosRef.current = pos
              fileInputRef.current?.click()
            },
          },
          {
            title: '图集',
            description: '插入可编辑图片网格',
            icon: Rows3,
            action: (pos) => insertAt(pos, { type: 'articleGallery', attrs: { images: [] } }),
          },
          {
            title: '轮播',
            description: '插入可编辑图片轮播',
            icon: Columns3,
            action: (pos) => insertAt(pos, { type: 'articleSlider', attrs: { images: [] } }),
          },
          {
            title: 'YouTube',
            description: '插入视频嵌入块',
            icon: Play,
            action: (pos) =>
              insertAt(pos, {
                type: 'articleEmbed',
                attrs: {
                  kind: 'youtube',
                  src: toYouTubeEmbed('https://www.youtube.com/watch?v=linlz7-Pnvw'),
                  title: 'YouTube 视频',
                },
              }),
          },
          {
            title: '音频',
            description: '插入音频播放器',
            icon: Music2,
            action: (pos) =>
              insertAt(pos, {
                type: 'articleAudio',
                attrs: {
                  src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                  title: '嵌入音频',
                  caption: '音频 · 正文宽度媒体控件',
                },
              }),
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
            action: (pos) =>
              insertAt(pos, {
                type: 'articleCallout',
                attrs: { tone: 'note', title: '备注', text: '这是一条普通备注。' },
              }),
          },
          {
            title: '按钮',
            description: '插入正文操作按钮',
            icon: LinkIcon,
            action: (pos) =>
              insertAt(pos, {
                type: 'articleButton',
                attrs: { label: '按钮', href: 'https://emmmxx.xyz', variant: 'primary' },
              }),
          },
          {
            title: '标签页',
            description: '多组内容切换',
            icon: PanelTop,
            action: (pos) =>
              insertAt(pos, {
                type: 'articleTabs',
                attrs: {
                  panels: [
                    { title: '结构', text: '第一组内容用于检查标签页结构。' },
                    { title: '样式', text: '第二组内容用于检查标签切换状态。' },
                    { title: '验证', text: '第三组内容用于检查移动端换行。' },
                  ],
                },
              }),
          },
          {
            title: '折叠面板',
            description: '可展开的问答或说明',
            icon: FileText,
            action: (pos) =>
              insertAt(pos, {
                type: 'articleAccordion',
                attrs: {
                  items: [
                    { title: '为什么需要折叠面板？', text: '为了在同一页里展示可折叠内容。' },
                    { title: '如何编辑？', text: '选中组件后在编辑入口中修改内容。' },
                  ],
                },
              }),
          },
          {
            title: '展示块',
            description: '媒体、摘要和操作入口',
            icon: Layers3,
            action: (pos) =>
              insertAt(pos, {
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
              }),
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
            action: (pos) => focusAt(pos).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
          },
          {
            title: '流程图',
            description: '简易流程节点',
            icon: CheckSquare,
            action: (pos) =>
              insertAt(pos, {
                type: 'articleFlow',
                attrs: {
                  start: '开始',
                  question: '内容完整？',
                  yes: '预览发布',
                  no: '继续修改',
                  end: '归档',
                },
              }),
          },
          {
            title: '卡片',
            description: '三列摘要卡片',
            icon: Columns3,
            action: (pos) =>
              insertAt(pos, {
                type: 'articleCards',
                attrs: {
                  cards: [
                    { eyebrow: '模式', title: '紧凑摘要卡片', text: '用于文章中的小型结论或阅读提示。' },
                    { eyebrow: '状态', title: '状态对比', text: '可承载就绪、预览、废弃等状态。' },
                    { eyebrow: '资源', title: '相关阅读', text: '适合链接到同系列文章或外部资料。' },
                  ],
                },
              }),
          },
          {
            title: '关系图',
            description: '节点关系展示',
            icon: Network,
            action: (pos) =>
              insertAt(pos, {
                type: 'articleDiagram',
                attrs: { items: [{ label: '内容源' }, { label: '渲染器' }, { label: '正文界面' }] },
              }),
          },
          {
            title: '时间线',
            description: '阶段式说明',
            icon: Rows3,
            action: (pos) =>
              insertAt(pos, {
                type: 'articleTimeline',
                attrs: {
                  items: [
                    { label: '草稿', title: '收集内容块', text: '先把真实文章里会出现的内容块列全。' },
                    { label: '发布', title: '复用正文体系', text: '组件页和文章详情页使用同一套正文变量。' },
                  ],
                },
              }),
          },
        ],
      },
    ]

  useEffect(() => {
    const dom = editor.view.dom

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenus()
    }

    const openWithSlash = (event: KeyboardEvent) => {
      if (event.key !== '/') return
      if (event.altKey || event.ctrlKey || event.metaKey) return

      const { selection } = editor.state
      if (!selection.empty) return

      const prefix = selection.$from.parent.textBetween(0, selection.$from.parentOffset, '\n', '\n')
      if (prefix.trim()) return

      event.preventDefault()
      const coords = editor.view.coordsAtPos(selection.from)
      openFloatingMenu({ pos: selection.from, x: coords.left, y: coords.bottom + 8 })
    }

    const openFromBlockControl = (event: Event) => {
      const detail = (event as CustomEvent<InsertTarget>).detail
      if (!detail || typeof detail.pos !== 'number') return
      openFloatingMenu(detail)
    }

    const openFromBlockStyle = (event: Event) => {
      const detail = (event as CustomEvent<InsertTarget>).detail
      if (!detail || typeof detail.pos !== 'number') return
      openStyleMenu(detail)
    }

    dom.addEventListener('keydown', openWithSlash)
    dom.addEventListener('tiptap-block-insert', openFromBlockControl)
    dom.addEventListener('tiptap-block-style', openFromBlockStyle)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      dom.removeEventListener('keydown', openWithSlash)
      dom.removeEventListener('tiptap-block-insert', openFromBlockControl)
      dom.removeEventListener('tiptap-block-style', openFromBlockStyle)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [editor, openFloatingMenu, openStyleMenu])

  const uploadInlineImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const pos = pendingImagePosRef.current
    setIsUploading(true)
    uploadImage(file)
      .then((url) => {
        if (url) {
          insertAt(pos, { type: 'image', attrs: { src: url } })
        } else {
          alert('图片上传失败，请确保 Supabase Storage 已配置 Policies 允许上传。')
        }
      })
      .finally(() => {
        setIsUploading(false)
        pendingImagePosRef.current = null
        if (fileInputRef.current) fileInputRef.current.value = ''
      })
  }

  const closeMenus = () => {
    setTopMenuOpen(false)
    setFloatingTarget(null)
    setStyleTarget(null)
    setInsertQuery('')
  }

  const run = (action: InsertItem['action'], pos: number | null) => {
    action(pos)
    closeMenus()
  }

  const applyBlockStyle = (pos: number, action: () => void) => {
    editor.chain().focus().setTextSelection(pos).run()
    action()
    closeMenus()
  }

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

  const menu = (pos: number | null) => (
    <InsertMenu query={insertQuery} onQueryChange={setInsertQuery}>
      {visibleGroups.map((group) => (
        <section key={group.title} className="doc-insert-group">
          <h3>{group.title}</h3>
          <div>
            {group.items.map((item) => {
              const Icon = item.icon

              return (
                <button key={`${group.title}-${item.title}`} type="button" onClick={() => run(item.action, pos)}>
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
    </InsertMenu>
  )

  return (
    <div className="doc-editor-toolbar" aria-label="插入内容块">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadInlineImage} />
      <Popover
        open={topMenuOpen}
        onOpenChange={(nextOpen) => {
          setTopMenuOpen(nextOpen)
          if (nextOpen) {
            setFloatingTarget(null)
            setStyleTarget(null)
            setInsertQuery('')
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="doc-insert-trigger" aria-label="插入内容块">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span>插入块</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="doc-insert-menu">
          {menu(null)}
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
      {floatingTarget ? (
        <div
          className="doc-floating-insert"
          style={getFloatingMenuStyle(floatingTarget, { width: 560, height: 560 })}
        >
          <div className="doc-floating-insert-header">
            <GripVertical className="h-4 w-4" />
            <span>在此处插入</span>
            <button type="button" onClick={closeMenus} aria-label="关闭插入菜单">
              ×
            </button>
          </div>
          {menu(floatingTarget.pos)}
        </div>
      ) : null}
      {styleTarget ? (
        <div
          className="doc-floating-style"
          style={getFloatingMenuStyle(styleTarget, { width: 240, height: 360 })}
          aria-label="修改块样式"
        >
          <div className="doc-floating-insert-header">
            <GripVertical className="h-4 w-4" />
            <span>块样式</span>
            <button type="button" onClick={closeMenus} aria-label="关闭块样式菜单">
              ×
            </button>
          </div>
          <div className="doc-style-menu">
            <button type="button" onClick={() => applyBlockStyle(styleTarget.pos, () => editor.chain().focus().setParagraph().run())}>
              <FileText className="h-4 w-4" />
              <span>正文</span>
            </button>
            <button
              type="button"
              onClick={() => applyBlockStyle(styleTarget.pos, () => editor.chain().focus().setNode('heading', { level: 1 }).run())}
            >
              <Heading1 className="h-4 w-4" />
              <span>一级标题</span>
            </button>
            <button
              type="button"
              onClick={() => applyBlockStyle(styleTarget.pos, () => editor.chain().focus().setNode('heading', { level: 2 }).run())}
            >
              <Heading2 className="h-4 w-4" />
              <span>二级标题</span>
            </button>
            <button
              type="button"
              onClick={() => applyBlockStyle(styleTarget.pos, () => editor.chain().focus().setNode('heading', { level: 3 }).run())}
            >
              <Heading3 className="h-4 w-4" />
              <span>三级标题</span>
            </button>
            <button
              type="button"
              onClick={() => applyBlockStyle(styleTarget.pos, () => editor.chain().focus().toggleBulletList().run())}
            >
              <List className="h-4 w-4" />
              <span>无序列表</span>
            </button>
            <button
              type="button"
              onClick={() => applyBlockStyle(styleTarget.pos, () => editor.chain().focus().toggleOrderedList().run())}
            >
              <ListOrdered className="h-4 w-4" />
              <span>有序列表</span>
            </button>
            <button
              type="button"
              onClick={() => applyBlockStyle(styleTarget.pos, () => editor.chain().focus().toggleBlockquote().run())}
            >
              <Quote className="h-4 w-4" />
              <span>引用</span>
            </button>
            <button
              type="button"
              onClick={() => applyBlockStyle(styleTarget.pos, () => editor.chain().focus().toggleCodeBlock().run())}
            >
              <CodeSquare className="h-4 w-4" />
              <span>代码块</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function InsertMenu({
  query,
  onQueryChange,
  children,
}: {
  query: string
  onQueryChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <>
      <label className="doc-insert-search">
        <Search className="h-4 w-4" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="搜索块，或在空行输入 /"
          autoFocus
        />
      </label>
      {children}
    </>
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getFloatingMenuStyle(
  target: InsertTarget,
  size: {
    width: number
    height: number
  },
): FloatingMenuStyle {
  if (typeof window === 'undefined') {
    return { left: target.x, top: target.y }
  }

  return {
    left: clamp(target.x, 16, Math.max(16, window.innerWidth - size.width)),
    top: clamp(target.y, 72, Math.max(72, window.innerHeight - size.height)),
  }
}
