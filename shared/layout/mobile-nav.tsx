"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, Terminal, Home, BookOpen, MessageSquare, User, Tags } from "lucide-react"
import { Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { Separator } from "@/components/ui/separator"

export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const t = useTranslations('Navigation')

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="md:hidden" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-4 w-[220px] sm:w-[280px]">
        <SheetTitle className="text-left">
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <Terminal className="h-5 w-5" />
          </Link>
        </SheetTitle>
        <SheetDescription className="sr-only">
          Navigation menu
        </SheetDescription>
        <Separator className="my-4" />
        <div className="flex flex-col gap-2 px-2">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => setOpen(false)}
            >
              <Home className="h-4 w-4" />
              {t('home')}
            </Link>
            <Link
              href="/posts"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => setOpen(false)}
            >
              <BookOpen className="h-4 w-4" />
              {t('posts')}
            </Link>
            <Link
              href="/tags"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => setOpen(false)}
            >
              <Tags className="h-4 w-4" />
              {t('tags')}
            </Link>
            <Link
              href="/guestbook"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => setOpen(false)}
            >
              <MessageSquare className="h-4 w-4" />
              {t('guestbook')}
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => setOpen(false)}
            >
              <User className="h-4 w-4" />
              {t('about')}
            </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
