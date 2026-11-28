import type { AiProtocol } from '../types'

export interface LlmCompletionRequest {
  protocol: AiProtocol
  baseUrl: string
  apiKey: string
  model: string
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
  customHeaders?: Record<string, string>
  timeoutMs?: number
}

export interface LlmUsage {
  promptTokens: number | null
  completionTokens: number | null
  totalTokens: number | null
}

export interface LlmCompletionResponse {
  text: string
  usage: LlmUsage
  durationMs: number
  rawModel?: string
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

async function safeParseJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { rawText: text }
  }
}

function extractApiErrorMessage(payload: unknown, fallbackStatus: number): string {
  if (isRecord(payload)) {
    if (isRecord(payload.error) && typeof payload.error.message === 'string') {
      return payload.error.message
    }
    if (typeof payload.error === 'string') {
      return payload.error
    }
    if (typeof payload.message === 'string') {
      return payload.message
    }
    if (typeof payload.rawText === 'string' && payload.rawText.trim()) {
      return payload.rawText.trim().slice(0, 300)
    }
  }
  return `上游 API 请求失败（HTTP ${fallbackStatus}）`
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 408 || (status >= 500 && status <= 599)
}

async function fetchWithRetry(
  url: string,
  init: Omit<RequestInit, 'signal'>,
  timeoutMs: number,
  maxAttempts = 3,
): Promise<Response> {
  let lastError: unknown = null
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (!response.ok && isRetryableStatus(response.status) && attempt < maxAttempts) {
        const retryAfter = Number(response.headers.get('retry-after'))
        const delayMs =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.min(retryAfter * 1000, 8000)
            : 800 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        continue
      }
      return response
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts) {
        const delayMs = 800 * Math.pow(2, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        continue
      }
      throw error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('上游 API 请求重试后仍失败')
}

async function callOpenAiCompatible(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
  const startedAt = Date.now()
  const baseUrl = normalizeBaseUrl(req.baseUrl)
  const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...req.customHeaders,
  }
  if (req.apiKey) {
    headers.Authorization = `Bearer ${req.apiKey}`
  }

  const body: Record<string, unknown> = {
    model: req.model,
    messages: [
      ...(req.systemPrompt ? [{ role: 'system', content: req.systemPrompt }] : []),
      { role: 'user', content: req.userPrompt },
    ],
    temperature: req.temperature ?? 0.3,
    max_tokens: req.maxTokens ?? 2048,
  }

  if (req.jsonMode) {
    body.response_format = { type: 'json_object' }
  }

  const response = await fetchWithRetry(
    endpoint,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    },
    req.timeoutMs ?? 90_000,
  )

  const payload = await safeParseJson(response)

  // 部分中转或模型不支持 response_format: json_object，自动降级重试一次
  if (!response.ok && req.jsonMode && response.status === 400) {
    const errorMsg = extractApiErrorMessage(payload, response.status).toLowerCase()
    if (errorMsg.includes('response_format') || errorMsg.includes('json_object')) {
      delete body.response_format
      const retryRes = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(req.timeoutMs ?? 90_000),
      })
      const retryPayload = await safeParseJson(retryRes)
      if (!retryRes.ok) {
        throw new Error(extractApiErrorMessage(retryPayload, retryRes.status))
      }
      return parseOpenAiResponse(retryPayload, Date.now() - startedAt)
    }
  }

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(payload, response.status))
  }

  return parseOpenAiResponse(payload, Date.now() - startedAt)
}

