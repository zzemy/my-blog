'use client'

/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'
import { Node, mergeAttributes, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Info,
  Layers3,
  Lightbulb,
  MousePointerClick,
  Music2,
  Network,
  Play,
  Quote,
} from 'lucide-react'

export type RichImageItem = {
  src: string
  alt: string
  file: string
}

type CalloutTone = 'note' | 'quote' | 'tip' | 'info' | 'warning' | 'success'

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

const calloutTones: CalloutTone[] = ['note', 'quote', 'tip', 'info', 'warning', 'success']

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

function CalloutView({ node }: NodeViewProps) {
  const tone = getCalloutTone(node.attrs.tone)
  const title = getString(node.attrs.title, '备注')
  const text = getString(node.attrs.text, '这是一条普通备注。')
  const Icon = getCalloutIcon(tone)

  return (
    <NodeViewWrapper className="component-stack not-prose" data-rich-block="callout">
      <div className={`component-callout component-callout-${tone}`}>
        <div className="component-callout-icon">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="component-callout-title">{title}</p>
          <p>{text}</p>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

function ButtonView({ node }: NodeViewProps) {
  const label = getString(node.attrs.label, '按钮')
  const href = getString(node.attrs.href, '#')
  const variant = getString(node.attrs.variant, 'primary') === 'secondary' ? 'secondary' : 'primary'

  return (
    <NodeViewWrapper className="component-button-row not-prose" data-rich-block="button">
      <a className={`component-button component-button-${variant}`} href={href}>
        <span>{label}</span>
        <MousePointerClick className="h-4 w-4" />
      </a>
    </NodeViewWrapper>
  )
}

function TabsView({ node }: NodeViewProps) {
  const panels = getPanelItems(node.attrs.panels)
  const [active, setActive] = useState(0)

  return (
    <NodeViewWrapper className="component-tabs not-prose" data-rich-block="tabs">
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
    </NodeViewWrapper>
  )
}

function AccordionView({ node }: NodeViewProps) {
  const items = getPanelItems(node.attrs.items)

  return (
    <NodeViewWrapper className="component-accordions not-prose" data-rich-block="accordion">
      {items.map((item, index) => (
        <details key={`${item.title}-${index}`} open={index === 0}>
          <summary>{item.title}</summary>
          <p>{item.text}</p>
        </details>
      ))}
    </NodeViewWrapper>
  )
}

function GalleryView({ node }: NodeViewProps) {
  const images = getImageItems(node.attrs.images)

  return (
    <NodeViewWrapper className="component-gallery not-prose" data-rich-block="gallery">
      {images.map((image) => (
        <figure key={`${image.file}-${image.src}`}>
          <img src={image.src} alt={image.alt} referrerPolicy="no-referrer" />
          <figcaption>{image.file}</figcaption>
        </figure>
      ))}
    </NodeViewWrapper>
  )
}

function SliderView({ node }: NodeViewProps) {
  const images = getImageItems(node.attrs.images)
  const [active, setActive] = useState(0)
  const activeImage = images[active] || images[0]

  if (!activeImage) return null

  const showPrevious = () => {
    setActive((current) => (current === 0 ? images.length - 1 : current - 1))
  }

  const showNext = () => {
    setActive((current) => (current + 1) % images.length)
  }

  return (
    <NodeViewWrapper className="component-slider not-prose" data-rich-block="slider">
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
    </NodeViewWrapper>
  )
}

function EmbedView({ node }: NodeViewProps) {
  const kind = getString(node.attrs.kind, 'youtube')
  const src = getString(node.attrs.src)
  const title = getString(node.attrs.title, kind === 'video' ? '自定义视频' : 'YouTube 视频')
  const poster = getString(node.attrs.poster)

  if (!src) return null

  return (
    <NodeViewWrapper
      className={`component-embed ${kind === 'video' ? 'component-custom-video' : ''} not-prose`}
      data-rich-block="embed"
    >
      {kind === 'video' ? (
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
    </NodeViewWrapper>
  )
}

function FlowView({ node }: NodeViewProps) {
  const flow: Record<keyof FlowAttrs, FlowNode> = {
    start: { label: getString(node.attrs.start, '开始') },
    question: { label: getString(node.attrs.question, '内容完整？') },
    yes: { label: getString(node.attrs.yes, '预览发布') },
    no: { label: getString(node.attrs.no, '继续修改') },
    end: { label: getString(node.attrs.end, '归档') },
  }

  return (
    <NodeViewWrapper className="component-flow not-prose" data-rich-block="flow" aria-label="正文发布流程示例">
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
    </NodeViewWrapper>
  )
}

function CardsView({ node }: NodeViewProps) {
  const cards = getCardItems(node.attrs.cards)

  if (!cards.length) return null

  return (
    <NodeViewWrapper className="component-card-grid not-prose" data-rich-block="cards">
      {cards.map((card) => (
        <article key={`${card.eyebrow}-${card.title}`} className="component-card">
          <span>{card.eyebrow}</span>
          <h3>{card.title}</h3>
          <p>{card.text}</p>
        </article>
      ))}
    </NodeViewWrapper>
  )
}

function DiagramView({ node }: NodeViewProps) {
  const items = getDiagramItems(node.attrs.items)

  if (!items.length) return null

  return (
    <NodeViewWrapper className="component-diagram not-prose" data-rich-block="diagram" aria-label="内容关系图">
      {items.map((item) => (
        <div key={item.label}>
          <Network className="h-4 w-4" />
          <span>{item.label}</span>
        </div>
      ))}
    </NodeViewWrapper>
  )
}

function TimelineView({ node }: NodeViewProps) {
  const items = getTimelineItems(node.attrs.items)

  if (!items.length) return null

  return (
    <NodeViewWrapper as="ol" className="component-timeline not-prose" data-rich-block="timeline">
      {items.map((item) => (
        <li key={`${item.label}-${item.title}`}>
          <span>{item.label}</span>
          <div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        </li>
      ))}
    </NodeViewWrapper>
  )
}

function RichShowcaseView({ node }: NodeViewProps) {
  const image = getString(node.attrs.image)
  const alt = getString(node.attrs.alt, '图片说明')
  const eyebrow = getString(node.attrs.eyebrow, '富文本块')
  const title = getString(node.attrs.title, '混合正文模块')
  const text = getString(node.attrs.text, '一个块里同时承载媒体、摘要、状态和操作入口。')
  const primaryLabel = getString(node.attrs.primaryLabel)
  const primaryHref = getString(node.attrs.primaryHref)
  const secondaryLabel = getString(node.attrs.secondaryLabel)
  const secondaryHref = getString(node.attrs.secondaryHref)

  return (
    <NodeViewWrapper className="component-rich-showcase not-prose" data-rich-block="rich-showcase">
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
            {primaryLabel && primaryHref ? <a href={primaryHref}>{primaryLabel}</a> : null}
            {secondaryLabel && secondaryHref ? <a href={secondaryHref}>{secondaryLabel}</a> : null}
          </div>
        ) : null}
      </div>
    </NodeViewWrapper>
  )
}

function AudioView({ node }: NodeViewProps) {
  const src = getString(node.attrs.src)
  const title = getString(node.attrs.title, '嵌入音频')
  const caption = getString(node.attrs.caption, '音频 · 正文宽度媒体控件')

  if (!src) return null

  return (
    <NodeViewWrapper className="component-audio not-prose" data-rich-block="audio">
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

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function getCalloutTone(value: unknown): CalloutTone {
  return typeof value === 'string' && calloutTones.includes(value as CalloutTone) ? (value as CalloutTone) : 'note'
}

function getCalloutIcon(tone: CalloutTone) {
  switch (tone) {
    case 'quote':
      return Quote
    case 'tip':
      return Lightbulb
    case 'warning':
      return AlertTriangle
    case 'success':
      return CheckCircle2
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
