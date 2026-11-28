import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { getPostBySlug } from '@/lib/supabase/posts'
import { getSiteSettings } from '@/lib/site-settings'

export const runtime = 'nodejs'
export const revalidate = 3600
export const alt = 'Blog Post OpenGraph Image'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

async function loadCjkFont(): Promise<Buffer | null> {
  try {
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'MaShanZheng-Regular.ttf')
    return await readFile(fontPath)
  } catch {
    return null
  }
}

function truncateTitle(title: string, maxLen = 46): string {
  const cleaned = title.trim()
  if (cleaned.length <= maxLen) return cleaned
  return `${cleaned.slice(0, maxLen - 1)}…`
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [post, settings, fontData] = await Promise.all([
    getPostBySlug(slug),
    getSiteSettings(),
    loadCjkFont(),
  ])

  const siteTitle =
    settings.site_title && settings.site_title !== 'My Blog' ? settings.site_title : 'emmm'
  const fontOptions = fontData
    ? [
        {
          name: 'BlogCJK',
          data: fontData,
          style: 'normal' as const,
          weight: 400 as const,
        },
      ]
    : undefined

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: '#111214',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ececef',
            fontFamily: fontData ? 'BlogCJK, sans-serif' : 'sans-serif',
          }}
        >
          <div>{siteTitle}</div>
        </div>
      ),
      { ...size, fonts: fontOptions },
    )
  }

  const displayTitle = truncateTitle(post.title, 44)
  const titleFontSize = displayTitle.length > 26 ? 54 : 66
  const dateText = new Date(post.publishedAt || post.createdAt)
    .toISOString()
    .slice(0, 10)

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #111214 0%, #191b1f 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 80px',
          color: '#ececef',
          fontFamily: fontData ? 'BlogCJK, sans-serif' : 'sans-serif',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: '#f8f8f6',
                color: '#111214',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {siteTitle.slice(0, 1).toUpperCase()}
            </div>
            <span style={{ fontSize: 30, color: '#d4d4d8', letterSpacing: '0.04em' }}>
              {siteTitle}
            </span>
          </div>
          <span style={{ fontSize: 22, color: '#71717a' }}>{dateText}</span>
        </div>

        <div
          style={{
            fontSize: titleFontSize,
            lineHeight: 1.25,
            color: '#fafafa',
            maxWidth: '94%',
          }}
        >
          {displayTitle}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 24, color: '#a1a1aa' }}>
          {(post.tags ?? []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                padding: '6px 16px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontOptions,
    },
  )
}
