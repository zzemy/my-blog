'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Content } from '@tiptap/react'
import { Languages } from 'lucide-react'
import { PostLayout } from '@/features/blog/components/client/post-layout'
import { FadeIn } from '@/shared/visuals/fade-in'
import { TipTapRenderer } from '@/features/blog/editor/tiptap-renderer'
import { PostBreadcrumb } from '@/features/blog/components/shared/post-breadcrumb'
import { ShareButtons } from '@/features/blog/components/client/share-buttons'
import { PostStats } from '@/features/blog/components/client/post-stats'
import { Comments } from '@/features/blog/components/client/comments'
import { AiSummaryCard } from '@/features/blog/components/client/ai-summary-card'
import type { TocItem } from '@/features/blog/utils/toc'
import { getLocaleNativeLabel, type AiSummaryData } from '@/lib/ai/types'

export interface PostLocaleVariant {
  locale: string
  title: string
  description: string | null
  content: Content
  aiSummary: AiSummaryData | null
  toc: TocItem[]
}

interface PostReaderViewProps {
  original: PostLocaleVariant
  translations: PostLocaleVariant[]
  publishedDateIso: string
  readingTime: string | null
  tags: string[]
  routeId: string
}

export function PostReaderView({
  original,
  translations,
  publishedDateIso,
  readingTime,
  tags,
  routeId,
}: PostReaderViewProps) {
  const [activeLocale, setActiveLocale] = useState<string>('original')

  // 支持通过 ?lang=en 链接直接打开对应译文
  useEffect(() => {
    if (translations.length === 0) return
    const params = new URLSearchParams(window.location.search)
    const requested = params.get('lang')
    if (!requested) return
    const matched = translations.find(
      (item) => item.locale.toLowerCase() === requested.toLowerCase(),
    )
    if (matched) {
      setActiveLocale(matched.locale)
    }
  }, [translations])

  const activeVariant =
    activeLocale === 'original'
      ? original
      : translations.find((item) => item.locale === activeLocale) ?? original

  const handleSelectLocale = (nextLocale: string) => {
    setActiveLocale(nextLocale)
    try {
      const url = new URL(window.location.href)
      if (nextLocale === 'original') {
        url.searchParams.delete('lang')
      } else {
        url.searchParams.set('lang', nextLocale)
      }
      window.history.replaceState(null, '', url.toString())
    } catch {
      // ignore URL update failures
    }
  }

  return (
    <PostLayout toc={activeVariant.toc}>
      <FadeIn>
        <PostBreadcrumb title={activeVariant.title} />

        <article className="article-shell">
          <div className="article-hero">
            {translations.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Languages className="h-3.5 w-3.5" />
                  语言：
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectLocale('original')}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    activeVariant.locale === 'original'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background/70 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {getLocaleNativeLabel('original')}
                </button>
                {translations.map((item) => (
                  <button
                    key={item.locale}
                    type="button"
                    onClick={() => handleSelectLocale(item.locale)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      activeVariant.locale === item.locale
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background/70 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {getLocaleNativeLabel(item.locale)}
                  </button>
                ))}
              </div>
            )}

            <h1 className="article-title text-3xl md:text-4xl lg:text-5xl">
              {activeVariant.title}
            </h1>

            <div className="article-meta-row">
              <div className="flex min-w-0 flex-1 flex-col items-start gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
                <time
                  dateTime={publishedDateIso}
                  className="block min-w-0 truncate whitespace-nowrap text-sm"
                >
                  {new Date(publishedDateIso).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                {readingTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="hidden sm:inline">•</span>
                    <span className="sm:inline">{readingTime}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-shrink-0 items-center gap-4">
                <PostStats slug={routeId} />
                <ShareButtons url={`https://blog.zzemy.top/posts/${routeId}`} />
              </div>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((tag) => (
                  <Link key={tag} href={`/tags/${tag}`} className="no-underline">
                    <span className="article-tag">#{tag}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {activeVariant.aiSummary && (
            <AiSummaryCard summary={activeVariant.aiSummary} locale={activeVariant.locale} />
          )}

          <TipTapRenderer
            key={activeVariant.locale}
            className="mt-10"
            content={activeVariant.content}
            toc={activeVariant.toc}
          />

          <div className="mt-12 border-t pt-10">
            <Comments />
          </div>
        </article>
      </FadeIn>
    </PostLayout>
  )
}
