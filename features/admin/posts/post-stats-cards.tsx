import { Card } from '@/components/ui/card'

import type { AdminPost } from './types'
import { getPostStats } from './utils'

interface PostStatsCardsProps {
  posts: AdminPost[]
}

export function PostStatsCards({ posts }: PostStatsCardsProps) {
  if (posts.length === 0) return null

  const stats = getPostStats(posts)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
        <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">{stats.publishedCount}</div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">已发布</p>
      </Card>
      <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
        <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">{stats.draftCount}</div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">草稿中</p>
      </Card>
      <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
        <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">{stats.featuredCount}</div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">特色文章</p>
      </Card>
      <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
        <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">{stats.totalViews.toLocaleString()}</div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">总浏览量</p>
      </Card>
    </div>
  )
}
