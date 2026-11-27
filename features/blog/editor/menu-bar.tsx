'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { Content, Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { NodeSelection } from '@tiptap/pm/state'
import { toast } from 'sonner'
import {
  ArrowDown,
  ArrowUp,
  Bold,
  CheckSquare,
  Code,
  CodeSquare,
  Columns3,
  Copy,
  FileText,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Plus,
  Quote,
  Redo,
  Rows3,
  Search,
  Strikethrough,
  Table,
  Trash2,
  Underline as UnderlineIcon,
  Undo,
  Unlink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MediaPickerDialog } from '@/features/admin/posts/media-picker-dialog'
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
  blockIndex: number
  blockCount: number
}

type FloatingMenuStyle = {
  left: number
  top: number
}

type InsertItem = {
  id: string
  groupTitle: string
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
  const floatingInsertRef = useRef<HTMLDivElement>(null)
  const floatingStyleRef = useRef<HTMLDivElement>(null)
  const blockHandleRef = useRef<HTMLDivElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [topMenuOpen, setTopMenuOpen] = useState(false)
  const [blockHandleTarget, setBlockHandleTarget] = useState<BlockHandleTarget | null>(null)
  const [floatingTarget, setFloatingTarget] = useState<InsertTarget | null>(null)
  const [styleTarget, setStyleTarget] = useState<BlockHandleTarget | null>(null)
  const [insertQuery, setInsertQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [, setEditorTick] = useState(0)

  const insertAt = useCallback(
    (pos: number | null, content: Content) => {
      const chain = editor.chain().focus()

      if (typeof pos === 'number') {
        chain.insertContentAt(pos, content).run()
        return
      }

      chain.insertContent(content).run()
    },
    [editor],
  )

  const focusAt = useCallback(
    (pos: number | null) => {
      const chain = editor.chain().focus()
      return typeof pos === 'number' ? chain.setTextSelection(pos) : chain
    },
    [editor],
  )

  const closeMenus = useCallback(() => {
    setTopMenuOpen(false)
    setFloatingTarget(null)
    setStyleTarget(null)
    setInsertQuery('')
    setSelectedIndex(0)
  }, [])

  const openFloatingMenu = useCallback(
    (target: InsertTarget) => {
      setTopMenuOpen(false)
      setStyleTarget(null)
      setFloatingTarget(resolveFloatingTarget(editor, target))
      setInsertQuery('')
      setSelectedIndex(0)
    },
    [editor],
  )

  const openStyleMenu = useCallback(
    (target: BlockHandleTarget) => {
      setTopMenuOpen(false)
      setFloatingTarget(null)
      const resolved = resolveBlockHandleTargetAtPos(editor, target.anchorPos)
      setStyleTarget(
        resolved
          ? {
              ...resolved,
              pos: resolved.stylePos,
              x: resolved.x + 64,
              source: 'block',
            }
          : target,
      )
    },
    [editor],
  )

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
    }, 1400)
  }, [clearBlockHandleHideTimer])

  useEffect(() => {
    const bump = () => setEditorTick((tick) => tick + 1)
    editor.on('selectionUpdate', bump)
    editor.on('transaction', bump)
    return () => {
      editor.off('selectionUpdate', bump)
      editor.off('transaction', bump)
    }
  }, [editor])

  const insertGroups: InsertGroup[] = useMemo(
    () =>
      editorInsertRegistry.map((group) => ({
        title: group.title,
        items: group.items.map((item) => ({
          id: `${group.title}-${item.title}`,
          groupTitle: group.title,
          title: item.title,
          description: item.description,
          icon: item.icon,
          action: (pos) => {
            if (item.action === 'uploadImage') {
              pendingImagePosRef.current = pos
              fileInputRef.current?.click()
              return
            }

            if (item.action === 'pickMediaImage') {
              pendingImagePosRef.current = pos
              setMediaPickerOpen(true)
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
      })),
    [focusAt, insertAt],
  )

  useEffect(() => {
    const dom = editor.view.dom

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenus()
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (floatingInsertRef.current?.contains(target)) return
      if (floatingStyleRef.current?.contains(target)) return
      if (blockHandleRef.current?.contains(target)) return

      if (floatingTarget || styleTarget) {
        setFloatingTarget(null)
        setStyleTarget(null)
        setInsertQuery('')
        setSelectedIndex(0)
      }
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
    document.addEventListener('mousedown', closeOnOutsideClick)

    return () => {
      dom.removeEventListener('keydown', openWithSlash)
      dom.removeEventListener('mousemove', updateBlockHandle)
      dom.removeEventListener('mouseleave', hideBlockHandle)
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('mousedown', closeOnOutsideClick)
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
        setStyleTarget((target) => {
          if (!target) return target
          const resolved = resolveBlockHandleTargetAtPos(editor, target.anchorPos)
          return resolved
            ? {
                ...resolved,
                pos: resolved.stylePos,
                x: resolved.x + 64,
                source: 'block',
              }
            : null
        })
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

  const run = useCallback(
    (action: InsertItem['action'], pos: number | null) => {
      action(pos)
      closeMenus()
    },
    [closeMenus],
  )

  const applyBlockStyle = (pos: number, action: () => void) => {
    editor.chain().focus().setTextSelection(pos).run()
    action()
    closeMenus()
  }

  const moveBlock = (anchorPos: number, direction: -1 | 1) => {
    const info = findTopLevelBlock(editor, anchorPos)
    if (!info) return

    const targetIndex = info.index + direction
    if (targetIndex < 0 || targetIndex >= info.blocks.length) return

    const current = info.blocks[info.index]
    const neighbor = info.blocks[targetIndex]
    const tr = editor.state.tr

    if (direction === -1) {
      tr.replaceWith(neighbor.offset, current.offset + current.node.nodeSize, [current.node, neighbor.node])
    } else {
      tr.replaceWith(current.offset, neighbor.offset + neighbor.node.nodeSize, [neighbor.node, current.node])
    }

    editor.view.dispatch(tr)
    editor.commands.focus()
    closeMenus()
  }

  const duplicateBlock = (anchorPos: number) => {
    const info = findTopLevelBlock(editor, anchorPos)
    if (!info) return

    const current = info.blocks[info.index]
    const attrs = current.node.attrs && 'openEditor' in current.node.attrs
      ? { ...current.node.attrs, openEditor: false }
      : current.node.attrs
    const cloned = current.node.type.create(attrs, current.node.content, current.node.marks)
    const tr = editor.state.tr.insert(current.offset + current.node.nodeSize, cloned)
    editor.view.dispatch(tr)
    editor.commands.focus()
    closeMenus()
  }

  const deleteBlock = (anchorPos: number) => {
    const info = findTopLevelBlock(editor, anchorPos)
    if (!info) return

    const current = info.blocks[info.index]
    const tr = editor.state.tr.delete(current.offset, current.offset + current.node.nodeSize)
    editor.view.dispatch(tr)
    editor.commands.focus()
    closeMenus()
  }

  const normalizedQuery = insertQuery.trim().toLowerCase()
  const visibleGroups = useMemo(
    () =>
      insertGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            if (!normalizedQuery) return true
            return `${group.title} ${item.title} ${item.description}`.toLowerCase().includes(normalizedQuery)
          }),
        }))
        .filter((group) => group.items.length > 0),
    [insertGroups, normalizedQuery],
  )

  const flatVisibleItems = useMemo(
    () => visibleGroups.flatMap((group) => group.items),
    [visibleGroups],
  )

  const clampedSelectedIndex = flatVisibleItems.length > 0
    ? Math.min(selectedIndex, flatVisibleItems.length - 1)
    : 0

  const handleInsertKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>, pos: number | null) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!flatVisibleItems.length) return
      setSelectedIndex((current) => (current + 1) % flatVisibleItems.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!flatVisibleItems.length) return
      setSelectedIndex((current) => (current - 1 + flatVisibleItems.length) % flatVisibleItems.length)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const chosen = flatVisibleItems[clampedSelectedIndex]
      if (chosen) {
        run(chosen.action, pos)
      }
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeMenus()
      editor.commands.focus()
      return
    }

    if (event.key === 'Backspace' && !insertQuery) {
      event.preventDefault()
      closeMenus()
      editor.commands.focus()
    }
  }

  const renderInsertMenu = (pos: number | null) => {
    let runningIndex = 0

    return (
      <InsertMenu
        query={insertQuery}
        onQueryChange={(value) => {
          setInsertQuery(value)
          setSelectedIndex(0)
        }}
        onKeyDown={(event) => handleInsertKeyDown(event, pos)}
      >
        {visibleGroups.map((group) => (
          <section key={group.title} className="doc-insert-group">
            <h3>{group.title}</h3>
            <div>
              {group.items.map((item) => {
                const Icon = item.icon
                const itemIndex = runningIndex
                runningIndex += 1
                const isSelected = itemIndex === clampedSelectedIndex

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={isSelected ? 'is-selected' : undefined}
                    data-selected={isSelected ? 'true' : undefined}
                    ref={(node) => {
                      if (isSelected && node) {
                        node.scrollIntoView({ block: 'nearest' })
                      }
                    }}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    onClick={() => run(item.action, pos)}
                  >
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
  }

  const inTable = editor.isActive('table')

  return (
    <div className="doc-editor-toolbar" aria-label="插入内容块">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadInlineImage} />
      <MediaPickerDialog
        open={mediaPickerOpen}
        onOpenChange={(nextOpen) => {
          setMediaPickerOpen(nextOpen)
          if (!nextOpen) pendingImagePosRef.current = null
        }}
        onSelect={(url) => {
          insertAt(pendingImagePosRef.current, { type: 'image', attrs: { src: url } })
          pendingImagePosRef.current = null
        }}
        title="插入媒体库图片"
        description="点击任意已上传图片插入到正文，或上传一张新图片。"
      />
      <Popover
        open={topMenuOpen}
        onOpenChange={(nextOpen) => {
          setTopMenuOpen(nextOpen)
          if (nextOpen) {
            setFloatingTarget(null)
            setStyleTarget(null)
            setInsertQuery('')
            setSelectedIndex(0)
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
          {renderInsertMenu(null)}
        </PopoverContent>
      </Popover>
      <div className="doc-history-actions" aria-label="历史操作">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria-label="撤销"
          title="撤销 (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria-label="重做"
          title="重做 (Ctrl+Shift+Z)"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>
      {inTable ? (
        <div className="doc-table-actions" role="toolbar" aria-label="表格操作">
          <span className="doc-table-badge">
            <Table className="h-3.5 w-3.5" />
            表格
          </span>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowBefore().run()}
            title="在上方插入行"
          >
            <Rows3 className="h-3.5 w-3.5" />
            上插行
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            title="在下方插入行"
          >
            下插行
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            title="删除当前行"
          >
            删行
          </button>
          <span className="doc-table-divider" aria-hidden="true" />
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            title="在左侧插入列"
          >
            <Columns3 className="h-3.5 w-3.5" />
            左插列
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            title="在右侧插入列"
          >
            右插列
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            title="删除当前列"
          >
            删列
          </button>
          <span className="doc-table-divider" aria-hidden="true" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            title="切换表头行"
          >
            表头
          </button>
          <button
            type="button"
            className="is-danger"
            onClick={() => editor.chain().focus().deleteTable().run()}
            title="删除整个表格"
          >
            <Trash2 className="h-3.5 w-3.5" />
            删表
          </button>
        </div>
      ) : null}
      {blockHandleTarget ? (
        <div
          ref={blockHandleRef}
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
                x: blockHandleTarget.x + 64,
                source: 'block',
              })
            }}
            aria-label="在当前块后插入内容块"
            title="在下方插入块"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="doc-block-style-button"
            onMouseDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              openStyleMenu({
                ...blockHandleTarget,
                pos: blockHandleTarget.stylePos,
                x: blockHandleTarget.x + 64,
                source: 'block',
              })
            }}
            aria-label="块操作与样式"
            title="块操作 / 样式转换"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
      {floatingTarget ? (
        <div
          ref={floatingInsertRef}
          className="doc-floating-insert"
          style={getFloatingMenuStyle(floatingTarget, { width: 380, height: 520 })}
        >
          <div className="doc-floating-insert-header">
            <GripVertical className="h-4 w-4" />
            <span>在此处插入</span>
            <small className="doc-floating-shortcut">↑↓ 选择 · Enter 确认</small>
            <button type="button" onClick={closeMenus} aria-label="关闭插入菜单">
              ×
            </button>
          </div>
          {renderInsertMenu(floatingTarget.pos)}
        </div>
      ) : null}
      {styleTarget ? (
        <div
          ref={floatingStyleRef}
          className="doc-floating-style"
          style={getFloatingMenuStyle(styleTarget, { width: 240, height: styleTarget.canStyle ? 480 : 210 })}
          aria-label="块操作与样式"
        >
          <div className="doc-floating-insert-header">
            <GripVertical className="h-4 w-4" />
            <span>{styleTarget.canStyle ? '转换为 / 块操作' : '块操作'}</span>
            <button type="button" onClick={closeMenus} aria-label="关闭块操作菜单">
              ×
            </button>
          </div>
          {styleTarget.canStyle ? (
            <div className="doc-style-menu">
              <button
                type="button"
                onClick={() => applyBlockStyle(styleTarget.pos, () => editor.chain().focus().setParagraph().run())}
              >
                <FileText className="h-4 w-4" />
                <span>正文</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  applyBlockStyle(styleTarget.pos, () => editor.chain().focus().setNode('heading', { level: 1 }).run())
                }
              >
                <Heading1 className="h-4 w-4" />
                <span>一级标题</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  applyBlockStyle(styleTarget.pos, () => editor.chain().focus().setNode('heading', { level: 2 }).run())
                }
              >
                <Heading2 className="h-4 w-4" />
                <span>二级标题</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  applyBlockStyle(styleTarget.pos, () => editor.chain().focus().setNode('heading', { level: 3 }).run())
                }
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
                onClick={() =>
                  applyBlockStyle(styleTarget.pos, () => editor.chain().focus().toggleOrderedList().run())
                }
              >
                <ListOrdered className="h-4 w-4" />
                <span>有序列表</span>
              </button>
              <button
                type="button"
                onClick={() => applyBlockStyle(styleTarget.pos, () => editor.chain().focus().toggleTaskList().run())}
              >
                <CheckSquare className="h-4 w-4" />
                <span>任务列表</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  applyBlockStyle(styleTarget.pos, () => editor.chain().focus().toggleBlockquote().run())
                }
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
          ) : null}
          <div className="doc-style-menu doc-style-actions">
            <button
              type="button"
              disabled={styleTarget.blockIndex <= 0}
              onClick={() => moveBlock(styleTarget.anchorPos, -1)}
            >
              <ArrowUp className="h-4 w-4" />
              <span>上移此块</span>
            </button>
            <button
              type="button"
              disabled={styleTarget.blockIndex >= styleTarget.blockCount - 1}
              onClick={() => moveBlock(styleTarget.anchorPos, 1)}
            >
              <ArrowDown className="h-4 w-4" />
              <span>下移此块</span>
            </button>
            <button type="button" onClick={() => duplicateBlock(styleTarget.anchorPos)}>
              <Copy className="h-4 w-4" />
              <span>复制此块</span>
            </button>
            <button type="button" className="is-danger" onClick={() => deleteBlock(styleTarget.anchorPos)}>
              <Trash2 className="h-4 w-4" />
              <span>删除此块</span>
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
  onKeyDown,
  children,
}: {
  query: string
  onQueryChange: (value: string) => void
  onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void
  children: React.ReactNode
}) {
  return (
    <>
      <label className="doc-insert-search">
        <Search className="h-4 w-4" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={onKeyDown}
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
    <BubbleMenu
      editor={editor}
      className="doc-selection-menu"
      shouldShow={({ state }) => {
        if (state.selection.empty) return false
        if (state.selection instanceof NodeSelection) return false
        return true
      }}
    >
      <button
        type="button"
        className={editor.isActive('bold') ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label="加粗"
        title="加粗 (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={editor.isActive('italic') ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label="斜体"
        title="斜体 (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={editor.isActive('underline') ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="下划线"
        title="下划线 (Ctrl+U)"
      >
        <UnderlineIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={editor.isActive('strike') ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        aria-label="删除线"
        title="删除线"
      >
        <Strikethrough className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={editor.isActive('highlight') ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        aria-label="高亮"
        title="高亮标记"
      >
        <Highlighter className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={editor.isActive('code') ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleCode().run()}
        aria-label="行内代码"
        title="行内代码"
      >
        <Code className="h-4 w-4" />
      </button>
      <span className="doc-selection-divider" aria-hidden="true" />
      <button
        type="button"
        className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        aria-label="一级标题"
        title="一级标题"
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="二级标题"
        title="二级标题"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        aria-label="三级标题"
        title="三级标题"
      >
        <Heading3 className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={editor.isActive('blockquote') ? 'is-active' : ''}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="引用"
        title="引用"
      >
        <Quote className="h-4 w-4" />
      </button>
      <span className="doc-selection-divider" aria-hidden="true" />
      <button
        type="button"
        className={editor.isActive('link') ? 'is-active' : ''}
        onClick={openLinkInput}
        aria-label="链接"
        title="添加或编辑链接"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
      {editor.isActive('link') && !linkInputOpen ? (
        <button
          type="button"
          onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}
          aria-label="取消链接"
          title="取消链接"
        >
          <Unlink className="h-4 w-4" />
        </button>
      ) : null}
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
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                setLinkInputOpen(false)
                editor.commands.focus()
              }
            }}
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

function findTopLevelBlock(editor: Editor, anchorPos: number) {
  const blocks: { node: ReturnType<Editor['state']['doc']['child']>; offset: number }[] = []
  let foundIndex = -1

  editor.state.doc.forEach((node, offset, index) => {
    blocks.push({ node, offset })
    if (offset === anchorPos) {
      foundIndex = index
    }
  })

  if (foundIndex < 0) return null
  return { blocks, index: foundIndex }
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
    let anchorPos = 0
    let node = editor.state.doc.firstChild
    if (!node) return null

    if ($pos.depth >= 1) {
      node = $pos.node(1)
      anchorPos = $pos.before(1)
    } else {
      const candidate = $pos.nodeAfter ?? $pos.nodeBefore
      if (!candidate) return null
      node = candidate
      anchorPos = $pos.nodeAfter ? $pos.pos : $pos.pos - candidate.nodeSize
    }

    const dom = editor.view.nodeDOM(anchorPos)
    if (!(dom instanceof HTMLElement)) return null

    const blockRect = dom.getBoundingClientRect()
    if (blockRect.bottom < 76 || blockRect.top > window.innerHeight - 32) return null

    const info = findTopLevelBlock(editor, anchorPos)
    const left = Math.max(10, blockRect.left - 64)
    const top = blockRect.top + 3

    return {
      pos: Math.min(anchorPos + node.nodeSize, docSize),
      anchorPos,
      stylePos: Math.min(anchorPos + 1, docSize),
      x: left,
      y: top,
      canStyle: node.isTextblock,
      blockIndex: info?.index ?? 0,
      blockCount: info?.blocks.length ?? 1,
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
        x: blockTarget.x + 64,
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
