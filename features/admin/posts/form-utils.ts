import type { PostFormData } from './types'

const DRAFT_STORAGE_PREFIX = 'admin-post-draft:'

export type LocalDraftSnapshot = {
  formData: PostFormData
  savedAt: string
}

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

export function calculateContentSize(content: PostFormData['content']): number {
  if (!content) return 0
  if (typeof content === 'string') {
    return countVisibleCharacters(content)
  }

  const fragments: string[] = []
  collectTextFragments(content, fragments)
  return countVisibleCharacters(fragments.join(' '))
}

export function estimateReadingMinutes(characterCount: number): number {
  if (characterCount <= 0) return 0
  return Math.max(1, Math.ceil(characterCount / 350))
}

export function hasMeaningfulContent(content: PostFormData['content']): boolean {
  if (!content) return false
  if (calculateContentSize(content) > 0) return true
  return hasNonTextMediaOrBlock(content)
}

export function validatePostForm(formData: PostFormData) {
  const errors: string[] = []

  if (!formData.title.trim()) errors.push('标题不能为空')
  if (!formData.slug.trim()) errors.push('URL Slug 不能为空')
  if (!hasMeaningfulContent(formData.content)) errors.push('内容不能为空')
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

export function saveLocalDraft(scope: string, formData: PostFormData) {
  if (typeof window === 'undefined' || !scope) return

  try {
    const payload: LocalDraftSnapshot = {
      formData,
      savedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(`${DRAFT_STORAGE_PREFIX}${scope}`, JSON.stringify(payload))
  } catch {
    // Ignore storage quota / private mode failures
  }
}

export function loadLocalDraft(scope: string): LocalDraftSnapshot | null {
  if (typeof window === 'undefined' || !scope) return null

  try {
    const raw = window.localStorage.getItem(`${DRAFT_STORAGE_PREFIX}${scope}`)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || !isRecord(parsed.formData) || typeof parsed.savedAt !== 'string') {
      return null
    }

    const base = createEmptyPostForm()
    const rawForm = parsed.formData
    const formData: PostFormData = {
      title: typeof rawForm.title === 'string' ? rawForm.title : base.title,
      slug: typeof rawForm.slug === 'string' ? rawForm.slug : base.slug,
      description: typeof rawForm.description === 'string' ? rawForm.description : base.description,
      cover_image: typeof rawForm.cover_image === 'string' ? rawForm.cover_image : base.cover_image,
      tags: Array.isArray(rawForm.tags) ? rawForm.tags.filter((item): item is string => typeof item === 'string') : [],
      content: rawForm.content as PostFormData['content'],
      published: typeof rawForm.published === 'boolean' ? rawForm.published : base.published,
      featured: typeof rawForm.featured === 'boolean' ? rawForm.featured : base.featured,
      reading_time: typeof rawForm.reading_time === 'number' ? rawForm.reading_time : base.reading_time,
      published_at: typeof rawForm.published_at === 'string' ? rawForm.published_at : base.published_at,
      seo_title: typeof rawForm.seo_title === 'string' ? rawForm.seo_title : base.seo_title,
      seo_description: typeof rawForm.seo_description === 'string' ? rawForm.seo_description : base.seo_description,
    }

    return { formData, savedAt: parsed.savedAt }
  } catch {
    return null
  }
}

export function clearLocalDraft(scope: string) {
  if (typeof window === 'undefined' || !scope) return

  try {
    window.localStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${scope}`)
  } catch {
    // Ignore storage errors
  }
}

function countVisibleCharacters(text: string): number {
  return text.replace(/\s+/g, '').length
}

function collectTextFragments(value: unknown, output: string[]) {
  if (!isRecord(value)) return

  if (typeof value.text === 'string' && value.text.trim()) {
    output.push(value.text)
  }

  if (isRecord(value.attrs)) {
    const attrs = value.attrs
    for (const key of ['title', 'text', 'label', 'caption', 'eyebrow', 'start', 'question', 'yes', 'no', 'end']) {
      const candidate = attrs[key]
      if (typeof candidate === 'string' && candidate.trim()) {
        output.push(candidate)
      }
    }

    for (const listKey of ['panels', 'items', 'cards']) {
      const list = attrs[listKey]
      if (!Array.isArray(list)) continue
      for (const entry of list) {
        if (!isRecord(entry)) continue
        for (const field of ['title', 'text', 'label', 'eyebrow']) {
          if (typeof entry[field] === 'string' && entry[field].trim()) {
            output.push(entry[field])
          }
        }
      }
    }
  }

  if (Array.isArray(value.content)) {
    for (const child of value.content) {
      collectTextFragments(child, output)
    }
  }
}

const NON_TEXT_MEDIA_NODES = new Set([
  'image',
  'horizontalRule',
  'articleGallery',
  'articleSlider',
  'articleEmbed',
  'articleAudio',
  'articleCallout',
  'articleButton',
  'articleTabs',
  'articleAccordion',
  'articleFlow',
  'articleCards',
  'articleDiagram',
  'articleTimeline',
  'articleRichShowcase',
])

function hasNonTextMediaOrBlock(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (typeof value.type === 'string' && NON_TEXT_MEDIA_NODES.has(value.type)) {
    return true
  }
  if (Array.isArray(value.content)) {
    return value.content.some((child) => hasNonTextMediaOrBlock(child))
  }
  return false
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
