import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { applyAuthCookies, isAllowedAdminEmail, resolveAuthCookieDomain } from '@/lib/auth'
import { validateCSRFToken } from '@/lib/csrf'
import { sendAdminNotification } from '@/lib/email/admin-notification'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { email, password, csrfToken } = await request.json()

    // 验证 CSRF token
    if (!csrfToken) {
      return NextResponse.json({ error: 'CSRF token required' }, { status: 403 })
    }

    const isValidCSRF = validateCSRFToken(csrfToken, request)
    if (!isValidCSRF) {
      return NextResponse.json({ error: 'CSRF token invalid' }, { status: 403 })
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.session) {
      console.error('[LOGIN] Supabase auth error:', error?.message)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    if (!isAllowedAdminEmail(data.user?.email)) {
      return NextResponse.json({ error: '该账号没有后台管理员权限' }, { status: 403 })
    }

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      },
      { status: 200 },
    )

    // 统一写入 auth-token（7天 Cookie）与 refresh-token（30天 Cookie）
    applyAuthCookies(
      response,
      {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
      request,
    )

    // 清除 CSRF token cookie（一次性使用）
    response.cookies.set({
      name: 'x-csrf-token',
      value: '',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
      domain: resolveAuthCookieDomain(request),
    })

    await sendAdminLoginNotification(request, data.user?.email || email)

    return response
  } catch (error) {
    console.error('[LOGIN] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function sendAdminLoginNotification(request: NextRequest, email: string) {
  if (process.env.ADMIN_LOGIN_EMAIL_NOTIFICATIONS !== 'true') {
    return
  }

  await sendAdminNotification({
    subject: '博客后台登录通知',
    title: '博客后台发生一次登录',
    message: '如果这不是你本人操作，请尽快检查 Supabase 账号和后台访问记录。',
    lines: [
      ['登录邮箱', email],
      ['登录时间', new Date().toISOString()],
      ['IP', getClientIp(request)],
      ['User-Agent', request.headers.get('user-agent')],
      ['环境', process.env.NODE_ENV],
    ],
  })
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}
