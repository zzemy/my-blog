import Link from "next/link";
import { getPublishedPosts } from "@/lib/supabase/posts";
import { PostList } from "@/features/blog/components/shared/post-list";
import { FadeIn } from "@/shared/visuals/fade-in";
import { TypewriterEffect } from "@/shared/visuals/typewriter-effect";
import { TextShimmer } from "@/shared/visuals/text-shimmer";
import { HomeButtons } from "@/features/blog/effects/home-buttons";
import { SiteUptimeBadge } from "@/shared/components/common/site-uptime";
import { getSiteSettings } from "@/lib/site-settings";
import { VantaBackground } from "@/shared/effects/vanta-background";

export const revalidate = 60;

export default async function Home() {
  const settings = await getSiteSettings();
  const posts = await getPublishedPosts();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <VantaBackground />
      <div className="relative z-10 container mx-auto px-4 py-6 md:py-10">
        {/* Hero Section: 网站欢迎区域 */}
        <FadeIn className="mx-auto flex max-w-[980px] flex-col items-center gap-4 py-8 md:py-12 md:pb-8 lg:py-20 lg:pb-12 text-center">
          <h1 className="font-handwriting text-4xl font-semibold leading-tight tracking-[0.02em] md:text-7xl lg:leading-[1.1]">
            <TextShimmer className="inline-block">
              {settings.site_title || 'emmm'}
            </TextShimmer>
          </h1>
          <div className="font-handwriting-cjk max-w-[750px] text-lg text-muted-foreground/80 sm:text-xl h-8">
            <TypewriterEffect text={settings.site_description || '欢迎来到我的博客'} speed={150} waitBeforeDelete={5000} />
          </div>
          <div className="flex w-full max-w-2xl flex-col items-center gap-3 px-1 py-1">
            <HomeButtons viewPostsText="浏览文章" />
            <SiteUptimeBadge />
          </div>
        </FadeIn>

        {/* Posts Grid: 文章列表区域 */}
        <section className="mx-auto mt-8 max-w-5xl space-y-8 md:mt-10">
          <FadeIn delay={0.2} className="flex items-center justify-between border-b pb-2">
            <h2 className="text-2xl font-bold tracking-tight">发现</h2>
            <Link href="/posts" className="text-sm font-medium text-muted-foreground hover:text-primary">
              查看全部 &rarr;
            </Link>
          </FadeIn>
          
          <PostList posts={posts.slice(0, 3)} readMoreText="阅读更多" />
        </section>
      </div>
    </div>
  );
}
