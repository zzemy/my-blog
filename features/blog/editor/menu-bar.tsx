'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import type { Content, Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { toast } from 'sonner'
import {
  Bold,
  Code,
  CodeSquare,
  FileText,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Plus,
  Quote,
  Redo,
  Search,
  Undo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { uploadImage } from '@/lib/upload-image'
import { editorInsertRegistry } from './rich-block-registry'
import type { EditorInsertDefinition } from './rich-block-registry'

interface MenuBarProps {
  editor: Editor
}

type InsertTarget = {
  pos: number
  anchorPos: number
  x: number
  y: number
  source?: 'block' | 'cursor'
}

type BlockHandleTarget = InsertTarget & {
  canStyle: boolean
  stylePos: number
}

type FloatingMenuStyle = {
  left: number
  top: number
}

type InsertItem = {
  title: EditorInsertDefinition['title']
  description: EditorInsertDefinition['description']
  icon: EditorInsertDefinition['icon']
  action: (pos: number | null) => void
}

type InsertGroup = {
  title: string
  items: InsertItem[]
}

export function MenuBar({ editor }: MenuBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingImagePosRef = useRef<number | null>(null)
  const blockHandleHideTimerRef = useRef<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [topMenuOpen, setTopMenuOpen] = useState(false)
  const [blockHandleTarget, setBlockHandleTarget] = useState<BlockHandleTarget | null>(null)
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

  const closeMenus = useCallback(() => {
    setTopMenuOpen(false)
    setFloatingTarget(null)
    setStyleTarget(null)
    setInsertQuery('')
  }, [])

  const openFloatingMenu = useCallback((target: InsertTarget) => {
    setTopMenuOpen(false)
    setStyleTarget(null)
    setFloatingTarget(resolveFloatingTarget(editor, target))
    setInsertQuery('')
  }, [editor])

  const openStyleMenu = useCallback((target: InsertTarget) => {
    setTopMenuOpen(false)
    setFloatingTarget(null)
    setStyleTarget(resolveFloatingTarget(editor, target))
  }, [editor])

  const clearBlockHandleHideTimer = useCallback(() => {
    if (blockHandleHideTimerRef.current === null) return

    window.clearTimeout(blockHandleHideTimerRef.current)
    blockHandleHideTimerRef.current = null
  }, [])

  const scheduleBlockHandleHide = useCallback(() => {
    clearBlockHandleHideTimer()

    blockHandleHideTimerRef.current = window.setTimeout(() => {
      setBlockHandleTarget(null)
      blockHandleHideTimerRef.current = null
    }, 1600)
  }, [clearBlockHandleHideTimer])

  const insertGroups: InsertGroup[] = editorInsertRegistry.map((group) => ({
    title: group.title,
    items: group.items.map((item) => ({
      title: item.title,
      description: item.description,
      icon: item.icon,
      action: (pos) => {
        if (item.action === 'uploadImage') {
          pendingImagePosRef.current = pos
          fileInputRef.current?.click()
          return
        }

        if (item.action === 'insertTable') {
          focusAt(pos).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          return
        }

        if (item.content) {
          insertAt(pos, item.content)
        }
      },
    })),
  }))

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
      openFloatingMenu({
        pos: selection.from,
        anchorPos: selection.from,
        x: coords.left,
        y: coords.bottom + 8,
        source: 'cursor',
      })
    }

    const updateBlockHandle = (event: MouseEvent) => {
      clearBlockHandleHideTimer()
      const target = resolveBlockHandleTarget(editor, event.clientX, event.clientY)
      setBlockHandleTarget(target)
    }

    const hideBlockHandle = (event: MouseEvent) => {
      if (floatingTarget || styleTarget) return
      if (event.relatedTarget instanceof HTMLElement && event.relatedTarget.closest('.doc-block-handle')) return

      scheduleBlockHandleHide()
    }

    dom.addEventListener('keydown', openWithSlash)
    dom.addEventListener('mousemove', updateBlockHandle)
    dom.addEventListener('mouseleave', hideBlockHandle)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      dom.removeEventListener('keydown', openWithSlash)
      dom.removeEventListener('mousemove', updateBlockHandle)
      dom.removeEventListener('mouseleave', hideBlockHandle)
      document.removeEventListener('keydown', closeOnEscape)
      clearBlockHandleHideTimer()
    }
  }, [clearBlockHandleHideTimer, closeMenus, editor, floatingTarget, openFloatingMenu, scheduleBlockHandleHide, styleTarget])

  useEffect(() => {
    if (!blockHandleTarget && !floatingTarget && !styleTarget) return

    let frame = 0
    const updateFloatingPosition = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        setBlockHandleTarget((target) => (target ? resolveBlockHandleTargetAtPos(editor, target.anchorPos) : target))
        setFloatingTarget((target) => (target ? resolveFloatingTarget(editor, target) : target))
        setStyleTarget((target) => (target ? resolveFloatingTarget(editor, target) : target))
      })
    }

    window.addEventListener('scroll', updateFloatingPosition, true)
    window.addEventListener('resize', updateFloatingPosition)
    editor.on('transaction', updateFloatingPosition)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', updateFloatingPosition, true)
      window.removeEventListener('resize', updateFloatingPosition)
      editor.off('transaction', updateFloatingPosition)
    }
  }, [blockHandleTarget, editor, floatingTarget, styleTarget])

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
          toast.error('图片上传失败，请确保 Supabase Storage 已配置 Policies 允许上传。')
        }
      })
      .finally(() => {
        setIsUploading(false)
        pendingImagePosRef.current = null
        if (fileInputRef.current) fileInputRef.current.value = ''
      })
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
      {blockHandleTarget ? (
        <div
          className="doc-block-handle"
          style={{
            left: blockHandleTarget.x,
            top: blockHandleTarget.y,
          }}
          onMouseEnter={() => {
            clearBlockHandleHideTimer()
            setBlockHandleTarget(blockHandleTarget)
          }}
          onMouseLeave={() => {
            if (!floatingTarget && !styleTarget) scheduleBlockHandleHide()
          }}
        >
          <button
            type="button"
            className="doc-block-insert-button"
            onMouseDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              openFloatingMenu({
                ...blockHandleTarget,
                x: blockHandleTarget.x + 96,
                source: 'block',
              })
            }}
            aria-label="在当前块后插入内容块"
          >
            <Plus className="h-4 w-4" />
          </button>
          {blockHandleTarget.canStyle ? (
            <button
              type="button"
              className="doc-block-style-button"
              onMouseDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                openStyleMenu({
                  ...blockHandleTarget,
                  pos: blockHandleTarget.stylePos,
                  x: blockHandleTarget.x + 96,
                  source: 'block',
                })
              }}
              aria-label="修改当前块样式"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}
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

