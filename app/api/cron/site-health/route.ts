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
  published_at?: string | null
  created_at?: string | null
}

type PostMetric = PostSummaryRow & {
  routeId: string
  views: number
  likes: number
  url: string
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
    subject: '博客周报：内容与站点状态',
    title: '博客周报',
    message: health.message,
    lines: [
      ['生成时间', new Date().toISOString()],
      ['已发布文章', String(health.publishedCount)],
      ['草稿数量', String(health.draftsCount)],
      ['累计浏览量', String(health.totalViews)],
      ['累计点赞', String(health.totalLikes)],
    ],
    sections: [
      {
        title: '最值得关注的文章',
        lines: health.topPosts.map((post) => [
          post.title,
          `${post.views} views · ${post.likes} likes\n${post.url}`,
        ]),
        items: health.topPosts.length ? undefined : ['暂无浏览量数据。'],
      },
      {
        title: '草稿提醒',
        items: [
          ...health.recentDrafts.map((draft) => `最近草稿：${draft}`),
          ...health.staleDrafts.map((draft) => `超过 30 天未处理：${draft}`),
          ...(health.recentDrafts.length || health.staleDrafts.length ? [] : ['暂无草稿。']),
        ],
      },
      {
        title: '内容分布',
        lines: [
          ['热门标签', health.topTags || '暂无'],
          ['最近发布', health.recentPublished || '暂无'],
        ],
      },
      {
        title: '系统状态',
        lines: [
          ['Redis/KV 浏览量', redis ? '已配置' : '未配置'],
          ['Supabase 查询', health.supabaseOk ? '正常' : '异常'],
          ['邮件通知', '已触发本次摘要发送'],
        ],
      },
    ],
    action: {
      label: '打开博客后台',
      href: `${getSiteUrl()}/admin`,
    },
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
      .select('public_id, slug, title, tags, published_at, updated_at, created_at')
      .eq('published', true)
      .neq('slug', 'about')
      .order('published_at', { ascending: false })

    const { data: drafts } = await client
      .from('posts')
      .select('title, slug, updated_at, created_at')
      .eq('published', false)
      .order('updated_at', { ascending: false })
      .limit(5)

    const posts = (publishedPosts as PostSummaryRow[] | null) ?? []
    const metrics = await getPostMetrics(posts)
    const totalViews = metrics.reduce((sum, post) => sum + post.views, 0)
    const totalLikes = metrics.reduce((sum, post) => sum + post.likes, 0)
    const draftRows = (drafts as PostSummaryRow[] | null) ?? []

    return {
      supabaseOk: true,
      publishedCount: publishedCount ?? 0,
      draftsCount: draftsCount ?? 0,
      totalViews,
      totalLikes,
      topTags: formatTopTags(posts),
      topPosts: metrics
        .filter((post) => post.views > 0 || post.likes > 0)
        .sort((a, b) => b.views - a.views || b.likes - a.likes)
        .slice(0, 5),
      recentDrafts: formatRecentDrafts(draftRows),
      staleDrafts: formatStaleDrafts(draftRows),
      recentPublished: formatRecentPublished(posts),
      message: '这一封只保留需要你做判断的信息：哪些文章有人看，哪些草稿该清，系统采集是否正常。',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      supabaseOk: false,
      publishedCount: 0,
      draftsCount: 0,
      totalViews: 0,
      totalLikes: 0,
      topTags: '',
      topPosts: [] as PostMetric[],
      recentDrafts: [] as string[],
      staleDrafts: [] as string[],
      recentPublished: '',
      message: `健康摘要生成时遇到错误：${message}`,
    }
  }
}

async function getPostMetrics(posts: PostSummaryRow[]): Promise<PostMetric[]> {
  const baseMetrics = posts.map((post) => {
    const routeId = post.public_id || post.slug
    return {
      ...post,
      routeId,
      views: 0,
      likes: 0,
      url: `${getSiteUrl()}/posts/${routeId}`,
    }
  })

  if (!redis || posts.length === 0) return baseMetrics

  try {
    const keys = posts.flatMap((post) => {
      const routeId = post.public_id || post.slug
      return [`views:${routeId}`, `likes:${routeId}`]
    })
    const values = (await redis.mget(...keys)) as unknown[]
    return baseMetrics.map((post, index) => ({
      ...post,
      views: toCount(values[index * 2]),
      likes: toCount(values[index * 2 + 1]),
    }))
  } catch (error) {
    console.error('[SITE_HEALTH] Failed to read Redis metrics:', error)
    return baseMetrics
  }
}

function toCount(value: unknown) {
  const count = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isFinite(count) ? count : 0
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
    .slice(0, 3)
    .map((draft) => `${draft.title}，更新于 ${formatDate(draft.updated_at || draft.created_at)}`)
}

function formatStaleDrafts(drafts: PostSummaryRow[]) {
  const staleBefore = Date.now() - 30 * 24 * 60 * 60 * 1000
  return drafts
    .filter((draft) => {
      const time = new Date(draft.updated_at || draft.created_at || '').getTime()
      return Number.isFinite(time) && time < staleBefore
    })
    .slice(0, 3)
    .map((draft) => `${draft.title}，最后更新 ${formatDate(draft.updated_at || draft.created_at)}`)
}

function formatRecentPublished(posts: PostSummaryRow[]) {
  return posts
    .filter((post) => post.published_at || post.created_at)
    .slice(0, 3)
    .map((post) => `${post.title} (${formatDate(post.published_at || post.created_at)})`)
    .join(', ')
}

function formatDate(value?: string | null) {
  if (!value) return 'unknown'
  return value.slice(0, 10)
}

function getSiteUrl() {
  return normalizeEnv(process.env.NEXT_PUBLIC_SITE_URL) || 'https://blog.zzemy.top'
}
