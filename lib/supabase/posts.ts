import { supabase } from './client'
import type { Post } from './types'
import type { PostData as PostListItem } from '../types'
import { isExpectedSupabaseBuildError, logExpectedSupabaseBuildErrorOnce } from './error-utils'

export interface PostData {
  id: string
  publicId: string | null
  title: string
  slug: string
  description: string
  content: unknown
  coverImage: string | null
  author: string
  tags: string[]
  published: boolean
  featured: boolean
  views: number
  readingTime: number | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  seo_title?: string
  seo_description?: string
}

export async function getPublishedPosts(): Promise<PostListItem[]> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('published', true)
      .neq('slug', 'about')
      .order('published_at', { ascending: false })

    if (error) {
      if (isExpectedSupabaseBuildError(error)) {
        logExpectedSupabaseBuildErrorOnce(
          'get-published-posts-query-fallback',
          'Using empty post list because Supabase is unavailable in this environment:',
          error
        )
      } else {
        console.error('Error fetching posts:', error)
      }
      return []
    }

    const rows = (data || []) as Post[]

    return rows.map(post => ({
      id: post.id,
      publicId: post.public_id,
      slug: post.slug,
      title: post.title,
      date: post.published_at || post.created_at,
      summary: post.description || '',
      excerpt: post.description || '',
      tags: post.tags || [],
      readingTime: post.reading_time ? `${post.reading_time} 字` : undefined,
      coverImage: post.cover_image,
    }))
  } catch (error) {
    if (isExpectedSupabaseBuildError(error)) {
      logExpectedSupabaseBuildErrorOnce(
        'get-published-posts-build-fallback',
        'Using empty post list because Supabase is unavailable in this environment:',
        error
      )
    } else {
      console.error('Error fetching posts:', error)
    }
    return []
  }
}

async function findPublishedPostByIdentifier(identifier: string): Promise<Post | null> {
  const { data: postByPublicId, error: publicIdError } = await supabase
    .from('posts')
    .select('*')
    .eq('public_id', identifier)
    .eq('published', true)
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
    .maybeSingle()

  if (slugError) {
    throw slugError
  }

  return postBySlug ? (postBySlug as Post) : null
}

export async function getPostBySlug(slug: string): Promise<PostData | null> {
  try {
    const post = await findPublishedPostByIdentifier(slug)
    if (!post) return null

    const metadata = post.metadata as { seo_title?: string; seo_description?: string } | undefined

    return {
      id: post.id,
      publicId: post.public_id,
      title: post.title,
      slug: post.slug,
      description: post.description || '',
      content: post.content,
      coverImage: post.cover_image,
      author: post.author,
      tags: post.tags || [],
      published: post.published,
      featured: post.featured,
      views: post.views,
      readingTime: post.reading_time,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      publishedAt: post.published_at,
      seo_title: metadata?.seo_title,
      seo_description: metadata?.seo_description,
    }
  } catch (error) {
    if (isExpectedSupabaseBuildError(error)) {
      logExpectedSupabaseBuildErrorOnce(
        'get-post-by-slug-build-fallback',
        'Using null post because Supabase is unavailable in this environment:',
        error
      )
    } else {
      console.error('Error fetching post:', error)
    }
    return null
  }
}

export async function getAllTags(): Promise<Array<{ name: string; count: number }>> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('name, count')
      .order('count', { ascending: false })

    if (error) {
      if (isExpectedSupabaseBuildError(error)) {
        logExpectedSupabaseBuildErrorOnce(
          'get-all-tags-query-fallback',
          'Using empty tags because Supabase is unavailable in this environment:',
          error
        )
      } else {
        console.error('Error fetching tags:', error)
      }
      return []
    }

    return data || []
  } catch (error) {
    if (isExpectedSupabaseBuildError(error)) {
      logExpectedSupabaseBuildErrorOnce(
        'get-all-tags-build-fallback',
        'Using empty tags because Supabase is unavailable in this environment:',
        error
      )
    } else {
      console.error('Error fetching tags:', error)
    }
    return []
  }
}

export async function getPostsByTag(tag: string): Promise<PostListItem[]> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('published', true)
      .neq('slug', 'about')
      .contains('tags', [tag])
      .order('published_at', { ascending: false })

    if (error) {
      if (isExpectedSupabaseBuildError(error)) {
        logExpectedSupabaseBuildErrorOnce(
          'get-posts-by-tag-query-fallback',
          'Using empty tagged posts because Supabase is unavailable in this environment:',
          error
        )
      } else {
        console.error('Error fetching posts by tag:', error)
      }
      return []
    }

    const rows = (data || []) as Post[]

    return rows.map(post => ({
      id: post.id,
      publicId: post.public_id,
      slug: post.slug,
      title: post.title,
      date: post.published_at || post.created_at,
      summary: post.description || '',
      excerpt: post.description || '',
      tags: post.tags || [],
      readingTime: post.reading_time ? `${post.reading_time} 字` : undefined,
      coverImage: post.cover_image,
    }))
  } catch (error) {
    if (isExpectedSupabaseBuildError(error)) {
      logExpectedSupabaseBuildErrorOnce(
        'get-posts-by-tag-build-fallback',
        'Using empty tagged posts because Supabase is unavailable in this environment:',
        error
      )
    } else {
      console.error('Error fetching posts by tag:', error)
    }
    return []
  }
}

export async function incrementPostViews(slug: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_post_views', {
      post_slug: slug,
    } as never)

    if (error) {
      if (isExpectedSupabaseBuildError(error)) {
        logExpectedSupabaseBuildErrorOnce(
          'increment-views-query-fallback',
          'Skipping view increment because Supabase is unavailable in this environment:',
          error
        )
      } else {
        console.error('Error incrementing views:', error)
      }
    }
  } catch (error) {
    if (isExpectedSupabaseBuildError(error)) {
      logExpectedSupabaseBuildErrorOnce(
        'increment-views-build-fallback',
        'Skipping view increment because Supabase is unavailable in this environment:',
        error
      )
    } else {
      console.error('Error incrementing views:', error)
    }
  }
}
