'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Activity,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  Loader2,
  RefreshCw,
  ScrollText,
  Search,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { AiGenerationLog } from '@/lib/ai/types'
import { cn } from '@/lib/utils'

export interface LogStats {
  totalCalls: number
  successCount: number
  errorCount: number
  totalTokens: number
  avgDurationMs: number
}

const TASK_BADGES: Record<string, { label: string; className: string }> = {
  summary: {
    label: '导读摘要',
    className: 'bg-blue-500/12 text-blue-700 dark:text-blue-400',
  },
  metadata: {
    label: 'SEO / 标签',
    className: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
  },
  translate: {
    label: '多语言翻译',
    className: 'bg-violet-500/12 text-violet-700 dark:text-violet-400',
  },
  rewrite: {
    label: '润色改写',
    className: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
  },
  outline: {
    label: '大纲灵感',
    className: 'bg-cyan-500/12 text-cyan-700 dark:text-cyan-400',
  },
}

interface LogsPanelProps {
  initialLogs?: AiGenerationLog[]
  initialStats?: LogStats
  onRefreshParent?: () => Promise<void>
}

export function LogsPanel({ initialLogs, initialStats, onRefreshParent }: LogsPanelProps) {
  const [logs, setLogs] = useState<AiGenerationLog[]>(initialLogs ?? [])
  const [stats, setStats] = useState<LogStats>(
    initialStats ?? {
      totalCalls: 0,
      successCount: 0,
      errorCount: 0,
      totalTokens: 0,
      avgDurationMs: 0,
    },
  )
  const [loading, setLoading] = useState(!initialLogs)
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all')
  const [taskFilter, setTaskFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedErrorId, setCopiedErrorId] = useState<string | null>(null)

  useEffect(() => {
    if (initialLogs) setLogs(initialLogs)
  }, [initialLogs])

  useEffect(() => {
    if (initialStats) setStats(initialStats)
  }, [initialStats])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai/logs?limit=60')
      if (!res.ok) return
      const data = (await res.json()) as { logs?: AiGenerationLog[]; stats?: LogStats }
      setLogs(data.logs ?? [])
      if (data.stats) setStats(data.stats)
      if (onRefreshParent) {
        void onRefreshParent()
      }
    } finally {
      setLoading(false)
    }
  }, [onRefreshParent])

  useEffect(() => {
    if (!initialLogs) {
      void fetchLogs()
    }
  }, [initialLogs, fetchLogs])

  const filteredLogs = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    return logs.filter((log) => {
      if (statusFilter !== 'all' && log.status !== statusFilter) return false
      if (taskFilter !== 'all' && log.task_key !== taskFilter) return false
      if (keyword) {
        const haystack = `${log.provider_name} ${log.model} ${log.task_key} ${log.error_message ?? ''}`.toLowerCase()
        return haystack.includes(keyword)
      }
      return true
    })
  }, [logs, statusFilter, taskFilter, searchQuery])

  const successRate =
    stats.totalCalls > 0 ? Math.round((stats.successCount / stats.totalCalls) * 100) : 0

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedErrorId(id)
      toast.success('已复制错误信息')
      setTimeout(() => setCopiedErrorId((prev) => (prev === id ? null : prev)), 1500)
    } catch {
      toast.error('复制失败')
    }
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="py-4">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <CardDescription>近期调用次数</CardDescription>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Activity className="h-3.5 w-3.5" />
              </span>
            </div>
            <CardTitle className="text-2xl font-semibold">{stats.totalCalls}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            成功 {stats.successCount} · 失败 {stats.errorCount}
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <CardDescription>调用成功率</CardDescription>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
            </div>
            <CardTitle className="text-2xl font-semibold">
              {stats.totalCalls > 0 ? `${successRate}%` : '-'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  successRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500',
                )}
                style={{ width: `${stats.totalCalls > 0 ? successRate : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <CardDescription>累计消耗 Token</CardDescription>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Coins className="h-3.5 w-3.5" />
              </span>
            </div>
            <CardTitle className="text-2xl font-semibold">
              {stats.totalTokens.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            最近 {Math.min(stats.totalCalls, 60)} 次调用统计
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <CardDescription>平均响应耗时</CardDescription>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Clock className="h-3.5 w-3.5" />
              </span>
            </div>
            <CardTitle className="text-2xl font-semibold">
              {stats.totalCalls > 0 ? `${(stats.avgDurationMs / 1000).toFixed(1)}s` : '-'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            端到端模型推理耗时
          </CardContent>
        </Card>
      </div>

      {/* Logs Table Card */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>调用明细日志</CardTitle>
            <CardDescription>
              展示最近 60 次 AI 生成记录，点击任意行可展开 Token 构成与完整报错详情。
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchLogs()}
            disabled={loading}
            className="shrink-0"
          >
            <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', loading && 'animate-spin')} />
            刷新日志
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/25 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-0.5">
                {(
                  [
                    { key: 'all', label: `全部 (${logs.length})` },
                    { key: 'success', label: `成功 (${stats.successCount})` },
                    { key: 'error', label: `失败 (${stats.errorCount})` },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setStatusFilter(item.key)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                      statusFilter === item.key
                        ? 'bg-background text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <select
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs"
              >
                <option value="all">全部任务类型</option>
                {Object.entries(TASK_BADGES).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="筛选模型、厂商或报错..."
                className="h-8 bg-background pl-8 text-xs"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
              <ScrollText className="mb-2.5 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">
                {logs.length === 0 ? '暂无 AI 调用记录' : '没有符合筛选条件的日志'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {logs.length === 0
                  ? '在「任务与 Prompt」试跑测试，或在文章编辑器中使用 AI 助手后，记录会自动出现在这里。'
                  : '尝试切换状态筛选或清空搜索关键词。'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b bg-muted/35 text-muted-foreground">
                    <th className="w-8 py-2.5 pl-3 pr-1" />
                    <th className="py-2.5 pr-3 font-medium">时间</th>
                    <th className="py-2.5 pr-3 font-medium">任务</th>
                    <th className="py-2.5 pr-3 font-medium">Provider / 模型</th>
                    <th className="py-2.5 pr-3 font-medium">Tokens</th>
                    <th className="py-2.5 pr-3 font-medium">耗时</th>
                    <th className="py-2.5 pr-3 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {filteredLogs.map((log) => {
                    const expanded = expandedId === log.id
                    const badge = TASK_BADGES[log.task_key] ?? {
                      label: log.task_key,
                      className: 'bg-muted text-muted-foreground',
                    }

                    return (
                      <Fragment key={log.id}>
                        <tr
                          onClick={() => setExpandedId(expanded ? null : log.id)}
                          className={cn(
                            'cursor-pointer transition-colors hover:bg-muted/30',
                            expanded && 'bg-muted/25',
                          )}
                        >
                          <td className="py-2.5 pl-3 pr-1 text-muted-foreground">
                            {expanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-3 text-muted-foreground">
                            {new Date(log.created_at).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-3">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium',
                                badge.className,
                              )}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className="font-medium">{log.provider_name}</span>
                            <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                              {log.model}
                            </span>
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-3 font-mono">
                            {log.total_tokens !== null ? log.total_tokens.toLocaleString() : '-'}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-3 font-mono text-muted-foreground">
                            {(log.duration_ms / 1000).toFixed(2)}s
                          </td>
                          <td className="py-2.5 pr-3">
                            {log.status === 'success' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                成功
                              </span>
                            ) : (
                              <span
                                className="inline-flex max-w-[220px] items-center gap-1 truncate text-destructive"
                                title={log.error_message ?? ''}
                              >
                                <XCircle className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{log.error_message || '失败'}</span>
                              </span>
                            )}
                          </td>
                        </tr>

                        {expanded && (
                          <tr className="bg-muted/20">
                            <td colSpan={7} className="px-4 py-3">
                              <div className="space-y-2.5 text-xs">
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-muted-foreground">
                                  <span>
                                    精确时间：
                                    <span className="font-mono text-foreground">
                                      {new Date(log.created_at).toLocaleString('zh-CN')}
                                    </span>
                                  </span>
                                  <span>
                                    Prompt Tokens：
                                    <span className="font-mono text-foreground">
                                      {log.prompt_tokens !== null
                                        ? log.prompt_tokens.toLocaleString()
                                        : '-'}
                                    </span>
                                  </span>
                                  <span>
                                    Completion Tokens：
                                    <span className="font-mono text-foreground">
                                      {log.completion_tokens !== null
                                        ? log.completion_tokens.toLocaleString()
                                        : '-'}
                                    </span>
                                  </span>
                                  {log.post_id && (
                                    <span>
                                      关联文章 ID：
                                      <span className="font-mono text-foreground">
                                        {log.post_id}
                                      </span>
                                    </span>
                                  )}
                                </div>

                                {log.status === 'error' && log.error_message && (
                                  <div className="flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive">
                                    <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed">
                                      {log.error_message}
                                    </pre>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        void copyText(log.id, log.error_message ?? '')
                                      }}
                                      className="h-7 shrink-0 gap-1 px-2 text-xs text-destructive hover:bg-destructive/15"
                                    >
                                      {copiedErrorId === log.id ? (
                                        <Check className="h-3 w-3" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                      复制
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
