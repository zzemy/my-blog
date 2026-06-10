import type { AdminPost, PostFilterStatus, PostSortBy, PostStats } from './types'

export function isoToLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = d.getFullYear()
  const MM = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())

  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
}

export function nowLocalInput() {
  return isoToLocalInput(new Date().toISOString())
}

export function filterAndSortPosts(
  posts: AdminPost[],
  searchQuery: string,
  filterStatus: PostFilterStatus,
  sortBy: PostSortBy,
) {
  const normalizedQuery = searchQuery.toLowerCase()

  return posts
    .filter((post) => {
      if (filterStatus === 'published' && !post.published) return false
      if (filterStatus === 'draft' && post.published) return false
      if (normalizedQuery && !post.title.toLowerCase().includes(normalizedQuery)) return false

      return true
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        const aTime = a.published_at ? new Date(a.published_at).getTime() : 0
        const bTime = b.published_at ? new Date(b.published_at).getTime() : 0

        return bTime - aTime
      }

      if (sortBy === 'oldest') {
        const aTime = a.published_at ? new Date(a.published_at).getTime() : Infinity
        const bTime = b.published_at ? new Date(b.published_at).getTime() : Infinity

        return aTime - bTime
      }

      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
}

export function getPostStats(posts: AdminPost[]): PostStats {
  return {
    publishedCount: posts.filter((post) => post.published).length,
    draftCount: posts.filter((post) => !post.published).length,
    featuredCount: posts.filter((post) => post.featured).length,
    totalViews: posts.reduce((sum, post) => sum + post.views, 0),
  }
}
