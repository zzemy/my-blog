'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, FolderOpen, Pencil, Save, Trash2, X } from 'lucide-react'
import { MediaPickerDialog } from '@/features/admin/posts/media-picker-dialog'
import type { RichImageItem } from './rich-block-extensions'

type RichBlockEditorPanelProps = {
  title: string
  children: ReactNode
  onCancel: () => void
  onSave: () => void
  onDelete?: () => void
  placement?: 'inline' | 'inspector'
}

type TextFieldProps = {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}

type SelectFieldProps<T extends string> = {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

export type PanelItem = {
  title: string
  text: string
}

export type CardItem = {
  eyebrow: string
  title: string
  text: string
}

export type DiagramItem = {
  label: string
}

export type TimelineItem = {
  label: string
  title: string
  text: string
}

export function RichBlockEditButton({ onClick, label = '编辑组件' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      className="component-block-edit-button"
      onMouseDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
      onPointerDown={(event) => {
        event.stopPropagation()
      }}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onClick()
      }}
      contentEditable={false}
      data-editor-control="true"
      aria-label={label}
    >
      <Pencil className="h-3.5 w-3.5" />
      <span>编辑</span>
    </button>
  )
}

export function RichBlockEditorPanel({
  title,
  children,
  onCancel,
  onSave,
  onDelete,
  placement = 'inspector',
}: RichBlockEditorPanelProps) {
  const panelId = useId()
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [inspectorHost, setInspectorHost] = useState<HTMLElement | null>(null)
  const [insideDialog, setInsideDialog] = useState(false)

  // 确保同一时间只展开一个富文本块检查器
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('admin-rich-block-activate', { detail: { panelId } }))
    const handleOtherActivate = (event: Event) => {
      const detail = (event as CustomEvent<{ panelId?: string }>).detail
      if (detail?.panelId && detail.panelId !== panelId) {
        onCancel()
      }
    }
    window.addEventListener('admin-rich-block-activate', handleOtherActivate)
    return () => {
      window.removeEventListener('admin-rich-block-activate', handleOtherActivate)
    }
  }, [panelId, onCancel])

  useEffect(() => {
    if (placement !== 'inspector') return

    // 若编辑器处于弹窗（如译文精修 Dialog）内部，直接就地内联渲染，避免被弹窗遮罩盖住
    if (anchorRef.current?.closest('[role="dialog"]')) {
      setInsideDialog(true)
      setInspectorHost(null)
      return
    }

    window.dispatchEvent(new CustomEvent('admin-rich-block-edit-open'))

    const resolveHost = () => {
      const host = document.getElementById('admin-rich-block-inspector')
      if (host) {
        setInspectorHost(host)
        return true
      }
      return false
    }

    if (resolveHost()) return

    const frame = window.requestAnimationFrame(() => {
      resolveHost()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [placement])

  const panel = (
    <div
      className="component-block-editor"
      contentEditable={false}
      data-editor-control="true"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          onCancel()
        } else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault()
          event.stopPropagation()
          onSave()
        }
      }}
    >
      <div className="component-block-editor-header">
        <strong>{title}</strong>
      </div>
      {children}
      <div className="component-block-editor-actions">
        {onDelete ? (
          <button type="button" className="component-block-delete-button" onClick={onDelete} contentEditable={false}>
            <Trash2 className="h-3.5 w-3.5" />
            删除组件
          </button>
        ) : null}
        <button type="button" onClick={onCancel} contentEditable={false}>
          <X className="h-3.5 w-3.5" />
          取消
        </button>
        <button type="button" onClick={onSave} contentEditable={false}>
          <Save className="h-3.5 w-3.5" />
          保存
        </button>
      </div>
    </div>
  )

  if (placement === 'inspector' && inspectorHost && !insideDialog) {
    return (
      <>
        <span ref={anchorRef} className="hidden" />
        {createPortal(panel, inspectorHost)}
      </>
    )
  }

  return (
    <>
      <span ref={anchorRef} className="hidden" />
      {panel}
    </>
  )
}

