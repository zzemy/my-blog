import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 创建客户端用于认证
export const supabaseAuth = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'supabase.auth.token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})

/**
 * 用邮箱密码登录
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

/**
 * 用GitHub OAuth登录
 */
export async function signInWithGithub() {
  const { data, error } = await supabaseAuth.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/admin/posts`,
    },
  })
  
  if (error) throw error
  return data
}

/**
 * 用Google OAuth登录
 */
export async function signInWithGoogle() {
  const { data, error } = await supabaseAuth.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/admin/posts`,
    },
  })
  
  if (error) throw error
  return data
}

/**
 * 注册新账号
 */
export async function signUp(email: string, password: string) {
  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

/**
 * 登出
 */
export async function signOut() {
  const { error } = await supabaseAuth.auth.signOut()
  if (error) throw error
}

/**
 * 获取当前用户
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabaseAuth.auth.getUser()
  if (error) throw error
  return user
}

/**
 * 获取当前会话
 */
export async function getSession() {
  const { data: { session }, error } = await supabaseAuth.auth.getSession()
  if (error) throw error
  return session
}

/**
 * 监听认证状态变化
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabaseAuth.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
}
