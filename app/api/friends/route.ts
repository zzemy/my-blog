import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/client'
import { validateCSRFToken } from '@/lib/csrf'
import { formatBeijingDateTime, sendAdminNotification } from '@/lib/email/admin-notification'
import { friendLinkSubmissionSchema } from '@/lib/validation/friend-link'
import { getApprovedFriendLinks } from '@/lib/supabase/friend-links'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

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
    const rateLimit = await checkRateLimit({
      namespace: 'friends_submit',
      identifier: getClientIp(request),
      limit: 5,
      windowSeconds: 600,
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: '提交过于频繁，请稍后再试' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        },
      )
    }

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

    const client = getAdminClient()
    const payload = {
      name: parsed.data.name,
      url: parsed.data.url,
      avatar_url: parsed.data.avatar_url || null,
      description: parsed.data.description || null,
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

    const { data, error } = await client
      .from('friend_links')
      .insert(payload as never)
      .select('id, name, url, avatar_url, description, status, created_at')
      .single()
    if (error) throw error

    const origin = request.nextUrl.origin
    const submittedAt = formatBeijingDateTime()
    await sendAdminNotification({
      category: 'friend',
      badge: '友链申请',
      subject: `友链申请 · ${payload.name}`,
      title: `收到来自「${payload.name}」的友链申请`,
      subtitle: `提交于 ${submittedAt}`,
      preheader: `${payload.name} (${payload.url}) 申请交换友链`,
      message: '请登录后台审核，通过后该站点才会公开展示在友链页。',
      siteUrl: origin,
      quote: {
        author: payload.name,
        authorUrl: payload.url,
        avatarUrl: payload.avatar_url,
        meta: payload.url,
        body: payload.description || '对方未填写站点简介。',
      },
      lines: [
        ['站点地址', payload.url, payload.url],
        ['联系方式', payload.contact],
        ['申请备注', payload.note],
        ['提交时间', submittedAt],
      ],
      actions: [
        { label: '前往后台审核', href: `${origin}/admin/friends`, variant: 'primary' },
        { label: '访问申请站点', href: payload.url, variant: 'secondary' },
      ],
    })

    return NextResponse.json({ success: true, link: data }, { status: 201 })
  } catch (error) {
    console.error('Error submitting friend link:', error)
    return NextResponse.json({ error: '提交失败，请稍后再试' }, { status: 500 })
  }
}
