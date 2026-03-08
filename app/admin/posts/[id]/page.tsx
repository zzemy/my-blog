'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { pinyin } from 'pinyin-pro'
import type { Content } from '@tiptap/react'
import { TipTapEditor } from '@/features/blog/editor/tiptap-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Save,
  Trash2,
  Calendar,
  Tag,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Star,
  Search,
} from 'lucide-react'
import Link from 'next/link'

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = String(params.id ?? '')
  
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
  const nowLocalInput = () => isoToLocalInput(new Date().toISOString())
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [previewTag, setPreviewTag] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    cover_image: '',
    tags: [] as string[],
    content: undefined as Content | undefined,
    published: false,
    featured: false,
    reading_time: 0,
    locale: 'zh',
    published_at: '',
    seo_title: '',
    seo_description: '',
  })

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/posts/${postId}`)

      if (!res.ok) {
        throw new Error('获取文章失败')
      }

      const result = await res.json()
      const post = result.post

      setFormData({
        title: post.title,
        slug: post.slug,
        description: post.description || '',
        cover_image: post.cover_image || '',
        tags: post.tags || [],
        content: (post.content ?? undefined) as Content | undefined,
        published: post.published,
        featured: post.featured || false,
        reading_time: post.reading_time || 0,
        seo_title: post.seo_title || '',
        seo_description: post.seo_description || '',
        locale: post.locale || 'zh',
        published_at: post.published_at ? isoToLocalInput(post.published_at) : '',
      })
    } catch (err) {
      console.error('Failed to fetch post:', err)
      setError('无法获取文章信息')
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    fetchPost()
  }, [fetchPost])

  const generateSlug = () => {
    const slug = pinyin(formData.title, { 
      toneType: 'none', 
      type: 'array',
      v: true 
    })
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')

    setFormData({ ...formData, slug })
  }

  const calculateWordCount = () => {
    if (!formData.content) return 0
    // 获取文本内容
    const text = JSON.stringify(formData.content)
    // 粗略统计字数
    return text.length
  }

  const handleAddTag = () => {
    if (previewTag.trim() && !formData.tags.includes(previewTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, previewTag.trim()],
      })
      setPreviewTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    })
  }

  const handleSubmit = async (published: boolean) => {
    setError(null)

    // 验证
    const errors = []
    if (!formData.title.trim()) errors.push('标题不能为空')
    if (!formData.slug.trim()) errors.push('URL Slug 不能为空')
    if (!formData.content) errors.push('内容不能为空')
    if (formData.tags.length === 0) errors.push('至少需要一个标签')

    if (errors.length > 0) {
      setError(errors.join('，'))
      return
    }

    setSaving(true)
    try {
      const submitData: Record<string, unknown> = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        cover_image: formData.cover_image,
        tags: formData.tags,
        content: formData.content,
        published,
        featured: formData.featured,
        reading_time: calculateWordCount(),
        locale: formData.locale,
        seo_title: formData.seo_title,
        seo_description: formData.seo_description,
      }

      // 如果发布，设置发布时间
      if (published) {
        submitData.published_at = (formData.published && formData.published_at
          ? new Date(formData.published_at).toISOString()
          : new Date().toISOString())
      }

      const res = await fetch(`/api/admin/posts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || '保存失败')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/posts')
      }, 1500)
    } catch (err) {
      console.error('Failed to save post:', err)
      setError(err instanceof Error ? err.message : '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这篇文章吗？此操作不能撤销。')) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/posts/${params.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('删除失败')
      }

      alert('删除成功')
      router.push('/admin/posts')
    } catch (err) {
      console.error('Failed to delete post:', err)
      setError(err instanceof Error ? err.message : '删除失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600 mb-4"></div>
          <p className="text-muted-foreground">加载文章中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-6xl py-8">
        {/* 返回按钮 */}
        <div className="mb-8">
          <Link href="/admin/posts">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </Button>
          </Link>
        </div>

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

        {/* 成功提示 */}
        {success && (
          <div className="mb-8 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-lg p-4 flex gap-4">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">保存成功!</h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">正在返回文章列表...</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主内容区 */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-8">
              <h1 className="text-3xl font-bold mb-8">编辑文章</h1>

              <div className="space-y-6">
                {/* 标题 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    标题 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="输入文章标题"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="url-slug"
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={generateSlug} type="button">
                      自动生成
                    </Button>
                  </div>
                </div>

                {/* 摘要 */}
                <div>
                  <label className="block text-sm font-medium mb-2">摘要</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="文章摘要（可选）"
                  />
                </div>

                {/* 封面图片 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <ImageIcon className="inline mr-2 h-4 w-4" />
                    封面图片 URL
                  </label>
                  <Input
                    value={formData.cover_image}
                    onChange={(e) =>
                      setFormData({ ...formData, cover_image: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* 内容编辑器 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    内容 <span className="text-red-500">*</span>
                  </label>
                  <TipTapEditor
                    content={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                  />
                </div>
              </div>
            </Card>

            {/* SEO 设置 */}
            <Card className="p-8">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Search className="h-5 w-5" />
                SEO 优化
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">SEO 标题</label>
                  <Input
                    value={formData.seo_title || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, seo_title: e.target.value })
                    }
                    placeholder="自定义搜索引擎显示的标题"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    若不填写则直接使用文章标题
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">SEO 描述</label>
                  <Textarea
                     className="h-20"
                    value={formData.seo_description || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, seo_description: e.target.value })
                    }
                    placeholder="自定义搜索引擎显示的描述"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 发布设置 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">发布设置</h3>
              <div className="space-y-4">
                {/* 发布状态 */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setFormData({
                          ...formData,
                          published: checked,
                          published_at:
                            checked && !formData.published_at ? nowLocalInput() : formData.published_at,
                        })
                      }}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">设定发布时间</span>
                  </label>
                </div>

                {/* 发布时间 */}
                {formData.published && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Calendar className="inline mr-1 h-4 w-4" />
                      发布时间
                    </label>
                    <Input
                      type="datetime-local"
                      value={formData.published_at}
                      onChange={(e) =>
                        setFormData({ ...formData, published_at: e.target.value })
                      }
                    />
                  </div>
                )}

                {/* 特色文章 */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) =>
                        setFormData({ ...formData, featured: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm font-medium">
                      <Star className="inline mr-1 h-4 w-4" />
                      特色文章
                    </span>
                  </label>
                </div>
              </div>
            </Card>

            {/* 文章信息 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">文章信息</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">字数统计</span>
                  <p>{calculateWordCount()} 字</p>
                </div>
                <Separator />
                <div>
                  <span className="font-medium">语言</span>
                  <select
                    value={formData.locale}
                    onChange={(e) =>
                      setFormData({ ...formData, locale: e.target.value })
                    }
                    className="block w-full mt-2 rounded border border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-sm"
                  >
                    <option value="zh">中文</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="ja">日本語</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* 标签 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                <Tag className="inline mr-2 h-4 w-4" />
                标签 <span className="text-red-500">*</span>
              </h3>
              <div className="space-y-3">
                {/* 已有标签 */}
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <div
                      key={tag}
                      className="bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 rounded-full px-3 py-1 text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* 添加标签 */}
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
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                  >
                    添加
                  </Button>
                </div>
              </div>
            </Card>

            {/* 操作按钮 */}
            <div className="space-y-2">
              <Button
                onClick={() => handleSubmit(false)}
                disabled={saving}
                variant="outline"
                className="w-full gap-2"
              >
                <Save className="h-4 w-4" />
                保存草稿
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={saving}
                className="w-full gap-2"
              >
                <Save className="h-4 w-4" />
                {formData.published ? '更新' : '发布'}文章
              </Button>
              <Button
                onClick={handleDelete}
                disabled={saving}
                variant="outline"
                className="w-full gap-2 text-destructive hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-4 w-4" />
                删除文章
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
