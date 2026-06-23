import { MetadataRoute } from 'next'
import { getPostRouteId } from '@/lib/post-public-id'
import { getPublishedPosts } from '@/lib/supabase/posts'

export const dynamic = 'force-static'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blog.zzemy.top'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts()
  
  const routes = [
    '',
    '/posts',
    '/guestbook',
    '/about',
  ]

  const sitemapEntries: MetadataRoute.Sitemap = []

  for (const route of routes) {
    sitemapEntries.push({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: route === '' ? 1 : 0.8,
    })
  }

  for (const post of posts) {
    sitemapEntries.push({
      url: `${baseUrl}/posts/${getPostRouteId(post)}`,
      lastModified: new Date(post.date),
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }

  return sitemapEntries
}
