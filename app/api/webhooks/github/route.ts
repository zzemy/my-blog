import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { formatBeijingDateTime, sendAdminNotification } from '@/lib/email/admin-notification'
import { upstashRedis } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const discussionCommentSchema = z.object({
  action: z.string(),
  comment: z.object({
    body: z.string().optional(),
    html_url: z.string().url().optional(),
    user: z
      .object({
        login: z.string().optional(),
        html_url: z.string().url().optional(),
        avatar_url: z.string().url().optional(),
      })
      .nullable()
      .optional(),
    created_at: z.string().optional(),
  }),
  discussion: z
    .object({
      title: z.string().optional(),
      html_url: z.string().url().optional(),
      number: z.number().optional(),
    })
    .optional(),
  repository: z
    .object({
      full_name: z.string().optional(),
    })
    .optional(),
  sender: z
    .object({
      login: z.string().optional(),
      html_url: z.string().url().optional(),
      avatar_url: z.string().url().optional(),
    })
    .optional(),
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

  // 基于 X-GitHub-Delivery 做幂等去重，避免 GitHub 重试导致重复发信
  const deliveryId = request.headers.get('x-github-delivery')?.trim()
  if (deliveryId && upstashRedis) {
    try {
      const dedupKey = `gh:delivery:${deliveryId}`
      const firstSeen = await upstashRedis.set(dedupKey, '1', { nx: true, ex: 60 * 60 * 24 })
      if (!firstSeen) {
        return NextResponse.json({ ok: true, ignored: true, reason: 'duplicate_delivery' })
      }
    } catch (error) {
      console.error('[GITHUB_WEBHOOK] Delivery dedup check failed:', error)
    }
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
  const actor = data.comment.user?.login || data.sender?.login || '访客'
  const actorUrl = data.comment.user?.html_url || data.sender?.html_url
  const actorAvatar = data.comment.user?.avatar_url || data.sender?.avatar_url
  const commentBody = truncate(data.comment.body?.trim() || '评论内容为空或无法读取。', 1200)
  const formattedTime = formatBeijingDateTime(data.comment.created_at)

  const result = await sendAdminNotification({
    category: 'comment',
    badge: '新评论',
    subject: `新评论 · ${actor} 留言了「${discussionTitle}」`,
    title: `${actor} 在「${discussionTitle}」发表了评论`,
    subtitle: formattedTime,
    preheader: `${actor}：${truncate(commentBody.replace(/\s+/g, ' '), 90)}`,
    quote: {
      author: `@${actor}`,
      authorUrl: actorUrl,
      avatarUrl: actorAvatar,
      meta: data.discussion?.number ? `Discussion #${data.discussion.number}` : 'Giscus 评论区',
      body: commentBody,
    },
    lines: [
      ['所属页面', discussionTitle, data.discussion?.html_url],
      ['评论者', `@${actor}`, actorUrl],
      ['仓库', data.repository?.full_name],
      ['评论时间', formattedTime],
    ],
    actions: [
      { label: '立即查看并回复', href: data.comment.html_url, variant: 'primary' },
      { label: '查看完整讨论', href: data.discussion?.html_url, variant: 'secondary' },
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
