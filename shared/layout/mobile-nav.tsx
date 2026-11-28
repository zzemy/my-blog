"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, Terminal, Home, BookOpen, MessageSquare, User, Tags, Link2, Rss, ArrowUpRight } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useSiteSettings } from "@/shared/layout/site-settings-context"
import { cn } from "@/lib/utils"

const mobileLinks = [
  { href: "/", label: "首页", icon: Home },
  { href: "/posts", label: "文章", icon: BookOpen },
  { href: "/tags", label: "标签", icon: Tags },
  { href: "/friends", label: "友链", icon: Link2 },
  { href: "/guestbook", label: "留言", icon: MessageSquare },
  { href: "/about", label: "关于", icon: User },
]

export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname() || "/"
  const settings = useSiteSettings()

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="size-8 rounded-lg text-foreground/75 hover:bg-foreground/[0.06] md:hidden"
          size="icon"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">打开导航菜单</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[250px] flex-col p-5 sm:w-[280px]">
        <SheetTitle className="text-left">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onClick={() => setOpen(false)}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-foreground/15 bg-foreground/[0.04]">
              <Terminal className="h-3.5 w-3.5" />
            </span>
            <span className="hero-display text-xl font-normal tracking-tight">
              {settings.siteTitle}
            </span>
          </Link>
        </SheetTitle>
        <SheetDescription className="sr-only">
          站点导航菜单
        </SheetDescription>
        <Separator className="my-4" />
        <nav aria-label="移动端导航" className="flex flex-col gap-1">
          {mobileLinks.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-foreground/[0.07] font-semibold text-foreground"
                    : "text-foreground/70 hover:bg-foreground/[0.04] hover:text-foreground"
                )}
                onClick={() => setOpen(false)}
              >
                <Icon className="h-4 w-4 opacity-75" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-6">
          <Separator className="mb-4" />
          <div className="flex flex-wrap gap-2">
            <a
              href="/rss.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Rss className="h-3 w-3" />
              <span>RSS</span>
            </a>
            {(settings.socialLinks ?? []).map((link) => (
              <a
                key={`${link.platform}-${link.url}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <span>{link.platform}</span>
                <ArrowUpRight className="h-3 w-3 opacity-60" />
              </a>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
