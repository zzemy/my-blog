import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabaseAuth, getSession, getCurrentUser } from '@/lib/supabase/auth'
import type { User } from '@supabase/supabase-js'

interface SupabaseAuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithGithub: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useSupabaseAuthStore = create<SupabaseAuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      signInWithEmail: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const { data } = await supabaseAuth.auth.signInWithPassword({ email, password })
          const user = await getCurrentUser()
          set({
            user,
            accessToken: data.session?.access_token || null,
            isAuthenticated: !!user,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      signInWithGithub: async () => {
        set({ isLoading: true })
        try {
          await supabaseAuth.auth.signInWithOAuth({
            provider: 'github',
            options: {
              redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/admin/posts`,
            },
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      signInWithGoogle: async () => {
        set({ isLoading: true })
        try {
          await supabaseAuth.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/admin/posts`,
            },
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      signUp: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          await supabaseAuth.auth.signUp({
            email,
            password,
          })
          // 注册后可能需要确认邮箱
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          // 1. 调用后端 API 清除 HttpOnly Cookie
          await fetch('/api/auth/logout', { method: 'POST' })
          
          // 2. 清除客户端 SDK 状态
          await supabaseAuth.auth.signOut()
          
          set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      checkAuth: async () => {
        set({ isLoading: true })
        try {
          // 优先尝试从服务端 API 验证 (HttpOnly Cookie)
          const response = await fetch('/api/auth/me')
          if (response.ok) {
            const data = await response.json()
            if (data.user) {
              set({
                user: data.user,
                accessToken: 'hidden', // 令牌在 Cookie 中，客户端不可见
                isAuthenticated: true,
                isLoading: false,
              })
              return
            }
          }

          // 回退到客户端 SDK (兼容旧模式)
          const session = await getSession()
          if (session?.user) {
            set({
              user: session.user,
              accessToken: session.access_token || null,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false })
          }
        } catch {
          set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false })
        }
      },
    }),
    {
      name: 'supabase-auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
