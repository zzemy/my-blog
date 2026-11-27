import { NextRequest, NextResponse } from 'next/server'
import type { JSONContent } from '@tiptap/react'
import { z } from 'zod'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import { callLlm, extractJsonFromLlmText } from '@/lib/ai/providers'
import { recordAiLog, resolveExecutionContext } from '@/lib/ai/runner'
import { computePostSourceHash } from '@/lib/ai/tiptap-extractor'
import { translateTipTapContent } from '@/lib/ai/tiptap-translator'
import { translateHeaderOutputSchema } from '@/lib/ai/prompts'
import { getLocaleLabel, parseAiSummaryFromMetadata } from '@/lib/ai/types'
import { revalidatePostMutation } from '@/lib/revalidation/posts'

const translatePostSchema = z.object({
  postId: z.string().uuid('无效的文章 ID'),
  locale: z
    .string()
    .trim()
    .min(2, '请输入合法语言代码，如 en / ja')
    .max(20)
    .regex(/^[a-zA-Z0-9-]+$/, '语言代码只能包含字母、数字和连字符'),
  providerId: z.string().uuid().nullable().optional(),
  model: z.string().trim().max(120).nullable().optional(),
  publishImmediately: z.boolean().default(false),
})

interface PostForTranslate {
  id: string
  public_id: string | null
  title: string
  slug: string
  description: string | null
  content: JSONContent
  tags: string[] | null
  metadata: Record<string, unknown> | null
}

