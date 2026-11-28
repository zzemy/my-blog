'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Languages,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Square,
  Tag,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { SUPPORTED_LOCALES, parseAiSummaryFromMetadata } from '@/lib/ai/types'
import { cn } from '@/lib/utils'

interface BatchPostItem {
  id: string
  title: string
  slug: string
  published: boolean
  description: string | null
  tags: string[] | null
  metadata: Record<string, unknown> | null
}

interface TranslationSummaryItem {
  locale: string
  published: boolean
  source_hash: string
  updated_at: string
}

type BatchAction = 'summary' | 'metadata' | 'translate'
type PostFilter =
  | 'all'
  | 'missing-summary'
  | 'missing-seo'
  | 'missing-translation'
  | 'published'
  | 'draft'
type RowStatus = 'idle' | 'running' | 'success' | 'error'

function getPostSeoStatus(post: BatchPostItem): {
  complete: boolean
  missingFields: string[]
  tagCount: number
} {
  const meta = post.metadata && typeof post.metadata === 'object' ? post.metadata : {}
  const hasDescription = Boolean(post.description?.trim())
  const hasSeoTitle = typeof meta.seo_title === 'string' && meta.seo_title.trim().length > 0
  const hasSeoDesc =
    typeof meta.seo_description === 'string' && meta.seo_description.trim().length > 0
  const tagCount = Array.isArray(post.tags)
    ? post.tags.filter((t) => typeof t === 'string' && t.trim().length > 0).length
    : 0

  const missingFields: string[] = []
  if (!hasDescription) missingFields.push('简介')
  if (!hasSeoTitle) missingFields.push('SEO标题')
  if (!hasSeoDesc) missingFields.push('SEO描述')
  if (tagCount === 0) missingFields.push('标签')

  return {
    complete: missingFields.length === 0,
    missingFields,
    tagCount,
  }
}

const BATCH_ACTIONS: Array<{
  key: BatchAction
  title: string
  description: string
  icon: typeof Sparkles
  accent: string
}> = [
  {
    key: 'summary',
    title: '批量生成 AI 导读',
    description: '为每篇文章生成一句话总结与核心要点卡片',
    icon: Sparkles,
    accent: 'bg-blue-500/12 text-blue-600 dark:text-blue-400',
  },
  {
    key: 'metadata',
    title: '批量补全 SEO 与标签',
    description: '自动分析正文，补全简介、SEO 描述与推荐标签',
    icon: Tag,
    accent: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'translate',
    title: '批量全文翻译',
    description: 'AST 节点级无损翻译，自动保护代码块与公式',
    icon: Languages,
    accent: 'bg-violet-500/12 text-violet-600 dark:text-violet-400',
  },
]

interface BatchCenterProps {
  hasEnabledProvider?: boolean
  onNavigateTab?: (tab: 'providers' | 'tasks' | 'batch' | 'logs') => void
  onBatchComplete?: () => void
}

