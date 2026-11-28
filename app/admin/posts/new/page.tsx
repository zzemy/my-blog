'use client'

import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { PostEditorWorkspace } from '@/features/admin/posts/post-editor-workspace'
import {
  calculateContentSize,
  clearLocalDraft,
  createEmptyPostForm,
  generatePostSlug,
  resolvePublishedAtForSubmit,
  validatePostForm,
} from '@/features/admin/posts/form-utils'
import type { PostFormData } from '@/features/admin/posts/types'
import { isoToLocalInput } from '@/features/admin/posts/utils'

export default function NewPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [formData, setFormData] = useState(createEmptyPostForm)
  const [savedSnapshot, setSavedSnapshot] = useState(() => serializePostForm(createEmptyPostForm()))

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

  const handleSubmit = async (published: boolean) => {
    setError(null)

    const effectiveSlug =
      formData.slug.trim() || (!published && formData.title.trim() ? generatePostSlug(formData.title) : '')
    const effectiveContent = formData.content ?? { type: 'doc', content: [{ type: 'paragraph' }] }
    const normalizedForm: PostFormData = {
      ...formData,
      slug: effectiveSlug,
      content: effectiveContent,
    }

    const errors = validatePostForm(normalizedForm, { requirePublishFields: published })
    if (errors.length > 0) {
      setError(errors.join('，'))
      return
    }

    setSaving(true)
    try {
      const resolvedPublishedAtIso = resolvePublishedAtForSubmit(
        published,
        normalizedForm.published_at,
      )
      const submittedFormData: PostFormData = {
        ...normalizedForm,
        published,
        published_at: resolvedPublishedAtIso ? isoToLocalInput(resolvedPublishedAtIso) : normalizedForm.published_at,
      }

      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...submittedFormData,
          published_at: published ? resolvedPublishedAtIso : null,
          reading_time: calculateContentSize(submittedFormData.content),
          metadata: submittedFormData.ai_summary ? { ai_summary: submittedFormData.ai_summary } : {},
        }),
      })

      if (!res.ok) {
        const result = await res.json().catch(() => ({}))
        throw new Error(result.error || '保存失败')
      }

      const result: unknown = await res.json()
      const createdPostId = getCreatedPostId(result)

      clearLocalDraft('new')
      setFormData(submittedFormData)
      setSavedSnapshot(serializePostForm(submittedFormData))
      setLastSavedAt(new Date().toISOString())
      setSuccess(true)
      toast.success(published ? '文章已发布' : '草稿已保存')

      if (createdPostId) {
        router.replace(`/admin/posts/${createdPostId}`)
      }
    } catch (err) {
      console.error('Failed to save post:', err)
      setError(err instanceof Error ? err.message : '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PostEditorWorkspace
      mode="new"
      draftKey="new"
      formData={formData}
      setFormData={setEditorFormData}
      isDirty={isDirty}
      saving={saving}
      error={error}
      onDismissError={() => setError(null)}
      success={success}
      lastSavedAt={lastSavedAt}
      onSubmit={handleSubmit}
    />
  )
}

function serializePostForm(formData: PostFormData) {
  return JSON.stringify(formData)
}

function getCreatedPostId(value: unknown) {
  if (!isRecord(value) || !isRecord(value.post)) return null
  return typeof value.post.id === 'string' ? value.post.id : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
