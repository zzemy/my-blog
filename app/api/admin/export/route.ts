import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  if (!(await validateAdminRequest(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const client = getAdminClient(token || undefined)

    const [postsRes, translationsRes, friendsRes, settingsRes] = await Promise.all([
      client.from('posts').select('*').order('created_at', { ascending: false }),
      client.from('post_translations').select('*').order('created_at', { ascending: false }),
      client.from('friend_links').select('*').order('created_at', { ascending: false }),
      client.from('site_settings').select('*').eq('id', 1).maybeSingle(),
    ])

    const backup = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      counts: {
        posts: postsRes.data?.length ?? 0,
        translations: translationsRes.error ? 0 : (translationsRes.data?.length ?? 0),
        friendLinks: friendsRes.error ? 0 : (friendsRes.data?.length ?? 0),
      },
      siteSettings: settingsRes.data ?? null,
      posts: postsRes.data ?? [],
      postTranslations: translationsRes.error ? [] : (translationsRes.data ?? []),
      friendLinks: friendsRes.error ? [] : (friendsRes.data ?? []),
    }

    const filename = `my-blog-backup-${new Date().toISOString().slice(0, 10)}.json`
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[ADMIN_EXPORT] Failed:', error)
    return NextResponse.json({ error: '导出备份失败' }, { status: 500 })
  }
}
