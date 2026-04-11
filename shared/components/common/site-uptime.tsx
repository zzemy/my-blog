"use client"

import { useMemo } from "react"
import { Cog } from "lucide-react"
import confetti from "canvas-confetti"

const START_TIMESTAMP = new Date("2025-11-20T00:00:00Z").getTime()
const MS_PER_DAY = 24 * 60 * 60 * 1000

const calcDays = () => {
  const now = Date.now()
  const diff = Math.max(0, now - START_TIMESTAMP)
  return Math.floor(diff / MS_PER_DAY)
}

export function SiteUptimeBadge() {
  const days = useMemo(() => calcDays(), [])

  const handleConfetti = () => {
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min
    }

    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        clearInterval(interval)
        return
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)
  }

  return (
    <button
      type="button"
      onClick={handleConfetti}
      className="inline-flex items-center gap-2 bg-[#ffeb3b] dark:bg-[#fbc02d] px-6 py-2.5 text-sm text-slate-800 dark:text-slate-900 border-[3px] border-slate-900 shadow-[4px_4px_0_0_rgb(15,23,42,1)] hover:shadow-[6px_6px_0_0_rgb(15,23,42,1)] hover:-translate-y-1 rounded-full transition-all outline-none font-bold active:scale-95 active:translate-y-1 active:shadow-none group font-heading tracking-wide mx-auto lg:mx-0 mt-4 duration-300 relative"
    >
      <span className="flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-900 group-hover:animate-[spin_4s_linear_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        <span>
          本站安全运行 <span className="font-black text-lg text-slate-900 mx-1">{days}</span> 天
        </span>
      </span>
    </button>
  )
}
