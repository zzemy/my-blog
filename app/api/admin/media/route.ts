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

export async function GET(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  const ok = await validateAdminRequest(token)
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const client = getAdminClient(token || undefined)

    // 检查某张图片被哪些文章引用（删除前防误删保护）
    const checkRef = searchParams.get('checkRef')?.trim()
    if (checkRef) {
      if (
        checkRef.includes('..') ||
        checkRef.includes('/') ||
        checkRef.includes('\\') ||
        !SAFE_FILENAME_REGEX.test(checkRef)
      ) {
        return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
      }
      const { data: postsData } = await client
        .from('posts')
        .select('id, title, cover_image, content')
      const rows = (postsData as Array<{
        id: string
        title: string
        cover_image: string | null
        content: unknown
      }> | null) ?? []

      const usedBy = rows
        .filter((post) => {
          if (post.cover_image?.includes(checkRef)) return true
          try {
            return JSON.stringify(post.content ?? '').includes(checkRef)
          } catch {
            return false
          }
        })
        .map((post) => ({ id: post.id, title: post.title }))

      return NextResponse.json({ filename: checkRef, usedBy })
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

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${mappedExt}`
    const filePath = `uploads/${fileName}`

    const client = getAdminClient(token || undefined)
    const { error } = await client.storage.from('images').upload(filePath, file, {
      contentType: mimeType,
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
