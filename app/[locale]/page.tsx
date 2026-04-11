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
import { Particles } from "@/shared/effects/particles";
import { HeroIllustration } from "@/features/blog/effects/hero-illustration";

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
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Particles
          className="absolute inset-0"
          quantity={80}
          ease={80}
          color="#38bdf8"
          refresh
        />
      </div>
      <div className="relative z-10 container mx-auto px-4 py-6 md:py-10 flex flex-col items-center">
        {/* Hero Section: 网站欢迎区域 */}
        <FadeIn className="w-full max-w-4xl flex flex-col items-center gap-8 py-16 md:py-24 text-center relative mt-6">
          
          {/* Floating Accents */}
          <div className="absolute -top-4 right-10 md:right-32 text-amber-400 rotate-12 md:scale-125 animate-[bounce_5s_ease-in-out_infinite]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            </svg>
          </div>

          <div className="absolute top-20 left-4 md:left-24 text-emerald-400 -rotate-[15deg] md:scale-125 animate-[pulse_4s_ease-in-out_infinite]">
             <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
             </svg>
          </div>

          <div className="absolute bottom-40 right-4 md:right-16 text-indigo-400/60 rotate-[25deg] md:scale-150 animate-[pulse_6s_ease-in-out_infinite] hidden sm:block">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
            </svg>
          </div>

          <div className="absolute -bottom-10 left-10 md:left-20 text-rose-400/60 -rotate-[20deg] animate-[bounce_6s_ease-in-out_infinite] hidden sm:block">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>

          <div className="flex flex-col-reverse md:flex-row items-center justify-center gap-8 w-full">
            <div className="flex flex-col items-center md:items-start text-center md:text-left pt-6 relative z-10">
              <div className="relative inline-block mt-4">
                <h1 className="text-6xl font-black leading-tight tracking-tight md:text-8xl lg:leading-[1.1] relative z-10 text-slate-800 dark:text-slate-100">
                  {settings.site_title || t('title')}
                </h1>
                <svg className="absolute -bottom-8 left-0 w-full h-16 text-amber-400/90 -z-10 animate-[pulse_3s_ease-in-out_infinite]" viewBox="0 0 200 20" preserveAspectRatio="none">
                  <path stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none"
                    d="M5,15 Q50,0 100,10 T195,15" />
                </svg>
              </div>
              
              <div className="h-10 md:h-12 mt-4 md:mt-6 flex items-center justify-center md:justify-start overflow-hidden">
                <h2 className="text-xl md:text-3xl text-slate-600 dark:text-slate-300 relative font-bold inline-flex items-center min-w-max">
                  <TypewriterEffect text={settings.site_description || t('description')} speed={80} loop={false} />
                </h2>
              </div>

              <div className="flex w-full flex-col items-center md:items-start gap-8 mt-10">
                <HomeButtons viewPostsText={t('viewPosts')} />
                <SiteUptimeBadge />
              </div>
            </div>

            <div className="hidden md:flex flex-1 justify-end ml-4 mt-10 relative z-10 opacity-90 hover:opacity-100 transition-opacity">
              <HeroIllustration />
            </div>
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
