"use client"

import * as React from "react"
import Link from "next/link"
import { Rss, ArrowUpRight } from "lucide-react"
import confetti from "canvas-confetti"

const START_TIMESTAMP = new Date("2025-11-20T00:00:00Z").getTime()
const MS_PER_DAY = 24 * 60 * 60 * 1000

const footerLinks = [
  { href: "/posts", label: "归档" },
  { href: "/tags", label: "标签" },
  { href: "/friends", label: "友链" },
  { href: "/about", label: "关于" },
]

export function SiteFooter() {
  const [days, setDays] = React.useState<number | null>(null)

  React.useEffect(() => {
    const diff = Math.max(0, Date.now() - START_TIMESTAMP)
    setDays(Math.floor(diff / MS_PER_DAY))
  }, [])

  const triggerCelebrate = () => {
    confetti({
      particleCount: 42,
      spread: 68,
      startVelocity: 28,
      origin: { y: 0.9 },
      ticks: 90,
      zIndex: 60,
    })
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative z-10 mt-20 border-t border-border/60 bg-background/60 backdrop-blur-sm dark:border-white/[0.07] dark:bg-background/70">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-8 md:py-12">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hero-display text-lg text-foreground transition-opacity hover:opacity-80"
            >
              emmm
            </Link>
            <span className="h-3 w-px bg-foreground/15" />
            <span className="font-mono text-[11px] tracking-wider text-muted-foreground/80">
              © 2025–{currentYear}
            </span>
          </div>
          <p className="text-xs text-muted-foreground/75">
            慢下来，写给时间与自己。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs text-muted-foreground">
          {days !== null && (
            <button
              type="button"
              onClick={triggerCelebrate}
              title="点击庆祝一下"
              className="group inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-foreground/[0.02] px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors duration-200 hover:border-foreground/25 hover:bg-foreground/[0.05] hover:text-foreground dark:border-white/10 dark:bg-white/[0.025]"
            >
              <span className="size-1.5 rounded-full bg-emerald-500/90 transition-transform duration-200 group-hover:scale-125" aria-hidden />
              <span>已运行 {days} 天</span>
            </button>
          )}

          <nav aria-label="页脚导航" className="flex items-center gap-4">
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors duration-200 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <a
              href="/rss.xml"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 transition-colors duration-200 hover:text-foreground"
            >
              <Rss className="h-3 w-3" />
              <span>RSS</span>
            </a>
            <a
              href="https://github.com/zzemy"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 transition-colors duration-200 hover:text-foreground"
            >
              <span>GitHub</span>
              <ArrowUpRight className="h-3 w-3 opacity-60" />
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
