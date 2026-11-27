import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { decryptApiKey } from './crypto'
import { callLlm, extractJsonFromLlmText, type LlmCompletionResponse } from './providers'
import { DEFAULT_SYSTEM_PROMPTS } from './prompts'
import type { AiGlossaryEntry, AiProtocol, AiProviderPublic, AiTaskConfig, AiTaskKey } from './types'

export type DbProviderRow = Database['public']['Tables']['ai_providers']['Row']
export type DbTaskConfigRow = Database['public']['Tables']['ai_task_configs']['Row']

export interface ResolvedExecutionContext {
  provider: {
    id: string
    name: string
    protocol: AiProtocol
    baseUrl: string
    apiKey: string
    customHeaders: Record<string, string>
  }
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  glossary: AiGlossaryEntry[]
}

export function toPublicProvider(row: DbProviderRow): AiProviderPublic {
  const envVarName = row.env_var_name?.trim() || null
  const envVarConfigured = envVarName ? Boolean(process.env[envVarName]?.trim()) : undefined

  return {
    id: row.id,
    name: row.name,
    protocol: row.protocol,
    base_url: row.base_url,
    key_mode: row.key_mode,
    has_api_key: row.key_mode === 'env' ? Boolean(envVarConfigured) : Boolean(row.api_key_encrypted),
    api_key_mask: row.key_mode === 'env' ? (envVarName ? `env:${envVarName}` : null) : row.api_key_mask,
    env_var_name: envVarName,
    env_var_configured: envVarConfigured,
    models: Array.isArray(row.models) ? row.models : [],
    default_model: row.default_model || '',
    custom_headers:
      row.custom_headers && typeof row.custom_headers === 'object' ? row.custom_headers : {},
    enabled: row.enabled,
    is_default: row.is_default,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function resolveProviderApiKey(row: DbProviderRow): string {
  if (row.key_mode === 'env') {
    const envName = row.env_var_name?.trim()
    if (!envName) {
      throw new Error(`Provider「${row.name}」未填写环境变量名称`)
    }
    const envValue = process.env[envName]?.trim()
    if (!envValue) {
      throw new Error(`环境变量 ${envName} 未配置或为空（Provider：${row.name}）`)
    }
    return envValue
  }

  if (!row.api_key_encrypted) {
    // 允许本地 Ollama 等免 Key 服务
    if (
      row.protocol === 'openai-compatible' &&
      (row.base_url.includes('localhost') || row.base_url.includes('127.0.0.1'))
    ) {
      return ''
    }
    throw new Error(`Provider「${row.name}」未配置 API Key`)
  }

  return decryptApiKey(row.api_key_encrypted)
}

export async function getTaskConfig(
  client: SupabaseClient<Database>,
  taskKey: AiTaskKey,
): Promise<AiTaskConfig> {
  const { data } = await client
    .from('ai_task_configs')
    .select('*')
    .eq('task_key', taskKey)
    .maybeSingle()

  const row = data as DbTaskConfigRow | null

  return {
    task_key: taskKey,
    provider_id: row?.provider_id ?? null,
    model: row?.model ?? null,
    temperature: typeof row?.temperature === 'number' ? row.temperature : 0.3,
    max_tokens: typeof row?.max_tokens === 'number' ? row.max_tokens : 2048,
    system_prompt: row?.system_prompt ?? null,
    glossary: Array.isArray(row?.glossary) ? row.glossary : [],
    updated_at: row?.updated_at,
  }
}

export async function resolveExecutionContext(
  client: SupabaseClient<Database>,
  options: {
    taskKey: AiTaskKey
    providerId?: string | null
    model?: string | null
    temperature?: number
    maxTokens?: number
  },
): Promise<ResolvedExecutionContext> {
  const taskConfig = await getTaskConfig(client, options.taskKey)
  const targetProviderId = options.providerId || taskConfig.provider_id

  let providerRow: DbProviderRow | null = null

  if (targetProviderId) {
    const { data } = await client
      .from('ai_providers')
      .select('*')
      .eq('id', targetProviderId)
      .maybeSingle()
    providerRow = (data as DbProviderRow | null) ?? null
  }

  if (!providerRow) {
    const { data } = await client
      .from('ai_providers')
      .select('*')
      .eq('enabled', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    providerRow = (data as DbProviderRow | null) ?? null
  }

  if (!providerRow) {
    throw new Error('尚未配置任何可用的 AI Provider，请先前往「AI 中心」添加并启用至少一个 API 配置')
  }

  if (!providerRow.enabled) {
    throw new Error(`指定的 Provider「${providerRow.name}」当前处于禁用状态`)
  }

  const resolvedModel =
    options.model?.trim() ||
    (options.providerId ? '' : taskConfig.model?.trim() || '') ||
    providerRow.default_model?.trim() ||
    (Array.isArray(providerRow.models) ? providerRow.models[0] : '')

  if (!resolvedModel) {
    throw new Error(`Provider「${providerRow.name}」未设置默认模型，请先在 AI 中心配置模型 ID`)
  }

  const apiKey = resolveProviderApiKey(providerRow)

  return {
    provider: {
      id: providerRow.id,
      name: providerRow.name,
      protocol: providerRow.protocol,
      baseUrl: providerRow.base_url,
      apiKey,
      customHeaders:
        providerRow.custom_headers && typeof providerRow.custom_headers === 'object'
          ? providerRow.custom_headers
          : {},
    },
    model: resolvedModel,
    temperature: options.temperature ?? taskConfig.temperature,
    maxTokens: options.maxTokens ?? taskConfig.max_tokens,
    systemPrompt: taskConfig.system_prompt?.trim() || DEFAULT_SYSTEM_PROMPTS[options.taskKey],
    glossary: taskConfig.glossary,
  }
}

export async function recordAiLog(
  client: SupabaseClient<Database>,
  entry: Database['public']['Tables']['ai_generation_logs']['Insert'],
): Promise<void> {
  try {
    await client.from('ai_generation_logs').insert(entry as never)
  } catch (err) {
    console.error('Failed to record AI generation log:', err)
  }
}

export async function executeAiTextTask(
  client: SupabaseClient<Database>,
  params: {
    taskKey: AiTaskKey
    postId?: string | null
    providerId?: string | null
    model?: string | null
    systemPromptOverride?: string
    userPrompt: string
    jsonMode?: boolean
    temperature?: number
    maxTokens?: number
    timeoutMs?: number
  },
): Promise<{ response: LlmCompletionResponse; context: ResolvedExecutionContext }> {
  const context = await resolveExecutionContext(client, {
    taskKey: params.taskKey,
    providerId: params.providerId,
    model: params.model,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
  })

  const startedAt = Date.now()
  try {
    const response = await callLlm({
      protocol: context.provider.protocol,
      baseUrl: context.provider.baseUrl,
      apiKey: context.provider.apiKey,
      model: context.model,
      systemPrompt: params.systemPromptOverride ?? context.systemPrompt,
      userPrompt: params.userPrompt,
      temperature: context.temperature,
      maxTokens: context.maxTokens,
      jsonMode: params.jsonMode,
      customHeaders: context.provider.customHeaders,
      timeoutMs: params.timeoutMs,
    })

    await recordAiLog(client, {
      post_id: params.postId ?? null,
      task_key: params.taskKey,
      provider_id: context.provider.id,
      provider_name: context.provider.name,
      model: context.model,
      prompt_tokens: response.usage.promptTokens,
      completion_tokens: response.usage.completionTokens,
      total_tokens: response.usage.totalTokens,
      duration_ms: response.durationMs,
      status: 'success',
    })

    return { response, context }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await recordAiLog(client, {
      post_id: params.postId ?? null,
      task_key: params.taskKey,
      provider_id: context.provider.id,
      provider_name: context.provider.name,
      model: context.model,
      duration_ms: Date.now() - startedAt,
      status: 'error',
      error_message: message.slice(0, 500),
    })
    throw error
  }
}

export async function executeAiJsonTask<T>(
  client: SupabaseClient<Database>,
  params: {
    taskKey: AiTaskKey
    postId?: string | null
    providerId?: string | null
    model?: string | null
    systemPromptOverride?: string
    userPrompt: string
    parse: (raw: unknown) => T
    temperature?: number
    maxTokens?: number
    timeoutMs?: number
  },
): Promise<{ data: T; response: LlmCompletionResponse; context: ResolvedExecutionContext }> {
  const { response, context } = await executeAiTextTask(client, {
    ...params,
    jsonMode: true,
  })

  const rawJson = extractJsonFromLlmText(response.text)
  const data = params.parse(rawJson)
  return { data, response, context }
}
