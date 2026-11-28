import { NextResponse } from 'next/server'
import { generateBlogFeed } from '@/lib/feeds'

export const revalidate = 300

export async function GET() {
  const feed = await generateBlogFeed()
  return new NextResponse(feed.rss2(), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  })
}
