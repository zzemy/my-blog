import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, hasValidServiceRoleKey } from '@/lib/supabase/client'
import { validateCSRFToken } from '@/lib/csrf'
import { sendAdminNotification } from '@/lib/email/admin-notification'
import { friendLinkSubmissionSchema } from '@/lib/validation/friend-link'
import { getApprovedFriendLinks } from '@/lib/supabase/friend-links'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json({ links: await getApprovedFriendLinks() })
  } catch (error) {
    console.error('Error fetching friend links:', error)
    return NextResponse.json({ error: '友链暂时无法加载' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json()
    const parsed = friendLinkSubmissionSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json({ error: '请检查表单内容', details: parsed.error.flatten() }, { status: 400 })
    }

    if (!validateCSRFToken(parsed.data.csrfToken, request)) {
      return NextResponse.json({ error: '请求已过期，请刷新页面后重试' }, { status: 403 })
    }

    if (parsed.data.website) {
      return NextResponse.json({ success: true, message: '申请已提交' })
    }

    if (!hasValidServiceRoleKey()) {
      return NextResponse.json({ error: '友链申请暂不可用，请稍后再试' }, { status: 503 })
    }

    const client = getAdminClient()
    const payload = {
      name: parsed.data.name,
      url: parsed.data.url,
      avatar_url: parsed.data.avatar_url || null,
      description: parsed.data.description,
      note: parsed.data.note || null,
      contact: parsed.data.contact || null,
      status: 'pending' as const,
      sort_order: 0,
    }

    const { data: duplicate } = await client
      .from('friend_links')
      .select('id')
      .eq('url', payload.url)
      .in('status', ['pending', 'approved'])
      .maybeSingle()

    if (duplicate) {
      return NextResponse.json({ error: '这个网站已经提交过友链申请' }, { status: 409 })
    }

    const { data, error } = await client.from('friend_links').insert(payload as never).select().single()
    if (error) throw error

    const origin = request.nextUrl.origin
    await sendAdminNotification({
      subject: `新的友链申请：${payload.name}`,
      title: '收到一条新的友链申请',
      message: '请登录后台审核，通过后该友链才会显示在公开页面。',
      lines: [
        ['昵称', payload.name],
        ['网站', payload.url],
        ['网站介绍', payload.description],
        ['联系方式', payload.contact],
        ['申请备注', payload.note],
      ],
      action: { label: '打开友链管理', href: `${origin}/admin/friends` },
    })

    return NextResponse.json({ success: true, link: data }, { status: 201 })
  } catch (error) {
    console.error('Error submitting friend link:', error)
    return NextResponse.json({ error: '提交失败，请稍后再试' }, { status: 500 })
  }
}
