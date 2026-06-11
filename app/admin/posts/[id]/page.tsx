'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { PostEditorWorkspace } from '@/features/admin/posts/post-editor-workspace'
import {
  calculateContentSize,
  createEmptyPostForm,
  resolvePublishedAtForSubmit,
  validatePostForm,
} from '@/features/admin/posts/form-utils'
import { isoToLocalInput } from '@/features/admin/posts/utils'

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = String(params.id ?? '')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState(createEmptyPostForm)

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
        content: post.content ?? undefined,
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
    void fetchPost()
  }, [fetchPost])

  const handleSubmit = async (published: boolean) => {
    setError(null)

    const errors = validatePostForm(formData)
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
        reading_time: calculateContentSize(formData.content),
        locale: formData.locale,
        seo_title: formData.seo_title,
        seo_description: formData.seo_description,
      }

      if (published) {
        submitData.published_at = resolvePublishedAtForSubmit(published, formData.published, formData.published_at)
      }

      const res = await fetch(`/api/admin/posts/${postId}`, {
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
      window.setTimeout(() => {
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
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('删除失败')
      }

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600" />
          <p className="text-muted-foreground">加载文章中...</p>
        </div>
      </div>
    )
  }

  return (
    <PostEditorWorkspace
      mode="edit"
      formData={formData}
      setFormData={setFormData}
      saving={saving}
      error={error}
      success={success}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
    />
  )
}
