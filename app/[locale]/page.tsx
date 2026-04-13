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
import { CartoonLandscape } from "@/shared/effects/cartoon-landscape";

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
    <div className="relative overflow-hidden flex flex-col justify-start pb-12 w-full font-sans tracking-tight">
      {/* 动画笔记本网格与手绘动态涂鸦全局背景 */}
      <CartoonLandscape />

      {/* 内容区域 */}
      <div className="w-full max-w-7xl mx-auto px-4 py-8 md:py-16 lg:py-24 xl:py-32 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 xl:gap-20 relative z-10">
        
        {/* 左侧文字与按钮区 */}
        <FadeIn className="flex-1 w-full flex flex-col items-center lg:items-start text-center lg:text-left z-20 relative mt-4 md:mt-8">

          <div className="animate-float-slow w-full flex justify-center lg:justify-start relative">
            <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 bg-yellow-100 dark:bg-amber-950/40 shadow-[4px_4px_0px_#f59e0b] dark:shadow-[4px_4px_0px_#78350f] border-2 border-yellow-400 dark:border-amber-700/50 rounded-lg font-bold text-yellow-800 dark:text-amber-400 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-default group mb-6 md:mb-8">
              <span className="text-[10px] sm:text-xs md:text-sm tracking-widest font-black uppercase">✨ Welcome to my digital garden</span>
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] lg:text-[6rem] xl:text-[6.5rem] font-black leading-[1.1] text-slate-800 dark:text-slate-100 tracking-tight z-10 relative inline-block group mb-6 md:mb-8 transition-colors duration-300">
            {/* Text Stroke/Shadow Effect to look embossed */}
            <span className="relative z-10 inline-block px-1 [text-shadow:4px_4px_0px_#bae6fd] dark:[text-shadow:4px_4px_0px_#0284c7] hover:translate-x-1 hover:-translate-y-1 transition-transform duration-300">{settings.site_title || t('title')}</span>
          </h1>

          <div className="relative w-full max-w-[90%] sm:max-w-md md:max-w-2xl mx-auto lg:mx-0 cursor-default mb-8 md:mb-12 flex flex-col items-center lg:items-start group">
             <div className="relative min-h-[60px] sm:min-h-[80px] text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-slate-600 dark:text-slate-400 leading-relaxed sm:leading-relaxed z-10 w-full max-w-xl text-center lg:text-left mx-auto lg:mx-0 transition-all duration-300 flex items-start justify-center lg:justify-start">
               <TypewriterEffect text={settings.site_description || t('description')} speed={50} waitBeforeDelete={6000} />
             </div>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-8 relative z-20 mt-4">
             <HomeButtons viewPostsText={t('viewPosts')} />
             <div className="transition-transform hover:-translate-y-1">
               <SiteUptimeBadge />
             </div>
          </div>
        </FadeIn>

        {/* 右侧个人卡片 */}
        <FadeIn delay={0.2} className="flex-1 w-full flex justify-center lg:justify-end relative mt-12 sm:mt-16 lg:my-0">
          
          <div className="animate-float-rotate relative w-full flex justify-center lg:justify-end">
            
            {/* Added decorative elements around the avatar card */}
            <div className="absolute -right-4 bottom-20 w-16 h-6 bg-yellow-200/80 -rotate-[15deg] backdrop-blur-sm z-30 shadow-sm border border-yellow-300/50"></div>

            {/* Main Profile Card - Neo-Brutalism & Playful design */}
            <div className="relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[360px] bg-[#fff9ed] dark:bg-slate-800/90 backdrop-blur-sm p-8 sm:p-10 pb-10 sm:pb-12 shadow-[12px_12px_0px_#cbd5e1] dark:shadow-[12px_12px_0px_#0f172a] z-20 rounded-[2.5rem] border-4 border-slate-200 dark:border-slate-600 hover:-translate-y-2 hover:-rotate-[4deg] hover:shadow-[18px_18px_0px_#94a3b8] dark:hover:shadow-[18px_18px_0px_#020617] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group flex flex-col items-center rotate-2">
               
               {/* Inner dashed frame for planner style */}
               <div className="absolute inset-3 border-2 border-dashed border-amber-200/70 dark:border-slate-500/40 rounded-[2rem] pointer-events-none" />

               {/* Decorative Top Pill */}
               <div className="absolute -top-4 -right-4 px-5 py-2.5 bg-sky-400 dark:bg-sky-500 text-white font-black text-xs border-2 border-sky-100 dark:border-slate-600 rounded-xl shadow-[4px_4px_0px_#bae6fd] dark:shadow-[4px_4px_0px_#0369a1] rotate-[10deg] tracking-widest uppercase animate-float-slow">
                   HELLO!
               </div>

             {/* Circular Avatar */}
             <div className="w-36 h-36 sm:w-44 sm:h-44 mt-6 sm:mt-8 relative group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                <div className="absolute inset-0 bg-white dark:bg-slate-800 rounded-[2.5rem] rotate-45 border-[4px] border-amber-100 dark:border-slate-700 shadow-sm z-0 transition-transform group-hover:rotate-[60deg] duration-700"></div>
                <div className="absolute inset-1 bg-white dark:bg-slate-800 rounded-full border-[4px] border-slate-50 dark:border-slate-600 shadow-inner overflow-hidden z-10">
                  <Image src="/images/touxiang.jpg" alt="Avatar" fill priority sizes="(max-width: 640px) 144px, 176px" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
             </div>

             {/* Content */}
             <div className="mt-8 sm:mt-12 text-center flex flex-col gap-2 relative z-20 w-full mb-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-heading tracking-tight hover:text-sky-500 transition-colors mb-1">
                  Hi, I&apos;m emmm!
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-800 px-4 py-2 sm:py-2.5 mt-2 rounded-xl flex items-center justify-center gap-2 mx-auto border-2 border-slate-100 dark:border-slate-600 shadow-[2px_2px_0px_#e2e8f0] dark:shadow-[2px_2px_0px_#0f172a]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>
                  Frontend Developer
                </span>
             </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* 创意手绘风分隔线：虚线与引导箭头 */}
      <div className="w-full relative py-12 md:py-20 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity duration-500 z-10 max-w-5xl mx-auto px-4 select-none mt-4">
        <div className="flex-1 border-t-[3px] border-dashed border-slate-300 dark:border-slate-700/60 rounded-full"></div>
        
        <div className="px-6 flex flex-col items-center gap-3">
          <div className="text-slate-400 dark:text-slate-500 animate-bounce bg-white dark:bg-slate-800 p-2 rounded-full border-2 border-slate-200 dark:border-slate-700 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 5 0 14" />
              <path d="m19 12-7 7-7-7" />
            </svg>
          </div>
          <span className="font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] text-xs uppercase bg-slate-50 dark:bg-slate-800/50 px-4 py-1 rounded-full">
            Let's Explore 🚀
          </span>
        </div>

        <div className="flex-1 border-t-[3px] border-dashed border-slate-300 dark:border-slate-700/60 rounded-full"></div>
      </div>

      {/* Posts Grid: 文章列表区域 */}
      <section className="w-full mt-8 lg:mt-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-20">
        <FadeIn delay={0.2} className="flex items-center justify-between pb-8 gap-6 relative">
          {/* Comic-style separator line */}
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-4 text-slate-800 dark:text-white z-10 font-heading">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-100 text-amber-500 dark:bg-amber-900/40 dark:text-amber-400 border-[3px] border-amber-300 dark:border-amber-700/50 rounded-full shadow-[4px_4px_0px_#fde68a] dark:shadow-[4px_4px_0px_#78350f] rotate-[-5deg] animate-[bounce_4s_infinite]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <span>{t('latestPosts')}</span>
          </h2>

          <Link href="/posts" className="text-sm md:text-base font-bold bg-white hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-6 py-2.5 group flex items-center gap-2 border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#e2e8f0] dark:shadow-[4px_4px_0px_#1e293b] hover:shadow-[6px_6px_0px_#cbd5e1] dark:hover:shadow-[6px_6px_0px_#0f172a] hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer rounded-lg uppercase tracking-wider">
            {t('viewAll')} 
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </FadeIn>
        
        <PostList posts={posts.slice(0, 6)} readMoreText={tCommon('readMore')} />
      </section>
    </div>
  );
}
