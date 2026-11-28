import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import type { Content } from '@tiptap/react'
import {
  PostReaderView,
  type NeighborPostLink,
  type PostLocaleVariant,
  type RelatedPostLink,
} from '@/features/blog/components/client/post-reader-view'
import { buildToc, type TiptapNode } from '@/features/blog/utils/toc'
import { renderTiptapToHtml } from '@/features/blog/utils/render-tiptap-ssr'
import { calculateContentSize } from '@/features/admin/posts/form-utils'
import { getPostRouteId } from '@/lib/post-public-id'
import { getSiteSettings } from '@/lib/site-settings'
import { getPublishedPosts } from '@/lib/supabase/posts'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { isExpectedSupabaseBuildError, logExpectedSupabaseBuildErrorOnce } from '@/lib/supabase/error-utils'
import { parseAiSummaryFromMetadata } from '@/lib/ai/types'

export const revalidate = 60

type Post = Database['public']['Tables']['posts']['Row']
type PostTranslation = Database['public']['Tables']['post_translations']['Row']

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://blog.zzemy.top').replace(/\/$/, '')
}

function getMetadataString(metadata: unknown, key: string): string | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

async function findPostByIdentifier(identifier: string): Promise<Post | null> {
  const publishFilter = `published_at.is.null,published_at.lte.${new Date().toISOString()}`

  const { data: postByPublicId, error: publicIdError } = await supabase
    .from('posts')
    .select('*')
    .eq('public_id', identifier)
    .eq('published', true)
    .or(publishFilter)
    .maybeSingle()

  if (publicIdError) {
    throw publicIdError
  }

  if (postByPublicId) {
    return postByPublicId as Post
  }

  const { data: postBySlug, error: slugError } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', identifier)
    .eq('published', true)
    .or(publishFilter)
    .maybeSingle()

  if (slugError) {
    throw slugError
  }

  return postBySlug ? (postBySlug as Post) : null
}

const getPost = cache(async (slug: string): Promise<Post | null> => {
  try {
    return await findPostByIdentifier(slug)
  } catch (error) {
    if (isExpectedSupabaseBuildError(error)) {
      logExpectedSupabaseBuildErrorOnce(
        'post-page-build-fallback',
        'Skipping post detail fetch because Supabase is unavailable in this environment:',
        error,
      )
    } else {
      console.error('Error fetching post:', error)
    }
    return null
  }
})

