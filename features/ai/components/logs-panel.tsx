'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Clock, Coins, Loader2, RefreshCw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AiGenerationLog } from '@/lib/ai/types'

interface LogStats {
  totalCalls: number
  successCount: number
  errorCount: number
  totalTokens: number
  avgDurationMs: number
}

export function LogsPanel() {
  const [logs, setLogs] = useState<AiGenerationLog[]>([])
  const [stats, setStats] = useState<LogStats>({
    totalCalls: 0,
    successCount: 0,
    errorCount: 0,
    totalTokens: 0,
    avgDurationMs: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai/logs?limit=60')
      if (!res.ok) return
      const data = (await res.json()) as { logs?: AiGenerationLog[]; stats?: LogStats }
      setLogs(data.logs ?? [])
      if (data.stats) setStats(data.stats)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchLogs()
  }, [fetchLogs])

  const successRate =
    stats.totalCalls > 0 ? Math.round((stats.successCount / stats.totalCalls) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>近期调用次数</CardDescription>
            <CardTitle className="text-2xl">{stats.totalCalls}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>成功率</CardDescription>
            <CardTitle className="text-2xl">{successRate}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Coins className="h-3.5 w-3.5" /> 累计 Token
            </CardDescription>
            <CardTitle className="text-2xl">{stats.totalTokens.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> 平均耗时
            </CardDescription>
            <CardTitle className="text-2xl">{(stats.avgDurationMs / 1000).toFixed(1)}s</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>调用明细日志</CardTitle>
            <CardDescription>展示最近 60 次 AI 生成记录，方便核对 Token 消耗与排查报错。</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void fetchLogs()} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">暂无调用记录。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">时间</th>
                    <th className="py-2 pr-3 font-medium">任务</th>
                    <th className="py-2 pr-3 font-medium">Provider / 模型</th>
                    <th className="py-2 pr-3 font-medium">Tokens</th>
                    <th className="py-2 pr-3 font-medium">耗时</th>
                    <th className="py-2 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 pr-3 font-mono">{log.task_key}</td>
                      <td className="py-2.5 pr-3">
                        <span className="font-medium">{log.provider_name}</span>
                        <span className="ml-1.5 font-mono text-muted-foreground">{log.model}</span>
                      </td>
                      <td className="whitespace-nowrap py-2.5 pr-3 font-mono">
                        {log.total_tokens !== null ? log.total_tokens.toLocaleString() : '-'}
                      </td>
                      <td className="whitespace-nowrap py-2.5 pr-3">
                        {(log.duration_ms / 1000).toFixed(2)}s
                      </td>
                      <td className="py-2.5">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            成功
                          </span>
                        ) : (
                          <span
                            className="inline-flex max-w-[240px] items-center gap-1 truncate text-destructive"
                            title={log.error_message ?? ''}
                          >
                            <XCircle className="h-3.5 w-3.5 shrink-0" />
                            {log.error_message || '失败'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
