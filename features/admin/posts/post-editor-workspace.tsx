'use client'

import type { ChangeEvent, Dispatch, MouseEvent, SetStateAction } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  FolderOpen,
  History,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Save,
  Search,
  Settings2,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ModeToggle } from '@/shared/layout/mode-toggle'
import { TipTapEditor } from '@/features/blog/editor/tiptap-editor'
import type { TipTapEditorHandle } from '@/features/blog/editor/tiptap-editor'
import { MarkdownShortcodeGuide } from '@/features/blog/editor/markdown-shortcode-guide'
import { uploadImage } from '@/lib/upload-image'
import {
  calculateContentSize,
  clearLocalDraft,
  estimateReadingMinutes,
  generatePostSlug,
  loadLocalDraft,
  saveLocalDraft,
} from './form-utils'
import type { LocalDraftSnapshot } from './form-utils'
import { MediaPickerDialog } from './media-picker-dialog'
import { EditorAiSheet } from '@/features/ai/components/editor-ai-sheet'
import type { PostFormData } from './types'
import { nowLocalInput } from './utils'
import styles from './post-editor-workspace.module.css'

type PostEditorWorkspaceProps = {
  mode: 'new' | 'edit'
  postId?: string | null
  draftKey: string
  formData: PostFormData
  setFormData: Dispatch<SetStateAction<PostFormData>>
  isDirty: boolean
  saving: boolean
  error: string | null
  onDismissError?: () => void
  success: boolean
  lastSavedAt?: string | null
  publicUrl?: string | null
  onSubmit: (published: boolean) => void
  onDelete?: () => void
}

type OutlineItem = {
  id: string
  text: string
  level: number
  index: number
}

type JsonNode = {
  type?: unknown
  attrs?: unknown
  content?: unknown
  text?: unknown
}