function resolveBlockHandleTarget(editor: Editor, clientX: number, clientY: number): BlockHandleTarget | null {
  const coords = editor.view.posAtCoords({ left: clientX, top: clientY })
  if (!coords) return null

  return resolveBlockHandleTargetAtDocPos(editor, coords.pos)
}

function resolveBlockHandleTargetAtPos(editor: Editor, anchorPos: number): BlockHandleTarget | null {
  return resolveBlockHandleTargetAtDocPos(editor, Math.min(anchorPos + 1, editor.state.doc.content.size))
}

function resolveBlockHandleTargetAtDocPos(editor: Editor, pos: number): BlockHandleTarget | null {
  if (typeof window === 'undefined') return null

  try {
    const docSize = editor.state.doc.content.size
    if (docSize <= 0) return null

    const $pos = editor.state.doc.resolve(clamp(pos, 0, docSize))
    const depth = Math.min($pos.depth, 1)
    if (depth < 1) return null

    const node = $pos.node(depth)
    const anchorPos = $pos.before(depth)
    const dom = editor.view.nodeDOM(anchorPos)
    if (!(dom instanceof HTMLElement)) return null

    const blockRect = dom.getBoundingClientRect()
    if (blockRect.bottom < 76 || blockRect.top > window.innerHeight - 32) return null

    const left = Math.max(12, blockRect.left - 98)
    const top = blockRect.top + 2

    return {
      pos: Math.min(anchorPos + node.nodeSize, docSize),
      anchorPos,
      stylePos: Math.min(anchorPos + 1, docSize),
      x: left,
      y: top,
      canStyle: node.isTextblock,
      source: 'block',
    }
  } catch {
    return null
  }
}

function resolveFloatingTarget(editor: Editor, target: InsertTarget): InsertTarget | null {
  if (typeof window === 'undefined') return target

  try {
    if (target.source === 'block') {
      const blockTarget = resolveBlockHandleTargetAtPos(editor, target.anchorPos)
      if (!blockTarget) return null

      return {
        ...target,
        anchorPos: blockTarget.anchorPos,
        x: blockTarget.x + 96,
        y: blockTarget.y,
      }
    }

    const docSize = editor.state.doc.content.size
    const anchorPos = clamp(target.anchorPos, 0, docSize)
    const coords = editor.view.coordsAtPos(anchorPos)

    return {
      ...target,
      anchorPos,
      x: coords.left,
      y: coords.bottom + 8,
    }
  } catch {
    return target
  }
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
