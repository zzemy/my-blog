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
      className="sketch-ui inline-flex items-center gap-3 bg-background px-4 py-2 text-left text-sm text-foreground border-2 border-foreground/10 hover:border-foreground/20 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all outline-none font-bold active:scale-95 group font-handwriting-cjk"
    >
      <span className="flex flex-col leading-tight">
        <span className="flex items-center justify-center gap-1.5">
          <span className="text-foreground/90">本站已强行苟活</span>
          <span className="font-black text-lg text-primary mx-1">{days}</span>
          <span className="text-foreground/90">天</span>
        </span>
      </span>
    </button>
  )
}