export function PostEditorWorkspace({
  mode,
  postId,
  draftKey,
  formData,
  setFormData,
  isDirty,
  saving,
  error,
  onDismissError,
  success,
  lastSavedAt,
  publicUrl,
  onSubmit,
  onDelete,
}: PostEditorWorkspaceProps) {
  const router = useRouter()
  const [draftTag, setDraftTag] = useState('')
  const [outlineQuery, setOutlineQuery] = useState('')
  const [markdownDraft, setMarkdownDraft] = useState('')
  const [markdownImporting, setMarkdownImporting] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [aiSheetOpen, setAiSheetOpen] = useState(false)
  const [outlineOpen, setOutlineOpen] = useState(true)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverPickerOpen, setCoverPickerOpen] = useState(false)
  const [recoverableDraft, setRecoverableDraft] = useState<LocalDraftSnapshot | null>(null)
  const [localDraftSavedAt, setLocalDraftSavedAt] = useState<string | null>(null)

  const titleRef = useRef<HTMLTextAreaElement>(null)
  const summaryRef = useRef<HTMLTextAreaElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const documentPaneRef = useRef<HTMLElement>(null)
  const inspectorRef = useRef<HTMLElement>(null)
  const editorRef = useRef<TipTapEditorHandle>(null)
  const draftCheckedKeyRef = useRef<string | null>(null)

  const outline = useMemo(() => collectOutline(formData.content), [formData.content])
  const filteredOutline = useMemo(() => {
    const query = outlineQuery.trim().toLowerCase()
    if (!query) return outline
    return outline.filter((item) => item.text.toLowerCase().includes(query))
  }, [outline, outlineQuery])

  const wordCount = useMemo(() => calculateContentSize(formData.content), [formData.content])
  const readingMinutes = estimateReadingMinutes(wordCount)
  const publishLabel = mode === 'edit' ? (formData.published ? '更新文章' : '发布文章') : '发布文章'
  const isFocusMode = !outlineOpen && !inspectorOpen
  const hasSeoValues = Boolean(formData.seo_title.trim() || formData.seo_description.trim())

  // Auto-resize title textarea
  useEffect(() => {
    const titleInput = titleRef.current
    if (!titleInput) return

    titleInput.style.height = '0px'
    titleInput.style.height = `${titleInput.scrollHeight}px`
  }, [formData.title])

  // Auto-resize inline summary textarea
  useEffect(() => {
    const summaryInput = summaryRef.current
    if (!summaryInput) return

    summaryInput.style.height = '0px'
    summaryInput.style.height = `${summaryInput.scrollHeight}px`
  }, [formData.description])

  // Check for recoverable local draft once per draftKey
  useEffect(() => {
    if (!draftKey || draftCheckedKeyRef.current === draftKey) return
    draftCheckedKeyRef.current = draftKey

    const stored = loadLocalDraft(draftKey)
    if (!stored) return

    if (JSON.stringify(stored.formData) !== JSON.stringify(formData)) {
      setRecoverableDraft(stored)
    }
  }, [draftKey, formData])

  // Debounced local draft backup when dirty
  useEffect(() => {
    if (!isDirty || !draftKey) return

    const timer = window.setTimeout(() => {
      saveLocalDraft(draftKey, formData)
      setLocalDraftSavedAt(new Date().toISOString())
    }, 1200)

    return () => window.clearTimeout(timer)
  }, [draftKey, formData, isDirty])

  // Warn browser tab close/refresh when dirty
  useEffect(() => {
    if (!isDirty) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Auto-open & scroll right inspector when a rich block enters inspector edit mode
  useEffect(() => {
    const handleRichBlockOpen = () => {
      setInspectorOpen(true)
      window.requestAnimationFrame(() => {
        inspectorRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }

    window.addEventListener('admin-rich-block-edit-open', handleRichBlockOpen)
    return () => window.removeEventListener('admin-rich-block-edit-open', handleRichBlockOpen)
  }, [])

  // Auto-open inspector when validation fails on an inspector field (Slug or Tags)
  useEffect(() => {
    if (!error) return
    if (error.includes('Slug') || error.includes('标签')) {
      setInspectorOpen(true)
    }
  }, [error])

  // Keyboard shortcuts: Ctrl+S preserves publish state, Ctrl+\ toggles Focus Mode, Esc closes Advanced Sheet
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        if (!saving) {
          onSubmit(mode === 'edit' ? formData.published : false)
        }
        return
      }

      if ((event.ctrlKey || event.metaKey) && event.key === '\\') {
        event.preventDefault()
        const nextOpen = !outlineOpen && !inspectorOpen
        setOutlineOpen(nextOpen)
        setInspectorOpen(nextOpen)
        return
      }

      if (event.key === 'Escape' && advancedOpen) {
        setAdvancedOpen(false)
      }
    }

    document.addEventListener('keydown', handleShortcut)
    return () => document.removeEventListener('keydown', handleShortcut)
  }, [advancedOpen, formData.published, inspectorOpen, mode, onSubmit, outlineOpen, saving])

  const updateForm = (patch: Partial<PostFormData>) => {
    setFormData((current) => ({ ...current, ...patch }))
  }

  const generateSlugIfEmpty = () => {
    if (formData.slug.trim()) return
    const generated = generatePostSlug(formData.title)
    if (generated) {
      updateForm({ slug: generated })
    }
  }

  const generateSlugFromTitle = () => {
    updateForm({ slug: generatePostSlug(formData.title) })
  }

  const addTagsFromInput = (raw: string) => {
    const candidates = raw
      .split(/[,，]+/)
      .map((item) => item.trim())
      .filter(Boolean)

    if (!candidates.length) return

    const uniqueNew = candidates.filter((tag) => !formData.tags.includes(tag))
    if (uniqueNew.length > 0) {
      updateForm({ tags: [...formData.tags, ...uniqueNew] })
    }
    setDraftTag('')
  }

  const removeTag = (tagToRemove: string) => {
    updateForm({ tags: formData.tags.filter((tag) => tag !== tagToRemove) })
  }

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCoverUploading(true)
    try {
      const url = await uploadImage(file)
      if (!url) {
        toast.error('封面上传失败，请检查文件格式与大小（不超过 5MB）')
        return
      }
      updateForm({ cover_image: url })
      toast.success('封面图已上传')
    } finally {
      setCoverUploading(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const restoreLocalDraft = () => {
    if (!recoverableDraft) return

    setFormData(recoverableDraft.formData)
    editorRef.current?.setContent(recoverableDraft.formData.content)
    setRecoverableDraft(null)
    toast.success('已恢复本地草稿')
  }

  const dismissLocalDraft = () => {
    clearLocalDraft(draftKey)
    setRecoverableDraft(null)
  }

  const handleBackNavigation = () => {
    if (isDirty) {
      setLeaveDialogOpen(true)
      return
    }
    router.push('/admin/posts')
  }

  const toggleFocusMode = () => {
    if (isFocusMode) {
      setOutlineOpen(true)
      setInspectorOpen(true)
    } else {
      setOutlineOpen(false)
      setInspectorOpen(false)
    }
  }

  const importMarkdown = async (importMode: 'insert' | 'replace') => {
    const markdown = markdownDraft.trim()
    if (!markdown) {
      toast.error('请先粘贴 Markdown 内容')
      return
    }

    setMarkdownImporting(true)
    try {
      await editorRef.current?.importMarkdown(markdown, importMode)
      setMarkdownDraft('')
      setAdvancedOpen(false)
      toast.success(importMode === 'replace' ? '已替换正文内容' : '已插入 Markdown 内容')
    } catch (importError) {
      console.error('Failed to import Markdown:', importError)
      toast.error('Markdown 导入失败，请检查内容格式')
    } finally {
      setMarkdownImporting(false)
    }
  }

  const jumpToOutlineItem = (event: MouseEvent<HTMLAnchorElement>, item: OutlineItem) => {
    event.preventDefault()
    setActiveOutlineId(item.id)

    const target = document.getElementById(item.id) || getEditorHeadingByIndex(item.index)
    if (!target) return

    if (!target.id) {
      target.id = item.id
      target.style.scrollMarginTop = '88px'
    }

    target.classList.remove('admin-editor-heading-flash')
    scrollHeadingIntoView(target, documentPaneRef.current, 'smooth')
    window.setTimeout(() => {
      scrollHeadingIntoView(target, documentPaneRef.current, 'auto')
      target.classList.add('admin-editor-heading-flash')
      window.setTimeout(() => target.classList.remove('admin-editor-heading-flash'), 1100)
    }, 260)

    window.history.replaceState(null, '', `#${item.id}`)
  }

  const bodyClassName = [
    styles.body,
    !outlineOpen ? styles.bodyNoOutline : '',
    !inspectorOpen ? styles.bodyNoInspector : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.workspace}>
      <header className={styles.topbar} data-editor-topbar="true">
        <div className={styles.topbarLeft}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={styles.topbarBackButton}
            onClick={handleBackNavigation}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>文章管理</span>
          </Button>
          <span className={styles.topbarDivider} aria-hidden="true" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`${styles.iconButton} ${outlineOpen ? styles.iconButtonActive : ''}`}
            onClick={() => setOutlineOpen((open) => !open)}
            aria-label={outlineOpen ? '收起大纲' : '展开大纲'}
            title={outlineOpen ? '收起大纲' : '展开大纲'}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          <div className={styles.docCrumb}>
            <span className={formData.published ? styles.statusBadgePublished : styles.statusBadgeDraft}>
              <i aria-hidden="true" />
              {formData.published ? '已发布' : '草稿'}
            </span>
            <strong>{formData.title.trim() || '未命名文档'}</strong>
          </div>
        </div>

        <div className={styles.topbarRight}>
          {saving ? (
            <span className={styles.saveText}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              正在保存...
            </span>
          ) : error ? (
            <span className={styles.errorText}>
              <AlertCircle className="h-3.5 w-3.5" />
              保存失败
            </span>
          ) : success && !isDirty ? (
            <span className={styles.successText}>
              <CheckCircle className="h-3.5 w-3.5" />
              已保存 {lastSavedAt ? formatClockTime(lastSavedAt) : ''}
            </span>
          ) : isDirty ? (
            <span className={styles.dirtyText} title="Ctrl+S 快速保存">
              未保存{localDraftSavedAt ? ` · 本地备份 ${formatClockTime(localDraftSavedAt)}` : ''}
            </span>
          ) : (
            <span className={styles.saveText}>
              {lastSavedAt ? `更新于 ${formatClockTime(lastSavedAt)}` : '新草稿'}
            </span>
          )}

          <span className={styles.topbarDivider} aria-hidden="true" />

          <div className={styles.topbarTools}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-2.5 text-xs"
              onClick={() => setAiSheetOpen(true)}
              title="打开 AI 写作、摘要与多语言翻译助手"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>AI 助手</span>
            </Button>
            {publicUrl ? (
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.viewPublicLink}
                title="在新标签页查看已发布文章"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>预览</span>
              </a>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`${styles.iconButton} ${isFocusMode ? styles.iconButtonActive : ''}`}
              onClick={toggleFocusMode}
              aria-label={isFocusMode ? '退出专注模式' : '专注模式'}
              title={`${isFocusMode ? '退出专注模式' : '专注模式'} (Ctrl+\\)`}
            >
              {isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <ModeToggle />
            <Sheet open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={styles.iconButton}
                  aria-label="Markdown 与高级入口"
                  title="Markdown 导入与 Shortcode 参考"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className={styles.advancedSheet}>
                <SheetHeader>
                  <SheetTitle>Markdown 与高级块</SheetTitle>
                  <SheetDescription>粘贴 Markdown 会自动转换；也可以在这里批量导入。</SheetDescription>
                </SheetHeader>
                <Tabs defaultValue="import" className={styles.advancedTabs}>
                  <TabsList className={styles.advancedTabsList}>
                    <TabsTrigger value="import">导入 Markdown</TabsTrigger>
                    <TabsTrigger value="guide">Shortcode 参考</TabsTrigger>
                  </TabsList>
                  <TabsContent value="import" className={styles.markdownImportPanel}>
                    <label>
                      <span>Markdown 内容</span>
                      <Textarea
                        value={markdownDraft}
                        onChange={(event) => setMarkdownDraft(event.target.value)}
                        placeholder="# 标题&#10;&#10;正文、表格、代码块或 shortcode..."
                        rows={14}
                      />
                    </label>
                    <div className={styles.markdownImportActions}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void importMarkdown('insert')}
                        disabled={markdownImporting}
                      >
                        插入到光标
                      </Button>
                      <Button type="button" onClick={() => void importMarkdown('replace')} disabled={markdownImporting}>
                        替换正文
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="guide">
                    <MarkdownShortcodeGuide />
                  </TabsContent>
                </Tabs>
              </SheetContent>
            </Sheet>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`${styles.iconButton} ${inspectorOpen ? styles.iconButtonActive : ''}`}
              onClick={() => setInspectorOpen((open) => !open)}
              aria-label={inspectorOpen ? '收起文档设置' : '展开文档设置'}
              title={inspectorOpen ? '收起文档设置' : '展开文档设置'}
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          </div>

          <span className={styles.topbarDivider} aria-hidden="true" />

          <div className={styles.topbarActions}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={styles.draftButton}
              onClick={() => onSubmit(false)}
              disabled={saving}
              title="保存为草稿"
            >
              保存草稿
            </Button>
            <Button
              type="button"
              size="sm"
              className={styles.publishButton}
              onClick={() => onSubmit(true)}
              disabled={saving}
              title={mode === 'edit' && formData.published ? '更新已发布文章 (Ctrl+S)' : '发布文章'}
            >
              <Save className="h-3.5 w-3.5" />
              {publishLabel}
            </Button>
          </div>
        </div>
      </header>

      {recoverableDraft ? (
        <div className={styles.recoveryBanner} role="status">
          <div className={styles.recoveryInfo}>
            <History className="h-4 w-4" />
            <span>
              检测到 {formatDateTime(recoverableDraft.savedAt)} 的本地未保存草稿
              {recoverableDraft.formData.title ? `（${recoverableDraft.formData.title}）` : ''}
            </span>
          </div>
          <div className={styles.recoveryActions}>
            <Button type="button" size="sm" variant="outline" onClick={dismissLocalDraft}>
              忽略
            </Button>
            <Button type="button" size="sm" onClick={restoreLocalDraft}>
              恢复草稿
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          {onDismissError ? (
            <button type="button" className={styles.bannerClose} onClick={onDismissError} aria-label="关闭错误提示">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className={bodyClassName}>
        {outlineOpen ? (
          <aside className={styles.outlinePanel}>
            <div className={styles.outlineStickyHead}>
              <div className={styles.outlineHeader}>
                <FileText className="h-3.5 w-3.5" />
                <span>大纲</span>
                {outline.length > 0 ? <small>{outline.length}</small> : null}
              </div>
              {outline.length >= 6 ? (
                <div className={styles.outlineSearch}>
                  <Search className="h-3.5 w-3.5" />
                  <input
                    value={outlineQuery}
                    onChange={(event) => setOutlineQuery(event.target.value)}
                    placeholder="筛选标题..."
                    aria-label="筛选文档大纲"
                  />
                  {outlineQuery ? (
                    <button
                      type="button"
                      onClick={() => setOutlineQuery('')}
                      aria-label="清空大纲筛选"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
            <nav className={styles.outlineList} aria-label="文章大纲">
              {filteredOutline.length ? (
                filteredOutline.map((item) => {
                  const isActive = activeOutlineId === item.id
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      data-level={Math.min(item.level, 4)}
                      data-active={isActive ? 'true' : undefined}
                      ref={(node) => {
                        if (isActive && node) {
                          node.scrollIntoView({ block: 'nearest' })
                        }
                      }}
                      onClick={(event) => jumpToOutlineItem(event, item)}
                    >
                      {item.text}
                    </a>
                  )
                })
              ) : (
                <p>{outline.length ? '没有匹配的标题。' : '正文标题（H1–H4）会自动生成大纲。'}</p>
              )}
            </nav>
          </aside>
        ) : null}

        <main ref={documentPaneRef} className={styles.documentPane}>
          <div className={styles.documentMeta}>
            <span>{mode === 'new' ? '新文章' : '编辑中'}</span>
            <span>{wordCount.toLocaleString()} 字</span>
            {readingMinutes > 0 ? (
              <span className={styles.metaInline}>
                <Clock className="h-3 w-3" />
                约 {readingMinutes} 分钟
              </span>
            ) : null}
            <span className={styles.metaHint}>
              <kbd>Ctrl+S</kbd> 保存 · <kbd>/</kbd> 插入块 · <kbd>Ctrl+\</kbd> 专注
            </span>
          </div>
          <textarea
            ref={titleRef}
            value={formData.title}
            onChange={(event) => updateForm({ title: event.target.value })}
            onBlur={generateSlugIfEmpty}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault()
                editorRef.current?.focusStart()
              }
            }}
            placeholder="未命名文档"
            className={styles.titleInput}
            rows={1}
          />
          <textarea
            ref={summaryRef}
            value={formData.description}
            onChange={(event) => updateForm({ description: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault()
                editorRef.current?.focusStart()
              }
            }}
            placeholder="添加一句话摘要（用于列表页与 SEO，可选）..."
            className={styles.summaryInput}
            rows={1}
          />
          <TipTapEditor
            ref={editorRef}
            content={formData.content}
            onChange={(content) => updateForm({ content })}
            onActiveHeadingChange={setActiveOutlineId}
            placeholder="输入 / 插入内容块，或直接粘贴 Markdown..."
          />
        </main>

        <aside
          ref={inspectorRef}
          className={`${styles.inspector} ${!inspectorOpen ? styles.inspectorHidden : ''}`}
          aria-hidden={!inspectorOpen}
        >
          <section className={`${styles.inspectorSection} ${styles.richBlockInspector}`}>
            <h2>
              <PanelRight className="h-3.5 w-3.5" />
              组件属性
            </h2>
            <div id="admin-rich-block-inspector" className={styles.richBlockInspectorHost} />
          </section>

          <section className={styles.inspectorSection}>
            <h2>
              <FileText className="h-3.5 w-3.5" />
              链接标识
            </h2>
            <label>
              <span className={styles.labelRow}>
                URL Slug
                {!formData.slug.trim() ? <em className={styles.requiredHint}>必填</em> : null}
              </span>
              <div className={styles.inlineControl}>
                <Input
                  value={formData.slug}
                  onChange={(event) => updateForm({ slug: event.target.value })}
                  placeholder="my-note-slug"
                />
                <Button type="button" variant="outline" size="sm" onClick={generateSlugFromTitle}>
                  生成
                </Button>
              </div>
            </label>
          </section>

          <section className={styles.inspectorSection}>
            <h2>
              <Tag className="h-3.5 w-3.5" />
              标签
              {formData.tags.length === 0 ? <em className={styles.requiredHint}>至少 1 个</em> : null}
            </h2>
            <div className={styles.tagInput}>
              <Input
                value={draftTag}
                onChange={(event) => setDraftTag(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.key === 'Enter' || event.key === ',' || event.key === '，') && !event.nativeEvent.isComposing) {
                    event.preventDefault()
                    addTagsFromInput(draftTag)
                  } else if (event.key === 'Backspace' && !draftTag && formData.tags.length > 0) {
                    removeTag(formData.tags[formData.tags.length - 1])
                  }
                }}
                placeholder="输入标签，回车或逗号添加"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => addTagsFromInput(draftTag)}>
                添加
              </Button>
            </div>
            {formData.tags.length > 0 ? (
              <div className={styles.tags}>
                {formData.tags.map((tag) => (
                  <button key={tag} type="button" onClick={() => removeTag(tag)} title="点击移除标签">
                    #{tag}
                    <span>×</span>
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section className={styles.inspectorSection}>
            <h2>
              <ImageIcon className="h-3.5 w-3.5" />
              封面图
            </h2>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleCoverUpload(event)}
            />
            {formData.cover_image ? (
              <div className={styles.coverPreview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={formData.cover_image} alt="Cover preview" referrerPolicy="no-referrer" />
                <button
                  type="button"
                  className={styles.coverPreviewRemove}
                  onClick={() => updateForm({ cover_image: '' })}
                  aria-label="移除封面图"
                  title="移除封面图"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
            <Input
              value={formData.cover_image}
              onChange={(event) => updateForm({ cover_image: event.target.value })}
              placeholder="粘贴图片 URL，或下方上传/选择"
            />
            <div className={styles.coverActions}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => coverInputRef.current?.click()}
                disabled={coverUploading}
              >
                {coverUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                上传图片
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setCoverPickerOpen(true)}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                媒体库
              </Button>
            </div>
          </section>

          <section className={styles.inspectorSection}>
            <h2>
              <Settings2 className="h-3.5 w-3.5" />
              发布选项
            </h2>
            <div className={styles.switchRow}>
              <div className={styles.switchLabel}>
                <Calendar className="h-3.5 w-3.5" />
                <span>自定义发布时间</span>
              </div>
              <Switch
                checked={formData.published}
                onCheckedChange={(checked) => {
                  updateForm({
                    published: checked,
                    published_at: checked && !formData.published_at ? nowLocalInput() : formData.published_at,
                  })
                }}
                aria-label="自定义发布时间"
              />
            </div>
            {formData.published ? (
              <label>
                <span>发布时间</span>
                <Input
                  type="datetime-local"
                  value={formData.published_at}
                  onChange={(event) => updateForm({ published_at: event.target.value })}
                />
              </label>
            ) : null}
            <div className={styles.switchRow}>
              <div className={styles.switchLabel}>
                <Star className="h-3.5 w-3.5" />
                <span>设为特色文章</span>
              </div>
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) => updateForm({ featured: checked })}
                aria-label="设为特色文章"
              />
            </div>
          </section>

          <details className={styles.inspectorDisclosure} open={hasSeoValues}>
            <summary>
              <Search className="h-3.5 w-3.5" />
              <span>SEO 覆盖设置</span>
              <ChevronRight className={`h-3.5 w-3.5 ${styles.disclosureChevron}`} />
            </summary>
            <div className={styles.disclosureBody}>
              <label>
                <span>SEO 标题</span>
                <Input
                  value={formData.seo_title}
                  onChange={(event) => updateForm({ seo_title: event.target.value })}
                  placeholder="默认使用文章标题"
                />
              </label>
              <label>
                <span>SEO 描述</span>
                <Textarea
                  value={formData.seo_description}
                  onChange={(event) => updateForm({ seo_description: event.target.value })}
                  placeholder="默认使用文章摘要"
                  className={styles.compactTextarea}
                />
              </label>
            </div>
          </details>

          {onDelete ? (
            <div className={styles.dangerFooter}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={styles.deleteButton}
                onClick={onDelete}
                disabled={saving}
              >
                <Trash2 className="h-3.5 w-3.5" />
                删除这篇文章
              </Button>
            </div>
          ) : null}
        </aside>
      </div>

      <EditorAiSheet
        open={aiSheetOpen}
        onOpenChange={setAiSheetOpen}
        postId={postId}
        formData={formData}
        onUpdateForm={updateForm}
        onImportMarkdown={async (markdown, importMode) => {
          await editorRef.current?.importMarkdown(markdown, importMode)
          toast.success(importMode === 'replace' ? '已替换正文内容' : '已插入大纲到编辑器')
        }}
        getSelectedText={() => editorRef.current?.getSelectedText() ?? ''}
        onReplaceSelection={(text) => editorRef.current?.replaceSelection(text)}
        onInsertBelowSelection={(text) => editorRef.current?.insertBelowSelection(text)}
      />

      <MediaPickerDialog
        open={coverPickerOpen}
        onOpenChange={setCoverPickerOpen}
        onSelect={(url) => updateForm({ cover_image: url })}
        title="选择封面图片"
        description="从已上传的媒体库中选择封面图，或直接上传新图片。"
      />

      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>离开当前编辑？</DialogTitle>
            <DialogDescription>
              你有未提交到服务器的改动。本地草稿已自动备份，但建议先保存草稿再离开。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLeaveDialogOpen(false)}>
              继续编辑
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                clearLocalDraft(draftKey)
                setLeaveDialogOpen(false)
                router.push('/admin/posts')
              }}
            >
              放弃改动并返回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      index: items.length,
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

function formatClockTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function formatDateTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getEditorHeadingByIndex(index: number): HTMLElement | null {
  const headings = document.querySelectorAll<HTMLElement>(
    '.admin-editor .ProseMirror > h1, .admin-editor .ProseMirror > h2, .admin-editor .ProseMirror > h3, .admin-editor .ProseMirror > h4, .admin-editor .ProseMirror > h5, .admin-editor .ProseMirror > h6',
  )

  return headings[index] || null
}

function scrollHeadingIntoView(target: HTMLElement, scope: HTMLElement | null, behavior: ScrollBehavior) {
  const offset = getStickyScrollOffset()
  const scrollParent = getScrollableParent(scope || target)

  if (scrollParent) {
    const parentRect = scrollParent.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const top = scrollParent.scrollTop + targetRect.top - parentRect.top - offset

    scrollParent.scrollTo({ top: Math.max(0, top), behavior })
    return
  }

  const top = window.scrollY + target.getBoundingClientRect().top - offset
  window.scrollTo({ top: Math.max(0, top), behavior })
}

function getScrollableParent(start: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = start

  while (current && current !== document.body && current !== document.documentElement) {
    const style = window.getComputedStyle(current)
    const overflowY = style.overflowY
    const canScroll = /(auto|scroll|overlay)/.test(overflowY) && current.scrollHeight > current.clientHeight + 1
    if (canScroll) return current

    current = current.parentElement
  }

  return null
}

function getStickyScrollOffset() {
  const stickyElements = document.querySelectorAll<HTMLElement>('header, [data-editor-topbar="true"]')
  let offset = 20

  stickyElements.forEach((element) => {
    const style = window.getComputedStyle(element)
    if (style.position !== 'sticky' && style.position !== 'fixed') return

    const rect = element.getBoundingClientRect()
    if (rect.bottom <= 0 || rect.top >= 180) return

    offset += rect.height
  })

  return Math.min(offset, 120)
}
