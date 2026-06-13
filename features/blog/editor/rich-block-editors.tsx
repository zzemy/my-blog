'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { Pencil, Save, X } from 'lucide-react'
import type { RichImageItem } from './rich-block-extensions'

type RichBlockEditorPanelProps = {
  title: string
  children: ReactNode
  onCancel: () => void
  onSave: () => void
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
  placement = 'inspector',
}: RichBlockEditorPanelProps) {
  const [inspectorHost, setInspectorHost] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (placement !== 'inspector') return

    setInspectorHost(document.getElementById('admin-rich-block-inspector'))
  }, [placement])

  const panel = (
    <div className="component-block-editor" contentEditable={false} data-editor-control="true">
      <div className="component-block-editor-header">
        <strong>{title}</strong>
      </div>
      {children}
      <div className="component-block-editor-actions">
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

  if (placement === 'inspector' && inspectorHost) {
    return createPortal(panel, inspectorHost)
  }

  return panel
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
        <div key={`${item.title}-${index}`} className="component-block-editor-row">
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
          <button type="button" onClick={() => onChange(removeItemAt(items, index))}>
            删除
          </button>
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
  return (
    <div className="component-block-editor-wide component-block-editor-list">
      {items.map((item, index) => (
        <div key={`${item.src}-${index}`} className="component-block-editor-row">
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
          <button type="button" onClick={() => onChange(removeItemAt(items, index))}>
            删除
          </button>
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
    </div>
  )
}

export function CardItemsEditor({ items, onChange }: { items: CardItem[]; onChange: (items: CardItem[]) => void }) {
  return (
    <div className="component-block-editor-wide component-block-editor-list">
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className="component-block-editor-row">
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
          <button type="button" onClick={() => onChange(removeItemAt(items, index))}>
            删除
          </button>
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
        <div key={`${item.label}-${index}`} className="component-block-editor-row">
          <TextField
            label="节点"
            value={item.label}
            onChange={(value) => onChange(updateItemAt(items, index, { label: value }))}
          />
          <button type="button" onClick={() => onChange(removeItemAt(items, index))}>
            删除
          </button>
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
        <div key={`${item.label}-${item.title}-${index}`} className="component-block-editor-row">
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
          <button type="button" onClick={() => onChange(removeItemAt(items, index))}>
            删除
          </button>
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
