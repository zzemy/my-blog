'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Cpu,
  Layers,
  Plus,
  RefreshCw,
  ScrollText,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProviderManager } from '@/features/ai/components/provider-manager'
import { TaskRoutingManager } from '@/features/ai/components/task-routing-manager'
import { BatchCenter } from '@/features/ai/components/batch-center'
import { LogsPanel, type LogStats } from '@/features/ai/components/logs-panel'
import { DEFAULT_SYSTEM_PROMPTS } from '@/lib/ai/prompts'
import type { AiGenerationLog, AiProviderPublic, AiTaskConfig, AiTaskKey } from '@/lib/ai/types'
import { cn } from '@/lib/utils'

export type AiCenterTab = 'providers' | 'tasks' | 'batch' | 'logs'

const EMPTY_LOG_STATS: LogStats = {
  totalCalls: 0,
  successCount: 0,
  errorCount: 0,
  totalTokens: 0,
  avgDurationMs: 0,
}

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 10_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

export default function AdminAiPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<AiCenterTab>('providers')
  const [createTrigger, setCreateTrigger] = useState(0)

  const [migrationRequired, setMigrationRequired] = useState(false)
  const [providers, setProviders] = useState<AiProviderPublic[]>([])
  const [tasks, setTasks] = useState<AiTaskConfig[]>([])
  const [logs, setLogs] = useState<AiGenerationLog[]>([])
  const [logStats, setLogStats] = useState<LogStats>(EMPTY_LOG_STATS)
  const [defaultPrompts, setDefaultPrompts] =
    useState<Record<AiTaskKey, string>>(DEFAULT_SYSTEM_PROMPTS)
  const [encryptionStatus, setEncryptionStatus] = useState<{
    configured: boolean
    usingFallback: boolean
  }>({
    configured: true,
    usingFallback: false,
  })

  const loadAll = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const [providersRes, tasksRes, logsRes] = await Promise.all([
        fetch('/api/admin/ai/providers'),
        fetch('/api/admin/ai/tasks'),
        fetch('/api/admin/ai/logs?limit=60'),
      ])

      const providersData = (await providersRes.json().catch(() => ({}))) as {
        providers?: AiProviderPublic[]
        encryption?: { configured: boolean; usingFallback: boolean }
        code?: string
        error?: string
      }
      const tasksData = (await tasksRes.json().catch(() => ({}))) as {
        tasks?: AiTaskConfig[]
        default_prompts?: Record<AiTaskKey, string>
        code?: string
      }
      const logsData = (await logsRes.json().catch(() => ({}))) as {
        logs?: AiGenerationLog[]
        stats?: LogStats
        code?: string
      }

      if (
        providersData.code === 'MIGRATION_REQUIRED' ||
        tasksData.code === 'MIGRATION_REQUIRED' ||
        logsData.code === 'MIGRATION_REQUIRED'
      ) {
        setMigrationRequired(true)
      } else {
        setMigrationRequired(false)
      }

      setProviders(providersData.providers ?? [])
      if (providersData.encryption) {
        setEncryptionStatus(providersData.encryption)
      }
      setTasks(tasksData.tasks ?? [])
      if (tasksData.default_prompts) {
        setDefaultPrompts(tasksData.default_prompts)
      }
      setLogs(logsData.logs ?? [])
      if (logsData.stats) {
        setLogStats(logsData.stats)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加载 AI 配置失败')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadAll(false)
  }, [loadAll])

  const enabledProviders = useMemo(() => providers.filter((p) => p.enabled), [providers])
  const defaultProvider = useMemo(
    () => enabledProviders.find((p) => p.is_default) ?? enabledProviders[0] ?? null,
    [enabledProviders],
  )
  const customizedTaskCount = useMemo(
    () =>
      tasks.filter((t) => Boolean(t.provider_id || t.model || t.system_prompt?.trim())).length,
    [tasks],
  )

  const handleOpenQuickCreate = () => {
    setActiveTab('providers')
    setCreateTrigger((prev) => prev + 1)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2.5">
            <div className="h-8 w-44 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted/70" />
          </div>
          <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-11 w-full animate-pulse rounded-xl bg-muted/60" />
        <div className="h-72 animate-pulse rounded-xl border bg-card/60" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 animate-in fade-in slide-in-from-bottom-3 duration-400">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 bg-gradient-to-br from-primary/12 via-primary/5 to-transparent text-primary shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">AI 中心</h1>
            {defaultProvider ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                服务就绪 · {defaultProvider.name}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                待接入模型
              </span>
            )}
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            统一管理多厂商 AI API、按写作场景精细编排模型与 Prompt，并对历史文章执行批量导读与多语言无损翻译。
          </p>
          {(providers.length > 0 || logStats.totalCalls > 0) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-xs text-muted-foreground">
              <span>
                模型源：<strong className="font-medium text-foreground">{enabledProviders.length}</strong>/{providers.length} 已启用
              </span>
              {customizedTaskCount > 0 && (
                <>
                  <span className="opacity-40">·</span>
                  <span>
                    已定制任务：<strong className="font-medium text-foreground">{customizedTaskCount}</strong>/5
                  </span>
                </>
              )}
              {logStats.totalCalls > 0 && (
                <>
                  <span className="opacity-40">·</span>
                  <span>
                    近期调用：<strong className="font-medium text-foreground">{logStats.totalCalls}</strong> 次（{formatCompactNumber(logStats.totalTokens)} tokens）
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadAll(true)}
            disabled={refreshing}
            className="gap-1.5"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
            刷新状态
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleOpenQuickCreate}
            className="gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            添加模型
          </Button>
        </div>
      </div>

      {/* Migration Alert */}
      {migrationRequired && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">尚未初始化 AI 数据库表</p>
            <p className="text-xs leading-relaxed">
              请先在 Supabase 控制台的 SQL Editor 中执行迁移脚本：
              <code className="mx-1 rounded bg-background/80 px-1.5 py-0.5 font-mono">
                supabase/migrations/20261127_add_ai_system.sql
              </code>
              ，执行完成后刷新本页即可使用全部功能。
            </p>
          </div>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as AiCenterTab)}
        className="w-full"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl border border-border/70 bg-muted/40 p-1.5 sm:grid-cols-4">
          <TabsTrigger
            value="providers"
            className="gap-2 rounded-lg py-2 text-sm data-[state=active]:border data-[state=active]:border-border/60 data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            <Cpu className="h-4 w-4" />
            <span>模型接入</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              {providers.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="gap-2 rounded-lg py-2 text-sm data-[state=active]:border data-[state=active]:border-border/60 data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            <Sparkles className="h-4 w-4" />
            <span>任务与 Prompt</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              {customizedTaskCount > 0 ? `${customizedTaskCount}/5` : '5'}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="batch"
            className="gap-2 rounded-lg py-2 text-sm data-[state=active]:border data-[state=active]:border-border/60 data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            <Layers className="h-4 w-4" />
            <span>批量处理</span>
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className="gap-2 rounded-lg py-2 text-sm data-[state=active]:border data-[state=active]:border-border/60 data-[state=active]:bg-background data-[state=active]:shadow-xs"
          >
            <ScrollText className="h-4 w-4" />
            <span>调用日志</span>
            {logStats.totalCalls > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 font-mono text-[11px]',
                  logStats.errorCount > 0
                    ? 'bg-destructive/15 text-destructive'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {logStats.totalCalls}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="providers" className="mt-0">
            <ProviderManager
              providers={providers}
              encryptionStatus={encryptionStatus}
              createTrigger={createTrigger}
              onRefresh={() => loadAll(true)}
              onNavigateTab={setActiveTab}
            />
          </TabsContent>
          <TabsContent value="tasks" className="mt-0">
            <TaskRoutingManager
              providers={providers}
              tasks={tasks}
              defaultPrompts={defaultPrompts}
              onRefresh={() => loadAll(true)}
              onNavigateTab={setActiveTab}
            />
          </TabsContent>
          <TabsContent value="batch" className="mt-0">
            <BatchCenter
              hasEnabledProvider={enabledProviders.length > 0}
              onNavigateTab={setActiveTab}
              onBatchComplete={() => void loadAll(true)}
            />
          </TabsContent>
          <TabsContent value="logs" className="mt-0">
            <LogsPanel
              initialLogs={logs}
              initialStats={logStats}
              onRefreshParent={() => loadAll(true)}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
