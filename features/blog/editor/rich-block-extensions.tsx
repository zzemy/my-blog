'use client'

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react'
import { Node, mergeAttributes, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CircleAlert,
  Info,
  Layers3,
  MousePointerClick,
  Music2,
  Network,
  Play,
  Quote,
} from 'lucide-react'
import {
  CardItemsEditor,
  DiagramItemsEditor,
  ImageItemsEditor,
  PanelItemsEditor,
  RichBlockEditButton,
  RichBlockEditorPanel,
  SelectField,
  TextAreaField,
  TextField,
  TimelineItemsEditor,
  ensureCardItems,
  ensureDiagramItems,
  ensureImageItems,
  ensurePanelItems,
  ensureTimelineItems,
  normalizeCardItems,
  normalizeDiagramItems,
  normalizeImageItems,
  normalizePanelItems,
  normalizeTimelineItems,
} from './rich-block-editors'

export type RichImageItem = {
  src: string
  alt: string
  file: string
}

type CalloutTone = 'note' | 'quote' | 'tip' | 'info' | 'important' | 'warning' | 'success' | 'caution'
type EmbedKind = 'youtube' | 'video'

type PanelItem = {
  title: string
  text: string
}

type CardItem = {
  eyebrow: string
  title: string
  text: string
}

type DiagramItem = {
  label: string
}

type TimelineItem = {
  label: string
  title: string
  text: string
}

type FlowNode = {
  label: string
}

const calloutTones: CalloutTone[] = ['note', 'quote', 'tip', 'info', 'important', 'warning', 'success', 'caution']

const openEditorAttribute = {
  openEditor: {
    default: false,
    rendered: false,
  },
}

const calloutLabels: Record<CalloutTone, string> = {
  note: '备注',
  quote: '引用',
  tip: '技巧',
  info: '信息',
  important: '重要',
  warning: '警告',
  success: '完成',
  caution: '风险',
}

export const articleRichBlockExtensions = [
  createCalloutExtension(),
  createButtonExtension(),
  createTabsExtension(),
  createAccordionExtension(),
  createGalleryExtension(),
  createSliderExtension(),
  createEmbedExtension(),
  createFlowExtension(),
  createCardsExtension(),
  createDiagramExtension(),
  createTimelineExtension(),
  createRichShowcaseExtension(),
  createAudioExtension(),
]

export function createImageItemsFromUrls(value: string): RichImageItem[] {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((src, index) => {
      const file = getFileName(src) || `image-${index + 1}.jpg`
      return {
        src,
        file,
        alt: `图片说明：${file}`,
      }
    })
}

export function toYouTubeEmbed(value: string) {
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, '')
    const id =
      host === 'youtu.be'
        ? url.pathname.slice(1)
        : host.endsWith('youtube.com')
          ? url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop()
          : ''

    return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : value
  } catch {
    return value
  }
}

function createCalloutExtension() {
  return Node.create({
    name: 'articleCallout',
    group: 'block',
    atom: true,

    addAttributes() {
      return {
        ...openEditorAttribute,
        tone: { default: 'note' },
        title: { default: '备注' },
        text: { default: '这是一条普通备注。' },
      }
    },

    parseHTML() {
      return [{ tag: 'article-callout' }, { tag: 'div[data-article-callout]' }]
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'article-callout',
        mergeAttributes(HTMLAttributes, {
          'data-article-callout': '',
        }),
      ]
    },

    addNodeView() {
      return ReactNodeViewRenderer(CalloutView)
    },
  })
}

function createButtonExtension() {
  return Node.create({
    name: 'articleButton',
    group: 'block',
    atom: true,

    addAttributes() {
      return {
        ...openEditorAttribute,
        label: { default: '按钮' },
        href: { default: '#' },
        variant: { default: 'primary' },
      }
    },

    parseHTML() {
      return [{ tag: 'article-button' }, { tag: 'div[data-article-button]' }]
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'article-button',
        mergeAttributes(HTMLAttributes, {
          'data-article-button': '',
        }),
      ]
    },

    addNodeView() {
      return ReactNodeViewRenderer(ButtonView)
    },
  })
}

function createTabsExtension() {
  return Node.create({
    name: 'articleTabs',
    group: 'block',
    atom: true,

    addAttributes() {
      return {
        ...openEditorAttribute,
        panels: {
          default: [
            { title: '结构', text: '第一组内容用于检查标签页结构。' },
            { title: '样式', text: '第二组内容用于检查标签切换状态。' },
            { title: '验证', text: '第三组内容用于检查移动端换行。' },
          ],
        },
      }
    },

    parseHTML() {
      return [{ tag: 'article-tabs' }, { tag: 'div[data-article-tabs]' }]
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'article-tabs',
        mergeAttributes(HTMLAttributes, {
          'data-article-tabs': '',
        }),
      ]
    },

    addNodeView() {
      return ReactNodeViewRenderer(TabsView)
    },
  })
}

function createAccordionExtension() {
  return Node.create({
    name: 'articleAccordion',
    group: 'block',
    atom: true,

    addAttributes() {
      return {
        ...openEditorAttribute,
        items: {
          default: [
            { title: '为什么需要折叠面板？', text: '为了在同一页里提前看到真实文章会遇到的折叠内容状态。' },
            { title: '如何保持横向居中？', text: '正文容器负责宽度，组件只需要占满当前正文宽度。' },
            { title: '是否应该使用负边距？', text: '这里不使用负 margin，避免移动端出现横向滚动。' },
          ],
        },
      }
    },

    parseHTML() {
      return [{ tag: 'article-accordion' }, { tag: 'div[data-article-accordion]' }]
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'article-accordion',
        mergeAttributes(HTMLAttributes, {
          'data-article-accordion': '',
        }),
      ]
    },

    addNodeView() {
      return ReactNodeViewRenderer(AccordionView)
    },
  })
}

function createGalleryExtension() {
  return Node.create({
    name: 'articleGallery',
    group: 'block',
    atom: true,

    addAttributes() {
      return {
        ...openEditorAttribute,
        images: { default: [] },
      }
    },

    parseHTML() {
      return [{ tag: 'article-gallery' }, { tag: 'div[data-article-gallery]' }]
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'article-gallery',
        mergeAttributes(HTMLAttributes, {
          'data-article-gallery': '',
        }),
      ]
    },

    addNodeView() {
      return ReactNodeViewRenderer(GalleryView)
    },
  })
}

