import { JSONContent } from '@tiptap/react'

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          content: JSONContent
          cover_image: string | null
          author: string
          locale: string
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
          title: string
          slug: string
          description?: string | null
          content: JSONContent
          cover_image?: string | null
          author?: string
          locale?: string
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
          title?: string
          slug?: string
          description?: string | null
          content?: JSONContent
          cover_image?: string | null
          author?: string
          locale?: string
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
          locale: string
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
          locale?: string
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
          locale?: string
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
