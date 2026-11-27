'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Languages, Loader2, Play, RefreshCw, Sparkles, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SUPPORTED_LOCALES, parseAiSummaryFromMetadata } from '@/lib/ai/types'

interface BatchPostItem {
  id: string
  title: string
  slug: string
  published: boolean
  description: string | null
  metadata: Record<string, unknown> | null
}

type BatchAction = 'summary' | 'metadata' | 'translate'

type RowStatus = 'idle' | 'running' | 'success' | 'error'

export function BatchCenter() {
  const [posts, setPosts] = useState<BatchPostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [action, setAction] = useState<BatchAction>('summary')
  const [targetLocale, setTargetLocale] = useState<string>('en')
  const [publishTranslation, setPublishTranslation] = useState(false)
  const [running, setRunning] = useState(false)
  const [statuses, setStatuses] = useState<Record<string, { state: RowStatus; message?: string }>>({})

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/posts?published=false')
      if (!res.ok) throw new Error('加载文章列表失败')
      const data = (await res.json()) as { posts?: BatchPostItem[] }
      setPosts((data.posts ?? []).filter((p) => p.slug !== 'about'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加载文章失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchPosts()
  }, [fetchPosts])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const selectMissingSummary = () => {
    const missing = posts.filter((p) => !parseAiSummaryFromMetadata(p.metadata)).map((p) => p.id)
    setSelectedIds(missing)
    toast.info(`已选中 ${missing.length} 篇缺少 AI 摘要的文章`)
  }

  const runBatch = async () => {
    if (selectedIds.length === 0) {
      toast.error('请先勾选至少一篇文章')
      return
    }

    setRunning(true)
    let okCount = 0
    let failCount = 0

    for (const postId of selectedIds) {
      setStatuses((prev) => ({ ...prev, [postId]: { state: 'running', message: '生成中...' } }))
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
          const data = (await res.json().catch(() => ({}))) as { error?: string; stats?: { translatedSegments?: number } }
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
      }
    }

    setRunning(false)
    toast.success(`批量任务结束：成功 ${okCount} 篇，失败 ${failCount} 篇`)
    await fetchPosts()
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>历史文章批量处理</CardTitle>
          <CardDescription>
            串行队列执行，安全可控。生成结果直接写入对应文章（翻译默认保存为未发布草稿，可先校对）。
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void fetchPosts()} disabled={loading || running}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          刷新列表
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as BatchAction)}
            disabled={running}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="summary">批量生成 AI 导读摘要</option>
            <option value="metadata">批量补全简介 / SEO / 标签</option>
            <option value="translate">批量全文翻译</option>
          </select>

          {action === 'translate' && (
            <>
              <select
                value={targetLocale}
                onChange={(e) => setTargetLocale(e.target.value)}
                disabled={running}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {SUPPORTED_LOCALES.map((loc) => (
                  <option key={loc.code} value={loc.code}>
                    {loc.label} ({loc.nativeLabel})
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={publishTranslation}
                  onChange={(e) => setPublishTranslation(e.target.checked)}
                  disabled={running}
                />
                翻译后直接前台可见
              </label>
            </>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={selectMissingSummary} disabled={running}>
              选缺摘要文章
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setSelectedIds(selectedIds.length === posts.length ? [] : posts.map((p) => p.id))
              }
              disabled={running}
            >
              {selectedIds.length === posts.length && posts.length > 0 ? '取消全选' : '全选'}
            </Button>
            <Button type="button" size="sm" onClick={() => void runBatch()} disabled={running || selectedIds.length === 0} className="gap-1.5">
              {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              开始执行 ({selectedIds.length})
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">暂无文章。</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {posts.map((post) => {
              const hasSummary = Boolean(parseAiSummaryFromMetadata(post.metadata))
              const status = statuses[post.id]
              const checked = selectedIds.includes(post.id)

              return (
                <label
                  key={post.id}
                  className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/30"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={running}
                      onChange={() => toggleSelect(post.id)}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{post.title}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{post.published ? '已发布' : '草稿'}</span>
                        <span className="inline-flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          {hasSummary ? '已有摘要' : '缺少摘要'}
                        </span>
                        {action === 'translate' && (
                          <span className="inline-flex items-center gap-1">
                            <Languages className="h-3 w-3" />
                            目标: {targetLocale}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {status && status.state !== 'idle' && (
                    <div className="flex shrink-0 items-center gap-1.5 text-xs">
                      {status.state === 'running' && (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          <span>{status.message}</span>
                        </>
                      )}
                      {status.state === 'success' && (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">{status.message}</span>
                        </>
                      )}
                      {status.state === 'error' && (
                        <>
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                          <span className="max-w-[220px] truncate text-destructive" title={status.message}>
                            {status.message}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </label>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
