// Post data types for the blog
export interface PostData {
  id: string
  publicId?: string | null
  slug: string
  title: string
  date: string
  summary?: string
  excerpt?: string
  tags?: string[]
  readingTime?: string
  coverImage?: string | null
  locale?: string
}

export interface TocItem {
  id: string
  text: string
  level: number
}
