import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookies } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true }, { status: 200 })
  clearAuthCookies(response, request)
  return response
}
