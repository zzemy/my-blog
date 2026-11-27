import { z } from 'zod'
import type { AiTaskKey, RewriteAction } from './types'

export const DEFAULT_SYSTEM_PROMPTS: Record<AiTaskKey, string> = {
  summary: `你是一位资深技术博客编辑，擅长提炼文章核心价值，生成清晰克制的导读摘要。
请严格返回合法 JSON 对象，字段如下：
{
  "tldr": "一句话总结文章核心结论（50~100字，不夸大、不空洞）",
  "key_points": ["核心要点1", "核心要点2", "核心要点3"],
  "target_audience": "适合哪些读者阅读（20~45字）",
  "faqs": [
    { "question": "读者最可能关心的问题", "answer": "简明准确的回答" }
  ]
}
要求：
1. key_points 返回 3~5 条，每条简明扼要（15~45字）。
2. faqs 返回 2~3 条高价值问答（如果文章很短可返回空数组 []）。
3. 语言与原文保持一致，仅输出 JSON，不要附加任何解释或 Markdown 围栏。`,

  metadata: `你是一位擅长技术内容运营和 SEO 优化的博客编辑。
请根据文章标题和正文，严格返回合法 JSON 对象：
{
  "description": "文章列表页展示简介（60~130字，吸引人且准确概括）",
  "seo_title": "适合搜索引擎的标题（不超过 60 字符）",
  "seo_description": "适合 meta description 的描述（80~150 字符）",
  "tags": ["标签1", "标签2", "标签3"],
  "slug": "concise-english-url-slug",
  "alternative_titles": ["备选标题1", "备选标题2", "备选标题3"]
}
要求：
1. tags 返回 2~5 个精准标签；优先复用传入的「已有站点标签列表」中的名称，避免同义词重复。
2. slug 只能包含小写字母、数字和连字符（a-z, 0-9, -），3~6 个英文词。
3. alternative_titles 返回 3 个不同角度的备选标题。
4. 仅输出 JSON，不要附加解释。`,

  translate: `You are an expert technical blog translator.
Translate naturally, accurately, and idiomatically into the target language while strictly preserving technical terms, code identifiers, API names, URLs, and formatting structure.
Always output ONLY valid JSON matching the requested schema.`,

  rewrite: `你是一位专业的技术写作编辑。根据用户的改写指令优化指定段落。
要求：
1. 忠实保留原意与技术细节，不编造事实。
2. 保留原文里的行内代码、专有名词、链接与数学公式写法。
3. 仅直接输出改写后的文本内容本身，不要添加“好的”、“修改如下”等寒暄语。`,

  outline: `你是一位资深技术专栏作者，擅长规划逻辑清晰、循序渐进的文章大纲。
请严格返回合法 JSON 对象：
{
  "title_ideas": ["标题建议1", "标题建议2", "标题建议3", "标题建议4"],
  "markdown_outline": "## 引言\\n- 要点...\\n\\n## 核心原理\\n..."
}
要求：
1. markdown_outline 使用规范的 Markdown 二级/三级标题与要点列表，可直接导入编辑器开始写作。
2. 仅输出 JSON，不要附加多余解释。`,
}

export const REWRITE_ACTION_PROMPTS: Record<RewriteAction, { label: string; instruction: string }> = {
  polish: {
    label: '润色表达',
    instruction: '润色这段文字，使其更流畅、专业、有节奏感，保持技术博客克制清晰的语调。',
  },
  concise: {
    label: '精简压缩',
    instruction: '去除冗余和啰嗦表达，保留全部核心技术信息，使文字更紧凑有力。',
  },
  expand: {
    label: '扩写细节',
    instruction: '在保持原意的基础上适当补充原理解释、背景上下文或举例说明，使内容更丰满易懂。',
  },
  'fix-grammar': {
    label: '纠错与排版',
    instruction: '修正错别字、语法错误、标点问题以及中英文混排空格规范，尽量少改动作者原有表达风格。',
  },
  'tech-review': {
    label: '技术校对',
    instruction: '检查技术表述是否严谨准确、逻辑是否连贯；修正不严谨之处，使专业术语统一规范。',
  },
  'translate-en': {
    label: '翻译为英文',
    instruction: '将这段文字自然准确地翻译为地道的技术英文（English），保留专有名词和行内代码。',
  },
  'translate-zh': {
    label: '翻译为中文',
    instruction: '将这段文字自然准确地翻译为地道的技术中文，保留专有名词和行内代码。',
  },
}

export const summaryOutputSchema = z.object({
  tldr: z.string().trim().min(1),
  key_points: z.array(z.string().trim().min(1)).default([]),
  target_audience: z.string().trim().optional(),
  faqs: z
    .array(
      z.object({
        question: z.string().trim().min(1),
        answer: z.string().trim().min(1),
      }),
    )
    .optional(),
})

export const metadataOutputSchema = z.object({
  description: z.string().trim().default(''),
  seo_title: z.string().trim().default(''),
  seo_description: z.string().trim().default(''),
  tags: z.array(z.string().trim().min(1)).default([]),
  slug: z
    .string()
    .trim()
    .default('')
    .transform((val) =>
      val
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
    ),
  alternative_titles: z.array(z.string().trim().min(1)).default([]),
})

export const outlineOutputSchema = z.object({
  title_ideas: z.array(z.string().trim().min(1)).default([]),
  markdown_outline: z.string().trim().min(1),
})

export const translateHeaderOutputSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional().default(''),
  ai_summary: z
    .object({
      tldr: z.string().trim().min(1),
      key_points: z.array(z.string().trim().min(1)).default([]),
      target_audience: z.string().trim().optional(),
      faqs: z
        .array(
          z.object({
            question: z.string().trim().min(1),
            answer: z.string().trim().min(1),
          }),
        )
        .optional(),
    })
    .nullable()
    .optional(),
})
