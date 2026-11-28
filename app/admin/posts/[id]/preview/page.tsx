import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Content } from '@tiptap/react'
import { ArrowLeft, Eye } from 'lucide-react'
import { getAuthTokenFromCookie } from '@/lib/server-auth'
import { validateAdminRequest } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase/client'
import { getSiteSettings } from '@/lib/site-settings'
import { getPostRouteId } from '@/lib/post-public-id'
import { buildToc, type TiptapNode } from '@/features/blog/utils/toc'
import { renderTiptapToHtml } from '@/features/blog/utils/render-tiptap-ssr'
import { calculateContentSize } from '@/features/admin/posts/form-utils'
import { parseAiSummaryFromMetadata } from '@/lib/ai/types'
import { PostReaderView, type PostLocaleVariant } from '@/features/blog/components/client/post-reader-view'
import type { Database } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type Post = Database['public']['Tables']['posts']['Row']
type PostTranslation = Database['public']['Tables']['post_translations']['Row']

export default async function AdminPostPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const token = await getAuthTokenFromCookie()
  const ok = await validateAdminRequest(token)
  if (!ok) {
    redirect('/admin')
  }

  const { id } = await params
  const client = getAdminClient(token || undefined)

  const [{ data: postData, error }, translationsRes, settings] = await Promise.all([
    client.from('posts').select('*').eq('id', id).single(),
    client
      .from('post_translations')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true }),
    getSiteSettings(),
  ])

  if (error || !postData) {
    notFound()
  }

  const post = postData as Post
  const translations = (translationsRes.data as PostTranslation[] | null) ?? []
  const routeId = getPostRouteId({ publicId: post.public_id, slug: post.slug })
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://blog.zzemy.top').replace(/\/$/, '')
  const siteTitle =
    settings.site_title && settings.site_title !== 'My Blog' ? settings.site_title : 'emmm'

  const originalToc = buildToc(post.content as TiptapNode)
  const originalVariant: PostLocaleVariant = {
    locale: 'original',
    title: post.title,
    description: post.description,
    content: post.content as Content,
    ssrHtml: renderTiptapToHtml(post.content, originalToc),
    wordCount: post.reading_time || calculateContentSize(post.content as Content),
    aiSummary: parseAiSummaryFromMetadata(post.metadata),
    toc: originalToc,
  }

  const translationVariants: PostLocaleVariant[] = translations.map((item) => {
    const toc = buildToc(item.content as TiptapNode)
    return {
      locale: item.locale,
      title: item.title,
      description: item.description,
      content: item.content as Content,
      ssrHtml: renderTiptapToHtml(item.content, toc),
      wordCount: calculateContentSize(item.content as Content),
      aiSummary: parseAiSummaryFromMetadata({ ai_summary: item.ai_summary }),
      toc,
    }
  })

  const statusLabel = !post.published
    ? '草稿预览'
    : post.published_at && new Date(post.published_at).getTime() > Date.now()
      ? '定时发布预览'
      : '已发布预览'

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 border-b border-amber-500/30 bg-amber-50/95 px-4 py-2.5 text-amber-950 backdrop-blur-md dark:bg-amber-950/90 dark:text-amber-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Eye className="h-4 w-4 shrink-0" />
            <span>{statusLabel}模式 · 仅已登录管理员可见（显示最新已保存内容）</span>
          </div>
          <Link
            href={`/admin/posts/${post.id}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-600/30 bg-background/80 px-3 py-1 text-xs font-medium text-foreground no-underline transition-colors hover:bg-background"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回编辑器
          </Link>
        </div>
      </div>

      <PostReaderView
        original={originalVariant}
        translations={translationVariants}
        publishedDateIso={post.published_at || post.created_at}
        updatedDateIso={post.updated_at}
        coverImage={post.cover_image}
        author={post.author && post.author !== 'Admin' ? post.author : settings.author_info?.name || siteTitle}
        tags={post.tags ?? []}
        routeId={routeId}
        siteUrl={siteUrl}
        siteTitle={siteTitle}
        commentsEnabled={false}
      />
    </div>
  )
}
