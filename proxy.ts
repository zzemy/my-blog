import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateAdminRequest } from '@/lib/auth'

// Routes that require auth guard.
const protectedRoutes = ['/admin']

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  if (!isProtectedRoute) return NextResponse.next()

  // Keep /admin login page public.
  if (pathname === '/admin' || pathname === '/admin/') {
    return NextResponse.next()
  }

  const authToken = request.cookies.get('auth-token')?.value
  if (!authToken) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  const isValid = await validateAdminRequest(authToken)
  if (!isValid) {
    const response = NextResponse.redirect(new URL('/admin', request.url))
    response.cookies.set({
      name: 'auth-token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
