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
import { HandDrawnArrow, HandDrawnStar, HandDrawnCloud, HandDrawnSmiley, HandDrawnScribble } from "@/shared/visuals/doodles";
import { CartoonBlob1, CartoonBlob2, CartoonBlob3, CartoonStarburst } from "@/shared/visuals/cartoon-shapes";

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
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden flex flex-col justify-start pb-20">
      
      {/* 居中错落式相册布局 */}
      <div className="w-full max-w-6xl mx-auto px-4 py-16 md:py-24 flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">
        
        {/* 左侧文字与按钮区 */}
        <FadeIn className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-8 mt-8 lg:mt-0 z-20">
          
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-800 rounded-full font-bold shadow-sm text-foreground transition-transform hover:-translate-y-1">
            <HandDrawnStar className="text-rose-400 fill-rose-300 w-5 h-5 animate-pulse" /> 
            <span className="text-sm md:text-base tracking-wide text-rose-600 dark:text-rose-300">Welcome to my digital garden</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[4.5rem] font-bold leading-tight lg:leading-[1.2] text-foreground tracking-tight mt-2 z-10">
            {settings.site_title || t('title')}
          </h1>

          <div className="relative w-full max-w-xl mx-auto lg:mx-0">
             <div className="absolute -inset-4 bg-amber-50/50 dark:bg-amber-900/20 -skew-y-1 rounded-3xl -z-10 border border-amber-100 dark:border-amber-800 shadow-sm"></div>
             <p className="text-lg md:text-xl text-foreground/80 font-medium p-2 leading-relaxed">
               <TypewriterEffect text={settings.site_description || t('description')} speed={80} loop={true} />
             </p>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-6 w-full">
            <HomeButtons viewPostsText={t('viewPosts')} />
          </div>
        </FadeIn>

        {/* 右侧明信片相框区 */}
        <FadeIn delay={0.2} className="w-full lg:w-[450px] flex justify-center relative my-12 lg:my-0 mr-2 md:mr-8">
          
          {/* Accent graphics behind */}
          <div className="absolute top-4 -right-6 w-28 h-28 bg-purple-100/60 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-full z-10 animate-[pulse_6s_ease-in-out_infinite] shadow-sm blur-[2px]" />
          <HandDrawnCloud className="absolute -bottom-8 -left-8 w-28 h-28 text-sky-300 fill-sky-100/50 dark:fill-sky-900/20 stroke-sky-300 stroke-2 z-30 animate-bounce" />

          {/* Main Photograph */}
          <div className="relative w-64 lg:w-[320px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 pb-16 rotate-2 shadow-xl hover:rotate-0 hover:scale-105 transition-all duration-500 z-20 group rounded-lg">
             
             {/* Tape holding the picture */}
             <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-24 h-10 bg-amber-100/80 dark:bg-amber-900/40 backdrop-blur-sm -rotate-[4deg] z-30 opacity-90 shadow-sm flex justify-center items-center rounded-sm">
             </div>
             
             {/* Picture Frame */}
             <div className="w-full aspect-square bg-sky-50 dark:bg-sky-950/30 overflow-hidden relative flex flex-col items-center justify-center rounded-md border border-slate-100 dark:border-zinc-800">
                <HandDrawnSmiley className="w-36 h-36 lg:w-44 lg:h-44 text-slate-800 dark:text-slate-200 stroke-[1.5px] group-hover:scale-110 transition-transform duration-500 fill-transparent relative z-20" />
                <HandDrawnStar className="absolute top-6 right-6 w-10 h-10 text-amber-300 fill-amber-200 stroke-amber-400 stroke-2 animate-pulse z-10" />
             </div>
             
             {/* Caption */}
             <div className="absolute bottom-5 left-0 w-full text-center">
                <span className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                  Hi, I'm emmm!
                </span>
             </div>
          </div>

        </FadeIn>
      </div>

      {/* Posts Grid: 文章列表区域 */}
      <section className="w-full mt-20 max-w-[1280px] mx-auto px-4 md:px-8 space-y-12 relative z-20">
        <FadeIn delay={0.2} className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-slate-100 dark:border-zinc-800 pb-6 gap-6 relative">
          
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight flex items-center gap-4 text-foreground z-10">
            <span className="w-4 h-8 bg-primary/80 rounded-full shadow-sm"></span>
            <span>{t('latestPosts')}</span>
          </h2>

          <Link href="/posts" className="text-base md:text-lg font-bold bg-white dark:bg-zinc-900 text-slate-800 dark:text-slate-200 px-6 py-2.5 hover:-translate-y-1 transition-all group flex items-center gap-2 border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md rounded-full">
            {t('viewAll')} 
            <HandDrawnArrow className="w-5 h-5 text-primary stroke-2 fill-transparent group-hover:translate-x-1 group-hover:-rotate-12 transition-transform" />
          </Link>
        </FadeIn>
        
        <PostList posts={posts.slice(0, 6)} readMoreText={tCommon('readMore')} />
      </section>
    </div>
  );
}
