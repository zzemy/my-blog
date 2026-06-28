import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendAdminNotification } from '@/lib/email/admin-notification'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const discussionCommentSchema = z.object({
  action: z.string(),
  comment: z.object({
    body: z.string().optional(),
    html_url: z.string().url().optional(),
    user: z.object({
      login: z.string().optional(),
      html_url: z.string().url().optional(),
    }).nullable().optional(),
    created_at: z.string().optional(),
  }),
  discussion: z.object({
    title: z.string().optional(),
    html_url: z.string().url().optional(),
    number: z.number().optional(),
  }).optional(),
  repository: z.object({
    full_name: z.string().optional(),
  }).optional(),
  sender: z.object({
    login: z.string().optional(),
    html_url: z.string().url().optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get('x-hub-signature-256')

  if (!verifyGitHubSignature(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = request.headers.get('x-github-event')
  if (event !== 'discussion_comment') {
    return NextResponse.json({ ok: true, ignored: true, reason: 'unsupported_event' })
  }

  let json: unknown
  try {
    json = JSON.parse(payload)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const parsed = discussionCommentSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Unsupported payload shape' }, { status: 400 })
  }

  const data = parsed.data
  if (data.action !== 'created') {
    return NextResponse.json({ ok: true, ignored: true, reason: 'unsupported_action' })
  }

  const discussionTitle = data.discussion?.title || '未命名讨论'
  const actor = data.comment.user?.login || data.sender?.login || 'unknown'
  const commentBody = truncate(data.comment.body || '', 1200)

  const result = await sendAdminNotification({
    subject: `Giscus 新评论：${discussionTitle}`,
    title: '收到新的 Giscus 评论',
    message: commentBody || '评论内容为空或无法读取。',
    action: {
      label: '查看评论',
      href: data.comment.html_url,
    },
    lines: [
      ['评论者', actor],
      ['讨论标题', discussionTitle],
      ['讨论编号', data.discussion?.number ? `#${data.discussion.number}` : undefined],
      ['评论链接', data.comment.html_url],
      ['讨论链接', data.discussion?.html_url],
      ['仓库', data.repository?.full_name],
      ['创建时间', data.comment.created_at],
    ],
  })

  return NextResponse.json({ ok: true, notification: result })
}

function verifyGitHubSignature(payload: string, signature: string | null) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret || !signature?.startsWith('sha256=')) return false

  const expected = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')}`

  const signatureBuffer = Buffer.from(signature, 'utf8')
  const expectedBuffer = Buffer.from(expected, 'utf8')
  if (signatureBuffer.length !== expectedBuffer.length) return false

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength - 1)}...`
}
