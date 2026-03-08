import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PostList } from "@/features/blog/components/shared/post-list";
import { supabase } from '@/lib/supabase/client';
import { isExpectedSupabaseBuildError, logExpectedSupabaseBuildErrorOnce } from '@/lib/supabase/error-utils';

// Enable ISR for posts index page (seconds)
export const revalidate = 60; // Regenerate at most once per minute

const locales = ['zh', 'en', 'fr', 'ja'];

type PostRow = {
  id: string;
  slug: string;
  title: string;
  published_at: string | null;
  created_at: string;
  description: string | null;
  tags: string[] | null;
  reading_time: number | null;
  cover_image: string | null;
  locale: string;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

async function getPosts(locale: string) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('locale', locale)
      .eq('published', true)
      .neq('slug', 'about')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch posts:', error);
      return [];
    }

    return (data as PostRow[]).map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      date: post.published_at || post.created_at,
      summary: post.description || undefined,
      excerpt: post.description || undefined,
      tags: post.tags || undefined,
      readingTime: post.reading_time ? `${post.reading_time} 字` : undefined,
      coverImage: post.cover_image,
      locale: post.locale,
    }));
  } catch (error) {
    if (isExpectedSupabaseBuildError(error)) {
      logExpectedSupabaseBuildErrorOnce(
        'locale-posts-page-build-fallback',
        'Using empty localized posts list because Supabase is unavailable in this environment:',
        error
      )
    } else {
      console.error('Error fetching posts:', error)
    }
    return [];
  }
}

export default async function PostsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Posts');
  const tCommon = await getTranslations('Common');

  // Content is authored in Chinese. Always fetch Chinese posts regardless of UI locale.
  const posts = await getPosts('zh');
  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
        <div className="flex-1 space-y-4">
          <h1 className="inline-block font-bold text-4xl tracking-tight lg:text-5xl">{t('title')}</h1>
          <p className="text-xl text-muted-foreground">
            {t('description')}
          </p>
        </div>
      </div>
      <hr className="my-8" />
      <PostList posts={posts} readMoreText={tCommon('readMore')} />
    </div>
  );
}