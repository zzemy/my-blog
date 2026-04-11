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
  setRequestLocale(locale);

  const t = await getTranslations('Home');
  const tCommon = await getTranslations('Common');
  const settings = await getSiteSettings();
  const posts = await getPublishedPosts('zh');

  return (
    <div className="relative min-h-[calc(100vh-4rem)] container mx-auto px-4 py-12 md:py-16">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 max-w-6xl mx-auto">
        
        {/* Left Sidebar: Journal Cover / Bio */}
        <aside className="w-full lg:w-1/3 lg:sticky lg:top-24 h-fit flex flex-col gap-8">
          <FadeIn className="flex flex-col gap-6 relative">
            <div className="absolute -top-6 -left-6 text-amber-400 rotate-12 opacity-80 pointer-events-none">
              <HandDrawnStar className="w-10 h-10" />
            </div>

            <div className="relative inline-flex flex-col items-start mt-4">
              <h1 className="text-5xl font-black leading-tight tracking-wide md:text-6xl text-slate-800 dark:text-slate-100 font-handwriting-cjk">
                {settings.site_title || t('title')}
              </h1>
              <svg className="absolute -bottom-4 left-0 w-full h-8 text-primary/60 opacity-80 -z-10" viewBox="0 0 200 20" preserveAspectRatio="none">
                <path stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none"
                  d="M5,15 Q50,-5 100,10 T195,15" />
              </svg>
            </div>
            
            <div className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-bold font-handwriting-cjk">
              <TypewriterEffect text={settings.site_description || t('description')} speed={80} loop={true} />
            </div>

            <p className="text-muted-foreground font-medium leading-relaxed font-handwriting-cjk text-lg">
              Welcome to my digital garden. I write about coding, design, and life. Grab a cup of tea and stay a while.
            </p>

            <div className="flex flex-col items-start gap-6 mt-4">
              <HomeButtons viewPostsText={t('viewPosts')} />
              <SiteUptimeBadge />
            </div>
          </FadeIn>
        </aside>

        {/* Right Main Content: Blog Feed */}
        <main className="w-full lg:w-2/3 flex flex-col pt-8 lg:pt-0">
          <FadeIn delay={0.2} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-foreground/10 border-dashed pb-6 mb-10 gap-4">
            <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-foreground font-handwriting-cjk relative">
              <span className="relative z-10">{t('latestPosts')}</span>
              <HandDrawnScribble className="absolute -bottom-3 left-0 w-full h-6 text-primary/40 -z-10" />
            </h2>
            <Link href="/posts" className="text-lg font-bold text-muted-foreground hover:text-primary transition-colors group flex items-center gap-2 font-handwriting-cjk">
              {t('viewAll')} 
              <span className="group-hover:translate-x-1 transition-transform" aria-hidden="true">&rarr;</span>
            </Link>
          </FadeIn>
          
          <PostList posts={posts.slice(0, 5)} readMoreText={tCommon('readMore')} />
        </main>
        
      </div>
    </div>
  );
}
