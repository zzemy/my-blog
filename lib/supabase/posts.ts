import { supabase } from './client'
import type { Post } from './types'
import type { PostData as PostListItem } from '../types'
import { isExpectedSupabaseBuildError, logExpectedSupabaseBuildErrorOnce } from './error-utils'

export interface PostData {
  id: string
  title: string
  slug: string
  description: string
  content: unknown
  coverImage: string | null
  author: string
  locale: string
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

export async function getPublishedPosts(locale: string = 'zh'): Promise<PostListItem[]> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('locale', locale)
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
        // Using console.warn to avoid build-breaking console.errors during Turbopack's development mode when Supabase is not perfectly configured or empty.
        console.warn('Warning: Could not fetch posts. Returning []', error)
      }
      return []
    }

    const rows = (data || []) as Post[]

    return rows.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      date: post.published_at || post.created_at,
      summary: post.description || '',
      excerpt: post.description || '',
      tags: post.tags || [],
      readingTime: post.reading_time ? `${post.reading_time} 字` : undefined,
      coverImage: post.cover_image,
      locale: post.locale,
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

export async function getPostBySlug(slug: string, locale: string = 'zh'): Promise<PostData | null> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('locale', locale)
      .eq('published', true)
      .single()

    if (error) {
      if (isExpectedSupabaseBuildError(error)) {
        logExpectedSupabaseBuildErrorOnce(
          'get-post-by-slug-query-fallback',
          'Using null post because Supabase is unavailable in this environment:',
          error
        )
      } else {
        console.error('Error fetching post:', error)
      }
      return null
    }

    if (!data) return null

    const post = data as Post;

    const metadata = post.metadata as { seo_title?: string; seo_description?: string } | undefined

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      description: post.description || '',
      content: post.content,
      coverImage: post.cover_image,
      author: post.author,
      locale: post.locale,
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

export async function getPostsByTag(tag: string, locale: string = 'zh'): Promise<PostListItem[]> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('locale', locale)
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
      slug: post.slug,
      title: post.title,
      date: post.published_at || post.created_at,
      summary: post.description || '',
      excerpt: post.description || '',
      tags: post.tags || [],
      readingTime: post.reading_time ? `${post.reading_time} 字` : undefined,
      coverImage: post.cover_image,
      locale: post.locale,
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

export async function incrementPostViews(slug: string, locale: string = 'zh'): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_post_views', {
      post_slug: slug,
      post_locale: locale,
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
