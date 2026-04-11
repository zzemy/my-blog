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
import { HandDrawnArrow, HandDrawnStar, HandDrawnCloud, HandDrawnSmiley, HandDrawnScribble, HandDrawnHeart, HandDrawnLeaf, HandDrawnUnderline } from "@/shared/visuals/doodles";
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
         <CartoonBlob2 className="absolute -top-[5%] -left-[20%] md:-top-[5%] md:-left-[5%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] text-sky-100 fill-sky-100 dark:text-sky-500/5 dark:fill-sky-500/5 animate-[spin_40s_linear_infinite]" />
         <CartoonBlob3 className="absolute top-[60%] -right-[30%] md:top-[20%] md:-right-[5%] w-[400px] h-[400px] md:w-[700px] md:h-[700px] text-[#fcdec9] fill-[#fcdec9] dark:text-rose-500/5 dark:fill-rose-500/5 animate-[spin_50s_linear_infinite_reverse]" />
         
         <HandDrawnStar className="absolute top-[8%] right-[5%] md:top-[12%] md:right-[15%] w-10 h-10 md:w-16 md:h-16 text-[#ffc66d] fill-[#ffe4b5] dark:text-amber-500/10 dark:fill-amber-500/10 animate-[bounce_5s_infinite]" />
         <HandDrawnCloud className="absolute bottom-[40%] -left-[10%] md:bottom-[20%] md:left-[10%] w-20 h-20 md:w-32 md:h-32 text-emerald-200 fill-emerald-100 dark:text-emerald-500/10 dark:fill-emerald-500/10 animate-[bounce_8s_infinite_reverse]" />
         <HandDrawnLeaf className="absolute top-[8%] left-[10%] md:top-[15%] md:left-[40%] w-8 h-8 md:w-14 md:h-14 text-rose-300 fill-rose-100 dark:text-rose-500/10 dark:fill-rose-500/10 animate-[spin_10s_linear_infinite]" />
         <HandDrawnHeart className="absolute bottom-[20%] right-[10%] md:bottom-[25%] md:right-[25%] w-10 h-10 md:w-16 md:h-16 text-pink-300 fill-pink-100 dark:text-pink-500/10 dark:fill-pink-500/10 animate-[bounce_6s_infinite]" />
      </div>

      {/* 内容区域 */}
      <div className="w-full max-w-7xl mx-auto px-4 py-12 md:py-20 lg:py-24 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-12 lg:gap-16 relative z-10">
        
        {/* 左侧文字与按钮区 */}
        <FadeIn className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-6 md:gap-8 mt-4 md:mt-8 lg:mt-0 z-20 w-full">
          
          <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 bg-slate-50 dark:bg-slate-800/80 shadow-sm border border-slate-200 dark:border-slate-700/50 rounded-full font-bold text-slate-600 dark:text-slate-300 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform hover:scale-105 active:scale-95 cursor-default group backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
            <span className="text-[10px] sm:text-xs md:text-sm tracking-wide font-heading uppercase">Welcome to my digital garden</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold leading-[1.1] lg:leading-[1.15] text-slate-800 dark:text-white tracking-tight mt-1 md:mt-2 z-10 font-heading drop-shadow-sm transition-transform duration-500 relative">
            <span className="relative z-10">{settings.site_title || t('title')}</span>
            <HandDrawnStar className="hidden md:block absolute -top-6 -right-10 w-12 h-12 text-yellow-300 fill-yellow-200 dark:text-yellow-500/30 dark:fill-yellow-500/20 animate-[bounce_6s_infinite] z-0 opacity-80 pointer-events-none" />
          </h1>

          <div className="relative w-full max-w-sm sm:max-w-md md:max-w-2xl mx-auto lg:mx-0 mt-2 md:mt-4 cursor-default">
             <HandDrawnArrow className="hidden md:block absolute top-[80%] -left-8 lg:-left-12 w-10 h-10 text-indigo-400/70 dark:text-indigo-400/30 rotate-[140deg] opacity-70 pointer-events-none z-0" />
             <HandDrawnCloud className="hidden md:block absolute -top-12 right-0 lg:-right-4 w-14 h-14 text-sky-300/80 dark:text-sky-400/30 animate-[bounce_4s_infinite] opacity-80 pointer-events-none z-0" />
             <HandDrawnSmiley className="hidden md:block absolute -bottom-8 right-12 lg:right-16 w-8 h-8 text-pink-400/70 dark:text-pink-400/30 rotate-12 opacity-80 pointer-events-none z-0" />
             <div className="relative text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed min-h-[4rem] flex items-center justify-center lg:justify-start h-auto md:h-[4rem] z-10 w-full max-w-xl">
               <TypewriterEffect text={settings.site_description || t('description')} speed={100} waitBeforeDelete={3000} />
               <HandDrawnUnderline className="hidden sm:block absolute -bottom-2 -left-4 sm:left-0 w-full sm:w-[240px] h-3 sm:h-4 text-emerald-400/70 dark:text-emerald-400/40 -rotate-2 pointer-events-none z-[-1]" />
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mt-6 md:mt-8 w-full relative z-20">
            <div className="flex flex-row items-center gap-4 w-full sm:w-auto">
               <HomeButtons viewPostsText={t('viewPosts')} />
            </div>
            <div className="w-full sm:w-auto flex justify-center lg:justify-start mt-2 sm:mt-0">
               <SiteUptimeBadge />
            </div>
          </div>
          
          {/* 按钮下方的装饰性涂鸦 - 增强留白区域的卡通感和手绘感 */}
          <div className="relative w-full h-24 md:h-32 mt-4 lg:mt-8 pointer-events-none">
             <HandDrawnScribble className="absolute left-4 top-2 w-20 h-20 md:w-28 md:h-28 text-indigo-200 dark:text-indigo-400/20 -rotate-12" />
             <HandDrawnArrow className="absolute left-24 top-8 w-12 h-12 md:w-16 md:h-16 text-emerald-300 dark:text-emerald-400/20 rotate-[120deg]" />
             <HandDrawnStar className="absolute left-40 md:left-48 top-4 w-8 h-8 md:w-12 md:h-12 text-amber-300 fill-amber-100 dark:text-amber-500/20 dark:fill-amber-500/10 animate-[bounce_4s_infinite]" />
             <HandDrawnSmiley className="absolute right-10 md:right-1/4 top-6 w-10 h-10 md:w-14 md:h-14 text-pink-300 dark:text-pink-400/20 rotate-12 hover:scale-110 transition-transform" />
             <HandDrawnCloud className="absolute right-0 md:right-10 top-0 w-16 h-16 md:w-20 md:h-20 text-sky-200 fill-sky-100 dark:text-sky-500/20 dark:fill-sky-500/10 animate-[bounce_6s_infinite_reverse]" />
          </div>
        </FadeIn>

        {/* 右侧个人卡片 */}
        <FadeIn delay={0.2} className="w-full lg:w-[480px] flex justify-center relative mt-16 sm:my-12 lg:my-0 lg:pl-10">

          <CartoonBlob1 className="absolute -top-12 -right-8 md:-top-20 md:-right-16 w-64 h-64 md:w-80 md:h-80 text-violet-100 fill-violet-100 dark:text-violet-500/10 dark:fill-violet-500/10 animate-[spin_25s_linear_infinite] z-10 hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] scale-90" />
          <HandDrawnStar className="absolute -bottom-6 -left-4 md:-bottom-10 md:-left-10 w-20 h-20 md:w-28 md:h-28 text-amber-300 fill-amber-200 dark:text-amber-500/30 dark:fill-amber-500/20 animate-[bounce_5s_infinite] z-30 drop-shadow-sm hover:rotate-12 hover:scale-110 transition-transform duration-500 cursor-crosshair opacity-80" />

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