function createSliderExtension() {
  return Node.create({
    name: 'articleSlider',
    group: 'block',
    atom: true,

    addAttributes() {
      return {
        ...openEditorAttribute,
        images: { default: [] },
      }
    },

    parseHTML() {
      return [{ tag: 'article-slider' }, { tag: 'div[data-article-slider]' }]
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'article-slider',
        mergeAttributes(HTMLAttributes, {
          'data-article-slider': '',
        }),
      ]
    },

    addNodeView() {
      return ReactNodeViewRenderer(SliderView)
    },
  })
}

function createEmbedExtension() {
  return Node.create({
    name: 'articleEmbed',
    group: 'block',
    atom: true,

    addAttributes() {
      return {
        ...openEditorAttribute,
        kind: { default: 'youtube' },
        src: { default: '' },
        title: { default: '嵌入媒体' },
        poster: { default: '' },
      }
    },

    parseHTML() {
      return [{ tag: 'article-embed' }, { tag: 'div[data-article-embed]' }]
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'article-embed',
        mergeAttributes(HTMLAttributes, {
          'data-article-embed': '',
        }),
      ]
    },

    addNodeView() {
      return ReactNodeViewRenderer(EmbedView)
    },
  })
}

function createFlowExtension() {
  return Node.create({
    name: 'articleFlow',
    group: 'block',
    atom: true,

    addAttributes() {
      return {
        ...openEditorAttribute,
        start: { default: '开始' },
        question: { default: '内容完整？' },
        yes: { default: '预览发布' },
        no: { default: '继续修改' },
        end: { default: '归档' },
      }
    },

    parseHTML() {
      return [{ tag: 'article-flow' }, { tag: 'div[data-article-flow]' }]
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'article-flow',
        mergeAttributes(HTMLAttributes, {
          'data-article-flow': '',
        }),
      ]
    },

    addNodeView() {
      return ReactNodeViewRenderer(FlowView)
    },
  })
}

function createCardsExtension() {
  return Node.create({
    name: 'articleCards',
    group: 'block',
    atom: true,

    addAttributes() {
      return {
        ...openEditorAttribute,
        cards: {
          default: [
            { eyebrow: '模式', title: '紧凑摘要卡片', text: '用于文章中的小型结论、资源组或阅读提示。' },
            { eyebrow: '状态', title: '状态对比', text: '可承载就绪、预览、废弃等状态。' },
            { eyebrow: '资源', title: '相关阅读', text: '适合链接到同系列文章、外部资料或下载内容。' },
          ],
        },
      }
    },

    parseHTML() {
      return [{ tag: 'article-cards' }, { tag: 'div[data-article-cards]' }]
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'article-cards',
        mergeAttributes(HTMLAttributes, {
          'data-article-cards': '',
        }),
      ]
    },

    addNodeView() {
      return ReactNodeViewRenderer(CardsView)
    },
  })
}

function createDiagramExtension() {
  return Node.create({
    name: 'articleDiagram',
    group: 'block',
    atom: true,

    addAttributes() {
      return {
        ...openEditorAttribute,
        items: {
          default: [{ label: '内容源' }, { label: '渲染器' }, { label: '正文界面' }],
        },
      }
    },

    parseHTML() {
      return [{ tag: 'article-diagram' }, { tag: 'div[data-article-diagram]' }]
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'article-diagram',
        mergeAttributes(HTMLAttributes, {
          'data-article-diagram': '',
        }),
      ]
    },

    addNodeView() {
      return ReactNodeViewRenderer(DiagramView)
    },
  })
}

function createTimelineExtension() {
  return Node.create({
    name: 'articleTimeline',
    group: 'block',
    atom: true,

    addAttributes() {
      return {
        ...openEditorAttribute,
        items: {
          default: [
            { label: '草稿', title: '收集内容块', text: '先把真实文章里会出现的内容块列全。' },
            { label: '检查', title: '校准阅读节奏', text: '检查标题、列表、代码、表格和媒体是否稳定。' },
            { label: '发布', title: '复用正文体系', text: '组件页和文章详情页使用同一套正文变量。' },
          ],
        },
      }
    },

    parseHTML() {
      return [{ tag: 'article-timeline' }, { tag: 'div[data-article-timeline]' }]
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'article-timeline',
        mergeAttributes(HTMLAttributes, {
          'data-article-timeline': '',
        }),
      ]
    },

    addNodeView() {
      return ReactNodeViewRenderer(TimelineView)
    },
  })
}

function createRichShowcaseExtension() {
  return Node.create({
    name: 'articleRichShowcase',
    group: 'block',
    atom: true,

    addAttributes() {
      return {
        ...openEditorAttribute,
        image: { default: '' },
        alt: { default: '图片说明' },
        eyebrow: { default: '富文本块' },
        title: { default: '混合正文模块' },
        text: { default: '一个块里同时承载媒体、摘要、状态和操作入口。' },
        primaryLabel: { default: '查看图集' },
        primaryHref: { default: '#gallery' },
        secondaryLabel: { default: '查看文件' },
        secondaryHref: { default: '#files' },
      }
    },

    parseHTML() {
      return [{ tag: 'article-rich-showcase' }, { tag: 'div[data-article-rich-showcase]' }]
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'article-rich-showcase',
        mergeAttributes(HTMLAttributes, {
          'data-article-rich-showcase': '',
        }),
      ]
    },

    addNodeView() {
      return ReactNodeViewRenderer(RichShowcaseView)
    },
  })
}

function createAudioExtension() {
  return Node.create({
    name: 'articleAudio',
    group: 'block',
    atom: true,

    addAttributes() {
      return {
        ...openEditorAttribute,
        src: { default: '' },
        title: { default: '嵌入音频' },
        caption: { default: '音频 · 正文宽度媒体控件' },
      }
    },

    parseHTML() {
      return [{ tag: 'article-audio' }, { tag: 'div[data-article-audio]' }]
    },

    renderHTML({ HTMLAttributes }) {
      return [
        'article-audio',
        mergeAttributes(HTMLAttributes, {
          'data-article-audio': '',
        }),
      ]
    },

    addNodeView() {
      return ReactNodeViewRenderer(AudioView)
    },
  })
}

