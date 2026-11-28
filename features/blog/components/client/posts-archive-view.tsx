'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, LayoutList, Search, X } from 'lucide-react'
import type { PostData } from '@/lib/types'
import { PostList } from '@/features/blog/components/shared/post-list'
import { getPostRouteId } from '@/lib/post-public-id'
import { cn } from '@/lib/utils'

interface PostsArchiveViewProps {
  posts: PostData[]
}

function formatMonthDay(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

export function PostsArchiveView({ posts }: PostsArchiveViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')

  const allTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const post of posts) {
      for (const raw of post.tags ?? []) {
        const tag = raw.trim()
        if (!tag) continue
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
      .map(([name, count]) => ({ name, count }))
  }, [posts])

  const filteredPosts = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    return posts.filter((post) => {
      if (selectedTag && !(post.tags ?? []).includes(selectedTag)) return false
      if (!q) return true
      return (
        post.title.toLowerCase().includes(q) ||
        (post.summary ?? '').toLowerCase().includes(q) ||
        (post.tags ?? []).some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [posts, selectedTag, keyword])

  const groupedByYear = useMemo(() => {
    const groups = new Map<string, PostData[]>()
    for (const post of filteredPosts) {
      const date = new Date(post.date)
      const year = Number.isNaN(date.getTime()) ? '其他' : String(date.getFullYear())
      const list = groups.get(year) ?? []
      list.push(post)
      groups.set(year, list)
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredPosts])

  return (
    <div className="space-y-6">
      {/* 工具栏：搜索 + 视图切换 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="筛选标题、摘要或标签…"
            aria-label="筛选文章"
            className="h-9 w-full rounded-lg border border-border/80 bg-background/70 pl-9 pr-8 text-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword('')}
              aria-label="清空筛选"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {filteredPosts.length} / {posts.length} 篇
          </span>
          <div className="inline-flex rounded-lg border border-border/80 bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors',
                viewMode === 'list'
                  ? 'bg-background font-medium text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutList className="h-3.5 w-3.5" />
              列表
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors',
                viewMode === 'timeline'
                  ? 'bg-background font-medium text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              归档
            </button>
          </div>
        </div>
      </div>

      {/* 标签快速筛选条 */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              selectedTag === null
                ? 'border-foreground bg-foreground text-background font-medium'
                : 'border-border/70 bg-background/60 text-muted-foreground hover:border-foreground/25 hover:text-foreground',
            )}
          >
            全部
          </button>
          {allTags.slice(0, 12).map((tag) => (
            <button
              key={tag.name}
              type="button"
              onClick={() => setSelectedTag((curr) => (curr === tag.name ? null : tag.name))}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors',
                selectedTag === tag.name
                  ? 'border-foreground bg-foreground text-background font-medium'
                  : 'border-border/70 bg-background/60 text-muted-foreground hover:border-foreground/25 hover:text-foreground',
              )}
            >
              <span>#{tag.name}</span>
              <span className="font-mono text-[10px] opacity-65">{tag.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* 内容视图 */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 py-14 text-center text-sm text-muted-foreground">
          没有匹配的文章，试试更换关键词或清除标签筛选。
        </div>
      ) : viewMode === 'list' ? (
        <PostList posts={filteredPosts} readMoreText="阅读全文" />
      ) : (
        <div className="space-y-10 pt-2">
          {groupedByYear.map(([year, yearPosts]) => (
            <section key={year} className="space-y-3">
              <div className="flex items-baseline gap-3 border-b border-border/60 pb-2">
                <h2 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                  {year}
                </h2>
                <span className="font-mono text-xs text-muted-foreground">
                  {yearPosts.length} 篇
                </span>
              </div>
              <ul className="divide-y divide-border/50">
                {yearPosts.map((post) => (
                  <li key={post.id} className="group py-3">
                    <Link
                      href={`/posts/${getPostRouteId(post)}`}
                      className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                    >
                      <div className="flex min-w-0 items-baseline gap-3">
                        <time
                          dateTime={post.date}
                          className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground"
                        >
                          {formatMonthDay(post.date)}
                        </time>
                        <span className="truncate text-base font-medium text-foreground transition-colors group-hover:text-primary">
                          {post.title}
                        </span>
                      </div>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex shrink-0 flex-wrap gap-1.5 pl-12 sm:pl-0">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs text-muted-foreground">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
