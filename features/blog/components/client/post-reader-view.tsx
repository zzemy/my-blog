'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { Content } from '@tiptap/react'
import { ArrowLeft, ArrowRight, BookOpen, CalendarClock, Languages, Scale, User } from 'lucide-react'
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
  ssrHtml: string
  wordCount: number
  aiSummary: AiSummaryData | null
  toc: TocItem[]
}

export interface NeighborPostLink {
  routeId: string
  title: string
  date: string
}

export interface RelatedPostLink {
  routeId: string
  title: string
  description?: string
  date: string
  tags: string[]
}

interface PostReaderViewProps {
  original: PostLocaleVariant
  translations: PostLocaleVariant[]
  publishedDateIso: string
  updatedDateIso?: string | null
  coverImage?: string | null
  author?: string | null
  tags: string[]
  routeId: string
  siteUrl: string
  siteTitle?: string
  commentsEnabled?: boolean
  prevPost?: NeighborPostLink | null
  nextPost?: NeighborPostLink | null
  relatedPosts?: RelatedPostLink[]
}

type ReaderCopy = {
  home: string
  posts: string
  language: string
  toc: string
  share: string
  updated: string
  prev: string
  next: string
  related: string
  licensePrefix: string
  dateLocale: string
  giscusLang: string
  htmlLang: string
  formatReading: (chars: number) => string
}

const READER_COPY: Record<string, ReaderCopy> = {
  zh: {
    home: '首页',
    posts: '文章',
    language: '语言：',
    toc: '目录',
    share: '分享',
    updated: '更新于',
    prev: '上一篇',
    next: '下一篇',
    related: '相关阅读',
    licensePrefix: '本文采用 CC BY-NC-SA 4.0 协议发布，转载请注明出处。',
    dateLocale: 'zh-CN',
    giscusLang: 'zh-CN',
    htmlLang: 'zh-CN',
    formatReading: (chars) => {
      const mins = Math.max(1, Math.ceil(chars / 350))
      return `${chars.toLocaleString()} 字 · 约 ${mins} 分钟`
    },
  },
  'zh-tw': {
    home: '首頁',
    posts: '文章',
    language: '語言：',
    toc: '目錄',
    share: '分享',
    updated: '更新於',
    prev: '上一篇',
    next: '下一篇',
    related: '相關閱讀',
    licensePrefix: '本文採用 CC BY-NC-SA 4.0 協議發佈，轉載請註明出處。',
    dateLocale: 'zh-TW',
    giscusLang: 'zh-TW',
    htmlLang: 'zh-TW',
    formatReading: (chars) => {
      const mins = Math.max(1, Math.ceil(chars / 350))
      return `${chars.toLocaleString()} 字 · 約 ${mins} 分鐘`
    },
  },
  en: {
    home: 'Home',
    posts: 'Posts',
    language: 'Language:',
    toc: 'Contents',
    share: 'Share',
    updated: 'Updated',
    prev: 'Previous',
    next: 'Next',
    related: 'Related Readings',
    licensePrefix: 'Published under CC BY-NC-SA 4.0. Please credit the source when sharing.',
    dateLocale: 'en-US',
    giscusLang: 'en',
    htmlLang: 'en',
    formatReading: (chars) => {
      const mins = Math.max(1, Math.ceil(chars / 1000))
      return `~${mins} min read`
    },
  },
  ja: {
    home: 'ホーム',
    posts: '記事',
    language: '言語：',
    toc: '目次',
    share: '共有',
    updated: '更新日',
    prev: '前の記事',
    next: '次の記事',
    related: '関連記事',
    licensePrefix: '本記事は CC BY-NC-SA 4.0 ライセンスの下で公開されています。',
    dateLocale: 'ja-JP',
    giscusLang: 'ja',
    htmlLang: 'ja',
    formatReading: (chars) => {
      const mins = Math.max(1, Math.ceil(chars / 400))
      return `約 ${mins} 分で読めます`
    },
  },
  ko: {
    home: '홈',
    posts: '글',
    language: '언어:',
    toc: '목차',
    share: '공유',
    updated: '수정됨',
    prev: '이전 글',
    next: '다음 글',
    related: '관련 글',
    licensePrefix: '이 글은 CC BY-NC-SA 4.0 라이선스로 제공됩니다.',
    dateLocale: 'ko-KR',
    giscusLang: 'ko',
    htmlLang: 'ko',
    formatReading: (chars) => {
      const mins = Math.max(1, Math.ceil(chars / 450))
      return `약 ${mins}분 소요`
    },
  },
  fr: {
    home: 'Accueil',
    posts: 'Articles',
    language: 'Langue :',
    toc: 'Sommaire',
    share: 'Partager',
    updated: 'Mis à jour',
    prev: 'Précédent',
    next: 'Suivant',
    related: 'Articles similaires',
    licensePrefix: 'Publié sous licence CC BY-NC-SA 4.0.',
    dateLocale: 'fr-FR',
    giscusLang: 'fr',
    htmlLang: 'fr',
    formatReading: (chars) => `~${Math.max(1, Math.ceil(chars / 1000))} min`,
  },
  de: {
    home: 'Start',
    posts: 'Beiträge',
    language: 'Sprache:',
    toc: 'Inhalt',
    share: 'Teilen',
    updated: 'Aktualisiert',
    prev: 'Vorheriger',
    next: 'Nächster',
    related: 'Ähnliche Beiträge',
    licensePrefix: 'Veröffentlicht unter CC BY-NC-SA 4.0.',
    dateLocale: 'de-DE',
    giscusLang: 'de',
    htmlLang: 'de',
    formatReading: (chars) => `~${Math.max(1, Math.ceil(chars / 1000))} Min.`,
  },
  es: {
    home: 'Inicio',
    posts: 'Artículos',
    language: 'Idioma:',
    toc: 'Índice',
    share: 'Compartir',
    updated: 'Actualizado',
    prev: 'Anterior',
    next: 'Siguiente',
    related: 'Lecturas relacionadas',
    licensePrefix: 'Publicado bajo licencia CC BY-NC-SA 4.0.',
    dateLocale: 'es-ES',
    giscusLang: 'es',
    htmlLang: 'es',
    formatReading: (chars) => `~${Math.max(1, Math.ceil(chars / 1000))} min`,
  },
}

