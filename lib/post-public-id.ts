const POST_PUBLIC_ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const POST_PUBLIC_ID_LENGTH = 7

export function generatePostPublicId() {
  const bytes = new Uint8Array(POST_PUBLIC_ID_LENGTH)
  crypto.getRandomValues(bytes)

  return Array.from(bytes, (byte) => POST_PUBLIC_ID_ALPHABET[byte % POST_PUBLIC_ID_ALPHABET.length]).join('')
}

export function getPostRouteId(post: { publicId?: string | null; slug: string }) {
  return post.publicId || post.slug
}

