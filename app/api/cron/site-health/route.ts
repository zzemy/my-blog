import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { getAdminClient } from '@/lib/supabase/client'
import { sendAdminNotification } from '@/lib/email/admin-notification'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PostSummaryRow = {
  public_id?: string | null
  slug: string
  title: string
  tags?: string[] | null
  updated_at?: string | null
}

function normalizeEnv(value?: string) {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : undefined
}

const redisUrl = normalizeEnv(process.env.UPSTASH_REDIS_REST_URL) ?? normalizeEnv(process.env.KV_REST_API_URL)
const redisToken = normalizeEnv(process.env.UPSTASH_REDIS_REST_TOKEN) ?? normalizeEnv(process.env.KV_REST_API_TOKEN)
const redis = redisUrl?.startsWith('http') && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const health = await collectSiteHealth()
  const result = await sendAdminNotification({
    subject: '博客站点健康摘要',
    title: '博客站点健康摘要',
    message: health.message,
    lines: [
      ['生成时间', new Date().toISOString()],
      ['已发布文章', String(health.publishedCount)],
      ['草稿数量', String(health.draftsCount)],
      ['累计浏览量', String(health.totalViews)],
      ['热门标签', health.topTags || '暂无'],
      ['最近草稿', health.recentDrafts || '暂无'],
      ['浏览量数据源', redis ? 'Redis/KV' : '未配置 Redis/KV'],
    ],
  })

  return NextResponse.json({ ok: true, health, notification: result })
}

function isAuthorizedCronRequest(request: NextRequest) {
  const secret = normalizeEnv(process.env.SITE_HEALTH_CRON_SECRET) ?? normalizeEnv(process.env.CRON_SECRET)

  if (!secret) {
    return process.env.NODE_ENV !== 'production'
  }

  return request.headers.get('authorization') === `Bearer ${secret}`
}

async function collectSiteHealth() {
  try {
    const client = getAdminClient()
    const { count: publishedCount } = await client
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('published', true)
      .neq('slug', 'about')

    const { count: draftsCount } = await client
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('published', false)

    const { data: publishedPosts } = await client
      .from('posts')
      .select('public_id, slug, title, tags')
      .eq('published', true)
      .neq('slug', 'about')

    const { data: drafts } = await client
      .from('posts')
      .select('title, slug, updated_at')
      .eq('published', false)
      .order('updated_at', { ascending: false })
      .limit(5)

    const posts = (publishedPosts as PostSummaryRow[] | null) ?? []
    const totalViews = await getTotalViews(posts)

    return {
      publishedCount: publishedCount ?? 0,
      draftsCount: draftsCount ?? 0,
      totalViews,
      topTags: formatTopTags(posts),
      recentDrafts: formatRecentDrafts((drafts as PostSummaryRow[] | null) ?? []),
      message: '这是自动生成的博客健康摘要，用于快速确认内容、草稿和浏览量状态。',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      publishedCount: 0,
      draftsCount: 0,
      totalViews: 0,
      topTags: '',
      recentDrafts: '',
      message: `健康摘要生成时遇到错误：${message}`,
    }
  }
}

async function getTotalViews(posts: PostSummaryRow[]) {
  if (!redis || posts.length === 0) return 0

  try {
    const keys = posts.map((post) => `views:${post.public_id || post.slug}`)
    const values = (await redis.mget(...keys)) as unknown[]
    return values.reduce<number>((sum, value) => {
      const count = typeof value === 'number' ? value : Number(value ?? 0)
      return sum + (Number.isFinite(count) ? count : 0)
    }, 0)
  } catch (error) {
    console.error('[SITE_HEALTH] Failed to read Redis views:', error)
    return 0
  }
}

function formatTopTags(posts: PostSummaryRow[]) {
  const counts = new Map<string, number>()
  posts.forEach((post) => {
    post.tags?.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1))
  })

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => `${tag}(${count})`)
    .join(', ')
}

function formatRecentDrafts(drafts: PostSummaryRow[]) {
  return drafts
    .map((draft) => `${draft.title} (${draft.updated_at ? draft.updated_at.slice(0, 10) : 'unknown'})`)
    .join(', ')
}
