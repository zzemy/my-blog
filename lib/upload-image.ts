async function maybeCompressToWebP(file: File): Promise<File> {
  if (typeof window === 'undefined') return file
  if (file.type === 'image/gif' || file.type === 'image/webp' || file.type === 'image/avif') {
    return file
  }
  if (file.size < 400 * 1024) {
    return file
  }

  try {
    const bitmap = await createImageBitmap(file)
    const maxDim = 2048
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.86),
    )
    if (!blob || blob.size >= file.size) return file

    const baseName = file.name.replace(/\.[^.]+$/, '')
    return new File([blob], `${baseName}.webp`, { type: 'image/webp' })
  } catch {
    return file
  }
}

export async function uploadImage(file: File): Promise<string | null> {
  try {
    if (!file.type.startsWith('image/')) {
      console.error('File is not an image')
      return null
    }

    const processed = await maybeCompressToWebP(file)

    if (processed.size > 5 * 1024 * 1024) {
      console.error('File size too large (max 5MB)')
      return null
    }

    const formData = new FormData()
    formData.append('file', processed)

    const response = await fetch('/api/admin/media', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Upload failed:', errorData.error)
      return null
    }

    const data = await response.json()
    return data.url
  } catch (error) {
    console.error('Failed to upload image:', error)
    return null
  }
}
