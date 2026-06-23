import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import { updatePostSchema } from '@/lib/validation/post'
import { revalidatePostMutation } from '@/lib/revalidation/posts'
import { z } from 'zod'

const currentPostPublishStateSchema = z.object({
  published: z.boolean(),
})

const currentPostCacheStateSchema = z.object({
  locale: z.string(),
  public_id: z.string().nullable().optional(),
  slug: z.string(),
  tags: z.array(z.string()).nullable().optional(),
  published: z.boolean(),
})

// GET - 获取单个文章（需要认证）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getAuthTokenFromRequest(request)
  const ok = await validateAdminRequest(token)
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id } = await params
    const client = getAdminClient(token || undefined)

    const { data, error } = await client.from('posts').select('*').eq('id', id).single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      console.error('Error fetching post:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: data })
  } catch (error) {
    console.error('Error in GET /api/admin/posts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - 更新文章（需要认证）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getAuthTokenFromRequest(request)
  const ok = await validateAdminRequest(token)
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id } = await params
    const client = getAdminClient(token || undefined)
    const { data: existingPost } = await client
      .from('posts')
      .select('locale, public_id, slug, tags, published')
      .eq('id', id)
      .single()

    const existingPostResult = currentPostCacheStateSchema.safeParse(existingPost)

    if (!existingPostResult.success) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const previousPost = existingPostResult.data
    const previousRevalidationState = {
      locale: previousPost.locale,
      publicId: previousPost.public_id,
      slug: previousPost.slug,
      tags: previousPost.tags ?? [],
    }
    const rawBody: unknown = await request.json()
    const parsedBody = updatePostSchema.safeParse(rawBody)

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      )
    }

    const body = parsedBody.data

    // 如果发布状态从 false 变为 true，且未显式传入发布时间，则更新为当前时间
    if (body.published === true) {
      const { data: currentPost } = await client
        .from('posts')
        .select('published')
        .eq('id', id)
        .single()

      const currentPostResult = currentPostPublishStateSchema.safeParse(currentPost)

      if (currentPostResult.success && currentPostResult.data.published === false) {
        if (!body.published_at) {
          body.published_at = new Date().toISOString()
        }
      }
    }

    const { data, error } = await client
      .from('posts')
      .update(body as never)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating post:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    revalidatePostMutation({
      before: previousRevalidationState,
      after: {
        locale: body.locale ?? previousPost.locale,
        publicId: previousPost.public_id,
        slug: body.slug ?? previousPost.slug,
        tags: body.tags ?? previousPost.tags ?? [],
      },
    })

    return NextResponse.json({ post: data })
  } catch (error) {
    console.error('Error in PUT /api/admin/posts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 删除文章（需要认证）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getAuthTokenFromRequest(request)
  const ok = await validateAdminRequest(token)
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { id } = await params
    const client = getAdminClient(token || undefined)

    const { data: existingPost } = await client
      .from('posts')
      .select('locale, public_id, slug, tags, published')
      .eq('id', id)
      .single()

    const existingPostResult = currentPostCacheStateSchema.safeParse(existingPost)

    if (!existingPostResult.success) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const { error } = await client.from('posts').delete().eq('id', id)

    if (error) {
      console.error('Error deleting post:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    revalidatePostMutation({
      before: {
        locale: existingPostResult.data.locale,
        publicId: existingPostResult.data.public_id,
        slug: existingPostResult.data.slug,
        tags: existingPostResult.data.tags ?? [],
      },
    })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/posts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
