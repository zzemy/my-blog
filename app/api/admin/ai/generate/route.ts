import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import { executeAiJsonTask, executeAiTextTask } from '@/lib/ai/runner'
import { computePostSourceHash, extractTextFromTipTap } from '@/lib/ai/tiptap-extractor'
import {
  metadataOutputSchema,
  outlineOutputSchema,
  REWRITE_ACTION_PROMPTS,
  summaryOutputSchema,
} from '@/lib/ai/prompts'
import type { AiSummaryData, RewriteAction } from '@/lib/ai/types'
import { revalidatePostMutation } from '@/lib/revalidation/posts'

export const maxDuration = 300

const generateRequestSchema = z.object({
  task: z.enum(['summary', 'metadata', 'rewrite', 'outline']),
  postId: z.string().uuid().optional(),
  providerId: z.string().uuid().nullable().optional(),
  model: z.string().trim().max(120).nullable().optional(),
  title: z.string().optional(),
  content: z.unknown().optional(),
  // rewrite 专用
  selectedText: z.string().optional(),
  rewriteAction: z
    .enum(['polish', 'concise', 'expand', 'fix-grammar', 'tech-review', 'translate-en', 'translate-zh'])
    .optional(),
  customInstruction: z.string().max(500).optional(),
  // outline 专用
  topic: z.string().optional(),
  // 批量或直接写入文章
  saveToPost: z.boolean().optional(),
})

