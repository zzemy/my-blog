import type { JSONContent } from '@tiptap/react'

export type AiProtocol = 'openai-compatible' | 'anthropic' | 'gemini'

export type AiKeyMode = 'encrypted' | 'env'

export type AiTaskKey = 'summary' | 'metadata' | 'translate' | 'rewrite' | 'outline'

export type RewriteAction =
  | 'polish'
  | 'concise'
  | 'expand'
  | 'fix-grammar'
  | 'tech-review'
  | 'translate-en'
  | 'translate-zh'

export interface AiGlossaryEntry {
  source: string
  target: string
  note?: string
}

export interface AiProviderPublic {
  id: string
  name: string
  protocol: AiProtocol
  base_url: string
  key_mode: AiKeyMode
  has_api_key: boolean
  api_key_mask: string | null
  env_var_name: string | null
  env_var_configured?: boolean
  models: string[]
  default_model: string
  custom_headers: Record<string, string>
  enabled: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface AiTaskConfig {
  task_key: AiTaskKey
  provider_id: string | null
  model: string | null
  temperature: number
  max_tokens: number
  system_prompt: string | null
  glossary: AiGlossaryEntry[]
  updated_at?: string
}

export interface AiSummaryData {
  tldr: string
  key_points: string[]
  target_audience?: string
  faqs?: Array<{ question: string; answer: string }>
  source_hash?: string
  model?: string
  generated_at?: string
  visible?: boolean
}

export interface AiMetadataSuggestion {
  description: string
  seo_title: string
  seo_description: string
  tags: string[]
  slug: string
  alternative_titles: string[]
}

export interface AiOutlineSuggestion {
  title_ideas: string[]
  markdown_outline: string
}

export interface PostTranslationPublic {
  id: string
  post_id: string
  locale: string
  title: string
  description: string | null
  ai_summary: AiSummaryData | null
  content: JSONContent
  source_hash: string
  published: boolean
  model_used: string | null
  created_at: string
  updated_at: string
}

export interface AiGenerationLog {
  id: string
  post_id: string | null
  task_key: string
  provider_id: string | null
  provider_name: string
  model: string
  prompt_tokens: number | null
  completion_tokens: number | null
  total_tokens: number | null
  duration_ms: number
  status: 'success' | 'error'
  error_message: string | null
  created_at: string
}

export interface SupportedLocaleOption {
  code: string
  label: string
  nativeLabel: string
}

export const SUPPORTED_LOCALES: SupportedLocaleOption[] = [
  { code: 'en', label: '英语', nativeLabel: 'English' },
  { code: 'ja', label: '日语', nativeLabel: '日本語' },
  { code: 'ko', label: '韩语', nativeLabel: '한국어' },
  { code: 'zh-TW', label: '繁体中文', nativeLabel: '繁體中文' },
  { code: 'fr', label: '法语', nativeLabel: 'Français' },
  { code: 'de', label: '德语', nativeLabel: 'Deutsch' },
  { code: 'es', label: '西班牙语', nativeLabel: 'Español' },
]

export function getLocaleLabel(code: string): string {
  const found = SUPPORTED_LOCALES.find((item) => item.code.toLowerCase() === code.toLowerCase())
  return found ? `${found.nativeLabel} (${found.code})` : code
}

export function getLocaleNativeLabel(code: string): string {
  if (code === 'original' || code === 'zh-CN' || code === 'zh') return '中文'
  const found = SUPPORTED_LOCALES.find((item) => item.code.toLowerCase() === code.toLowerCase())
  return found ? found.nativeLabel : code
}

export const AI_TASK_LABELS: Record<AiTaskKey, { title: string; description: string }> = {
  summary: {
    title: '文章摘要与导读',
    description: '生成一句话核心总结、关键要点、目标读者与可选核心问答',
  },
  metadata: {
    title: 'SEO 与标签元数据',
    description: '生成文章简介、SEO 标题/描述、推荐标签、英文 Slug 与备选标题',
  },
  translate: {
    title: '多语言无损翻译',
    description: '在保护代码块、数学公式和链接的前提下，按节点树翻译整篇文章',
  },
  rewrite: {
    title: '行内润色与改写',
    description: '针对选中段落进行润色、精简、扩写、纠错、技术校对或划词翻译',
  },
  outline: {
    title: '大纲与标题灵感',
    description: '基于主题生成结构化 Markdown 大纲与多风格标题建议',
  },
}

export const PROVIDER_PRESETS: Array<{
  id: string
  name: string
  protocol: AiProtocol
  base_url: string
  default_model: string
  models: string[]
}> = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    protocol: 'openai-compatible',
    base_url: 'https://api.deepseek.com/v1',
    default_model: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    protocol: 'openai-compatible',
    base_url: 'https://api.openai.com/v1',
    default_model: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    protocol: 'anthropic',
    base_url: 'https://api.anthropic.com',
    default_model: 'claude-3-5-sonnet-latest',
    models: ['claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest', 'claude-sonnet-4-20250514'],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    protocol: 'gemini',
    base_url: 'https://generativelanguage.googleapis.com',
    default_model: 'gemini-2.5-flash',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    protocol: 'openai-compatible',
    base_url: 'https://openrouter.ai/api/v1',
    default_model: 'deepseek/deepseek-chat-v3-0324',
    models: ['deepseek/deepseek-chat-v3-0324', 'google/gemini-2.5-flash', 'anthropic/claude-sonnet-4'],
  },
  {
    id: 'siliconflow',
    name: '硅基流动 SiliconFlow',
    protocol: 'openai-compatible',
    base_url: 'https://api.siliconflow.cn/v1',
    default_model: 'deepseek-ai/DeepSeek-V3',
    models: ['deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-72B-Instruct'],
  },
  {
    id: 'qwen',
    name: '通义千问 DashScope',
    protocol: 'openai-compatible',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    default_model: 'qwen-plus',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
  },
  {
    id: 'custom',
    name: '自定义中转 / 本地 Ollama',
    protocol: 'openai-compatible',
    base_url: 'https://your-relay.example.com/v1',
    default_model: '',
    models: [],
  },
]

export function parseAiSummaryFromMetadata(metadata: unknown): AiSummaryData | null {
  if (!metadata || typeof metadata !== 'object') return null
  const record = metadata as Record<string, unknown>
  const raw = record.ai_summary
  if (!raw || typeof raw !== 'object') return null

  const candidate = raw as Record<string, unknown>
  const tldr = typeof candidate.tldr === 'string' ? candidate.tldr.trim() : ''
  const keyPoints = Array.isArray(candidate.key_points)
    ? candidate.key_points.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []

  if (!tldr && keyPoints.length === 0) return null

  const faqs = Array.isArray(candidate.faqs)
    ? candidate.faqs
        .filter((item): item is { question: string; answer: string } => {
          if (!item || typeof item !== 'object') return false
          const entry = item as Record<string, unknown>
          return (
            typeof entry.question === 'string' &&
            entry.question.trim().length > 0 &&
            typeof entry.answer === 'string' &&
            entry.answer.trim().length > 0
          )
        })
    : undefined

  return {
    tldr,
    key_points: keyPoints,
    target_audience: typeof candidate.target_audience === 'string' ? candidate.target_audience : undefined,
    faqs: faqs && faqs.length > 0 ? faqs : undefined,
    source_hash: typeof candidate.source_hash === 'string' ? candidate.source_hash : undefined,
    model: typeof candidate.model === 'string' ? candidate.model : undefined,
    generated_at: typeof candidate.generated_at === 'string' ? candidate.generated_at : undefined,
    visible: typeof candidate.visible === 'boolean' ? candidate.visible : true,
  }
}
