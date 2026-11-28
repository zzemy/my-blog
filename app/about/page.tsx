import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { PostLayout } from '@/features/blog/components/client/post-layout'
import { TipTapRenderer } from '@/features/blog/editor/tiptap-renderer'
import { buildToc, type TiptapNode } from '@/features/blog/utils/toc'
import { renderTiptapToHtml } from '@/features/blog/utils/render-tiptap-ssr'
import { getSiteSettings } from '@/lib/site-settings'
import { supabase } from '@/lib/supabase/client'
import type { PublicSocialLink } from '@/shared/layout/site-settings-context'

export const revalidate = 60

export const metadata: Metadata = {
  title: '关于',
  description: '关于作者与这个博客。',
}

type AboutPost = {
  title: string
  description: string | null
  content: TiptapNode | TiptapNode[] | null
}

function normalizeLegacyBranding(text: string): string {
  return text.replace(/ZHalio/g, 'emmm').replace(/github\.com\/zhalio/g, 'github.com/zzemy')
}

function normalizeAboutContent(node: TiptapNode | TiptapNode[] | null): TiptapNode | TiptapNode[] | null {
  if (!node) return node

  if (Array.isArray(node)) {
    return node.map((item) => normalizeAboutContent(item) as TiptapNode)
  }

  return {
    ...node,
    text: node.text ? normalizeLegacyBranding(node.text) : node.text,
    content: node.content ? node.content.map((item) => normalizeAboutContent(item) as TiptapNode) : node.content,
  }
}

async function getAboutPost() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('title, description, content')
      .eq('slug', 'about')
      .eq('published', true)
      .single()

    if (error || !data) return null

    const post = data as AboutPost
    return {
      ...post,
      title: normalizeLegacyBranding(post.title),
      description: post.description ? normalizeLegacyBranding(post.description) : post.description,
      content: normalizeAboutContent(post.content),
    }
  } catch {
    return null
  }
}

export default async function AboutPage() {
  const [post, settings] = await Promise.all([getAboutPost(), getSiteSettings()])
  if (!post) {
    notFound()
  }

  const toc = buildToc(post.content)
  const ssrHtml = renderTiptapToHtml(post.content, toc)
  const authorName = settings.author_info?.name?.trim() || settings.site_title || 'emmm'
  const authorBio = settings.author_info?.bio?.trim()
  const authorAvatar = settings.author_info?.avatar_url?.trim()
  const socialLinks = Array.isArray(settings.social_links)
    ? (settings.social_links as PublicSocialLink[]).filter((l) => l?.platform && l?.url)
    : []

  return (
    <PostLayout toc={toc}>
      <article className="article-shell">
        <div className="article-hero">
          <h1 className="article-title text-4xl lg:text-5xl">{post.title}</h1>
          {post.description && <p className="article-description">{post.description}</p>}
        </div>

        {(authorBio || authorAvatar || socialLinks.length > 0) && (
          <section className="mt-8 flex flex-col gap-4 rounded-xl border border-border/70 bg-card/60 p-5 sm:flex-row sm:items-center">
            {authorAvatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={authorAvatar}
                alt={authorName}
                referrerPolicy="no-referrer"
                className="h-16 w-16 shrink-0 rounded-2xl border border-border/70 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-muted text-lg font-semibold text-foreground">
                {authorName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="text-base font-semibold text-foreground">{authorName}</div>
              {authorBio && (
                <p className="text-sm leading-relaxed text-muted-foreground">{authorBio}</p>
              )}
              {socialLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {socialLinks.map((link) => (
                    <a
                      key={`${link.platform}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-2.5 py-0.5 text-xs text-muted-foreground no-underline transition-colors hover:border-foreground/25 hover:text-foreground"
                    >
                      <span>{link.platform}</span>
                      <ArrowUpRight className="h-3 w-3 opacity-60" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <TipTapRenderer className="mt-10" content={post.content} ssrHtml={ssrHtml} toc={toc} />
      </article>
    </PostLayout>
  )
}
