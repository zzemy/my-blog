import { NextRequest, NextResponse } from 'next/server'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import { sendAdminNotification } from '@/lib/email/admin-notification'
import {
  buildSampleNotification,
  type EmailPreviewTemplate,
} from '@/app/api/admin/email/preview/route'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  const ok = await validateAdminRequest(token)
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { template?: string }
    const raw = body.template || 'weekly'
    const template: EmailPreviewTemplate =
      raw === 'comment' || raw === 'friend' || raw === 'alert' ? raw : 'weekly'

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || request.nextUrl.origin).replace(/\/$/, '')
    const notification = await buildSampleNotification(template, siteUrl)
    const result = await sendAdminNotification({
      ...notification,
      subject: `[测试预览] ${notification.subject}`,
    })

    if (!result.ok) {
      const reasonText =
        result.reason === 'missing_email_env'
          ? '未配置 RESEND_API_KEY / RESEND_FROM_EMAIL / ADMIN_NOTIFICATION_EMAIL 环境变量'
          : '邮件发送失败，请检查 Resend 配置与域名验证状态'
      return NextResponse.json({ error: reasonText, reason: result.reason }, { status: 400 })
    }

    return NextResponse.json({ ok: true, template })
  } catch (error) {
    console.error('[ADMIN_EMAIL_TEST] Failed:', error)
    return NextResponse.json({ error: '发送测试邮件失败' }, { status: 500 })
  }
}
