'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
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

interface TaskRoutingManagerProps {
  providers: AiProviderPublic[]
  tasks: AiTaskConfig[]
  defaultPrompts: Record<AiTaskKey, string>
  onRefresh: () => Promise<void>
}

export function TaskRoutingManager({
  providers,
  tasks,
  defaultPrompts,
  onRefresh,
}: TaskRoutingManagerProps) {
  const [selectedTaskKey, setSelectedTaskKey] = useState<AiTaskKey>('summary')
  const [saving, setSaving] = useState(false)

  const currentTask = tasks.find((item) => item.task_key === selectedTaskKey)

  const [providerId, setProviderId] = useState<string>('')
  const [model, setModel] = useState<string>('')
  const [temperature, setTemperature] = useState<string>('0.3')
  const [maxTokens, setMaxTokens] = useState<string>('2048')
  const [systemPrompt, setSystemPrompt] = useState<string>('')
  const [glossary, setGlossary] = useState<AiGlossaryEntry[]>([])

  useEffect(() => {
    if (!currentTask) return
    setProviderId(currentTask.provider_id ?? '')
    setModel(currentTask.model ?? '')
    setTemperature(String(currentTask.temperature ?? 0.3))
    setMaxTokens(String(currentTask.max_tokens ?? 2048))
    setSystemPrompt(currentTask.system_prompt ?? '')
    setGlossary(currentTask.glossary ?? [])
  }, [currentTask])

  const selectedProvider = providers.find((p) => p.id === providerId)
  const availableModels = selectedProvider?.models ?? []

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

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-2 lg:col-span-4">
        {(['summary', 'metadata', 'translate', 'rewrite', 'outline'] as AiTaskKey[]).map((key) => {
          const task = tasks.find((t) => t.task_key === key)
          const boundProvider = providers.find((p) => p.id === task?.provider_id)
          const active = selectedTaskKey === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedTaskKey(key)}
              className={`w-full rounded-lg border p-4 text-left transition-colors ${
                active
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{AI_TASK_LABELS[key].title}</span>
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {task?.model || boundProvider?.default_model || '跟随默认'}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{AI_TASK_LABELS[key].description}</p>
            </button>
          )
        })}
      </div>

      <Card className="lg:col-span-8">
        <CardHeader>
          <CardTitle>{AI_TASK_LABELS[selectedTaskKey].title}</CardTitle>
          <CardDescription>{AI_TASK_LABELS[selectedTaskKey].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
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
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">跟随系统默认 Provider</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.enabled ? '' : '(已禁用)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>指定模型 ID（留空使用该 Provider 默认模型）</Label>
              <Input
                list={`models-${selectedTaskKey}`}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={selectedProvider?.default_model || '例如：deepseek-chat'}
              />
              <datalist id={`models-${selectedTaskKey}`}>
                {availableModels.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Temperature（0 ~ 2，摘要/翻译建议 0.2~0.3）</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Tokens</Label>
              <Input
                type="number"
                step="128"
                min="128"
                max="32768"
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>自定义 System Prompt（留空则使用内置高质量 Prompt）</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setSystemPrompt(defaultPrompts[selectedTaskKey] || '')}
                  className="h-7 text-xs"
                >
                  载入默认模板编辑
                </Button>
                {systemPrompt && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSystemPrompt('')}
                    className="h-7 gap-1 text-xs text-muted-foreground"
                  >
                    <RotateCcw className="h-3 w-3" />
                    恢复默认
                  </Button>
                )}
              </div>
            </div>
            <Textarea
              rows={7}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder={defaultPrompts[selectedTaskKey]}
              className="font-mono text-xs"
            />
          </div>

          {selectedTaskKey === 'translate' && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
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
                  onClick={() => setGlossary((prev) => [...prev, { source: '', target: '', note: '' }])}
                  className="gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  添加术语
                </Button>
              </div>
              {glossary.length === 0 ? (
                <p className="text-xs text-muted-foreground">暂无术语条目。</p>
              ) : (
                <div className="space-y-2">
                  {glossary.map((entry, idx) => (
                    <div key={idx} className="grid grid-cols-12 items-center gap-2">
                      <Input
                        className="col-span-4"
                        placeholder="原文词"
                        value={entry.source}
                        onChange={(e) =>
                          setGlossary((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, source: e.target.value } : item)),
                          )
                        }
                      />
                      <Input
                        className="col-span-4"
                        placeholder="目标译法"
                        value={entry.target}
                        onChange={(e) =>
                          setGlossary((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, target: e.target.value } : item)),
                          )
                        }
                      />
                      <Input
                        className="col-span-3"
                        placeholder="备注（可选）"
                        value={entry.note ?? ''}
                        onChange={(e) =>
                          setGlossary((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, note: e.target.value } : item)),
                          )
                        }
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="col-span-1 text-destructive"
                        onClick={() => setGlossary((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="button" onClick={() => void handleSave()} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              保存任务配置
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
