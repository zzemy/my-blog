import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import { fetchProviderModels } from '@/lib/ai/providers'
import { resolveProviderApiKey, type DbProviderRow } from '@/lib/ai/runner'

const discoverModelsSchema = z.object({
  protocol: z.enum(['openai-compatible', 'anthropic', 'gemini']),
  base_url: z.string().trim().url('请输入合法的 Base URL'),
  key_mode: z.enum(['encrypted', 'env']).default('encrypted'),
  api_key: z.string().trim().nullable().optional(),
  env_var_name: z.string().trim().max(120).nullable().optional(),
  custom_headers: z.record(z.string(), z.string()).default({}),
  provider_id: z.string().uuid().nullable().optional(),
})

export async function POST(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  if (!(await validateAdminRequest(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rawBody: unknown = await request.json()
    const parsed = discoverModelsSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '请求参数无效' },
        { status: 400 },
      )
    }

    const body = parsed.data
    let apiKey = ''

    if (body.key_mode === 'env') {
      const envName = body.env_var_name?.trim()
      if (!envName) {
        return NextResponse.json({ error: '请先填写环境变量名称' }, { status: 400 })
      }
      const envValue = process.env[envName]?.trim()
      if (!envValue) {
        return NextResponse.json(
          { error: `服务端未配置环境变量 ${envName}` },
          { status: 400 },
        )
      }
      apiKey = envValue
    } else if (body.api_key && body.api_key.trim()) {
      apiKey = body.api_key.trim()
    } else if (body.provider_id) {
      const client = getAdminClient(token || undefined)
      const { data } = await client
        .from('ai_providers')
        .select('*')
        .eq('id', body.provider_id)
        .maybeSingle()
      if (data) {
        apiKey = resolveProviderApiKey(data as DbProviderRow)
      }
    }

    const models = await fetchProviderModels({
      protocol: body.protocol,
      baseUrl: body.base_url,
      apiKey,
      customHeaders: body.custom_headers,
    })

    return NextResponse.json({ models })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '拉取模型列表失败' },
      { status: 400 },
    )
  }
}
