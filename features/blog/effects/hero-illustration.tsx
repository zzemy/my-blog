"use client";

import { motion } from "framer-motion";

export function HeroIllustration() {
  return (
    <div className="relative w-full max-w-[400px] h-[400px] flex items-center justify-center">
      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="relative z-10"
      >
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full drop-shadow-2xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Desk */}
          <rect x="80" y="280" width="240" height="15" rx="7.5" fill="#E2E8F0" />
          <path d="M100 295 L80 380 M300 295 L320 380" stroke="#94A3B8" strokeWidth="10" strokeLinecap="round" />
          
          {/* Monitor Body */}
          <path d="M90 120 C90 110, 100 100, 110 100 L290 100 C300 100, 310 110, 310 120 L310 250 C310 260, 300 270, 290 270 L110 270 C100 270, 90 260, 90 250 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="8"/>
          
          {/* Monitor Screen */}
          <rect x="105" y="115" width="190" height="135" rx="4" fill="#0F172A" />
          
          {/* Code Lines on Screen */}
          <rect x="120" y="130" width="80" height="6" rx="3" fill="#38BDF8" />
          <rect x="120" y="145" width="140" height="6" rx="3" fill="#34D399" />
          <rect x="120" y="160" width="110" height="6" rx="3" fill="#A78BFA" />
          <rect x="135" y="175" width="100" height="6" rx="3" fill="#F472B6" />
          <rect x="135" y="190" width="120" height="6" rx="3" fill="#FBBF24" />
          <rect x="120" y="205" width="90" height="6" rx="3" fill="#38BDF8" />

          {/* Monitor Stand */}
          <path d="M180 270 L170 280 L230 280 L220 270 Z" fill="#CBD5E1" />

          {/* Laptop / Keyboard base */}
          <rect x="120" y="275" width="160" height="5" rx="2" fill="#94A3B8" />

          {/* Cute Plant */}
          <motion.g
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 1 }}
            originX="250" originY="280"
          >
            <path d="M50 280 L70 280 L65 240 L55 240 Z" fill="#D97706" />
            <path d="M60 240 Q40 210, 50 190 Q70 210, 60 240" fill="#10B981" />
            <path d="M60 240 Q80 210, 70 190 Q50 210, 60 240" fill="#34D399" />
            <circle cx="60" cy="220" r="15" fill="#059669" />
          </motion.g>

          {/* Coffee Mug */}
          <g transform="translate(320, 250)">
            <path d="M0 0 L20 0 L15 30 L5 30 Z" fill="#F43F5E" />
            <path d="M20 5 Q30 5, 25 15 Q18 15, 18 15" stroke="#F43F5E" strokeWidth="4" fill="none" />
            <motion.path
                d="M5 -5 Q10 -15, 5 -25 M15 -5 Q20 -15, 15 -25"
                stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" fill="none"
                animate={{ y: [-2, -8, -2], opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
          </g>
          
          {/* Floating Avatar/Character (Cat) Peeking over screen */}
          <motion.g 
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
          >
            {/* Cat Ears */}
            <path d="M160 100 L170 70 L190 90" fill="#FDBA74" />
            <path d="M240 100 L230 70 L210 90" fill="#FDBA74" />
            {/* Cat Head */}
            <ellipse cx="200" cy="100" rx="40" ry="30" fill="#FDBA74" />
            {/* Cat Eyes */}
            <circle cx="185" cy="95" r="4" fill="#1E293B" />
            <circle cx="215" cy="95" r="4" fill="#1E293B" />
            {/* Cat Nose/Mouth */}
            <path d="M200 102 L195 108 L200 110 L205 108 Z" fill="#F472B6" />
            {/* Paws on the screen */}
            <ellipse cx="170" cy="115" rx="8" ry="12" fill="#FDBA74" />
            <ellipse cx="230" cy="115" rx="8" ry="12" fill="#FDBA74" />
          </motion.g>

        </svg>
      </motion.div>
      
      {/* Floating Sparkles around */}
      <motion.div animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute top-10 left-10 text-yellow-400">✨</motion.div>
      <motion.div animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 3, delay: 1 }} className="absolute top-20 right-10 text-pink-400">✨</motion.div>
      <motion.div animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }} className="absolute bottom-20 left-20 text-emerald-400">✨</motion.div>

    </div>
  );
}
