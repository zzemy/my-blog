import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  applyAuthCookies,
  clearAuthCookies,
  getAuthTokenFromRequest,
  isJwtExpiringSoon,
  refreshAdminSession,
  validateAdminRequest,
} from '@/lib/auth'

const protectedRoutes = ['/admin', '/api/admin']

function buildUpdatedCookieHeader(
  request: NextRequest,
  nextAccessToken: string,
  nextRefreshToken: string,
): string {
  const cookieMap = new Map<string, string>()
  for (const cookie of request.cookies.getAll()) {
    cookieMap.set(cookie.name, cookie.value)
  }
  cookieMap.set('auth-token', nextAccessToken)
  cookieMap.set('refresh-token', nextRefreshToken)
  return Array.from(cookieMap.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isAdminApi = pathname.startsWith('/api/admin')
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  if (!isProtectedRoute) return NextResponse.next()

  // Keep /admin login page public.
  if (pathname === '/admin' || pathname === '/admin/') {
    return NextResponse.next()
  }

  const authToken = getAuthTokenFromRequest(request)
  const refreshToken = request.cookies.get('refresh-token')?.value ?? null

  // 1. 当前 access_token 有效且距离过期还超过 10 分钟，直接放行
  let accessTokenValid = false
  if (authToken) {
    accessTokenValid = await validateAdminRequest(authToken)
    if (accessTokenValid && !isJwtExpiringSoon(authToken, 600)) {
      return NextResponse.next()
    }
  }

  // 2. access_token 缺失、已过期或即将过期时，使用 refresh-token 无感续期
  if (refreshToken) {
    const refreshed = await refreshAdminSession(refreshToken)
    if (refreshed) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set(
        'cookie',
        buildUpdatedCookieHeader(request, refreshed.accessToken, refreshed.refreshToken),
      )

      const response = NextResponse.next({
        request: { headers: requestHeaders },
      })
      applyAuthCookies(response, refreshed, request)
      return response
    }
  }

  // 3. 若续期失败但当前 access_token 仍在有效期内，暂不强踢
  if (accessTokenValid) {
    return NextResponse.next()
  }

  // 4. API 路由返回 JSON 401，页面路由重定向到登录页
  if (isAdminApi) {
    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    clearAuthCookies(response, request)
    return response
  }

  const response = NextResponse.redirect(new URL('/admin', request.url))
  clearAuthCookies(response, request)
  return response
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
