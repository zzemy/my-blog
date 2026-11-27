import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import { fetchProviderModels } from '@/lib/ai/providers'
import { resolveProviderApiKey, toPublicProvider, type DbProviderRow } from '@/lib/ai/runner'

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
    const body = (await request.json().catch(() => ({}))) as { save?: boolean }
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
    const apiKey = resolveProviderApiKey(provider)
    const models = await fetchProviderModels({
      protocol: provider.protocol,
      baseUrl: provider.base_url,
      apiKey,
      customHeaders:
        provider.custom_headers && typeof provider.custom_headers === 'object'
          ? provider.custom_headers
          : {},
    })

    if (body.save && models.length > 0) {
      const merged = Array.from(new Set([...models, ...(provider.default_model ? [provider.default_model] : [])]))
      const { data: updated } = await client
        .from('ai_providers')
        .update({
          models: merged,
          default_model: provider.default_model || merged[0] || '',
        } as never)
        .eq('id', id)
        .select()
        .single()

      return NextResponse.json({
        models: merged,
        provider: updated ? toPublicProvider(updated as DbProviderRow) : undefined,
      })
    }

    return NextResponse.json({ models })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '拉取模型列表失败' },
      { status: 400 },
    )
  }
}
