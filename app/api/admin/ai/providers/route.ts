import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import { encryptApiKey, getEncryptionKeyStatus, maskApiKey } from '@/lib/ai/crypto'
import { toPublicProvider, type DbProviderRow } from '@/lib/ai/runner'

const createProviderSchema = z.object({
  name: z.string().trim().min(1, '名称不能为空').max(80),
  protocol: z.enum(['openai-compatible', 'anthropic', 'gemini']),
  base_url: z.string().trim().url('请输入合法的 Base URL'),
  key_mode: z.enum(['encrypted', 'env']).default('encrypted'),
  api_key: z.string().trim().optional(),
  env_var_name: z.string().trim().max(120).optional(),
  models: z.array(z.string().trim().min(1)).default([]),
  default_model: z.string().trim().default(''),
  custom_headers: z.record(z.string(), z.string()).default({}),
  enabled: z.boolean().default(true),
  is_default: z.boolean().default(false),
})

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === '42P01' || (error.message ?? '').includes('ai_providers')
}

export async function GET(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  if (!(await validateAdminRequest(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const client = getAdminClient(token || undefined)
    const { data, error } = await client
      .from('ai_providers')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json(
          {
            error: '数据库缺少 AI 配置表，请先在 Supabase 执行 supabase/migrations/20261127_add_ai_system.sql',
            code: 'MIGRATION_REQUIRED',
            providers: [],
            encryption: getEncryptionKeyStatus(),
          },
          { status: 200 },
        )
      }
      throw error
    }

    const providers = ((data as DbProviderRow[] | null) ?? []).map(toPublicProvider)
    return NextResponse.json({
      providers,
      encryption: getEncryptionKeyStatus(),
    })
  } catch (error) {
    console.error('GET /api/admin/ai/providers error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '加载 AI Provider 失败' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  if (!(await validateAdminRequest(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rawBody: unknown = await request.json()
    const parsed = createProviderSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '请求参数无效', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const body = parsed.data
    let apiKeyEncrypted: string | null = null
    let apiKeyMask: string | null = null
    let envVarName: string | null = null

    if (body.key_mode === 'env') {
      if (!body.env_var_name) {
        return NextResponse.json({ error: '环境变量模式必须填写环境变量名称' }, { status: 400 })
      }
      envVarName = body.env_var_name
    } else if (body.api_key) {
      apiKeyEncrypted = encryptApiKey(body.api_key)
      apiKeyMask = maskApiKey(body.api_key)
    }

    const normalizedModels = Array.from(
      new Set([
        ...body.models.map((m) => m.trim()).filter(Boolean),
        ...(body.default_model ? [body.default_model] : []),
      ]),
    )
    const defaultModel = body.default_model || normalizedModels[0] || ''

    const client = getAdminClient(token || undefined)

    if (body.is_default) {
      await client.from('ai_providers').update({ is_default: false } as never).eq('is_default', true)
    }

    const { data, error } = await client
      .from('ai_providers')
      .insert({
        name: body.name,
        protocol: body.protocol,
        base_url: body.base_url.replace(/\/+$/, ''),
        key_mode: body.key_mode,
        api_key_encrypted: apiKeyEncrypted,
        api_key_mask: apiKeyMask,
        env_var_name: envVarName,
        models: normalizedModels,
        default_model: defaultModel,
        custom_headers: body.custom_headers,
        enabled: body.enabled,
        is_default: body.is_default,
      } as never)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ provider: toPublicProvider(data as DbProviderRow) }, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/ai/providers error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建 Provider 失败' },
      { status: 500 },
    )
  }
}
