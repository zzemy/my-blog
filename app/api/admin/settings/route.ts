import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, hasValidServiceRoleKey, validateAnonKey, validateServiceRoleKey } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'

function keyReasonText(reason?: string, keyName?: string, keyRef?: string | null, urlRef?: string | null) {
  const prefix = keyName ? `${keyName}: ` : ''
  switch (reason) {
    case 'missing_key':
      return `${prefix}缺少配置`
    case 'invalid_jwt':
      return `${prefix}不是合法 JWT`
    case 'invalid_format':
      return `${prefix}格式不合法（应为 JWT 或 sb_publishable/sb_secret）`
    case 'invalid_role':
      return `${prefix}角色不匹配`
    case 'expired':
      return `${prefix}已过期`
    case 'project_ref_mismatch':
      return `${prefix}项目不匹配（key.ref=${keyRef}, url.ref=${urlRef}）`
    default:
      return `${prefix}格式看似正确但被 Supabase 拒绝（常见于复制不完整/密钥已轮换失效）`
  }
}

function normalizeEnvValue(value?: string) {
  if (!value) return undefined
  let normalized = value.trim()
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, '')
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim()
  }
  normalized = normalized.replace(/\s+/g, '')
  return normalized || undefined
}

function keyFingerprint(value?: string) {
  const normalized = normalizeEnvValue(value)
  if (!normalized) return 'missing'
  const len = normalized.length
  const head = normalized.slice(0, 8)
  const tail = normalized.slice(-8)
  return `len=${len}, head=${head}, tail=${tail}`
}

function extractProjectRefFromSupabaseUrl(url?: string) {
  const normalized = normalizeEnvValue(url)
  if (!normalized) return null
  try {
    const hostname = new URL(normalized).hostname
    const match = hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

function buildApiKeyErrorDetails() {
  const anon = validateAnonKey()
  const service = validateServiceRoleKey()
  const normalizedUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const urlRef = extractProjectRefFromSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)

  return [
    keyReasonText(anon.reason, 'NEXT_PUBLIC_SUPABASE_ANON_KEY', anon.keyRef, anon.urlRef),
    keyReasonText(service.reason, 'SUPABASE_SERVICE_ROLE_KEY', service.keyRef, service.urlRef),
    `NEXT_PUBLIC_SUPABASE_URL: ${normalizedUrl || 'missing'} (url.ref=${urlRef || 'unknown'})`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY ref: ${anon.keyRef || 'unknown'} (url.ref=${anon.urlRef || urlRef || 'unknown'})`,
    `SUPABASE_SERVICE_ROLE_KEY ref: ${service.keyRef || 'unknown'} (url.ref=${service.urlRef || urlRef || 'unknown'})`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY 指纹: ${keyFingerprint(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}`,
    `SUPABASE_SERVICE_ROLE_KEY 指纹: ${keyFingerprint(process.env.SUPABASE_SERVICE_ROLE_KEY)}`,
  ]
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

function getErrorCode(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}

export async function GET() {
  try {
    const client = getAdminClient()
    const { data, error } = await client
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is code for 0 rows
       throw error
    }

    // Default if not found (though migration should ensure it exists)
    const settings = data || {
      site_title: 'My Blog',
      site_keywords: [],
      social_links: []
    }

    return NextResponse.json({ settings })
  } catch (error: unknown) {
    const message = getErrorMessage(error).toLowerCase()
    if (message.includes('invalid api key')) {
      return NextResponse.json(
        {
          error: 'Supabase API Key 无效',
          details: buildApiKeyErrorDetails(),
        },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  const ok = await validateAdminRequest(token)
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    // Singleton row update only (id = 1)
    const payload = { ...body, updated_at: new Date().toISOString() }

    const client = getAdminClient(token || undefined)
    const { data, error } = await client
      .from('site_settings')
      .update(payload as never)
      .eq('id', 1)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        const hasServiceRole = hasValidServiceRoleKey()
        const validation = validateServiceRoleKey()
        if (!hasServiceRole) {
          const reasonMap: Record<string, string> = {
            missing_key: '缺少 SUPABASE_SERVICE_ROLE_KEY',
            invalid_jwt: 'SUPABASE_SERVICE_ROLE_KEY 不是合法 JWT',
            invalid_format: 'SUPABASE_SERVICE_ROLE_KEY 格式不合法（应为 JWT 或 sb_secret）',
            invalid_role: 'SUPABASE_SERVICE_ROLE_KEY 不是 service_role key',
            expired: 'SUPABASE_SERVICE_ROLE_KEY 已过期',
            project_ref_mismatch: `service_role key 项目不匹配（key.ref=${validation.keyRef}, url.ref=${validation.urlRef}）`,
          }

          return NextResponse.json(
            {
              error: 'site_settings 缺少默认行（id=1），且 SUPABASE_SERVICE_ROLE_KEY 无法用于自动初始化',
              details: reasonMap[validation.reason || ''] || '未知 service_role 校验失败原因',
            },
            { status: 500 }
          )
        }

        const adminClient = getAdminClient()
        const { data: repaired, error: repairError } = await adminClient
          .from('site_settings')
          .upsert({ id: 1, ...payload, site_title: body?.site_title || 'My Blog' })
          .select()
          .single()

        if (repairError) {
          if ((repairError?.message || '').toLowerCase().includes('invalid api key')) {
            return NextResponse.json(
              {
                error: 'Supabase API Key 无效',
                details: buildApiKeyErrorDetails(),
              },
              { status: 500 }
            )
          }
          throw repairError
        }

        return NextResponse.json({ settings: repaired })
      }
      throw error
    }

    return NextResponse.json({ settings: data })
  } catch (error: unknown) {
    const code = getErrorCode(error)
    const message = getErrorMessage(error) || 'Unknown error'
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('invalid api key')) {
      return NextResponse.json(
        {
          error: 'Supabase API Key 无效',
          details: buildApiKeyErrorDetails(),
        },
        { status: 500 }
      )
    }

    if (code === '42703') {
      return NextResponse.json(
        { error: '数据库缺少设置字段（请执行最新 migration）', details: message, code },
        { status: 500 }
      )
    }

    if (code === '42P01') {
      return NextResponse.json(
        { error: '数据库缺少 site_settings 表（请执行初始化 schema/migration）', details: message, code },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: message, code }, { status: 500 })
  }
}
