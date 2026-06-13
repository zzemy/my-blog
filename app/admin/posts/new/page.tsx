'use client'

import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useRouter } from 'next/navigation'

import { PostEditorWorkspace } from '@/features/admin/posts/post-editor-workspace'
import {
  calculateContentSize,
  createEmptyPostForm,
  resolvePublishedAtForSubmit,
  validatePostForm,
} from '@/features/admin/posts/form-utils'
import type { PostFormData } from '@/features/admin/posts/types'

export default function NewPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
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

      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...submittedFormData,
          reading_time: calculateContentSize(formData.content),
        }),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || '保存失败')
      }

      setFormData(submittedFormData)
      setSavedSnapshot(serializePostForm(submittedFormData))
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
      setFormData={setEditorFormData}
      isDirty={isDirty}
      saving={saving}
      error={error}
      success={success}
      onSubmit={handleSubmit}
    />
  )
}

function serializePostForm(formData: PostFormData) {
  return JSON.stringify(formData)
}
