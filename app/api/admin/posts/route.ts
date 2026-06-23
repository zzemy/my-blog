import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequestWithReason } from '@/lib/auth'
import { Redis } from '@upstash/redis'
import { createPostSchema } from '@/lib/validation/post'
import { generatePostPublicId } from '@/lib/post-public-id'
import { revalidatePostMutation } from '@/lib/revalidation/posts'

function normalizeEnv(value?: string) {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : undefined
}

const redisUrl = normalizeEnv(process.env.UPSTASH_REDIS_REST_URL) ?? normalizeEnv(process.env.KV_REST_API_URL)
const redisToken = normalizeEnv(process.env.UPSTASH_REDIS_REST_TOKEN) ?? normalizeEnv(process.env.KV_REST_API_TOKEN)
const redisEnabled = Boolean(redisUrl?.startsWith('http') && redisToken)
const redis = redisEnabled ? new Redis({ url: redisUrl!, token: redisToken! }) : null

type PostWithSlugAndViews = {
  public_id?: string | null
  slug: string
  views?: number
}

function getPostStatsKey(post: Pick<PostWithSlugAndViews, 'public_id' | 'slug'>) {
  return post.public_id || post.slug
}

async function generateUniquePostPublicId(client: ReturnType<typeof getAdminClient>) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const publicId = generatePostPublicId()
    const { data, error } = await client
      .from('posts')
      .select('public_id')
      .eq('public_id', publicId)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      return publicId
    }
  }

  throw new Error('Failed to generate a unique post public id')
}

// GET - 获取所有文章列表（需要认证）
export async function GET(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  const auth = await validateAdminRequestWithReason(token)
  if (!auth.ok) {
    return NextResponse.json(
      { error: 'Unauthorized', reason: auth.reason, email: auth.email || null, expected: auth.expected || null },
      { status: 401 }
    )
  }
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || 'zh'
    const tag = searchParams.get('tag')
    const published = searchParams.get('published') !== 'false' // 默认只获取已发布的

    const client = getAdminClient(token || undefined)

    let query = client
      .from('posts')
      .select('*')
      .eq('locale', locale)
      .order('published_at', { ascending: false })

    if (published) {
      query = query.eq('published', true)
    }

    if (tag) {
      query = query.contains('tags', [tag])
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 从 Redis 获取每篇文章的实时浏览量（仅在配置存在时）
    if (redisEnabled && redis && data && data.length > 0) {
      try {
        const keys = (data as PostWithSlugAndViews[]).map((post) => `views:${getPostStatsKey(post)}`)
        const views = await redis.mget(keys)

        ;(data as PostWithSlugAndViews[]).forEach((post, index: number) => {
          const viewCount = views[index]
          post.views = viewCount ? Number(viewCount) : 0
        })
      } catch (redisError) {
        console.error('Failed to fetch views from Redis:', redisError)
        // 即使 Redis 失败，也返回文章列表
      }
    }

    return NextResponse.json({ posts: data })
  } catch (error) {
    console.error('Error in GET /api/admin/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 创建新文章（需要认证）
export async function POST(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  const auth = await validateAdminRequestWithReason(token)
  if (!auth.ok) {
    return NextResponse.json(
      { error: 'Unauthorized', reason: auth.reason, email: auth.email || null, expected: auth.expected || null },
      { status: 401 }
    )
  }
  
  try {
    const client = getAdminClient(token || undefined)
    const rawBody: unknown = await request.json()
    const parsedBody = createPostSchema.safeParse(rawBody)

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      )
    }

    const body = parsedBody.data
    const {
      title,
      slug,
      description,
      content,
      cover_image,
      author,
      locale,
      tags,
      published,
      featured,
      reading_time,
    } = body

    // 检查 slug 是否已存在
    const { data: existingPost } = await client
      .from('posts')
      .select('slug')
      .eq('slug', slug)
      .single()

    if (existingPost) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }

    const publicId = await generateUniquePostPublicId(client)

    // 创建新文章
    const { data, error } = await client
      .from('posts')
      .insert({
        public_id: publicId,
        title,
        slug,
        description,
        content,
        cover_image,
        author,
        locale,
        tags,
        published,
        featured,
        reading_time,
        // 若前端提供发布时间则尊重该值；否则在发布时使用当前时间
        published_at: published ? (body.published_at ?? new Date().toISOString()) : null,
      } as never)
      .select()
      .single()

    if (error) {
      console.error('Error creating post:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    revalidatePostMutation({
      after: {
        locale,
        publicId,
        slug,
        tags,
      },
    })

    return NextResponse.json({ post: data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
