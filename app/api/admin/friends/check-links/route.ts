import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  if (!(await validateAdminRequest(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const client = getAdminClient(token || undefined)
    const { data, error } = await client
      .from('friend_links')
      .select('id, name, url, status')
      .eq('status', 'approved')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const links =
      (data as Array<{ id: string; name: string; url: string; status: string }> | null) ?? []

    const results = await Promise.all(
      links.map(async (link) => {
        const startedAt = Date.now()
        try {
          const parsed = new URL(link.url)
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return { id: link.id, ok: false, status: 0, latencyMs: 0, error: '无效协议' }
          }
          const res = await fetch(link.url, {
            method: 'HEAD',
            redirect: 'follow',
            signal: AbortSignal.timeout(6000),
            headers: { 'User-Agent': 'BlogFriendLinkChecker/1.0' },
          })
          // 部分站点不支持 HEAD 返回 405，尝试轻量 GET
          const finalRes =
            res.status === 405
              ? await fetch(link.url, {
                  method: 'GET',
                  redirect: 'follow',
                  signal: AbortSignal.timeout(6000),
                  headers: { 'User-Agent': 'BlogFriendLinkChecker/1.0' },
                })
              : res
          return {
            id: link.id,
            ok: finalRes.ok,
            status: finalRes.status,
            latencyMs: Date.now() - startedAt,
          }
        } catch (err) {
          return {
            id: link.id,
            ok: false,
            status: 0,
            latencyMs: Date.now() - startedAt,
            error: err instanceof Error ? err.message : '连接超时',
          }
        }
      }),
    )

    return NextResponse.json({ results })
  } catch (error) {
    console.error('POST /api/admin/friends/check-links error:', error)
    return NextResponse.json({ error: '友链检测失败' }, { status: 500 })
  }
}
