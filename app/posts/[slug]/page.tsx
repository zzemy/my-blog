import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Content } from '@tiptap/react'
import { PostReaderView, type PostLocaleVariant } from '@/features/blog/components/client/post-reader-view'
import { buildToc, type TiptapNode } from '@/features/blog/utils/toc'
import { getPostRouteId } from '@/lib/post-public-id'
import { getSiteSettings } from '@/lib/site-settings'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { isExpectedSupabaseBuildError, logExpectedSupabaseBuildErrorOnce } from '@/lib/supabase/error-utils'
import { parseAiSummaryFromMetadata } from '@/lib/ai/types'

// Enable ISR for post detail pages (seconds)
export const revalidate = 60 // Regenerate at most once per minute

type Post = Database['public']['Tables']['posts']['Row']
type PostTranslation = Database['public']['Tables']['post_translations']['Row']

function getMetadataString(metadata: unknown, key: string): string | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

// 添加 Metadata 生成
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  const seoTitle = getMetadataString(post.metadata, 'seo_title') || post.title
  const seoDescription =
    getMetadataString(post.metadata, 'seo_description') || post.description || post.title

  return {
    title: seoTitle,
    description: seoDescription,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      type: 'article',
      publishedTime: post.published_at,
      images: post.cover_image ? [post.cover_image] : [],
    },
  }
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

async function getPublishedTranslations(postId: string): Promise<PostTranslation[]> {
  try {
    const { data, error } = await supabase
      .from('post_translations')
      .select('*')
      .eq('post_id', postId)
      .eq('published', true)
      .order('created_at', { ascending: true })

    if (error) {
      // 表尚未执行迁移时静默回退，避免影响文章页渲染
      if (error.code === '42P01') return []
      return []
    }

    return (data as PostTranslation[] | null) ?? []
  } catch {
    return []
  }
}

async function getAllPosts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('public_id, slug')
      .eq('published', true)
      .neq('slug', 'about')

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

// 生成静态路径 (SSG)
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

  const [publishedTranslations, settings] = await Promise.all([
    getPublishedTranslations(post.id),
    getSiteSettings(),
  ])
  const commentsEnabled = settings.feature_flags?.enable_comments !== false

  const readingTime = post.reading_time ? `${post.reading_time} 字` : null
  const routeId = getPostRouteId({ publicId: post.public_id, slug: post.slug })

  const originalVariant: PostLocaleVariant = {
    locale: 'original',
    title: post.title,
    description: post.description,
    content: post.content as Content,
    aiSummary: parseAiSummaryFromMetadata(post.metadata),
    toc: buildToc(post.content as TiptapNode),
  }

  const translationVariants: PostLocaleVariant[] = publishedTranslations.map((item) => ({
    locale: item.locale,
    title: item.title,
    description: item.description,
    content: item.content as Content,
    aiSummary: parseAiSummaryFromMetadata({ ai_summary: item.ai_summary }),
    toc: buildToc(item.content as TiptapNode),
  }))

  return (
    <PostReaderView
      original={originalVariant}
      translations={translationVariants}
      publishedDateIso={post.published_at || post.created_at}
      readingTime={readingTime}
      tags={post.tags ?? []}
      routeId={routeId}
      commentsEnabled={commentsEnabled}
    />
  )
}
