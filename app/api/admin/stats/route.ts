import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import { Redis } from '@upstash/redis'

function normalizeEnv(value?: string) {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : undefined
}

const redisUrl = normalizeEnv(process.env.UPSTASH_REDIS_REST_URL) ?? normalizeEnv(process.env.KV_REST_API_URL)
const redisToken = normalizeEnv(process.env.UPSTASH_REDIS_REST_TOKEN) ?? normalizeEnv(process.env.KV_REST_API_TOKEN)
const redisEnabled = Boolean(redisUrl?.startsWith('http') && redisToken)
const redis = redisEnabled ? new Redis({ url: redisUrl!, token: redisToken! }) : null

export async function GET(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  const isValid = await validateAdminRequest(token)
  
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const client = getAdminClient(token || undefined)
    // 1. Overview Counts
    const { count: postsCount } = await client.from('posts').select('*', { count: 'exact', head: true }).eq('published', true)
    const { count: draftsCount } = await client.from('posts').select('*', { count: 'exact', head: true }).eq('published', false)
    
    // 获取所有文章的 slug，然后从 Redis 读取真实阅读量
    const { data: allPosts } = await client
      .from('posts')
      .select('slug')
      .eq('published', true)

    let totalViews = 0
    const postsArray = (allPosts as { slug: string }[] | null) ?? []
    if (redis && postsArray.length > 0) {
      try {
        const keys = postsArray.map((p) => `views:${p.slug}`)
        const viewsUnknown = (await redis.mget(...keys)) as unknown[]
        const viewsArray = viewsUnknown.map((v) => {
          if (v == null) return null
          if (typeof v === 'number') return v
          const n = Number(v)
          return Number.isFinite(n) ? n : null
        }) as (number | null)[]
        totalViews = viewsArray.reduce((sum: number, val) => sum + (val ?? 0), 0)
      } catch (redisError) {
        console.error('Failed to fetch views from Redis:', redisError)
      }
    }

    // 2. Drafts List
    const { data: drafts } = await client
      .from('posts')
      .select('id, title, updated_at')
      .eq('published', false)
      .order('updated_at', { ascending: false })
      .limit(5)

    // 3. Tag Distribution (Calculate from posts directly to ensure accuracy)
    const { data: postsWithTags } = await client
      .from('posts')
      .select('tags')
      .not('tags', 'is', null)

    const tagCounts: Record<string, number> = {};
    (postsWithTags as { tags: string[] }[] | null)?.forEach(post => {
      post.tags?.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    const tags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    // 4. Activity (Dates for heatmap/trend)
    // Get last 365 days of posts created_at
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const { data: activityData } = await client
      .from('posts')
      .select('created_at, published_at')
      .gte('created_at', oneYearAgo.toISOString())

    return NextResponse.json({
      stats: {
        totalPosts: postsCount || 0,
        draftsCount: draftsCount || 0,
        totalViews: totalViews
      },
      drafts,
      tags,
      activity: activityData
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
