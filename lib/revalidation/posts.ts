import { revalidatePath } from 'next/cache'

type RevalidatePostInput = {
  locale?: string | null
  publicId?: string | null
  slug?: string | null
  tags?: string[] | null
}

function normalizeTags(tags: string[] | null | undefined) {
  return Array.from(new Set((tags ?? []).filter(Boolean)))
}

function normalizeLocale(locale: string | null | undefined) {
  return locale ?? 'zh'
}

function revalidateLocaleIndexPaths(locale: string) {
  revalidatePath(`/${locale}`)
  revalidatePath(`/${locale}/posts`)
  revalidatePath(`/${locale}/tags`)
}

export function revalidateSearchData() {
  revalidatePath('/api/search')
}

export function revalidatePostPaths(post: RevalidatePostInput) {
  const locale = normalizeLocale(post.locale)
  revalidateLocaleIndexPaths(locale)

  if (post.slug === 'about') {
    revalidatePath(`/${locale}/about`)
  } else {
    if (post.publicId) {
      revalidatePath(`/${locale}/posts/${post.publicId}`)
    }

    if (post.slug) {
      revalidatePath(`/${locale}/posts/${post.slug}`)
    }
  }

  for (const tag of normalizeTags(post.tags)) {
    revalidatePath(`/${locale}/tags/${encodeURIComponent(tag)}`)
  }
}

export function revalidatePostMutation(options: {
  before?: RevalidatePostInput | null
  after?: RevalidatePostInput | null
}) {
  if (options.before) {
    revalidatePostPaths(options.before)
  }

  if (options.after) {
    revalidatePostPaths(options.after)
  }

  revalidateSearchData()
}
