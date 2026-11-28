'use client'

import type { ComponentType } from 'react'
import type { Content } from '@tiptap/react'
import {
  CheckSquare,
  CodeSquare,
  Columns3,
  FileText,
  FolderOpen,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Info,
  Layers3,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Music2,
  Network,
  PanelTop,
  Play,
  Quote,
  Rows3,
  Sigma,
  Table,
} from 'lucide-react'

export type EditorInsertAction = 'insertContent' | 'uploadImage' | 'pickMediaImage' | 'insertTable'

export type EditorInsertDefinition = {
  title: string
  description: string
  keywords?: string[]
  icon: ComponentType<{ className?: string }>
  action: EditorInsertAction
  content?: Content
}

export type EditorInsertGroup = {
  title: string
  items: EditorInsertDefinition[]
}

export const editorInsertRegistry: EditorInsertGroup[] = [
  {
    title: '基础',
    items: [
      {
        title: '正文',
        description: '插入一个空白段落',
        keywords: ['p', 'paragraph', 'text'],
        icon: FileText,
        action: 'insertContent',
        content: { type: 'paragraph' },
      },
      {
        title: '一级标题',
        description: '大章节标题',
        keywords: ['h1', 'heading1', 'title'],
        icon: Heading1,
        action: 'insertContent',
        content: {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: '一级标题' }],
        },
      },
      {
        title: '二级标题',
        description: '段落标题',
        keywords: ['h2', 'heading2', 'subtitle'],
        icon: Heading2,
        action: 'insertContent',
        content: {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '二级标题' }],
        },
      },
      {
        title: '三级标题',
        description: '小节标题',
        keywords: ['h3', 'heading3', 'section'],
        icon: Heading3,
        action: 'insertContent',
        content: {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: '三级标题' }],
        },
      },
      {
        title: '无序列表',
        description: '项目符号列表',
        keywords: ['ul', 'list', 'bullet'],
        icon: List,
        action: 'insertContent',
        content: {
          type: 'bulletList',
          content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '列表项' }] }] }],
        },
      },
      {
        title: '有序列表',
        description: '编号列表',
        keywords: ['ol', 'ordered', 'number', 'list'],
        icon: ListOrdered,
        action: 'insertContent',
        content: {
          type: 'orderedList',
          content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '列表项' }] }] }],
        },
      },
      {
        title: '任务',
        description: '待办事项',
        keywords: ['todo', 'task', 'checkbox', 'check'],
        icon: CheckSquare,
        action: 'insertContent',
        content: {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: '待办事项' }] }],
            },
          ],
        },
      },
      {
        title: '引用',
        description: '正文引用块',
        keywords: ['quote', 'blockquote', 'cite'],
        icon: Quote,
        action: 'insertContent',
        content: {
          type: 'blockquote',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: '引用内容' }] }],
        },
      },
      {
        title: '代码块',
        description: '与发布页一致的代码窗口',
        keywords: ['code', 'codeblock', 'pre', 'ts', 'js'],
        icon: CodeSquare,
        action: 'insertContent',
        content: {
          type: 'codeBlock',
          attrs: { language: 'ts' },
          content: [{ type: 'text', text: 'console.log("hello")' }],
        },
      },
      {
        title: '数学公式（块级）',
        description: '插入 LaTeX 块级公式',
        keywords: ['math', 'latex', 'katex', 'formula', 'equation'],
        icon: Sigma,
        action: 'insertContent',
        content: {
          type: 'blockMath',
          attrs: { latex: 'E = mc^2' },
        },
      },
      {
        title: '行内公式',
        description: '插入 LaTeX 行内公式',
        keywords: ['inlinemath', 'math', 'latex', 'katex'],
        icon: Sigma,
        action: 'insertContent',
        content: {
          type: 'inlineMath',
          attrs: { latex: 'a^2 + b^2 = c^2' },
        },
      },
      {
        title: '分割线',
        description: '插入水平分割线',
        keywords: ['hr', 'divider', 'line'],
        icon: Minus,
        action: 'insertContent',
        content: { type: 'horizontalRule' },
      },
    ],
  },
  {
    title: '媒体',
    items: [
      {
        title: '图片',
        description: '上传并插入单张图片',
        keywords: ['img', 'image', 'photo', 'pic', 'upload'],
        icon: ImageIcon,
        action: 'uploadImage',
      },
      {
        title: '媒体库图片',
        description: '从已上传媒体库选择图片',
        keywords: ['media', 'library', 'img', 'gallery'],
        icon: FolderOpen,
        action: 'pickMediaImage',
      },
      {
        title: '图集',
        description: '插入可编辑图片网格',
        keywords: ['gallery', 'images', 'grid'],
        icon: Rows3,
        action: 'insertContent',
        content: { type: 'articleGallery', attrs: { openEditor: true, images: [] } },
      },
      {
        title: '轮播',
        description: '插入可编辑图片轮播',
        keywords: ['slider', 'carousel', 'slides'],
        icon: Columns3,
        action: 'insertContent',
        content: { type: 'articleSlider', attrs: { openEditor: true, images: [] } },
      },
      {
        title: 'YouTube',
        description: '插入视频嵌入块',
        keywords: ['youtube', 'video', 'bilibili', 'embed'],
        icon: Play,
        action: 'insertContent',
        content: {
          type: 'articleEmbed',
          attrs: {
            openEditor: true,
            kind: 'youtube',
            src: '',
            title: '',
          },
        },
      },
      {
        title: '音频',
        description: '插入音频播放器',
        keywords: ['audio', 'music', 'mp3', 'podcast'],
        icon: Music2,
        action: 'insertContent',
        content: {
          type: 'articleAudio',
          attrs: {
            openEditor: true,
            src: '',
            title: '',
            caption: '',
          },
        },
      },
    ],
  },
  {
    title: '文章组件',
    items: [
      {
        title: '提示块',
        description: 'Callout / Note / Warning',
        keywords: ['callout', 'note', 'tip', 'warning', 'alert'],
        icon: Info,
        action: 'insertContent',
        content: {
          type: 'articleCallout',
          attrs: { openEditor: true, tone: 'note', title: '', text: '' },
        },
      },
      {
        title: '按钮',
        description: '插入正文操作按钮',
        keywords: ['button', 'btn', 'cta', 'link'],
        icon: LinkIcon,
        action: 'insertContent',
        content: {
          type: 'articleButton',
          attrs: { openEditor: true, label: '', href: '', variant: 'primary' },
        },
      },
      {
        title: '标签页',
        description: '多组内容切换',
        keywords: ['tabs', 'tab', 'panel'],
        icon: PanelTop,
        action: 'insertContent',
        content: {
          type: 'articleTabs',
          attrs: {
            openEditor: true,
            panels: [
              { title: '', text: '' },
              { title: '', text: '' },
            ],
          },
        },
      },
      {
        title: '折叠面板',
        description: '可展开的问答或说明',
        keywords: ['accordion', 'collapse', 'faq', 'details'],
        icon: FileText,
        action: 'insertContent',
        content: {
          type: 'articleAccordion',
          attrs: {
            openEditor: true,
            items: [{ title: '', text: '' }],
          },
        },
      },
      {
        title: '展示块',
        description: '媒体、摘要和操作入口',
        keywords: ['showcase', 'hero', 'banner', 'feature'],
        icon: Layers3,
        action: 'insertContent',
        content: {
          type: 'articleRichShowcase',
          attrs: {
            openEditor: true,
            image: '',
            alt: '',
            eyebrow: '',
            title: '',
            text: '',
            primaryLabel: '',
            primaryHref: '',
            secondaryLabel: '',
            secondaryHref: '',
          },
        },
      },
    ],
  },
  {
    title: '结构',
    items: [
      {
        title: '表格',
        description: '3 x 3 表格',
        keywords: ['table', 'grid', 'sheet'],
        icon: Table,
        action: 'insertTable',
      },
      {
        title: '流程图',
        description: '简易流程节点',
        keywords: ['flow', 'flowchart', 'process'],
        icon: CheckSquare,
        action: 'insertContent',
        content: {
          type: 'articleFlow',
          attrs: {
            openEditor: true,
            start: '',
            question: '',
            yes: '',
            no: '',
            end: '',
          },
        },
      },
      {
        title: '卡片',
        description: '三列摘要卡片',
        keywords: ['cards', 'card', 'columns'],
        icon: Columns3,
        action: 'insertContent',
        content: {
          type: 'articleCards',
          attrs: {
            openEditor: true,
            cards: [{ eyebrow: '', title: '', text: '' }],
          },
        },
      },
      {
        title: '关系图',
        description: '节点关系展示',
        keywords: ['diagram', 'graph', 'nodes'],
        icon: Network,
        action: 'insertContent',
        content: {
          type: 'articleDiagram',
          attrs: { openEditor: true, items: [{ label: '' }] },
        },
      },
      {
        title: '时间线',
        description: '阶段式说明',
        keywords: ['timeline', 'history', 'steps'],
        icon: Rows3,
        action: 'insertContent',
        content: {
          type: 'articleTimeline',
          attrs: {
            openEditor: true,
            items: [{ label: '', title: '', text: '' }],
          },
        },
      },
    ],
  },
]
