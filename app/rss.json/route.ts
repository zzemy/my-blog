import { NextResponse } from 'next/server'
import { generateBlogFeed } from '@/lib/feeds'

export const revalidate = 300

export async function GET() {
  const feed = await generateBlogFeed()
  return new NextResponse(feed.json1(), {
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  })
}
