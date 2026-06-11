import Link from 'next/link'
import { FileText, PlusCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { PostCard } from './post-card'
import type { AdminPost, PostFilterStatus } from './types'

interface PostListProps {
  posts: AdminPost[]
  selectedPostIds: string[]
  deletingPostId: string | null
  publishingPostId: string | null
  searchQuery: string
  filterStatus: PostFilterStatus
  onToggleSelectPost: (id: string) => void
  onDeletePost: (id: string, title: string) => void
  onTogglePublish: (id: string, currentStatus: boolean) => void
  onOpenQuickEdit: (post: AdminPost) => void
}

export function PostList({
  posts,
  selectedPostIds,
  deletingPostId,
  publishingPostId,
  searchQuery,
  filterStatus,
  onToggleSelectPost,
  onDeletePost,
  onTogglePublish,
  onOpenQuickEdit,
}: PostListProps) {
  if (posts.length === 0) {
    return (
      <Card className="p-24 text-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 border-dashed">
        <div className="flex justify-center mb-6">
          <FileText className="h-16 w-16 text-zinc-300 dark:text-zinc-700" />
        </div>
        <h3 className="text-2xl font-bold mb-3 text-zinc-900 dark:text-zinc-50">暂无文章</h3>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm mx-auto text-base">
          {searchQuery || filterStatus !== 'all'
            ? '没有找到匹配的文章，尝试修改搜索条件。'
            : '还没有创建任何文章，现在就开始创作你的第一篇文章吧。'}
        </p>
        {!searchQuery && filterStatus === 'all' && (
          <Link href="/admin/posts/new">
            <Button size="lg" className="gap-2">
              <PlusCircle className="h-5 w-5" />
              创建第一篇文章
            </Button>
          </Link>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isSelected={selectedPostIds.includes(post.id)}
          isDeleting={deletingPostId === post.id}
          isPublishing={publishingPostId === post.id}
          onToggleSelect={onToggleSelectPost}
          onDelete={onDeletePost}
          onTogglePublish={onTogglePublish}
          onOpenQuickEdit={onOpenQuickEdit}
        />
      ))}
    </div>
  )
}
