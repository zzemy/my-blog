import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database as SupabaseDB } from './types'

function normalizeEnvValue(value?: string) {
  if (!value) return undefined
  let normalized = value.trim()
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, '')
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim()
  }
  normalized = normalized.replace(/\s+/g, '')
  return normalized || undefined
}

const supabaseUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL)
const supabaseAnonKey = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const serviceRoleKey = normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)

let supabaseClient: SupabaseClient<SupabaseDB> | null = null

type ParsedJwtPayload = {
  role?: string
  ref?: string
  exp?: number
}

function parseJwtPayload(token: string): ParsedJwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4)
    const json = Buffer.from(padded, 'base64').toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

function extractProjectRefFromSupabaseUrl(url?: string): string | null {
  if (!url) return null
  try {
    const hostname = new URL(url).hostname
    const match = hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

type ServiceRoleValidation = {
  ok: boolean
  reason?: 'missing_key' | 'invalid_jwt' | 'invalid_role' | 'invalid_format' | 'expired' | 'project_ref_mismatch'
  keyRef?: string | null
  urlRef?: string | null
}

type AnonKeyValidation = {
  ok: boolean
  reason?: 'missing_key' | 'invalid_jwt' | 'invalid_role' | 'invalid_format' | 'expired' | 'project_ref_mismatch'
  keyRef?: string | null
  urlRef?: string | null
}

function isPublishableKey(token: string): boolean {
  return /^sb_publishable_[A-Za-z0-9_-]+$/.test(token)
}

function isSecretKey(token: string): boolean {
  return /^sb_secret_[A-Za-z0-9_-]+$/.test(token)
}

function validateJwtKey(
  token: string | undefined,
  expectedRole: 'anon' | 'service_role'
): ServiceRoleValidation | AnonKeyValidation {
  const urlRef = extractProjectRefFromSupabaseUrl(supabaseUrl)

  if (!token) {
    return { ok: false, reason: 'missing_key', keyRef: null, urlRef }
  }

  if (token.startsWith('sb_')) {
    if (expectedRole === 'anon' && isPublishableKey(token)) {
      return { ok: true, keyRef: null, urlRef }
    }

    if (expectedRole === 'service_role' && isSecretKey(token)) {
      return { ok: true, keyRef: null, urlRef }
    }

    if (isPublishableKey(token) || isSecretKey(token)) {
      return { ok: false, reason: 'invalid_role', keyRef: null, urlRef }
    }

    return { ok: false, reason: 'invalid_format', keyRef: null, urlRef }
  }

  const payload = parseJwtPayload(token)
  if (!payload) {
    return { ok: false, reason: 'invalid_jwt', keyRef: null, urlRef }
  }

  if (payload.role !== expectedRole) {
    return {
      ok: false,
      reason: 'invalid_role',
      keyRef: typeof payload.ref === 'string' ? payload.ref : null,
      urlRef,
    }
  }

  const nowSec = Math.floor(Date.now() / 1000)
  if (typeof payload.exp === 'number' && payload.exp <= nowSec) {
    return {
      ok: false,
      reason: 'expired',
      keyRef: typeof payload.ref === 'string' ? payload.ref : null,
      urlRef,
    }
  }

  const keyRef = typeof payload.ref === 'string' ? payload.ref : null
  if (keyRef && urlRef && keyRef !== urlRef) {
    return { ok: false, reason: 'project_ref_mismatch', keyRef, urlRef }
  }

  return { ok: true, keyRef, urlRef }
}

export function validateAnonKey(): AnonKeyValidation {
  return validateJwtKey(supabaseAnonKey, 'anon')
}

export function validateServiceRoleKey(): ServiceRoleValidation {
  return validateJwtKey(serviceRoleKey, 'service_role')
}

export function hasValidServiceRoleKey() {
  return validateServiceRoleKey().ok
}

function getValidatedServiceRoleKey(): string | null {
  return hasValidServiceRoleKey() ? serviceRoleKey! : null
}

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  if (!supabaseClient) {
    supabaseClient = createClient<SupabaseDB>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    })
  }

  return supabaseClient
}

// Lazy-loaded singleton for better build-time compatibility
export const supabase = new Proxy({} as SupabaseClient<SupabaseDB>, {
  get(_target: unknown, prop: string | symbol) {
    try {
      return (getSupabaseClient() as unknown as Record<string | symbol, unknown>)[prop]
    } catch (error) {
      console.error('Supabase client error:', error)
      return undefined
    }
  },
}) as SupabaseClient<SupabaseDB>

// 用于服务端的客户端（如果需要）
export const createServerClient = () => {
  return getSupabaseClient()
}

// 用于服务端的管理员客户端（使用用户 Token 认证）
export const getAdminClient = (token?: string) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  // 如果提供了 token，则创建一个带有 Authorization 头的客户端
  if (token) {
    return createClient<SupabaseDB>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
      },
    })
  }
  
  // 否则回退到使用 service_role_key（如果存在且有效）或 anon_key
  const validatedServiceRoleKey = getValidatedServiceRoleKey()
  if (validatedServiceRoleKey) {
    return createClient<SupabaseDB>(supabaseUrl, validatedServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    })
  }
  
  return getSupabaseClient()
}

export type Database = {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string
          title: string
          slug: string
          content: unknown // TipTap JSON content
          excerpt: string | null
          cover_image: string | null
          author: string
          locale: string
          published: boolean
          tags: string[]
          created_at: string
          updated_at: string
          published_at: string | null
          view_count: number
          reading_time: number | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content: unknown
          excerpt?: string | null
          cover_image?: string | null
          author?: string
          locale?: string
          published?: boolean
          tags?: string[]
          created_at?: string
          updated_at?: string
          published_at?: string | null
          view_count?: number
          reading_time?: number | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: unknown
          excerpt?: string | null
          cover_image?: string | null
          author?: string
          locale?: string
          published?: boolean
          tags?: string[]
          created_at?: string
          updated_at?: string
          published_at?: string | null
          view_count?: number
          reading_time?: number | null
        }
      }
      pages: {
        Row: {
          id: string
          title: string
          slug: string
          content: unknown // TipTap JSON content
          locale: string
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content: unknown
          locale?: string
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: unknown
          locale?: string
          published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
