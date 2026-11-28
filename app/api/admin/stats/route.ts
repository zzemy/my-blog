import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import { upstashRedis } from '@/lib/rate-limit'

type PublishedPostMetricRow = {
  id: string
  public_id: string | null
  slug: string
  title: string
  tags: string[] | null
  published_at: string | null
  created_at: string
}

export async function GET(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  const isValid = await validateAdminRequest(token)

  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const client = getAdminClient(token || undefined)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [
      postsCountRes,
      draftsCountRes,
      staleDraftsCountRes,
      publishedPostsRes,
      draftsRes,
      activityRes,
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
        .select('id', { count: 'exact', head: true })
        .eq('published', false)
        .lt('updated_at', thirtyDaysAgoIso),
      client
        .from('posts')
        .select('id, public_id, slug, title, tags, published_at, created_at')
        .eq('published', true)
        .neq('slug', 'about'),
      client
        .from('posts')
        .select('id, title, updated_at')
        .eq('published', false)
        .order('updated_at', { ascending: false })
        .limit(5),
      client
        .from('posts')
        .select('created_at, published_at')
        .gte('created_at', oneYearAgo.toISOString()),
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

    const publishedPosts = (publishedPostsRes.data as PublishedPostMetricRow[] | null) ?? []

    // 从 Upstash Redis 并行读取所有已发布文章的阅读量与点赞数
    let totalViews = 0
    let totalLikes = 0
    let topPosts: Array<{ id: string; routeId: string; title: string; views: number; likes: number }> = []

    if (upstashRedis && publishedPosts.length > 0) {
      try {
        const keys = publishedPosts.flatMap((p) => {
          const routeId = p.public_id || p.slug
          return [`views:${routeId}`, `likes:${routeId}`]
        })
        const values = (await upstashRedis.mget(...keys)) as unknown[]
        const metrics = publishedPosts.map((post, idx) => {
          const rawViews = Number(values[idx * 2] ?? 0)
          const rawLikes = Number(values[idx * 2 + 1] ?? 0)
          const views = Number.isFinite(rawViews) ? rawViews : 0
          const likes = Number.isFinite(rawLikes) ? rawLikes : 0
          totalViews += views
          totalLikes += likes
          return {
            id: post.id,
            routeId: post.public_id || post.slug,
            title: post.title,
            views,
            likes,
          }
        })
        topPosts = metrics
          .filter((item) => item.views > 0 || item.likes > 0)
          .sort((a, b) => b.views - a.views || b.likes - a.likes)
          .slice(0, 5)
      } catch (redisError) {
        console.error('Failed to fetch stats from Redis:', redisError)
      }
    }

    // 标签分布（复用 publishedPosts，不再多打一次数据库）
    const tagCounts: Record<string, number> = {}
    for (const post of publishedPosts) {
      for (const rawTag of post.tags ?? []) {
        const tag = rawTag.trim()
        if (!tag) continue
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      }
    }

    const tags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    return NextResponse.json({
      stats: {
        totalPosts: postsCountRes.count ?? 0,
        draftsCount: draftsCountRes.count ?? 0,
        staleDraftsCount: staleDraftsCountRes.error ? 0 : (staleDraftsCountRes.count ?? 0),
        totalViews,
        totalLikes,
        pendingFriendsCount: pendingFriendsRes.error ? 0 : (pendingFriendsRes.count ?? 0),
        recentAiErrors: recentAiErrorsRes.error ? 0 : (recentAiErrorsRes.count ?? 0),
        redisConfigured: Boolean(upstashRedis),
      },
      topPosts,
      drafts: draftsRes.data ?? [],
      tags,
      activity: activityRes.data ?? [],
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
