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
      className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-500/20 px-6 py-2.5 text-sm text-amber-700 dark:text-amber-300 border-2 border-transparent shadow-sm hover:shadow-md hover:-translate-y-1 rounded-full transition-all outline-none font-bold active:scale-95 group font-heading tracking-wide mx-auto lg:mx-0 duration-300 relative"
    >
      <span className="flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        <span>
          本站持续跳动 <span className="font-black text-lg text-amber-600 dark:text-amber-300 mx-1">{days}</span> 天
        </span>
      </span>
    </button>
  )
}