function CalloutView({ node, editor, updateAttributes, deleteNode }: NodeViewProps) {
  const tone = getCalloutTone(node.attrs.tone)
  const title = getString(node.attrs.title, '备注')
  const text = getString(node.attrs.text, '这是一条普通备注。')
  const Icon = getCalloutIcon(tone)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState({ tone, title, text })
  const [deleteOnCancel, setDeleteOnCancel] = useState(node.attrs.openEditor === true)

  const startEditing = () => {
    setDraft({
      tone,
      title: getDraftString(node.attrs.title, '备注', node.attrs.openEditor),
      text: getDraftString(node.attrs.text, '这是一条普通备注。', node.attrs.openEditor),
    })
    setIsEditing(true)
  }

  useOpenEditorOnInsert(node.attrs.openEditor, startEditing, updateAttributes)

  const saveDraft = () => {
    const nextTone = getCalloutTone(draft.tone)

    updateAttributes({
      tone: nextTone,
      title: draft.title.trim() || calloutLabels[nextTone],
      text: draft.text.trim() || `这是一条${calloutLabels[nextTone]}。`,
    })
    setDeleteOnCancel(false)
    setIsEditing(false)
  }

  return (
    <NodeViewWrapper
      className="component-stack not-prose"
      data-rich-block="callout"
      data-rich-block-editable={editor.isEditable ? 'true' : undefined}
    >
      <div className={`component-callout component-callout-${tone}`}>
        <div className="component-callout-heading">
          <div className="component-callout-icon">
            <Icon className="h-4 w-4" />
          </div>
          <p className="component-callout-title">{title}</p>
          {editor.isEditable ? <RichBlockEditButton onClick={startEditing} label="编辑提示块" /> : null}
        </div>
        <p>{text}</p>
      </div>
      {editor.isEditable && isEditing ? (
        <RichBlockEditorPanel
          title="编辑提示块"
          placement="inline"
          onCancel={() => cancelRichBlockEditing(deleteOnCancel, deleteNode, () => setIsEditing(false))}
          onSave={saveDraft}
        >
          <SelectField
            label="类型"
            value={draft.tone}
            options={calloutTones.map((item) => ({ value: item, label: `${calloutLabels[item]} / ${item}` }))}
            onChange={(value) => setDraft((current) => ({ ...current, tone: value }))}
          />
          <TextField
            label="标题"
            value={draft.title}
            placeholder={calloutLabels[draft.tone]}
            onChange={(value) => setDraft((current) => ({ ...current, title: value }))}
          />
          <TextAreaField
            label="内容"
            value={draft.text}
            placeholder={`这是一条${calloutLabels[draft.tone]}。`}
            onChange={(value) => setDraft((current) => ({ ...current, text: value }))}
          />
        </RichBlockEditorPanel>
      ) : null}
    </NodeViewWrapper>
  )
}

function ButtonView({ node, editor, updateAttributes, deleteNode }: NodeViewProps) {
  const label = getString(node.attrs.label, '按钮')
  const href = getString(node.attrs.href, '#')
  const variant = getString(node.attrs.variant, 'primary') === 'secondary' ? 'secondary' : 'primary'
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState({ label, href, variant })
  const [deleteOnCancel, setDeleteOnCancel] = useState(node.attrs.openEditor === true)

  const startEditing = () => {
    setDraft({
      label: getDraftString(node.attrs.label, '按钮', node.attrs.openEditor),
      href: getDraftString(node.attrs.href, '#', node.attrs.openEditor),
      variant,
    })
    setIsEditing(true)
  }

  useOpenEditorOnInsert(node.attrs.openEditor, startEditing, updateAttributes)

  const saveDraft = () => {
    updateAttributes({
      label: draft.label.trim() || '按钮',
      href: draft.href.trim() || '#',
      variant: draft.variant === 'secondary' ? 'secondary' : 'primary',
    })
    setDeleteOnCancel(false)
    setIsEditing(false)
  }

  return (
    <NodeViewWrapper
      className="component-button-row not-prose"
      data-rich-block="button"
      data-rich-block-editable={editor.isEditable ? 'true' : undefined}
    >
      <a
        className={`component-button component-button-${variant}`}
        href={href}
        onClick={(event) => {
          if (editor.isEditable) event.preventDefault()
        }}
      >
        <span>{label}</span>
        <MousePointerClick className="h-4 w-4" />
      </a>
      {editor.isEditable ? <RichBlockEditButton onClick={startEditing} label="编辑按钮" /> : null}
      {editor.isEditable && isEditing ? (
        <RichBlockEditorPanel
          title="编辑按钮"
          placement="inline"
          onCancel={() => cancelRichBlockEditing(deleteOnCancel, deleteNode, () => setIsEditing(false))}
          onSave={saveDraft}
        >
          <TextField
            label="文本"
            value={draft.label}
            placeholder="按钮"
            onChange={(value) => setDraft((current) => ({ ...current, label: value }))}
          />
          <TextField
            label="链接"
            value={draft.href}
            placeholder="#"
            onChange={(value) => setDraft((current) => ({ ...current, href: value }))}
          />
          <SelectField
            label="样式"
            value={draft.variant}
            options={[
              { value: 'primary', label: 'Primary' },
              { value: 'secondary', label: 'Secondary' },
            ]}
            onChange={(value) => setDraft((current) => ({ ...current, variant: value }))}
          />
        </RichBlockEditorPanel>
      ) : null}
    </NodeViewWrapper>
  )
}

function TabsView({ node, editor, updateAttributes, deleteNode }: NodeViewProps) {
  const panels = getPanelItems(node.attrs.panels)
  const [active, setActive] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(ensurePanelItems(panels))
  const [deleteOnCancel, setDeleteOnCancel] = useState(node.attrs.openEditor === true)

  const startEditing = () => {
    setDraft(ensurePanelItems(panels))
    setIsEditing(true)
  }

  useOpenEditorOnInsert(node.attrs.openEditor, startEditing, updateAttributes)

  const saveDraft = () => {
    updateAttributes({ panels: normalizePanelItems(draft) })
    setDeleteOnCancel(false)
    setActive(0)
    setIsEditing(false)
  }

  return (
    <NodeViewWrapper
      className="component-tabs not-prose"
      data-rich-block="tabs"
      data-rich-block-editable={editor.isEditable ? 'true' : undefined}
      data-rich-block-editing={editor.isEditable && isEditing ? 'true' : undefined}
    >
      {editor.isEditable ? (
        <div className="component-block-edit-row">
          <RichBlockEditButton onClick={startEditing} label="编辑标签页" />
        </div>
      ) : null}
      <div className="component-tabs-list" role="tablist" aria-label="正文标签页">
        {panels.map((panel, index) => (
          <button
            key={`${panel.title}-${index}`}
            className={active === index ? 'is-active' : ''}
            type="button"
            role="tab"
            aria-selected={active === index}
            onClick={() => setActive(index)}
          >
            {panel.title}
          </button>
        ))}
      </div>
      <div className="component-tab-panels">
        {panels.map((panel, index) => (
          <section
            key={`${panel.title}-panel-${index}`}
            className={`component-tab-panel ${active === index ? 'is-active' : ''}`}
            role="tabpanel"
          >
            <h3>{panel.title}</h3>
            <p>{panel.text}</p>
          </section>
        ))}
      </div>
      {editor.isEditable && isEditing ? (
        <RichBlockEditorPanel
          title="编辑标签页"
          onCancel={() => cancelRichBlockEditing(deleteOnCancel, deleteNode, () => setIsEditing(false))}
          onSave={saveDraft}
        >
          <PanelItemsEditor items={draft} onChange={setDraft} addLabel="添加标签页" />
        </RichBlockEditorPanel>
      ) : null}
    </NodeViewWrapper>
  )
}

