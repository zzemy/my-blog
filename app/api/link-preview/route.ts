import dns from 'node:dns/promises'
import net from 'node:net'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp, upstashRedis } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const MAX_REDIRECTS = 3
const MAX_HTML_BYTES = 256 * 1024 // 256 KB
const CACHE_TTL_SECONDS = 60 * 10 // 10 minutes

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map((part) => Number(part))
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true
  }
  const [a, b] = parts
  if (a === 0) return true // 0.0.0.0/8
  if (a === 10) return true // 10.0.0.0/8
  if (a === 100 && b >= 64 && b <= 127) return true // 100.64.0.0/10 CGNAT
  if (a === 127) return true // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true // 169.254.0.0/16 link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12
  if (a === 192 && b === 168) return true // 192.168.0.0/16
  if (a === 192 && b === 0) return true // 192.0.0.0/16 reserved
  if (a === 198 && (b === 18 || b === 19)) return true // benchmark
  if (a >= 224) return true // multicast / reserved
  return false
}

function isPrivateIp(rawIp: string): boolean {
  const ip = rawIp.replace(/^\[|\]$/g, '').toLowerCase()
  const ipVersion = net.isIP(ip)

  if (ipVersion === 4) {
    return isPrivateIpv4(ip)
  }

  if (ipVersion === 6) {
    if (ip === '::' || ip === '::1') return true
    if (ip.startsWith('fc') || ip.startsWith('fd')) return true // unique local fc00::/7
    if (/^fe[89ab]/.test(ip)) return true // link-local fe80::/10
    if (ip.startsWith('ff')) return true // multicast
    // IPv4-mapped IPv6 e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1
    if (ip.startsWith('::ffff:')) {
      const mapped = ip.slice('::ffff:'.length)
      if (net.isIP(mapped) === 4) {
        return isPrivateIpv4(mapped)
      }
      return true
    }
    return false
  }

  return true
}

async function assertSafeExternalUrl(urlString: string): Promise<URL | null> {
  let parsed: URL
  try {
    parsed = new URL(urlString)
  } catch {
    return null
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null
  }

  if (parsed.username || parsed.password) {
    return null
  }

  const rawHostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (
    !rawHostname ||
    rawHostname === 'localhost' ||
    rawHostname.endsWith('.localhost') ||
    rawHostname.endsWith('.local') ||
    rawHostname.endsWith('.internal')
  ) {
    return null
  }

  // If hostname is already an IP literal, validate directly
  if (net.isIP(rawHostname) !== 0) {
    return isPrivateIp(rawHostname) ? null : parsed
  }

  // Resolve DNS records and ensure EVERY resolved IP is public (mitigates DNS rebinding / internal aliases)
  try {
    const records = await dns.lookup(rawHostname, { all: true, verbatim: true })
    if (!records.length) return null
    for (const record of records) {
      if (isPrivateIp(record.address)) {
        return null
      }
    }
    return parsed
  } catch {
    return null
  }
}

async function fetchHtmlSafely(initialUrl: string): Promise<{ html: string; finalUrl: string } | null> {
  let currentUrl = initialUrl

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const safeUrl = await assertSafeExternalUrl(currentUrl)
    if (!safeUrl) {
      return null
    }

    const res = await fetch(safeUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1',
      },
      signal: AbortSignal.timeout(5000),
      redirect: 'manual',
    })

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location')
      if (!location || hop === MAX_REDIRECTS) {
        return null
      }
      currentUrl = new URL(location, safeUrl).toString()
      continue
    }

    if (!res.ok) {
      return null
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase()
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      return null
    }

    const reader = res.body?.getReader()
    if (!reader) {
      return null
    }

    const chunks: Uint8Array[] = []
    let totalBytes = 0

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done || !value) break
        totalBytes += value.byteLength
        if (totalBytes > MAX_HTML_BYTES) {
          chunks.push(value.subarray(0, Math.max(0, value.byteLength - (totalBytes - MAX_HTML_BYTES))))
          await reader.cancel()
          break
        }
        chunks.push(value)
      }
    } finally {
      reader.releaseLock()
    }

    const html = new TextDecoder('utf-8', { fatal: false }).decode(Buffer.concat(chunks))
    return { html, finalUrl: safeUrl.toString() }
  }

  return null
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#039;|&apos;/gi, "'")
    .trim()
}

function extractMetaContent(html: string, key: string): string | null {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'),
  ]
  for (const regex of patterns) {
    const match = html.match(regex)
    if (match?.[1]) {
      return decodeHtmlEntities(match[1])
    }
  }
  return null
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match?.[1] ? decodeHtmlEntities(match[1].replace(/\s+/g, ' ')) : null
}

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit({
    namespace: 'link_preview',
    identifier: getClientIp(request),
    limit: 30,
    windowSeconds: 60,
  })
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    )
  }

  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')?.trim()

  if (!url || url.length > 2048) {
    return NextResponse.json({ error: 'Missing or invalid url' }, { status: 400 })
  }

  const safeInitial = await assertSafeExternalUrl(url)
  if (!safeInitial) {
    return NextResponse.json({ error: 'Invalid or forbidden URL' }, { status: 400 })
  }

  const cacheKey = `link_preview:v1:${safeInitial.toString()}`
  if (upstashRedis) {
    try {
      const cached = await upstashRedis.get<Record<string, unknown>>(cacheKey)
      if (cached) {
        return NextResponse.json(cached, {
          headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' },
        })
      }
    } catch {
      // ignore cache read failures
    }
  }

  try {
    const result = await fetchHtmlSafely(safeInitial.toString())
    if (!result) {
      return NextResponse.json({ error: 'Failed to fetch preview' }, { status: 400 })
    }

    const { html, finalUrl } = result
    const title = extractMetaContent(html, 'og:title') || extractTitle(html)
    const description =
      extractMetaContent(html, 'og:description') || extractMetaContent(html, 'description')
    const rawImage = extractMetaContent(html, 'og:image')
    let image: string | null = null
    if (rawImage) {
      try {
        const resolved = new URL(rawImage, finalUrl)
        if (resolved.protocol === 'http:' || resolved.protocol === 'https:') {
          image = resolved.toString()
        }
      } catch {
        image = null
      }
    }

    const payload = { title, description, image, url: finalUrl }

    if (upstashRedis) {
      try {
        await upstashRedis.set(cacheKey, payload, { ex: CACHE_TTL_SECONDS })
      } catch {
        // ignore cache write failures
      }
    }

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' },
    })
  } catch (error) {
    console.error('Link preview error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
