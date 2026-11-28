import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/client'
import {
  formatBeijingDate,
  formatBeijingDateTime,
  sendAdminNotification,
  type NotificationHighlightLink,
  type NotificationSection,
  type NotificationStatusItem,
  type NotificationTag,
} from '@/lib/email/admin-notification'
import { upstashRedis } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PostSummaryRow = {
  id?: string
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

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const siteUrl = getSiteUrl()
  const health = await collectSiteHealth(siteUrl)

  const sections: NotificationSection[] = []

  // 1. 热门文章（可点击直达）
  if (health.topPosts.length > 0) {
    sections.push({
      title: '最受关注的文章',
      links: health.topPosts.map<NotificationHighlightLink>((post) => ({
        title: post.title,
        subtitle: `发布于 ${formatBeijingDate(post.published_at || post.created_at)}`,
        badge: `${post.views} 阅读 · ${post.likes} 赞`,
        href: post.url,
      })),
    })
  }

  // 2. 待办与草稿提醒（可点击直达编辑器 / 友链后台）
  const todoLinks: NotificationHighlightLink[] = []
  if (health.pendingFriendsCount > 0) {
    todoLinks.push({
      title: `有 ${health.pendingFriendsCount} 条友链申请等待审核`,
      subtitle: '前往友链管理页查看详情并处理',
      badge: '待处理',
      href: `${siteUrl}/admin/friends`,
    })
  }
  for (const draft of health.staleDrafts) {
    todoLinks.push({
      title: draft.title || '未命名草稿',
      subtitle: `超过 30 天未更新 · 最后编辑 ${formatBeijingDate(draft.updated_at || draft.created_at)}`,
      badge: '积压草稿',
      href: draft.id ? `${siteUrl}/admin/posts/${draft.id}` : `${siteUrl}/admin/posts`,
    })
  }
  for (const draft of health.recentDrafts) {
    todoLinks.push({
      title: draft.title || '未命名草稿',
      subtitle: `最近编辑于 ${formatBeijingDate(draft.updated_at || draft.created_at)}`,
      badge: '近期草稿',
      href: draft.id ? `${siteUrl}/admin/posts/${draft.id}` : `${siteUrl}/admin/posts`,
    })
  }

  sections.push({
    title: '待办与草稿提醒',
    links: todoLinks.length > 0 ? todoLinks : undefined,
    items: todoLinks.length === 0 ? ['当前没有积压草稿或待审友链，一切井然有序。'] : undefined,
  })

  // 3. 热门标签与最近发布
  if (health.topTags.length > 0 || health.recentPublished.length > 0) {
    sections.push({
      title: '内容脉络',
      links: health.recentPublished.map<NotificationHighlightLink>((post) => ({
        title: post.title,
        subtitle: `最近发布 · ${formatBeijingDate(post.published_at || post.created_at)}`,
        href: `${siteUrl}/posts/${post.public_id || post.slug}`,
      })),
      tags: health.topTags,
    })
  }

  // 4. 系统状态
  const statusItems: NotificationStatusItem[] = [
    {
      label: 'Supabase 数据库',
      status: health.supabaseOk ? '运行正常' : '查询异常',
      tone: health.supabaseOk ? 'ok' : 'warn',
    },
    {
      label: 'Upstash Redis 阅读统计',
      status: upstashRedis ? '已连接' : '未配置',
      tone: upstashRedis ? 'ok' : 'muted',
    },
    {
      label: '近 7 天 AI 异常调用',
      status: health.recentAiErrors > 0 ? `${health.recentAiErrors} 次失败` : '0 次异常',
      tone: health.recentAiErrors > 0 ? 'warn' : 'ok',
    },
  ]

  sections.push({
    title: '站点运行状态',
    statusItems,
  })

  const result = await sendAdminNotification({
    category: 'weekly',
    badge: '每周简报',
    subject: `博客周报 · ${formatBeijingDate()}（${health.publishedCount} 篇文章 / ${health.totalViews} 阅读）`,
    title: '本周博客运行与内容简报',
    subtitle: `统计截止 ${formatBeijingDateTime()}`,
    preheader: `已发布 ${health.publishedCount} 篇 · 累计 ${health.totalViews} 次阅读 · ${health.draftsCount} 篇草稿`,
    message: health.message,
    siteUrl,
    metrics: [
      { label: '已发布', value: String(health.publishedCount), hint: '篇正文' },
      { label: '草稿箱', value: String(health.draftsCount), hint: health.staleDrafts.length ? `${health.staleDrafts.length} 篇超 30 天` : '无积压' },
      { label: '累计阅读', value: formatCompactNumber(health.totalViews), hint: 'Redis 统计' },
      { label: '累计点赞', value: formatCompactNumber(health.totalLikes), hint: health.pendingFriendsCount ? `${health.pendingFriendsCount} 条待审友链` : '互动总数' },
    ],
    sections,
    actions: [
      { label: '打开博客后台', href: `${siteUrl}/admin`, variant: 'primary' },
      { label: '管理文章与草稿', href: `${siteUrl}/admin/posts`, variant: 'secondary' },
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

async function collectSiteHealth(siteUrl: string) {
  try {
    const client = getAdminClient()
    const staleBeforeIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
      publishedCountRes,
      draftsCountRes,
      publishedPostsRes,
      recentDraftsRes,
      staleDraftsRes,
      pendingFriendsRes,
      recentAiErrorsRes,
    ] = await Promise.all([
      client
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('published', true)
        .neq('slug', 'about'),
      client
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('published', false),
      client
        .from('posts')
        .select('id, public_id, slug, title, tags, published_at, updated_at, created_at')
        .eq('published', true)
        .neq('slug', 'about')
        .order('published_at', { ascending: false }),
      client
        .from('posts')
        .select('id, title, slug, updated_at, created_at')
        .eq('published', false)
        .gte('updated_at', staleBeforeIso)
        .order('updated_at', { ascending: false })
        .limit(3),
      client
        .from('posts')
        .select('id, title, slug, updated_at, created_at')
        .eq('published', false)
        .lt('updated_at', staleBeforeIso)
        .order('updated_at', { ascending: true })
        .limit(5),
      client
        .from('friend_links')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      client
        .from('ai_generation_logs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'error')
        .gte('created_at', sevenDaysAgoIso),
    ])

    const posts = (publishedPostsRes.data as PostSummaryRow[] | null) ?? []
    const metrics = await getPostMetrics(posts, siteUrl)
    const totalViews = metrics.reduce((sum, post) => sum + post.views, 0)
    const totalLikes = metrics.reduce((sum, post) => sum + post.likes, 0)
    const topPosts = metrics
      .filter((post) => post.views > 0 || post.likes > 0)
      .sort((a, b) => b.views - a.views || b.likes - a.likes)
      .slice(0, 5)

    const recentDrafts = (recentDraftsRes.data as PostSummaryRow[] | null) ?? []
    const staleDrafts = (staleDraftsRes.data as PostSummaryRow[] | null) ?? []
    const pendingFriendsCount = pendingFriendsRes.error ? 0 : (pendingFriendsRes.count ?? 0)
    const recentAiErrors = recentAiErrorsRes.error ? 0 : (recentAiErrorsRes.count ?? 0)

    return {
      supabaseOk: !publishedPostsRes.error,
      publishedCount: publishedCountRes.count ?? 0,
      draftsCount: draftsCountRes.count ?? 0,
      totalViews,
      totalLikes,
      pendingFriendsCount,
      recentAiErrors,
      topTags: collectTopTags(posts),
      topPosts,
      recentDrafts,
      staleDrafts,
      recentPublished: posts.slice(0, 3),
      message: buildHealthMessage({
        topPostsCount: topPosts.length,
        staleDraftsCount: staleDrafts.length,
        pendingFriendsCount,
        recentAiErrors,
      }),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      supabaseOk: false,
      publishedCount: 0,
      draftsCount: 0,
      totalViews: 0,
      totalLikes: 0,
      pendingFriendsCount: 0,
      recentAiErrors: 0,
      topTags: [] as NotificationTag[],
      topPosts: [] as PostMetric[],
      recentDrafts: [] as PostSummaryRow[],
      staleDrafts: [] as PostSummaryRow[],
      recentPublished: [] as PostSummaryRow[],
      message: `健康摘要生成时遇到错误：${message}`,
    }
  }
}

async function getPostMetrics(posts: PostSummaryRow[], siteUrl: string): Promise<PostMetric[]> {
  const baseMetrics = posts.map((post) => {
    const routeId = post.public_id || post.slug
    return {
      ...post,
      routeId,
      views: 0,
      likes: 0,
      url: `${siteUrl}/posts/${routeId}`,
    }
  })

  if (!upstashRedis || posts.length === 0) return baseMetrics

  try {
    const keys = posts.flatMap((post) => {
      const routeId = post.public_id || post.slug
      return [`views:${routeId}`, `likes:${routeId}`]
    })
    const values = (await upstashRedis.mget(...keys)) as unknown[]
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

function formatCompactNumber(num: number): string {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}w`
  return num.toLocaleString('zh-CN')
}

function collectTopTags(posts: PostSummaryRow[]): NotificationTag[] {
  const counts = new Map<string, number>()
  posts.forEach((post) => {
    post.tags?.forEach((tag) => {
      const cleaned = tag.trim()
      if (cleaned) counts.set(cleaned, (counts.get(cleaned) ?? 0) + 1)
    })
  })

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }))
}

function buildHealthMessage({
  topPostsCount,
  staleDraftsCount,
  pendingFriendsCount,
  recentAiErrors,
}: {
  topPostsCount: number
  staleDraftsCount: number
  pendingFriendsCount: number
  recentAiErrors: number
}) {
  const highlights: string[] = []
  if (pendingFriendsCount > 0) highlights.push(`有 ${pendingFriendsCount} 条待审核友链`)
  if (staleDraftsCount > 0) highlights.push(`${staleDraftsCount} 篇草稿已超过 30 天未编辑`)
  if (recentAiErrors > 0) highlights.push(`近 7 天出现 ${recentAiErrors} 次 AI 调用异常`)

  if (highlights.length === 0) {
    return topPostsCount > 0
      ? '过去一周站点运行平稳，以下是最受读者关注的内容与近况汇总。'
      : '过去一周站点运行平稳，没有待处理告警，继续保持写作节奏吧。'
  }

  return `本周重点提醒：${highlights.join('，')}。以下是完整运行摘要。`
}

function getSiteUrl() {
  return normalizeEnv(process.env.NEXT_PUBLIC_SITE_URL) || 'https://blog.zzemy.top'
}
