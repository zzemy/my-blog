import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { setRequestLocale } from 'next-intl/server';
import { PostLayout } from "@/features/blog/components/client/post-layout";
import { FadeIn } from "@/shared/visuals/fade-in";
import { TipTapRenderer } from "@/features/blog/editor/tiptap-renderer";
import { PostBreadcrumb } from "@/features/blog/components/shared/post-breadcrumb";
import { FallbackBanner } from '@/features/blog/components/client/fallback-banner';
import { ShareButtons } from "@/features/blog/components/client/share-buttons";
import { PostStats } from "@/features/blog/components/client/post-stats";
import { Comments } from "@/features/blog/components/client/comments";
import { supabase } from '@/lib/supabase/client';
import { Database } from "@/lib/supabase/types";
import { isExpectedSupabaseBuildError, logExpectedSupabaseBuildErrorOnce } from '@/lib/supabase/error-utils';

// Enable ISR for post detail pages (seconds)
export const revalidate = 60; // Regenerate at most once per minute

const locales = ['zh', 'en', 'fr', 'ja'];

// 添加 Metadata 生成
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug, locale } = await params;
  const post = await getPost(slug, locale);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.metadata?.seo_title || post.title,
    description: post.metadata?.seo_description || post.description || post.title,
    openGraph: {
      title: post.metadata?.seo_title || post.title,
      description: post.metadata?.seo_description || post.description || post.title,
      type: 'article',
      publishedTime: post.published_at,
      images: post.cover_image ? [post.cover_image] : [],
    },
  };
}

type Post = Database['public']['Tables']['posts']['Row'];

async function getPost(slug: string, locale: string): Promise<Post | null> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('locale', locale)
      .eq('published', true)
      .single();

    if (error) {
      if (!isExpectedSupabaseBuildError(error)) {
        console.error('Failed to fetch post:', error)
      }
      return null;
    }

    return data;
  } catch (error) {
    if (isExpectedSupabaseBuildError(error)) {
      logExpectedSupabaseBuildErrorOnce(
        'locale-post-page-build-fallback',
        'Skipping post detail fetch because Supabase is unavailable in this environment:',
        error
      )
    } else {
      console.error('Error fetching post:', error)
    }
    return null;
  }
}

async function getAllPosts(locale: string) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('slug')
      .eq('locale', locale)
      .eq('published', true)
      .neq('slug', 'about');

    if (error) {
      if (!isExpectedSupabaseBuildError(error)) {
        console.error('Failed to fetch posts:', error)
      }
      return [];
    }

    return data as { slug: string }[];
  } catch (error) {
    if (isExpectedSupabaseBuildError(error)) {
      logExpectedSupabaseBuildErrorOnce(
        'locale-post-page-all-posts-build-fallback',
        'Using empty post slugs because Supabase is unavailable in this environment:',
        error
      )
    } else {
      console.error('Error fetching posts:', error)
    }
    return [];
  }
}

// 生成静态路径 (SSG)
export async function generateStaticParams() {
  const posts = await getAllPosts('zh');
  const params = [];
  for (const locale of locales) {
    for (const post of posts) {
      params.push({ locale, slug: post.slug });
    }
  }
  return params;
}

export default async function PostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await getPost(slug, locale);

  if (!post) {
    notFound();
  }

  // If the returned post language is different from the UI locale (e.g. fallback to 'zh'),
  // show a small hint to the user.
  const showFallbackNote = post.locale && post.locale !== locale;
  const fallbackMessage = {
    zh: '仅有中文版本',
    en: 'This article is only available in Chinese',
    fr: 'Cet article est uniquement disponible en chinois',
    ja: 'この記事は中国語のみ対応しています',
  }[locale] || 'This article is only available in Chinese';

  // Calculate reading time from content
  const readingTime = post.reading_time 
    ? `${post.reading_time} 字` 
    : null;

  // 生成目录
  const toc = buildToc(post.content)

  return (
    <PostLayout toc={toc}>
      <FadeIn>
        <PostBreadcrumb title={post.title} />
        
        <article className="prose dark:prose-invert max-w-none">
          {showFallbackNote && (
            <FallbackBanner postId={post.id} message={fallbackMessage} />
          )}
          <div className="space-y-4 border-b pb-8">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">{post.title}</h1>
            <div className="flex flex-wrap items-start justify-between">
              <div className="flex-1 min-w-0 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 text-muted-foreground text-sm">
                <time dateTime={post.published_at || post.created_at} className="whitespace-nowrap text-sm truncate block min-w-0">
                  {new Date(post.published_at || post.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
                {readingTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="hidden sm:inline">•</span>
                    <span className="sm:inline">{readingTime}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <PostStats slug={slug} />
                <ShareButtons 
                  url={`https://emmmxx.xyz/${locale}/posts/${slug}`} 
                />
              </div>
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {post.tags.map((tag: string) => (
                  <Link key={tag} href={`/tags/${tag}`} className="no-underline">
                    <span className="text-sm bg-muted px-2.5 py-0.5 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                      #{tag}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <TipTapRenderer 
            className="mt-8 leading-7 text-base md:text-lg"
            content={post.content} 
            toc={toc}
          />

          <div className="mt-12 border-t pt-10">
            <Comments />
          </div>
        </article>
      </FadeIn>
    </PostLayout>
  );
}

type TocItem = {
  id: string
  text: string
  depth: number
}

type TiptapNode = {
  type?: string
  text?: string
  attrs?: { level?: number }
  content?: TiptapNode[]
}

function buildToc(content: TiptapNode | TiptapNode[] | null | undefined): TocItem[] {
  const toc: TocItem[] = []
  const idCount: Record<string, number> = {}

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

  const walk = (node: TiptapNode | TiptapNode[] | null | undefined) => {
    if (!node) return
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }

    if (node.type === 'heading' && node.attrs?.level) {
      const text = extractText(node)
      if (text) {
        let base = slugify(text)
        if (!base) base = 'section'
        let unique = base
        if (idCount[base] != null) {
          idCount[base] += 1
          unique = `${base}-${idCount[base]}`
        } else {
          idCount[base] = 0
        }
        toc.push({ id: unique, text, depth: node.attrs.level })
      }
    }

    if (node.content) {
      walk(node.content)
    }
  }

  walk(content)
  return toc
}

function extractText(node: TiptapNode | null | undefined): string {
  if (!node) return ''
  if (node.text) return node.text
  if (node.content) {
    return node.content.map(extractText).join('')
  }
  return ''
}
