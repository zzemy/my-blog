import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

export const runtime = 'nodejs'

const WINDOW_MS = 10 * 60 * 1000
const MAX_REQUESTS = 5

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name is too long'),
  email: z.string().trim().email('Email is invalid').max(160, 'Email is too long'),
  subject: z.string().trim().max(120, 'Subject is too long').optional(),
  message: z.string().trim().min(10, 'Message is too short').max(4000, 'Message is too long'),
  website: z.string().trim().max(0).optional(),
})

type RateLimitEntry = {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export async function POST(request: NextRequest) {
  const rateLimitKey = getRateLimitKey(request)
  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json(
      { error: '发送太频繁了，请稍后再试。' },
      { status: 429 },
    )
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  const to = process.env.CONTACT_EMAIL || process.env.ADMIN_EMAIL

  if (!apiKey || !from || !to) {
    return NextResponse.json(
      { error: '邮件服务尚未配置完成。' },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '请求格式不正确。' }, { status: 400 })
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || '提交内容不正确。' },
      { status: 400 },
    )
  }

  const { name, email, subject, message, website } = parsed.data

  if (website) {
    return NextResponse.json({ ok: true })
  }

  const resend = new Resend(apiKey)
  const emailSubject = subject ? `博客联系：${subject}` : `博客联系：${name}`
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    subject ? `Subject: ${subject}` : null,
    '',
    message,
  ].filter(Boolean).join('\n')

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: emailSubject,
    text,
    html: renderContactEmail({ name, email, subject, message }),
  })

  if (error) {
    console.error('Failed to send contact email:', error)
    return NextResponse.json(
      { error: '邮件发送失败，请稍后再试。' },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true })
}

function getRateLimitKey(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwardedFor || request.headers.get('x-real-ip') || 'unknown'
}

function isRateLimited(key: string) {
  const now = Date.now()
  const current = rateLimitStore.get(key)

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  if (current.count >= MAX_REQUESTS) {
    return true
  }

  current.count += 1
  return false
}

function renderContactEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string
  email: string
  subject?: string
  message: string
}) {
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeSubject = escapeHtml(subject || '未填写')
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />')

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; line-height: 1.6;">
      <h2 style="margin: 0 0 16px; font-size: 20px;">博客收到新的联系消息</h2>
      <p><strong>姓名：</strong>${safeName}</p>
      <p><strong>邮箱：</strong>${safeEmail}</p>
      <p><strong>主题：</strong>${safeSubject}</p>
      <div style="margin-top: 20px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f9fafb;">
        ${safeMessage}
      </div>
    </div>
  `
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
