import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedPosts } from '@/lib/supabase/posts'

export const revalidate = 60

export const metadata: Metadata = {
  title: '标签',
  description: '按主题标签浏览全部文章。',
}

export default async function TagsPage() {
  const posts = await getPublishedPosts()
  const tagCountMap = new Map<string, number>()

  for (const post of posts) {
    const tags = post.tags || []
    for (const tag of tags) {
      const normalizedTag = tag.trim()
      if (!normalizedTag) continue
      tagCountMap.set(normalizedTag, (tagCountMap.get(normalizedTag) || 0) + 1)
    }
  }

  const sortedTags = Array.from(tagCountMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))
  const maxCount = sortedTags[0]?.count || 1

  const getTagSizeClass = (count: number) => {
    const ratio = count / maxCount
    if (ratio >= 0.8) return 'text-base md:text-lg px-4 py-2.5'
    if (ratio >= 0.5) return 'text-sm md:text-base px-4 py-2'
    return 'text-sm px-3.5 py-1.5'
  }

  const getTagStyleClass = (count: number) => {
    const ratio = count / maxCount
    if (ratio >= 0.8) {
      return 'border-border bg-muted text-foreground'
    }
    if (ratio >= 0.5) {
      return 'border-border/80 bg-muted/70 text-foreground/90'
    }
    return 'border-border/70 bg-muted/40 text-foreground/80'
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <section className="border-b border-border/70 pb-8 dark:border-white/12">
        <div className="flex flex-col items-start gap-5 md:flex-row md:items-end md:justify-between md:gap-8">
          <div className="flex-1 space-y-3">
            <h1 className="inline-block text-4xl font-bold tracking-tight lg:text-5xl">标签</h1>
            <p className="text-base text-muted-foreground md:text-lg">
              按主题标签探索全部写作记录
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-3 py-1 font-mono text-xs text-muted-foreground">
              {sortedTags.length} 个标签
            </span>
            <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-3 py-1 font-mono text-xs text-muted-foreground">
              {posts.length} 篇文章
            </span>
          </div>
        </div>
      </section>

      {sortedTags.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border/70 px-6 py-12 text-center text-muted-foreground">
          暂无标签数据
        </div>
      ) : (
        <section className="mt-8">
          <div className="flex flex-wrap gap-3 md:gap-3.5">
            {sortedTags.map((tag) => (
              <Link
                key={tag.name}
                href={`/tags/${encodeURIComponent(tag.name)}`}
                className={`group inline-flex items-center gap-2 rounded-full border no-underline shadow-xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md ${getTagSizeClass(tag.count)} ${getTagStyleClass(tag.count)}`}
              >
                <span className="font-medium leading-none">#{tag.name}</span>
                <span className="rounded-full border border-border/70 bg-background/80 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                  {tag.count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
