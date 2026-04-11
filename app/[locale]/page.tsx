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
      
      {/* 极其丰富的绝对纯色无渐变 SVG 动画背景层 */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
         <CartoonBlob2 className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] text-sky-100 fill-sky-100 dark:text-sky-950/30 dark:fill-sky-950/30 animate-[spin_40s_linear_infinite]" />
         <CartoonBlob3 className="absolute top-[30%] -right-[5%] w-[800px] h-[800px] text-pink-100 fill-pink-100 dark:text-pink-950/30 dark:fill-pink-950/30 animate-[spin_50s_linear_infinite_reverse]" />
         <HandDrawnStar className="absolute top-[20%] right-[20%] w-20 h-20 text-yellow-300 fill-yellow-200 dark:text-yellow-600/30 dark:fill-yellow-600/30 animate-[bounce_5s_infinite]" />
         <HandDrawnCloud className="absolute bottom-[20%] left-[10%] w-32 h-32 text-indigo-200 fill-indigo-100 dark:text-indigo-900/30 dark:fill-indigo-900/30 animate-[bounce_8s_infinite_reverse]" />
         <HandDrawnScribble className="absolute top-[50%] left-[40%] w-24 h-24 text-emerald-200 dark:text-emerald-900/30 animate-[spin_20s_linear_infinite]" />
      </div>

      {/* 内容区域 */}
      <div className="w-full max-w-6xl mx-auto px-4 py-16 md:py-24 flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">
        
        {/* 左侧文字与按钮区 */}
        <FadeIn className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-8 mt-8 lg:mt-0 z-20">
          
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-amber-100 dark:bg-amber-900/30 shadow-[0_8px_15px_-3px_rgba(251,191,36,0.15)] dark:shadow-none border border-amber-200 dark:border-amber-800/50 rounded-full font-bold text-amber-800 dark:text-amber-200 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform hover:scale-105 hover:-translate-y-1 active:scale-95 cursor-default group">
            <HandDrawnStar className="w-5 h-5 text-amber-500 dark:text-amber-300 fill-amber-300/50 dark:fill-amber-300/20 group-hover:rotate-45 transition-transform duration-300" />
            <span className="text-sm md:text-base tracking-wide font-heading">Welcome to my digital garden</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] font-black leading-tight lg:leading-[1.15] text-slate-800 dark:text-white tracking-tight mt-2 z-10 font-heading drop-shadow-sm hover:translate-y-[-2px] transition-transform duration-300">
            {settings.site_title || t('title')}
          </h1>

          <div className="relative w-full max-w-xl mx-auto lg:mx-0 mt-6 cursor-default">
             <div className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 font-bold leading-relaxed font-heading min-h-[4rem] flex items-center h-[4rem]">
               <TypewriterEffect text={settings.site_description || t('description')} speed={100} waitBeforeDelete={3000} />
             </div>
             <HandDrawnCloud className="absolute -top-12 -right-10 w-28 h-28 text-sky-500 dark:text-sky-400 fill-white dark:fill-sky-800 animate-[bounce_4s_infinite] transition-transform hover:scale-125 hover:rotate-12 cursor-grab" />
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 mt-10 w-full relative z-20">
            <HomeButtons viewPostsText={t('viewPosts')} />
          </div>
        </FadeIn>

        {/* 右侧极其活泼的纯色卡通悬浮卡 */}
        <FadeIn delay={0.2} className="w-full lg:w-[480px] flex justify-center relative my-12 lg:my-0 lg:pl-10">

          <CartoonBlob1 className="absolute -top-14 -right-10 w-64 h-64 text-pink-200 fill-pink-200 dark:text-pink-900/40 dark:fill-pink-900/40 animate-[spin_15s_linear_infinite] z-10 hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
          <HandDrawnStar className="absolute -bottom-6 -left-6 w-36 h-36 text-yellow-300 fill-yellow-200 dark:text-yellow-600 dark:fill-yellow-600 animate-[bounce_3s_infinite] z-30 drop-shadow-md hover:rotate-45 hover:scale-110 transition-transform duration-500 cursor-crosshair" />

          {/* Main Floating Card */}
          <div className="relative w-full max-w-[360px] bg-white dark:bg-slate-800 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-4 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] active:scale-95 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-20 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 overflow-hidden cursor-crosshair group">

             {/* Decorative Top Pill */}
             <div className="absolute top-6 right-8 px-5 py-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-sm font-bold rounded-full shadow-sm">
                 HELLO!
             </div>

             {/* Circular Avatar Container */}
             <div className="w-full aspect-square mt-8 bg-sky-50 dark:bg-sky-900/30 overflow-hidden relative flex flex-col items-center justify-center rounded-[3rem] border border-sky-100 dark:border-sky-800/50 group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                <div className="relative z-20 flex flex-col items-center justify-center space-y-4">
                   <HandDrawnSmiley className="w-40 h-40 text-sky-500 dark:text-sky-400 fill-white dark:fill-slate-800 stroke-[2px] group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
                </div>
             </div>

             {/* Content */}
             <div className="mt-8 text-center flex flex-col gap-3">
                <span className="text-3xl font-black text-slate-800 dark:text-white font-heading tracking-tight hover:text-sky-500 transition-colors">
                  Hi, I'm emmm!
                </span>
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-5 py-2.5 rounded-full inline-block mx-auto border border-slate-100 dark:border-slate-700">
                  Frontend Developer 🌈
                </span>
             </div>
          </div>
        </FadeIn>
      </div>

      {/* Posts Grid: 文章列表区域 */}
      <section className="w-full mt-32 max-w-[1280px] mx-auto px-4 md:px-8 space-y-12 relative z-20">
        <FadeIn delay={0.2} className="flex items-center justify-between pb-8 gap-6 border-b-[6px] border-slate-200 dark:border-slate-800 rounded-b-3xl">
          
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight flex items-center gap-5 text-slate-800 dark:text-white z-10 font-heading">
            <div className="relative flex items-center justify-center w-16 h-16 bg-pink-400 text-white rounded-[1.5rem] shadow-[0_10px_20px_rgb(244,114,182,0.5)] hover:scale-110 hover:rotate-12 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-crosshair">
               <svg xmlns="http://www.w3.org/2000/svg" className="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
            </div>
            <span>{t('latestPosts')}</span>
          </h2>

          <Link href="/posts" className="text-lg font-black bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-8 py-4 hover:-translate-y-2 active:translate-y-1 active:scale-95 group flex items-center gap-3 border-none shadow-[0_15px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.12)] rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] tracking-wide">
            {t('viewAll')} 
            <svg xmlns="http://www.w3.org/2000/svg" className="size-6 text-slate-400 group-hover:text-pink-500 group-hover:translate-x-2 group-hover:scale-125 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
          </Link>
        </FadeIn>
        
        <PostList posts={posts.slice(0, 6)} readMoreText={tCommon('readMore')} />
      </section>
    </div>
  );
}
