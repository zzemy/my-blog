'use client';

import { motion } from 'framer-motion';

export function CartoonLandscape() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 动画笔记本网格背景，营造随时可以涂鸦的纸张感 */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* 动态卡通云朵 (左上方横穿) */}
      <div className="absolute top-[2%] left-[10%] w-48 md:w-64 h-24 md:h-32 animate-[slide_60s_linear_infinite]">
        <svg viewBox="0 0 200 100" className="w-full h-full text-slate-100 dark:text-slate-800/80">
          <path d="M 50,50 a 20,20 0 0,1 15,-18 a 30,30 0 0,1 50,0 a 20,20 0 0,1 15,18 q 20,5 20,25 q 0,20 -20,20 l -80,0 q -20,0 -20,-20 q 0,-20 20,-25" fill="currentColor" />
          <path d="M 50,50 a 20,20 0 0,1 15,-18 a 30,30 0 0,1 50,0 a 20,20 0 0,1 15,18 q 20,5 20,25 q 0,20 -20,20 l -80,0 q -20,0 -20,-20 q 0,-20 20,-25" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="10 5" opacity="0.6" />
        </svg>
      </div>

      {/* 动态卡通云朵 2 (右上极高处) */}
      <div className="absolute top-[-2%] right-[15%] w-40 md:w-48 h-20 md:h-24 animate-[slide-reverse_70s_linear_infinite]">
        <svg viewBox="0 0 200 100" className="w-full h-full text-sky-50 dark:text-slate-800 opacity-80">
          <path d="M 50,60 a 15,15 0 0,1 10,-15 a 25,25 0 0,1 40,0 a 15,15 0 0,1 10,15 q 15,5 15,20 q 0,15 -15,15 l -60,0 q -15,0 -15,-15 q 0,-15 15,-20" fill="currentColor" />
          <path d="M 50,60 a 15,15 0 0,1 10,-15 a 25,25 0 0,1 40,0 a 15,15 0 0,1 10,15 q 15,5 15,20 q 0,15 -15,15 l -60,0 q -15,0 -15,-15 q 0,-15 15,-20" fill="none" stroke="#94a3b8" strokeWidth="2" opacity="0.5" />
        </svg>
      </div>
      
      {/* 动态卡通云朵 3 (顶部居中偏左) */}
      <div className="absolute top-[8%] left-[40%] w-32 md:w-40 h-16 md:h-20 animate-[slide_55s_linear_infinite] delay-1000 opacity-70">
         <svg viewBox="0 0 200 100" className="w-full h-full text-sky-100 dark:text-slate-700">
           <path d="M 50,60 a 15,15 0 0,1 10,-15 a 25,25 0 0,1 40,0 a 15,15 0 0,1 10,15 q 15,5 15,20 q 0,15 -15,15 l -60,0 q -15,0 -15,-15 q 0,-15 15,-20" fill="currentColor" />
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
