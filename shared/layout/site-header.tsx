"use client"

import { Link } from "@/i18n/routing"
import { ModeToggle } from "@/shared/layout/mode-toggle"
import { LanguageToggle } from "@/shared/layout/language-toggle"
import { useTranslations } from "next-intl"
import { Terminal } from "lucide-react"
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
    <header className="sticky top-0 z-50 w-full border-b border-white/35 bg-background/75 backdrop-blur-2xl shadow-[0_12px_45px_-32px_rgba(0,0,0,0.55)] supports-[backdrop-filter]:bg-background/75 dark:border-white/10">
      <div className="mx-auto flex h-16 w-full items-center px-3 md:px-6">
        <MobileNav />
        <div className="mr-4 flex">
          <Link href="/" className="mr-4 flex items-center space-x-2 ml-4 md:ml-6">
            <Terminal className="h-6 w-6" />
          </Link>
          <nav className="hidden items-center gap-1 rounded-full border border-black/10 bg-white/55 p-1 text-[15px] font-semibold shadow-[0_8px_24px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] md:flex">
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
                  className={`rounded-full px-3.5 py-1.5 transition-[background-color,border-color,color,box-shadow] duration-200 ${
                    active
                      ? 'border border-black/10 bg-foreground text-background shadow-[0_6px_16px_-12px_rgba(0,0,0,0.9)] dark:border-white/20 dark:bg-white dark:text-background'
                      : 'border border-transparent text-foreground/68 hover:bg-black/[0.055] hover:text-foreground dark:text-white/68 dark:hover:bg-white/10 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
           <div className="w-full flex-1 md:w-auto md:flex-none">
             <CommandMenu />
           </div>
           <VantaSwitcher />
           <ModeToggle />
           <LanguageToggle />
        </div>
      </div>
    </header>
  )
}