export async function GET(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  if (!(await validateAdminRequest(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    if (!postId) {
      return NextResponse.json({ error: '缺少 postId 参数' }, { status: 400 })
    }

    const client = getAdminClient(token || undefined)

    const [{ data: postData }, { data: translations, error }] = await Promise.all([
      client.from('posts').select('title, content').eq('id', postId).maybeSingle(),
      client
        .from('post_translations')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true }),
    ])

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ translations: [], sourceHash: null, code: 'MIGRATION_REQUIRED' })
      }
      throw error
    }

    const postRecord = postData as { title: string; content: unknown } | null
    const sourceHash = postRecord ? computePostSourceHash(postRecord.title, postRecord.content) : null

    return NextResponse.json({
      translations: translations ?? [],
      sourceHash,
    })
  } catch (error) {
    console.error('GET /api/admin/ai/translations error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '加载译文失败' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  if (!(await validateAdminRequest(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
  let resolvedProviderId: string | null = null
  let resolvedProviderName = 'unknown'
  let resolvedModel = 'unknown'
  let targetPostId: string | null = null

  try {
    const rawBody: unknown = await request.json()
    const parsed = translatePostSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '请求参数无效', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const body = parsed.data
    targetPostId = body.postId
    const client = getAdminClient(token || undefined)

    const { data: postData, error: postError } = await client
      .from('posts')
      .select('id, public_id, title, slug, description, content, tags, metadata')
      .eq('id', body.postId)
      .single()

    if (postError || !postData) {
      return NextResponse.json({ error: '文章不存在，请先保存文章再进行翻译' }, { status: 404 })
    }

    const post = postData as PostForTranslate
    const localeLabel = getLocaleLabel(body.locale)
    const sourceHash = computePostSourceHash(post.title, post.content)
    const existingSummary = parseAiSummaryFromMetadata(post.metadata)

    const context = await resolveExecutionContext(client, {
      taskKey: 'translate',
      providerId: body.providerId,
      model: body.model,
    })
    resolvedProviderId = context.provider.id
    resolvedProviderName = context.provider.name
    resolvedModel = context.model

    let promptTokensSum = 0
    let completionTokensSum = 0
    let hasUsage = false

    const invokeLlm = async (systemPrompt: string, userPrompt: string) => {
      const res = await callLlm({
        protocol: context.provider.protocol,
        baseUrl: context.provider.baseUrl,
        apiKey: context.provider.apiKey,
        model: context.model,
        systemPrompt,
        userPrompt,
        temperature: context.temperature,
        maxTokens: Math.max(context.maxTokens, 3000),
        jsonMode: true,
        customHeaders: context.provider.customHeaders,
        timeoutMs: 120_000,
      })

      if (res.usage.promptTokens !== null) {
        promptTokensSum += res.usage.promptTokens
        hasUsage = true
      }
      if (res.usage.completionTokens !== null) {
        completionTokensSum += res.usage.completionTokens
        hasUsage = true
      }
      return res.text
    }

    // Step 1: 翻译标题、简介与 AI 导读摘要
    const glossaryHint =
      context.glossary.length > 0
        ? `\nTerminology Glossary:\n${context.glossary.map((g) => `- "${g.source}" => "${g.target}"`).join('\n')}`
        : ''

    const headerPayload = {
      title: post.title,
      description: post.description || '',
      ai_summary: existingSummary
        ? {
            tldr: existingSummary.tldr,
            key_points: existingSummary.key_points,
            target_audience: existingSummary.target_audience,
            faqs: existingSummary.faqs,
          }
        : null,
    }

    const headerRaw = await invokeLlm(
      `You are an expert technical blog translator. Translate the provided JSON fields into ${localeLabel}.
Preserve all technical terms, library names, and JSON keys. Return ONLY valid JSON matching the exact input shape.${glossaryHint}`,
      `Target language: ${localeLabel}\n\nInput JSON:\n${JSON.stringify(headerPayload, null, 2)}`,
    )
    const translatedHeader = translateHeaderOutputSchema.parse(extractJsonFromLlmText(headerRaw))

    // Step 2: AST 节点级无损翻译 TipTap 正文
    const bodyResult = await translateTipTapContent({
      content: post.content,
      articleTitle: post.title,
      targetLocaleLabel: localeLabel,
      glossary: context.glossary,
      invokeBatch: invokeLlm,
    })

    const translatedSummary = translatedHeader.ai_summary
      ? {
          ...translatedHeader.ai_summary,
          source_hash: sourceHash,
          model: context.model,
          generated_at: new Date().toISOString(),
          visible: existingSummary?.visible ?? true,
        }
      : null

    const { data: savedTranslation, error: saveError } = await client
      .from('post_translations')
      .upsert(
        {
          post_id: post.id,
          locale: body.locale,
          title: translatedHeader.title,
          description: translatedHeader.description || null,
          ai_summary: translatedSummary,
          content: bodyResult.translatedContent,
          source_hash: sourceHash,
          published: body.publishImmediately,
          model_used: context.model,
        } as never,
        { onConflict: 'post_id,locale' },
      )
      .select()
      .single()

    if (saveError) throw saveError

    const durationMs = Date.now() - startedAt
    await recordAiLog(client, {
      post_id: post.id,
      task_key: `translate:${body.locale}`,
      provider_id: context.provider.id,
      provider_name: context.provider.name,
      model: context.model,
      prompt_tokens: hasUsage ? promptTokensSum : null,
      completion_tokens: hasUsage ? completionTokensSum : null,
      total_tokens: hasUsage ? promptTokensSum + completionTokensSum : null,
      duration_ms: durationMs,
      status: 'success',
    })

    if (body.publishImmediately) {
      revalidatePostMutation({
        after: {
          publicId: post.public_id,
          slug: post.slug,
          tags: post.tags ?? [],
        },
      })
    }

    return NextResponse.json({
      translation: savedTranslation,
      stats: {
        totalSegments: bodyResult.totalSegments,
        translatedSegments: bodyResult.translatedSegments,
        durationMs,
        model: context.model,
      },
    })
  } catch (error) {
    console.error('POST /api/admin/ai/translations error:', error)
    try {
      const client = getAdminClient(token || undefined)
      await recordAiLog(client, {
        post_id: targetPostId,
        task_key: 'translate',
        provider_id: resolvedProviderId,
        provider_name: resolvedProviderName,
        model: resolvedModel,
        duration_ms: Date.now() - startedAt,
        status: 'error',
        error_message: (error instanceof Error ? error.message : String(error)).slice(0, 500),
      })
    } catch {
      // ignore logging error
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '翻译失败' },
      { status: 500 },
    )
  }
}
