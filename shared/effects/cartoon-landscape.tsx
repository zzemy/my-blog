'use client';

import { motion } from 'framer-motion';

// A visually rich, sticker-like cloud component
const CloudSvg = () => (
  <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible drop-shadow-sm">
    {/* Colored Drop Shadow (Sticker effect) */}
    <path 
      d="M 50,70 a 15,15 0 0,1 10,-15 a 25,25 0 0,1 40,0 a 15,15 0 0,1 10,15 q 15,5 15,20 q 0,15 -15,15 l -60,0 q -15,0 -15,-15 q 0,-15 15,-20" 
      className="fill-sky-100 dark:fill-slate-700/50" 
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
      className="stroke-slate-200 dark:stroke-slate-600" 
      strokeWidth="3.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    {/* Inner Fluffy Highlights/Detail Lines */}
    <path d="M 64,54 c 2,-3 8,-6 14,-3" fill="none" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M 90,58 c 3,-2 8,-2 10,1" fill="none" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M 54,75 c 0,-3 4,-5 8,-3" fill="none" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export function CartoonLandscape() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 动画笔记本网格背景，营造随时可以涂鸦的纸张感 */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* 手绘感流动线条 (调整：往下移动至大概在标题 "emmm" 下方的位置，形成动态背景托底感) */}
      <div className="absolute top-[32%] left-0 w-[200%] h-32 opacity-[0.15] dark:opacity-10 animate-[slide_30s_linear_infinite] z-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
          <motion.path 
            d="M 0,60 Q 150,-20 300,60 T 600,60 T 900,60 T 1200,60" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeDasharray="20 10" 
            strokeLinecap="round" 
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
          />
        </svg>
      </div>

      {/* 统一风格的高颜值云朵 1 (左上方横穿) */}
      <div className="absolute top-[2%] left-[10%] w-48 md:w-56 h-24 md:h-28 animate-[slide_60s_linear_infinite]">
        <CloudSvg />
      </div>

      {/* 统一风格的高颜值云朵 2 (右上极高处) */}
      <div className="absolute top-[-2%] right-[15%] w-40 md:w-48 h-20 md:h-24 animate-[slide-reverse_70s_linear_infinite]">
        <CloudSvg />
      </div>
      
      {/* 统一风格的高颜值云朵 3 (顶部居中偏左) */}
      <div className="absolute top-[8%] left-[40%] w-32 md:w-40 h-16 md:h-20 animate-[slide_55s_linear_infinite] delay-1000">
        <CloudSvg />
      </div>

      {/* 填补中间空旷区域的云朵 4 */}
      <div className="absolute top-[25%] left-[55%] w-24 md:w-32 h-12 md:h-16 animate-[slide-reverse_85s_linear_infinite] opacity-90">
        <CloudSvg />
      </div>

      {/* 填补空隙的涂鸦纸飞机 */}
      <div className="absolute top-[35%] left-[35%] w-8 md:w-12 h-8 md:h-12 animate-[slide_45s_linear_infinite]">
         <svg viewBox="0 0 24 24" className="w-full h-full text-slate-400 dark:text-slate-500 opacity-60 rotate-12">
            <path d="M22 2 L11 13 M22 2 l-7 20 -4-9 -9-4 20-7 z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
         </svg>
      </div>

      {/* 填补空隙的星星点点 */}
      <div className="absolute top-[18%] left-[25%] w-4 h-4 text-amber-300 dark:text-amber-600/60 animate-pulse">
         <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" />
         </svg>
      </div>
      <div className="absolute top-[40%] right-[35%] w-5 h-5 text-sky-300 dark:text-sky-600/60 animate-pulse delay-700">
         <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" />
         </svg>
      </div>

      {/* 卡通太阳/星球 (高处背景) */}
      <div className="absolute top-[4%] right-[5%] w-24 h-24 text-yellow-300 fill-yellow-100 dark:text-yellow-600/40 dark:fill-yellow-600/20 animate-[spin_40s_linear_infinite] opacity-80">
         <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="30" fill="inherit" stroke="currentColor" strokeWidth="3" strokeDasharray="6 4" />
            <path d="M50 0 L50 10 M50 90 L50 100 M0 50 L10 50 M90 50 L100 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M15 15 L25 25 M85 85 L75 75 M15 85 L25 75 M85 15 L75 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
         </svg>
      </div>

      {/* 底部融合动画涂鸦波浪 (海洋/草地感) */}
      <div className="absolute bottom-0 left-0 w-[200%] h-48 md:h-64 opacity-80 dark:opacity-40 animate-[slide_20s_linear_infinite]">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full">
          <path d="M0,40 C200,80 400,-20 600,40 C800,100 1000,0 1200,40 L1200,120 L0,120 Z" className="fill-emerald-100/50 dark:fill-emerald-900/30" />
          {/* Animated SVG line acting as handdrawn contour */}
          <motion.path 
            d="M0,40 C200,80 400,-20 600,40 C800,100 1000,0 1200,40" 
            fill="none" 
            className="stroke-emerald-400 dark:stroke-emerald-600"
            strokeWidth="3"
            strokeDasharray="15 15"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 10, ease: "linear", repeat: Infinity }}
          />
        </svg>
      </div>
      
      <div className="absolute bottom-0 left-0 md:left-[-50%] w-[200%] h-32 md:h-48 opacity-90 dark:opacity-50 animate-[slide-reverse_25s_linear_infinite]">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full">
          <path d="M0,60 C300,10 400,120 700,50 C1000,-20 1100,90 1200,60 L1200,120 L0,120 Z" className="fill-sky-100/60 dark:fill-sky-900/40" />
          {/* Handdrawn contour */}
          <motion.path 
            d="M0,60 C300,10 400,120 700,50 C1000,-20 1100,90 1200,60" 
            fill="none" 
            className="stroke-sky-400 dark:stroke-sky-600"
            strokeWidth="4"
            strokeDasharray="25 25"
            strokeLinecap="round"
            initial={{ strokeDashoffset: 100 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 3, ease: "linear", repeat: Infinity }}
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
      `}</style>
    </div>
  );
}
