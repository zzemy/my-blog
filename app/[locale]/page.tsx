import { Link } from "@/i18n/routing";
import { getPublishedPosts } from "@/lib/supabase/posts";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from 'next-intl/server';
import { PostList } from "@/features/blog/components/shared/post-list";
import { FadeIn } from "@/shared/visuals/fade-in";
import { HomeButtons } from "@/features/blog/effects/home-buttons";
import { SiteUptimeBadge } from "@/shared/components/common/site-uptime";
import { getSiteSettings } from "@/lib/site-settings";
import { TypewriterEffect } from "@/shared/visuals/typewriter-effect";
import { HandDrawnStar, HandDrawnCloud, HandDrawnSmiley, HandDrawnScribble } from "@/shared/visuals/doodles";

export const revalidate = 60;

const locales = ['zh', 'en', 'fr', 'ja'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Enable static rendering
  setRequestLocale(locale);

  const t = await getTranslations('Home');
  const tCommon = await getTranslations('Common');
  const settings = await getSiteSettings();
  // Content is authored in Chinese. Always fetch Chinese posts regardless of UI locale.
  const posts = await getPublishedPosts('zh');

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="relative z-10 container mx-auto px-4 py-6 md:py-10 flex flex-col items-center">
        {/* Hero Section: 网站欢迎区域 */}
        <FadeIn className="w-full max-w-[980px] flex flex-col items-center justify-center gap-8 py-16 md:py-24 text-center relative mt-6">
          
          {/* Hand-drawn Floating Accents */}
          <div className="absolute -top-4 right-10 md:right-32 text-amber-400 rotate-12 md:scale-125 animate-[bounce_5s_ease-in-out_infinite] opacity-80">
            <HandDrawnStar className="w-12 h-12" />
          </div>

          <div className="absolute top-20 left-4 md:left-24 text-emerald-400 -rotate-[15deg] md:scale-125 animate-[pulse_4s_ease-in-out_infinite] opacity-80">
             <HandDrawnCloud className="w-16 h-16" />
          </div>

          <div className="absolute bottom-40 right-4 md:right-16 text-indigo-400 rotate-[25deg] md:scale-150 animate-[pulse_6s_ease-in-out_infinite] hidden sm:block opacity-60">
            <HandDrawnSmiley className="w-10 h-10" />
          </div>

          <div className="absolute -bottom-10 left-10 md:left-20 text-rose-400 -rotate-[20deg] animate-[bounce_6s_ease-in-out_infinite] hidden sm:block opacity-60">
            <HandDrawnScribble className="w-16 h-16" />
          </div>

          <div className="relative inline-flex flex-col items-center mt-4">
            <h1 className="text-6xl font-black leading-tight tracking-wide md:text-8xl lg:leading-[1.1] relative z-10 text-slate-800 dark:text-slate-100">
              {settings.site_title || t('title')}
            </h1>
            <svg className="absolute -bottom-6 left-0 w-full h-12 text-amber-400 opacity-80 -z-10 animate-[pulse_3s_ease-in-out_infinite]" viewBox="0 0 200 20" preserveAspectRatio="none">
              <path stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none"
                d="M5,15 Q50,0 100,10 T195,15" />
            </svg>
          </div>
          
          <div className="h-20 sm:h-12 flex items-center justify-center mt-4 md:mt-8 w-full max-w-[80%] mx-auto">
            <h2 className="text-xl md:text-3xl text-slate-600 dark:text-slate-300 relative font-bold text-center">
              <TypewriterEffect text={settings.site_description || t('description')} speed={80} loop={true} />
            </h2>
          </div>

          <div className="flex w-full max-w-2xl flex-col items-center gap-6 mt-8">
            <HomeButtons viewPostsText={t('viewPosts')} />
            <SiteUptimeBadge />
          </div>
        </FadeIn>

        {/* Posts Grid: 文章列表区域 */}
        <section className="w-full mt-16 max-w-5xl space-y-10 md:mt-24">
          <FadeIn delay={0.2} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-muted pb-4 gap-4">
            <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-foreground">
              <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
              {t('latestPosts')}
            </h2>
            <Link href="/posts" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors hover:underline underline-offset-4">
              {t('viewAll')} <span aria-hidden="true">&rarr;</span>
            </Link>
          </FadeIn>
          
          <PostList posts={posts.slice(0, 3)} readMoreText={tCommon('readMore')} />
        </section>
      </div>
    </div>
  );
}
