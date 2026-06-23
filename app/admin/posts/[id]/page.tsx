'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { PostEditorWorkspace } from '@/features/admin/posts/post-editor-workspace'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  calculateContentSize,
  createEmptyPostForm,
  resolvePublishedAtForSubmit,
  validatePostForm,
} from '@/features/admin/posts/form-utils'
import type { PostFormData } from '@/features/admin/posts/types'
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
  const [savedSnapshot, setSavedSnapshot] = useState(() => serializePostForm(createEmptyPostForm()))
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const currentSnapshot = serializePostForm(formData)
  const isDirty = currentSnapshot !== savedSnapshot

  const setEditorFormData: Dispatch<SetStateAction<PostFormData>> = (value) => {
    setFormData((current) => {
      const next = typeof value === 'function' ? value(current) : value
      if (serializePostForm(next) !== serializePostForm(current)) {
        setSuccess(false)
      }
      return next
    })
  }

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/posts/${postId}`)

      if (!res.ok) {
        throw new Error('获取文章失败')
      }

      const result = await res.json()
      const post = result.post

      const nextFormData = {
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
        published_at: post.published_at ? isoToLocalInput(post.published_at) : '',
      }

      setFormData(nextFormData)
      setSavedSnapshot(serializePostForm(nextFormData))
      setSuccess(false)
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
      const submittedFormData: PostFormData = {
        ...formData,
        published,
        published_at: resolvePublishedAtForSubmit(published, formData.published, formData.published_at) ?? '',
      }
      const submitData: Record<string, unknown> = {
        title: submittedFormData.title,
        slug: submittedFormData.slug,
        description: submittedFormData.description,
        cover_image: submittedFormData.cover_image,
        tags: submittedFormData.tags,
        content: submittedFormData.content,
        published,
        featured: submittedFormData.featured,
        reading_time: calculateContentSize(submittedFormData.content),
        seo_title: submittedFormData.seo_title,
        seo_description: submittedFormData.seo_description,
      }

      if (published) {
        submitData.published_at = submittedFormData.published_at
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

      setFormData(submittedFormData)
      setSavedSnapshot(serializePostForm(submittedFormData))
      setSuccess(true)
    } catch (err) {
      console.error('Failed to save post:', err)
      setError(err instanceof Error ? err.message : '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
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
    <>
      <PostEditorWorkspace
        mode="edit"
        formData={formData}
        setFormData={setEditorFormData}
        isDirty={isDirty}
        saving={saving}
        error={error}
        success={success}
        onSubmit={handleSubmit}
        onDelete={() => setDeleteDialogOpen(true)}
      />
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除文章</DialogTitle>
            <DialogDescription>确定要删除这篇文章吗？此操作不能撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setDeleteDialogOpen(false)
                void handleDelete()
              }}
              disabled={saving}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function serializePostForm(formData: PostFormData) {
  return JSON.stringify(formData)
}
