"use client"

import { useEffect, useState } from "react"
import Lottie from "lottie-react"

const LOTTIE_URLS = [
  "https://lottie.host/97e023b9-71c5-4191-9431-85b182447221/2pX0P0w4q2.json",
  "https://assets2.lottiefiles.com/packages/lf20_kcsr6fcp.json",
]

export function Lottie404() {
  const [animationData, setAnimationData] = useState<object | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      for (const url of LOTTIE_URLS) {
        try {
          const controller = new AbortController()
          const timer = window.setTimeout(() => controller.abort(), 3500)
          const res = await fetch(url, { signal: controller.signal })
          window.clearTimeout(timer)
          if (!res.ok) continue
          const json = await res.json()
          if (!cancelled && json && typeof json === "object") {
            setAnimationData(json)
            return
          }
        } catch {
          // try next fallback URL
        }
      }
      if (!cancelled) setFailed(true)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (animationData) {
    return (
      <div className="h-56 w-56 md:h-72 md:w-72">
        <Lottie animationData={animationData} loop />
      </div>
    )
  }

  // 优雅的离线/兜底排版 404 徽标
  return (
    <div
      className={`flex h-44 w-64 flex-col items-center justify-center rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm ${
        failed ? "" : "animate-pulse"
      }`}
      aria-hidden="true"
    >
      <span className="hero-display text-7xl tracking-tight text-foreground/85">404</span>
      <span className="mt-2 font-mono text-[11px] uppercase tracking-[0.26em] text-muted-foreground">
        Not Found
      </span>
    </div>
  )
}
