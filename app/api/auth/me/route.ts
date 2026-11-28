import { NextRequest, NextResponse } from 'next/server'
import {
  applyAuthCookies,
  clearAuthCookies,
  getAdminUser,
  isJwtExpiringSoon,
  refreshAdminSession,
} from '@/lib/auth'

export async function GET(request: NextRequest) {
  const authToken = request.cookies.get('auth-token')?.value ?? null
  const refreshToken = request.cookies.get('refresh-token')?.value ?? null

  if (!authToken && !refreshToken) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  try {
    // 1. 先检查当前 auth-token
    const currentUser = authToken ? await getAdminUser(authToken) : null

    // 当前 token 有效且还有超过 15 分钟有效期，直接返回
    if (currentUser && authToken && !isJwtExpiringSoon(authToken, 900)) {
      return NextResponse.json({ user: currentUser, refreshed: false })
    }

    // 2. auth-token 缺失、已过期或即将在 15 分钟内过期时，尝试用 refresh-token 无感续期
    if (refreshToken) {
      const refreshed = await refreshAdminSession(refreshToken)
      if (refreshed) {
        const response = NextResponse.json({
          user: refreshed.user,
          refreshed: true,
        })
        applyAuthCookies(response, refreshed, request)
        return response
      }
    }

    // 3. 如果刷新未成功但当前 token 仍处于有效期内，保留当前登录状态
    if (currentUser) {
      return NextResponse.json({ user: currentUser, refreshed: false })
    }

    const response = NextResponse.json({ user: null }, { status: 401 })
    clearAuthCookies(response, request)
    return response
  } catch {
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
