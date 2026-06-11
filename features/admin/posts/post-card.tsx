import Link from 'next/link'
import { Calendar, CheckCircle2, Circle, Edit, Eye, Settings, Star, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import type { AdminPost } from './types'

interface PostCardProps {
  post: AdminPost
  isSelected: boolean
  isDeleting: boolean
  isPublishing: boolean
  onToggleSelect: (id: string) => void
  onDelete: (id: string, title: string) => void
  onTogglePublish: (id: string, currentStatus: boolean) => void
  onOpenQuickEdit: (post: AdminPost) => void
}

export function PostCard({
  post,
  isSelected,
  isDeleting,
  isPublishing,
  onToggleSelect,
  onDelete,
  onTogglePublish,
  onOpenQuickEdit,
}: PostCardProps) {
  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-300 ${
        isSelected
          ? 'border-primary/50 shadow-[0_0_0_1px_rgba(var(--primary),0.5)] bg-primary/5 dark:bg-primary/5'
          : 'border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg dark:hover:shadow-zinc-900/50'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-zinc-50/50 dark:to-zinc-800/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative p-4 md:p-5 flex flex-col md:flex-row gap-4">
        <div className="flex-none pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(post.id)}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer transition-colors"
          />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {post.published ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 dark:bg-emerald-400"></span>
                </span>
                已发布
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 ring-1 ring-inset ring-zinc-500/20">
                <span className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                草稿
              </span>
            )}

            {post.featured && (
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-inset ring-purple-500/20">
                <Star className="w-3 h-3 fill-current" />
                Featured
              </span>
            )}
          </div>

          <Link href={`/admin/posts/${post.id}`} className="group/title block">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-tight group-hover/title:text-primary transition-colors line-clamp-1">
              {post.title}
            </h2>
          </Link>

          <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 md:line-clamp-1 h-auto min-h-[1.5em]">
            {post.description || <span className="italic opacity-50">暂无摘要...</span>}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400 dark:text-zinc-500 pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {(post.published && post.published_at ? new Date(post.published_at) : new Date(post.created_at)).toLocaleDateString('zh-CN')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span>{post.views.toLocaleString()}</span>
            </div>

            {post.tags.length > 0 && (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-zinc-500 dark:text-zinc-400">
                    # {tag}
                  </span>
                ))}
                {post.tags.length > 3 && <span>+{post.tags.length - 3}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 md:mt-0 md:self-center md:ml-4 border-t md:border-t-0 md:border-l border-zinc-100 dark:border-zinc-800 pt-3 md:pt-0 md:pl-4 min-w-fit">
          <Link href={`/admin/posts/${post.id}`} className="flex-1 md:flex-none">
            <Button size="sm" variant="default" className="w-full md:w-auto h-8 shadow-sm text-xs gap-1.5 px-3 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300">
              <Edit className="w-3.5 h-3.5" />
              <span className="md:inline">编辑</span>
            </Button>
          </Link>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onTogglePublish(post.id, post.published)}
            className={`h-8 px-2 md:px-3 text-xs gap-1.5 transition-colors ${
              post.published
                ? 'text-zinc-500 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 dark:text-zinc-400 dark:hover:text-amber-400'
                : 'text-emerald-600 border-emerald-200/50 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-300 dark:text-emerald-400 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/30'
            }`}
            title={post.published ? '转为草稿' : '发布文章'}
          >
            {isPublishing ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : post.published ? (
              <>
                <Circle className="w-3.5 h-3.5" />
                <span className="hidden md:inline">转草稿</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">发布</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenQuickEdit(post)}
            className="h-8 w-8 px-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            title="属性设置"
          >
            <Settings className="w-4 h-4" />
          </Button>

          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1 hidden md:block" />

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(post.id, post.title)}
            disabled={isDeleting}
            className="h-8 w-8 px-0 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="删除文章"
          >
            {isDeleting ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
