import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getPostsByTag, getPublishedPosts } from '@/lib/supabase/posts'
import { PostList } from '@/features/blog/components/shared/post-list'

export const revalidate = 60

function safeDecodeTag(rawTag: string): string | null {
  try {
    return decodeURIComponent(rawTag)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params
  const decodedTag = safeDecodeTag(tag)
  if (!decodedTag) {
    return { title: '标签不存在' }
  }
  return {
    title: `#${decodedTag}`,
    description: `浏览标签 #${decodedTag} 下的全部文章。`,
  }
}

export async function generateStaticParams() {
  const posts = await getPublishedPosts()
  const tagSet = new Set<string>()

  for (const post of posts) {
    const tags = post.tags || []
    for (const tag of tags) {
      const normalizedTag = tag.trim()
      if (normalizedTag) {
        tagSet.add(normalizedTag)
      }
    }
  }

  return Array.from(tagSet).map((tag) => ({ tag }))
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params
  const decodedTag = safeDecodeTag(tag)
  if (!decodedTag) {
    notFound()
  }

  const posts = await getPostsByTag(decodedTag)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <Link
        href="/tags"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>返回全部标签</span>
      </Link>
      <div className="flex flex-col items-start gap-4 border-b border-border/70 pb-8 dark:border-white/12 md:flex-row md:items-end md:justify-between md:gap-8">
        <div className="flex-1 space-y-3">
          <h1 className="inline-block text-4xl font-bold tracking-tight lg:text-5xl">#{decodedTag}</h1>
          <p className="text-base text-muted-foreground md:text-lg">
            共 {posts.length} 篇文章
          </p>
        </div>
      </div>
      <div className="mt-4">
        <PostList posts={posts} readMoreText="阅读全文" />
      </div>
    </div>
  )
}
