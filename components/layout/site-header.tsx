"use client"

import { Link } from "@/i18n/routing"
import { ModeToggle } from "@/components/layout/mode-toggle"
import { LanguageToggle } from "@/components/layout/language-toggle"
import { useTranslations } from "next-intl"
import { Terminal } from "lucide-react"
import { CommandMenu } from "@/components/layout/command-menu"
import { MobileNav } from "@/components/layout/mobile-nav"
import { VantaSwitcher } from "@/components/effects/vanta-switcher"
import { FontToggle } from "@/components/layout/font-toggle"
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
    <header className="sticky top-0 z-50 w-full border-b border-white/30 bg-background/70 backdrop-blur-2xl shadow-[0_12px_45px_-30px_rgba(0,0,0,0.55)] supports-[backdrop-filter]:bg-background/70 dark:border-white/10">
      <div className="mx-auto flex h-14 w-full items-center px-3 md:px-6">
        <MobileNav />
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2 ml-4 md:ml-6">
            <Terminal className="h-6 w-6" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
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
                  className={`relative transition-colors ${active ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'} `}
                >
                  <span
                    className={`after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:rounded-full after:transition-all after:duration-200 ${
                      active
                        ? 'after:w-full after:bg-primary/80 dark:after:bg-white/90'
                        : 'after:w-0 after:bg-primary/45 hover:after:w-full hover:after:bg-primary/70 dark:after:bg-white/55 dark:hover:after:bg-white/80'
                    }`}
                  >
                    {item.label}
                  </span>
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
              <FontToggle />
           <ModeToggle />
           <LanguageToggle />
        </div>
      </div>
    </header>
  )
}