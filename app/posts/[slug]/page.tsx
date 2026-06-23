import Link from "next/link";
import { notFound } from "next/navigation";
import { PostLayout } from "@/features/blog/components/client/post-layout";
import { FadeIn } from "@/shared/visuals/fade-in";
import { TipTapRenderer } from "@/features/blog/editor/tiptap-renderer";
import { PostBreadcrumb } from "@/features/blog/components/shared/post-breadcrumb";
import { ShareButtons } from "@/features/blog/components/client/share-buttons";
import { PostStats } from "@/features/blog/components/client/post-stats";
import { Comments } from "@/features/blog/components/client/comments";
import { buildToc } from "@/features/blog/utils/toc";
import { getPostRouteId } from "@/lib/post-public-id";
import { supabase } from '@/lib/supabase/client';
import { Database } from "@/lib/supabase/types";
import { isExpectedSupabaseBuildError, logExpectedSupabaseBuildErrorOnce } from '@/lib/supabase/error-utils';

// Enable ISR for post detail pages (seconds)
export const revalidate = 60; // Regenerate at most once per minute

// 添加 Metadata 生成
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

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

async function findPostByIdentifier(identifier: string): Promise<Post | null> {
  const { data: postByPublicId, error: publicIdError } = await supabase
    .from('posts')
    .select('*')
    .eq('public_id', identifier)
    .eq('published', true)
    .maybeSingle();

  if (publicIdError) {
    throw publicIdError;
  }

  if (postByPublicId) {
    return postByPublicId as Post;
  }

  const { data: postBySlug, error: slugError } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', identifier)
    .eq('published', true)
    .maybeSingle();

  if (slugError) {
    throw slugError;
  }

  return postBySlug ? (postBySlug as Post) : null;
}

async function getPost(slug: string): Promise<Post | null> {
  try {
    return await findPostByIdentifier(slug);
  } catch (error) {
    if (isExpectedSupabaseBuildError(error)) {
      logExpectedSupabaseBuildErrorOnce(
        'post-page-build-fallback',
        'Skipping post detail fetch because Supabase is unavailable in this environment:',
        error
      )
    } else {
      console.error('Error fetching post:', error)
    }
    return null;
  }
}

async function getAllPosts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('public_id, slug')
      .eq('published', true)
      .neq('slug', 'about');

    if (error) {
      if (!isExpectedSupabaseBuildError(error)) {
        console.error('Failed to fetch posts:', error)
      }
      return [];
    }

    return data as { public_id: string | null; slug: string }[];
  } catch (error) {
    if (isExpectedSupabaseBuildError(error)) {
      logExpectedSupabaseBuildErrorOnce(
        'post-page-all-posts-build-fallback',
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
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.public_id || post.slug }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  // Calculate reading time from content
  const readingTime = post.reading_time 
    ? `${post.reading_time} 字` 
    : null;

  // 生成目录
  const toc = buildToc(post.content)
  const routeId = getPostRouteId({ publicId: post.public_id, slug: post.slug })

  return (
    <PostLayout toc={toc}>
      <FadeIn>
        <PostBreadcrumb title={post.title} />
        
        <article className="article-shell">
          <div className="article-hero">
            <h1 className="article-title text-3xl md:text-4xl lg:text-5xl">{post.title}</h1>
            <div className="article-meta-row">
              <div className="flex min-w-0 flex-1 flex-col items-start gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
                <time dateTime={post.published_at || post.created_at} className="whitespace-nowrap text-sm truncate block min-w-0">
                  {new Date(post.published_at || post.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
                {readingTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="hidden sm:inline">•</span>
                    <span className="sm:inline">{readingTime}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <PostStats slug={routeId} />
                <ShareButtons
                  url={`https://blog.zzemy.top/posts/${routeId}`}
                />
              </div>
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {post.tags.map((tag: string) => (
                  <Link key={tag} href={`/tags/${tag}`} className="no-underline">
                    <span className="article-tag">
                      #{tag}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <TipTapRenderer 
            className="mt-10"
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
