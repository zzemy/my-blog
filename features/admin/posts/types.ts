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

export interface PostStats {
  publishedCount: number
  draftCount: number
  featuredCount: number
  totalViews: number
}