function getReaderCopy(locale: string): ReaderCopy {
  const lower = locale.toLowerCase()
  if (lower === 'original' || lower === 'zh' || lower === 'zh-cn') return READER_COPY.zh
  if (lower.startsWith('zh-tw') || lower.startsWith('zh-hk')) return READER_COPY['zh-tw']
  const base = lower.split('-')[0]
  return READER_COPY[base] ?? READER_COPY.en
}

function formatLocalizedDate(iso: string, dateLocale: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(dateLocale, {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function PostReaderView({
  original,
  translations,
  publishedDateIso,
  updatedDateIso,
  coverImage,
  author,
  tags,
  routeId,
  siteUrl,
  siteTitle = 'emmm',
  commentsEnabled = true,
  prevPost,
  nextPost,
  relatedPosts = [],
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

  const copy = useMemo(() => getReaderCopy(activeVariant.locale), [activeVariant.locale])

  // 动态同步网页标题与 <html lang>
  useEffect(() => {
    document.title = `${activeVariant.title} | ${siteTitle}`
    document.documentElement.lang = copy.htmlLang
  }, [activeVariant.title, siteTitle, copy.htmlLang])

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

  const shareUrl = useMemo(() => {
    const base = `${siteUrl.replace(/\/$/, '')}/posts/${routeId}`
    return activeVariant.locale === 'original'
      ? base
      : `${base}?lang=${encodeURIComponent(activeVariant.locale)}`
  }, [siteUrl, routeId, activeVariant.locale])

  const showUpdatedDate = useMemo(() => {
    if (!updatedDateIso) return false
    const pubMs = new Date(publishedDateIso).getTime()
    const updMs = new Date(updatedDateIso).getTime()
    return Number.isFinite(pubMs) && Number.isFinite(updMs) && updMs - pubMs > 24 * 60 * 60 * 1000
  }, [publishedDateIso, updatedDateIso])

  return (
    <PostLayout toc={activeVariant.toc} tocTitle={copy.toc}>
      <FadeIn>
        <PostBreadcrumb
          title={activeVariant.title}
          homeLabel={copy.home}
          postsLabel={copy.posts}
        />

        <article className="article-shell">
          <div className="article-hero">
            {translations.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Languages className="h-3.5 w-3.5" />
                  {copy.language}
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

            {activeVariant.description && (
              <p className="article-description mt-4 text-base leading-relaxed text-muted-foreground">
                {activeVariant.description}
              </p>
            )}

            <div className="article-meta-row">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
                {author && author !== 'Admin' && (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 opacity-75" />
                    <span>{author}</span>
                  </span>
                )}
                <time
                  dateTime={publishedDateIso}
                  className="block whitespace-nowrap text-sm"
                >
                  {formatLocalizedDate(publishedDateIso, copy.dateLocale)}
                </time>
                {showUpdatedDate && updatedDateIso && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/80">
                    <span>·</span>
                    <CalendarClock className="h-3.5 w-3.5" />
                    <span>
                      {copy.updated} {formatLocalizedDate(updatedDateIso, copy.dateLocale)}
                    </span>
                  </span>
                )}
                {activeVariant.wordCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <span>·</span>
                    <span>{copy.formatReading(activeVariant.wordCount)}</span>
                  </span>
                )}
              </div>
              <div className="article-meta-actions flex flex-shrink-0 items-center gap-2">
                <PostStats slug={routeId} />
                <ShareButtons url={shareUrl} title={activeVariant.title} label={copy.share} />
              </div>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className="no-underline"
                  >
                    <span className="article-tag">#{tag}</span>
                  </Link>
                ))}
              </div>
            )}

            {coverImage && (
              <figure className="mt-6 overflow-hidden rounded-xl border border-border/70 bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage}
                  alt={activeVariant.title}
                  loading="eager"
                  referrerPolicy="no-referrer"
                  className="max-h-[420px] w-full object-cover"
                />
              </figure>
            )}
          </div>

          {activeVariant.aiSummary && (
            <AiSummaryCard summary={activeVariant.aiSummary} locale={activeVariant.locale} />
          )}

          <TipTapRenderer
            key={activeVariant.locale}
            className="mt-10"
            content={activeVariant.content}
            ssrHtml={activeVariant.ssrHtml}
            toc={activeVariant.toc}
          />

          {/* 版权署名卡片 */}
          <aside className="mt-12 flex items-start gap-3 rounded-xl border border-border/60 bg-muted/25 px-4 py-3.5 text-xs leading-relaxed text-muted-foreground">
            <Scale className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/80" />
            <div>
              <p className="font-medium text-foreground/85">{activeVariant.title}</p>
              <p className="mt-0.5">{copy.licensePrefix}</p>
            </div>
          </aside>

          {/* 上一篇 / 下一篇导航 */}
          {(prevPost || nextPost) && (
            <nav
              aria-label="文章翻页导航"
              className="article-neighbors mt-8 grid gap-3 border-t border-border/70 pt-8 sm:grid-cols-2"
            >
              {prevPost ? (
                <Link
                  href={`/posts/${prevPost.routeId}`}
                  className="group flex flex-col gap-1.5 rounded-xl border border-border/70 bg-card/60 p-4 no-underline transition-all hover:border-foreground/25 hover:bg-card"
                >
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                    {copy.prev}
                  </span>
                  <span className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                    {prevPost.title}
                  </span>
                </Link>
              ) : (
                <div className="hidden sm:block" />
              )}

              {nextPost ? (
                <Link
                  href={`/posts/${nextPost.routeId}`}
                  className="group flex flex-col items-end gap-1.5 rounded-xl border border-border/70 bg-card/60 p-4 text-right no-underline transition-all hover:border-foreground/25 hover:bg-card"
                >
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    {copy.next}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                    {nextPost.title}
                  </span>
                </Link>
              ) : null}
            </nav>
          )}

          {/* 相关阅读 */}
          {relatedPosts.length > 0 && (
            <section className="article-related mt-10 border-t border-border/70 pt-8">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <h2>{copy.related}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {relatedPosts.map((item) => (
                  <Link
                    key={item.routeId}
                    href={`/posts/${item.routeId}`}
                    className="group flex flex-col justify-between gap-2 rounded-xl border border-border/70 bg-card/50 p-4 no-underline transition-all hover:border-foreground/25 hover:bg-card"
                  >
                    <div>
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span key={tag}>#{tag}</span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="article-comments mt-12 border-t pt-10">
            <Comments enabled={commentsEnabled} lang={copy.giscusLang} />
          </div>
        </article>
      </FadeIn>
    </PostLayout>
  )
}
