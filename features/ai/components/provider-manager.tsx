'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Pencil,
  Plug,
  Plus,
  RefreshCw,
  ShieldAlert,
  Star,
  Trash2,
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

interface ProviderFormState {
  name: string
  protocol: AiProtocol
  base_url: string
  key_mode: AiKeyMode
  api_key: string
  env_var_name: string
  models_text: string
  default_model: string
  enabled: boolean
  is_default: boolean
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
  enabled: true,
  is_default: false,
}

interface ProviderManagerProps {
  providers: AiProviderPublic[]
  encryptionStatus: { configured: boolean; usingFallback: boolean }
  onRefresh: () => Promise<void>
}

export function ProviderManager({
  providers,
  encryptionStatus,
  onRefresh,
}: ProviderManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProviderFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [syncingModelsId, setSyncingModelsId] = useState<string | null>(null)

  const openCreateDialog = (presetId?: string) => {
    setEditingId(null)
    if (presetId) {
      const preset = PROVIDER_PRESETS.find((item) => item.id === presetId)
      if (preset) {
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
    setForm({ ...EMPTY_FORM, is_default: providers.length === 0 })
    setDialogOpen(true)
  }

  const openEditDialog = (provider: AiProviderPublic) => {
    setEditingId(provider.id)
    setForm({
      name: provider.name,
      protocol: provider.protocol,
      base_url: provider.base_url,
      key_mode: provider.key_mode,
      api_key: '',
      env_var_name: provider.env_var_name ?? '',
      models_text: provider.models.join('\n'),
      default_model: provider.default_model,
      enabled: provider.enabled,
      is_default: provider.is_default,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.base_url.trim()) {
      toast.error('请填写名称和 Base URL')
      return
    }
    if (form.key_mode === 'env' && !form.env_var_name.trim()) {
      toast.error('环境变量模式需要填写环境变量名称')
      return
    }

    setSaving(true)
    try {
      const models = form.models_text
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean)

      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        protocol: form.protocol,
        base_url: form.base_url.trim(),
        key_mode: form.key_mode,
        env_var_name: form.key_mode === 'env' ? form.env_var_name.trim() : null,
        models,
        default_model: form.default_model.trim() || models[0] || '',
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
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        throw new Error(data.error || '保存失败')
      }

      toast.success(editingId ? 'Provider 已更新' : 'Provider 已添加')
      setDialogOpen(false)
      await onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (provider: AiProviderPublic) => {
    if (!window.confirm(`确定删除 Provider「${provider.name}」吗？`)) return

    try {
      const res = await fetch(`/api/admin/ai/providers/${provider.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || '删除失败')
      }
      toast.success('已删除 Provider')
      await onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败')
    }
  }

  const handleToggle = async (provider: AiProviderPublic, patch: Partial<Pick<AiProviderPublic, 'enabled' | 'is_default'>>) => {
    try {
      const res = await fetch(`/api/admin/ai/providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || '更新失败')
      }
      await onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败')
    }
  }

  const handleTest = async (provider: AiProviderPublic) => {
    setTestingId(provider.id)
    try {
      const res = await fetch(`/api/admin/ai/providers/${provider.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: provider.default_model }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        duration_ms?: number
        model?: string
        reply?: string
        error?: string
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.error || '测试失败')
      }
      toast.success(`连通成功 (${data.model}) · 耗时 ${data.duration_ms}ms · 回复: ${data.reply}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '连接测试失败')
    } finally {
      setTestingId(null)
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

  return (
    <div className="space-y-6">
      {(!encryptionStatus.configured || encryptionStatus.usingFallback) && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">
              {encryptionStatus.configured
                ? '当前正在使用回退密钥加密 API Key，建议配置独立的 AI_ENCRYPTION_KEY 环境变量'
                : '尚未配置 AI_ENCRYPTION_KEY，无法使用后台加密存库模式（可使用「环境变量引用」模式）'}
            </p>
            <p className="text-xs opacity-85">
              在 `.env.local` 或 Vercel 环境变量中设置至少 16 位随机字符串 `AI_ENCRYPTION_KEY`，所有后台录入的 Key 均会通过 AES-256-GCM 加密后写入数据库。
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>快速接入预设厂商</CardTitle>
            <CardDescription>
              支持 OpenAI 兼容协议（含 DeepSeek、OpenRouter、硅基流动、OneAPI/中转站、Ollama）、Anthropic Claude 与 Google Gemini 原生协议。
            </CardDescription>
          </div>
          <Button onClick={() => openCreateDialog()} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            自定义添加
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {PROVIDER_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openCreateDialog(preset.id)}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                {preset.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {providers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <KeyRound className="mb-3 h-10 w-10 text-muted-foreground/60" />
            <p className="text-base font-medium">还没有配置任何 AI Provider</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              点击上方任意预设厂商或「自定义添加」，录入 Base URL 与 API Key 后即可在后台编辑器使用摘要、翻译与写作助手。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {providers.map((provider) => (
            <Card key={provider.id} className={!provider.enabled ? 'opacity-65' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {provider.protocol}
                      </span>
                      {provider.is_default && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          <Star className="h-3 w-3 fill-current" />
                          默认
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{provider.base_url}</p>
                  </div>
                  <Switch
                    checked={provider.enabled}
                    onCheckedChange={(checked) => void handleToggle(provider, { enabled: checked })}
                    aria-label={`启用 ${provider.name}`}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5 rounded-md bg-muted/40 p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">密钥状态</span>
                    <span className="font-mono">
                      {provider.has_api_key ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {provider.api_key_mask || '已配置'}
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
                    <span className="truncate font-mono">{provider.default_model || '未设置'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">可用模型数</span>
                    <span>{provider.models.length} 个</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleTest(provider)}
                    disabled={testingId === provider.id}
                    className="gap-1.5"
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
                    className="gap-1.5"
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
                      onClick={() => void handleToggle(provider, { is_default: true })}
                    >
                      设为默认
                    </Button>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(provider)}
                      title="编辑"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => void handleDelete(provider)}
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑 AI Provider' : '新增 AI Provider'}</DialogTitle>
            <DialogDescription>
              配置 API 协议、端点与模型列表。API Key 仅在服务端使用，绝不会暴露到前台。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
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
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={form.api_key}
                  onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                  placeholder={editingId ? '••••••••（留空不修改）' : 'sk-...'}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>环境变量名称</Label>
                <Input
                  value={form.env_var_name}
                  onChange={(e) => setForm((f) => ({ ...f, env_var_name: e.target.value }))}
                  placeholder="例如：DEEPSEEK_API_KEY"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>默认模型 ID</Label>
              <Input
                value={form.default_model}
                onChange={(e) => setForm((f) => ({ ...f, default_model: e.target.value }))}
                placeholder="例如：deepseek-chat / gpt-4o-mini / gemini-2.5-flash"
              />
            </div>

            <div className="space-y-2">
              <Label>可选模型列表（每行一个，保存后也可点击「拉取模型」自动填充）</Label>
              <Textarea
                rows={4}
                value={form.models_text}
                onChange={(e) => setForm((f) => ({ ...f, models_text: e.target.value }))}
                placeholder={'deepseek-chat\ndeepseek-reasoner'}
                className="font-mono text-xs"
              />
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              取消
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存配置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
