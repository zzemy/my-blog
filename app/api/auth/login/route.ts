import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateCSRFToken } from '@/lib/csrf'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { email, password, csrfToken } = await request.json()

    console.log('[LOGIN] Received request:', { email, csrfTokenLength: csrfToken?.length })
    console.log('[LOGIN] Cookies:', request.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })))

    // 验证 CSRF token
    if (!csrfToken) {
      console.error('[LOGIN] CSRF token missing from request body')
      return NextResponse.json(
        { error: 'CSRF token required' },
        { status: 403 }
      )
    }

    const isValidCSRF = validateCSRFToken(csrfToken, request)
    if (!isValidCSRF) {
      console.error('[LOGIN] CSRF token validation failed', {
        bodyToken: csrfToken.substring(0, 20) + '...',
        cookieToken: request.cookies.get('x-csrf-token')?.value?.substring(0, 20) + '...',
      })
      return NextResponse.json(
        { error: 'CSRF token invalid' },
        { status: 403 }
      )
    }

    console.log('[LOGIN] CSRF token valid')

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    // 创建 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })

    // 验证用户
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.session) {
      console.error('[LOGIN] Supabase auth error:', error?.message)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    console.log('[LOGIN] Authentication successful for:', email)

    // 创建响应
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      },
      { status: 200 }
    )

    // 设置 httpOnly Cookie（安全传输访问令牌）
    const isProduction = process.env.NODE_ENV === 'production'
    
    response.cookies.set({
      name: 'auth-token',
      value: data.session.access_token,
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      domain: isProduction ? '.blog.zzemy.top' : undefined,
    })

    // 设置刷新令牌（httpOnly Cookie）
    response.cookies.set({
      name: 'refresh-token',
      value: data.session.refresh_token,
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      domain: isProduction ? '.blog.zzemy.top' : undefined,
    })

    // 清除 CSRF token cookie（一次性使用）
    response.cookies.set({
      name: 'x-csrf-token',
      value: '',
      httpOnly: false,
      maxAge: 0,
      path: '/',
      domain: isProduction ? '.blog.zzemy.top' : undefined,
    })

    return response
  } catch (error) {
    console.error('[LOGIN] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
