import { getPublishedPosts } from '@/lib/supabase/posts';
import { NextResponse } from 'next/server';

export const revalidate = 60;

export async function GET() {
  const posts = await getPublishedPosts();

  return NextResponse.json(posts);
}

export function generateStaticParams() {
  return [];
}
