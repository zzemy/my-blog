import { MetadataRoute } from 'next'
import { getPostRouteId } from '@/lib/post-public-id'
import { getPublishedPosts } from '@/lib/supabase/posts'

export const dynamic = 'force-static'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blog.zzemy.top'
const locales = ['zh', 'en', 'fr', 'ja']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts('zh') // Get all posts (slugs are same across locales)
  
  const routes = [
    '',
    '/posts',
    '/guestbook',
    '/about',
  ]

  const sitemapEntries: MetadataRoute.Sitemap = []

  // Add static routes for each locale
  for (const locale of locales) {
    for (const route of routes) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1 : 0.8,
      })
    }
  }

  // Add post routes for each locale
  for (const post of posts) {
    for (const locale of locales) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/posts/${getPostRouteId(post)}`,
        lastModified: new Date(post.date),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
  }

  return sitemapEntries
}
