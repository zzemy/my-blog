import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import { encryptApiKey, maskApiKey } from '@/lib/ai/crypto'
import { toPublicProvider, type DbProviderRow } from '@/lib/ai/runner'

const updateProviderSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  protocol: z.enum(['openai-compatible', 'anthropic', 'gemini']).optional(),
  base_url: z.string().trim().url('请输入合法的 Base URL').optional(),
  key_mode: z.enum(['encrypted', 'env']).optional(),
  api_key: z.string().trim().optional(),
  clear_api_key: z.boolean().optional(),
  env_var_name: z.string().trim().max(120).nullable().optional(),
  models: z.array(z.string().trim().min(1)).optional(),
  default_model: z.string().trim().optional(),
  custom_headers: z.record(z.string(), z.string()).optional(),
  enabled: z.boolean().optional(),
  is_default: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = getAuthTokenFromRequest(request)
  if (!(await validateAdminRequest(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const rawBody: unknown = await request.json()
    const parsed = updateProviderSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '请求参数无效', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const body = parsed.data
    const client = getAdminClient(token || undefined)

    if (body.is_default === true) {
      await client.from('ai_providers').update({ is_default: false } as never).neq('id', id)
    }

    const patch: Record<string, unknown> = {}
    if (body.name !== undefined) patch.name = body.name
    if (body.protocol !== undefined) patch.protocol = body.protocol
    if (body.base_url !== undefined) patch.base_url = body.base_url.replace(/\/+$/, '')
    if (body.key_mode !== undefined) patch.key_mode = body.key_mode
    if (body.env_var_name !== undefined) patch.env_var_name = body.env_var_name || null
    if (body.custom_headers !== undefined) patch.custom_headers = body.custom_headers
    if (body.enabled !== undefined) patch.enabled = body.enabled
    if (body.is_default !== undefined) patch.is_default = body.is_default

    if (body.models !== undefined || body.default_model !== undefined) {
      const uniqueModels = Array.from(
        new Set([
          ...(body.models ?? []).map((m) => m.trim()).filter(Boolean),
          ...(body.default_model ? [body.default_model] : []),
        ]),
      )
      if (body.models !== undefined) {
        patch.models = uniqueModels
      }
      if (body.default_model !== undefined) {
        patch.default_model = body.default_model
      }
    }

    if (body.clear_api_key) {
      patch.api_key_encrypted = null
      patch.api_key_mask = null
    } else if (body.api_key) {
      patch.api_key_encrypted = encryptApiKey(body.api_key)
      patch.api_key_mask = maskApiKey(body.api_key)
    }

    const { data, error } = await client
      .from('ai_providers')
      .update(patch as never)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Provider 不存在' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ provider: toPublicProvider(data as DbProviderRow) })
  } catch (error) {
    console.error('PUT /api/admin/ai/providers/[id] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新 Provider 失败' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = getAuthTokenFromRequest(request)
  if (!(await validateAdminRequest(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const client = getAdminClient(token || undefined)
    const { error } = await client.from('ai_providers').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('DELETE /api/admin/ai/providers/[id] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除 Provider 失败' },
      { status: 500 },
    )
  }
}