export function BatchCenter({
  hasEnabledProvider = true,
  onNavigateTab,
  onBatchComplete,
}: BatchCenterProps) {
  const [posts, setPosts] = useState<BatchPostItem[]>([])
  const [translationSummaries, setTranslationSummaries] = useState<
    Record<string, TranslationSummaryItem[]>
  >({})
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [action, setAction] = useState<BatchAction>('summary')
  const [targetLocale, setTargetLocale] = useState<string>('en')
  const [publishTranslation, setPublishTranslation] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<PostFilter>('all')

  const [running, setRunning] = useState(false)
  const [stopping, setStopping] = useState(false)
  const stopRequestedRef = useRef(false)
  const [progress, setProgress] = useState({ total: 0, done: 0, ok: 0, fail: 0 })
  const [statuses, setStatuses] = useState<Record<string, { state: RowStatus; message?: string }>>(
    {},
  )

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const [postsRes, transRes] = await Promise.all([
        fetch('/api/admin/posts?published=false'),
        fetch('/api/admin/ai/translations'),
      ])
      if (!postsRes.ok) throw new Error('加载文章列表失败')
      const postsData = (await postsRes.json()) as { posts?: BatchPostItem[] }
      setPosts((postsData.posts ?? []).filter((p) => p.slug !== 'about'))

      if (transRes.ok) {
        const transData = (await transRes.json().catch(() => ({}))) as {
          summaries?: Record<string, TranslationSummaryItem[]>
        }
        setTranslationSummaries(transData.summaries ?? {})
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加载文章失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchPosts()
  }, [fetchPosts])

  const hasLocaleTranslation = useCallback(
    (postId: string, locale: string) => {
      const list = translationSummaries[postId] ?? []
      return list.some((item) => item.locale.toLowerCase() === locale.toLowerCase())
    },
    [translationSummaries],
  )

  const counts = useMemo(() => {
    let missingSummary = 0
    let missingSeo = 0
    let missingTranslation = 0
    let published = 0
    let draft = 0
    for (const p of posts) {
      if (!parseAiSummaryFromMetadata(p.metadata)) missingSummary += 1
      if (!getPostSeoStatus(p).complete) missingSeo += 1
      if (!hasLocaleTranslation(p.id, targetLocale)) missingTranslation += 1
      if (p.published) published += 1
      else draft += 1
    }
    return {
      all: posts.length,
      missingSummary,
      missingSeo,
      missingTranslation,
      published,
      draft,
    }
  }, [posts, targetLocale, hasLocaleTranslation])

  const filteredPosts = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    return posts.filter((post) => {
      if (filter === 'missing-summary' && parseAiSummaryFromMetadata(post.metadata)) return false
      if (filter === 'missing-seo' && getPostSeoStatus(post).complete) return false
      if (filter === 'missing-translation' && hasLocaleTranslation(post.id, targetLocale)) {
        return false
      }
      if (filter === 'published' && !post.published) return false
      if (filter === 'draft' && post.published) return false
      if (keyword) {
        return (
          post.title.toLowerCase().includes(keyword) || post.slug.toLowerCase().includes(keyword)
        )
      }
      return true
    })
  }, [posts, filter, searchQuery, targetLocale, hasLocaleTranslation])

  const failedIds = useMemo(
    () => Object.entries(statuses).filter(([, s]) => s.state === 'error').map(([id]) => id),
    [statuses],
  )

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const handleSmartQuickSelect = () => {
    if (action === 'summary') {
      const missing = posts.filter((p) => !parseAiSummaryFromMetadata(p.metadata)).map((p) => p.id)
      setSelectedIds(missing)
      toast.info(`已选中 ${missing.length} 篇缺少 AI 摘要的文章`)
      return
    }
    if (action === 'metadata') {
      const missing = posts.filter((p) => !getPostSeoStatus(p).complete).map((p) => p.id)
      setSelectedIds(missing)
      toast.info(`已选中 ${missing.length} 篇缺少 SEO / 简介 / 标签的文章`)
      return
    }
    const missing = posts
      .filter((p) => !hasLocaleTranslation(p.id, targetLocale))
      .map((p) => p.id)
    setSelectedIds(missing)
    toast.info(`已选中 ${missing.length} 篇尚未翻译 ${targetLocale.toUpperCase()} 的文章`)
  }

  const toggleSelectFiltered = () => {
    const visibleIds = filteredPosts.map((p) => p.id)
    const allVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  const executeQueue = async (queueIds: string[]) => {
    if (queueIds.length === 0) {
      toast.error('请先勾选至少一篇文章')
      return
    }
    if (!hasEnabledProvider) {
      toast.error('请先在「模型接入」中配置至少一个已启用的 AI Provider')
      return
    }

    stopRequestedRef.current = false
    setStopping(false)
    setRunning(true)
    setProgress({ total: queueIds.length, done: 0, ok: 0, fail: 0 })

    let okCount = 0
    let failCount = 0
    let doneCount = 0

    for (const postId of queueIds) {
      if (stopRequestedRef.current) {
        break
      }

      setStatuses((prev) => ({ ...prev, [postId]: { state: 'running', message: '正在生成...' } }))
      try {
        if (action === 'translate') {
          const res = await fetch('/api/admin/ai/translations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postId,
              locale: targetLocale,
              publishImmediately: publishTranslation,
            }),
          })
          const data = (await res.json().catch(() => ({}))) as {
            error?: string
            stats?: { translatedSegments?: number }
          }
          if (!res.ok) throw new Error(data.error || '翻译失败')
          setStatuses((prev) => ({
            ...prev,
            [postId]: {
              state: 'success',
              message: `已翻译 ${data.stats?.translatedSegments ?? 0} 段`,
            },
          }))
        } else {
          const res = await fetch('/api/admin/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task: action,
              postId,
              saveToPost: true,
            }),
          })
          const data = (await res.json().catch(() => ({}))) as { error?: string; model?: string }
          if (!res.ok) throw new Error(data.error || '生成失败')
          setStatuses((prev) => ({
            ...prev,
            [postId]: { state: 'success', message: `已完成 (${data.model || 'AI'})` },
          }))
        }
        okCount += 1
      } catch (error) {
        failCount += 1
        setStatuses((prev) => ({
          ...prev,
          [postId]: {
            state: 'error',
            message: error instanceof Error ? error.message : '执行失败',
          },
        }))
      } finally {
        doneCount += 1
        setProgress({ total: queueIds.length, done: doneCount, ok: okCount, fail: failCount })
      }
    }

    const wasStopped = stopRequestedRef.current
    setRunning(false)
    setStopping(false)
    if (wasStopped) {
      toast.info(
        `已停止队列：已完成 ${doneCount}/${queueIds.length} 篇（成功 ${okCount}，失败 ${failCount}）`,
      )
    } else {
      toast.success(`批量任务结束：成功 ${okCount} 篇，失败 ${failCount} 篇`)
    }
    await fetchPosts()
    onBatchComplete?.()
  }

  const allVisibleSelected =
    filteredPosts.length > 0 && filteredPosts.every((p) => selectedIds.includes(p.id))
  const progressPercent =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  const quickSelectLabel =
    action === 'summary'
      ? `选缺摘要 (${counts.missingSummary})`
      : action === 'metadata'
        ? `选缺 SEO (${counts.missingSeo})`
        : `选未译 ${targetLocale.toUpperCase()} (${counts.missingTranslation})`

  const quickSelectCount =
    action === 'summary'
      ? counts.missingSummary
      : action === 'metadata'
        ? counts.missingSeo
        : counts.missingTranslation

  return (
    <div className="space-y-5">
      {!hasEnabledProvider && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>尚未配置已启用的 AI Provider，请先接入模型后再执行批量处理。</span>
          </div>
          {onNavigateTab && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 border-amber-500/40 bg-background/60 text-xs"
              onClick={() => onNavigateTab('providers')}
            >
              前往接入模型 →
            </Button>
          )}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>历史文章批量处理</CardTitle>
            <CardDescription>
              串行队列安全执行，实时展示每篇文章的导读摘要、SEO/标签与多语言译文覆盖状态。
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchPosts()}
            disabled={loading || running}
            className="shrink-0"
          >
            <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', loading && 'animate-spin')} />
            刷新状态
          </Button>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* 3 Visual Action Mode Cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            {BATCH_ACTIONS.map((item) => {
              const Icon = item.icon
              const active = action === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={running}
                  onClick={() => setAction(item.key)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60',
                    active
                      ? 'border-primary/60 bg-primary/[0.04] shadow-xs ring-1 ring-primary/15'
                      : 'border-border/80 bg-background/50 hover:border-foreground/20 hover:bg-muted/30',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      item.accent,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Translation Sub-options */}
          {action === 'translate' && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground">目标语言</span>
                <select
                  value={targetLocale}
                  onChange={(e) => setTargetLocale(e.target.value)}
                  disabled={running}
                  className="h-8 rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  {SUPPORTED_LOCALES.map((loc) => (
                    <option key={loc.code} value={loc.code}>
                      {loc.label} ({loc.nativeLabel})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-muted-foreground">翻译后直接前台可见</span>
                <Switch
                  checked={publishTranslation}
                  onCheckedChange={setPublishTranslation}
                  disabled={running}
                />
              </div>
            </div>
          )}

          {/* Live Progress Bar */}
          {(running || progress.total > 0) && (
            <div className="space-y-2 rounded-xl border border-border/80 bg-muted/30 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 font-medium">
                  {running ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span>
                        {stopping ? '正在等待当前文章完成后停止...' : '队列执行中'} ({progress.done}/
                        {progress.total})
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>
                        上次批次已完成 ({progress.done}/{progress.total})
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    成功 {progress.ok}
                  </span>
                  {progress.fail > 0 && (
                    <span className="text-destructive">失败 {progress.fail}</span>
                  )}
                  <span className="text-muted-foreground">{progressPercent}%</span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Search, Filter & Execution Toolbar */}
          <div className="space-y-3 rounded-xl border border-border/80 bg-muted/25 p-3">
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:w-64">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索标题或 Slug..."
                  className="h-8 bg-background pl-8 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleSmartQuickSelect}
                  disabled={running || quickSelectCount === 0}
                  className="h-8 text-xs"
                >
                  {quickSelectLabel}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={toggleSelectFiltered}
                  disabled={running || filteredPosts.length === 0}
                  className="h-8 text-xs"
                >
                  {allVisibleSelected ? '取消全选' : '全选当前'}
                </Button>

                {!running && failedIds.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void executeQueue(failedIds)}
                    className="h-8 gap-1 border-destructive/40 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <RotateCcw className="h-3 w-3" />
                    重试失败 ({failedIds.length})
                  </Button>
                )}

                {running ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={stopping}
                    onClick={() => {
                      stopRequestedRef.current = true
                      setStopping(true)
                    }}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <Square className="h-3 w-3 fill-current" />
                    {stopping ? '停止中...' : '停止队列'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void executeQueue(selectedIds)}
                    disabled={selectedIds.length === 0 || !hasEnabledProvider}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <Play className="h-3.5 w-3.5" />
                    开始执行 ({selectedIds.length})
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1 border-t border-border/50 pt-2.5">
              {(
                [
                  { key: 'all', label: `全部 ${counts.all}` },
                  { key: 'missing-summary', label: `缺摘要 ${counts.missingSummary}` },
                  { key: 'missing-seo', label: `缺 SEO/标签 ${counts.missingSeo}` },
                  {
                    key: 'missing-translation',
                    label: `未译 ${targetLocale.toUpperCase()} ${counts.missingTranslation}`,
                  },
                  { key: 'published', label: `已发布 ${counts.published}` },
                  { key: 'draft', label: `草稿 ${counts.draft}` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    filter === tab.key
                      ? 'bg-background text-foreground shadow-2xs ring-1 ring-border'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Posts Checklist */}
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="h-16 animate-pulse rounded-lg bg-muted/40" />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
              {posts.length === 0 ? '暂无文章。' : '当前筛选条件下没有匹配的文章。'}
            </div>
          ) : (
            <div className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/80">
              {filteredPosts.map((post) => {
                const hasSummary = Boolean(parseAiSummaryFromMetadata(post.metadata))
                const seoStatus = getPostSeoStatus(post)
                const translations = translationSummaries[post.id] ?? []
                const hasTargetLocale = hasLocaleTranslation(post.id, targetLocale)
                const status = statuses[post.id]
                const checked = selectedIds.includes(post.id)
                const isRowRunning = status?.state === 'running'

                return (
                  <div
                    key={post.id}
                    className={cn(
                      'flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors',
                      isRowRunning
                        ? 'bg-primary/[0.06]'
                        : checked
                          ? 'bg-muted/35'
                          : 'hover:bg-muted/25',
                    )}
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={running}
                        onChange={() => toggleSelect(post.id)}
                        className="h-4 w-4 shrink-0 rounded border-input accent-primary"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{post.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                          {/* 发布状态 */}
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 font-medium',
                              post.published
                                ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {post.published ? '已发布' : '草稿'}
                          </span>

                          {/* AI 导读摘要状态 */}
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium',
                              hasSummary
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                                : 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
                            )}
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            {hasSummary ? '已有摘要' : '缺摘要'}
                          </span>

                          {/* SEO / 简介 / 标签状态 */}
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium',
                              seoStatus.complete
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                : 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
                            )}
                            title={
                              seoStatus.complete
                                ? `简介、SEO 标题/描述与 ${seoStatus.tagCount} 个标签均已完善`
                                : `缺少：${seoStatus.missingFields.join('、')}`
                            }
                          >
                            <Tag className="h-2.5 w-2.5" />
                            {seoStatus.complete
                              ? `SEO 完整 · ${seoStatus.tagCount}标签`
                              : seoStatus.missingFields.length === 4
                                ? '缺 SEO/标签'
                                : `缺 ${seoStatus.missingFields.slice(0, 2).join('·')}${seoStatus.missingFields.length > 2 ? '等' : ''}`}
                          </span>

                          {/* 已有多语言译文状态 */}
                          {translations.length > 0 ? (
                            translations.map((tr) => (
                              <span
                                key={tr.locale}
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium',
                                  tr.published
                                    ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300'
                                    : 'bg-violet-500/8 text-violet-600/90 ring-1 ring-violet-500/20 dark:text-violet-300/80',
                                )}
                                title={`${tr.locale.toUpperCase()} 译文（${tr.published ? '前台已发布' : '未发布草稿'}），更新于 ${new Date(tr.updated_at).toLocaleDateString('zh-CN')}`}
                              >
                                <Globe className="h-2.5 w-2.5" />
                                {tr.locale.toUpperCase()} {tr.published ? '已发布' : '草稿'}
                              </span>
                            ))
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2 py-0.5 text-muted-foreground">
                              <Languages className="h-2.5 w-2.5" />
                              暂无译文
                            </span>
                          )}

                          {/* 翻译模式下若缺少当前目标语言，明确提示 */}
                          {action === 'translate' && !hasTargetLocale && translations.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-300">
                              未译 {targetLocale.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>

                    <div className="flex shrink-0 items-center gap-2.5">
                      {status && status.state !== 'idle' && (
                        <div className="flex items-center gap-1.5 text-xs">
                          {status.state === 'running' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              {status.message}
                            </span>
                          )}
                          {status.state === 'success' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-medium text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              {status.message}
                            </span>
                          )}
                          {status.state === 'error' && (
                            <span
                              className="inline-flex max-w-[260px] items-center gap-1 truncate rounded-full bg-destructive/10 px-2.5 py-0.5 font-medium text-destructive"
                              title={status.message}
                            >
                              <XCircle className="h-3 w-3 shrink-0" />
                              <span className="truncate">{status.message}</span>
                            </span>
                          )}
                        </div>
                      )}

                      <Link
                        href={`/admin/posts/${post.id}`}
                        target="_blank"
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="在新标签页编辑文章"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
