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
import { HandDrawnArrow, HandDrawnStar, HandDrawnCloud, HandDrawnSmiley, HandDrawnScribble, HandDrawnHeart, HandDrawnLeaf, HandDrawnUnderline, HandDrawnSparkle, HandDrawnSwirl, HandDrawnPlanet } from "@/shared/visuals/doodles";
import { CartoonBlob1, CartoonBlob2, CartoonBlob3, CartoonStarburst } from "@/shared/visuals/cartoon-shapes";
import { Particles } from "@/shared/effects/particles";

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
    <div className="relative overflow-hidden flex flex-col justify-start pb-12 w-full">
      
      {/* 极简的几何背景层 */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden h-[1000px] max-h-[100vh]">
         {/* 仅保留浅蓝圆圈，提供基础的色彩铺垫，去除复杂的星星和琐碎的手绘元素以降低视觉噪音 */}
         <CartoonBlob2 className="absolute top-[-15%] left-[-15%] w-[400px] h-[400px] md:w-[700px] md:h-[700px] text-sky-200/50 fill-sky-100/50 dark:fill-sky-900/10 dark:stroke-none opacity-40 animate-[spin_60s_linear_infinite]" />
      </div>
      {/* 内容区域 */}
      <div className="w-full max-w-[1400px] mx-auto px-4 py-12 md:py-16 lg:py-20 xl:py-28 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-12 lg:gap-10 xl:gap-16 relative z-10">
        
        {/* 左侧文字与按钮区 */}
        <FadeIn className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-6 md:gap-8 mt-4 md:mt-8 lg:mt-0 z-20 w-full lg:pr-10 xl:pr-16">
          
          <div className="inline-flex items-center gap-2 md:gap-3 font-bold text-slate-500 dark:text-slate-400 transition-all duration-300 cursor-default group">
            <span className="text-xs md:text-sm tracking-widest font-heading uppercase">Welcome to my digital garden</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] lg:text-[6rem] xl:text-[6.5rem] font-black leading-[1.1] text-slate-800 dark:text-slate-100 tracking-tight mt-2 md:mt-4 z-10 font-heading relative inline-block">
            <span className="relative z-10 inline-block px-1">{settings.site_title || t('title')}</span>
          </h1>

          <div className="relative w-full max-w-[90%] sm:max-w-md md:max-w-2xl mx-auto lg:mx-0 mt-6 md:mt-8 cursor-default">
             <div className="relative text-[15px] sm:text-lg md:text-xl lg:text-xl text-slate-500 dark:text-slate-400 leading-relaxed z-10 w-full max-w-xl text-center lg:text-left mx-auto lg:mx-0 transition-all duration-300">
               <TypewriterEffect text={settings.site_description || t('description')} speed={50} waitBeforeDelete={6000} />
             </div>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-5 mt-6 md:mt-10 relative z-20">
             <HomeButtons viewPostsText={t('viewPosts')} />
             <SiteUptimeBadge />
          </div>
          
          {/* Removed decorative doodles below buttons to reduce visual noise */}
        </FadeIn>

        {/* 右侧个人卡片 */}
        <FadeIn delay={0.2} className="w-full lg:w-[480px] xl:w-[500px] flex justify-center lg:justify-end xl:justify-center relative mt-14 sm:my-12 lg:my-0 lg:pl-10">

          {/* Main Profile Card - simplified clean design */}
          <div className="relative w-full max-w-[280px] sm:max-w-[320px] bg-white dark:bg-slate-800 p-6 sm:p-8 pb-8 sm:pb-10 shadow-[8px_8px_0px_#e2e8f0] dark:shadow-[8px_8px_0px_#1e293b] z-20 rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-700 hover:-translate-y-2 hover:-rotate-1 hover:shadow-[14px_14px_0px_#cbd5e1] dark:hover:shadow-[14px_14px_0px_#0f172a] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group flex flex-col items-center">

             {/* Decorative Top Pill */}
             <div className="absolute top-4 right-5 sm:top-6 sm:right-6 px-3 sm:px-4 py-1 sm:py-1.5 bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-300 text-[9px] sm:text-[10px] font-bold rounded-full border border-slate-200/50 dark:border-slate-600/50 shadow-sm backdrop-blur-md z-30 tracking-widest uppercase">
                 HELLO
             </div>

             {/* Circular Avatar */}
             <div className="w-28 h-28 sm:w-36 sm:h-36 mt-4 relative bg-slate-50 dark:bg-slate-800/50 rounded-full border-[4px] sm:border-[6px] border-white dark:border-slate-700/80 shadow-md group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden">
                <Image src="/images/touxiang.jpg" alt="Avatar" fill priority sizes="(max-width: 640px) 112px, 144px" className="object-cover" />
             </div>

             {/* Content */}
             <div className="mt-6 sm:mt-8 text-center flex flex-col gap-1.5 sm:gap-2 relative z-20 w-full">
                <span className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-heading tracking-tight hover:text-sky-500 transition-colors">
                  Hi, I&apos;m emmm!
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-3 sm:px-4 py-1.5 sm:py-2 mt-1 sm:mt-2 rounded-full flex items-center justify-center gap-1 sm:gap-1.5 mx-auto border border-slate-100 dark:border-slate-700/80 shadow-sm shadow-slate-100 dark:shadow-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-500 dark:text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>
                  Frontend Developer
                </span>
             </div>
          </div>
        </FadeIn>
      </div>

      {/* 趣味涂鸦分隔带 - 填补留白，增加交互丰富度 */}
      <div className="w-full relative py-12 md:py-20 flex flex-col items-center justify-center opacity-90 group pointer-events-auto select-none z-10 flex w-full relative py-8 md:py-20">
        {/* 手绘虚线波浪 */}
        <div className="absolute w-full max-w-[1280px] h-0.5 border-t-[3px] border-dashed border-slate-200 dark:border-slate-800 top-1/2 -translate-y-1/2 z-0 hidden md:block opacity-50"></div>
        
        {/* 一组可以随着鼠标划过变大跳跃的悬浮涂鸦贴纸 */}
        <div className="flex items-center justify-between w-full max-w-[1000px] px-8 relative z-10">
          <HandDrawnSmiley className="w-12 h-12 text-emerald-400 drop-shadow-sm hover:scale-[1.8] hover:-rotate-12 hover:-translate-y-4 hover:text-emerald-500 transition-all duration-300 cursor-grab active:cursor-grabbing hover:drop-shadow-[0_10px_10px_rgba(52,211,153,0.3)] z-20" />
          
          <HandDrawnPlanet className="hidden sm:block w-14 h-14 text-indigo-400 drop-shadow-sm hover:scale-[1.8] hover:rotate-[30deg] hover:-translate-y-4 hover:text-indigo-500 transition-all duration-300 cursor-grab active:cursor-grabbing hover:drop-shadow-[0_10px_10px_rgba(129,140,248,0.3)] z-20" />
          
          <div className="relative px-6 py-2.5 sm:px-10 sm:py-3.5 border-[3px] border-dashed border-slate-300 dark:border-slate-600 rounded-[2rem] font-black text-slate-400 dark:text-slate-400 tracking-[0.25em] text-sm md:text-base uppercase hover:scale-110 hover:-rotate-[3deg] hover:border-sky-400 dark:hover:border-slate-500 hover:text-sky-500 dark:hover:text-sky-300 transition-all duration-300 font-heading bg-white dark:bg-slate-800 cursor-crosshair z-20 shadow-[6px_6px_0px_#e2e8f0] dark:shadow-[6px_6px_0px_#0f172a] hover:shadow-[10px_10px_0px_#38bdf8] dark:hover:shadow-[10px_10px_0px_#38bdf8] -translate-y-1 hover:-translate-y-3">
            Explore 🚀
          </div>
          
          <HandDrawnStar className="hidden md:block w-12 h-12 text-amber-400 drop-shadow-sm hover:scale-[1.8] hover:rotate-[72deg] hover:-translate-y-4 hover:text-amber-500 transition-all duration-300 cursor-grab active:cursor-grabbing hover:drop-shadow-[0_10px_10px_rgba(251,191,36,0.3)] z-20" />
          
          <HandDrawnSwirl className="w-12 h-12 text-rose-400 drop-shadow-sm hover:scale-[1.8] hover:-rotate-[45deg] hover:-translate-y-4 hover:text-rose-500 transition-all duration-300 cursor-grab active:cursor-grabbing hover:drop-shadow-[0_10px_10px_rgba(251,113,133,0.3)] z-20" />
        </div>
      </div>

      {/* Posts Grid: 文章列表区域 */}
      <section className="w-full mt-8 md:mt-16 lg:mt-20 max-w-[1280px] mx-auto px-4 md:px-8 space-y-10 md:space-y-12 relative z-20">
        <FadeIn delay={0.2} className="flex items-center justify-between pb-8 gap-6 relative">
          {/* Subtle separator line instead of heavy border */}
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>
          
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-4 text-slate-800 dark:text-white z-10 font-heading">
            <HandDrawnStar className="w-12 h-12 text-amber-400 fill-amber-200 dark:text-amber-600 dark:fill-amber-600/30 animate-[bounce_4s_infinite] hover:scale-110 hover:rotate-12 transition-transform cursor-pointer" />
            <span>{t('latestPosts')}</span>
          </h2>

          <Link href="/posts" className="text-sm md:text-base font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-6 py-2.5 group flex items-center gap-2 border border-slate-200 dark:border-slate-700/50 shadow-sm rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] tracking-wide">
            {t('viewAll')} 
            <HandDrawnArrow className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-all duration-300" />
          </Link>
        </FadeIn>
        
        <PostList posts={posts.slice(0, 6)} readMoreText={tCommon('readMore')} />
      </section>
    </div>
  );
}
