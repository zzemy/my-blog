import { Link } from "@/i18n/routing";
import Image from "next/image";
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
          
          <div className="inline-flex items-center gap-3 px-5 py-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 shadow-sm border border-amber-100/50 dark:border-amber-800/30 rounded-full font-bold text-amber-600 dark:text-amber-400 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform hover:scale-105 active:scale-95 cursor-default group backdrop-blur-sm">
            <HandDrawnStar className="w-4 h-4 text-amber-400 dark:text-amber-500 fill-amber-400/30 dark:fill-amber-500/20 group-hover:rotate-45 transition-transform duration-500" />
            <span className="text-xs md:text-sm tracking-wide font-heading uppercase">Welcome to my digital garden</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[4.5rem] font-extrabold leading-[1.1] lg:leading-[1.15] text-slate-800 dark:text-white tracking-tight mt-2 z-10 font-heading drop-shadow-sm transition-transform duration-500">
            {settings.site_title || t('title')}
          </h1>

          <div className="relative w-full max-w-xl mx-auto lg:mx-0 mt-4 cursor-default">
             <div className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed font-heading min-h-[4rem] flex items-center h-[4rem]">
               <TypewriterEffect text={settings.site_description || t('description')} speed={100} waitBeforeDelete={3000} />
             </div>
             <HandDrawnCloud className="absolute -top-16 -right-4 w-20 h-20 text-sky-400 dark:text-sky-500 fill-sky-50 dark:fill-sky-900/20 animate-[bounce_4s_infinite] transition-transform hover:scale-110 hover:-rotate-6 cursor-grab opacity-80" />
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-8 w-full relative z-20">
            <HomeButtons viewPostsText={t('viewPosts')} />
          </div>
        </FadeIn>

        {/* 右侧个人卡片 */}
        <FadeIn delay={0.2} className="w-full lg:w-[480px] flex justify-center relative my-12 lg:my-0 lg:pl-10">

          <CartoonBlob1 className="absolute -top-20 -right-16 w-80 h-80 text-pink-100 fill-pink-100 dark:text-pink-900/20 dark:fill-pink-900/20 animate-[spin_20s_linear_infinite] z-10 hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] scale-90" />
          <HandDrawnStar className="absolute -bottom-10 -left-10 w-28 h-28 text-yellow-300 fill-yellow-200/50 dark:text-yellow-600 dark:fill-yellow-600/30 animate-[bounce_5s_infinite] z-30 drop-shadow-sm hover:rotate-12 hover:scale-110 transition-transform duration-500 cursor-crosshair opacity-80" />

          {/* Main Profile Card */}
          <div className="relative w-full max-w-[320px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 pb-10 shadow-xl shadow-slate-200/50 dark:shadow-2xl z-20 rounded-[2.5rem] border border-white dark:border-slate-700/50 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group flex flex-col items-center">

             {/* Decorative Top Pill */}
             <div className="absolute top-6 right-6 px-4 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold rounded-full border border-emerald-100 dark:border-emerald-800/30 shadow-sm backdrop-blur-md z-30 tracking-widest uppercase">
                 HELLO
             </div>

             {/* Circular Avatar */}
             <div className="w-36 h-36 mt-4 relative bg-slate-50 dark:bg-slate-800 rounded-full border-[6px] border-white dark:border-slate-700 shadow-md group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden">
                <Image src="/images/touxiang.jpg" alt="Avatar" fill priority sizes="144px" className="object-cover" />
             </div>

             {/* Content */}
             <div className="mt-8 text-center flex flex-col gap-2 relative z-20 w-full">
                <span className="text-2xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight hover:text-sky-500 transition-colors">
                  Hi, I'm emmm!
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-4 py-2 mt-2 rounded-full inline-block mx-auto border border-slate-100 dark:border-slate-700 shadow-sm shadow-slate-100 dark:shadow-none">
                  Frontend Developer 🌈
                </span>
             </div>
          </div>
        </FadeIn>
      </div>

      {/* Posts Grid: 文章列表区域 */}
      <section className="w-full mt-32 max-w-[1280px] mx-auto px-4 md:px-8 space-y-12 relative z-20">
        <FadeIn delay={0.2} className="flex items-center justify-between pb-8 gap-6 relative">
          {/* Subtle separator line instead of heavy border */}
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>
          
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-4 text-slate-800 dark:text-white z-10 font-heading">
            <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-400 text-white rounded-2xl shadow-sm hover:scale-110 hover:rotate-12 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-crosshair">
               <svg xmlns="http://www.w3.org/2000/svg" className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
            </div>
            <span>{t('latestPosts')}</span>
          </h2>

          <Link href="/posts" className="text-sm md:text-base font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-6 py-2.5 group flex items-center gap-2 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] tracking-wide">
            {t('viewAll')} 
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-1 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
          </Link>
        </FadeIn>
        
        <PostList posts={posts.slice(0, 6)} readMoreText={tCommon('readMore')} />
      </section>
    </div>
  );
}
