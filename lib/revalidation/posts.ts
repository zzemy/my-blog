import { revalidatePath } from 'next/cache'

type RevalidatePostInput = {
  publicId?: string | null
  slug?: string | null
  tags?: string[] | null
}

function normalizeTags(tags: string[] | null | undefined) {
  return Array.from(new Set((tags ?? []).filter(Boolean)))
}

function revalidateIndexPaths() {
  revalidatePath('/')
  revalidatePath('/posts')
  revalidatePath('/tags')
}

export function revalidateSearchData() {
  revalidatePath('/api/search')
}

export function revalidatePostPaths(post: RevalidatePostInput) {
  revalidateIndexPaths()

  if (post.slug === 'about') {
    revalidatePath('/about')
  } else {
    if (post.publicId) {
      revalidatePath(`/posts/${post.publicId}`)
    }

    if (post.slug) {
      revalidatePath(`/posts/${post.slug}`)
    }
  }

  for (const tag of normalizeTags(post.tags)) {
    revalidatePath(`/tags/${encodeURIComponent(tag)}`)
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
