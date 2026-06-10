import type { Content } from '@tiptap/react'

export interface AdminPost {
  id: string
  title: string
  slug: string
  description: string | null
  published: boolean
  published_at?: string | null
  created_at: string
  updated_at: string
  views: number
  tags: string[]
  featured: boolean
  author?: string
}

export type PostFilterStatus = 'all' | 'published' | 'draft'

export type PostSortBy = 'newest' | 'oldest' | 'modified'

export interface QuickEditForm {
  title: string
  featured: boolean
  published_at: string
  tags: string[]
}

export interface PostFormData {
  title: string
  slug: string
  description: string
  cover_image: string
  tags: string[]
  content: Content | undefined
  published: boolean
  featured: boolean
  reading_time: number
  locale: string
  published_at: string
  seo_title: string
  seo_description: string
}

export interface PostStats {
  publishedCount: number
  draftCount: number
  featuredCount: number
  totalViews: number
}
