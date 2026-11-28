'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowDownAZ, Flame, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagItem {
  name: string
  count: number
}

export function TagsExplorerView({ tags }: { tags: TagItem[] }) {
  const [keyword, setKeyword] = useState('')
  const [sortBy, setSortBy] = useState<'count' | 'alpha'>('count')

  const maxCount = tags[0]?.count || 1

  const filteredTags = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    const matched = q ? tags.filter((t) => t.name.toLowerCase().includes(q)) : tags
    return [...matched].sort((a, b) =>
      sortBy === 'alpha'
        ? a.name.localeCompare(b.name, 'zh-CN')
        : b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'),
    )
  }, [tags, keyword, sortBy])

  const getTagSizeClass = (count: number) => {
    const ratio = count / maxCount
    if (ratio >= 0.8) return 'text-base md:text-lg px-4 py-2.5'
    if (ratio >= 0.5) return 'text-sm md:text-base px-4 py-2'
    return 'text-sm px-3.5 py-1.5'
  }

  const getTagStyleClass = (count: number) => {
    const ratio = count / maxCount
    if (ratio >= 0.8) return 'border-border bg-muted text-foreground'
    if (ratio >= 0.5) return 'border-border/80 bg-muted/70 text-foreground/90'
    return 'border-border/70 bg-muted/40 text-foreground/80'
  }

  return (
    <section className="mt-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索标签…"
            aria-label="搜索标签"
            className="h-9 w-full rounded-lg border border-border/80 bg-background/70 pl-9 pr-8 text-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword('')}
              aria-label="清空搜索"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="inline-flex self-start rounded-lg border border-border/80 bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => setSortBy('count')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors',
              sortBy === 'count'
                ? 'bg-background font-medium text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Flame className="h-3.5 w-3.5" />
            按热度
          </button>
          <button
            type="button"
            onClick={() => setSortBy('alpha')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors',
              sortBy === 'alpha'
                ? 'bg-background font-medium text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <ArrowDownAZ className="h-3.5 w-3.5" />
            按字母
          </button>
        </div>
      </div>

      {filteredTags.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 px-6 py-12 text-center text-sm text-muted-foreground">
          没有找到匹配的标签
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 md:gap-3.5">
          {filteredTags.map((tag) => (
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
      )}
    </section>
  )
}
