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
    published_at: '',
    seo_title: '',
    seo_description: '',
  }
}

export function generatePostSlug(title: string) {
  const normalizedTitle = title.trim()
  if (!normalizedTitle) return ''

  return `p-${hashTitleToBase36(normalizedTitle)}`
}

function hashTitleToBase36(value: string) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(36).padStart(7, '0').slice(0, 7)
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
