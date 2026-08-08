"use client"

import Link from "next/link"
import { ModeToggle } from "@/shared/layout/mode-toggle"
import { Github, MessageCircle, Terminal } from "lucide-react"
import { CommandMenu } from "@/shared/layout/command-menu"
import { MobileNav } from "@/shared/layout/mobile-nav"
import { SiteUptimeBadge } from "@/shared/components/common/site-uptime"
import { usePathname } from "next/navigation"

const navItems = [
  { href: '/', label: '首页' },
  { href: '/posts', label: '文章' },
  { href: '/tags', label: '标签' },
  { href: '/friends', label: '友链' },
  { href: '/guestbook', label: '留言' },
  { href: '/about', label: '关于' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const current = pathname || '/'

  const isActive = (href: string) => {
    if (href === '/') return current === '/'
    return current === href || current.startsWith(`${href}/`)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 text-foreground shadow-[0_14px_42px_-36px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#181818]/96 dark:text-white dark:shadow-[0_14px_42px_-36px_rgba(0,0,0,0.9)]">
      <div className="flex h-16 w-full items-center px-4 md:px-8">
        <MobileNav />
        <div className="flex flex-1 items-center lg:w-72 lg:flex-none">
          <Link href="/" className="ml-2 flex items-center gap-3 md:ml-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted/50 dark:border-white/22 dark:bg-white/[0.03]">
              <Terminal className="h-4 w-4" />
            </span>
            <span className="text-lg font-extrabold leading-none tracking-normal text-foreground dark:text-white md:text-xl">
              emmm
            </span>
          </Link>
          <span className="ml-4 hidden h-4 w-px bg-border dark:bg-white/12 xl:block" />
          <span className="ml-4"><SiteUptimeBadge compact /></span>
        </div>
        <nav className="hidden flex-1 items-center justify-center gap-7 text-sm font-bold md:flex lg:gap-8">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative py-5 transition-colors duration-200 after:absolute after:left-0 after:right-0 after:bottom-3 after:mx-auto after:h-px after:transition-[width,background-color] after:duration-200 ${
                  active
                    ? 'text-foreground after:w-full after:bg-foreground dark:text-white dark:after:bg-white'
                    : 'text-foreground/62 after:w-0 after:bg-foreground/35 hover:text-foreground hover:after:w-5 dark:text-white/72 dark:after:bg-white/45 dark:hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-1.5 lg:w-72 lg:flex-none">
          <span className="hidden sm:block"><CommandMenu compact /></span>
          <div className="hidden h-7 w-px bg-border dark:bg-white/14 sm:block" />
          <div className="flex items-center gap-1.5 [&_button]:border-border [&_button]:bg-background/70 [&_button]:text-foreground/80 [&_button:hover]:bg-accent [&_button:hover]:text-foreground dark:[&_button]:border-white/16 dark:[&_button]:bg-white/[0.04] dark:[&_button]:text-white/82 dark:[&_button:hover]:bg-white/10 dark:[&_button:hover]:text-white">
            <ModeToggle />
          </div>
          <a
            href="https://github.com/zzemy"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            title="GitHub"
            className="flex size-9 items-center justify-center rounded-md text-foreground/65 transition-colors hover:bg-accent hover:text-foreground dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href="https://qm.qq.com/cgi-bin/qm/qr?k=GJV7-av-NF7gsXV13umV8RqQC0Cum5zo"
            target="_blank"
            rel="noreferrer"
            aria-label="QQ"
            title="QQ"
            className="flex size-9 items-center justify-center rounded-md text-foreground/65 transition-colors hover:bg-accent hover:text-foreground dark:text-white/75 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  )
}
