'use client'

import { useEffect, useRef, useState } from 'react'
import { useSupabaseAuthStore } from '@/lib/supabase-auth-store'
import { SupabaseLoginForm } from '@/features/auth/components/login-form'

interface AdminProtectorProps {
  children: React.ReactNode
}

// 每 25 分钟静默保活一次（服务端会在 JWT 剩余不足 15 分钟时自动用 refresh-token 续期）
const KEEPALIVE_INTERVAL_MS = 25 * 60 * 1000
const FOCUS_REFRESH_MIN_GAP_MS = 10 * 60 * 1000

export function AdminProtector({ children }: AdminProtectorProps) {
  const { isAuthenticated, isLoading, checkAuth } = useSupabaseAuthStore()
  const [mounted, setMounted] = useState(false)
  const lastCheckAtRef = useRef<number>(0)

  useEffect(() => {
    setMounted(true)
    lastCheckAtRef.current = Date.now()
    void checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!isAuthenticated) return

    const runSilentKeepalive = () => {
      lastCheckAtRef.current = Date.now()
      void checkAuth({ silent: true })
    }

    const timer = window.setInterval(runSilentKeepalive, KEEPALIVE_INTERVAL_MS)

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastCheckAtRef.current >= FOCUS_REFRESH_MIN_GAP_MS) {
        runSilentKeepalive()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuthenticated, checkAuth])

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50" />
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">加载中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SupabaseLoginForm />
  }

  return <>{children}</>
}
