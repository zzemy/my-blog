'use client'

import { useEffect, useState } from 'react'
import { useSupabaseAuthStore } from '@/lib/supabase-auth-store'
import { SupabaseLoginForm } from '@/features/auth/components/login-form'

interface AdminProtectorProps {
  children: React.ReactNode
}

export function AdminProtector({ children }: AdminProtectorProps) {
  const { isAuthenticated, isLoading, checkAuth } = useSupabaseAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    checkAuth()
  }, [checkAuth])

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50"></div>
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
