import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'

type StorageListFile = {
  name: string
  id?: string
  updated_at?: string
  created_at?: string
  last_accessed_at?: string
  metadata?: Record<string, unknown>
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}
const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9._-]+$/

function detectImageSignature(bytes: Uint8Array): { mime: string; ext: string } | null {
  if (bytes.length < 12) return null

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' }
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: 'png' }
  }
  // GIF: GIF87a / GIF89a
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return { mime: 'image/gif', ext: 'gif' }
  }
  // WebP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: 'webp' }
  }
  // AVIF: ....ftypavif / ....ftypavis
  if (
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70 &&
    bytes[8] === 0x61 &&
    bytes[9] === 0x76 &&
    bytes[10] === 0x69 &&
    (bytes[11] === 0x66 || bytes[11] === 0x73)
  ) {
    return { mime: 'image/avif', ext: 'avif' }
  }

  return null
}

function isSafeFilename(name: string): boolean {
  return (
    Boolean(name) &&
    !name.includes('..') &&
    !name.includes('/') &&
    !name.includes('\\') &&
    SAFE_FILENAME_REGEX.test(name)
  )
}

export async function GET(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  const ok = await validateAdminRequest(token)
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const client = getAdminClient(token || undefined)

    // 检查单张或多张图片被哪些文章/译文引用（删除前防误删保护）
    const checkRef = searchParams.get('checkRef')?.trim()
    const checkRefsParam = searchParams.get('checkRefs')?.trim()
    if (checkRef || checkRefsParam) {
      const targets = checkRef
        ? [checkRef]
        : (checkRefsParam || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 50)

      if (targets.length === 0 || targets.some((name) => !isSafeFilename(name))) {
        return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
      }

      const [{ data: postsData }, { data: translationsData }] = await Promise.all([
        client.from('posts').select('id, title, cover_image, content'),
        client.from('post_translations').select('post_id, locale, title, content'),
      ])

      const postRows = (postsData as Array<{
        id: string
        title: string
        cover_image: string | null
        content: unknown
      }> | null) ?? []

      const translationRows = (translationsData as Array<{
        post_id: string
        locale: string
        title: string
        content: unknown
      }> | null) ?? []

      const serializedPosts = postRows.map((post) => ({
        id: post.id,
        title: post.title,
        haystack: `${post.cover_image ?? ''}\n${(() => {
          try {
            return JSON.stringify(post.content ?? '')
          } catch {
            return ''
          }
        })()}`,
      }))

      const serializedTranslations = translationRows.map((row) => ({
        id: row.post_id,
        title: `${row.title} (${row.locale})`,
        haystack: (() => {
          try {
            return JSON.stringify(row.content ?? '')
          } catch {
            return ''
          }
        })(),
      }))

      const findRefs = (filename: string) => {
        const seen = new Map<string, { id: string; title: string }>()
        for (const post of serializedPosts) {
          if (post.haystack.includes(filename)) {
            seen.set(post.id, { id: post.id, title: post.title })
          }
        }
        for (const tr of serializedTranslations) {
          if (tr.haystack.includes(filename) && !seen.has(`${tr.id}:${tr.title}`)) {
            seen.set(`${tr.id}:${tr.title}`, { id: tr.id, title: tr.title })
          }
        }
        return Array.from(seen.values())
      }

      if (checkRef) {
        return NextResponse.json({ filename: checkRef, usedBy: findRefs(checkRef) })
      }

      const references: Record<string, Array<{ id: string; title: string }>> = {}
      for (const name of targets) {
        const usedBy = findRefs(name)
        if (usedBy.length > 0) {
          references[name] = usedBy
        }
      }
      return NextResponse.json({ references })
    }

    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 60), 1), 100)
    const offset = Math.max(Number(searchParams.get('offset') || 0), 0)

    const { data, error } = await client.storage.from('images').list('uploads', {
      limit: limit + 1,
      offset,
      sortBy: { column: 'created_at', order: 'desc' },
    })

    if (error) {
      throw error
    }

    const rawList = (data as StorageListFile[]) ?? []
    const hasMore = rawList.length > limit
    const pageSlice = hasMore ? rawList.slice(0, limit) : rawList

    const files = pageSlice.map((file) => {
      const {
        data: { publicUrl },
      } = client.storage.from('images').getPublicUrl(`uploads/${file.name}`)

      return {
        name: file.name,
        id: file.id,
        updated_at: file.updated_at,
        created_at: file.created_at,
        last_accessed_at: file.last_accessed_at,
        metadata: file.metadata,
        url: publicUrl,
      }
    })

    return NextResponse.json({ files, hasMore, nextOffset: offset + files.length })
  } catch (error) {
    console.error('Error listing images:', error)
    return NextResponse.json({ error: 'Failed to list images' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  const ok = await validateAdminRequest(token)
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '请选择要上传的图片文件' }, { status: 400 })
    }

    const mimeType = (file.type || '').toLowerCase()
    const mappedExt = ALLOWED_IMAGE_MIME_TO_EXT[mimeType]
    if (!mappedExt) {
      return NextResponse.json(
        { error: '仅支持上传 JPG、PNG、WebP、GIF、AVIF 格式图片' },
        { status: 400 },
      )
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: '图片大小不能超过 5MB' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const detected = detectImageSignature(bytes)
    if (!detected) {
      return NextResponse.json(
        { error: '文件内容校验失败：仅允许上传真实的 JPG、PNG、WebP、GIF 或 AVIF 图片' },
        { status: 400 },
      )
    }

    const finalMime = detected.mime
    const finalExt = detected.ext
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${finalExt}`
    const filePath = `uploads/${fileName}`

    const client = getAdminClient(token || undefined)
    const { error } = await client.storage.from('images').upload(filePath, bytes, {
      contentType: finalMime,
      cacheControl: '31536000',
      upsert: false,
    })

    if (error) {
      throw error
    }

    const {
      data: { publicUrl },
    } = client.storage.from('images').getPublicUrl(filePath)

    return NextResponse.json({ url: publicUrl, name: fileName })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  const ok = await validateAdminRequest(token)
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')?.trim()

    if (
      !filename ||
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\') ||
      !SAFE_FILENAME_REGEX.test(filename)
    ) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    const client = getAdminClient(token || undefined)
    const { error } = await client.storage.from('images').remove([`uploads/${filename}`])

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
