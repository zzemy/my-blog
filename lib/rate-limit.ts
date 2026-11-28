import { Redis } from '@upstash/redis'
import type { NextRequest } from 'next/server'

function normalizeEnv(value?: string) {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : undefined
}

const redisUrl =
  normalizeEnv(process.env.UPSTASH_REDIS_REST_URL) ??
  normalizeEnv(process.env.KV_REST_API_URL)
const redisToken =
  normalizeEnv(process.env.UPSTASH_REDIS_REST_TOKEN) ??
  normalizeEnv(process.env.KV_REST_API_TOKEN)

export const upstashRedis =
  redisUrl?.startsWith('http') && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null

export function getClientIp(request: Request | NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  const cfIp = request.headers.get('cf-connecting-ip')?.trim()
  if (cfIp) return cfIp
  return 'unknown'
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * 基于 Upstash Redis 的加权滑动窗口限流器（消除固定窗口边界突发）。
 * 未配置 Redis 或 Redis 瞬时异常时降级放行，不阻塞核心功能。
 */
export async function checkRateLimit({
  namespace,
  identifier,
  limit,
  windowSeconds,
}: {
  namespace: string
  identifier: string
  limit: number
  windowSeconds: number
}): Promise<RateLimitResult> {
  if (!upstashRedis) {
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 }
  }

  const safeId = identifier.replace(/[^a-zA-Z0-9._:-]/g, '_').slice(0, 120) || 'anonymous'
  const windowMs = windowSeconds * 1000
  const now = Date.now()
  const currentBucket = Math.floor(now / windowMs)
  const previousBucket = currentBucket - 1
  const currentKey = `rl:${namespace}:${safeId}:${currentBucket}`
  const previousKey = `rl:${namespace}:${safeId}:${previousBucket}`

  try {
    const [prevCountRaw, currCountRaw] = await upstashRedis.mget<[number | null, number | null]>(
      previousKey,
      currentKey,
    )
    const prevCount = Number(prevCountRaw ?? 0)
    const currCount = Number(currCountRaw ?? 0)
    const elapsedMs = now % windowMs
    const previousWeight = (windowMs - elapsedMs) / windowMs
    const estimatedBefore = prevCount * previousWeight + currCount

    if (estimatedBefore >= limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - elapsedMs) / 1000))
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
      }
    }

    const updatedCurr = await upstashRedis.incr(currentKey)
    if (updatedCurr === 1) {
      await upstashRedis.expire(currentKey, windowSeconds * 2 + 10)
    }

    const estimatedAfter = prevCount * previousWeight + updatedCurr
    const remaining = Math.max(0, Math.floor(limit - estimatedAfter))
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - elapsedMs) / 1000))

    return {
      allowed: estimatedAfter <= limit,
      remaining,
      retryAfterSeconds,
    }
  } catch (error) {
    console.error(`[RATE_LIMIT:${namespace}] Redis error:`, error)
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 }
  }
}
