"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Github, Globe, Mail, MessageCircle, Terminal } from "lucide-react"
import { ModeToggle } from "@/shared/layout/mode-toggle"
import { CommandMenu } from "@/shared/layout/command-menu"
import { MobileNav } from "@/shared/layout/mobile-nav"
import { SiteUptimeBadge } from "@/shared/components/common/site-uptime"
import { useSiteSettings } from "@/shared/layout/site-settings-context"
import { cn } from "@/lib/utils"

const navItems = [
  { href: '/', label: '首页' },
  { href: '/posts', label: '文章' },
  { href: '/tags', label: '标签' },
  { href: '/friends', label: '友链' },
  { href: '/guestbook', label: '留言' },
  { href: '/about', label: '关于' },
]

function renderSocialIcon(platform: string) {
  const lower = platform.toLowerCase()
  if (lower.includes('github')) return <Github className="h-4 w-4" />
  if (lower.includes('mail') || lower.includes('email')) return <Mail className="h-4 w-4" />
  if (lower.includes('qq') || lower.includes('wechat') || lower.includes('telegram')) {
    return <MessageCircle className="h-4 w-4" />
  }
  return <Globe className="h-4 w-4" />
}

export function SiteHeader() {
  const pathname = usePathname()
  const settings = useSiteSettings()
  const current = pathname || '/'
  const isHomepage = current === '/'
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const isActive = (href: string) => {
    if (href === '/') return current === '/'
    return current === href || current.startsWith(`${href}/`)
  }

  const transparentHeroHeader = isHomepage && !isScrolled

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ease-out",
        transparentHeroHeader
          ? "border-b border-transparent bg-transparent text-foreground shadow-none"
          : "border-b border-border/70 bg-background/80 text-foreground shadow-[0_12px_36px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#111214]/80 dark:shadow-[0_12px_36px_-28px_rgba(0,0,0,0.85)]"
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 md:px-8">
        <MobileNav />

        <div className="flex flex-1 items-center lg:w-64 lg:flex-none">
          <Link
            href="/"
            className="group ml-1.5 flex items-center gap-2.5 md:ml-0"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-foreground/12 bg-foreground/[0.03] transition-colors duration-200 group-hover:border-foreground/25 group-hover:bg-foreground/[0.06] dark:border-white/14 dark:bg-white/[0.04] dark:group-hover:border-white/28 dark:group-hover:bg-white/[0.08]">
              <Terminal className="h-3.5 w-3.5 text-foreground/85" />
            </span>
            <span className="hero-display text-xl leading-none tracking-tight text-foreground md:text-[1.35rem]">
              {settings.siteTitle}
            </span>
          </Link>
          <span className="ml-4 hidden h-3.5 w-px bg-foreground/12 xl:block" />
          <span className="ml-3.5">
            <SiteUptimeBadge compact />
          </span>
        </div>

        <nav aria-label="主导航" className="hidden flex-1 items-center justify-center gap-7 text-[14px] font-medium md:flex lg:gap-8">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative py-5 transition-colors duration-200 after:absolute after:bottom-3.5 after:left-1/2 after:h-[1.5px] after:-translate-x-1/2 after:rounded-full after:transition-all after:duration-300",
                  active
                    ? "text-foreground after:w-4 after:bg-foreground/85"
                    : "text-foreground/58 after:w-0 after:bg-foreground/40 hover:text-foreground hover:after:w-3"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1 lg:w-64 lg:flex-none">
          <CommandMenu compact />
          <div className="mx-1 hidden h-4 w-px bg-foreground/12 sm:block" />
          <ModeToggle />
          {(settings.socialLinks ?? []).slice(0, 2).map((link) => (
            <a
              key={`${link.platform}-${link.url}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.platform}
              title={link.platform}
              className="hidden size-8 items-center justify-center rounded-lg text-foreground/65 transition-colors duration-200 hover:bg-foreground/[0.06] hover:text-foreground dark:hover:bg-white/[0.08] sm:flex"
            >
              {renderSocialIcon(link.platform)}
            </a>
          ))}
        </div>
      </div>
    </header>
  )
}