export function TextField({ label, value, placeholder, onChange }: TextFieldProps) {
  return (
    <label>
      <span>{label}</span>
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

export function TextAreaField({ label, value, placeholder, onChange }: TextFieldProps) {
  return (
    <label className="component-block-editor-wide">
      <span>{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

export function SelectField<T extends string>({ label, value, options, onChange }: SelectFieldProps<T>) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ensurePanelItems(items: PanelItem[]) {
  return items.length ? items : [{ title: '标题', text: '内容' }]
}

export function ensureImageItems(items: RichImageItem[]) {
  return items.length ? items : [{ src: '', file: 'image-1.jpg', alt: '图片说明：image-1.jpg' }]
}

export function ensureCardItems(items: CardItem[]) {
  return items.length ? items : [{ eyebrow: '分类', title: '卡片标题', text: '卡片内容' }]
}

export function ensureDiagramItems(items: DiagramItem[]) {
  return items.length ? items : [{ label: '节点' }]
}

export function ensureTimelineItems(items: TimelineItem[]) {
  return items.length ? items : [{ label: '阶段', title: '标题', text: '内容' }]
}

function moveItemAt<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

function RowOrderControls({
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  index: number
  total: number
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-1.5 pt-1">
      <button type="button" disabled={index === 0} onClick={onMoveUp} title="上移" aria-label="上移">
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button type="button" disabled={index === total - 1} onClick={onMoveDown} title="下移" aria-label="下移">
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onRemove}>
        删除
      </button>
    </div>
  )
}

export function PanelItemsEditor({
  items,
  onChange,
  addLabel,
}: {
  items: PanelItem[]
  onChange: (items: PanelItem[]) => void
  addLabel: string
}) {
  return (
    <div className="component-block-editor-wide component-block-editor-list">
      {items.map((item, index) => (
        <div key={index} className="component-block-editor-row">
          <TextField
            label="标题"
            value={item.title}
            onChange={(value) => onChange(updateItemAt(items, index, { ...item, title: value }))}
          />
          <TextAreaField
            label="内容"
            value={item.text}
            onChange={(value) => onChange(updateItemAt(items, index, { ...item, text: value }))}
          />
          <RowOrderControls
            index={index}
            total={items.length}
            onMoveUp={() => onChange(moveItemAt(items, index, index - 1))}
            onMoveDown={() => onChange(moveItemAt(items, index, index + 1))}
            onRemove={() => onChange(removeItemAt(items, index))}
          />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { title: '标题', text: '内容' }])}>
        {addLabel}
      </button>
    </div>
  )
}

export function ImageItemsEditor({
  items,
  onChange,
  addLabel,
}: {
  items: RichImageItem[]
  onChange: (items: RichImageItem[]) => void
  addLabel: string
}) {
  const [pickerIndex, setPickerIndex] = useState<number | null>(null)

  return (
    <div className="component-block-editor-wide component-block-editor-list">
      {items.map((item, index) => (
        <div key={index} className="component-block-editor-row">
          <TextField
            label="图片 URL"
            value={item.src}
            onChange={(value) =>
              onChange(
                updateItemAt(items, index, {
                  ...item,
                  src: value,
                  file: item.file || getFileName(value) || `image-${index + 1}.jpg`,
                }),
              )
            }
          />
          <TextField
            label="文件名"
            value={item.file}
            onChange={(value) => onChange(updateItemAt(items, index, { ...item, file: value }))}
          />
          <TextField
            label="说明"
            value={item.alt}
            onChange={(value) => onChange(updateItemAt(items, index, { ...item, alt: value }))}
          />
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setPickerIndex(index)}
              className="inline-flex items-center gap-1"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              媒体库选图
            </button>
            <button
              type="button"
              disabled={index === 0}
              onClick={() => onChange(moveItemAt(items, index, index - 1))}
              title="上移"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={index === items.length - 1}
              onClick={() => onChange(moveItemAt(items, index, index + 1))}
              title="下移"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => onChange(removeItemAt(items, index))}>
              删除
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...items, { src: '', file: `image-${items.length + 1}.jpg`, alt: `图片说明：image-${items.length + 1}.jpg` }])
        }
      >
        {addLabel}
      </button>

      <MediaPickerDialog
        open={pickerIndex !== null}
        onOpenChange={(open) => {
          if (!open) setPickerIndex(null)
        }}
        onSelect={(url) => {
          if (pickerIndex === null) return
          const target = items[pickerIndex]
          if (!target) return
          const fileName = getFileName(url) || target.file || `image-${pickerIndex + 1}.jpg`
          onChange(
            updateItemAt(items, pickerIndex, {
              ...target,
              src: url,
              file: fileName,
              alt: target.alt || `图片说明：${fileName}`,
            }),
          )
          setPickerIndex(null)
        }}
      />
    </div>
  )
}

export function CardItemsEditor({ items, onChange }: { items: CardItem[]; onChange: (items: CardItem[]) => void }) {
  return (
    <div className="component-block-editor-wide component-block-editor-list">
      {items.map((item, index) => (
        <div key={index} className="component-block-editor-row">
          <TextField
            label="眉标"
            value={item.eyebrow}
            onChange={(value) => onChange(updateItemAt(items, index, { ...item, eyebrow: value }))}
          />
          <TextField
            label="标题"
            value={item.title}
            onChange={(value) => onChange(updateItemAt(items, index, { ...item, title: value }))}
          />
          <TextAreaField
            label="内容"
            value={item.text}
            onChange={(value) => onChange(updateItemAt(items, index, { ...item, text: value }))}
          />
          <RowOrderControls
            index={index}
            total={items.length}
            onMoveUp={() => onChange(moveItemAt(items, index, index - 1))}
            onMoveDown={() => onChange(moveItemAt(items, index, index + 1))}
            onRemove={() => onChange(removeItemAt(items, index))}
          />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { eyebrow: '分类', title: '卡片标题', text: '卡片内容' }])}>
        添加卡片
      </button>
    </div>
  )
}

export function DiagramItemsEditor({ items, onChange }: { items: DiagramItem[]; onChange: (items: DiagramItem[]) => void }) {
  return (
    <div className="component-block-editor-wide component-block-editor-list">
      {items.map((item, index) => (
        <div key={index} className="component-block-editor-row">
          <TextField
            label="节点"
            value={item.label}
            onChange={(value) => onChange(updateItemAt(items, index, { label: value }))}
          />
          <RowOrderControls
            index={index}
            total={items.length}
            onMoveUp={() => onChange(moveItemAt(items, index, index - 1))}
            onMoveDown={() => onChange(moveItemAt(items, index, index + 1))}
            onRemove={() => onChange(removeItemAt(items, index))}
          />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { label: '节点' }])}>
        添加节点
      </button>
    </div>
  )
}

export function TimelineItemsEditor({
  items,
  onChange,
}: {
  items: TimelineItem[]
  onChange: (items: TimelineItem[]) => void
}) {
  return (
    <div className="component-block-editor-wide component-block-editor-list">
      {items.map((item, index) => (
        <div key={index} className="component-block-editor-row">
          <TextField
            label="阶段"
            value={item.label}
            onChange={(value) => onChange(updateItemAt(items, index, { ...item, label: value }))}
          />
          <TextField
            label="标题"
            value={item.title}
            onChange={(value) => onChange(updateItemAt(items, index, { ...item, title: value }))}
          />
          <TextAreaField
            label="内容"
            value={item.text}
            onChange={(value) => onChange(updateItemAt(items, index, { ...item, text: value }))}
          />
          <RowOrderControls
            index={index}
            total={items.length}
            onMoveUp={() => onChange(moveItemAt(items, index, index - 1))}
            onMoveDown={() => onChange(moveItemAt(items, index, index + 1))}
            onRemove={() => onChange(removeItemAt(items, index))}
          />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { label: '阶段', title: '标题', text: '内容' }])}>
        添加阶段
      </button>
    </div>
  )
}

export function normalizePanelItems(items: PanelItem[]): PanelItem[] {
  const nextItems = items
    .map((item) => ({
      title: item.title.trim(),
      text: item.text.trim(),
    }))
    .filter((item) => item.title || item.text)
    .map((item, index) => ({
      title: item.title || `标题 ${index + 1}`,
      text: item.text || '内容',
    }))

  return nextItems.length ? nextItems : [{ title: '标题', text: '内容' }]
}

export function normalizeImageItems(items: RichImageItem[]): RichImageItem[] {
  return items
    .map((item, index) => {
      const src = item.src.trim()
      if (!src) return null
      const file = item.file.trim() || getFileName(src) || `image-${index + 1}.jpg`
      return {
        src,
        file,
        alt: item.alt.trim() || `图片说明：${file}`,
      }
    })
    .filter((item): item is RichImageItem => Boolean(item))
}

export function normalizeCardItems(items: CardItem[]): CardItem[] {
  const nextItems = items
    .map((item) => ({
      eyebrow: item.eyebrow.trim(),
      title: item.title.trim(),
      text: item.text.trim(),
    }))
    .filter((item) => item.eyebrow || item.title || item.text)
    .map((item, index) => ({
      eyebrow: item.eyebrow || '分类',
      title: item.title || `卡片 ${index + 1}`,
      text: item.text || '卡片内容',
    }))

  return nextItems.length ? nextItems : [{ eyebrow: '分类', title: '卡片标题', text: '卡片内容' }]
}

export function normalizeDiagramItems(items: DiagramItem[]): DiagramItem[] {
  const nextItems = items
    .map((item) => item.label.trim())
    .filter(Boolean)
    .map((label) => ({ label }))

  return nextItems.length ? nextItems : [{ label: '节点' }]
}

export function normalizeTimelineItems(items: TimelineItem[]): TimelineItem[] {
  const nextItems = items
    .map((item) => ({
      label: item.label.trim(),
      title: item.title.trim(),
      text: item.text.trim(),
    }))
    .filter((item) => item.label || item.title || item.text)
    .map((item, index) => ({
      label: item.label || '阶段',
      title: item.title || `标题 ${index + 1}`,
      text: item.text || '内容',
    }))

  return nextItems.length ? nextItems : [{ label: '阶段', title: '标题', text: '内容' }]
}

function updateItemAt<T>(items: T[], index: number, value: T) {
  return items.map((item, itemIndex) => (itemIndex === index ? value : item))
}

function removeItemAt<T>(items: T[], index: number) {
  return items.filter((_, itemIndex) => itemIndex !== index)
}

function getFileName(src: string) {
  try {
    const pathname = new URL(src).pathname
    return decodeURIComponent(pathname.split('/').filter(Boolean).pop() || '')
  } catch {
    return src.split('/').filter(Boolean).pop() || ''
  }
}