function stripThinkingTags(text: string): string {
  // 部分推理/中转模型会在 content 中夹带 <think>...</think> 思考过程
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

function parseOpenAiResponse(payload: unknown, durationMs: number): LlmCompletionResponse {
  if (!isRecord(payload) || !Array.isArray(payload.choices) || payload.choices.length === 0) {
    throw new Error('模型返回结构异常（缺少 choices）')
  }

  const firstChoice = payload.choices[0]
  let text = ''
  let finishReason = ''
  let hasReasoningOnly = false
  if (isRecord(firstChoice)) {
    if (typeof firstChoice.finish_reason === 'string') {
      finishReason = firstChoice.finish_reason
    }
    if (isRecord(firstChoice.message)) {
      const content = firstChoice.message.content
      if (typeof content === 'string') {
        text = content
      } else if (Array.isArray(content)) {
        text = content
          .map((part) => (isRecord(part) && typeof part.text === 'string' ? part.text : ''))
          .join('')
      }
      if (!text.trim() && typeof firstChoice.message.reasoning_content === 'string' && firstChoice.message.reasoning_content.trim()) {
        hasReasoningOnly = true
      }
    }
  }

  const cleanedText = stripThinkingTags(text)
  if (!cleanedText) {
    if (finishReason === 'length' || hasReasoningOnly) {
      throw new Error('模型输出触及 max_tokens 上限导致正文为空（思考/输出被截断），将自动拆小批次或请适当调大 Max Tokens')
    }
    throw new Error('模型返回内容为空')
  }

  const usageObj = isRecord(payload.usage) ? payload.usage : {}
  const promptTokens = toNumberOrNull(usageObj.prompt_tokens)
  const completionTokens = toNumberOrNull(usageObj.completion_tokens)
  const totalTokens =
    toNumberOrNull(usageObj.total_tokens) ??
    (promptTokens !== null && completionTokens !== null ? promptTokens + completionTokens : null)

  return {
    text: cleanedText,
    usage: { promptTokens, completionTokens, totalTokens },
    durationMs,
    rawModel: typeof payload.model === 'string' ? payload.model : undefined,
  }
}

async function callAnthropic(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
  const startedAt = Date.now()
  const baseUrl = normalizeBaseUrl(req.baseUrl || 'https://api.anthropic.com')
  const endpoint = baseUrl.endsWith('/v1/messages')
    ? baseUrl
    : baseUrl.endsWith('/v1')
      ? `${baseUrl}/messages`
      : `${baseUrl}/v1/messages`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': req.apiKey,
    'anthropic-version': '2023-06-01',
    ...req.customHeaders,
  }

  const response = await fetchWithRetry(
    endpoint,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: req.model,
        max_tokens: req.maxTokens ?? 2048,
        temperature: req.temperature ?? 0.3,
        ...(req.systemPrompt ? { system: req.systemPrompt } : {}),
        messages: [{ role: 'user', content: req.userPrompt }],
      }),
    },
    req.timeoutMs ?? 90_000,
  )

  const payload = await safeParseJson(response)
  if (!response.ok) {
    throw new Error(extractApiErrorMessage(payload, response.status))
  }

  if (!isRecord(payload) || !Array.isArray(payload.content)) {
    throw new Error('Anthropic 返回结构异常')
  }

  const text = payload.content
    .map((block) => (isRecord(block) && block.type === 'text' && typeof block.text === 'string' ? block.text : ''))
    .join('')
    .trim()

  if (!text) {
    throw new Error('Anthropic 返回内容为空')
  }

  const usageObj = isRecord(payload.usage) ? payload.usage : {}
  const promptTokens = toNumberOrNull(usageObj.input_tokens)
  const completionTokens = toNumberOrNull(usageObj.output_tokens)
  const totalTokens =
    promptTokens !== null && completionTokens !== null ? promptTokens + completionTokens : null

  return {
    text,
    usage: { promptTokens, completionTokens, totalTokens },
    durationMs: Date.now() - startedAt,
    rawModel: typeof payload.model === 'string' ? payload.model : undefined,
  }
}

async function callGemini(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
  const startedAt = Date.now()
  const baseUrl = normalizeBaseUrl(req.baseUrl || 'https://generativelanguage.googleapis.com')
  const modelPath = req.model.startsWith('models/') ? req.model : `models/${req.model}`
  const apiBase = baseUrl.endsWith('/v1beta') ? baseUrl : `${baseUrl}/v1beta`
  const endpoint = `${apiBase}/${modelPath}:generateContent?key=${encodeURIComponent(req.apiKey)}`

  const generationConfig: Record<string, unknown> = {
    temperature: req.temperature ?? 0.3,
    maxOutputTokens: req.maxTokens ?? 2048,
  }
  if (req.jsonMode) {
    generationConfig.responseMimeType = 'application/json'
  }

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: req.userPrompt }] }],
    generationConfig,
  }
  if (req.systemPrompt) {
    body.systemInstruction = { parts: [{ text: req.systemPrompt }] }
  }

  const response = await fetchWithRetry(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...req.customHeaders,
      },
      body: JSON.stringify(body),
    },
    req.timeoutMs ?? 90_000,
  )

  const payload = await safeParseJson(response)
  if (!response.ok) {
    throw new Error(extractApiErrorMessage(payload, response.status))
  }

  if (!isRecord(payload) || !Array.isArray(payload.candidates) || payload.candidates.length === 0) {
    throw new Error('Gemini 返回结构异常（缺少 candidates）')
  }

  const firstCandidate = payload.candidates[0]
  let text = ''
  if (isRecord(firstCandidate) && isRecord(firstCandidate.content) && Array.isArray(firstCandidate.content.parts)) {
    text = firstCandidate.content.parts
      .map((part) => (isRecord(part) && typeof part.text === 'string' ? part.text : ''))
      .join('')
      .trim()
  }

  if (!text) {
    throw new Error('Gemini 返回内容为空')
  }

  const usageObj = isRecord(payload.usageMetadata) ? payload.usageMetadata : {}
  const promptTokens = toNumberOrNull(usageObj.promptTokenCount)
  const completionTokens = toNumberOrNull(usageObj.candidatesTokenCount)
  const totalTokens =
    toNumberOrNull(usageObj.totalTokenCount) ??
    (promptTokens !== null && completionTokens !== null ? promptTokens + completionTokens : null)

  return {
    text,
    usage: { promptTokens, completionTokens, totalTokens },
    durationMs: Date.now() - startedAt,
    rawModel: req.model,
  }
}

