import { MetadataRoute } from 'next'
import { getPostRouteId } from '@/lib/post-public-id'
import { supabase } from '@/lib/supabase/client'

export const revalidate = 300

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://blog.zzemy.top').replace(/\/$/, '')

type SitemapPostRow = {
  public_id: string | null
  slug: string
  tags: string[] | null
  updated_at: string | null
  published_at: string | null
  created_at: string
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let posts: SitemapPostRow[] = []
  try {
    const { data } = await supabase
      .from('posts')
      .select('public_id, slug, tags, updated_at, published_at, created_at')
      .eq('published', true)
      .neq('slug', 'about')
      .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
      .order('published_at', { ascending: false })
    posts = (data as SitemapPostRow[] | null) ?? []
  } catch {
    posts = []
  }

  const staticRoutes = [
    { path: '', priority: 1, changeFrequency: 'daily' as const },
    { path: '/posts', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/tags', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/friends', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/guestbook', priority: 0.7, changeFrequency: 'weekly' as const },
  ]

  const sitemapEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  const tagLatestMap = new Map<string, Date>()

  for (const post of posts) {
    const lastMod = new Date(post.updated_at || post.published_at || post.created_at)
    const safeDate = Number.isNaN(lastMod.getTime()) ? new Date() : lastMod

    sitemapEntries.push({
      url: `${baseUrl}/posts/${getPostRouteId({ publicId: post.public_id, slug: post.slug })}`,
      lastModified: safeDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    })

    for (const rawTag of post.tags ?? []) {
      const tag = rawTag.trim()
      if (!tag) continue
      const existing = tagLatestMap.get(tag)
      if (!existing || safeDate > existing) {
        tagLatestMap.set(tag, safeDate)
      }
    }
  }

  for (const [tag, lastModified] of tagLatestMap.entries()) {
    sitemapEntries.push({
      url: `${baseUrl}/tags/${encodeURIComponent(tag)}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.5,
    })
  }

  return sitemapEntries
}
