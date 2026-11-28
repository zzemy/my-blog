import { NextRequest, NextResponse } from 'next/server'
import { resolveAuthCookieDomain } from '@/lib/auth'
import { generateCSRFToken } from '@/lib/csrf'

export async function GET(request: NextRequest) {
  try {
    const csrfToken = generateCSRFToken()
    const response = NextResponse.json({ csrfToken })
    const isProduction = process.env.NODE_ENV === 'production'
    const domain = resolveAuthCookieDomain(request)

    response.cookies.set({
      name: 'x-csrf-token',
      value: csrfToken,
      httpOnly: false, // 允许 JS 读取
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
      domain,
    })

    return response
  } catch (error) {
    console.error('[CSRF] Error:', error)
    return NextResponse.json({ error: 'Failed to generate CSRF token' }, { status: 500 })
  }
}
