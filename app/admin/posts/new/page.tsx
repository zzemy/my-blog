'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { PostEditorWorkspace } from '@/features/admin/posts/post-editor-workspace'
import {
  calculateContentSize,
  createEmptyPostForm,
  resolvePublishedAtForSubmit,
  validatePostForm,
} from '@/features/admin/posts/form-utils'

export default function NewPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState(createEmptyPostForm)

  const handleSubmit = async (published: boolean) => {
    setError(null)

    const errors = validatePostForm(formData)
    if (errors.length > 0) {
      setError(errors.join('，'))
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          reading_time: calculateContentSize(formData.content),
          published,
          published_at: resolvePublishedAtForSubmit(published, formData.published, formData.published_at),
        }),
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

  return (
    <PostEditorWorkspace
      mode="new"
      formData={formData}
      setFormData={setFormData}
      saving={saving}
      error={error}
      success={success}
      onSubmit={handleSubmit}
    />
  )
}