function AccordionView({ node, editor, updateAttributes, deleteNode }: NodeViewProps) {
  const items = getPanelItems(node.attrs.items)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(ensurePanelItems(items))
  const [deleteOnCancel, setDeleteOnCancel] = useState(node.attrs.openEditor === true)

  const startEditing = () => {
    setDraft(ensurePanelItems(items))
    setIsEditing(true)
  }

  useOpenEditorOnInsert(node.attrs.openEditor, startEditing, updateAttributes)

  const saveDraft = () => {
    updateAttributes({ items: normalizePanelItems(draft) })
    setDeleteOnCancel(false)
    setIsEditing(false)
  }

  return (
    <NodeViewWrapper
      className="component-accordions not-prose"
      data-rich-block="accordion"
      data-rich-block-editable={editor.isEditable ? 'true' : undefined}
      data-rich-block-editing={editor.isEditable && isEditing ? 'true' : undefined}
    >
      {editor.isEditable ? (
        <div className="component-block-edit-row">
          <RichBlockEditButton onClick={startEditing} label="编辑折叠面板" />
        </div>
      ) : null}
      {items.map((item, index) => (
        <details key={`${item.title}-${index}`} open={index === 0}>
          <summary>{item.title}</summary>
          <p>{item.text}</p>
        </details>
      ))}
      {editor.isEditable && isEditing ? (
        <RichBlockEditorPanel
          title="编辑折叠面板"
          onCancel={() => cancelRichBlockEditing(deleteOnCancel, deleteNode, () => setIsEditing(false))}
          onSave={saveDraft}
        >
          <PanelItemsEditor items={draft} onChange={setDraft} addLabel="添加面板" />
        </RichBlockEditorPanel>
      ) : null}
    </NodeViewWrapper>
  )
}

function GalleryView({ node, editor, updateAttributes, deleteNode }: NodeViewProps) {
  const images = getImageItems(node.attrs.images)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(ensureImageItems(images))
  const [deleteOnCancel, setDeleteOnCancel] = useState(node.attrs.openEditor === true)

  const startEditing = () => {
    setDraft(ensureImageItems(images))
    setIsEditing(true)
  }

  useOpenEditorOnInsert(node.attrs.openEditor, startEditing, updateAttributes)

  const saveDraft = () => {
    updateAttributes({ images: normalizeImageItems(draft) })
    setDeleteOnCancel(false)
    setIsEditing(false)
  }

  if (!images.length && !editor.isEditable) return null

  return (
    <NodeViewWrapper
      className="component-gallery not-prose"
      data-rich-block="gallery"
      data-rich-block-editable={editor.isEditable ? 'true' : undefined}
      data-rich-block-editing={editor.isEditable && isEditing ? 'true' : undefined}
    >
      {editor.isEditable ? (
        <div className="component-block-edit-row">
          <RichBlockEditButton onClick={startEditing} label="编辑图集" />
        </div>
      ) : null}
      {images.length ? (
        images.map((image) => (
          <figure key={`${image.file}-${image.src}`}>
            <img src={image.src} alt={image.alt} referrerPolicy="no-referrer" />
            <figcaption>{image.file}</figcaption>
          </figure>
        ))
      ) : (
        <div className="component-placeholder">
          <span>图集</span>
          <p>还没有图片，点击编辑添加图集图片。</p>
        </div>
      )}
      {editor.isEditable && isEditing ? (
        <RichBlockEditorPanel
          title="编辑图集"
          onCancel={() => cancelRichBlockEditing(deleteOnCancel, deleteNode, () => setIsEditing(false))}
          onSave={saveDraft}
        >
          <ImageItemsEditor items={draft} onChange={setDraft} addLabel="添加图片" />
        </RichBlockEditorPanel>
      ) : null}
    </NodeViewWrapper>
  )
}

