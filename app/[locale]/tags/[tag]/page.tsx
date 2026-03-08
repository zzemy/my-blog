import { getPostsByTag, getPublishedPosts } from "@/lib/supabase/posts";
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PostList } from "@/features/blog/components/shared/post-list";

export const revalidate = 60;

const locales = ['zh', 'en', 'fr', 'ja'];

export async function generateStaticParams() {
  const params: { locale: string; tag: string }[] = [];
  const posts = await getPublishedPosts('zh');
  const tagSet = new Set<string>();

  for (const post of posts) {
    const tags = post.tags || [];
    for (const tag of tags) {
      const normalizedTag = tag.trim();
      if (normalizedTag) {
        tagSet.add(normalizedTag);
      }
    }
  }

  const allTags = Array.from(tagSet);

  for (const locale of locales) {
    allTags.forEach((tag) => {
      params.push({ locale, tag });
    });
  }

  return params;
}

export default async function TagPage({ params }: { params: Promise<{ locale: string; tag: string }> }) {
  const { locale, tag } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Tags');
  const tCommon = await getTranslations('Common');

  const decodedTag = decodeURIComponent(tag);
  // Fetch Chinese posts only — UI locale controls UI strings, not article language
  const posts = await getPostsByTag(decodedTag, 'zh');

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
        <div className="flex-1 space-y-4">
          <h1 className="inline-block font-bold text-4xl tracking-tight lg:text-5xl">#{decodedTag}</h1>
          <p className="text-xl text-muted-foreground">
            {t('count', { count: posts.length })}
          </p>
        </div>
      </div>
      <hr className="my-8" />
      <PostList posts={posts} readMoreText={tCommon('readMore')} />
    </div>
  );
}
