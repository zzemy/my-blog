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
      className="inline-flex items-center gap-3 rounded-2xl border border-border/70 bg-gradient-to-r from-background/92 via-background/82 to-background/72 px-4 py-3 text-left text-sm text-foreground shadow-sm ring-1 ring-border/45 backdrop-blur-xl transition-colors hover:border-border dark:border-white/8 dark:from-zinc-900/58 dark:via-zinc-900/46 dark:to-zinc-900/28 dark:text-zinc-100 dark:shadow-lg dark:shadow-black/25 dark:ring-white/14"
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/70 bg-background/70 ring-1 ring-border/50 dark:border-white/16 dark:bg-white/6 dark:ring-white/12" aria-hidden>
        <Cog className="h-4 w-4 animate-spin text-zinc-600 [animation-duration:2.6s] dark:text-zinc-300" />
      </span>

      <span className="flex flex-col leading-tight">
        <span className="flex items-center gap-1">
          <span className="text-foreground/80 dark:text-zinc-200/80">本站已稳定运行</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{days}</span>
          <span className="text-foreground/80 dark:text-zinc-200/80">天</span>
        </span>
        <span className="block w-full text-center text-xs text-zinc-500 dark:text-zinc-400">since 2025.11.20</span>
      </span>
    </button>
  )
}