interface PostRowBrief {
  id: string
  public_id: string | null
  title: string
  slug: string
  description: string | null
  content: unknown
  tags: string[] | null
  metadata: Record<string, unknown> | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export async function POST(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  if (!(await validateAdminRequest(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rawBody: unknown = await request.json()
    const parsed = generateRequestSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '请求参数无效', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const body = parsed.data
    const client = getAdminClient(token || undefined)

    // 如果提供了 postId 且缺少 title/content，自动从数据库加载
    let postRow: PostRowBrief | null = null
    if (body.postId) {
      const { data } = await client
        .from('posts')
        .select('id, public_id, title, slug, description, content, tags, metadata')
        .eq('id', body.postId)
        .maybeSingle()
      if (data) {
        postRow = data as PostRowBrief
      }
    }

    const resolvedTitle = (body.title ?? postRow?.title ?? '').trim()
    const resolvedContent = body.content !== undefined ? body.content : postRow?.content

    if (body.task === 'summary') {
      const articleText = extractTextFromTipTap(resolvedContent)
      if (!articleText && !resolvedTitle) {
        return NextResponse.json({ error: '文章内容为空，无法生成摘要' }, { status: 400 })
      }

      const sourceHash = computePostSourceHash(resolvedTitle, resolvedContent)
      const userPrompt = [
        `文章标题：${resolvedTitle || '未命名'}`,
        `文章正文：\n${articleText}`,
      ].join('\n\n')

      const { data, response, context } = await executeAiJsonTask(client, {
        taskKey: 'summary',
        postId: body.postId ?? null,
        providerId: body.providerId,
        model: body.model,
        userPrompt,
        parse: (raw) => summaryOutputSchema.parse(raw),
      })

      const summary: AiSummaryData = {
        tldr: data.tldr,
        key_points: data.key_points,
        target_audience: data.target_audience,
        faqs: data.faqs && data.faqs.length > 0 ? data.faqs : undefined,
        source_hash: sourceHash,
        model: context.model,
        generated_at: new Date().toISOString(),
        visible: true,
      }

      if (body.saveToPost && postRow) {
        const currentMeta = isRecord(postRow.metadata) ? postRow.metadata : {}
        const nextMeta = { ...currentMeta, ai_summary: summary }
        await client
          .from('posts')
          .update({ metadata: nextMeta } as never)
          .eq('id', postRow.id)

        revalidatePostMutation({
          after: {
            publicId: postRow.public_id,
            slug: postRow.slug,
            tags: postRow.tags ?? [],
          },
        })
      }

      return NextResponse.json({
        summary,
        model: context.model,
        provider: context.provider.name,
        usage: response.usage,
        duration_ms: response.durationMs,
      })
    }

    if (body.task === 'metadata') {
      const articleText = extractTextFromTipTap(resolvedContent, 10_000)
      if (!articleText && !resolvedTitle) {
        return NextResponse.json({ error: '文章内容为空，无法生成元数据' }, { status: 400 })
      }

      const { data: tagRows } = await client.from('tags').select('name').limit(100)
      const existingTags = ((tagRows as Array<{ name: string }> | null) ?? []).map((t) => t.name)

      const userPrompt = [
        `文章标题：${resolvedTitle || '未命名'}`,
        existingTags.length > 0 ? `已有站点标签列表（优先从中复用）：${existingTags.join('、')}` : '',
        `文章正文：\n${articleText}`,
      ]
        .filter(Boolean)
        .join('\n\n')

      const { data, response, context } = await executeAiJsonTask(client, {
        taskKey: 'metadata',
        postId: body.postId ?? null,
        providerId: body.providerId,
        model: body.model,
        userPrompt,
        parse: (raw) => metadataOutputSchema.parse(raw),
      })

      if (body.saveToPost && postRow) {
        const currentMeta = isRecord(postRow.metadata) ? postRow.metadata : {}
        const nextMeta = {
          ...currentMeta,
          seo_title: data.seo_title || currentMeta.seo_title,
          seo_description: data.seo_description || currentMeta.seo_description,
        }
        await client
          .from('posts')
          .update({
            description: data.description || postRow.description,
            tags: data.tags.length > 0 ? data.tags : postRow.tags ?? [],
            metadata: nextMeta,
          } as never)
          .eq('id', postRow.id)

        revalidatePostMutation({
          after: {
            publicId: postRow.public_id,
            slug: postRow.slug,
            tags: data.tags.length > 0 ? data.tags : postRow.tags ?? [],
          },
        })
      }

      return NextResponse.json({
        metadata: data,
        model: context.model,
        provider: context.provider.name,
        usage: response.usage,
        duration_ms: response.durationMs,
      })
    }

    if (body.task === 'rewrite') {
      const text = (body.selectedText ?? '').trim()
      if (!text) {
        return NextResponse.json({ error: '请先在编辑器中选中需要改写的文本' }, { status: 400 })
      }

      const action: RewriteAction = body.rewriteAction ?? 'polish'
      const actionMeta = REWRITE_ACTION_PROMPTS[action]
      const instruction = body.customInstruction?.trim() || actionMeta.instruction

      const userPrompt = [
        resolvedTitle ? `文章标题上下文：${resolvedTitle}` : '',
        `改写任务：${instruction}`,
        `待处理原文：\n${text}`,
      ]
        .filter(Boolean)
        .join('\n\n')

      const { response, context } = await executeAiTextTask(client, {
        taskKey: 'rewrite',
        postId: body.postId ?? null,
        providerId: body.providerId,
        model: body.model,
        userPrompt,
      })

      return NextResponse.json({
        result: response.text,
        model: context.model,
        provider: context.provider.name,
        usage: response.usage,
        duration_ms: response.durationMs,
      })
    }

    // outline
    const topic = (body.topic ?? resolvedTitle).trim()
    if (!topic) {
      return NextResponse.json({ error: '请填写主题或文章标题以生成大纲' }, { status: 400 })
    }

    const existingText = extractTextFromTipTap(resolvedContent, 3000)
    const userPrompt = [
      `文章主题 / 初步想法：${topic}`,
      existingText ? `当前已有草稿参考：\n${existingText}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')

    const { data, response, context } = await executeAiJsonTask(client, {
      taskKey: 'outline',
      postId: body.postId ?? null,
      providerId: body.providerId,
      model: body.model,
      userPrompt,
      parse: (raw) => outlineOutputSchema.parse(raw),
    })

    return NextResponse.json({
      outline: data,
      model: context.model,
      provider: context.provider.name,
      usage: response.usage,
      duration_ms: response.durationMs,
    })
  } catch (error) {
    console.error('POST /api/admin/ai/generate error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI 生成失败' },
      { status: 500 },
    )
  }
}
