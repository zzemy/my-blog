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
 * 基于 Upstash Redis 的固定窗口限流器。
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
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000))
  const key = `rl:${namespace}:${safeId}:${bucket}`

  try {
    const count = await upstashRedis.incr(key)
    if (count === 1) {
      await upstashRedis.expire(key, windowSeconds + 5)
    }

    const remaining = Math.max(0, limit - count)
    const elapsedSeconds = Math.floor(Date.now() / 1000) % windowSeconds
    const retryAfterSeconds = Math.max(1, windowSeconds - elapsedSeconds)

    return {
      allowed: count <= limit,
      remaining,
      retryAfterSeconds,
    }
  } catch (error) {
    console.error(`[RATE_LIMIT:${namespace}] Redis error:`, error)
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 }
  }
}
