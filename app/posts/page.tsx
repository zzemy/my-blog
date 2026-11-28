import type { Metadata } from 'next'
import { PostsArchiveView } from '@/features/blog/components/client/posts-archive-view'
import { getPublishedPosts } from '@/lib/supabase/posts'

export const revalidate = 60

export const metadata: Metadata = {
  title: '所有文章',
  description: '一些技术分享或是生活随笔，支持时间轴归档与标签筛选。',
}

export default async function PostsPage() {
  const posts = await getPublishedPosts()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <div className="flex flex-col items-start gap-4 border-b border-border/70 pb-8 dark:border-white/12 md:flex-row md:items-end md:justify-between md:gap-8">
        <div className="flex-1 space-y-3">
          <h1 className="inline-block text-4xl font-bold tracking-tight lg:text-5xl">所有文章</h1>
          <p className="text-base text-muted-foreground md:text-lg">
            一些技术分享或是生活随笔，支持按年份归档与标签筛选
          </p>
        </div>
      </div>
      <div className="mt-6">
        <PostsArchiveView posts={posts} />
      </div>
    </div>
  )
}
