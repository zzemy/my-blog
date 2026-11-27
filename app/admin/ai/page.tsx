'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Cpu, Layers, Loader2, ScrollText, Sparkles } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProviderManager } from '@/features/ai/components/provider-manager'
import { TaskRoutingManager } from '@/features/ai/components/task-routing-manager'
import { BatchCenter } from '@/features/ai/components/batch-center'
import { LogsPanel } from '@/features/ai/components/logs-panel'
import { DEFAULT_SYSTEM_PROMPTS } from '@/lib/ai/prompts'
import type { AiProviderPublic, AiTaskConfig, AiTaskKey } from '@/lib/ai/types'

export default function AdminAiPage() {
  const [loading, setLoading] = useState(true)
  const [migrationRequired, setMigrationRequired] = useState(false)
  const [providers, setProviders] = useState<AiProviderPublic[]>([])
  const [tasks, setTasks] = useState<AiTaskConfig[]>([])
  const [defaultPrompts, setDefaultPrompts] = useState<Record<AiTaskKey, string>>(DEFAULT_SYSTEM_PROMPTS)
  const [encryptionStatus, setEncryptionStatus] = useState<{ configured: boolean; usingFallback: boolean }>({
    configured: true,
    usingFallback: false,
  })

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [providersRes, tasksRes] = await Promise.all([
        fetch('/api/admin/ai/providers'),
        fetch('/api/admin/ai/tasks'),
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

      if (providersData.code === 'MIGRATION_REQUIRED' || tasksData.code === 'MIGRATION_REQUIRED') {
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加载 AI 配置失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b pb-6">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">AI 中心</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          统一管理多厂商 AI API、为不同写作任务分配模型与 Prompt，并对历史文章进行批量摘要与多语言翻译。
        </p>
      </div>

      {migrationRequired && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
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

      <Tabs defaultValue="providers" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 sm:grid-cols-4 lg:w-[640px]">
          <TabsTrigger value="providers" className="gap-1.5">
            <Cpu className="h-3.5 w-3.5" />
            模型接入
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            任务与 Prompt
          </TabsTrigger>
          <TabsTrigger value="batch" className="gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            批量处理
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <ScrollText className="h-3.5 w-3.5" />
            调用日志
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="providers">
            <ProviderManager
              providers={providers}
              encryptionStatus={encryptionStatus}
              onRefresh={loadAll}
            />
          </TabsContent>
          <TabsContent value="tasks">
            <TaskRoutingManager
              providers={providers}
              tasks={tasks}
              defaultPrompts={defaultPrompts}
              onRefresh={loadAll}
            />
          </TabsContent>
          <TabsContent value="batch">
            <BatchCenter />
          </TabsContent>
          <TabsContent value="logs">
            <LogsPanel />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
