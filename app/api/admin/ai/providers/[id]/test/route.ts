import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import { callLlm } from '@/lib/ai/providers'
import { resolveProviderApiKey, type DbProviderRow } from '@/lib/ai/runner'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = getAuthTokenFromRequest(request)
  if (!(await validateAdminRequest(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as { model?: string }
    const client = getAdminClient(token || undefined)

    const { data, error } = await client
      .from('ai_providers')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Provider 不存在' }, { status: 404 })
    }

    const provider = data as DbProviderRow
    const model =
      body.model?.trim() ||
      provider.default_model?.trim() ||
      (Array.isArray(provider.models) ? provider.models[0] : '')

    if (!model) {
      return NextResponse.json({ error: '请先填写至少一个测试模型 ID' }, { status: 400 })
    }

    const apiKey = resolveProviderApiKey(provider)
    const result = await callLlm({
      protocol: provider.protocol,
      baseUrl: provider.base_url,
      apiKey,
      model,
      systemPrompt: 'You are a connectivity test assistant. Reply briefly.',
      userPrompt: 'Reply with "OK" only.',
      temperature: 0,
      maxTokens: 32,
      customHeaders:
        provider.custom_headers && typeof provider.custom_headers === 'object'
          ? provider.custom_headers
          : {},
      timeoutMs: 25_000,
    })

    return NextResponse.json({
      ok: true,
      model,
      duration_ms: result.durationMs,
      reply: result.text.slice(0, 120),
      usage: result.usage,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : '连接测试失败',
      },
      { status: 400 },
    )
  }
}
