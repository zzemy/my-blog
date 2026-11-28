import { Feed } from 'feed'
import { supabase } from '@/lib/supabase/client'
import { getSiteSettings } from '@/lib/site-settings'
import { getPostRouteId } from '@/lib/post-public-id'
import { renderTiptapToHtml } from '@/features/blog/utils/render-tiptap-ssr'
import type { Post } from '@/lib/supabase/types'

function getBaseSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://blog.zzemy.top'
  return raw.replace(/\/$/, '')
}

export async function generateBlogFeed(): Promise<Feed> {
  const siteUrl = getBaseSiteUrl()
  const [settings, postsRes] = await Promise.all([
    getSiteSettings(),
    supabase
      .from('posts')
      .select('id, public_id, slug, title, description, content, cover_image, author, tags, published_at, updated_at, created_at')
      .eq('published', true)
      .neq('slug', 'about')
      .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
      .order('published_at', { ascending: false })
      .limit(50),
  ])

  const siteTitle =
    settings.site_title && settings.site_title !== 'My Blog' ? settings.site_title : 'emmm'
  const siteDescription =
    settings.site_description &&
    settings.site_description !== 'A dedicated space for sharing knowledge and insights.'
      ? settings.site_description
      : '记录想法，分享发现，也留下痕迹。'
  const authorName = settings.author_info?.name?.trim() || siteTitle
  const faviconUrl = settings.favicon_url?.trim() || `${siteUrl}/icon`

  const feed = new Feed({
    title: siteTitle,
    description: siteDescription,
    id: `${siteUrl}/`,
    link: `${siteUrl}/`,
    language: 'zh-CN',
    image: `${siteUrl}/opengraph-image`,
    favicon: faviconUrl,
    copyright: settings.footer_text?.trim() || `© ${new Date().getFullYear()} ${siteTitle}`,
    updated: new Date(),
    generator: 'Next.js + Feed',
    feedLinks: {
      rss2: `${siteUrl}/rss.xml`,
      atom: `${siteUrl}/atom.xml`,
      json: `${siteUrl}/rss.json`,
    },
    author: {
      name: authorName,
      link: 'https://github.com/zzemy/my-blog',
    },
  })

  const posts = ((postsRes.data as Post[] | null) ?? [])

  for (const post of posts) {
    const routeId = getPostRouteId({ publicId: post.public_id, slug: post.slug })
    const postUrl = `${siteUrl}/posts/${routeId}`
    const publishedDate = new Date(post.published_at || post.created_at)
    const htmlContent = renderTiptapToHtml(post.content)

    feed.addItem({
      title: post.title,
      id: postUrl,
      link: postUrl,
      description: post.description || '',
      content: htmlContent || post.description || '',
      author: [{ name: post.author || authorName, link: 'https://github.com/zzemy/my-blog' }],
      date: Number.isNaN(publishedDate.getTime()) ? new Date() : publishedDate,
      published: Number.isNaN(publishedDate.getTime()) ? undefined : publishedDate,
      category: (post.tags ?? []).map((tag) => ({ name: tag })),
      image: post.cover_image || undefined,
    })
  }

  return feed
}
