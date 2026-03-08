'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSupabaseAuthStore } from '@/lib/supabase-auth-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  FileText,
  Calendar,
  AlertCircle,
  Search,
  CheckCircle2,
  Circle,
  X,
  Star,
  Settings,
} from 'lucide-react'

interface Post {
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

export default function AdminPostsPage() {
  const { accessToken } = useSupabaseAuthStore()
  const [posts, setPosts] = useState<Post[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'modified'>('newest')
  
  // 快速编辑状态
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    featured: false,
    published_at: '',
    tags: [] as string[],
  })
  const [previewTag, setPreviewTag] = useState('')
  
  // 批量操作状态
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [batchActionLoading, setBatchActionLoading] = useState(false)

  // 将 ISO 字符串转换为 datetime-local 需要的本地时间格式（YYYY-MM-DDTHH:mm）
  const isoToLocalInput = (iso: string) => {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    const yyyy = d.getFullYear()
    const MM = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mm = pad(d.getMinutes())
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
  }

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/posts?locale=zh&published=false', {
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

  const deletePost = async (id: string, title: string) => {
    if (!confirm(`确定要删除文章"${title}"吗？这个操作不能撤销。`)) return

    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('删除失败')
      }

      setPosts(posts.filter((p) => p.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeleting(null)
    }
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

      // 本地立即反映发布状态与发布时间（发布时使用当前时间，取消时清空）
      const nowISO = new Date().toISOString()
      setPosts(posts.map((p) => 
        p.id === id 
          ? { ...p, published: !currentStatus, published_at: !currentStatus ? nowISO : null }
          : p
      ))
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新失败')
    } finally {
      setPublishing(null)
    }
  }

  // 过滤和搜索
  const filteredPosts = posts
    .filter((post) => {
      // 按状态过滤
      if (filterStatus === 'published' && !post.published) return false
      if (filterStatus === 'draft' && post.published) return false
      // 按搜索词过滤
      if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        // 按发布时间从新到旧，没有发布时间的放在最后
        const aTime = a.published_at ? new Date(a.published_at).getTime() : 0
        const bTime = b.published_at ? new Date(b.published_at).getTime() : 0
        return bTime - aTime
      } else if (sortBy === 'oldest') {
        // 按发布时间从旧到新
        const aTime = a.published_at ? new Date(a.published_at).getTime() : Infinity
        const bTime = b.published_at ? new Date(b.published_at).getTime() : Infinity
        return aTime - bTime
      } else {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })

  const openEditModal = (post: Post) => {
    setEditingPost(post)
    
    // 处理发布时间的格式转换
    let publishedAtValue = ''
    if (post.published && post.published_at) {
      // 将 ISO UTC 转换为本地 datetime-local 格式 (YYYY-MM-DDTHH:mm)
      publishedAtValue = isoToLocalInput(post.published_at)
    }
    
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
      tags: editForm.tags.filter((t) => t !== tagToRemove),
    })
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

      // 更新本地列表（包含可能更新的发布时间）
      setPosts(posts.map((p) =>
        p.id === editingPost.id
          ? { ...p, title: editForm.title, featured: editForm.featured, published_at: newPublishedAtISO ?? p.published_at }
          : p
      ))

      setEditingPost(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新失败')
    }
  }

  // 批量操作处理函数
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

  const handleBatchDelete = async () => {
    if (!confirm(`确定要删除选中的 ${selectedPosts.length} 篇文章吗？这个操作不可撤销。`)) return
    
    setBatchActionLoading(true)
    try {
      await Promise.all(selectedPosts.map(id => 
        fetch(`/api/admin/posts/${id}`, {
          method: 'DELETE',
        })
      ))
      // 刷新列表
      setPosts(posts.filter(p => !selectedPosts.includes(p.id)))
      setSelectedPosts([])
    } catch {
      alert('批量删除部分或全部失败')
    } finally {
      setBatchActionLoading(false)
    }
  }

  const handleBatchPublish = async (publish: boolean) => {
    if (!confirm(`确定要${publish ? '发布' : '转为草稿'}选中的 ${selectedPosts.length} 篇文章吗？`)) return

    setBatchActionLoading(true)
    try {
      await Promise.all(selectedPosts.map(id => 
        fetch(`/api/admin/posts/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ published: publish })
        })
      ))
      
      const nowISO = new Date().toISOString()
      setPosts(posts.map(p => 
        selectedPosts.includes(p.id) 
          ? { ...p, published: publish, published_at: publish ? (p.published_at || nowISO) : null }
          : p
      ))
      setSelectedPosts([])
    } catch {
      alert('批量操作失败')
    } finally {
      setBatchActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
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
    <div className="min-h-screen bg-gradient-to-b from-background to-zinc-50 dark:to-zinc-950">
      <div className="container mx-auto px-4 max-w-6xl py-12 pb-32">
        {/* 页头部分 */}
        <div className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between md:items-end gap-4 md:gap-8">
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

        {/* 工具栏区域 */}
        <div className="mb-8 space-y-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          {/* 搜索框 */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="搜索文章标题..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
              />
            </div>
          </div>

          {/* 筛选和排序 */}
          <div className="flex flex-col gap-4">
            {/* 移动端：水平滚动容器 */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-2 items-center flex-wrap">
                <span className="hidden md:inline text-sm text-zinc-500 dark:text-zinc-400 font-medium">筛选：</span>
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                  {(['all', 'published', 'draft'] as const).map((status) => (
                    <Button
                      key={status}
                      variant={filterStatus === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus(status)}
                      className={`whitespace-nowrap ${filterStatus === status ? '' : 'text-zinc-600 dark:text-zinc-300'}`}
                    >
                      {status === 'all' && '全部'}
                      {status === 'published' && '已发布'}
                      {status === 'draft' && '草稿'}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 items-center flex-wrap">
                <span className="hidden md:inline text-sm text-zinc-500 dark:text-zinc-400 font-medium">排序：</span>
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                  {(['newest', 'oldest', 'modified'] as const).map((sort) => (
                    <Button
                      key={sort}
                      variant={sortBy === sort ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortBy(sort)}
                      className={`whitespace-nowrap ${sortBy === sort ? '' : 'text-zinc-600 dark:text-zinc-300'}`}
                    >
                      {sort === 'newest' && '最新'}
                      {sort === 'oldest' && '最早'}
                      {sort === 'modified' && '最近修改'}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 items-center pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="w-full md:w-auto text-zinc-600 dark:text-zinc-300 gap-2"
                >
                  <div className={`w-3.5 h-3.5 rounded border ${
                      selectedPosts.length > 0 && selectedPosts.length === filteredPosts.length 
                        ? 'bg-primary border-primary' 
                        : 'border-zinc-400'
                    } flex items-center justify-center`}>
                    {selectedPosts.length > 0 && selectedPosts.length === filteredPosts.length && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>
                  {selectedPosts.length === filteredPosts.length && filteredPosts.length > 0 ? '取消全选' : '全选'}
                </Button>
              </div>
            </div>
          </div>
        </div>

      {/* 统计卡片 */}
        {posts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">{posts.filter(p => p.published).length}</div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">已发布</p>
            </Card>
            <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">{posts.filter(p => !p.published).length}</div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">草稿中</p>
            </Card>
            <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">{posts.filter(p => p.featured).length}</div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">特色文章</p>
            </Card>
            <Card className="p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">{posts.reduce((sum, p) => sum + p.views, 0).toLocaleString()}</div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">总浏览量</p>
            </Card>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mb-8 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-4 flex gap-4">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">出错了</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* 文章列表 */}
        <div className="space-y-3">
          {filteredPosts.length === 0 ? (
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
          ) : (
            filteredPosts.map((post) => (
              <Card
                key={post.id}
                className={`group relative overflow-hidden transition-all duration-300 ${
                  selectedPosts.includes(post.id) 
                    ? 'border-primary/50 shadow-[0_0_0_1px_rgba(var(--primary),0.5)] bg-primary/5 dark:bg-primary/5' 
                    : 'border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg dark:hover:shadow-zinc-900/50'
                }`}
              >
                {/* 装饰性背景 */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-zinc-50/50 dark:to-zinc-800/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="relative p-4 md:p-5 flex flex-col md:flex-row gap-4">
                  {/* Left: Checkbox */}
                  <div className="flex-none pt-1">
                    <input 
                      type="checkbox"
                      checked={selectedPosts.includes(post.id)}
                      onChange={() => toggleSelectPost(post.id)}
                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer transition-colors"
                    />
                  </div>
                  
                  {/* Middle: Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Header: Status Badges */}
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

                    {/* Title */}
                    <Link href={`/admin/posts/${post.id}`} className="group/title block">
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-tight group-hover/title:text-primary transition-colors line-clamp-1">
                        {post.title}
                      </h2>
                    </Link>
                    
                    {/* Description */}
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 md:line-clamp-1 h-auto min-h-[1.5em]">
                      {post.description || <span className="italic opacity-50">暂无摘要...</span>}
                    </p>

                    {/* Bottom: Meta Info */}
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
                           {post.tags.slice(0, 3).map(tag => (
                             <span key={tag} className="text-zinc-500 dark:text-zinc-400">
                               # {tag}
                             </span>
                           ))}
                           {post.tags.length > 3 && (
                             <span>+{post.tags.length - 3}</span>
                           )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
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
                        onClick={() => togglePublish(post.id, post.published)}
                        className={`h-8 px-2 md:px-3 text-xs gap-1.5 transition-colors ${
                           post.published 
                              ? 'text-zinc-500 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 dark:text-zinc-400 dark:hover:text-amber-400' 
                              : 'text-emerald-600 border-emerald-200/50 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-300 dark:text-emerald-400 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/30'
                        }`}
                        title={post.published ? "转为草稿" : "发布文章"}
                     >
                        {publishing === post.id ? (
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
                        onClick={() => openEditModal(post)}
                        className="h-8 w-8 px-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                        title="属性设置"
                     >
                        <Settings className="w-4 h-4" />
                     </Button>

                     <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1 hidden md:block" />

                     <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePost(post.id, post.title)}
                        disabled={deleting === post.id}
                        className="h-8 w-8 px-0 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="删除文章"
                     >
                        {deleting === post.id ? (
                           <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        ) : (
                           <Trash2 className="w-4 h-4" />
                        )}
                     </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* 底部悬浮批量操作栏 */}
      {selectedPosts.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 w-[90%] md:w-auto max-w-sm md:max-w-none">
          <div className="bg-zinc-900 dark:bg-zinc-100 shadow-2xl border border-zinc-800 dark:border-zinc-200/50 rounded-full px-4 py-2 flex items-center justify-between md:justify-start gap-2">
            <span className="text-sm font-medium text-zinc-100 dark:text-zinc-900 px-1 md:px-3 whitespace-nowrap">
              已选 {selectedPosts.length}
            </span>
            
            <div className="h-4 w-px bg-white/15 dark:bg-black/10 mx-1 md:mx-2" />
            
            <div className="flex items-center gap-1">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleBatchPublish(true)}
                disabled={batchActionLoading}
                className="h-8 rounded-full text-zinc-300 dark:text-zinc-600 hover:text-white dark:hover:text-black hover:bg-white/10 dark:hover:bg-black/5 px-2 md:px-4"
              >
                <CheckCircle2 className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">发布</span>
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleBatchPublish(false)}
                disabled={batchActionLoading}
                className="h-8 rounded-full text-zinc-300 dark:text-zinc-600 hover:text-white dark:hover:text-black hover:bg-white/10 dark:hover:bg-black/5 px-2 md:px-4"
              >
                <Circle className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">草稿</span>
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleBatchDelete}
                disabled={batchActionLoading}
                className="h-8 rounded-full text-red-400 dark:text-red-500 hover:text-red-300 dark:hover:text-red-600 hover:bg-red-500/10 dark:hover:bg-red-500/10 px-2 md:px-4"
              >
                <Trash2 className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">{batchActionLoading ? '处理中...' : '删除'}</span>
              </Button>
            </div>

            <div className="h-4 w-px bg-white/15 dark:bg-black/10 mx-1 md:mx-2" />
            
            <Button 
              size="sm" 
              variant="ghost" 
              className="rounded-full h-8 w-8 p-0 text-zinc-400 dark:text-zinc-500 hover:text-white dark:hover:text-black hover:bg-white/10 dark:hover:bg-black/5"
              onClick={() => setSelectedPosts([])}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 快速编辑模态框 */}
      <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>快速编辑</DialogTitle>
          </DialogHeader>
          {editingPost && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="quick-edit-title" className="text-sm font-medium">标题</label>
                <Input
                  id="quick-edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="文章标题"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="quick-edit-published_at" className="text-sm font-medium">发布时间</label>
                <Input
                  id="quick-edit-published_at"
                  type="datetime-local"
                  value={editForm.published_at}
                  onChange={(e) => setEditForm({ ...editForm, published_at: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">标签</label>
                <div className="flex gap-2">
                  <Input
                    value={previewTag}
                    onChange={(e) => setPreviewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="输入标签..."
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    size="sm"
                    variant="outline"
                  >
                    添加
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editForm.tags.map((tag) => (
                    <div
                      key={tag}
                      className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="quick-edit-featured"
                  checked={editForm.featured}
                  onChange={(e) => setEditForm({ ...editForm, featured: e.target.checked })}
                  className="h-4 w-4 rounded border border-input accent-primary"
                />
                <label htmlFor="quick-edit-featured" className="cursor-pointer text-sm font-medium">
                  <Star className="h-4 w-4 inline mr-2" />
                  标记为特色文章
                </label>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingPost(null)}
            >
              取消
            </Button>
            <Button
              onClick={saveQuickEdit}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
