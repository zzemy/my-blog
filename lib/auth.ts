import { createClient, type User } from '@supabase/supabase-js'
import type { NextResponse } from 'next/server'
import { getAuthTokenFromCookie } from '@/lib/server-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

const normalizeEmail = (email: string | null | undefined) =>
  (email ?? '').trim().toLowerCase()

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!ADMIN_EMAIL) return true
  return normalizeEmail(email) === normalizeEmail(ADMIN_EMAIL)
}

/**
 * 解析当前请求对应的认证 Cookie domain（避免在非主域/预览域强行绑定导致 Cookie 被拒，同时保持清/写一致）
 */
export function resolveAuthCookieDomain(request?: Request): string | undefined {
  if (process.env.NODE_ENV !== 'production') return undefined
  const host = request?.headers.get('host')?.split(':')[0]?.toLowerCase() ?? ''
  if (host === 'blog.zzemy.top' || host.endsWith('.blog.zzemy.top')) {
    return '.blog.zzemy.top'
  }
  return undefined
}

/**
 * 统一写入 auth-token 与 refresh-token HttpOnly Cookie
 */
export function applyAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken?: string | null },
  request?: Request,
) {
  const isProduction = process.env.NODE_ENV === 'production'
  const domain = resolveAuthCookieDomain(request)

  response.cookies.set({
    name: 'auth-token',
    value: tokens.accessToken,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    domain,
  })

  if (tokens.refreshToken) {
    response.cookies.set({
      name: 'refresh-token',
      value: tokens.refreshToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      domain,
    })
  }
}

/**
 * 统一清除 auth-token 与 refresh-token Cookie
 */
export function clearAuthCookies(response: NextResponse, request?: Request) {
  const isProduction = process.env.NODE_ENV === 'production'
  const domain = resolveAuthCookieDomain(request)

  response.cookies.set({
    name: 'auth-token',
    value: '',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
    domain,
  })

  response.cookies.set({
    name: 'refresh-token',
    value: '',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
    domain,
  })
}

/**
 * 读取 JWT 的 exp（秒级时间戳），用于判断是否即将过期（无需发起网络请求）
 */
export function getJwtExpiration(token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const jsonStr = atob(padded)
    const payload = JSON.parse(jsonStr) as { exp?: unknown }
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

/**
 * 判断 JWT 是否已过期或即将在 thresholdSeconds 秒内过期
 */
export function isJwtExpiringSoon(token: string, thresholdSeconds = 900): boolean {
  const exp = getJwtExpiration(token)
  if (!exp) return true
  const nowSeconds = Math.floor(Date.now() / 1000)
  return exp - nowSeconds <= thresholdSeconds
}

/**
 * 使用 refresh-token 向 Supabase 无感续期管理员会话
 */
export async function refreshAdminSession(refreshToken: string | null): Promise<{
  user: User
  accessToken: string
  refreshToken: string
} | null> {
  if (!refreshToken || !supabaseUrl || !supabaseAnonKey) return null

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error || !data.session || !data.user) {
      return null
    }

    if (!isAllowedAdminEmail(data.user.email)) {
      return null
    }

    return {
      user: data.user,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    }
  } catch {
    return null
  }
}

/**
 * 从请求头或 Cookie 中提取认证令牌
 */
export function getAuthTokenFromRequest(request: Request): string | null {
  // 1. 尝试从 Authorization Header 获取
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const parts = authHeader.split(' ')
    if (parts.length === 2 && parts[0] === 'Bearer') {
      return parts[1]
    }
    return authHeader // 兼容直接传 token 的情况
  }

  // 2. 尝试从 Cookie 获取 (auth-token)
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)auth-token=([^;]+)/)
    if (match && match[1]) {
      return decodeURIComponent(match[1])
    }
  }

  return null
}

/**
 * 验证管理员请求（使用服务端 Cookie 中的 JWT）
 */
export async function validateAdminRequest(token: string | null): Promise<boolean> {
  if (!token) return false
  if (!supabaseUrl || !supabaseAnonKey) return false

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return false

  return isAllowedAdminEmail(data.user.email)
}

/**
 * 带原因的管理员校验，便于排查 401 问题
 */
export async function validateAdminRequestWithReason(token: string | null): Promise<{
  ok: boolean
  reason?: string
  email?: string | null
  expected?: string | null
}> {
  const expected = ADMIN_EMAIL ? normalizeEmail(ADMIN_EMAIL) : null

  if (!token) return { ok: false, reason: 'missing_token', email: null, expected }
  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, reason: 'missing_supabase_env', email: null, expected }
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    return { ok: false, reason: 'token_invalid', email: null, expected }
  }

  if (expected) {
    const actual = normalizeEmail(data.user.email)
    if (expected !== actual) {
      return { ok: false, reason: 'email_mismatch', email: data.user.email, expected }
    }
  }

  return { ok: true, email: data.user.email, expected }
}

/**
 * 返回当前管理员用户（Supabase）
 */
export async function getAdminUser(token: string | null) {
  if (!token || !supabaseUrl || !supabaseAnonKey) return null
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  })
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  if (!isAllowedAdminEmail(data.user.email)) return null
  return data.user
}

/**
 * 从服务端 Cookie 获取认证令牌并验证（推荐用法）
 */
export async function validateAdminRequestFromCookie(): Promise<boolean> {
  try {
    const token = await getAuthTokenFromCookie()
    return validateAdminRequest(token)
  } catch {
    return false
  }
}
