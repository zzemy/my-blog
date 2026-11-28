import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminClient, hasValidServiceRoleKey } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import { revalidateSiteSettings } from '@/lib/revalidation/settings'

const optionalSafeUrl = z
  .string()
  .trim()
  .max(1000)
  .refine(
    (val) => {
      if (!val) return true
      if (val.startsWith('/')) return true
      try {
        const u = new URL(val)
        return u.protocol === 'http:' || u.protocol === 'https:'
      } catch {
        return false
      }
    },
    { message: '请输入合法的 http(s) 或站内路径 URL' },
  )

const socialLinkSchema = z.object({
  platform: z.string().trim().min(1, '平台名称不能为空').max(60),
  url: z
    .string()
    .trim()
    .url('请输入有效的社交链接 URL')
    .refine((val) => {
      try {
        const u = new URL(val)
        return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'mailto:'
      } catch {
        return false
      }
    }, '仅支持 http(s) 或 mailto 链接'),
  icon: z.string().trim().max(60).optional(),
})

const siteSettingsUpdateSchema = z.object({
  site_title: z.string().trim().min(1, '网站标题不能为空').max(120),
  site_description: z.string().trim().max(500).default(''),
  site_keywords: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  favicon_url: optionalSafeUrl.default(''),
  footer_text: z.string().trim().max(300).optional(),
  social_links: z.array(socialLinkSchema).max(20).optional(),
  author_info: z
    .object({
      name: z.string().trim().max(80).optional(),
      bio: z.string().trim().max(500).optional(),
      avatar_url: optionalSafeUrl.optional(),
    })
    .optional(),
  seo_config: z
    .object({
      google_site_verification: z.string().trim().max(200).optional(),
      baidu_site_verification: z.string().trim().max(200).optional(),
      og_image: optionalSafeUrl.optional(),
    })
    .optional(),
  feature_flags: z
    .object({
      enable_comments: z.boolean().optional(),
      enable_footer: z.boolean().optional(),
      enable_registrations: z.boolean().optional(),
      maintenance_mode: z.boolean().optional(),
    })
    .optional(),
})

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

export async function GET(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  const ok = await validateAdminRequest(token)
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const client = getAdminClient(token || undefined)
    const { data, error } = await client
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    const settings = data || {
      site_title: 'My Blog',
      site_keywords: [],
      social_links: [],
    }

    return NextResponse.json({ settings })
  } catch (error: unknown) {
    const message = getErrorMessage(error)
    console.error('[ADMIN_SETTINGS_GET] Failed to load settings:', message)
    if (message.toLowerCase().includes('invalid api key')) {
      return NextResponse.json(
        { error: 'Supabase 服务端配置异常，请检查环境变量' },
        { status: 500 },
      )
    }
    return NextResponse.json({ error: '加载系统设置失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  const ok = await validateAdminRequest(token)
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rawBody: unknown = await request.json()
    const parsed = siteSettingsUpdateSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: '设置参数校验失败',
          details: parsed.error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      )
    }

    const payload = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    }

    const client = getAdminClient(token || undefined)
    const { data, error } = await client
      .from('site_settings')
      .update(payload as never)
      .eq('id', 1)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        if (!hasValidServiceRoleKey()) {
          return NextResponse.json(
            { error: 'site_settings 缺少默认行（id=1），无法自动初始化' },
            { status: 500 },
          )
        }

        const adminClient = getAdminClient()
        const { data: repaired, error: repairError } = await adminClient
          .from('site_settings')
          .upsert({ id: 1, ...payload } as never)
          .select()
          .single()

        if (repairError) throw repairError

        revalidateSiteSettings()
        return NextResponse.json({ settings: repaired })
      }
      throw error
    }

    revalidateSiteSettings()
    return NextResponse.json({ settings: data })
  } catch (error: unknown) {
    const code = getErrorCode(error)
    const message = getErrorMessage(error) || 'Unknown error'
    console.error('[ADMIN_SETTINGS_PUT] Failed to save settings:', code, message)

    if (message.toLowerCase().includes('invalid api key')) {
      return NextResponse.json(
        { error: 'Supabase 服务端配置异常，请检查环境变量' },
        { status: 500 },
      )
    }

    if (code === '42703') {
      return NextResponse.json(
        { error: '数据库缺少设置字段（请执行最新 migration）', code },
        { status: 500 },
      )
    }

    if (code === '42P01') {
      return NextResponse.json(
        { error: '数据库缺少 site_settings 表（请执行初始化 schema/migration）', code },
        { status: 500 },
      )
    }

    return NextResponse.json({ error: '保存系统设置失败', code }, { status: 500 })
  }
}
