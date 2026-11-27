import { JSONContent } from '@tiptap/react'

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string
          public_id: string
          title: string
          slug: string
          description: string | null
          content: JSONContent
          cover_image: string | null
          author: string
          tags: string[]
          published: boolean
          featured: boolean
          views: number
          reading_time: number | null
          created_at: string
          updated_at: string
          published_at: string | null
          metadata: Record<string, unknown>
        }
        Insert: {
          id?: string
          public_id: string
          title: string
          slug: string
          description?: string | null
          content: JSONContent
          cover_image?: string | null
          author?: string
          tags?: string[]
          published?: boolean
          featured?: boolean
          views?: number
          reading_time?: number | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
          metadata?: Record<string, unknown>
        }
        Update: {
          id?: string
          public_id?: string
          title?: string
          slug?: string
          description?: string | null
          content?: JSONContent
          cover_image?: string | null
          author?: string
          tags?: string[]
          published?: boolean
          featured?: boolean
          views?: number
          reading_time?: number | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
          metadata?: Record<string, unknown>
        }
      }
      pages: {
        Row: {
          id: string
          title: string
          slug: string
          content: JSONContent
          published: boolean
          created_at: string
          updated_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content: JSONContent
          published?: boolean
          created_at?: string
          updated_at?: string
          metadata?: Record<string, unknown>
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: JSONContent
          published?: boolean
          created_at?: string
          updated_at?: string
          metadata?: Record<string, unknown>
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          count: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          count?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          count?: number
          created_at?: string
        }
      }
      media: {
        Row: {
          id: string
          filename: string
          url: string
          storage_path: string
          mime_type: string | null
          size: number | null
          width: number | null
          height: number | null
          alt_text: string | null
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id?: string
          filename: string
          url: string
          storage_path: string
          mime_type?: string | null
          size?: number | null
          width?: number | null
          height?: number | null
          alt_text?: string | null
          created_at?: string
          metadata?: Record<string, unknown>
        }
        Update: {
          id?: string
          filename?: string
          url?: string
          storage_path?: string
          mime_type?: string | null
          size?: number | null
          width?: number | null
          height?: number | null
          alt_text?: string | null
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      friend_links: {
        Row: {
          id: string
          name: string
          url: string
          avatar_url: string | null
          description: string | null
          note: string | null
          contact: string | null
          status: 'pending' | 'approved' | 'rejected'
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          url: string
          avatar_url?: string | null
          description?: string | null
          note?: string | null
          contact?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          url?: string
          avatar_url?: string | null
          description?: string | null
          note?: string | null
          contact?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      ai_providers: {
        Row: {
          id: string
          name: string
          protocol: 'openai-compatible' | 'anthropic' | 'gemini'
          base_url: string
          key_mode: 'encrypted' | 'env'
          api_key_encrypted: string | null
          api_key_mask: string | null
          env_var_name: string | null
          models: string[]
          default_model: string
          custom_headers: Record<string, string>
          enabled: boolean
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          protocol: 'openai-compatible' | 'anthropic' | 'gemini'
          base_url: string
          key_mode?: 'encrypted' | 'env'
          api_key_encrypted?: string | null
          api_key_mask?: string | null
          env_var_name?: string | null
          models?: string[]
          default_model?: string
          custom_headers?: Record<string, string>
          enabled?: boolean
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          protocol?: 'openai-compatible' | 'anthropic' | 'gemini'
          base_url?: string
          key_mode?: 'encrypted' | 'env'
          api_key_encrypted?: string | null
          api_key_mask?: string | null
          env_var_name?: string | null
          models?: string[]
          default_model?: string
          custom_headers?: Record<string, string>
          enabled?: boolean
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ai_task_configs: {
        Row: {
          task_key: 'summary' | 'metadata' | 'translate' | 'rewrite' | 'outline'
          provider_id: string | null
          model: string | null
          temperature: number
          max_tokens: number
          system_prompt: string | null
          glossary: Array<{ source: string; target: string; note?: string }>
          updated_at: string
        }
        Insert: {
          task_key: 'summary' | 'metadata' | 'translate' | 'rewrite' | 'outline'
          provider_id?: string | null
          model?: string | null
          temperature?: number
          max_tokens?: number
          system_prompt?: string | null
          glossary?: Array<{ source: string; target: string; note?: string }>
          updated_at?: string
        }
        Update: {
          task_key?: 'summary' | 'metadata' | 'translate' | 'rewrite' | 'outline'
          provider_id?: string | null
          model?: string | null
          temperature?: number
          max_tokens?: number
          system_prompt?: string | null
          glossary?: Array<{ source: string; target: string; note?: string }>
          updated_at?: string
        }
      }
      post_translations: {
        Row: {
          id: string
          post_id: string
          locale: string
          title: string
          description: string | null
          ai_summary: Record<string, unknown> | null
          content: JSONContent
          source_hash: string
          published: boolean
          model_used: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          locale: string
          title: string
          description?: string | null
          ai_summary?: Record<string, unknown> | null
          content: JSONContent
          source_hash: string
          published?: boolean
          model_used?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          locale?: string
          title?: string
          description?: string | null
          ai_summary?: Record<string, unknown> | null
          content?: JSONContent
          source_hash?: string
          published?: boolean
          model_used?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_generation_logs: {
        Row: {
          id: string
          post_id: string | null
          task_key: string
          provider_id: string | null
          provider_name: string
          model: string
          prompt_tokens: number | null
          completion_tokens: number | null
          total_tokens: number | null
          duration_ms: number
          status: 'success' | 'error'
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          post_id?: string | null
          task_key: string
          provider_id?: string | null
          provider_name: string
          model: string
          prompt_tokens?: number | null
          completion_tokens?: number | null
          total_tokens?: number | null
          duration_ms?: number
          status: 'success' | 'error'
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string | null
          task_key?: string
          provider_id?: string | null
          provider_name?: string
          model?: string
          prompt_tokens?: number | null
          completion_tokens?: number | null
          total_tokens?: number | null
          duration_ms?: number
          status?: 'success' | 'error'
          error_message?: string | null
          created_at?: string
        }
      }
    }
  }
}

export type Post = Database['public']['Tables']['posts']['Row']
export type PostInsert = Database['public']['Tables']['posts']['Insert']
export type PostUpdate = Database['public']['Tables']['posts']['Update']

export type Page = Database['public']['Tables']['pages']['Row']
export type PageInsert = Database['public']['Tables']['pages']['Insert']
export type PageUpdate = Database['public']['Tables']['pages']['Update']

export type Tag = Database['public']['Tables']['tags']['Row']
export type TagInsert = Database['public']['Tables']['tags']['Insert']
export type TagUpdate = Database['public']['Tables']['tags']['Update']

export type Media = Database['public']['Tables']['media']['Row']
export type MediaInsert = Database['public']['Tables']['media']['Insert']
export type MediaUpdate = Database['public']['Tables']['media']['Update']

export type FriendLink = Database['public']['Tables']['friend_links']['Row']
export type FriendLinkInsert = Database['public']['Tables']['friend_links']['Insert']
export type FriendLinkUpdate = Database['public']['Tables']['friend_links']['Update']
