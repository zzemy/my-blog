import { pinyin } from 'pinyin-pro'

import type { PostFormData } from './types'

export function createEmptyPostForm(): PostFormData {
  return {
    title: '',
    slug: '',
    description: '',
    cover_image: '',
    tags: [],
    content: undefined,
    published: false,
    featured: false,
    reading_time: 0,
    locale: 'zh',
    published_at: '',
    seo_title: '',
    seo_description: '',
  }
}

export function generatePostSlug(title: string) {
  return pinyin(title, {
    toneType: 'none',
    type: 'array',
    v: true,
  })
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
}

export function calculateContentSize(content: PostFormData['content']) {
  if (!content) return 0

  return JSON.stringify(content).length
}

export function validatePostForm(formData: PostFormData) {
  const errors: string[] = []

  if (!formData.title.trim()) errors.push('标题不能为空')
  if (!formData.slug.trim()) errors.push('URL Slug 不能为空')
  if (!formData.content) errors.push('内容不能为空')
  if (formData.tags.length === 0) errors.push('至少需要一个标签')

  return errors
}

export function resolvePublishedAtForSubmit(
  published: boolean,
  scheduleEnabled: boolean,
  localPublishedAt: string,
) {
  if (!published) return null

  return scheduleEnabled && localPublishedAt
    ? new Date(localPublishedAt).toISOString()
    : new Date().toISOString()
}
