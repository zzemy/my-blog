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
      
      {/* 丰富的卡通动态图形背景层 */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
         <CartoonBlob2 className="absolute top-[-10%] left-[-15%] md:top-[-10%] md:left-[-5%] w-[350px] h-[350px] md:w-[800px] md:h-[800px] text-sky-200 fill-sky-100 dark:fill-sky-400 dark:stroke-none opacity-50 dark:opacity-10 animate-[spin_60s_linear_infinite]" />
         <CartoonStarburst className="absolute top-[30%] -right-[20%] md:top-[-5%] md:-right-[10%] w-[300px] h-[300px] md:w-[700px] md:h-[700px] text-rose-200 fill-rose-100 dark:fill-rose-400 dark:stroke-none opacity-40 dark:opacity-10 animate-[spin_50s_linear_infinite_reverse]" />
         
         <HandDrawnSparkle className="absolute top-[10%] right-[10%] md:top-[12%] md:right-[20%] w-8 h-8 md:w-16 md:h-16 text-[#ffc66d] fill-[#ffe4b5] dark:text-amber-500/30 dark:fill-amber-500/10 animate-[bounce_5s_infinite]" />
         <HandDrawnSwirl className="absolute bottom-[40%] -left-[10%] md:bottom-[20%] md:left-[5%] w-16 h-16 md:w-24 md:h-24 text-emerald-200 dark:text-emerald-500/30 animate-[spin_20s_linear_infinite]" />
         <HandDrawnLeaf className="absolute top-[12%] left-[10%] md:top-[15%] md:left-[45%] w-8 h-8 md:w-14 md:h-14 text-rose-300 fill-rose-100 dark:text-rose-500/30 dark:fill-rose-500/10 animate-[spin_10s_linear_infinite_reverse]" />
         <HandDrawnPlanet className="absolute bottom-[20%] right-[10%] md:bottom-[25%] md:right-[25%] w-12 h-12 md:w-20 md:h-20 text-indigo-300 fill-indigo-100 dark:text-indigo-500/30 dark:fill-indigo-500/10 animate-[bounce_6s_infinite]" />
      </div>

      {/* 内容区域 */}
      <div className="w-full max-w-[1280px] mx-auto px-4 py-12 md:py-16 lg:py-20 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-10 lg:gap-8 relative z-10">
        
        {/* 左侧文字与按钮区 */}
        <FadeIn className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-6 md:gap-8 mt-4 md:mt-8 lg:mt-0 z-20 w-full lg:pr-10">
          
          <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 bg-slate-50 dark:bg-slate-800/80 shadow-sm border border-slate-200 dark:border-slate-700/50 rounded-full font-bold text-slate-600 dark:text-slate-300 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform hover:scale-105 active:scale-95 cursor-default group backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
            <span className="text-[10px] sm:text-xs md:text-sm tracking-wide font-heading uppercase">Welcome to my digital garden</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[5rem] font-extrabold leading-[1.1] lg:leading-[1.15] text-slate-800 dark:text-white tracking-tight mt-2 md:mt-4 z-10 font-heading drop-shadow-sm transition-transform duration-500 relative inline-block group">
            <span className="relative z-10 inline-block">{settings.site_title || t('title')}</span>
            <HandDrawnUnderline className="absolute -bottom-2 -left-2 w-[110%] h-4 sm:h-6 text-emerald-400/90 dark:text-emerald-400/60 -rotate-2 z-[-1] transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3" />
            <HandDrawnStar className="hidden md:block absolute -top-8 -right-14 w-12 h-12 md:w-16 md:h-16 text-yellow-400 fill-yellow-200 dark:text-yellow-500/30 dark:fill-yellow-500/20 animate-[spin_6s_linear_infinite] z-0 opacity-80 group-hover:scale-125 transition-transform" />
          </h1>

          <div className="relative w-full max-w-sm sm:max-w-md md:max-w-2xl mx-auto lg:mx-0 mt-6 md:mt-10 cursor-default">
             <HandDrawnArrow className="hidden md:block absolute top-[85%] -left-12 lg:-left-20 w-16 h-16 text-indigo-400/80 dark:text-indigo-400/40 rotate-[130deg] opacity-80 hover:scale-110 hover:-translate-x-2 transition-all duration-300 z-10" />
             <HandDrawnSmiley className="hidden lg:block absolute -top-16 right-4 w-14 h-14 text-pink-400/90 dark:text-pink-400/60 rotate-12 opacity-90 hover:scale-125 hover:rotate-[24deg] transition-all duration-300 z-10 cursor-pointer" />
             <div className="relative text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed min-h-[5rem] md:min-h-[6rem] z-10 w-full max-w-xl text-left border-l-4 border-slate-200 dark:border-slate-700 pl-4 sm:pl-5 py-1">
               <TypewriterEffect text={settings.site_description || t('description')} speed={50} waitBeforeDelete={6000} />
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 md:gap-6 mt-8 md:mt-10 w-full relative z-20">
            <div className="flex flex-row items-center gap-4 w-full sm:w-auto">
               <HomeButtons viewPostsText={t('viewPosts')} />
            </div>
            <div className="w-full sm:w-auto flex justify-center lg:justify-start mt-2 sm:mt-0">
               <SiteUptimeBadge />
            </div>
          </div>
          
          {/* 按钮下方的装饰性涂鸦 - 增强留白区域的卡通感和手绘感 */}
          <div className="relative w-full h-24 md:h-32 mt-6 lg:mt-12 pointer-events-none">
             <HandDrawnScribble className="absolute left-0 top-0 w-16 h-16 md:w-20 md:h-20 text-indigo-300 dark:text-indigo-400/60 -rotate-12 opacity-80" />
             <HandDrawnCloud className="absolute left-24 md:left-32 top-10 w-14 h-14 md:w-16 md:h-16 text-sky-300 fill-sky-100 dark:text-sky-400/60 dark:fill-sky-500/20 animate-[bounce_6s_infinite_reverse]" />
             <HandDrawnHeart className="absolute left-48 md:left-64 top-4 w-8 h-8 md:w-12 md:h-12 text-rose-300 fill-rose-100 dark:text-rose-400/60 dark:fill-rose-500/20 animate-[bounce_4s_infinite]" />
          </div>
        </FadeIn>

        {/* 右侧个人卡片 */}
        <FadeIn delay={0.2} className="w-full lg:w-[480px] flex justify-center relative mt-16 sm:my-12 lg:my-0 lg:pl-10">

          <CartoonBlob1 className="absolute -top-12 -right-8 md:-top-16 md:-right-10 w-48 h-48 md:w-64 md:h-64 text-amber-200 fill-amber-100 dark:fill-amber-400 dark:stroke-none opacity-70 dark:opacity-[0.15] animate-[spin_25s_linear_infinite] z-10 hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] scale-90" />
          <HandDrawnStar className="absolute -bottom-6 -left-4 md:-bottom-10 md:-left-10 w-16 h-16 md:w-24 md:h-24 text-[#ffc66d] fill-[#ffe4b5] dark:text-amber-500/30 dark:fill-amber-500/20 animate-[bounce_5s_infinite] z-30 drop-shadow-sm hover:rotate-12 hover:scale-110 transition-transform duration-500 cursor-crosshair opacity-80" />

          {/* Main Profile Card */}
          <div className="relative w-full max-w-[280px] sm:max-w-[320px] bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl p-6 sm:p-8 pb-8 sm:pb-10 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-none z-20 rounded-[2.5rem] border border-white dark:border-slate-700/50 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:border-slate-600/80 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group flex flex-col items-center">

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
                  Hi, I'm emmm!
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
      <div className="w-full relative h-24 md:h-32 mt-4 md:mt-8 mb-4 md:-mb-8 overflow-hidden flex items-center justify-center opacity-90 group pointer-events-auto select-none z-10 hidden sm:flex">
        {/* 手绘虚线波浪 */}
        <div className="absolute w-[200%] h-0.5 border-t-[3px] border-dashed border-slate-200 dark:border-slate-800 top-1/2 -translate-y-1/2 z-0 hidden md:block opacity-50"></div>
        
        {/* 一组可以随着鼠标划过变大跳跃的悬浮涂鸦图标 */}
        <div className="flex items-center justify-between w-full max-w-[900px] px-8 relative z-10 transition-transform">
          <HandDrawnSmiley className="w-12 h-12 text-emerald-400 drop-shadow-sm hover:scale-[1.8] hover:-rotate-12 hover:-translate-y-4 hover:text-emerald-500 transition-all duration-300 cursor-grab active:cursor-grabbing hover:drop-shadow-lg" />
          
          <HandDrawnPlanet className="w-14 h-14 text-indigo-400 drop-shadow-sm hover:scale-[1.8] hover:rotate-[30deg] hover:-translate-y-4 hover:text-indigo-500 transition-all duration-300 cursor-grab active:cursor-grabbing hover:drop-shadow-lg" />
          
          <div className="px-6 py-2.5 border-[3px] border-dashed border-slate-300 dark:border-slate-600 rounded-[2rem] font-black text-slate-400 dark:text-slate-400 tracking-[0.25em] text-sm md:text-base uppercase hover:scale-110 hover:-rotate-[3deg] hover:border-sky-400 dark:hover:border-sky-400 hover:text-sky-500 dark:hover:text-sky-300 transition-all duration-300 font-heading bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm cursor-crosshair hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)]">
            Explore 🚀
          </div>
          
          <HandDrawnStar className="w-12 h-12 text-amber-400 drop-shadow-sm hover:scale-[1.8] hover:rotate-[72deg] hover:-translate-y-4 hover:text-amber-500 transition-all duration-300 cursor-grab active:cursor-grabbing hover:drop-shadow-lg" />
          
          <HandDrawnSwirl className="w-12 h-12 text-rose-400 drop-shadow-sm hover:scale-[1.8] hover:-rotate-[45deg] hover:-translate-y-4 hover:text-rose-500 transition-all duration-300 cursor-grab active:cursor-grabbing hover:drop-shadow-lg" />
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
