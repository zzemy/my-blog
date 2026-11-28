import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp, upstashRedis } from '@/lib/rate-limit'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const VALID_SLUG_REGEX = /^[a-zA-Z0-9_-]{1,120}$/

function parseSlug(raw: string | null): string | null {
  const value = raw?.trim()
  if (!value || !VALID_SLUG_REGEX.test(value)) return null
  return value
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = parseSlug(searchParams.get('slug'))

  if (!slug) {
    return NextResponse.json({ error: 'Valid slug is required' }, { status: 400 })
  }

  try {
    if (!upstashRedis) {
      return NextResponse.json({ views: 0, likes: 0 })
    }

    const [views, likes] = await upstashRedis.mget<[number, number]>(
      `views:${slug}`,
      `likes:${slug}`,
    )

    return NextResponse.json({
      views: views || 0,
      likes: likes || 0,
    })
  } catch (error) {
    console.error('KV Error:', error)
    return NextResponse.json({ views: 0, likes: 0 })
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = parseSlug(searchParams.get('slug'))
  const type = searchParams.get('type')

  if (!slug || (type !== 'view' && type !== 'like')) {
    return NextResponse.json({ error: 'Valid slug and type are required' }, { status: 400 })
  }

  const clientIp = getClientIp(req)
  const rateLimit = await checkRateLimit({
    namespace: `stats_${type}`,
    identifier: `${clientIp}:${slug}`,
    limit: type === 'like' ? 5 : 20,
    windowSeconds: 60,
  })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    )
  }

  try {
    if (!upstashRedis) {
      return NextResponse.json({ count: 0, views: 0, likes: 0, skipped: true })
    }

    const count =
      type === 'view'
        ? await upstashRedis.incr(`views:${slug}`)
        : await upstashRedis.incr(`likes:${slug}`)

    const otherKey = type === 'view' ? `likes:${slug}` : `views:${slug}`
    const otherVal = (await upstashRedis.get<number>(otherKey)) || 0

    return NextResponse.json({
      count,
      views: type === 'view' ? count : otherVal,
      likes: type === 'like' ? count : otherVal,
    })
  } catch (error) {
    console.error('KV Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
