'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertCircle,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Languages,
  ListTree,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Tag,
  Trash2,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AI_TASK_LABELS,
  type AiGlossaryEntry,
  type AiProviderPublic,
  type AiTaskConfig,
  type AiTaskKey,
} from '@/lib/ai/types'
import { cn } from '@/lib/utils'

const TASK_KEYS: AiTaskKey[] = ['summary', 'metadata', 'translate', 'rewrite', 'outline']

const TASK_META: Record<
  AiTaskKey,
  { icon: typeof Sparkles; accent: string; sampleInput: string; samplePlaceholder: string }
> = {
  summary: {
    icon: FileText,
    accent: 'bg-blue-500/12 text-blue-600 dark:text-blue-400',
    sampleInput:
      'Next.js 16 带来了基于 Turbopack 的稳定构建流水线与更细粒度的缓存失效机制。本文将结合个人博客重构实践，拆解如何利用 Server Components 降低首屏 JS 体积，并通过局部 revalidateTag 实现秒级文章发布更新。',
    samplePlaceholder: '粘贴一段文章正文，测试 AI 导读摘要输出效果...',
  },
  metadata: {
    icon: Tag,
    accent: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
    sampleInput:
      '在现代前端工程中，使用 Tailwind CSS v4 的 CSS-first 配置可以显著简化主题变量管理，结合 Radix UI 无样式原语能够快速构建支持无障碍与暗色模式的后台系统。',
    samplePlaceholder: '粘贴文章片段，测试简介、SEO 标题、标签与 Slug 推荐...',
  },
  translate: {
    icon: Languages,
    accent: 'bg-violet-500/12 text-violet-600 dark:text-violet-400',
    sampleInput: '',
    samplePlaceholder: '多语言翻译任务请前往文章编辑器或「批量处理」中针对整篇文章执行。',
  },
  rewrite: {
    icon: Wand2,
    accent: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
    sampleInput:
      '这个功能其实挺好用的，就是页面上看起来有点乱，按钮太多了让人找不到重点，我们打算把布局整理一下让它更好看更好用。',
    samplePlaceholder: '输入一段需要润色优化的段落文字...',
  },
  outline: {
    icon: ListTree,
    accent: 'bg-cyan-500/12 text-cyan-600 dark:text-cyan-400',
    sampleInput: '如何用 Next.js + Supabase + 多厂商 AI API 搭建一套低成本个人博客内容工作流',
    samplePlaceholder: '输入文章主题或初步想法，测试大纲与标题灵感...',
  },
}

const TEMPERATURE_PRESETS = [
  { label: '精准', value: 0.2, hint: '适合摘要/翻译' },
  { label: '均衡', value: 0.5, hint: '适合 SEO/润色' },
  { label: '创意', value: 0.9, hint: '适合标题/大纲' },
]

const MAX_TOKEN_PRESETS = [1024, 2048, 4096, 8192]

interface TaskRoutingManagerProps {
  providers: AiProviderPublic[]
  tasks: AiTaskConfig[]
  defaultPrompts: Record<AiTaskKey, string>
  onRefresh: () => Promise<void>
  onNavigateTab?: (tab: 'providers' | 'tasks' | 'batch' | 'logs') => void
}

