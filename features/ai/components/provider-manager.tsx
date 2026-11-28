'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Pencil,
  Plug,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
  XCircle,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  PROVIDER_PRESETS,
  type AiKeyMode,
  type AiProtocol,
  type AiProviderPublic,
} from '@/lib/ai/types'
import { cn } from '@/lib/utils'

interface ProviderFormState {
  name: string
  protocol: AiProtocol
  base_url: string
  key_mode: AiKeyMode
  api_key: string
  env_var_name: string
  models_text: string
  default_model: string
  custom_headers_text: string
  enabled: boolean
  is_default: boolean
}

interface TestResultState {
  ok: boolean
  durationMs?: number
  model?: string
  reply?: string
  error?: string
  testedAt: number
}

const EMPTY_FORM: ProviderFormState = {
  name: '',
  protocol: 'openai-compatible',
  base_url: 'https://api.openai.com/v1',
  key_mode: 'encrypted',
  api_key: '',
  env_var_name: '',
  models_text: '',
  default_model: '',
  custom_headers_text: '',
  enabled: true,
  is_default: false,
}

const PROTOCOL_LABELS: Record<AiProtocol, { label: string; className: string }> = {
  'openai-compatible': {
    label: 'OpenAI 兼容',
    className:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  anthropic: {
    label: 'Anthropic 原生',
    className:
      'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  gemini: {
    label: 'Gemini 原生',
    className:
      'border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  },
}

const PRESET_META: Record<
  string,
  { monogram: string; accent: string; tagline: string; badge?: string }
> = {
  deepseek: {
    monogram: 'DS',
    accent: 'bg-blue-500/12 text-blue-600 ring-blue-500/20 dark:text-blue-400',
    tagline: '中文写作与高性价比翻译首选',
    badge: '推荐',
  },
  openai: {
    monogram: 'OA',
    accent: 'bg-emerald-500/12 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400',
    tagline: 'GPT-4o / 4.1 生态标准接口',
  },
  anthropic: {
    monogram: 'CL',
    accent: 'bg-orange-500/12 text-orange-600 ring-orange-500/20 dark:text-orange-400',
    tagline: '长文润色与深度逻辑推理',
  },
  gemini: {
    monogram: 'GM',
    accent: 'bg-indigo-500/12 text-indigo-600 ring-indigo-500/20 dark:text-indigo-400',
    tagline: '超长上下文与多语言翻译',
    badge: '高性价比',
  },
  openrouter: {
    monogram: 'OR',
    accent: 'bg-purple-500/12 text-purple-600 ring-purple-500/20 dark:text-purple-400',
    tagline: '单 Key 聚合全球主流模型',
  },
  siliconflow: {
    monogram: 'SF',
    accent: 'bg-cyan-500/12 text-cyan-600 ring-cyan-500/20 dark:text-cyan-400',
    tagline: '国内高速直连 DeepSeek / Qwen',
  },
  qwen: {
    monogram: 'QW',
    accent: 'bg-sky-500/12 text-sky-600 ring-sky-500/20 dark:text-sky-400',
    tagline: '阿里云 DashScope 官方模型',
  },
  custom: {
    monogram: 'API',
    accent: 'bg-zinc-500/12 text-zinc-700 ring-zinc-500/20 dark:text-zinc-300',
    tagline: 'OneAPI / 中转站或本地 Ollama',
  },
}

function getProviderMonogram(provider: AiProviderPublic): { monogram: string; accent: string } {
  const lower = `${provider.name} ${provider.base_url}`.toLowerCase()
  if (lower.includes('deepseek')) return PRESET_META.deepseek
  if (lower.includes('openai')) return PRESET_META.openai
  if (lower.includes('anthropic') || lower.includes('claude') || provider.protocol === 'anthropic') {
    return PRESET_META.anthropic
  }
  if (lower.includes('gemini') || lower.includes('generativelanguage') || provider.protocol === 'gemini') {
    return PRESET_META.gemini
  }
  if (lower.includes('openrouter')) return PRESET_META.openrouter
  if (lower.includes('siliconflow')) return PRESET_META.siliconflow
  if (lower.includes('dashscope') || lower.includes('qwen')) return PRESET_META.qwen
  return {
    monogram: provider.name.slice(0, 2).toUpperCase() || 'AI',
    accent: PRESET_META.custom.accent,
  }
}

interface ProviderManagerProps {
  providers: AiProviderPublic[]
  encryptionStatus: { configured: boolean; usingFallback: boolean }
  createTrigger?: number
  onRefresh: () => Promise<void>
  onNavigateTab?: (tab: 'providers' | 'tasks' | 'batch' | 'logs') => void
}

export function ProviderManager({
  providers,
  encryptionStatus,
  createTrigger = 0,
  onRefresh,
  onNavigateTab,
}: ProviderManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activePresetId, setActivePresetId] = useState<string | null>(null)
  const [form, setForm] = useState<ProviderFormState>(EMPTY_FORM)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingAndTesting, setSavingAndTesting] = useState(false)
  const [fetchingDialogModels, setFetchingDialogModels] = useState(false)
  const [fetchedDialogModels, setFetchedDialogModels] = useState<string[]>([])
  const [dialogModelSearch, setDialogModelSearch] = useState('')
  const [dialogFetchError, setDialogFetchError] = useState<string | null>(null)

  const [testingId, setTestingId] = useState<string | null>(null)
  const [syncingModelsId, setSyncingModelsId] = useState<string | null>(null)
  const [switchingModelId, setSwitchingModelId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [expandedModelsIds, setExpandedModelsIds] = useState<Record<string, boolean>>({})
  const [testResults, setTestResults] = useState<Record<string, TestResultState>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [presetsExpanded, setPresetsExpanded] = useState(providers.length === 0)

  useEffect(() => {
    if (providers.length === 0) {
      setPresetsExpanded(true)
    }
  }, [providers.length])

  useEffect(() => {
    if (createTrigger > 0) {
      openCreateDialog()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createTrigger])

  const parsedFormModels = useMemo(
    () =>
      Array.from(
        new Set(
          form.models_text
            .split(/[\n,]+/)
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ),
    [form.models_text],
  )

  const openCreateDialog = (presetId?: string) => {
    setEditingId(null)
    setShowApiKey(false)
    setShowAdvanced(false)
    setFetchedDialogModels([])
    setDialogModelSearch('')
    setDialogFetchError(null)
    if (presetId) {
      const preset = PROVIDER_PRESETS.find((item) => item.id === presetId)
      if (preset) {
        setActivePresetId(preset.id)
        setForm({
          ...EMPTY_FORM,
          name: preset.name,
          protocol: preset.protocol,
          base_url: preset.base_url,
          default_model: preset.default_model,
          models_text: preset.models.join('\n'),
          is_default: providers.length === 0,
        })
        setDialogOpen(true)
        return
      }
    }
    setActivePresetId(null)
    setForm({ ...EMPTY_FORM, is_default: providers.length === 0 })
    setDialogOpen(true)
  }

  const openEditDialog = (provider: AiProviderPublic) => {
    setEditingId(provider.id)
    setActivePresetId(null)
    setShowApiKey(false)
    setFetchedDialogModels([])
    setDialogModelSearch('')
    setDialogFetchError(null)
    const hasHeaders =
      provider.custom_headers && Object.keys(provider.custom_headers).length > 0
    setShowAdvanced(Boolean(hasHeaders))
    setForm({
      name: provider.name,
      protocol: provider.protocol,
      base_url: provider.base_url,
      key_mode: provider.key_mode,
      api_key: '',
      env_var_name: provider.env_var_name ?? '',
      models_text: provider.models.join('\n'),
      default_model: provider.default_model,
      custom_headers_text: hasHeaders ? JSON.stringify(provider.custom_headers, null, 2) : '',
      enabled: provider.enabled,
      is_default: provider.is_default,
    })
    setDialogOpen(true)
  }

  const runConnectionTest = async (providerId: string, model?: string) => {
    setTestingId(providerId)
    try {
      const res = await fetch(`/api/admin/ai/providers/${providerId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        duration_ms?: number
        model?: string
        reply?: string
        error?: string
      }
      if (!res.ok || !data.ok) {
        const errMsg = data.error || '连接测试失败'
        setTestResults((prev) => ({
          ...prev,
          [providerId]: { ok: false, error: errMsg, testedAt: Date.now() },
        }))
        throw new Error(errMsg)
      }
      setTestResults((prev) => ({
        ...prev,
        [providerId]: {
          ok: true,
          durationMs: data.duration_ms,
          model: data.model,
          reply: data.reply,
          testedAt: Date.now(),
        },
      }))
      toast.success(`连通成功 (${data.model}) · 耗时 ${data.duration_ms}ms`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '连接测试失败')
    } finally {
      setTestingId(null)
    }
  }

  const handleSave = async (andTest = false) => {
    if (!form.name.trim() || !form.base_url.trim()) {
      toast.error('请填写显示名称和 Base URL')
      return
    }
    if (form.key_mode === 'env' && !form.env_var_name.trim()) {
      toast.error('环境变量模式需要填写环境变量名称')
      return
    }

    let customHeaders: Record<string, string> = {}
    if (form.custom_headers_text.trim()) {
      try {
        const parsed = JSON.parse(form.custom_headers_text) as unknown
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('自定义请求头必须是 JSON 对象')
        }
        customHeaders = Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
        )
      } catch (error) {
        toast.error(
          error instanceof Error ? `自定义请求头格式有误：${error.message}` : '自定义请求头必须是合法 JSON',
        )
        return
      }
    }

    if (andTest) {
      setSavingAndTesting(true)
    } else {
      setSaving(true)
    }

    try {
      const models = form.models_text
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean)

      const defaultModel = form.default_model.trim() || models[0] || ''
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        protocol: form.protocol,
        base_url: form.base_url.trim(),
        key_mode: form.key_mode,
        ...(form.key_mode === 'env'
          ? { env_var_name: form.env_var_name.trim() }
          : editingId
            ? { env_var_name: null }
            : {}),
        models,
        default_model: defaultModel,
        custom_headers: customHeaders,
        enabled: form.enabled,
        is_default: form.is_default,
      }

      if (form.key_mode === 'encrypted' && form.api_key.trim()) {
        payload.api_key = form.api_key.trim()
      }

      const url = editingId ? `/api/admin/ai/providers/${editingId}` : '/api/admin/ai/providers'
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json().catch(() => ({}))) as {
        provider?: AiProviderPublic
        error?: string
      }
      if (!res.ok) {
        throw new Error(data.error || '保存失败')
      }

      toast.success(editingId ? 'Provider 配置已更新' : 'Provider 已添加')
      setDialogOpen(false)
      await onRefresh()

      if (andTest && data.provider?.id) {
        await runConnectionTest(data.provider.id, data.provider.default_model || defaultModel)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
      setSavingAndTesting(false)
    }
  }

  const handleDelete = async (provider: AiProviderPublic) => {
    try {
      const res = await fetch(`/api/admin/ai/providers/${provider.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || '删除失败')
      }
      setConfirmDeleteId(null)
      toast.success(`已删除「${provider.name}」`)
      await onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败')
    }
  }

  const handleToggle = async (
    provider: AiProviderPublic,
    patch: Partial<Pick<AiProviderPublic, 'enabled' | 'is_default' | 'default_model'>>,
    successToast?: string,
  ) => {
    try {
      if (patch.default_model) {
        setSwitchingModelId(provider.id)
      }
      const res = await fetch(`/api/admin/ai/providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || '更新失败')
      }
      if (successToast) {
        toast.success(successToast)
      }
      await onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败')
    } finally {
      setSwitchingModelId(null)
    }
  }

  const handleSyncModels = async (provider: AiProviderPublic) => {
    setSyncingModelsId(provider.id)
    try {
      const res = await fetch(`/api/admin/ai/providers/${provider.id}/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ save: true }),
      })
      const data = (await res.json().catch(() => ({}))) as { models?: string[]; error?: string }
      if (!res.ok) {
        throw new Error(data.error || '拉取模型列表失败')
      }
      toast.success(`已同步 ${data.models?.length ?? 0} 个可用模型`)
      await onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '拉取模型列表失败')
    } finally {
      setSyncingModelsId(null)
    }
  }

  const handleFetchDialogModels = async () => {
    if (!form.base_url.trim()) {
      toast.error('请先填写 API Base URL')
      return
    }
    if (form.key_mode === 'env' && !form.env_var_name.trim()) {
      toast.error('请先填写环境变量名称')
      return
    }

    let customHeaders: Record<string, string> = {}
    if (form.custom_headers_text.trim()) {
      try {
        const parsed = JSON.parse(form.custom_headers_text) as unknown
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('自定义请求头必须是 JSON 对象')
        }
        customHeaders = Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
        )
      } catch (error) {
        toast.error(
          error instanceof Error ? `自定义请求头格式有误：${error.message}` : '自定义请求头必须是合法 JSON',
        )
        return
      }
    }

    setFetchingDialogModels(true)
    setDialogFetchError(null)
    try {
      const res = await fetch('/api/admin/ai/providers/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: form.protocol,
          base_url: form.base_url.trim(),
          key_mode: form.key_mode,
          api_key: form.key_mode === 'encrypted' ? form.api_key.trim() || null : null,
          env_var_name: form.key_mode === 'env' ? form.env_var_name.trim() : null,
          custom_headers: customHeaders,
          provider_id: editingId,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { models?: string[]; error?: string }
      if (!res.ok) {
        throw new Error(data.error || '拉取模型列表失败')
      }
      const remoteModels = data.models ?? []
      if (remoteModels.length === 0) {
        setDialogFetchError('接口连通成功，但未返回可用模型列表，请手动填写模型 ID。')
        return
      }

      setFetchedDialogModels(remoteModels)
      setDialogModelSearch('')

      // 若返回模型数 <= 30，自动合并填入；若过多（如中转站/OpenRouter 上百个），保留在快选面板供勾选或一键导入
      if (remoteModels.length <= 30) {
        const merged = Array.from(new Set([...remoteModels, ...parsedFormModels]))
        setForm((prev) => ({
          ...prev,
          models_text: merged.join('\n'),
          default_model: prev.default_model.trim() || remoteModels[0] || '',
        }))
        toast.success(`已拉取并填充 ${remoteModels.length} 个可用模型`)
      } else {
        setForm((prev) => ({
          ...prev,
          default_model: prev.default_model.trim() || remoteModels[0] || '',
        }))
        toast.success(`已拉取 ${remoteModels.length} 个模型，可在下方搜索勾选或点击「全部导入」`)
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '拉取模型列表失败'
      setDialogFetchError(msg)
      toast.error(msg)
    } finally {
      setFetchingDialogModels(false)
    }
  }

  const toggleModelInForm = (modelId: string) => {
    const exists = parsedFormModels.includes(modelId)
    const nextModels = exists
      ? parsedFormModels.filter((m) => m !== modelId)
      : [...parsedFormModels, modelId]
    setForm((prev) => ({
      ...prev,
      models_text: nextModels.join('\n'),
      default_model: !exists && !prev.default_model.trim() ? modelId : prev.default_model,
    }))
  }

  const filteredDialogModels = useMemo(() => {
    const keyword = dialogModelSearch.trim().toLowerCase()
    if (!keyword) return fetchedDialogModels
    return fetchedDialogModels.filter((m) => m.toLowerCase().includes(keyword))
  }, [fetchedDialogModels, dialogModelSearch])

  const copyBaseUrl = async (provider: AiProviderPublic) => {
    try {
      await navigator.clipboard.writeText(provider.base_url)
      setCopiedId(provider.id)
      toast.success('已复制 Base URL')
      setTimeout(() => setCopiedId((prev) => (prev === provider.id ? null : prev)), 1500)
    } catch {
      toast.error('复制失败')
    }
  }

  const renderPresetCatalog = () => (
    <Card className="overflow-hidden border-border/80">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base sm:text-lg">快速接入预设厂商</CardTitle>
            {providers.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                8 个模板
              </span>
            )}
          </div>
          <CardDescription>
            点击任意厂商卡片自动填充接口地址与推荐模型；支持 OpenAI 兼容、Anthropic Claude 与 Google Gemini 原生协议。
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant={providers.length === 0 ? 'default' : 'outline'}
            size="sm"
            onClick={() => openCreateDialog()}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            自定义添加
          </Button>
          {providers.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPresetsExpanded((prev) => !prev)}
              className="gap-1 text-xs text-muted-foreground"
            >
              {presetsExpanded ? (
                <>
                  收起
                  <ChevronUp className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  展开厂商列表
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      {presetsExpanded && (
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PROVIDER_PRESETS.map((preset) => {
              const meta = PRESET_META[preset.id] ?? PRESET_META.custom
              const protocolInfo = PROTOCOL_LABELS[preset.protocol]
              const alreadyAdded = providers.some(
                (p) =>
                  preset.id !== 'custom' &&
                  (p.base_url.toLowerCase().includes(new URL(preset.base_url).hostname.toLowerCase()) ||
                    p.name.toLowerCase() === preset.name.toLowerCase()),
              )

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => openCreateDialog(preset.id)}
                  className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-background/60 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-accent/40 hover:shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ring-1',
                            meta.accent,
                          )}
                        >
                          {meta.monogram}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold">{preset.name}</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {protocolInfo.label}
                          </span>
                        </div>
                      </div>

                      {alreadyAdded ? (
                        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-500/12 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          <Check className="h-2.5 w-2.5" />
                          已接入
                        </span>
                      ) : meta.badge ? (
                        <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          {meta.badge}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {meta.tagline}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px]">
                    <span className="truncate font-mono text-muted-foreground">
                      {preset.default_model || '自定义模型 ID'}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-0.5 font-medium text-foreground/70 transition-colors group-hover:text-primary">
                      接入
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )

  return (
    <div className="space-y-6">
      {(!encryptionStatus.configured || encryptionStatus.usingFallback) && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">
              {encryptionStatus.configured
                ? '当前正在使用回退密钥加密 API Key，建议配置独立的 AI_ENCRYPTION_KEY 环境变量'
                : '尚未配置 AI_ENCRYPTION_KEY，无法使用后台加密存库模式（可使用「环境变量引用」模式）'}
            </p>
            <p className="text-xs opacity-85">
              在 <code className="rounded bg-black/10 px-1 py-0.5 font-mono dark:bg-white/10">.env.local</code> 或 Vercel 环境变量中设置至少 16 位随机字符串{' '}
              <code className="rounded bg-black/10 px-1 py-0.5 font-mono dark:bg-white/10">AI_ENCRYPTION_KEY</code>
              ，所有后台录入的 Key 均会通过 AES-256-GCM 加密后写入数据库。
            </p>
          </div>
        </div>
      )}

      {/* When providers exist, show active providers first! */}
      {providers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">已配置的模型源 ({providers.length})</h2>
              <p className="text-xs text-muted-foreground">
                点击任意模型标签可一键切换为该厂商的默认模型；测试结果将实时显示在卡片中。
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {providers.map((provider) => {
              const avatar = getProviderMonogram(provider)
              const protocolInfo = PROTOCOL_LABELS[provider.protocol]
              const testResult = testResults[provider.id]
              const showAllModels = Boolean(expandedModelsIds[provider.id])
              const visibleModels = showAllModels ? provider.models : provider.models.slice(0, 6)
              const hiddenCount = Math.max(0, provider.models.length - visibleModels.length)
              const isConfirmingDelete = confirmDeleteId === provider.id

              return (
                <Card
                  key={provider.id}
                  className={cn(
                    'flex flex-col justify-between transition-all hover:border-foreground/20',
                    !provider.enabled && 'opacity-65',
                    provider.is_default && provider.enabled && 'border-primary/30 shadow-xs',
                  )}
                >
                  <div>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold ring-1',
                              avatar.accent,
                            )}
                          >
                            {avatar.monogram}
                          </span>
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <CardTitle className="truncate text-base">{provider.name}</CardTitle>
                              {provider.is_default && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-medium text-primary">
                                  <Star className="h-3 w-3 fill-current" />
                                  默认
                                </span>
                              )}
                              <span
                                className={cn(
                                  'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                                  protocolInfo.className,
                                )}
                              >
                                {protocolInfo.label}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => void copyBaseUrl(provider)}
                              className="group/url flex max-w-full items-center gap-1 text-left font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                              title="点击复制 Base URL"
                            >
                              <span className="truncate">{provider.base_url}</span>
                              {copiedId === provider.id ? (
                                <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover/url:opacity-70" />
                              )}
                            </button>
                          </div>
                        </div>

                        <Switch
                          checked={provider.enabled}
                          onCheckedChange={(checked) =>
                            void handleToggle(
                              provider,
                              { enabled: checked },
                              checked ? `已启用「${provider.name}」` : `已停用「${provider.name}」`,
                            )
                          }
                          aria-label={`启用 ${provider.name}`}
                        />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3.5 pb-4">
                      {/* Live test status banner */}
                      {testResult && (
                        <div
                          className={cn(
                            'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs',
                            testResult.ok
                              ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                              : 'border-destructive/30 bg-destructive/10 text-destructive',
                          )}
                        >
                          {testResult.ok ? (
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            {testResult.ok ? (
                              <p>
                                连通正常 · <span className="font-mono">{testResult.model}</span> ·{' '}
                                {testResult.durationMs}ms
                                {testResult.reply ? ` · "${testResult.reply}"` : ''}
                              </p>
                            ) : (
                              <p className="break-words">{testResult.error}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Key & Status Info */}
                      <div className="space-y-2 rounded-lg border border-border/60 bg-muted/35 p-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">密钥凭证</span>
                          <span className="font-mono">
                            {provider.has_api_key ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {provider.key_mode === 'env'
                                  ? `ENV · ${provider.env_var_name}`
                                  : provider.api_key_mask || '已加密存储'}
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400">
                                {provider.key_mode === 'env'
                                  ? `环境变量 ${provider.env_var_name || ''} 未就绪`
                                  : '未填写（本地模型可免 Key）'}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">默认模型</span>
                          <span className="truncate font-mono font-medium text-foreground">
                            {provider.default_model || '未设置'}
                          </span>
                        </div>
                      </div>

                      {/* Clickable Models List */}
                      {provider.models.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>可用模型 ({provider.models.length}) · 点击切换默认</span>
                            {switchingModelId === provider.id && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {visibleModels.map((modelId) => {
                              const isCurrentDefault = provider.default_model === modelId
                              return (
                                <button
                                  key={modelId}
                                  type="button"
                                  disabled={isCurrentDefault || switchingModelId === provider.id}
                                  onClick={() =>
                                    void handleToggle(
                                      provider,
                                      { default_model: modelId },
                                      `已将默认模型切换为 ${modelId}`,
                                    )
                                  }
                                  className={cn(
                                    'max-w-full truncate rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors',
                                    isCurrentDefault
                                      ? 'border-primary/40 bg-primary/10 font-medium text-primary'
                                      : 'border-border/70 bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                                  )}
                                  title={isCurrentDefault ? '当前默认模型' : `点击将 ${modelId} 设为默认模型`}
                                >
                                  {modelId}
                                </button>
                              )
                            })}
                            {hiddenCount > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedModelsIds((prev) => ({ ...prev, [provider.id]: true }))
                                }
                                className="rounded-md border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                              >
                                +{hiddenCount} 更多
                              </button>
                            )}
                            {showAllModels && provider.models.length > 6 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedModelsIds((prev) => ({ ...prev, [provider.id]: false }))
                                }
                                className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                              >
                                收起
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </div>

                  {/* Card Action Footer */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-6 pt-3.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void runConnectionTest(provider.id, provider.default_model)}
                      disabled={testingId === provider.id}
                      className="h-8 gap-1.5 text-xs"
                    >
                      {testingId === provider.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plug className="h-3.5 w-3.5" />
                      )}
                      测试连接
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handleSyncModels(provider)}
                      disabled={syncingModelsId === provider.id}
                      className="h-8 gap-1.5 text-xs"
                    >
                      {syncingModelsId === provider.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      拉取模型
                    </Button>
                    {!provider.is_default && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() =>
                          void handleToggle(
                            provider,
                            { is_default: true },
                            `已将「${provider.name}」设为默认 Provider`,
                          )
                        }
                      >
                        设为默认
                      </Button>
                    )}

                    <div className="ml-auto flex items-center gap-1">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2.5 text-xs"
                            onClick={() => void handleDelete(provider)}
                          >
                            确认删除
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            取消
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(provider)}
                            title="编辑配置"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setConfirmDeleteId(provider.id)}
                            title="删除"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Preset Catalog (always visible when empty, collapsible below active cards when configured) */}
      {renderPresetCatalog()}

      {/* Onboarding Empty State */}
      {providers.length === 0 && (
        <Card className="border-dashed bg-card/50">
          <CardContent className="py-8">
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/80 bg-muted/60 text-muted-foreground">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">3 步开启博客 AI 创作工作流</h3>
                <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                  还没有接入任何 AI 模型。选择上方任意预设厂商卡片，填入 API Key 即可解锁文章导读、SEO 自动填充、划词润色与无损多语言翻译。
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary">
                    1
                  </span>
                  <p className="mt-2.5 text-sm font-medium">选择厂商并填 Key</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    API Key 默认使用 AES-256-GCM 加密存库，仅在服务端调用，绝不暴露给前端。
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary">
                    2
                  </span>
                  <p className="mt-2.5 text-sm font-medium">一键测试与拉取模型</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    保存时可直接触发连通性检查，并自动同步该端点下的所有可用模型列表。
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary">
                    3
                  </span>
                  <p className="mt-2.5 text-sm font-medium">随处调用 AI 助手</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    可在「任务与 Prompt」微调提示词试跑，或在文章编辑器与「批量处理」中直接使用。
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <Button type="button" onClick={() => openCreateDialog('deepseek')} className="gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  快速接入 DeepSeek
                </Button>
                <Button type="button" variant="outline" onClick={() => openCreateDialog('gemini')}>
                  接入 Google Gemini
                </Button>
                <Button type="button" variant="ghost" onClick={() => openCreateDialog()}>
                  自定义中转 / 本地 Ollama
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Helpful next step bar when providers are configured */}
      {providers.length > 0 && onNavigateTab && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/25 px-4 py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>模型已接入！你可以继续为不同写作场景分配专属模型与 Prompt，或对历史文章批量生成摘要。</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => onNavigateTab('tasks')}
            >
              配置任务与 Prompt
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => onNavigateTab('batch')}
            >
              前往批量处理 →
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="shrink-0 border-b border-border/60 px-6 pb-4 pt-6">
            <DialogTitle>{editingId ? '编辑 AI Provider' : '新增 AI Provider'}</DialogTitle>
            <DialogDescription>
              配置 API 协议、端点与模型列表。API Key 仅在服务端使用，绝不会暴露到前台。
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {/* Quick preset switch pills when creating */}
            {!editingId && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">快速切换预设模板</Label>
                <div className="flex flex-wrap gap-1.5">
                  {PROVIDER_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setActivePresetId(preset.id)
                        setForm((prev) => ({
                          ...prev,
                          name: preset.name,
                          protocol: preset.protocol,
                          base_url: preset.base_url,
                          default_model: preset.default_model,
                          models_text: preset.models.join('\n'),
                        }))
                      }}
                      className={cn(
                        'rounded-md border px-2 py-1 text-xs transition-colors',
                        activePresetId === preset.id
                          ? 'border-primary bg-primary/10 font-medium text-primary'
                          : 'border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>显示名称</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="例如：DeepSeek 官方 / 我的中转站"
                />
              </div>
              <div className="space-y-2">
                <Label>接口协议</Label>
                <select
                  value={form.protocol}
                  onChange={(e) => setForm((f) => ({ ...f, protocol: e.target.value as AiProtocol }))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="openai-compatible">OpenAI 兼容（DeepSeek/OpenAI/中转/Ollama）</option>
                  <option value="anthropic">Anthropic Claude 原生</option>
                  <option value="gemini">Google Gemini 原生</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>API Base URL</Label>
              <Input
                value={form.base_url}
                onChange={(e) => setForm((f) => ({ ...f, base_url: e.target.value }))}
                placeholder="https://api.deepseek.com/v1"
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label>密钥存放模式</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={form.key_mode === 'encrypted' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setForm((f) => ({ ...f, key_mode: 'encrypted' }))}
                >
                  后台加密存库（推荐）
                </Button>
                <Button
                  type="button"
                  variant={form.key_mode === 'env' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setForm((f) => ({ ...f, key_mode: 'env' }))}
                >
                  引用服务端环境变量
                </Button>
              </div>
            </div>

            {form.key_mode === 'encrypted' ? (
              <div className="space-y-2">
                <Label>API Key {editingId ? '（留空表示保持原有密钥不变）' : ''}</Label>
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.api_key}
                    onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                    placeholder={editingId ? '••••••••（留空不修改）' : 'sk-...'}
                    className="pr-10 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showApiKey ? '隐藏 API Key' : '显示 API Key'}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>环境变量名称</Label>
                <Input
                  value={form.env_var_name}
                  onChange={(e) => setForm((f) => ({ ...f, env_var_name: e.target.value }))}
                  placeholder="例如：DEEPSEEK_API_KEY"
                  className="font-mono text-xs"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>默认模型 ID</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void handleFetchDialogModels()}
                  disabled={fetchingDialogModels || !form.base_url.trim()}
                  className="h-7 gap-1.5 px-2.5 text-xs"
                >
                  {fetchingDialogModels ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  {fetchingDialogModels ? '拉取中...' : '直接拉取模型'}
                </Button>
              </div>
              <Input
                value={form.default_model}
                onChange={(e) => setForm((f) => ({ ...f, default_model: e.target.value }))}
                placeholder="例如：deepseek-chat / gpt-4o-mini / gemini-2.5-flash"
                className="font-mono text-xs"
              />
              {dialogFetchError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="break-words">{dialogFetchError}</span>
                </div>
              )}

              {/* 远端拉取的模型交互选择器 */}
              {fetchedDialogModels.length > 0 && (
                <div className="space-y-2 rounded-lg border border-border/80 bg-muted/25 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      已从接口拉取 {fetchedDialogModels.length} 个模型（点击勾选加入列表）
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => {
                          const merged = Array.from(
                            new Set([...fetchedDialogModels, ...parsedFormModels]),
                          )
                          setForm((f) => ({
                            ...f,
                            models_text: merged.join('\n'),
                            default_model: f.default_model.trim() || fetchedDialogModels[0] || '',
                          }))
                          toast.success(`已全部导入 ${fetchedDialogModels.length} 个模型`)
                        }}
                      >
                        全部导入
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[11px] text-muted-foreground"
                        onClick={() => setForm((f) => ({ ...f, models_text: '' }))}
                      >
                        清空列表
                      </Button>
                    </div>
                  </div>

                  {fetchedDialogModels.length > 10 && (
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={dialogModelSearch}
                        onChange={(e) => setDialogModelSearch(e.target.value)}
                        placeholder="搜索模型名称，如 deepseek / claude / gemini..."
                        className="h-7 bg-background pl-8 font-mono text-xs"
                      />
                    </div>
                  )}

                  <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pr-1">
                    {filteredDialogModels.slice(0, 80).map((m) => {
                      const selected = parsedFormModels.includes(m)
                      const isDef = form.default_model === m
                      return (
                        <div
                          key={m}
                          className={cn(
                            'inline-flex items-center overflow-hidden rounded-md border text-[11px] transition-colors',
                            selected
                              ? 'border-primary/40 bg-primary/10 text-primary'
                              : 'border-border/70 bg-background text-muted-foreground hover:border-foreground/30',
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleModelInForm(m)}
                            className="flex items-center gap-1 px-2 py-0.5 font-mono hover:text-foreground"
                            title={selected ? '点击移出列表' : '点击加入列表'}
                          >
                            {selected && <Check className="h-2.5 w-2.5 shrink-0" />}
                            <span>{m}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextModels = parsedFormModels.includes(m)
                                ? parsedFormModels
                                : [...parsedFormModels, m]
                              setForm((f) => ({
                                ...f,
                                default_model: m,
                                models_text: nextModels.join('\n'),
                              }))
                            }}
                            className={cn(
                              'border-l border-border/50 px-1.5 py-0.5 hover:bg-primary/15',
                              isDef ? 'text-primary' : 'text-muted-foreground/60 hover:text-primary',
                            )}
                            title={isDef ? '当前默认模型' : `将 ${m} 设为默认模型`}
                          >
                            <Star className={cn('h-2.5 w-2.5', isDef && 'fill-current')} />
                          </button>
                        </div>
                      )
                    })}
                    {filteredDialogModels.length > 80 && (
                      <span className="self-center text-[11px] text-muted-foreground">
                        还有 {filteredDialogModels.length - 80} 个结果，请输入关键词进一步筛选
                      </span>
                    )}
                    {filteredDialogModels.length === 0 && (
                      <span className="text-xs text-muted-foreground">没有匹配的模型</span>
                    )}
                  </div>
                </div>
              )}

              {parsedFormModels.length > 0 && fetchedDialogModels.length === 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] text-muted-foreground">快速设为默认：</span>
                  {parsedFormModels.slice(0, 8).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, default_model: m }))}
                      className={cn(
                        'rounded border px-1.5 py-0.5 font-mono text-[11px] transition-colors',
                        form.default_model === m
                          ? 'border-primary bg-primary/10 font-medium text-primary'
                          : 'border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>已选模型列表（每行一个，可手动编辑）</Label>
                <span className="font-mono text-[11px] text-muted-foreground">
                  共 {parsedFormModels.length} 个
                </span>
              </div>
              <Textarea
                rows={4}
                value={form.models_text}
                onChange={(e) => setForm((f) => ({ ...f, models_text: e.target.value }))}
                placeholder={'deepseek-chat\ndeepseek-reasoner'}
                className="font-mono text-xs"
              />
            </div>

            {/* Collapsible Advanced Headers */}
            <div className="rounded-lg border border-border/70">
              <button
                type="button"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <span className="flex items-center gap-1.5">
                  <Settings2 className="h-3.5 w-3.5" />
                  高级选项：自定义请求头（可选）
                </span>
                {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {showAdvanced && (
                <div className="space-y-2 border-t border-border/60 p-3">
                  <p className="text-[11px] text-muted-foreground">
                    部分中转站或 OpenRouter 支持额外 HTTP Header（JSON 格式，例如{' '}
                    <code className="font-mono">{'{"HTTP-Referer": "https://your-site.com"}'}</code>）。
                  </p>
                  <Textarea
                    rows={3}
                    value={form.custom_headers_text}
                    onChange={(e) => setForm((f) => ({ ...f, custom_headers_text: e.target.value }))}
                    placeholder={'{\n  "X-Title": "My Blog"\n}'}
                    className="font-mono text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">设为默认 Provider</p>
                <p className="text-xs text-muted-foreground">未单独指定模型的 AI 任务将自动使用此配置。</p>
              </div>
              <Switch
                checked={form.is_default}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_default: checked }))}
              />
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border/60 bg-muted/20 px-6 py-4 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving || savingAndTesting}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleSave(false)}
              disabled={saving || savingAndTesting}
            >
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              仅保存
            </Button>
            <Button
              type="button"
              onClick={() => void handleSave(true)}
              disabled={saving || savingAndTesting}
              className="gap-1.5"
            >
              {savingAndTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              保存并测试连接
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
