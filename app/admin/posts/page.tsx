'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BatchActionsBar } from '@/features/admin/posts/batch-actions-bar'
import { PostList } from '@/features/admin/posts/post-list'
import { PostListToolbar } from '@/features/admin/posts/post-list-toolbar'
import { PostStatsCards } from '@/features/admin/posts/post-stats-cards'
import { QuickEditDialog } from '@/features/admin/posts/quick-edit-dialog'
import type { AdminPost, PostFilterStatus, PostSortBy, QuickEditForm } from '@/features/admin/posts/types'
import { filterAndSortPosts, isoToLocalInput } from '@/features/admin/posts/utils'
import { useSupabaseAuthStore } from '@/lib/supabase-auth-store'

const emptyQuickEditForm: QuickEditForm = {
  title: '',
  featured: false,
  published_at: '',
  tags: [],
}

export default function AdminPostsPage() {
  const { accessToken } = useSupabaseAuthStore()
  const [posts, setPosts] = useState<AdminPost[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<PostFilterStatus>('all')
  const [sortBy, setSortBy] = useState<PostSortBy>('newest')

  const [editingPost, setEditingPost] = useState<AdminPost | null>(null)
  const [editForm, setEditForm] = useState<QuickEditForm>(emptyQuickEditForm)
  const [previewTag, setPreviewTag] = useState('')

  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [batchActionLoading, setBatchActionLoading] = useState(false)
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all')
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string
    description: string
    destructive?: boolean
    onConfirm: () => Promise<void>
  } | null>(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/posts?published=false', {
        credentials: 'include',
        headers: accessToken && accessToken !== 'hidden'
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined,
      })

      const result = await res.json().catch(() => ({}))

      if (!res.ok) {
        const message = result?.error ? `获取文章失败：${result.error}` : `获取文章失败（${res.status}）`
        throw new Error(message)
      }

      setPosts(result.posts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取文章失败')
      console.error('Failed to fetch posts:', err)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const allTags = Array.from(
    new Set(posts.flatMap((p) => (p.tags ?? []).map((t) => t.trim()).filter(Boolean))),
  ).sort((a, b) => a.localeCompare(b, 'zh-CN'))

  const filteredPosts = filterAndSortPosts(posts, searchQuery, filterStatus, sortBy).filter(
    (post) => {
      if (featuredOnly && !post.featured) return false
      if (selectedTagFilter !== 'all' && !(post.tags ?? []).includes(selectedTagFilter)) return false
      return true
    },
  )

  const deletePost = (id: string, title: string) => {
    setConfirmDialog({
      title: '确认删除文章',
      description: `确定要永久删除文章「${title}」吗？此操作不可撤销。`,
      destructive: true,
      onConfirm: async () => {
        setDeleting(id)
        try {
          const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('删除失败')
          setPosts((current) => current.filter((p) => p.id !== id))
          toast.success(`已删除「${title}」`)
        } catch (err) {
          toast.error(err instanceof Error ? err.message : '删除失败')
        } finally {
          setDeleting(null)
        }
      },
    })
  }

  const togglePublish = async (id: string, currentStatus: boolean) => {
    setPublishing(id)
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          published: !currentStatus,
        }),
      })

      if (!res.ok) {
        throw new Error('更新失败')
      }

      const nowISO = new Date().toISOString()
      setPosts((current) =>
        current.map((p) =>
          p.id === id
            ? { ...p, published: !currentStatus, published_at: !currentStatus ? nowISO : null }
            : p,
        ),
      )
      toast.success(!currentStatus ? '文章已发布' : '文章已转为草稿')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新失败')
    } finally {
      setPublishing(null)
    }
  }

  const openEditModal = (post: AdminPost) => {
    setEditingPost(post)

    const publishedAtValue = post.published && post.published_at ? isoToLocalInput(post.published_at) : ''

    setEditForm({
      title: post.title,
      featured: post.featured,
      published_at: publishedAtValue,
      tags: post.tags || [],
    })
    setPreviewTag('')
  }

  const handleAddTag = () => {
    const tag = previewTag.trim()

    if (tag && !editForm.tags.includes(tag)) {
      setEditForm({ ...editForm, tags: [...editForm.tags, tag] })
      setPreviewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setEditForm({
      ...editForm,
      tags: editForm.tags.filter((tag) => tag !== tagToRemove),
    })
  }

  const closeQuickEdit = () => {
    setEditingPost(null)
  }

  const saveQuickEdit = async () => {
    if (!editingPost) return

    try {
      const updateData: Record<string, unknown> = {
        title: editForm.title,
        featured: editForm.featured,
        tags: editForm.tags,
      }

      let newPublishedAtISO: string | undefined
      if (editForm.published_at) {
        newPublishedAtISO = new Date(editForm.published_at).toISOString()
        updateData.published_at = newPublishedAtISO
      }

      const res = await fetch(`/api/admin/posts/${editingPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        throw new Error('更新失败')
      }

      setPosts(posts.map((p) =>
        p.id === editingPost.id
          ? {
              ...p,
              title: editForm.title,
              featured: editForm.featured,
              tags: editForm.tags,
              published_at: newPublishedAtISO ?? p.published_at,
            }
          : p
      ))

      setEditingPost(null)
      toast.success('文章信息已更新')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新失败')
    }
  }

  const toggleSelectAll = () => {
    if (selectedPosts.length === filteredPosts.length) {
      setSelectedPosts([])
    } else {
      setSelectedPosts(filteredPosts.map((p) => p.id))
    }
  }

  const toggleSelectPost = (id: string) => {
    if (selectedPosts.includes(id)) {
      setSelectedPosts(selectedPosts.filter((p) => p !== id))
    } else {
      setSelectedPosts([...selectedPosts, id])
    }
  }

  const handleBatchDelete = () => {
    if (selectedPosts.length === 0) return
    const targetIds = [...selectedPosts]
    setConfirmDialog({
      title: `批量删除 ${targetIds.length} 篇文章`,
      description: `确定要永久删除选中的 ${targetIds.length} 篇文章吗？此操作不可撤销。`,
      destructive: true,
      onConfirm: async () => {
        setBatchActionLoading(true)
        try {
          const res = await fetch('/api/admin/posts/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', ids: targetIds }),
          })
          const data = (await res.json().catch(() => ({}))) as { affectedIds?: string[]; error?: string }
          if (!res.ok) throw new Error(data.error || '批量删除失败')
          const deletedSet = new Set(data.affectedIds ?? targetIds)
          setPosts((current) => current.filter((p) => !deletedSet.has(p.id)))
          setSelectedPosts([])
          toast.success(`已批量删除 ${deletedSet.size} 篇文章`)
        } catch (err) {
          toast.error(err instanceof Error ? err.message : '批量删除失败')
        } finally {
          setBatchActionLoading(false)
        }
      },
    })
  }

  const handleBatchPublish = (publish: boolean) => {
    if (selectedPosts.length === 0) return
    const targetIds = [...selectedPosts]
    setConfirmDialog({
      title: publish ? `批量发布 ${targetIds.length} 篇文章` : `批量转为草稿 (${targetIds.length} 篇)`,
      description: `确定要将选中的 ${targetIds.length} 篇文章${publish ? '公开发布' : '撤回为草稿'}吗？`,
      onConfirm: async () => {
        setBatchActionLoading(true)
        try {
          const res = await fetch('/api/admin/posts/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: publish ? 'publish' : 'unpublish', ids: targetIds }),
          })
          const data = (await res.json().catch(() => ({}))) as { affectedIds?: string[]; error?: string }
          if (!res.ok) throw new Error(data.error || '批量操作失败')
          const updatedSet = new Set(data.affectedIds ?? targetIds)
          const nowISO = new Date().toISOString()
          setPosts((current) =>
            current.map((p) =>
              updatedSet.has(p.id)
                ? { ...p, published: publish, published_at: publish ? (p.published_at || nowISO) : p.published_at }
                : p,
            ),
          )
          setSelectedPosts([])
          toast.success(`已将 ${updatedSet.size} 篇文章${publish ? '发布' : '转为草稿'}`)
        } catch (err) {
          toast.error(err instanceof Error ? err.message : '批量操作失败')
        } finally {
          setBatchActionLoading(false)
        }
      },
    })
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600"></div>
            </div>
            <p className="text-muted-foreground">加载文章中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-12 pb-32">
        <div className="mb-8 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between md:gap-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">文章管理</h1>
            <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400">
              共 <span className="font-semibold text-zinc-900 dark:text-zinc-100">{posts.length}</span> 篇文章
            </p>
          </div>
          <Link href="/admin/posts/new" className="flex-shrink-0">
            <Button className="w-full md:w-auto gap-2 px-6 h-11 text-base font-medium shadow-sm hover:shadow-md transition-shadow">
              <PlusCircle className="h-5 w-5" />
              新建文章
            </Button>
          </Link>
        </div>

        <PostListToolbar
          searchQuery={searchQuery}
          filterStatus={filterStatus}
          sortBy={sortBy}
          selectedCount={selectedPosts.length}
          totalCount={filteredPosts.length}
          onSearchQueryChange={setSearchQuery}
          onFilterStatusChange={setFilterStatus}
          onSortByChange={setSortBy}
          onToggleSelectAll={toggleSelectAll}
        />

        {(allTags.length > 0 || posts.some((p) => p.featured)) && (
          <div className="-mt-4 mb-6 flex flex-wrap items-center gap-2 text-xs">
            <Button
              type="button"
              size="sm"
              variant={featuredOnly ? 'default' : 'outline'}
              onClick={() => setFeaturedOnly((v) => !v)}
              className="h-8 text-xs"
            >
              仅看精选置顶
            </Button>
            {allTags.length > 0 && (
              <select
                aria-label="按标签筛选"
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs"
              >
                <option value="all">全部标签 ({allTags.length})</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <PostStatsCards posts={posts} />

        {error && (
          <div className="mb-8 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-4 flex gap-4">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">出错了</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        <PostList
          posts={filteredPosts}
          selectedPostIds={selectedPosts}
          deletingPostId={deleting}
          publishingPostId={publishing}
          searchQuery={searchQuery}
          filterStatus={filterStatus}
          onToggleSelectPost={toggleSelectPost}
          onDeletePost={deletePost}
          onTogglePublish={togglePublish}
          onOpenQuickEdit={openEditModal}
        />
      </div>

      <BatchActionsBar
        selectedCount={selectedPosts.length}
        loading={batchActionLoading}
        onPublishSelected={() => handleBatchPublish(true)}
        onUnpublishSelected={() => handleBatchPublish(false)}
        onDeleteSelected={handleBatchDelete}
        onClearSelection={() => setSelectedPosts([])}
      />

      <QuickEditDialog
        post={editingPost}
        form={editForm}
        previewTag={previewTag}
        onClose={closeQuickEdit}
        onFormChange={setEditForm}
        onPreviewTagChange={setPreviewTag}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        onSave={saveQuickEdit}
      />

      <Dialog open={Boolean(confirmDialog)} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog?.title}</DialogTitle>
            <DialogDescription>{confirmDialog?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmDialog(null)}>
              取消
            </Button>
            <Button
              type="button"
              variant={confirmDialog?.destructive ? 'destructive' : 'default'}
              onClick={() => {
                const action = confirmDialog?.onConfirm
                setConfirmDialog(null)
                if (action) void action()
              }}
            >
              确认执行
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