export function TaskRoutingManager({
  providers,
  tasks,
  defaultPrompts,
  onRefresh,
  onNavigateTab,
}: TaskRoutingManagerProps) {
  const [selectedTaskKey, setSelectedTaskKey] = useState<AiTaskKey>('summary')
  const [saving, setSaving] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  // Form fields
  const [providerId, setProviderId] = useState<string>('')
  const [model, setModel] = useState<string>('')
  const [temperature, setTemperature] = useState<string>('0.3')
  const [maxTokens, setMaxTokens] = useState<string>('2048')
  const [systemPrompt, setSystemPrompt] = useState<string>('')
  const [glossary, setGlossary] = useState<AiGlossaryEntry[]>([])

  // Playground state
  const [playgroundOpen, setPlaygroundOpen] = useState(false)
  const [playgroundInput, setPlaygroundInput] = useState('')
  const [playgroundLoading, setPlaygroundLoading] = useState(false)
  const [playgroundResult, setPlaygroundResult] = useState<{
    text: string
    model?: string
    durationMs?: number
    tokens?: number | null
  } | null>(null)

  const currentTask = tasks.find((item) => item.task_key === selectedTaskKey)
  const enabledProviders = useMemo(() => providers.filter((p) => p.enabled), [providers])
  const defaultProvider = useMemo(
    () => enabledProviders.find((p) => p.is_default) ?? enabledProviders[0] ?? null,
    [enabledProviders],
  )

  useEffect(() => {
    setProviderId(currentTask?.provider_id ?? '')
    setModel(currentTask?.model ?? '')
    setTemperature(String(currentTask?.temperature ?? 0.3))
    setMaxTokens(String(currentTask?.max_tokens ?? 2048))
    setSystemPrompt(currentTask?.system_prompt ?? '')
    setGlossary(currentTask?.glossary ?? [])
    setPlaygroundResult(null)
    setPlaygroundInput('')
  }, [currentTask, selectedTaskKey])

  const isDirty = useMemo(() => {
    const baseProvider = currentTask?.provider_id ?? ''
    const baseModel = currentTask?.model ?? ''
    const baseTemp = String(currentTask?.temperature ?? 0.3)
    const baseMaxTokens = String(currentTask?.max_tokens ?? 2048)
    const basePrompt = currentTask?.system_prompt ?? ''
    const baseGlossary = JSON.stringify(currentTask?.glossary ?? [])

    return (
      providerId !== baseProvider ||
      model !== baseModel ||
      temperature !== baseTemp ||
      maxTokens !== baseMaxTokens ||
      systemPrompt !== basePrompt ||
      JSON.stringify(glossary) !== baseGlossary
    )
  }, [currentTask, providerId, model, temperature, maxTokens, systemPrompt, glossary])

  const selectedProvider = providers.find((p) => p.id === providerId)
  const effectiveProvider = selectedProvider ?? defaultProvider
  const availableModels = effectiveProvider?.models ?? []

  const numericTemp = Number.isFinite(Number(temperature))
    ? Math.min(Math.max(Number(temperature), 0), 2)
    : 0.3

  const handleResetChanges = () => {
    setProviderId(currentTask?.provider_id ?? '')
    setModel(currentTask?.model ?? '')
    setTemperature(String(currentTask?.temperature ?? 0.3))
    setMaxTokens(String(currentTask?.max_tokens ?? 2048))
    setSystemPrompt(currentTask?.system_prompt ?? '')
    setGlossary(currentTask?.glossary ?? [])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const parsedTemp = Number(temperature)
      const parsedMaxTokens = Number(maxTokens)
      const cleanGlossary = glossary
        .map((entry) => ({
          source: entry.source.trim(),
          target: entry.target.trim(),
          note: entry.note?.trim() || undefined,
        }))
        .filter((entry) => entry.source && entry.target)

      const res = await fetch('/api/admin/ai/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_key: selectedTaskKey,
          provider_id: providerId || null,
          model: model.trim() || null,
          temperature: Number.isFinite(parsedTemp) ? Math.min(Math.max(parsedTemp, 0), 2) : 0.3,
          max_tokens: Number.isFinite(parsedMaxTokens)
            ? Math.min(Math.max(Math.round(parsedMaxTokens), 128), 32768)
            : 2048,
          system_prompt: systemPrompt.trim() || null,
          glossary: cleanGlossary,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        throw new Error(data.error || '保存失败')
      }
      toast.success(`已保存「${AI_TASK_LABELS[selectedTaskKey].title}」配置`)
      await onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleRunPlayground = async () => {
    if (selectedTaskKey === 'translate') return
    if (enabledProviders.length === 0) {
      toast.error('请先在「模型接入」中配置至少一个已启用的 AI Provider')
      return
    }
    const text = playgroundInput.trim() || TASK_META[selectedTaskKey].sampleInput
    if (!text) {
      toast.error('请先输入测试内容')
      return
    }
    if (!playgroundInput.trim()) {
      setPlaygroundInput(text)
    }

    setPlaygroundLoading(true)
    setPlaygroundResult(null)
    try {
      const payload: Record<string, unknown> = {
        task: selectedTaskKey,
        providerId: providerId || null,
        model: model.trim() || null,
      }
      if (selectedTaskKey === 'summary' || selectedTaskKey === 'metadata') {
        payload.title = 'Prompt 调试示例文章'
        payload.content = {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
        }
      } else if (selectedTaskKey === 'rewrite') {
        payload.selectedText = text
        payload.rewriteAction = 'polish'
      } else if (selectedTaskKey === 'outline') {
        payload.topic = text
      }

      const res = await fetch('/api/admin/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json().catch(() => ({}))) as {
        summary?: unknown
        metadata?: unknown
        outline?: unknown
        result?: string
        model?: string
        duration_ms?: number
        usage?: { totalTokens?: number | null }
        error?: string
      }
      if (!res.ok) {
        throw new Error(data.error || '试跑失败')
      }

      const formatted =
        typeof data.result === 'string'
          ? data.result
          : JSON.stringify(data.summary ?? data.metadata ?? data.outline ?? data, null, 2)

      setPlaygroundResult({
        text: formatted,
        model: data.model,
        durationMs: data.duration_ms,
        tokens: data.usage?.totalTokens ?? null,
      })
      toast.success('试跑完成')
      void onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '试跑失败')
    } finally {
      setPlaygroundLoading(false)
    }
  }

  const ActiveIcon = TASK_META[selectedTaskKey].icon

  return (
    <div className="space-y-5">
      {enabledProviders.length === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/60 bg-amber-50/70 px-4 py-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>当前尚未配置已启用的 AI Provider，你可以预先编排 Prompt，但在接入模型前无法执行生成。</span>
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

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Task List */}
        <div className="space-y-2 lg:col-span-4">
          {TASK_KEYS.map((key) => {
            const task = tasks.find((t) => t.task_key === key)
            const boundProvider = providers.find((p) => p.id === task?.provider_id)
            const active = selectedTaskKey === key
            const Icon = TASK_META[key].icon
            const hasCustomPrompt = Boolean(task?.system_prompt?.trim())

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedTaskKey(key)}
                className={cn(
                  'group w-full rounded-xl border p-3.5 text-left transition-all',
                  active
                    ? 'border-primary/60 bg-primary/[0.04] shadow-xs ring-1 ring-primary/15'
                    : 'border-border/80 bg-card hover:border-foreground/20 hover:bg-muted/30',
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      TASK_META[key].accent,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">
                        {AI_TASK_LABELS[key].title}
                      </span>
                      {hasCustomPrompt && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-primary"
                          title="已启用自定义 System Prompt"
                        />
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {AI_TASK_LABELS[key].description}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="max-w-full truncate rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                        {task?.model ||
                          boundProvider?.default_model ||
                          (defaultProvider ? `默认 · ${defaultProvider.default_model || defaultProvider.name}` : '跟随默认')}
                      </span>
                      {hasCustomPrompt && (
                        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          自定义 Prompt
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Right Task Studio */}
        <Card className="lg:col-span-8">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    TASK_META[selectedTaskKey].accent,
                  )}
                >
                  <ActiveIcon className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">
                      {AI_TASK_LABELS[selectedTaskKey].title}
                    </CardTitle>
                    {isDirty && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                        有未保存修改
                      </span>
                    )}
                  </div>
                  <CardDescription className="mt-1">
                    {AI_TASK_LABELS[selectedTaskKey].description}
                  </CardDescription>
                </div>
              </div>

              {isDirty && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleResetChanges}
                  className="h-8 gap-1 text-xs text-muted-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  撤销更改
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-5">
            {/* Model Routing */}
            <div className="space-y-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>指定 Provider</Label>
                  <select
                    value={providerId}
                    onChange={(e) => {
                      const nextId = e.target.value
                      setProviderId(nextId)
                      const nextProvider = providers.find((p) => p.id === nextId)
                      setModel(nextProvider?.default_model ?? '')
                    }}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">
                      跟随系统默认 Provider
                      {defaultProvider ? `（${defaultProvider.name}）` : ''}
                    </option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.enabled ? '' : '(已禁用)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>指定模型 ID</Label>
                  <Input
                    list={`models-${selectedTaskKey}`}
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={
                      effectiveProvider?.default_model
                        ? `留空使用 ${effectiveProvider.default_model}`
                        : '例如：deepseek-chat'
                    }
                    className="font-mono text-xs"
                  />
                  <datalist id={`models-${selectedTaskKey}`}>
                    {availableModels.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Quick-pick model chips */}
              {availableModels.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">可选模型快选：</span>
                  {availableModels.slice(0, 8).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModel(m)}
                      className={cn(
                        'rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors',
                        model === m
                          ? 'border-primary bg-primary/10 font-medium text-primary'
                          : 'border-border/70 bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                      )}
                    >
                      {m}
                    </button>
                  ))}
                  {model && (
                    <button
                      type="button"
                      onClick={() => setModel('')}
                      className="rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      清空（跟随默认）
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sampling Parameters */}
            <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/25 p-4 sm:grid-cols-2">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Temperature（随机性）</Label>
                  <span className="rounded bg-background px-2 py-0.5 font-mono text-xs font-semibold shadow-2xs ring-1 ring-border">
                    {numericTemp.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={numericTemp}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="h-2 w-full cursor-pointer accent-primary"
                />
                <div className="flex flex-wrap gap-1.5">
                  {TEMPERATURE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setTemperature(String(preset.value))}
                      className={cn(
                        'rounded-md border px-2 py-0.5 text-[11px] transition-colors',
                        Math.abs(numericTemp - preset.value) < 0.05
                          ? 'border-primary bg-primary/10 font-medium text-primary'
                          : 'border-border/70 bg-background text-muted-foreground hover:text-foreground',
                      )}
                      title={preset.hint}
                    >
                      {preset.label} {preset.value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-xs font-medium">Max Tokens（最大输出长度）</Label>
                <Input
                  type="number"
                  step="128"
                  min="128"
                  max="32768"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                  className="h-8 bg-background font-mono text-xs"
                />
                <div className="flex flex-wrap gap-1.5">
                  {MAX_TOKEN_PRESETS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMaxTokens(String(val))}
                      className={cn(
                        'rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors',
                        Number(maxTokens) === val
                          ? 'border-primary bg-primary/10 font-medium text-primary'
                          : 'border-border/70 bg-background text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* System Prompt Editor */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Label>System Prompt</Label>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-medium',
                      systemPrompt.trim()
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {systemPrompt.trim() ? '自定义模板生效' : '使用内置高质量模板'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSystemPrompt(defaultPrompts[selectedTaskKey] || '')}
                    className="h-7 px-2 text-xs"
                  >
                    <BookOpen className="mr-1 h-3 w-3" />
                    载入默认模板编辑
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      const textToCopy = systemPrompt.trim() || defaultPrompts[selectedTaskKey] || ''
                      await navigator.clipboard.writeText(textToCopy)
                      setCopiedPrompt(true)
                      toast.success('已复制 Prompt 内容')
                      setTimeout(() => setCopiedPrompt(false), 1500)
                    }}
                    className="h-7 px-2 text-xs text-muted-foreground"
                  >
                    {copiedPrompt ? (
                      <Check className="mr-1 h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="mr-1 h-3 w-3" />
                    )}
                    复制
                  </Button>
                  {systemPrompt && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setSystemPrompt('')}
                      className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3 w-3" />
                      恢复默认
                    </Button>
                  )}
                </div>
              </div>
              <Textarea
                rows={8}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder={defaultPrompts[selectedTaskKey]}
                className="font-mono text-xs leading-relaxed"
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>留空将自动使用系统内置的优化 Prompt；如需保持 JSON 输出结构，建议基于默认模板修改。</span>
                <span className="shrink-0 font-mono">
                  {(systemPrompt.trim() || defaultPrompts[selectedTaskKey] || '').length} 字符
                </span>
              </div>
            </div>

            {/* Translation Glossary */}
            {selectedTaskKey === 'translate' && (
              <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">翻译术语表（Glossary）</p>
                    <p className="text-xs text-muted-foreground">
                      固定技术专有名词的译法（例如 Next.js 保持原文、前端工程化固定译法）。
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setGlossary((prev) => [...prev, { source: '', target: '', note: '' }])
                    }
                    className="h-8 gap-1 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    添加术语
                  </Button>
                </div>
                {glossary.length === 0 ? (
                  <p className="rounded-lg border border-dashed py-4 text-center text-xs text-muted-foreground">
                    暂无术语条目，点击右上角「添加术语」固定专有名词译法。
                  </p>
                ) : (
                  <div className="space-y-2">
                    {glossary.map((entry, idx) => (
                      <div key={idx} className="grid grid-cols-12 items-center gap-2">
                        <Input
                          className="col-span-4 h-8 bg-background text-xs"
                          placeholder="原文词（如 架构）"
                          value={entry.source}
                          onChange={(e) =>
                            setGlossary((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, source: e.target.value } : item,
                              ),
                            )
                          }
                        />
                        <Input
                          className="col-span-4 h-8 bg-background text-xs"
                          placeholder="目标译法（如 Architecture）"
                          value={entry.target}
                          onChange={(e) =>
                            setGlossary((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, target: e.target.value } : item,
                              ),
                            )
                          }
                        />
                        <Input
                          className="col-span-3 h-8 bg-background text-xs"
                          placeholder="备注（可选）"
                          value={entry.note ?? ''}
                          onChange={(e) =>
                            setGlossary((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, note: e.target.value } : item,
                              ),
                            )
                          }
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="col-span-1 h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setGlossary((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Playground (for non-translate tasks) */}
            {selectedTaskKey !== 'translate' && (
              <div className="overflow-hidden rounded-xl border border-border/80 bg-muted/15">
                <button
                  type="button"
                  onClick={() => setPlaygroundOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">快速试跑（Playground）</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      实时验证输出效果
                    </span>
                  </div>
                  {playgroundOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {playgroundOpen && (
                  <div className="space-y-3 border-t border-border/60 p-4">
                    {isDirty && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400">
                        提示：试跑会读取已保存的 Prompt 与 Temperature；如需测试刚刚修改的 Prompt，请先点击下方「保存任务配置」。
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">输入测试文本</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => setPlaygroundInput(TASK_META[selectedTaskKey].sampleInput)}
                      >
                        填入示例文本
                      </Button>
                    </div>
                    <Textarea
                      rows={3}
                      value={playgroundInput}
                      onChange={(e) => setPlaygroundInput(e.target.value)}
                      placeholder={TASK_META[selectedTaskKey].samplePlaceholder}
                      className="bg-background text-xs"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        将使用当前所选模型调用一次真实 API 并计入日志
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => void handleRunPlayground()}
                        disabled={playgroundLoading || enabledProviders.length === 0}
                        className="gap-1.5"
                      >
                        {playgroundLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                        {playgroundLoading ? '运行中...' : '试跑测试'}
                      </Button>
                    </div>

                    {playgroundResult && (
                      <div className="space-y-2 rounded-lg border border-border bg-background p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            试跑输出 · {playgroundResult.model || 'AI'}
                          </span>
                          <div className="flex items-center gap-3 font-mono">
                            {playgroundResult.durationMs !== undefined && (
                              <span>{(playgroundResult.durationMs / 1000).toFixed(2)}s</span>
                            )}
                            {playgroundResult.tokens !== null && playgroundResult.tokens !== undefined && (
                              <span>{playgroundResult.tokens.toLocaleString()} tokens</span>
                            )}
                          </div>
                        </div>
                        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-2.5 font-mono text-xs leading-relaxed">
                          {playgroundResult.text}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Save Footer */}
            <div className="flex items-center justify-between border-t border-border/60 pt-4">
              <span className="text-xs text-muted-foreground">
                {isDirty ? '配置已变更，保存后立即对编辑器与批量处理生效。' : '当前配置已与服务端同步。'}
              </span>
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                保存任务配置
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