const getPublishedTranslations = cache(async (postId: string): Promise<PostTranslation[]> => {
  try {
    const { data, error } = await supabase
      .from('post_translations')
      .select('*')
      .eq('post_id', postId)
      .eq('published', true)
      .order('created_at', { ascending: true })

    if (error) {
      if (error.code === '42P01') return []
      return []
    }

    return (data as PostTranslation[] | null) ?? []
  } catch {
    return []
  }
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return {
      title: '文章不存在',
    }
  }

  const [translations, settings] = await Promise.all([
    getPublishedTranslations(post.id),
    getSiteSettings(),
  ])

  const siteUrl = getSiteUrl()
  const routeId = getPostRouteId({ publicId: post.public_id, slug: post.slug })
  const canonicalUrl = `${siteUrl}/posts/${routeId}`
  const seoTitle = getMetadataString(post.metadata, 'seo_title') || post.title
  const seoDescription =
    getMetadataString(post.metadata, 'seo_description') || post.description || post.title
  const authorName =
    post.author && post.author !== 'Admin'
      ? post.author
      : settings.author_info?.name?.trim() || settings.site_title || 'emmm'

  const languages: Record<string, string> = {
    'x-default': canonicalUrl,
    'zh-CN': canonicalUrl,
  }
  for (const item of translations) {
    languages[item.locale] = `${canonicalUrl}?lang=${encodeURIComponent(item.locale)}`
  }

  return {
    title: seoTitle,
    description: seoDescription,
    authors: [{ name: authorName }],
    keywords: post.tags?.length ? post.tags : undefined,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at || post.published_at || post.created_at,
      authors: [authorName],
      tags: post.tags ?? undefined,
      // 无封面图时不传空数组，让 Next.js 自动使用动态 opengraph-image.tsx
      ...(post.cover_image ? { images: [post.cover_image] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      ...(post.cover_image ? { images: [post.cover_image] } : {}),
    },
  }
}

async function getAllPosts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('public_id, slug')
      .eq('published', true)
      .neq('slug', 'about')
      .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)

    if (error) {
      if (!isExpectedSupabaseBuildError(error)) {
        console.error('Failed to fetch posts:', error)
      }
      return []
    }

    return data as { public_id: string | null; slug: string }[]
  } catch (error) {
    if (isExpectedSupabaseBuildError(error)) {
      logExpectedSupabaseBuildErrorOnce(
        'post-page-all-posts-build-fallback',
        'Using empty post slugs because Supabase is unavailable in this environment:',
        error,
      )
    } else {
      console.error('Error fetching posts:', error)
    }
    return []
  }
}

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({ slug: post.public_id || post.slug }))
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  const routeId = getPostRouteId({ publicId: post.public_id, slug: post.slug })

  // 统一规范 URL：若文章有 public_id 且访问的是旧 slug，301 重定向避免 SEO 重复收录与 Giscus 讨论分裂
  if (post.public_id && slug !== routeId) {
    permanentRedirect(`/posts/${routeId}`)
  }

  const [publishedTranslations, settings, allPublishedPosts] = await Promise.all([
    getPublishedTranslations(post.id),
    getSiteSettings(),
    getPublishedPosts(),
  ])

  const commentsEnabled = settings.feature_flags?.enable_comments !== false
  const siteUrl = getSiteUrl()
  const siteTitle =
    settings.site_title && settings.site_title !== 'My Blog' ? settings.site_title : 'emmm'
  const authorName =
    post.author && post.author !== 'Admin'
      ? post.author
      : settings.author_info?.name?.trim() || siteTitle

  const originalToc = buildToc(post.content as TiptapNode)
  const originalAiSummary = parseAiSummaryFromMetadata(post.metadata)

  const originalVariant: PostLocaleVariant = {
    locale: 'original',
    title: post.title,
    description: post.description,
    content: post.content as Content,
    ssrHtml: renderTiptapToHtml(post.content, originalToc),
    wordCount: post.reading_time || calculateContentSize(post.content as Content),
    aiSummary: originalAiSummary,
    toc: originalToc,
  }

  const translationVariants: PostLocaleVariant[] = publishedTranslations.map((item) => {
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

  // 计算上一篇 / 下一篇（allPublishedPosts 按发布时间倒序）
  const currentIndex = allPublishedPosts.findIndex((item) => item.id === post.id)
  const newerItem = currentIndex > 0 ? allPublishedPosts[currentIndex - 1] : null
  const olderItem =
    currentIndex >= 0 && currentIndex < allPublishedPosts.length - 1
      ? allPublishedPosts[currentIndex + 1]
      : null

  const prevPost: NeighborPostLink | null = olderItem
    ? {
        routeId: getPostRouteId(olderItem),
        title: olderItem.title,
        date: olderItem.date,
      }
    : null

  const nextPost: NeighborPostLink | null = newerItem
    ? {
        routeId: getPostRouteId(newerItem),
        title: newerItem.title,
        date: newerItem.date,
      }
    : null

  // 按共享标签权重计算相关文章
  const currentTags = new Set((post.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean))
  const relatedPosts: RelatedPostLink[] = allPublishedPosts
    .filter((item) => item.id !== post.id)
    .map((item) => {
      const overlap = (item.tags ?? []).filter((t) =>
        currentTags.has(t.trim().toLowerCase()),
      ).length
      return { item, overlap }
    })
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 3)
    .map(({ item }) => ({
      routeId: getPostRouteId(item),
      title: item.title,
      description: item.summary,
      date: item.date,
      tags: item.tags ?? [],
    }))

  // 构造 JSON-LD 结构化数据（BlogPosting + BreadcrumbList + 可选 FAQPage）
  const canonicalUrl = `${siteUrl}/posts/${routeId}`
  const jsonLdGraph: Record<string, unknown>[] = [
    {
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description || post.title,
      url: canonicalUrl,
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at || post.published_at || post.created_at,
      author: { '@type': 'Person', name: authorName, url: 'https://github.com/zzemy/my-blog' },
      publisher: { '@type': 'Person', name: siteTitle, url: siteUrl },
      keywords: (post.tags ?? []).join(', '),
      ...(post.cover_image ? { image: [post.cover_image] } : {}),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '首页', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: '文章', item: `${siteUrl}/posts` },
        { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl },
      ],
    },
  ]

  if (originalAiSummary?.visible !== false && originalAiSummary?.faqs?.length) {
    jsonLdGraph.push({
      '@type': 'FAQPage',
      mainEntity: originalAiSummary.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    })
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': jsonLdGraph }),
        }}
      />
      <PostReaderView
        original={originalVariant}
        translations={translationVariants}
        publishedDateIso={post.published_at || post.created_at}
        updatedDateIso={post.updated_at}
        coverImage={post.cover_image}
        author={authorName}
        tags={post.tags ?? []}
        routeId={routeId}
        siteUrl={siteUrl}
        siteTitle={siteTitle}
        commentsEnabled={commentsEnabled}
        prevPost={prevPost}
        nextPost={nextPost}
        relatedPosts={relatedPosts}
      />
    </>
  )
}
