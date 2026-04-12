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
      <div className="w-full max-w-[1400px] mx-auto px-4 py-12 md:py-20 lg:py-24 xl:py-32 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-16 md:gap-20 lg:gap-24 xl:gap-32 relative z-10">
        
        {/* 左侧文字与按钮区 */}
        <FadeIn className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left z-20 w-full lg:pr-4 xl:pr-10">
          
          <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 bg-yellow-100 dark:bg-yellow-900/40 shadow-[4px_4px_0px_#f59e0b] dark:shadow-[4px_4px_0px_#b45309] border-2 border-yellow-400 dark:border-yellow-600 rounded-lg font-bold text-yellow-800 dark:text-yellow-200 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-default group mb-6 md:mb-8 rotate-[-2deg]">
            <span className="text-[10px] sm:text-xs md:text-sm tracking-widest font-black uppercase">✨ Welcome to my digital garden</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] lg:text-[6rem] xl:text-[6.5rem] font-black leading-[1.1] text-slate-800 dark:text-slate-100 tracking-tight z-10 relative inline-block group mb-6 md:mb-8" style={{ textShadow: '4px 4px 0px rgba(100, 116, 139, 0.2)' }}>
            <span className="relative z-10 inline-block px-1">{settings.site_title || t('title')}</span>
          </h1>

          <div className="relative w-full max-w-[90%] sm:max-w-md md:max-w-2xl mx-auto lg:mx-0 cursor-default mb-8 md:mb-12">
             <div className="relative min-h-[60px] sm:min-h-[80px] text-base sm:text-lg md:text-xl lg:text-2xl text-slate-500 dark:text-slate-400 leading-relaxed sm:leading-relaxed z-10 w-full max-w-xl text-center lg:text-left mx-auto lg:mx-0 transition-all duration-300 flex items-start justify-center lg:justify-start">
               <TypewriterEffect text={settings.site_description || t('description')} speed={50} waitBeforeDelete={6000} />
             </div>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 relative z-20">
             <HomeButtons viewPostsText={t('viewPosts')} />
             <SiteUptimeBadge />
          </div>
          
          {/* Removed decorative doodles below buttons to reduce visual noise */}
        </FadeIn>

        {/* 右侧个人卡片 */}
        <FadeIn delay={0.2} className="w-full lg:w-[480px] xl:w-[500px] flex justify-center lg:justify-end xl:justify-center relative mt-16 sm:mt-24 lg:my-0 lg:pl-10">

          {/* Main Profile Card - Neo-Brutalism & Playful design */}
          <div className="relative w-full max-w-[280px] sm:max-w-[320px] bg-[#fff9ed] dark:bg-slate-800 p-8 sm:p-10 pb-10 sm:pb-12 shadow-[8px_8px_0px_#e2e8f0] dark:shadow-[8px_8px_0px_#1e293b] z-20 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:-translate-y-2 hover:-rotate-2 hover:shadow-[14px_14px_0px_#cbd5e1] dark:hover:shadow-[14px_14px_0px_#0f172a] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group flex flex-col items-center rotate-1">

             {/* Decorative Top Pill */}
             <div className="absolute -top-4 -right-4 px-4 py-2 bg-sky-400 dark:bg-sky-500 text-white font-black text-xs border-2 border-sky-100 dark:border-slate-600 rounded-lg shadow-[4px_4px_0px_#bae6fd] dark:shadow-[4px_4px_0px_#0ea5e9] rotate-[10deg] tracking-widest uppercase">
                 HELLO!
             </div>

             {/* Circular Avatar */}
             <div className="w-32 h-32 sm:w-40 sm:h-40 mt-6 sm:mt-8 relative bg-slate-50 dark:bg-slate-800/50 rounded-full border-[4px] sm:border-[6px] border-white dark:border-slate-700/80 shadow-md group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden">
                <Image src="/images/touxiang.jpg" alt="Avatar" fill priority sizes="(max-width: 640px) 128px, 160px" className="object-cover" />
             </div>

             {/* Content */}
             <div className="mt-8 sm:mt-10 text-center flex flex-col gap-2 relative z-20 w-full">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-heading tracking-tight hover:text-sky-500 transition-colors mb-1">
                  Hi, I&apos;m emmm!
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-4 py-2 sm:py-2.5 mt-2 rounded-full flex items-center justify-center gap-1.5 mx-auto border border-slate-100 dark:border-slate-700/80 shadow-sm shadow-slate-100 dark:shadow-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>
                  Frontend Developer
                </span>
             </div>
          </div>
        </FadeIn>
      </div>

      {/* 纯CSS大色块涂鸦分隔带 - Comic 面板风格，不留碎片 */}
      <div className="w-full relative py-12 md:py-24 flex flex-col items-center justify-center opacity-100 group pointer-events-auto select-none z-10">
        
        <div className="relative group perspective-1000">
           {/* 背景阴影色块 */}
           <div className="absolute inset-0 bg-sky-400 rounded-3xl rotate-[6deg] translate-x-2 translate-y-3 dark:bg-sky-600 border-4 border-black"></div>
           
           {/* 交互主体 */}
           <div className="relative px-12 py-6 bg-white dark:bg-slate-800 border-4 border-black rounded-2xl font-black text-slate-800 dark:text-slate-100 tracking-widest text-lg md:text-2xl uppercase hover:scale-105 hover:-rotate-[2deg] hover:bg-yellow-100 transition-all duration-300 font-heading cursor-grab active:cursor-grabbing z-20 shadow-[8px_8px_0px_#f43f5e] dark:shadow-[8px_8px_0px_#e11d48]">
             LET'S EXPLORE 🚀
           </div>
        </div>

      </div>

      {/* Posts Grid: 文章列表区域 */}
      <section className="w-full mt-8 md:mt-16 lg:mt-20 max-w-[1280px] mx-auto px-4 md:px-8 space-y-10 md:space-y-12 relative z-20">
        <FadeIn delay={0.2} className="flex items-center justify-between pb-8 gap-6 relative">
          {/* Comic-style separator line */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-black dark:bg-slate-700 rounded-full"></div>
          
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-4 text-slate-800 dark:text-white z-10 font-heading">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-300 dark:bg-amber-600 border-4 border-black rounded-full shadow-[4px_4px_0px_#000] rotate-[-5deg] animate-[bounce_4s_infinite]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="black" strokeWidth="2" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <span>{t('latestPosts')}</span>
          </h2>

          <Link href="/posts" className="text-sm md:text-base font-bold bg-white hover:bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-6 py-2.5 group flex items-center gap-2 border-2 border-black dark:border-slate-500 shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#64748b] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#64748b] hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer rounded-lg uppercase tracking-wider">
            {t('viewAll')} 
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </FadeIn>
        
        <PostList posts={posts.slice(0, 6)} readMoreText={tCommon('readMore')} />
      </section>
    </div>
  );
}
