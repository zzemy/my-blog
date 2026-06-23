import { revalidatePath } from 'next/cache'

export function revalidateSiteSettings() {
  revalidatePath('/')
  revalidatePath('/about')
  revalidatePath('/posts')
  revalidatePath('/tags')

  revalidatePath('/opengraph-image')
  revalidatePath('/icon')
  revalidatePath('/sitemap.xml')
}
