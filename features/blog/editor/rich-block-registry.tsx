'use client'

import type { ComponentType } from 'react'
import type { Content } from '@tiptap/react'
import {
  CheckSquare,
  CodeSquare,
  Columns3,
  FileText,
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
  Table,
} from 'lucide-react'

export type EditorInsertAction = 'insertContent' | 'uploadImage' | 'insertTable'

export type EditorInsertDefinition = {
  title: string
  description: string
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
        icon: FileText,
        action: 'insertContent',
        content: { type: 'paragraph' },
      },
      {
        title: '一级标题',
        description: '大章节标题',
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
        icon: CodeSquare,
        action: 'insertContent',
        content: {
          type: 'codeBlock',
          attrs: { language: 'ts' },
          content: [{ type: 'text', text: 'console.log("hello")' }],
        },
      },
      {
        title: '分割线',
        description: '插入水平分割线',
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
        icon: ImageIcon,
        action: 'uploadImage',
      },
      {
        title: '图集',
        description: '插入可编辑图片网格',
        icon: Rows3,
        action: 'insertContent',
        content: { type: 'articleGallery', attrs: { openEditor: true, images: [] } },
      },
      {
        title: '轮播',
        description: '插入可编辑图片轮播',
        icon: Columns3,
        action: 'insertContent',
        content: { type: 'articleSlider', attrs: { openEditor: true, images: [] } },
      },
      {
        title: 'YouTube',
        description: '插入视频嵌入块',
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
        icon: Table,
        action: 'insertTable',
      },
      {
        title: '流程图',
        description: '简易流程节点',
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
