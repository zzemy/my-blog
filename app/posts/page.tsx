import type { Metadata } from 'next'
import { PostList } from '@/features/blog/components/shared/post-list'
import { getPublishedPosts } from '@/lib/supabase/posts'

export const revalidate = 60

export const metadata: Metadata = {
  title: '所有文章',
  description: '一些技术分享或是生活随笔。',
}

export default async function PostsPage() {
  const posts = await getPublishedPosts()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <div className="flex flex-col items-start gap-4 border-b border-border/70 pb-8 dark:border-white/12 md:flex-row md:items-end md:justify-between md:gap-8">
        <div className="flex-1 space-y-3">
          <h1 className="inline-block text-4xl font-bold tracking-tight lg:text-5xl">所有文章</h1>
          <p className="text-base text-muted-foreground md:text-lg">
            一些技术分享或是生活随笔
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-3 py-1 font-mono text-xs text-muted-foreground">
          共 {posts.length} 篇
        </span>
      </div>
      <div className="mt-4">
        <PostList posts={posts} readMoreText="阅读全文" />
      </div>
    </div>
  )
}