function SliderView({ node, editor, updateAttributes, deleteNode }: NodeViewProps) {
  const images = getImageItems(node.attrs.images)
  const [active, setActive] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(ensureImageItems(images))
  const [deleteOnCancel, setDeleteOnCancel] = useState(node.attrs.openEditor === true)
  const activeImage = images[active] || images[0]

  const startEditing = () => {
    setDraft(ensureImageItems(images))
    setIsEditing(true)
  }

  useOpenEditorOnInsert(node.attrs.openEditor, startEditing, updateAttributes)

  const saveDraft = () => {
    updateAttributes({ images: normalizeImageItems(draft) })
    setDeleteOnCancel(false)
    setActive(0)
    setIsEditing(false)
  }

  if (!activeImage && !editor.isEditable) return null

  const showPrevious = () => {
    setActive((current) => (current === 0 ? images.length - 1 : current - 1))
  }

  const showNext = () => {
    setActive((current) => (current + 1) % images.length)
  }

  return (
    <NodeViewWrapper
      className="component-slider not-prose"
      data-rich-block="slider"
      data-rich-block-editable={editor.isEditable ? 'true' : undefined}
      data-rich-block-editing={editor.isEditable && isEditing ? 'true' : undefined}
    >
      {editor.isEditable ? (
        <div className="component-block-edit-row">
          <RichBlockEditButton onClick={startEditing} label="编辑轮播" />
        </div>
      ) : null}
      {activeImage ? (
        <>
          <figure className="component-slider-stage">
            <img src={activeImage.src} alt={activeImage.alt} referrerPolicy="no-referrer" />
            <figcaption>
              <strong>{activeImage.file}</strong>
              <span>{activeImage.alt}</span>
            </figcaption>
          </figure>
          <div className="component-slider-controls" aria-label="轮播控制">
            <button type="button" onClick={showPrevious} aria-label="上一张">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>
              {active + 1} / {images.length}
            </span>
            <button type="button" onClick={showNext} aria-label="下一张">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="component-slider-strip" aria-label="轮播缩略图">
            {images.map((image, index) => (
              <button
                key={`${image.file}-${image.src}`}
                className={active === index ? 'is-active' : ''}
                type="button"
                aria-label={`预览 ${image.file}`}
                onClick={() => setActive(index)}
              >
                <img src={image.src} alt="" referrerPolicy="no-referrer" />
                <span>{image.file}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="component-placeholder">
          <span>轮播</span>
          <p>还没有图片，点击编辑添加轮播图片。</p>
        </div>
      )}
      {editor.isEditable && isEditing ? (
        <RichBlockEditorPanel
          title="编辑轮播"
          onCancel={() => cancelRichBlockEditing(deleteOnCancel, deleteNode, () => setIsEditing(false))}
          onSave={saveDraft}
        >
          <ImageItemsEditor items={draft} onChange={setDraft} addLabel="添加图片" />
        </RichBlockEditorPanel>
      ) : null}
    </NodeViewWrapper>
  )
}

function EmbedView({ node, editor, updateAttributes, deleteNode }: NodeViewProps) {
  const kind = getEmbedKind(node.attrs.kind)
  const src = getString(node.attrs.src)
  const title = getString(node.attrs.title, kind === 'video' ? '自定义视频' : 'YouTube 视频')
  const poster = getString(node.attrs.poster)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState({ kind, src, title, poster })
  const [deleteOnCancel, setDeleteOnCancel] = useState(node.attrs.openEditor === true)

  const startEditing = () => {
    setDraft({
      kind,
      src: getDraftString(node.attrs.src, '', node.attrs.openEditor),
      title: getDraftString(node.attrs.title, kind === 'video' ? '自定义视频' : 'YouTube 视频', node.attrs.openEditor),
      poster: getDraftString(node.attrs.poster, '', node.attrs.openEditor),
    })
    setIsEditing(true)
  }

  useOpenEditorOnInsert(node.attrs.openEditor, startEditing, updateAttributes)

  const saveDraft = () => {
    const nextKind = getEmbedKind(draft.kind)
    updateAttributes({
      kind: nextKind,
      src: nextKind === 'youtube' ? toYouTubeEmbed(draft.src.trim()) : draft.src.trim(),
      title: draft.title.trim() || (nextKind === 'video' ? '自定义视频' : 'YouTube 视频'),
      poster: draft.poster.trim(),
    })
    setDeleteOnCancel(false)
    setIsEditing(false)
  }

  if (!src && !editor.isEditable) return null

  return (
    <NodeViewWrapper
      className={`component-embed ${kind === 'video' ? 'component-custom-video' : ''} not-prose`}
      data-rich-block="embed"
      data-rich-block-editable={editor.isEditable ? 'true' : undefined}
      data-rich-block-editing={editor.isEditable && isEditing ? 'true' : undefined}
    >
      {editor.isEditable ? (
        <div className="component-block-edit-row">
          <RichBlockEditButton onClick={startEditing} label="编辑嵌入媒体" />
        </div>
      ) : null}
      {!src ? (
        <div className="component-placeholder">
          <span>嵌入媒体</span>
          <p>还没有媒体 URL，点击编辑添加视频或 YouTube 链接。</p>
        </div>
      ) : kind === 'video' ? (
        <>
          <video controls preload="metadata" poster={poster || undefined}>
            <source src={src} type="video/mp4" />
            当前浏览器不支持视频播放。
          </video>
          <div className="component-video-caption">
            <Play className="h-4 w-4 fill-current" />
            <span>{title}</span>
          </div>
        </>
      ) : (
        <iframe
          src={toYouTubeEmbed(src)}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      )}
      {editor.isEditable && isEditing ? (
        <RichBlockEditorPanel
          title="编辑嵌入媒体"
          onCancel={() => cancelRichBlockEditing(deleteOnCancel, deleteNode, () => setIsEditing(false))}
          onSave={saveDraft}
        >
          <SelectField
            label="类型"
            value={draft.kind}
            options={[
              { value: 'youtube', label: 'YouTube' },
              { value: 'video', label: '自定义视频' },
            ]}
            onChange={(value) => setDraft((current) => ({ ...current, kind: value }))}
          />
          <TextField
            label="标题"
            value={draft.title}
            onChange={(value) => setDraft((current) => ({ ...current, title: value }))}
          />
          <TextField
            label="URL"
            value={draft.src}
            onChange={(value) => setDraft((current) => ({ ...current, src: value }))}
          />
          {draft.kind === 'video' ? (
            <TextField
              label="封面图"
              value={draft.poster}
              onChange={(value) => setDraft((current) => ({ ...current, poster: value }))}
            />
          ) : null}
        </RichBlockEditorPanel>
      ) : null}
    </NodeViewWrapper>
  )
}

function FlowView({ node, editor, updateAttributes, deleteNode }: NodeViewProps) {
  const flow: Record<keyof FlowAttrs, FlowNode> = {
    start: { label: getString(node.attrs.start, '开始') },
    question: { label: getString(node.attrs.question, '内容完整？') },
    yes: { label: getString(node.attrs.yes, '预览发布') },
    no: { label: getString(node.attrs.no, '继续修改') },
    end: { label: getString(node.attrs.end, '归档') },
  }
  const [isEditing, setIsEditing] = useState(false)
  const [deleteOnCancel, setDeleteOnCancel] = useState(node.attrs.openEditor === true)
  const [draft, setDraft] = useState({
    start: flow.start.label,
    question: flow.question.label,
    yes: flow.yes.label,
    no: flow.no.label,
    end: flow.end.label,
  })

  const startEditing = () => {
    setDraft({
      start: getDraftString(node.attrs.start, '开始', node.attrs.openEditor),
      question: getDraftString(node.attrs.question, '内容完整？', node.attrs.openEditor),
      yes: getDraftString(node.attrs.yes, '预览发布', node.attrs.openEditor),
      no: getDraftString(node.attrs.no, '继续修改', node.attrs.openEditor),
      end: getDraftString(node.attrs.end, '归档', node.attrs.openEditor),
    })
    setIsEditing(true)
  }

  useOpenEditorOnInsert(node.attrs.openEditor, startEditing, updateAttributes)

  const saveDraft = () => {
    updateAttributes({
      start: draft.start.trim() || '开始',
      question: draft.question.trim() || '内容完整？',
      yes: draft.yes.trim() || '预览发布',
      no: draft.no.trim() || '继续修改',
      end: draft.end.trim() || '归档',
    })
    setDeleteOnCancel(false)
    setIsEditing(false)
  }

  return (
    <NodeViewWrapper
      className="component-flow not-prose"
      data-rich-block="flow"
      data-rich-block-editable={editor.isEditable ? 'true' : undefined}
      data-rich-block-editing={editor.isEditable && isEditing ? 'true' : undefined}
      aria-label="正文发布流程示例"
    >
      {editor.isEditable ? (
        <div className="component-block-edit-row">
          <RichBlockEditButton onClick={startEditing} label="编辑流程图" />
        </div>
      ) : null}
      <div className="component-flow-node">{flow.start.label}</div>
      <div className="component-flow-connector" aria-hidden="true" />
      <div className="component-flow-node component-flow-question">{flow.question.label}</div>
      <div className="component-flow-branch-line" aria-hidden="true" />
      <div className="component-flow-branches">
        <div>
          <span>是</span>
          <div className="component-flow-node">{flow.yes.label}</div>
        </div>
        <div>
          <span>否</span>
          <div className="component-flow-node">{flow.no.label}</div>
        </div>
      </div>
      <div className="component-flow-merge-line" aria-hidden="true" />
      <div className="component-flow-node">{flow.end.label}</div>
      {editor.isEditable && isEditing ? (
        <RichBlockEditorPanel
          title="编辑流程图"
          onCancel={() => cancelRichBlockEditing(deleteOnCancel, deleteNode, () => setIsEditing(false))}
          onSave={saveDraft}
        >
          <TextField
            label="开始"
            value={draft.start}
            onChange={(value) => setDraft((current) => ({ ...current, start: value }))}
          />
          <TextField
            label="问题"
            value={draft.question}
            onChange={(value) => setDraft((current) => ({ ...current, question: value }))}
          />
          <TextField
            label="是"
            value={draft.yes}
            onChange={(value) => setDraft((current) => ({ ...current, yes: value }))}
          />
          <TextField
            label="否"
            value={draft.no}
            onChange={(value) => setDraft((current) => ({ ...current, no: value }))}
          />
          <TextField
            label="结束"
            value={draft.end}
            onChange={(value) => setDraft((current) => ({ ...current, end: value }))}
          />
        </RichBlockEditorPanel>
      ) : null}
    </NodeViewWrapper>
  )
}

function CardsView({ node, editor, updateAttributes, deleteNode }: NodeViewProps) {
  const cards = getCardItems(node.attrs.cards)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(ensureCardItems(cards))
  const [deleteOnCancel, setDeleteOnCancel] = useState(node.attrs.openEditor === true)

  const startEditing = () => {
    setDraft(ensureCardItems(cards))
    setIsEditing(true)
  }

  useOpenEditorOnInsert(node.attrs.openEditor, startEditing, updateAttributes)

  const saveDraft = () => {
    updateAttributes({ cards: normalizeCardItems(draft) })
    setDeleteOnCancel(false)
    setIsEditing(false)
  }

  if (!cards.length && !editor.isEditable) return null

  return (
    <NodeViewWrapper
      className="component-card-grid not-prose"
      data-rich-block="cards"
      data-rich-block-editable={editor.isEditable ? 'true' : undefined}
      data-rich-block-editing={editor.isEditable && isEditing ? 'true' : undefined}
    >
      {editor.isEditable ? (
        <div className="component-block-edit-row">
          <RichBlockEditButton onClick={startEditing} label="编辑卡片" />
        </div>
      ) : null}
      {cards.map((card) => (
        <article key={`${card.eyebrow}-${card.title}`} className="component-card">
          <span>{card.eyebrow}</span>
          <h3>{card.title}</h3>
          <p>{card.text}</p>
        </article>
      ))}
      {editor.isEditable && isEditing ? (
        <RichBlockEditorPanel
          title="编辑卡片"
          onCancel={() => cancelRichBlockEditing(deleteOnCancel, deleteNode, () => setIsEditing(false))}
          onSave={saveDraft}
        >
          <CardItemsEditor items={draft} onChange={setDraft} />
        </RichBlockEditorPanel>
      ) : null}
    </NodeViewWrapper>
  )
}

function DiagramView({ node, editor, updateAttributes, deleteNode }: NodeViewProps) {
  const items = getDiagramItems(node.attrs.items)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(ensureDiagramItems(items))
  const [deleteOnCancel, setDeleteOnCancel] = useState(node.attrs.openEditor === true)

  const startEditing = () => {
    setDraft(ensureDiagramItems(items))
    setIsEditing(true)
  }

  useOpenEditorOnInsert(node.attrs.openEditor, startEditing, updateAttributes)

  const saveDraft = () => {
    updateAttributes({ items: normalizeDiagramItems(draft) })
    setDeleteOnCancel(false)
    setIsEditing(false)
  }

  if (!items.length && !editor.isEditable) return null

  return (
    <NodeViewWrapper
      className="component-diagram not-prose"
      data-rich-block="diagram"
      data-rich-block-editable={editor.isEditable ? 'true' : undefined}
      data-rich-block-editing={editor.isEditable && isEditing ? 'true' : undefined}
      aria-label="内容关系图"
    >
      {editor.isEditable ? (
        <div className="component-block-edit-row">
          <RichBlockEditButton onClick={startEditing} label="编辑关系图" />
        </div>
      ) : null}
      {items.map((item) => (
        <div key={item.label}>
          <Network className="h-4 w-4" />
          <span>{item.label}</span>
        </div>
      ))}
      {editor.isEditable && isEditing ? (
        <RichBlockEditorPanel
          title="编辑关系图"
          onCancel={() => cancelRichBlockEditing(deleteOnCancel, deleteNode, () => setIsEditing(false))}
          onSave={saveDraft}
        >
          <DiagramItemsEditor items={draft} onChange={setDraft} />
        </RichBlockEditorPanel>
      ) : null}
    </NodeViewWrapper>
  )
}

function TimelineView({ node, editor, updateAttributes, deleteNode }: NodeViewProps) {
  const items = getTimelineItems(node.attrs.items)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(ensureTimelineItems(items))
  const [deleteOnCancel, setDeleteOnCancel] = useState(node.attrs.openEditor === true)

  const startEditing = () => {
    setDraft(ensureTimelineItems(items))
    setIsEditing(true)
  }

  useOpenEditorOnInsert(node.attrs.openEditor, startEditing, updateAttributes)

  const saveDraft = () => {
    updateAttributes({ items: normalizeTimelineItems(draft) })
    setDeleteOnCancel(false)
    setIsEditing(false)
  }

  if (!items.length && !editor.isEditable) return null

  return (
    <NodeViewWrapper
      as="ol"
      className="component-timeline not-prose"
      data-rich-block="timeline"
      data-rich-block-editable={editor.isEditable ? 'true' : undefined}
      data-rich-block-editing={editor.isEditable && isEditing ? 'true' : undefined}
    >
      {editor.isEditable ? (
        <li className="component-block-edit-row">
          <RichBlockEditButton onClick={startEditing} label="编辑时间线" />
        </li>
      ) : null}
      {items.map((item) => (
        <li key={`${item.label}-${item.title}`}>
          <span>{item.label}</span>
          <div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        </li>
      ))}
      {editor.isEditable && isEditing ? (
        <li className="component-block-editor-list-host">
          <RichBlockEditorPanel
            title="编辑时间线"
            onCancel={() => cancelRichBlockEditing(deleteOnCancel, deleteNode, () => setIsEditing(false))}
            onSave={saveDraft}
          >
            <TimelineItemsEditor items={draft} onChange={setDraft} />
          </RichBlockEditorPanel>
        </li>
      ) : null}
    </NodeViewWrapper>
  )
}

function RichShowcaseView({ node, editor, updateAttributes, deleteNode }: NodeViewProps) {
  const image = getString(node.attrs.image)
  const alt = getString(node.attrs.alt, '图片说明')
  const eyebrow = getString(node.attrs.eyebrow, '富文本块')
  const title = getString(node.attrs.title, '混合正文模块')
  const text = getString(node.attrs.text, '一个块里同时承载媒体、摘要、状态和操作入口。')
  const primaryLabel = getString(node.attrs.primaryLabel)
  const primaryHref = getString(node.attrs.primaryHref)
  const secondaryLabel = getString(node.attrs.secondaryLabel)
  const secondaryHref = getString(node.attrs.secondaryHref)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState({
    image,
    alt,
    eyebrow,
    title,
    text,
    primaryLabel,
    primaryHref,
    secondaryLabel,
    secondaryHref,
  })
  const [deleteOnCancel, setDeleteOnCancel] = useState(node.attrs.openEditor === true)

  const startEditing = () => {
    setDraft({
      image: getDraftString(node.attrs.image, '', node.attrs.openEditor),
      alt: getDraftString(node.attrs.alt, '图片说明', node.attrs.openEditor),
      eyebrow: getDraftString(node.attrs.eyebrow, '富文本块', node.attrs.openEditor),
      title: getDraftString(node.attrs.title, '混合正文模块', node.attrs.openEditor),
      text: getDraftString(node.attrs.text, '一个块里同时承载媒体、摘要、状态和操作入口。', node.attrs.openEditor),
      primaryLabel: getDraftString(node.attrs.primaryLabel, '', node.attrs.openEditor),
      primaryHref: getDraftString(node.attrs.primaryHref, '', node.attrs.openEditor),
      secondaryLabel: getDraftString(node.attrs.secondaryLabel, '', node.attrs.openEditor),
      secondaryHref: getDraftString(node.attrs.secondaryHref, '', node.attrs.openEditor),
    })
    setIsEditing(true)
  }

  useOpenEditorOnInsert(node.attrs.openEditor, startEditing, updateAttributes)

  const saveDraft = () => {
    updateAttributes({
      image: draft.image.trim(),
      alt: draft.alt.trim() || '图片说明',
      eyebrow: draft.eyebrow.trim() || '富文本块',
      title: draft.title.trim() || '混合正文模块',
      text: draft.text.trim() || '一个块里同时承载媒体、摘要、状态和操作入口。',
      primaryLabel: draft.primaryLabel.trim(),
      primaryHref: draft.primaryHref.trim(),
      secondaryLabel: draft.secondaryLabel.trim(),
      secondaryHref: draft.secondaryHref.trim(),
    })
    setDeleteOnCancel(false)
    setIsEditing(false)
  }

  return (
    <NodeViewWrapper
      className="component-rich-showcase not-prose"
      data-rich-block="rich-showcase"
      data-rich-block-editable={editor.isEditable ? 'true' : undefined}
      data-rich-block-editing={editor.isEditable && isEditing ? 'true' : undefined}
    >
      {editor.isEditable ? (
        <div className="component-block-edit-row">
          <RichBlockEditButton onClick={startEditing} label="编辑富文本块" />
        </div>
      ) : null}
      {image ? (
        <figure>
          <img src={image} alt={alt} referrerPolicy="no-referrer" />
        </figure>
      ) : null}
      <div>
        <span className="component-overline">
          <Layers3 className="h-4 w-4" />
          {eyebrow}
        </span>
        <h3>{title}</h3>
        <p>{text}</p>
        {(primaryLabel && primaryHref) || (secondaryLabel && secondaryHref) ? (
          <div className="component-mini-actions">
            {primaryLabel && primaryHref ? (
              <a
                href={primaryHref}
                onClick={(event) => {
                  if (editor.isEditable) event.preventDefault()
                }}
              >
                {primaryLabel}
              </a>
            ) : null}
            {secondaryLabel && secondaryHref ? (
              <a
                href={secondaryHref}
                onClick={(event) => {
                  if (editor.isEditable) event.preventDefault()
                }}
              >
                {secondaryLabel}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
      {editor.isEditable && isEditing ? (
        <RichBlockEditorPanel
          title="编辑富文本块"
          onCancel={() => cancelRichBlockEditing(deleteOnCancel, deleteNode, () => setIsEditing(false))}
          onSave={saveDraft}
        >
          <TextField
            label="图片 URL"
            value={draft.image}
            onChange={(value) => setDraft((current) => ({ ...current, image: value }))}
          />
          <TextField
            label="图片说明"
            value={draft.alt}
            onChange={(value) => setDraft((current) => ({ ...current, alt: value }))}
          />
          <TextField
            label="眉标"
            value={draft.eyebrow}
            onChange={(value) => setDraft((current) => ({ ...current, eyebrow: value }))}
          />
          <TextField
            label="标题"
            value={draft.title}
            onChange={(value) => setDraft((current) => ({ ...current, title: value }))}
          />
          <TextAreaField
            label="内容"
            value={draft.text}
            onChange={(value) => setDraft((current) => ({ ...current, text: value }))}
          />
          <TextField
            label="主按钮文本"
            value={draft.primaryLabel}
            onChange={(value) => setDraft((current) => ({ ...current, primaryLabel: value }))}
          />
          <TextField
            label="主按钮链接"
            value={draft.primaryHref}
            onChange={(value) => setDraft((current) => ({ ...current, primaryHref: value }))}
          />
          <TextField
            label="次按钮文本"
            value={draft.secondaryLabel}
            onChange={(value) => setDraft((current) => ({ ...current, secondaryLabel: value }))}
          />
          <TextField
            label="次按钮链接"
            value={draft.secondaryHref}
            onChange={(value) => setDraft((current) => ({ ...current, secondaryHref: value }))}
          />
        </RichBlockEditorPanel>
      ) : null}
    </NodeViewWrapper>
  )
}

function AudioView({ node, editor, updateAttributes, deleteNode }: NodeViewProps) {
  const src = getString(node.attrs.src)
  const title = getString(node.attrs.title, '嵌入音频')
  const caption = getString(node.attrs.caption, '音频 · 正文宽度媒体控件')
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState({ src, title, caption })
  const [deleteOnCancel, setDeleteOnCancel] = useState(node.attrs.openEditor === true)

  const startEditing = () => {
    setDraft({
      src: getDraftString(node.attrs.src, '', node.attrs.openEditor),
      title: getDraftString(node.attrs.title, '嵌入音频', node.attrs.openEditor),
      caption: getDraftString(node.attrs.caption, '音频 · 正文宽度媒体控件', node.attrs.openEditor),
    })
    setIsEditing(true)
  }

  useOpenEditorOnInsert(node.attrs.openEditor, startEditing, updateAttributes)

  const saveDraft = () => {
    updateAttributes({
      src: draft.src.trim(),
      title: draft.title.trim() || '嵌入音频',
      caption: draft.caption.trim() || '音频 · 正文宽度媒体控件',
    })
    setDeleteOnCancel(false)
    setIsEditing(false)
  }

  if (!src && !editor.isEditable) return null

  return (
    <NodeViewWrapper
      className="component-audio not-prose"
      data-rich-block="audio"
      data-rich-block-editable={editor.isEditable ? 'true' : undefined}
    >
      {editor.isEditable ? (
        <div className="component-block-edit-row">
          <RichBlockEditButton onClick={startEditing} label="编辑音频" />
        </div>
      ) : null}
      {!src ? (
        <div className="component-placeholder">
          <span>音频</span>
          <p>还没有音频 URL，点击编辑添加音频。</p>
        </div>
      ) : (
        <>
          <div>
            <Music2 className="h-5 w-5" />
            <span>
              <strong>{title}</strong>
              <small>{caption}</small>
            </span>
          </div>
          <audio controls preload="metadata" src={src}>
            当前浏览器不支持音频播放。
          </audio>
        </>
      )}
      {editor.isEditable && isEditing ? (
        <RichBlockEditorPanel
          title="编辑音频"
          placement="inline"
          onCancel={() => cancelRichBlockEditing(deleteOnCancel, deleteNode, () => setIsEditing(false))}
          onSave={saveDraft}
        >
          <TextField
            label="音频 URL"
            value={draft.src}
            onChange={(value) => setDraft((current) => ({ ...current, src: value }))}
          />
          <TextField
            label="标题"
            value={draft.title}
            onChange={(value) => setDraft((current) => ({ ...current, title: value }))}
          />
          <TextField
            label="说明"
            value={draft.caption}
            onChange={(value) => setDraft((current) => ({ ...current, caption: value }))}
          />
        </RichBlockEditorPanel>
      ) : null}
    </NodeViewWrapper>
  )
}

type FlowAttrs = {
  start: string
  question: string
  yes: string
  no: string
  end: string
}

function useOpenEditorOnInsert(
  openEditor: unknown,
  startEditing: () => void,
  updateAttributes: (attributes: Record<string, unknown>) => void,
) {
  useEffect(() => {
    if (openEditor !== true) return

    startEditing()
    updateAttributes({ openEditor: false })
  }, [openEditor, startEditing, updateAttributes])
}

function cancelRichBlockEditing(deleteOnCancel: boolean, deleteNode: () => void, closeEditor: () => void) {
  if (deleteOnCancel) {
    deleteNode()
    return
  }

  closeEditor()
}

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function getDraftString(value: unknown, fallback = '', openEditor: unknown) {
  if (openEditor === true) return typeof value === 'string' ? value : ''
  return getString(value, fallback)
}

function getCalloutTone(value: unknown): CalloutTone {
  return typeof value === 'string' && calloutTones.includes(value as CalloutTone) ? (value as CalloutTone) : 'note'
}

function getEmbedKind(value: unknown): EmbedKind {
  return value === 'video' ? 'video' : 'youtube'
}

function getCalloutIcon(tone: CalloutTone) {
  switch (tone) {
    case 'quote':
      return Quote
    case 'tip':
    case 'success':
      return CheckCircle2
    case 'important':
      return Info
    case 'warning':
    case 'caution':
      return CircleAlert
    case 'info':
    case 'note':
    default:
      return Info
  }
}

function getImageItems(value: unknown): RichImageItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const src = getString(record.src)
      if (!src) return null
      const file = getString(record.file, getFileName(src) || `image-${index + 1}.jpg`)
      return {
        src,
        file,
        alt: getString(record.alt, `图片说明：${file}`),
      }
    })
    .filter((item): item is RichImageItem => Boolean(item))
}

function getPanelItems(value: unknown): PanelItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const title = getString(record.title)
      const text = getString(record.text)
      if (!title || !text) return null
      return { title, text }
    })
    .filter((item): item is PanelItem => Boolean(item))
}

function getCardItems(value: unknown): CardItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const eyebrow = getString(record.eyebrow)
      const title = getString(record.title)
      const text = getString(record.text)
      if (!title || !text) return null
      return { eyebrow, title, text }
    })
    .filter((item): item is CardItem => Boolean(item))
}

function getDiagramItems(value: unknown): DiagramItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (typeof item === 'string') return { label: item }
      if (!item || typeof item !== 'object') return null
      const label = getString((item as Record<string, unknown>).label)
      return label ? { label } : null
    })
    .filter((item): item is DiagramItem => Boolean(item))
}

function getTimelineItems(value: unknown): TimelineItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const label = getString(record.label)
      const title = getString(record.title)
      const text = getString(record.text)
      if (!label || !title || !text) return null
      return { label, title, text }
    })
    .filter((item): item is TimelineItem => Boolean(item))
}

function getFileName(src: string) {
  try {
    const pathname = new URL(src).pathname
    return decodeURIComponent(pathname.split('/').filter(Boolean).pop() || '')
  } catch {
    return src.split('/').filter(Boolean).pop() || ''
  }
}
