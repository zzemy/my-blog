'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  BookOpen,
  ChevronDown,
  Cloud,
  Database,
  ExternalLink,
  FileText,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Plus,
  Settings,
  Sparkles,
} from 'lucide-react'
import { useSupabaseAuthStore } from '@/lib/supabase-auth-store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ModeToggle } from '@/shared/layout/mode-toggle'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin', label: '仪表盘', icon: LayoutDashboard, exact: true },
  { href: '/admin/posts', label: '文章管理', icon: FileText, exact: false },
  { href: '/admin/media', label: '媒体库', icon: ImageIcon, exact: false },
  { href: '/admin/friends', label: '友链', icon: Link2, exact: false },
  { href: '/admin/ai', label: 'AI 中心', icon: Sparkles, exact: false },
  { href: '/admin/settings', label: '系统设置', icon: Settings, exact: false },
] as const

const EXTERNAL_LINKS = [
  {
    href: process.env.NEXT_PUBLIC_VERCEL_DASHBOARD_URL || 'https://vercel.com/dashboard',
    label: 'Vercel 部署',
    icon: Cloud,
  },
  {
    href: process.env.NEXT_PUBLIC_SUPABASE_DASHBOARD_URL || 'https://supabase.com/dashboard',
    label: 'Supabase 控制台',
    icon: Database,
  },
] as const

export function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useSupabaseAuthStore((state) => state.logout)
  const [open, setOpen] = useState(false)

  // 文章新建/编辑/预览页使用独立顶栏
  if (pathname && /^\/admin\/posts\/.+/.test(pathname)) {
    return null
  }

  const isActive = (href: string, exact: boolean) => {
    if (!pathname) return false
    return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/admin')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/admin"
          className="group flex shrink-0 items-center gap-2.5 whitespace-nowrap"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-xs transition-transform group-hover:scale-105 dark:bg-zinc-100 dark:text-zinc-900">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="font-handwriting text-base leading-none text-zinc-900 dark:text-zinc-100">
            Blog Admin
          </span>
        </Link>

        <nav
          aria-label="后台主导航"
          className="hidden items-center gap-1 rounded-lg bg-zinc-100/70 p-1 md:flex dark:bg-zinc-900/80"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-all lg:px-3',
                  active
                    ? 'bg-white text-zinc-950 shadow-xs ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700/80'
                    : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    active
                      ? 'text-zinc-900 dark:text-zinc-100'
                      : 'text-zinc-500 dark:text-zinc-400',
                  )}
                />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-1.5 md:flex">
          <Button asChild size="sm" className="h-8 gap-1 px-2.5 text-xs">
            <Link href="/admin/posts/new">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">写文章</span>
            </Link>
          </Button>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            title="在新标签页查看前台站点"
            className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-zinc-200/80 bg-background px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-50"
          >
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden xl:inline">站点</span>
          </a>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-xs text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
                title="云服务控制台"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                外部云服务
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {EXTERNAL_LINKS.map((link) => {
                const Icon = link.icon
                return (
                  <DropdownMenuItem key={link.href} asChild>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex cursor-pointer items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        {link.label}
                      </span>
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="mx-0.5 h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

          <ModeToggle simple />

          <Button
            onClick={handleLogout}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            title="退出登录"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="flex items-center gap-1.5 md:hidden">
          <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="新建文章">
            <Link href="/admin/posts/new">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
          <ModeToggle simple />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="打开管理菜单">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">管理菜单</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href, item.exact)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50'
                          : 'text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  )
                })}

                <div className="my-3 h-px bg-zinc-200 dark:bg-zinc-800" />

                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                >
                  <Globe className="h-4 w-4 shrink-0" />
                  查看前台站点
                </a>

                {EXTERNAL_LINKS.map((link) => {
                  const Icon = link.icon
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 shrink-0" />
                        {link.label}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                    </a>
                  )
                })}

                <div className="my-3 h-px bg-zinc-200 dark:bg-zinc-800" />

                <Button
                  onClick={() => {
                    setOpen(false)
                    void handleLogout()
                  }}
                  variant="ghost"
                  className="justify-start px-3 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                >
                  <LogOut className="mr-2.5 h-4 w-4" />
                  退出登录
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
