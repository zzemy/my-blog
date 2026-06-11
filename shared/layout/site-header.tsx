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
    <header className="sticky top-0 z-50 w-full border-b border-white/30 bg-background/78 backdrop-blur-2xl shadow-[0_12px_45px_-34px_rgba(0,0,0,0.55)] supports-[backdrop-filter]:bg-background/78 dark:border-white/10">
      <div className="mx-auto flex h-16 w-full items-center px-3 md:px-6">
        <MobileNav />
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2 ml-4 md:ml-6">
            <Terminal className="h-6 w-6" />
          </Link>
          <nav className="hidden items-center gap-7 text-[15px] font-semibold md:flex">
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
                  className={`relative py-5 transition-colors duration-200 after:absolute after:left-0 after:right-0 after:bottom-3 after:mx-auto after:h-0.5 after:rounded-full after:transition-[width,background-color] after:duration-200 ${
                    active
                      ? 'text-foreground after:w-full after:bg-foreground dark:text-white dark:after:bg-white'
                      : 'text-foreground/58 after:w-0 after:bg-foreground/40 hover:text-foreground hover:after:w-4 dark:text-white/58 dark:after:bg-white/45 dark:hover:text-white'
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
