import { getPublishedPosts } from "@/lib/supabase/posts";
import { PostList } from "@/features/blog/components/shared/post-list";
import { FadeIn } from "@/shared/visuals/fade-in";
import { HeroTitle } from "@/shared/visuals/hero-title";
import { getSiteSettings } from "@/lib/site-settings";

export const revalidate = 60;

export default async function Home() {
  const settings = await getSiteSettings();
  const posts = await getPublishedPosts();

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="relative z-10 container mx-auto px-5 py-8 md:px-8 md:py-12">
        <HeroTitle
          title={settings.site_title || 'emmm'}
          description={settings.site_description || '欢迎来到我的博客'}
        />

        <section className="mx-auto mt-10 max-w-4xl md:mt-16">
          <FadeIn delay={0.15} className="mb-8 flex items-baseline justify-between border-b border-border/70 pb-4 dark:border-white/12">
            <h2 className="text-2xl font-bold tracking-normal">文章索引</h2>
            <span className="font-mono text-xs text-muted-foreground">{posts.length} 篇</span>
          </FadeIn>
          <PostList posts={posts} readMoreText="阅读全文" />
        </section>
      </div>
    </div>
  );
}
