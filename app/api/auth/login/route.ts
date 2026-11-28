import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { applyAuthCookies, isAllowedAdminEmail, resolveAuthCookieDomain } from '@/lib/auth'
import { validateCSRFToken } from '@/lib/csrf'
import { formatBeijingDateTime, sendAdminNotification } from '@/lib/email/admin-notification'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request)
    const rateLimit = await checkRateLimit({
      namespace: 'admin_login',
      identifier: clientIp,
      limit: 10,
      windowSeconds: 900, // 15 minutes
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: '尝试过于频繁，请稍后再试' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        },
      )
    }

    const { email, password, csrfToken } = await request.json()

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

    applyAuthCookies(
      response,
      {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
      request,
    )

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

    await sendAdminLoginNotification(request, data.user?.email || email, clientIp)

    return response
  } catch (error) {
    console.error('[LOGIN] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function sendAdminLoginNotification(request: NextRequest, email: string, clientIp: string) {
  if (process.env.ADMIN_LOGIN_EMAIL_NOTIFICATIONS !== 'true') {
    return
  }

  const loginTime = formatBeijingDateTime()
  const origin = request.nextUrl.origin

  await sendAdminNotification({
    category: 'alert',
    badge: '安全通知',
    subject: `后台登录提醒 · ${clientIp}`,
    title: '博客后台发生一次管理员登录',
    subtitle: loginTime,
    preheader: `${email} 从 ${clientIp} 登录了博客后台`,
    message: '如果本次登录是你本人操作，可忽略此邮件；若非本人操作，请立即前往 Supabase 修改密码并吊销会话。',
    siteUrl: origin,
    lines: [
      ['登录账号', email],
      ['登录时间', loginTime],
      ['来源 IP', clientIp],
      ['客户端', request.headers.get('user-agent') || 'unknown'],
      ['运行环境', process.env.NODE_ENV || 'unknown'],
    ],
    actions: [{ label: '前往博客后台', href: `${origin}/admin`, variant: 'primary' }],
  })
}
