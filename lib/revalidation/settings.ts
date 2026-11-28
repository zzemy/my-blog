import { revalidatePath } from 'next/cache'

export function revalidateSiteSettings() {
  revalidatePath('/', 'layout')
  revalidatePath('/')
  revalidatePath('/about')
  revalidatePath('/posts')
  revalidatePath('/tags')
  revalidatePath('/friends')
  revalidatePath('/guestbook')
  revalidatePath('/opengraph-image')
  revalidatePath('/icon')
  revalidatePath('/sitemap.xml')
  revalidatePath('/rss.xml')
  revalidatePath('/atom.xml')
  revalidatePath('/rss.json')
}
