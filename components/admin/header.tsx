
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSupabaseAuthStore } from '@/lib/supabase-auth-store'
import { Button } from '@/components/ui/button'
import { BookOpen, LogOut, LayoutDashboard, FileText, Settings, Home, Menu, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { ModeToggle } from '@/components/layout/mode-toggle'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from 'react'

export function AdminHeader() {
  const router = useRouter()
  const logout = useSupabaseAuthStore((state) => state.logout)
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/admin/posts')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
      <div className="container mx-auto px-4 max-w-6xl py-4">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 group">
            <div className="bg-zinc-900 dark:bg-zinc-50 p-2 rounded-lg group-hover:scale-105 transition-transform">
              <BookOpen className="h-5 w-5 text-white dark:text-zinc-900" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Blog Admin</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              仪表盘
            </Link>
            <Link
              href="/admin/posts"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              文章管理
            </Link>
            <Link
              href="/admin/media"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              媒体库
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              系统设置
            </Link>
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2" />
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <Home className="w-4 h-4" />
              查看站点
            </a>
            <a
              href="https://vercel.com/emmms-projects-cc15f8c7/my-blog"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Vercel
            </a>
            <a
              href="https://supabase.com/dashboard/project/clpmxrgdzhsitzjlmkhf"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Supabase
            </a>
            <ModeToggle />
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="icon"
              className="ml-1 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              title="退出登录"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>

          {/* 移动端菜单 */}
          <div className="md:hidden flex items-center gap-2">
            <ModeToggle />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle className="text-left">管理菜单</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 py-4 mt-4">
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    仪表盘
                  </Link>
                  <Link
                    href="/admin/posts"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    文章管理
                  </Link>
                  <Link
                    href="/admin/media"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                    媒体库
                  </Link>
                  <Link
                    href="/admin/settings"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    系统设置
                  </Link>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 mx-2" />
                  <a
                    href="/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    查看站点
                  </a>
                  <a
                    href="https://vercel.com/emmms-projects-cc15f8c7/my-blog"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Vercel
                  </a>
                  <a
                    href="https://supabase.com/dashboard/project/clpmxrgdzhsitzjlmkhf"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Supabase
                  </a>
                  <Button
                    onClick={() => {
                        setOpen(false)
                        handleLogout()
                    }}
                    variant="ghost"
                    className="justify-start px-3 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
