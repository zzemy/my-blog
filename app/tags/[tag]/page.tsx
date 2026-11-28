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

  const [posts, allPosts] = await Promise.all([getPostsByTag(decodedTag), getPublishedPosts()])

  const tagCounts = new Map<string, number>()
  for (const item of allPosts) {
    for (const raw of item.tags ?? []) {
      const normalized = raw.trim()
      if (!normalized) continue
      tagCounts.set(normalized, (tagCounts.get(normalized) ?? 0) + 1)
    }
  }
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
    .slice(0, 14)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <nav aria-label="面包屑导航" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          首页
        </Link>
        <span>/</span>
        <Link href="/tags" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
          <ArrowLeft className="h-3 w-3" />
          <span>全部标签</span>
        </Link>
        <span>/</span>
        <span className="text-foreground">#{decodedTag}</span>
      </nav>

      <div className="flex flex-col items-start gap-4 border-b border-border/70 pb-6 dark:border-white/12 md:flex-row md:items-end md:justify-between md:gap-8">
        <div className="flex-1 space-y-2">
          <h1 className="inline-block text-4xl font-bold tracking-tight lg:text-5xl">#{decodedTag}</h1>
          <p className="text-base text-muted-foreground md:text-lg">
            共 {posts.length} 篇文章
          </p>
        </div>
      </div>

      {topTags.length > 1 && (
        <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-2">
          {topTags.map(([name, count]) => {
            const active = name === decodedTag
            return (
              <Link
                key={name}
                href={`/tags/${encodeURIComponent(name)}`}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs no-underline transition-colors ${
                  active
                    ? 'border-foreground bg-foreground text-background font-medium'
                    : 'border-border/70 bg-background/60 text-muted-foreground hover:border-foreground/25 hover:text-foreground'
                }`}
              >
                <span>#{name}</span>
                <span className="font-mono text-[10px] opacity-65">{count}</span>
              </Link>
            )
          })}
        </div>
      )}

      <div className="mt-4">
        <PostList posts={posts} readMoreText="阅读全文" headingLevel="h2" />
      </div>
    </div>
  )
}
