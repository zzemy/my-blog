'use client';

import { motion } from 'framer-motion';

// A visually rich, sticker-like cloud component
const CloudSvg = () => (
  <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible drop-shadow-sm">
    {/* Colored Drop Shadow (Sticker effect) */}
    <path 
      d="M 50,70 a 15,15 0 0,1 10,-15 a 25,25 0 0,1 40,0 a 15,15 0 0,1 10,15 q 15,5 15,20 q 0,15 -15,15 l -60,0 q -15,0 -15,-15 q 0,-15 15,-20" 
      className="fill-sky-100 dark:fill-slate-900/80" 
      transform="translate(4, 5)" 
    />
    {/* Main Cloud Body */}
    <path 
      d="M 50,70 a 15,15 0 0,1 10,-15 a 25,25 0 0,1 40,0 a 15,15 0 0,1 10,15 q 15,5 15,20 q 0,15 -15,15 l -60,0 q -15,0 -15,-15 q 0,-15 15,-20" 
      className="fill-white dark:fill-slate-800" 
    />
    {/* Soft Outline */}
    <path 
      d="M 50,70 a 15,15 0 0,1 10,-15 a 25,25 0 0,1 40,0 a 15,15 0 0,1 10,15 q 15,5 15,20 q 0,15 -15,15 l -60,0 q -15,0 -15,-15 q 0,-15 15,-20" 
      fill="none" 
      className="stroke-slate-200 dark:stroke-slate-650 dark:stroke-[rgba(71,85,105,0.8)]" 
      strokeWidth="3.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    {/* Inner Fluffy Highlights/Detail Lines */}
    <path d="M 64,54 c 2,-3 8,-6 14,-3" fill="none" className="stroke-slate-100 dark:stroke-slate-700/60" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M 90,58 c 3,-2 8,-2 10,1" fill="none" className="stroke-slate-100 dark:stroke-slate-700/60" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M 54,75 c 0,-3 4,-5 8,-3" fill="none" className="stroke-slate-100 dark:stroke-slate-700/60" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export function CartoonLandscape() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* 动画笔记本网格背景，营造随时可以涂鸦的纸张感。支持黑白双色适配 */}
      <div className="absolute inset-0 z-[-1] pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-0" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 opacity-0 dark:opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* 统一风格的高颜值云朵 1 (左上方横穿) */}
      <div className="absolute top-[5vh] md:top-[8vh] lg:top-[12vh] left-[2%] md:left-[5%] lg:left-[8%] w-32 md:w-48 lg:w-64 h-16 md:h-24 lg:h-32 animate-[slide_60s_linear_infinite] opacity-40 md:opacity-30 z-20 pointer-events-none">
        <CloudSvg />
      </div>

      {/* 统一风格的高颜值云朵 2 (右上极高处) */}
      <div className="absolute top-[8vh] md:top-[2vh] lg:top-[5vh] right-[2%] md:right-[10%] lg:right-[15%] w-24 md:w-40 lg:w-56 h-12 md:h-20 lg:h-28 animate-[slide-reverse_70s_linear_infinite] opacity-40 md:opacity-30 z-20 pointer-events-none">
        <CloudSvg />
      </div>
      
      {/* 统一风格的高颜值云朵 3 (顶部居中偏左) */}
      <div className="absolute top-[18vh] md:top-[18vh] lg:top-[22vh] left-[30%] md:left-[40%] lg:left-[45%] w-20 md:w-32 lg:w-48 h-10 md:h-16 lg:h-24 animate-[slide_55s_linear_infinite] delay-1000 opacity-30 md:opacity-20 z-20 pointer-events-none block">
        <CloudSvg />
      </div>

      {/* 填补中间空旷区域的云朵 4 */}
      <div className="absolute top-[50vh] md:top-[32vh] lg:top-[38vh] right-[30%] md:right-[40%] lg:right-[50%] w-24 md:w-36 h-12 md:h-18 animate-[slide-reverse_85s_linear_infinite] opacity-30 md:opacity-20 z-20 pointer-events-none block">
        <CloudSvg />
      </div>

      {/* 添加了一朵低空的云朵 */}
      <div className="absolute top-[75vh] lg:top-[60vh] right-[2%] md:right-[15%] lg:right-[20%] w-20 md:w-28 lg:w-40 h-10 md:h-14 lg:h-20 animate-[slide_90s_linear_infinite] opacity-40 md:opacity-30 z-20 pointer-events-none">
        <CloudSvg />
      </div>

      {/* 涂鸦纸飞机 1 */}
      <div className="absolute top-[65vh] md:top-[55vh] lg:top-[65vh] left-[5%] md:left-[20%] lg:left-[40%] w-8 md:w-8 lg:w-12 h-8 md:h-8 lg:h-12 animate-[slide_45s_linear_infinite] opacity-60 md:opacity-50 hover:opacity-100 transition-opacity z-20">
         <svg viewBox="-5 -5 34 34" className="w-full h-full text-sky-400 dark:text-sky-600 rotate-12 overflow-visible">
            <path d="M22 2 L11 13 M22 2 l-7 20 -4-9 -9-4 20-7 z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
         </svg>
      </div>

      {/* 涂鸦纸飞机 2 */}
      <div className="absolute top-[28vh] md:top-[25vh] lg:top-[28vh] right-[5%] md:right-[30%] lg:right-[38%] w-6 md:w-6 lg:w-10 h-6 md:h-6 lg:h-10 animate-[slide-reverse_35s_linear_infinite] delay-500 opacity-60 md:opacity-40 hover:opacity-100 transition-opacity z-20 block">
         <svg viewBox="-5 -5 34 34" className="w-full h-full text-indigo-400 dark:text-indigo-600 -scale-x-100 -rotate-12 overflow-visible">
            <path d="M22 2 L11 13 M22 2 l-7 20 -4-9 -9-4 20-7 z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
         </svg>
      </div>

      {/* 涂鸦小鸟飞越 (两只) */}
      <div className="absolute top-[25vh] md:top-[18vh] lg:top-[20vh] left-[10%] md:left-[15%] lg:left-[25%] w-6 md:w-6 lg:w-8 h-4 md:h-4 lg:h-6 animate-[slide_40s_linear_infinite] opacity-60 md:opacity-40 z-20">
         <svg viewBox="-5 -5 34 34" className="w-full h-full text-slate-500 dark:text-slate-400 overflow-visible">
            <path d="M2 12 Q 7 5, 12 12 Q 17 5, 22 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
         </svg>
      </div>
      <div className="absolute top-[22vh] md:top-[16vh] lg:top-[18vh] left-[8%] md:left-[13%] lg:left-[23%] w-4 md:w-4 lg:w-6 h-3 md:h-3 lg:h-5 animate-[slide_40s_linear_infinite] delay-150 opacity-40 md:opacity-30 z-20">
         <svg viewBox="-5 -5 34 34" className="w-full h-full text-slate-500 dark:text-slate-400 overflow-visible">
            <path d="M2 12 Q 7 5, 12 12 Q 17 5, 22 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
         </svg>
      </div>

      {/* 手绘热气球 */}
      <div className="absolute top-[45vh] md:top-[15vh] lg:top-[22vh] right-[2%] md:right-[5%] lg:right-[8%] w-12 md:w-12 lg:w-20 h-16 md:h-16 lg:h-24 animate-[slide-reverse_120s_linear_infinite] delay-1000 opacity-60 md:opacity-40 hover:opacity-100 transition-opacity z-20 block">
         <svg viewBox="-10 -10 120 140" className="w-full h-full overflow-visible">
            {/* Balloon body */}
            <path d="M50 10 C20 10 10 40 10 60 C10 80 40 90 40 100 L60 100 C60 90 90 80 90 60 C90 40 80 10 50 10 Z" fill="none" className="stroke-rose-400 dark:stroke-rose-600" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M50 10 C35 10 30 40 30 60 C30 80 40 90 40 100" fill="none" className="stroke-rose-300 dark:stroke-rose-700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M50 10 C65 10 70 40 70 60 C70 80 60 90 60 100" fill="none" className="stroke-rose-300 dark:stroke-rose-700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            {/* Basket */}
            <rect x="42" y="105" width="16" height="12" rx="2" fill="none" className="stroke-amber-600 dark:stroke-amber-700" strokeWidth="2" strokeLinejoin="round"/>
            {/* Ropes */}
            <line x1="40" y1="100" x2="42" y2="105" className="stroke-amber-600 dark:stroke-amber-700" strokeWidth="1.5" />
            <line x1="60" y1="100" x2="58" y2="105" className="stroke-amber-600 dark:stroke-amber-700" strokeWidth="1.5" />
         </svg>
      </div>

      {/* 卡通太阳/星球 (高处背景) */}
      <div className="absolute top-[2vh] md:top-[5vh] lg:top-[8vh] right-[2%] md:right-[8%] lg:right-[12%] w-16 md:w-24 h-16 md:h-24 text-yellow-300 fill-yellow-100 dark:text-yellow-500/60 dark:fill-yellow-500/10 animate-[spin_40s_linear_infinite] opacity-40 md:opacity-60 z-[20]">
         <svg viewBox="-20 -20 140 140" className="w-full h-full overflow-visible">
            <circle cx="50" cy="50" r="30" fill="inherit" stroke="currentColor" strokeWidth="3" strokeDasharray="6 4" />
            <path d="M50 0 L50 10 M50 90 L50 100 M0 50 L10 50 M90 50 L100 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M15 15 L25 25 M85 85 L75 75 M15 85 L25 75 M85 15 L75 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
         </svg>
      </div>

      {/* 底部融合动画涂鸦波浪 (海洋/草地感) */}
      <div className="absolute bottom-0 left-0 w-[200%] h-48 md:h-64 opacity-80 dark:opacity-20 animate-[slide_20s_linear_infinite] z-10 pointer-events-none">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full overflow-visible">
          <path d="M0,40 C200,80 400,-20 600,40 C800,100 1000,0 1200,40 L1200,120 L0,120 Z" className="fill-emerald-100/50 dark:fill-emerald-950/40" />
          {/* Animated SVG line acting as handdrawn contour */}
          <path 
            d="M0,40 C200,80 400,-20 600,40 C800,100 1000,0 1200,40" 
            fill="none" 
            className="stroke-emerald-400 dark:stroke-emerald-800"
            strokeWidth="3"
            strokeDasharray="15 15"
          />
        </svg>
      </div>
      
      <div className="absolute bottom-0 left-0 w-[200%] h-32 md:h-48 opacity-90 dark:opacity-30 animate-[slide-reverse_25s_linear_infinite] z-20 pointer-events-none">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full overflow-visible">
          <path d="M0,60 C300,10 400,120 700,50 C1000,-20 1100,90 1200,60 L1200,120 L0,120 Z" className="fill-sky-100/60 dark:fill-sky-950/50" />
          {/* Handdrawn contour */}
          <path 
            d="M0,60 C300,10 400,120 700,50 C1000,-20 1100,90 1200,60" 
            fill="none" 
            className="stroke-sky-400 dark:stroke-sky-800 animate-[dash-flow_3s_linear_infinite]"
            strokeWidth="4"
            strokeDasharray="25 25"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <style jsx>{`
        @keyframes slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes slide-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes dash-flow {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
