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
          
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#baffc9] dark:bg-green-900 border-[2.5px] border-slate-700 dark:border-slate-300 shadow-[4px_4px_0_0_#334155] dark:shadow-[4px_4px_0_0_#94a3b8] -rotate-2 rounded-full font-bold text-slate-800 dark:text-green-100 transition-transform hover:rotate-0 hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0_0_#334155] dark:hover:shadow-[2px_2px_0_0_#94a3b8] sketch-ui">
            <HandDrawnStar className="text-slate-800 dark:text-green-100 fill-yellow-300 w-6 h-6 animate-[spin_4s_linear_infinite]" /> 
            <span className="text-sm md:text-base tracking-wide font-handwriting-cjk text-lg">Welcome to my digital garden</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] font-black leading-tight lg:leading-[1.1] text-slate-800 dark:text-white tracking-tight mt-4 z-10 font-handwriting-cjk drop-shadow-sm">
            {settings.site_title || t('title')}
          </h1>

          <div className="relative w-full max-w-xl mx-auto lg:mx-0 mt-4">
             <div className="absolute -inset-4 bg-[#bae1ff] dark:bg-sky-900 skew-y-2 rounded-2xl -z-10 border-[2.5px] border-slate-700 dark:border-slate-300 shadow-[6px_6px_0_0_#334155] dark:shadow-[6px_6px_0_0_#94a3b8] sketch-ui"></div>
             <p className="text-xl md:text-2xl text-slate-800 dark:text-sky-100 font-bold p-3 leading-relaxed font-handwriting-cjk">
               <TypewriterEffect text={settings.site_description || t('description')} speed={80} loop={true} />
             </p>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-8 w-full">
            <HomeButtons viewPostsText={t('viewPosts')} />
          </div>
        </FadeIn>

        {/* 右侧拍立得相框区 */}
        <FadeIn delay={0.2} className="w-full lg:w-[450px] flex justify-center relative my-12 lg:my-0 mr-2 md:mr-8 group">
          
          {/* Accent graphics behind */}
          <div className="absolute top-4 -right-10 w-32 h-32 bg-[#ffdfba] dark:bg-orange-900 border-[2.5px] border-slate-700 dark:border-slate-300 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] z-10 animate-[spin_12s_linear_infinite] shadow-[6px_6px_0_0_#334155] dark:shadow-[6px_6px_0_0_#94a3b8]" />
          <HandDrawnCloud className="absolute -bottom-8 -left-8 w-32 h-32 text-slate-800 dark:text-slate-300 fill-white dark:fill-zinc-800 stroke-[2px] z-30 animate-[bounce_3s_infinite] drop-shadow-md" />

          {/* Main Photograph */}
          <div className="relative w-64 lg:w-[340px] bg-white dark:bg-zinc-800 border-[2.5px] border-slate-700 dark:border-slate-300 p-5 pb-20 rotate-3 shadow-[10px_10px_0_0_#334155] dark:shadow-[10px_10px_0_0_#94a3b8] hover:rotate-[1deg] hover:scale-105 hover:-translate-y-2 transition-all duration-500 z-20 rounded-xl sketch-ui group-hover:-rotate-2">
             
             {/* Tape holding the picture */}
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-28 h-12 bg-[#ffb3ba] dark:bg-rose-900 border-[2px] border-slate-700 dark:border-slate-300 -rotate-[6deg] z-30 opacity-95 shadow-sm flex justify-center items-center sketch-ui backdrop-blur-none">
                 <span className="opacity-60 font-bold text-lg tracking-widest text-slate-800 dark:text-rose-100">///</span>
             </div>
             
             {/* Picture Frame */}
             <div className="w-full aspect-square bg-[#ffffba] dark:bg-yellow-900/50 overflow-hidden relative flex flex-col items-center justify-center rounded-lg border-[2.5px] border-slate-700 dark:border-slate-300 bg-[radial-gradient(#000_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:16px_16px]">
                <HandDrawnSmiley className="w-36 h-36 lg:w-44 lg:h-44 text-slate-800 dark:text-yellow-100 stroke-[2px] group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-500 fill-white dark:fill-zinc-800 relative z-20" />
                <HandDrawnStar className="absolute top-4 right-4 w-14 h-14 text-slate-800 dark:text-slate-300 fill-[#bae1ff] dark:fill-sky-900 stroke-[2.5px] animate-[pulse_2s_infinite] group-hover:animate-bounce z-10" />
                <div className="absolute bottom-0 w-full h-[25%] bg-[#ffdfba] dark:bg-orange-950 border-t-[2.5px] border-slate-700 dark:border-slate-300 z-0"></div>
             </div>
             
             {/* Caption */}
             <div className="absolute bottom-5 left-0 w-full text-center">
                <span className="text-3xl font-black text-slate-800 dark:text-slate-200 font-handwriting-cjk rotate-[-3deg] inline-block hover:scale-110 transition-transform">
                  Hi, I'm emmm!
                </span>
             </div>
          </div>

        </FadeIn>
      </div>

      {/* Posts Grid: 文章列表区域 */}
      <section className="w-full mt-24 max-w-[1280px] mx-auto px-4 md:px-8 space-y-12 relative z-20">
        <FadeIn delay={0.2} className="flex flex-col sm:flex-row items-center justify-between border-b-[4px] border-slate-700 dark:border-slate-300 border-dashed pb-6 gap-6 relative">
          
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight flex items-center gap-4 text-slate-800 dark:text-slate-100 z-10 font-handwriting-cjk">
            <span className="w-6 h-12 bg-[#ffb3ba] dark:bg-rose-900 border-[2.5px] border-slate-700 dark:border-slate-300 rounded-lg shadow-[3px_3px_0_0_#334155] dark:shadow-[3px_3px_0_0_#94a3b8] -skew-x-[15deg]"></span>
            <span>{t('latestPosts')}</span>
          </h2>

          <Link href="/posts" className="text-lg md:text-xl font-black bg-[#e2c6ff] dark:bg-purple-900 text-slate-800 dark:text-purple-100 px-6 py-3 hover:-translate-y-1 hover:translate-x-1 group flex items-center gap-2 border-[2.5px] border-slate-700 dark:border-slate-300 shadow-[4px_4px_0_0_#334155] dark:shadow-[4px_4px_0_0_#94a3b8] hover:shadow-[2px_2px_0_0_#334155] dark:hover:shadow-[2px_2px_0_0_#94a3b8] transition-all sketch-ui font-handwriting-cjk">
            {t('viewAll')} 
            <HandDrawnArrow className="w-6 h-6 text-slate-800 dark:text-purple-100 stroke-[2.5px] fill-transparent group-hover:translate-x-2 group-hover:translate-y-[-2px] group-hover:-rotate-12 transition-transform" />
          </Link>
        </FadeIn>
        
        <PostList posts={posts.slice(0, 6)} readMoreText={tCommon('readMore')} />
      </section>
    </div>
  );
}
