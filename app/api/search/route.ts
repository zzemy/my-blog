import { getPublishedPostsForSearch } from '@/lib/supabase/posts'
import { NextResponse } from 'next/server'

export const revalidate = 60

export async function GET() {
  const posts = await getPublishedPostsForSearch()
  return NextResponse.json(posts, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
