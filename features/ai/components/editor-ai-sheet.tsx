'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { Content } from '@tiptap/react'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Languages,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  Wand2,
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
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { TipTapEditor } from '@/features/blog/editor/tiptap-editor'
import type { PostFormData } from '@/features/admin/posts/types'
import { REWRITE_ACTION_PROMPTS } from '@/lib/ai/prompts'
import {
  SUPPORTED_LOCALES,
  getLocaleLabel,
  type AiMetadataSuggestion,
  type AiOutlineSuggestion,
  type AiProviderPublic,
  type AiSummaryData,
  type PostTranslationPublic,
  type RewriteAction,
} from '@/lib/ai/types'

interface EditorAiSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId?: string | null
  formData: PostFormData
  onUpdateForm: (patch: Partial<PostFormData>) => void
  onImportMarkdown: (markdown: string, mode: 'insert' | 'replace') => Promise<void>
  getSelectedText: () => string
  onReplaceSelection: (text: string) => void
  onInsertBelowSelection: (text: string) => void
}

export function EditorAiSheet({
  open,
  onOpenChange,
  postId,
  formData,
  onUpdateForm,
  onImportMarkdown,
  getSelectedText,
  onReplaceSelection,
  onInsertBelowSelection,
}: EditorAiSheetProps) {
  const [providers, setProviders] = useState<AiProviderPublic[]>([])
  const [overrideProviderId, setOverrideProviderId] = useState<string>('')
  const [overrideModel, setOverrideModel] = useState<string>('')

  // Summary state
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryDraft, setSummaryDraft] = useState<AiSummaryData | null>(formData.ai_summary)

  // Metadata state
  const [metaLoading, setMetaLoading] = useState(false)
  const [metaSuggestion, setMetaSuggestion] = useState<AiMetadataSuggestion | null>(null)

  // Translation state
  const [translations, setTranslations] = useState<PostTranslationPublic[]>([])
  const [currentSourceHash, setCurrentSourceHash] = useState<string | null>(null)
  const [translationsLoading, setTranslationsLoading] = useState(false)
  const [targetLocale, setTargetLocale] = useState<string>('en')
  const [customLocale, setCustomLocale] = useState<string>('')
  const [translating, setTranslating] = useState(false)
  const [editingTranslation, setEditingTranslation] = useState<PostTranslationPublic | null>(null)
  const [savingTranslation, setSavingTranslation] = useState(false)

  // Rewrite & Outline state
  const [selectedSnippet, setSelectedSnippet] = useState('')
  const [rewriteAction, setRewriteAction] = useState<RewriteAction>('polish')
  const [customInstruction, setCustomInstruction] = useState('')
  const [rewriting, setRewriting] = useState(false)
  const [rewriteResult, setRewriteResult] = useState('')

  const [outlineTopic, setOutlineTopic] = useState('')
  const [outlining, setOutlining] = useState(false)
  const [outlineResult, setOutlineResult] = useState<AiOutlineSuggestion | null>(null)

  useEffect(() => {
    setSummaryDraft(formData.ai_summary)
  }, [formData.ai_summary])

  const loadProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai/providers')
      if (!res.ok) return
      const data = (await res.json()) as { providers?: AiProviderPublic[] }
      setProviders((data.providers ?? []).filter((p) => p.enabled))
    } catch {
      // ignore
    }
  }, [])

  const loadTranslations = useCallback(async () => {
    if (!postId) return
    setTranslationsLoading(true)
    try {
      const res = await fetch(`/api/admin/ai/translations?postId=${encodeURIComponent(postId)}`)
      if (!res.ok) return
      const data = (await res.json()) as {
        translations?: PostTranslationPublic[]
        sourceHash?: string | null
      }
      setTranslations(data.translations ?? [])
      setCurrentSourceHash(data.sourceHash ?? null)
    } finally {
      setTranslationsLoading(false)
    }
  }, [postId])

  useEffect(() => {
    if (!open) return
    void loadProviders()
    void loadTranslations()
    const currentSelected = getSelectedText().trim()
    if (currentSelected) {
      setSelectedSnippet(currentSelected)
    }
    if (!outlineTopic && formData.title.trim()) {
      setOutlineTopic(formData.title.trim())
    }
  }, [open, loadProviders, loadTranslations, getSelectedText, outlineTopic, formData.title])

  const selectedProvider = providers.find((p) => p.id === overrideProviderId)

  const getModelOverridePayload = () => ({
    providerId: overrideProviderId || null,
    model: overrideModel.trim() || null,
  })

  const handleGenerateSummary = async () => {
    setSummaryLoading(true)
    try {
      const res = await fetch('/api/admin/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'summary',
          postId: postId ?? undefined,
          title: formData.title,
          content: formData.content,
          ...getModelOverridePayload(),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        summary?: AiSummaryData
        model?: string
        error?: string
      }
      if (!res.ok || !data.summary) {
        throw new Error(data.error || '生成摘要失败')
      }
      setSummaryDraft(data.summary)
      onUpdateForm({ ai_summary: data.summary })
      toast.success(`已生成 AI 导读摘要（${data.model || 'AI'}），记得保存文章以生效`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '生成摘要失败')
    } finally {
      setSummaryLoading(false)
    }
  }

  const updateSummaryDraft = (patch: Partial<AiSummaryData>) => {
    if (!summaryDraft) return
    const next = { ...summaryDraft, ...patch }
    setSummaryDraft(next)
    onUpdateForm({ ai_summary: next })
  }

  const handleGenerateMetadata = async () => {
    setMetaLoading(true)
    try {
      const res = await fetch('/api/admin/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'metadata',
          postId: postId ?? undefined,
          title: formData.title,
          content: formData.content,
          ...getModelOverridePayload(),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        metadata?: AiMetadataSuggestion
        model?: string
        error?: string
      }
      if (!res.ok || !data.metadata) {
        throw new Error(data.error || '生成元数据失败')
      }
      setMetaSuggestion(data.metadata)
      toast.success(`元数据建议已生成（${data.model || 'AI'}）`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '生成元数据失败')
    } finally {
      setMetaLoading(false)
    }
  }

  const applyAllMetadata = () => {
    if (!metaSuggestion) return
    const mergedTags = Array.from(new Set([...formData.tags, ...metaSuggestion.tags]))
    onUpdateForm({
      description: metaSuggestion.description || formData.description,
      seo_title: metaSuggestion.seo_title || formData.seo_title,
      seo_description: metaSuggestion.seo_description || formData.seo_description,
      tags: mergedTags,
      slug: formData.slug.trim() ? formData.slug : metaSuggestion.slug || formData.slug,
    })
    toast.success('已应用全部元数据到文章表单')
  }

  const handleTranslatePost = async () => {
    if (!postId) {
      toast.error('请先保存草稿后再生成多语言翻译')
      return
    }
    const locale = (targetLocale === '__custom__' ? customLocale : targetLocale).trim()
    if (!locale) {
      toast.error('请选择或输入目标语言代码（如 en、ja）')
      return
    }

    setTranslating(true)
    try {
      const res = await fetch('/api/admin/ai/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          locale,
          publishImmediately: false,
          ...getModelOverridePayload(),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        translation?: PostTranslationPublic
        stats?: { translatedSegments?: number; totalSegments?: number; model?: string }
        error?: string
      }
      if (!res.ok || !data.translation) {
        throw new Error(data.error || '翻译失败')
      }
      toast.success(
        `已完成 ${getLocaleLabel(locale)} 翻译（${data.stats?.translatedSegments ?? 0}/${data.stats?.totalSegments ?? 0} 段），当前为草稿状态`,
      )
      await loadTranslations()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '翻译失败')
    } finally {
      setTranslating(false)
    }
  }

  const handleToggleTranslationPublish = async (item: PostTranslationPublic) => {
    try {
      const res = await fetch(`/api/admin/ai/translations/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !item.published }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error || '更新状态失败')
      }
      toast.success(!item.published ? '该语言版本已前台发布' : '已隐藏该语言版本')
      await loadTranslations()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败')
    }
  }

  const handleDeleteTranslation = async (item: PostTranslationPublic) => {
    if (!window.confirm(`确定删除 ${getLocaleLabel(item.locale)} 译文吗？`)) return
    try {
      const res = await fetch(`/api/admin/ai/translations/${item.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      toast.success('已删除译文')
      await loadTranslations()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败')
    }
  }

  const handleSaveEditedTranslation = async () => {
    if (!editingTranslation) return
    setSavingTranslation(true)
    try {
      const res = await fetch(`/api/admin/ai/translations/${editingTranslation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingTranslation.title,
          description: editingTranslation.description,
          content: editingTranslation.content,
          published: editingTranslation.published,
        }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error || '保存译文失败')
      }
      toast.success('译文已保存')
      setEditingTranslation(null)
      await loadTranslations()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存译文失败')
    } finally {
      setSavingTranslation(false)
    }
  }

  const handleRewrite = async () => {
    const source = selectedSnippet.trim()
    if (!source) {
      toast.error('请先在编辑器选中文字，或直接粘贴到下方输入框')
      return
    }
    setRewriting(true)
    try {
      const res = await fetch('/api/admin/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'rewrite',
          postId: postId ?? undefined,
          title: formData.title,
          selectedText: source,
          rewriteAction,
          customInstruction: customInstruction.trim() || undefined,
          ...getModelOverridePayload(),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { result?: string; error?: string }
      if (!res.ok || !data.result) {
        throw new Error(data.error || '改写失败')
      }
      setRewriteResult(data.result)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '改写失败')
    } finally {
      setRewriting(false)
    }
  }

  const handleGenerateOutline = async () => {
    if (!outlineTopic.trim()) {
      toast.error('请先输入文章主题')
      return
    }
    setOutlining(true)
    try {
      const res = await fetch('/api/admin/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'outline',
          postId: postId ?? undefined,
          title: formData.title,
          content: formData.content,
          topic: outlineTopic.trim(),
          ...getModelOverridePayload(),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        outline?: AiOutlineSuggestion
        error?: string
      }
      if (!res.ok || !data.outline) {
        throw new Error(data.error || '生成大纲失败')
      }
      setOutlineResult(data.outline)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '生成大纲失败')
    } finally {
      setOutlining(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI 写作与多语言助手
            </SheetTitle>
            <SheetDescription>
              所有结果由你在后台确认后再保存或发布，前台不消耗实时额度。
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {/* 模型临时覆写栏 */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">本次调用模型（默认按任务路由）</span>
                <Link href="/admin/ai" target="_blank" className="text-primary hover:underline">
                  管理 API 配置 →
                </Link>
              </div>
              {providers.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  尚未配置可用 AI Provider，请先点击右上角「管理 API 配置」添加模型。
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={overrideProviderId}
                    onChange={(e) => {
                      const nextId = e.target.value
                      setOverrideProviderId(nextId)
                      const nextP = providers.find((p) => p.id === nextId)
                      setOverrideModel(nextP?.default_model ?? '')
                    }}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="">自动路由（按任务设置）</option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={overrideModel}
                    onChange={(e) => setOverrideModel(e.target.value)}
                    list="editor-ai-models"
                    placeholder="默认模型"
                    className="h-8 text-xs font-mono"
                    disabled={!overrideProviderId}
                  />
                  <datalist id="editor-ai-models">
                    {(selectedProvider?.models ?? []).map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
              )}
            </div>

            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="summary" className="text-xs">
                  导读摘要
                </TabsTrigger>
                <TabsTrigger value="metadata" className="text-xs">
                  SEO/标签
                </TabsTrigger>
                <TabsTrigger value="translate" className="text-xs">
                  多语言
                </TabsTrigger>
                <TabsTrigger value="write" className="text-xs">
                  润色/大纲
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: AI Summary */}
              <TabsContent value="summary" className="mt-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleGenerateSummary()}
                    disabled={summaryLoading}
                    className="gap-1.5"
                  >
                    {summaryLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {summaryDraft ? '重新生成导读' : '一键生成 AI 导读'}
                  </Button>
                  {summaryDraft && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">前台显示</span>
                      <Switch
                        checked={summaryDraft.visible !== false}
                        onCheckedChange={(checked) => updateSummaryDraft({ visible: checked })}
                      />
                    </div>
                  )}
                </div>

                {summaryDraft ? (
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">一句话核心总结 (TL;DR)</Label>
                      <Textarea
                        rows={3}
                        value={summaryDraft.tldr}
                        onChange={(e) => updateSummaryDraft({ tldr: e.target.value })}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">核心要点</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 gap-1 text-xs"
                          onClick={() =>
                            updateSummaryDraft({ key_points: [...summaryDraft.key_points, ''] })
                          }
                        >
                          <Plus className="h-3 w-3" />
                          加一条
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {summaryDraft.key_points.map((point, index) => (
                          <div key={index} className="flex items-center gap-1.5">
                            <Input
                              value={point}
                              onChange={(e) =>
                                updateSummaryDraft({
                                  key_points: summaryDraft.key_points.map((p, i) =>
                                    i === index ? e.target.value : p,
                                  ),
                                })
                              }
                              className="h-8 text-xs"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0 text-destructive"
                              onClick={() =>
                                updateSummaryDraft({
                                  key_points: summaryDraft.key_points.filter((_, i) => i !== index),
                                })
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">目标读者（可选）</Label>
                      <Input
                        value={summaryDraft.target_audience ?? ''}
                        onChange={(e) => updateSummaryDraft({ target_audience: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                      <span>模型：{summaryDraft.model || '手动编辑'}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive"
                        onClick={() => {
                          setSummaryDraft(null)
                          onUpdateForm({ ai_summary: null })
                          toast.info('已移除 AI 导读（保存文章后生效）')
                        }}
                      >
                        移除导读
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                    尚未生成 AI 导读。点击上方按钮生成后，将自动展示在文章正文顶部的 AI 导读卡片中。
                  </div>
                )}
              </TabsContent>

              {/* Tab 2: SEO & Metadata */}
              <TabsContent value="metadata" className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleGenerateMetadata()}
                    disabled={metaLoading}
                    className="gap-1.5"
                  >
                    {metaLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="h-3.5 w-3.5" />
                    )}
                    分析正文并生成元数据
                  </Button>
                  {metaSuggestion && (
                    <Button type="button" size="sm" variant="secondary" onClick={applyAllMetadata}>
                      一键全部应用
                    </Button>
                  )}
                </div>

                {metaSuggestion ? (
                  <div className="space-y-3 rounded-lg border p-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-muted-foreground">文章简介 (description)</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={() => {
                            onUpdateForm({ description: metaSuggestion.description })
                            toast.success('已填充文章简介')
                          }}
                        >
                          应用
                        </Button>
                      </div>
                      <p className="rounded bg-muted/40 p-2 leading-relaxed">{metaSuggestion.description}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-muted-foreground">SEO 标题 & 描述</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={() => {
                            onUpdateForm({
                              seo_title: metaSuggestion.seo_title,
                              seo_description: metaSuggestion.seo_description,
                            })
                            toast.success('已填充 SEO 字段')
                          }}
                        >
                          应用
                        </Button>
                      </div>
                      <div className="space-y-1 rounded bg-muted/40 p-2">
                        <p className="font-medium">{metaSuggestion.seo_title}</p>
                        <p className="text-muted-foreground">{metaSuggestion.seo_description}</p>
                      </div>
                    </div>

                    {metaSuggestion.tags.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-muted-foreground">推荐标签（点击单个添加）</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs"
                            onClick={() => {
                              onUpdateForm({
                                tags: Array.from(new Set([...formData.tags, ...metaSuggestion.tags])),
                              })
                              toast.success('已合并推荐标签')
                            }}
                          >
                            全部添加
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {metaSuggestion.tags.map((tag) => {
                            const exists = formData.tags.includes(tag)
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  if (!exists) {
                                    onUpdateForm({ tags: [...formData.tags, tag] })
                                    toast.success(`已添加标签 #${tag}`)
                                  }
                                }}
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                                  exists
                                    ? 'border-primary/40 bg-primary/10 text-primary'
                                    : 'hover:bg-muted'
                                }`}
                              >
                                <Tag className="h-3 w-3" />
                                {tag}
                                {exists && <Check className="h-3 w-3" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {metaSuggestion.slug && (
                      <div className="flex items-center justify-between rounded bg-muted/40 px-2.5 py-2">
                        <div>
                          <span className="text-muted-foreground">建议 Slug：</span>
                          <code className="font-mono">{metaSuggestion.slug}</code>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={() => {
                            onUpdateForm({ slug: metaSuggestion.slug })
                            toast.success('已更新 Slug')
                          }}
                        >
                          采用
                        </Button>
                      </div>
                    )}

                    {metaSuggestion.alternative_titles.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="font-medium text-muted-foreground">备选标题（点击替换）</span>
                        <div className="space-y-1">
                          {metaSuggestion.alternative_titles.map((alt, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                onUpdateForm({ title: alt })
                                toast.success('已替换文章标题')
                              }}
                              className="block w-full rounded border px-2.5 py-1.5 text-left hover:bg-muted/50"
                            >
                              {alt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                    将自动分析正文并参考站点已有标签库，一次性给出简介、SEO、标签、英文 Slug 与备选标题。
                  </div>
                )}
              </TabsContent>

              {/* Tab 3: Multi-language Translations */}
              <TabsContent value="translate" className="mt-4 space-y-4">
                {!postId ? (
                  <div className="rounded-lg border border-amber-300/60 bg-amber-50/70 p-4 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
                    请先点击右上角「保存草稿」或「发布文章」生成文章记录，之后即可在这里创建和管理多语言无损译文。
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 rounded-lg border p-3">
                      <Label className="text-xs">生成新语言译文（AST 节点级翻译，自动保护代码块与公式）</Label>
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={targetLocale}
                          onChange={(e) => setTargetLocale(e.target.value)}
                          disabled={translating}
                          className="h-9 flex-1 rounded-md border border-input bg-background px-2.5 text-xs"
                        >
                          {SUPPORTED_LOCALES.map((loc) => (
                            <option key={loc.code} value={loc.code}>
                              {loc.label} ({loc.nativeLabel} / {loc.code})
                            </option>
                          ))}
                          <option value="__custom__">自定义语言代码...</option>
                        </select>
                        {targetLocale === '__custom__' && (
                          <Input
                            value={customLocale}
                            onChange={(e) => setCustomLocale(e.target.value)}
                            placeholder="如 pt-BR"
                            className="h-9 w-28 text-xs"
                          />
                        )}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void handleTranslatePost()}
                          disabled={translating}
                          className="gap-1.5"
                        >
                          {translating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Languages className="h-3.5 w-3.5" />
                          )}
                          {translating ? '翻译中...' : '开始翻译'}
                        </Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        注意：翻译基于最近一次保存到数据库的原文内容，若有新修改请先保存文章。
                      </p>
                    </div>

                    {translationsLoading ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : translations.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                        这篇文章还没有多语言译文。
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {translations.map((item) => {
                          const outdated =
                            Boolean(currentSourceHash) && item.source_hash !== currentSourceHash
                          return (
                            <div key={item.id} className="space-y-2 rounded-lg border p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs font-medium">
                                      <Globe className="h-3 w-3" />
                                      {getLocaleLabel(item.locale)}
                                    </span>
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                                        item.published
                                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                          : 'bg-muted text-muted-foreground'
                                      }`}
                                    >
                                      {item.published ? '前台可见' : '草稿隐藏'}
                                    </span>
                                    {outdated && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-300">
                                        <AlertTriangle className="h-3 w-3" />
                                        原文已更新
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1.5 truncate text-sm font-medium">{item.title}</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    模型：{item.model_used || '-'} · 更新于{' '}
                                    {new Date(item.updated_at).toLocaleDateString('zh-CN')}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-7 gap-1 text-xs"
                                  onClick={() => setEditingTranslation(item)}
                                >
                                  <Pencil className="h-3 w-3" />
                                  精修译文
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-7 gap-1 text-xs"
                                  onClick={() => void handleToggleTranslationPublish(item)}
                                >
                                  {item.published ? (
                                    <>
                                      <EyeOff className="h-3 w-3" />
                                      隐藏
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-3 w-3" />
                                      发布到前台
                                    </>
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="ml-auto h-7 text-xs text-destructive hover:bg-destructive/10"
                                  onClick={() => void handleDeleteTranslation(item)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Tab 4: Inline Rewrite & Outline */}
              <TabsContent value="write" className="mt-4 space-y-5">
                <div className="space-y-3 rounded-lg border p-3.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">段落润色 / 改写 / 划词翻译</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      onClick={() => {
                        const text = getSelectedText().trim()
                        if (!text) {
                          toast.info('当前编辑器未选中任何文字')
                          return
                        }
                        setSelectedSnippet(text)
                      }}
                    >
                      读取编辑器选中文本
                    </Button>
                  </div>

                  <Textarea
                    rows={4}
                    value={selectedSnippet}
                    onChange={(e) => setSelectedSnippet(e.target.value)}
                    placeholder="在编辑器选中任意段落，或在此粘贴需要优化的文字..."
                    className="text-xs"
                  />

                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(REWRITE_ACTION_PROMPTS) as RewriteAction[]).map((act) => (
                      <button
                        key={act}
                        type="button"
                        onClick={() => setRewriteAction(act)}
                        className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                          rewriteAction === act
                            ? 'border-primary bg-primary/10 font-medium text-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {REWRITE_ACTION_PROMPTS[act].label}
                      </button>
                    ))}
                  </div>

                  <Input
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    placeholder="可选：自定义改写要求（留空则使用上方快捷指令）"
                    className="h-8 text-xs"
                  />

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleRewrite()}
                    disabled={rewriting}
                    className="gap-1.5"
                  >
                    {rewriting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="h-3.5 w-3.5" />
                    )}
                    生成修改建议
                  </Button>

                  {rewriteResult && (
                    <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
                      <p className="text-xs font-medium text-primary">AI 修改建议（确认后再应用）</p>
                      <Textarea
                        rows={5}
                        value={rewriteResult}
                        onChange={(e) => setRewriteResult(e.target.value)}
                        className="bg-background text-xs"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            onReplaceSelection(rewriteResult)
                            toast.success('已替换编辑器选中内容')
                          }}
                        >
                          替换选中
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onInsertBelowSelection(rewriteResult)
                            toast.success('已插入到选中段落下方')
                          }}
                        >
                          插入下方
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                          onClick={() => {
                            void navigator.clipboard.writeText(rewriteResult)
                            toast.success('已复制到剪贴板')
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          复制
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 rounded-lg border p-3.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold">
                    <FileText className="h-3.5 w-3.5" />
                    大纲与标题灵感
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={outlineTopic}
                      onChange={(e) => setOutlineTopic(e.target.value)}
                      placeholder="输入想写的技术主题或核心观点..."
                      className="h-8 text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handleGenerateOutline()}
                      disabled={outlining}
                    >
                      {outlining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '生成'}
                    </Button>
                  </div>

                  {outlineResult && (
                    <div className="space-y-3 text-xs">
                      {outlineResult.title_ideas.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-muted-foreground">备选标题（点击使用）：</span>
                          {outlineResult.title_ideas.map((t, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                onUpdateForm({ title: t })
                                toast.success('已采用该标题')
                              }}
                              className="block w-full rounded border px-2 py-1 text-left hover:bg-muted/50"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                      <Textarea
                        rows={7}
                        value={outlineResult.markdown_outline}
                        onChange={(e) =>
                          setOutlineResult({ ...outlineResult, markdown_outline: e.target.value })
                        }
                        className="font-mono text-xs"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void onImportMarkdown(outlineResult.markdown_outline, 'insert')}
                        >
                          插入大纲到编辑器
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* 译文精修弹窗 */}
      <Dialog
        open={Boolean(editingTranslation)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditingTranslation(null)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              精修译文 · {editingTranslation ? getLocaleLabel(editingTranslation.locale) : ''}
            </DialogTitle>
            <DialogDescription>
              可直接修改译文标题、简介与富文本正文，完成后打开「前台可见」即可供读者切换阅读。
            </DialogDescription>
          </DialogHeader>

          {editingTranslation && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">在前台文章页公开展示该语言</p>
                  <p className="text-xs text-muted-foreground">关闭时仅后台可见，适合人工校对阶段。</p>
                </div>
                <Switch
                  checked={editingTranslation.published}
                  onCheckedChange={(checked) =>
                    setEditingTranslation((prev) => (prev ? { ...prev, published: checked } : null))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>译文标题</Label>
                <Input
                  value={editingTranslation.title}
                  onChange={(e) =>
                    setEditingTranslation((prev) => (prev ? { ...prev, title: e.target.value } : null))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>译文简介</Label>
                <Textarea
                  rows={2}
                  value={editingTranslation.description ?? ''}
                  onChange={(e) =>
                    setEditingTranslation((prev) =>
                      prev ? { ...prev, description: e.target.value } : null,
                    )
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>译文正文</Label>
                <div className="rounded-lg border p-2">
                  <TipTapEditor
                    key={editingTranslation.id}
                    content={editingTranslation.content as Content}
                    onChange={(nextContent) =>
                      setEditingTranslation((prev) =>
                        prev ? { ...prev, content: nextContent as PostTranslationPublic['content'] } : null,
                      )
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingTranslation(null)}
              disabled={savingTranslation}
            >
              取消
            </Button>
            <Button type="button" onClick={() => void handleSaveEditedTranslation()} disabled={savingTranslation}>
              {savingTranslation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存译文
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
