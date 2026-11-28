import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabaseAuth, getSession, getCurrentUser } from '@/lib/supabase/auth'
import type { User } from '@supabase/supabase-js'

interface CheckAuthOptions {
  silent?: boolean
}

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
  checkAuth: (options?: CheckAuthOptions) => Promise<void>
}

export const useSupabaseAuthStore = create<SupabaseAuthState>()(
  persist(
    (set, get) => ({
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
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
          await supabaseAuth.auth.signOut()
          set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      checkAuth: async (options?: CheckAuthOptions) => {
        const silent = options?.silent === true
        if (!silent) {
          set({ isLoading: true })
        }

        try {
          // 优先通过服务端 /api/auth/me 验证（含 refresh-token 自动续期）
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
            cache: 'no-store',
          })

          if (response.ok) {
            const data = (await response.json()) as { user?: User | null }
            if (data.user) {
              set({
                user: data.user,
                accessToken: 'hidden',
                isAuthenticated: true,
                isLoading: false,
              })
              return
            }
          }

          // 遇到服务端 5xx 临时波动且当前已登录时，不误踢出登录态
          if (response.status >= 500 && get().isAuthenticated) {
            set({ isLoading: false })
            return
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
          // 网络短暂抖动且已有登录态时保留当前页面，避免写文章时突然掉登录
          if (silent && get().isAuthenticated) {
            return
          }
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
    },
  ),
)
