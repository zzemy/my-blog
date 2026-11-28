"use client"

import * as React from "react"
import Link from "next/link"
import { Rss, ArrowUpRight } from "lucide-react"
import { SITE_NAV_ITEMS } from "@/shared/layout/nav-config"
import { useSiteSettings } from "@/shared/layout/site-settings-context"

const DEFAULT_START_DATE = "2025-11-20T00:00:00Z"
const MS_PER_DAY = 24 * 60 * 60 * 1000

const footerLinks = SITE_NAV_ITEMS.filter((item) => item.showInFooter)

export function SiteFooter() {
  const settings = useSiteSettings()
  const [days, setDays] = React.useState<number | null>(null)
  const [currentYear, setCurrentYear] = React.useState<number>(2026)

  React.useEffect(() => {
    const now = Date.now()
    const foundedAt = new Date(settings.foundedDate || DEFAULT_START_DATE).getTime()
    const startTs = Number.isNaN(foundedAt) ? new Date(DEFAULT_START_DATE).getTime() : foundedAt
    setDays(Math.floor(Math.max(0, now - startTs) / MS_PER_DAY))
    setCurrentYear(new Date(now).getFullYear())
  }, [settings.foundedDate])

  if (!settings.featureFlags.enableFooter) {
    return null
  }

  const triggerCelebrate = async () => {
    try {
      const confetti = (await import("canvas-confetti")).default
      confetti({
        particleCount: 42,
        spread: 68,
        startVelocity: 28,
        origin: { y: 0.9 },
        ticks: 90,
        zIndex: 60,
      })
    } catch {
      // ignore animation errors
    }
  }

  return (
    <footer className="relative z-10 mt-20 border-t border-border/60 bg-background/60 backdrop-blur-sm dark:border-white/[0.07] dark:bg-background/70">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-8 md:py-12">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hero-display text-lg text-foreground transition-opacity hover:opacity-80"
            >
              {settings.siteTitle}
            </Link>
            <span className="h-3 w-px bg-foreground/15" />
            <span className="font-mono text-[11px] tracking-wider text-muted-foreground/80">
              © 2025–{currentYear}
            </span>
          </div>
          {settings.footerText && (
            <p className="text-xs text-muted-foreground/75">
              {settings.footerText}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs text-muted-foreground">
          {days !== null && (
            <button
              type="button"
              onClick={() => void triggerCelebrate()}
              title="点击庆祝一下"
              className="group inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-foreground/[0.02] px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors duration-200 hover:border-foreground/25 hover:bg-foreground/[0.05] hover:text-foreground dark:border-white/10 dark:bg-white/[0.025]"
            >
              <span className="size-1.5 rounded-full bg-emerald-500/90 transition-transform duration-200 group-hover:scale-125" aria-hidden />
              <span>已运行 {days} 天</span>
            </button>
          )}

          <nav aria-label="页脚导航" className="flex flex-wrap items-center gap-4">
            {footerLinks.map((item) =>
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 transition-colors duration-200 hover:text-foreground"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition-colors duration-200 hover:text-foreground"
                >
                  {item.label}
                </Link>
              ),
            )}
            <a
              href="/rss.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors duration-200 hover:text-foreground"
            >
              <Rss className="h-3 w-3" />
              <span>RSS</span>
            </a>
            {(settings.socialLinks ?? []).slice(0, 3).map((link) => (
              <a
                key={`${link.platform}-${link.url}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 transition-colors duration-200 hover:text-foreground"
              >
                <span>{link.platform}</span>
                <ArrowUpRight className="h-3 w-3 opacity-60" />
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
