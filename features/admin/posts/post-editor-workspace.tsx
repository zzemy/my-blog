'use client'

import Link from 'next/link'
import type { Dispatch, MouseEvent, SetStateAction } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Languages,
  MoreHorizontal,
  PanelRight,
  Save,
  Search,
  Settings2,
  Star,
  Tag,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { TipTapEditor } from '@/features/blog/editor/tiptap-editor'
import { MarkdownShortcodeGuide } from '@/features/blog/editor/markdown-shortcode-guide'
import { calculateContentSize, generatePostSlug } from './form-utils'
import type { PostFormData } from './types'
import { nowLocalInput } from './utils'
import styles from './post-editor-workspace.module.css'

type PostEditorWorkspaceProps = {
  mode: 'new' | 'edit'
  formData: PostFormData
  setFormData: Dispatch<SetStateAction<PostFormData>>
  saving: boolean
  error: string | null
  success: boolean
  onSubmit: (published: boolean) => void
  onDelete?: () => void
}

type OutlineItem = {
  id: string
  text: string
  level: number
}

type JsonNode = {
  type?: unknown
  attrs?: unknown
  content?: unknown
  text?: unknown
}

export function PostEditorWorkspace({
  mode,
  formData,
  setFormData,
  saving,
  error,
  success,
  onSubmit,
  onDelete,
}: PostEditorWorkspaceProps) {
  const [draftTag, setDraftTag] = useState('')
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const outline = useMemo(() => collectOutline(formData.content), [formData.content])
  const wordCount = calculateContentSize(formData.content)
  const publishLabel = mode === 'edit' ? (formData.published ? '更新文章' : '发布文章') : '发布文章'

  useEffect(() => {
    const titleInput = titleRef.current
    if (!titleInput) return

    titleInput.style.height = '0px'
    titleInput.style.height = `${titleInput.scrollHeight}px`
  }, [formData.title])

  const updateForm = (patch: Partial<PostFormData>) => {
    setFormData((current) => ({ ...current, ...patch }))
  }

  const generateSlugFromTitle = () => {
    updateForm({ slug: generatePostSlug(formData.title) })
  }

  const addTag = () => {
    const tag = draftTag.trim()
    if (!tag || formData.tags.includes(tag)) return

    updateForm({ tags: [...formData.tags, tag] })
    setDraftTag('')
  }

  const removeTag = (tagToRemove: string) => {
    updateForm({ tags: formData.tags.filter((tag) => tag !== tagToRemove) })
  }

  const jumpToOutlineItem = (event: MouseEvent<HTMLAnchorElement>, item: OutlineItem) => {
    event.preventDefault()

    const target = document.getElementById(item.id)
    if (!target) return

    scrollElementIntoEditorView(target, 140)
    window.history.replaceState(null, '', `#${item.id}`)
  }

  return (
    <div className={styles.workspace}>
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <Link href="/admin/posts">
            <Button variant="ghost" size="sm" className={styles.topbarButton}>
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
          </Link>
          <div className={styles.docCrumb}>
            <span>后台文章</span>
            <strong>{formData.title.trim() || '未命名文档'}</strong>
          </div>
        </div>
        <div className={styles.topbarRight}>
          {success ? (
            <span className={styles.successState}>
              <CheckCircle className="h-4 w-4" />
              已保存
            </span>
          ) : (
            <span className={styles.saveState}>{saving ? '正在保存...' : '草稿未提交'}</span>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className={styles.iconButton} aria-label="高级入口">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className={styles.advancedSheet}>
              <SheetHeader>
                <SheetTitle>Markdown 与高级块</SheetTitle>
                <SheetDescription>粘贴 Markdown 会自动转换；这里保留 shortcode 参考。</SheetDescription>
              </SheetHeader>
              <MarkdownShortcodeGuide />
            </SheetContent>
          </Sheet>
          <Button type="button" variant="outline" onClick={() => onSubmit(false)} disabled={saving}>
            <Save className="h-4 w-4" />
            保存草稿
          </Button>
          <Button type="button" onClick={() => onSubmit(true)} disabled={saving}>
            <Save className="h-4 w-4" />
            {publishLabel}
          </Button>
        </div>
      </header>

      {error ? (
        <div className={styles.errorBanner}>
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className={styles.body}>
        <aside className={styles.outlinePanel}>
          <div className={styles.outlineHeader}>
            <FileText className="h-4 w-4" />
            <span>文档大纲</span>
          </div>
          <nav className={styles.outlineList} aria-label="文章大纲">
            {outline.length ? (
              outline.map((item) => (
                <a key={item.id} href={`#${item.id}`} data-level={item.level} onClick={(event) => jumpToOutlineItem(event, item)}>
                  {item.text}
                </a>
              ))
            ) : (
              <p>正文标题会显示在这里。</p>
            )}
          </nav>
        </aside>

        <main className={styles.documentPane}>
          <div className={styles.documentMeta}>
            <span>{mode === 'new' ? '新文章' : '编辑文章'}</span>
            <span>{wordCount} 字符</span>
            <span>{formData.locale.toUpperCase()}</span>
          </div>
          <textarea
            ref={titleRef}
            value={formData.title}
            onChange={(event) => updateForm({ title: event.target.value })}
            onBlur={generateSlugFromTitle}
            placeholder="未命名文档"
            className={styles.titleInput}
            rows={1}
          />
          <TipTapEditor
            content={formData.content}
            onChange={(content) => updateForm({ content })}
            placeholder="输入 / 插入内容块，或直接粘贴 Markdown..."
          />
        </main>

        <aside className={styles.inspector}>
          <section className={styles.inspectorSection}>
            <h2>
              <PanelRight className="h-4 w-4" />
              基础信息
            </h2>
            <label>
              <span>URL Slug</span>
              <div className={styles.inlineControl}>
                <Input value={formData.slug} onChange={(event) => updateForm({ slug: event.target.value })} />
                <Button type="button" variant="outline" size="sm" onClick={generateSlugFromTitle}>
                  生成
                </Button>
              </div>
            </label>
            <label>
              <span>语言</span>
              <select value={formData.locale} onChange={(event) => updateForm({ locale: event.target.value })}>
                <option value="zh">中文</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="ja">日本語</option>
              </select>
            </label>
            <label>
              <span>摘要</span>
              <Textarea
                value={formData.description}
                onChange={(event) => updateForm({ description: event.target.value })}
                placeholder="用于列表页、SEO fallback 和文章摘要。"
                className={styles.compactTextarea}
              />
            </label>
          </section>

          <section className={styles.inspectorSection}>
            <h2>
              <Settings2 className="h-4 w-4" />
              发布设置
            </h2>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(event) => {
                  const checked = event.target.checked
                  updateForm({
                    published: checked,
                    published_at: checked && !formData.published_at ? nowLocalInput() : formData.published_at,
                  })
                }}
              />
              <span>设定发布时间</span>
            </label>
            {formData.published ? (
              <label>
                <span>
                  <Calendar className="h-4 w-4" />
                  发布时间
                </span>
                <Input
                  type="datetime-local"
                  value={formData.published_at}
                  onChange={(event) => updateForm({ published_at: event.target.value })}
                />
              </label>
            ) : null}
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(event) => updateForm({ featured: event.target.checked })}
              />
              <span>
                <Star className="h-4 w-4" />
                特色文章
              </span>
            </label>
          </section>

          <section className={styles.inspectorSection}>
            <h2>
              <Tag className="h-4 w-4" />
              标签
            </h2>
            <div className={styles.tagInput}>
              <Input
                value={draftTag}
                onChange={(event) => setDraftTag(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addTag()
                  }
                }}
                placeholder="输入标签"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                添加
              </Button>
            </div>
            <div className={styles.tags}>
              {formData.tags.map((tag) => (
                <button key={tag} type="button" onClick={() => removeTag(tag)} title="点击移除标签">
                  {tag}
                  <span>×</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.inspectorSection}>
            <h2>
              <ImageIcon className="h-4 w-4" />
              封面
            </h2>
            <Input
              value={formData.cover_image}
              onChange={(event) => updateForm({ cover_image: event.target.value })}
              placeholder="https://example.com/image.jpg"
            />
            {formData.cover_image ? (
              <div className={styles.coverPreview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={formData.cover_image} alt="Cover preview" referrerPolicy="no-referrer" />
              </div>
            ) : null}
          </section>

          <section className={styles.inspectorSection}>
            <h2>
              <Search className="h-4 w-4" />
              SEO
            </h2>
            <label>
              <span>SEO 标题</span>
              <Input value={formData.seo_title} onChange={(event) => updateForm({ seo_title: event.target.value })} />
            </label>
            <label>
              <span>SEO 描述</span>
              <Textarea
                value={formData.seo_description}
                onChange={(event) => updateForm({ seo_description: event.target.value })}
              />
            </label>
          </section>

          <section className={styles.inspectorSection}>
            <h2>
              <Languages className="h-4 w-4" />
              操作
            </h2>
            <Button type="button" variant="outline" onClick={() => onSubmit(false)} disabled={saving}>
              保存草稿
            </Button>
            <Button type="button" onClick={() => onSubmit(true)} disabled={saving}>
              {publishLabel}
            </Button>
            {onDelete ? (
              <Button type="button" variant="outline" className={styles.deleteButton} onClick={onDelete} disabled={saving}>
                <Trash2 className="h-4 w-4" />
                删除文章
              </Button>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  )
}

function collectOutline(content: PostFormData['content']) {
  const items: OutlineItem[] = []
  if (!content || !isRecord(content)) return items

  walkNode(content, (node) => {
    if (node.type !== 'heading') return

    const level = getHeadingLevel(node)
    const text = getText(node).trim()
    if (!text) return

    items.push({
      id: `outline-${items.length + 1}`,
      text,
      level,
    })
  })

  return items
}

function walkNode(value: unknown, visit: (node: JsonNode) => void) {
  if (!isRecord(value)) return

  visit(value)
  if (!Array.isArray(value.content)) return

  value.content.forEach((child) => walkNode(child, visit))
}

function getText(node: JsonNode): string {
  if (typeof node.text === 'string') return node.text
  if (!Array.isArray(node.content)) return ''

  return node.content.map((child) => getText(isRecord(child) ? child : {})).join('')
}

function getHeadingLevel(node: JsonNode) {
  if (!isRecord(node.attrs)) return 1
  return typeof node.attrs.level === 'number' ? node.attrs.level : 1
}

function isRecord(value: unknown): value is JsonNode & Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function scrollElementIntoEditorView(target: HTMLElement, offset: number) {
  const container = getScrollContainer(target)

  if (!container || container === document.documentElement || container === document.body) {
    const top = target.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    return
  }

  const containerRect = container.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const top = container.scrollTop + targetRect.top - containerRect.top - offset

  container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
}

function getScrollContainer(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement

  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent)
    const canScroll = /(auto|scroll|overlay)/.test(style.overflowY)

    if (canScroll && parent.scrollHeight > parent.clientHeight) {
      return parent
    }

    parent = parent.parentElement
  }

  return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : document.documentElement
}
