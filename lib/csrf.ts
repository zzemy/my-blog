import crypto from 'crypto'
import type { NextRequest } from 'next/server'

/**
 * 生成 CSRF token
 * 返回可发送给客户端的 token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * 验证 CSRF token
 * 使用恒定时间比对客户端发送的 token 和 Cookie 中存储的 token
 */
export function validateCSRFToken(
  tokenFromBody: string,
  request: NextRequest,
): boolean {
  if (!tokenFromBody || typeof tokenFromBody !== 'string') {
    console.warn('[CSRF] No token in request body')
    return false
  }

  try {
    const tokenFromCookie = request.cookies.get('x-csrf-token')?.value

    if (!tokenFromCookie) {
      console.warn('[CSRF] No token found in cookie')
      return false
    }

    const isValid = safeEqual(tokenFromBody, tokenFromCookie)

    if (!isValid) {
      console.warn('[CSRF] Token mismatch', {
        bodyLen: tokenFromBody.length,
        cookieLen: tokenFromCookie.length,
      })
    }

    return isValid
  } catch (error) {
    console.error('[CSRF] Validation error:', error)
    return false
  }
}
