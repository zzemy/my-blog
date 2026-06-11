"use client"

import { Link } from "@/i18n/routing"
import { ModeToggle } from "@/shared/layout/mode-toggle"
import { LanguageToggle } from "@/shared/layout/language-toggle"
import { useTranslations } from "next-intl"
import { Github, Terminal } from "lucide-react"
import { CommandMenu } from "@/shared/layout/command-menu"
import { MobileNav } from "@/shared/layout/mobile-nav"
import { VantaSwitcher } from "@/shared/effects/vanta-switcher"
import { usePathname } from "next/navigation"

export function SiteHeader() {
  const t = useTranslations('Navigation')
  const pathname = usePathname()

  const stripLocale = (path: string) => path.replace(/^\/[a-zA-Z-]+(?=\/|$)/, '') || '/'
  const current = stripLocale(pathname || '')

  const isActive = (href: string) => {
    if (href === '/') return current === '/'
    return current === href || current.startsWith(`${href}/`)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 text-foreground shadow-[0_14px_42px_-36px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#181818]/96 dark:text-white dark:shadow-[0_14px_42px_-36px_rgba(0,0,0,0.9)]">
      <div className="flex h-20 w-full items-center px-4 md:px-8">
        <MobileNav />
        <div className="flex flex-1 items-center lg:w-64 lg:flex-none">
          <Link href="/" className="ml-2 flex items-center gap-3 md:ml-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/50 dark:border-white/28 dark:bg-white/[0.03]">
              <Terminal className="h-5 w-5" />
            </span>
            <span className="text-xl font-extrabold leading-none tracking-normal text-foreground dark:text-white md:text-2xl">
              emmm
            </span>
          </Link>
        </div>
        <nav className="hidden flex-1 items-center justify-center gap-10 text-[15px] font-bold md:flex">
          {[
            { href: '/', label: t('home') },
            { href: '/posts', label: t('posts') },
            { href: '/tags', label: t('tags') },
            { href: '/guestbook', label: t('guestbook') },
            { href: '/about', label: t('about') },
          ].map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative py-7 transition-colors duration-200 after:absolute after:left-0 after:right-0 after:bottom-5 after:mx-auto after:h-0.5 after:rounded-full after:transition-[width,background-color] after:duration-200 ${
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
        <div className="flex flex-1 items-center justify-end gap-2 lg:w-64 lg:flex-none">
          <CommandMenu compact />
          <div className="hidden h-7 w-px bg-border dark:bg-white/14 sm:block" />
          <div className="flex items-center gap-1.5 [&_button]:border-border [&_button]:bg-background/70 [&_button]:text-foreground/80 [&_button:hover]:bg-accent [&_button:hover]:text-foreground dark:[&_button]:border-white/16 dark:[&_button]:bg-white/[0.04] dark:[&_button]:text-white/82 dark:[&_button:hover]:bg-white/10 dark:[&_button:hover]:text-white">
            <VantaSwitcher />
            <ModeToggle />
            <LanguageToggle />
          </div>
          <a
            href="https://github.com/zzemy"
            target="_blank"
            rel="noreferrer"
            className="ml-2 hidden h-10 items-center gap-2 rounded-md border border-border bg-background/60 px-4 text-sm font-bold text-foreground/82 transition-colors hover:border-foreground/30 hover:bg-accent hover:text-foreground dark:border-white/32 dark:bg-transparent dark:text-white/90 dark:hover:border-white/55 dark:hover:bg-white/10 dark:hover:text-white lg:inline-flex"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </div>
    </header>
  )
}