export async function callLlm(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
  switch (req.protocol) {
    case 'openai-compatible':
      return callOpenAiCompatible(req)
    case 'anthropic':
      return callAnthropic(req)
    case 'gemini':
      return callGemini(req)
  }
}

export async function fetchProviderModels(params: {
  protocol: AiProtocol
  baseUrl: string
  apiKey: string
  customHeaders?: Record<string, string>
}): Promise<string[]> {
  const baseUrl = normalizeBaseUrl(params.baseUrl)

  if (params.protocol === 'openai-compatible') {
    const endpoint = baseUrl.endsWith('/models')
      ? baseUrl
      : `${baseUrl.replace(/\/chat\/completions$/, '')}/models`
    const headers: Record<string, string> = { ...params.customHeaders }
    if (params.apiKey) {
      headers.Authorization = `Bearer ${params.apiKey}`
    }

    const res = await fetch(endpoint, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(15_000),
    })
    const payload = await safeParseJson(res)
    if (!res.ok) {
      throw new Error(extractApiErrorMessage(payload, res.status))
    }

    if (isRecord(payload) && Array.isArray(payload.data)) {
      return payload.data
        .map((item) => (isRecord(item) && typeof item.id === 'string' ? item.id : null))
        .filter((id): id is string => Boolean(id))
        .sort()
    }
    return []
  }

  if (params.protocol === 'gemini') {
    const apiBase = baseUrl.endsWith('/v1beta') ? baseUrl : `${baseUrl}/v1beta`
    const res = await fetch(`${apiBase}/models?key=${encodeURIComponent(params.apiKey)}`, {
      method: 'GET',
      headers: { ...params.customHeaders },
      signal: AbortSignal.timeout(15_000),
    })
    const payload = await safeParseJson(res)
    if (!res.ok) {
      throw new Error(extractApiErrorMessage(payload, res.status))
    }
    if (isRecord(payload) && Array.isArray(payload.models)) {
      return payload.models
        .filter((item) => {
          if (!isRecord(item)) return false
          const methods = item.supportedGenerationMethods
          return !Array.isArray(methods) || methods.includes('generateContent')
        })
        .map((item) => {
          const name = isRecord(item) && typeof item.name === 'string' ? item.name : ''
          return name.replace(/^models\//, '')
        })
        .filter(Boolean)
        .sort()
    }
    return []
  }

  // Anthropic: 尝试 /v1/models，如果不支持则回退到内置推荐列表
  try {
    const endpoint = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'x-api-key': params.apiKey,
        'anthropic-version': '2023-06-01',
        ...params.customHeaders,
      },
      signal: AbortSignal.timeout(15_000),
    })
    if (res.ok) {
      const payload = await safeParseJson(res)
      if (isRecord(payload) && Array.isArray(payload.data)) {
        const list = payload.data
          .map((item) => (isRecord(item) && typeof item.id === 'string' ? item.id : null))
          .filter((id): id is string => Boolean(id))
        if (list.length > 0) return list.sort()
      }
    }
  } catch {
    // fallback below
  }

  return ['claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest', 'claude-sonnet-4-20250514', 'claude-opus-4-20250514']
}

export function extractJsonFromLlmText(rawText: string): unknown {
  const trimmed = stripThinkingTags(rawText)

  const tryParse = (candidate: string): { ok: true; value: unknown } | { ok: false } => {
    try {
      return { ok: true, value: JSON.parse(candidate) }
    } catch {
      // 尝试修复尾随逗号等常见小瑕疵
      try {
        const withoutTrailingCommas = candidate.replace(/,\s*([}\]])/g, '$1')
        return { ok: true, value: JSON.parse(withoutTrailingCommas) }
      } catch {
        return { ok: false }
      }
    }
  }

  const direct = tryParse(trimmed)
  if (direct.ok) return direct.value

  // 尝试提取所有 ```json ... ``` 或 ``` ... ``` 代码块（从后往前，优先取最终输出）
  const fenceMatches = Array.from(trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi))
  for (let i = fenceMatches.length - 1; i >= 0; i -= 1) {
    const block = fenceMatches[i]?.[1]?.trim()
    if (!block) continue
    const parsed = tryParse(block)
    if (parsed.ok) return parsed.value
  }

  // 尝试定位最外层 { ... }
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const parsed = tryParse(trimmed.slice(firstBrace, lastBrace + 1))
    if (parsed.ok) return parsed.value
  }

  throw new Error('无法将模型返回内容解析为合法 JSON，请重试或更换更稳定的模型')
}
