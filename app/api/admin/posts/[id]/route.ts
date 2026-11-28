import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import { updatePostSchema } from '@/lib/validation/post'
import { revalidatePostMutation } from '@/lib/revalidation/posts'
import { z } from 'zod'

const currentPostCacheStateSchema = z.object({
  public_id: z.string().nullable().optional(),
  title: z.string().optional(),
  slug: z.string(),
  content: z.unknown().optional(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  published: z.boolean(),
  updated_at: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
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
      .select('public_id, title, slug, content, description, tags, published, updated_at, metadata')
      .eq('id', id)
      .single()

    const existingPostResult = currentPostCacheStateSchema.safeParse(existingPost)

    if (!existingPostResult.success) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const previousPost = existingPostResult.data
    const existingMetadata: Record<string, unknown> = previousPost.metadata ?? {}
    const previousRevalidationState = {
      publicId: previousPost.public_id,
      slug: previousPost.slug,
      tags: previousPost.tags ?? [],
    }
    const rawBody: unknown = await request.json()
    const rawRecord =
      rawBody && typeof rawBody === 'object' ? (rawBody as Record<string, unknown>) : {}
    const expectedUpdatedAt =
      typeof rawRecord.expected_updated_at === 'string' ? rawRecord.expected_updated_at : null
    const forceOverwrite = rawRecord.force_overwrite === true
    const createSnapshot = rawRecord.create_snapshot === true

    // 乐观锁：若前端传入 expected_updated_at 且与数据库最新时间不一致，返回 409 冲突
    if (
      expectedUpdatedAt &&
      !forceOverwrite &&
      previousPost.updated_at &&
      new Date(expectedUpdatedAt).getTime() !== new Date(previousPost.updated_at).getTime()
    ) {
      return NextResponse.json(
        {
          error: '这篇文章已在其他窗口被更新，请先刷新获取最新版本或选择强制覆盖。',
          code: 'CONFLICT',
          serverUpdatedAt: previousPost.updated_at,
        },
        { status: 409 },
      )
    }

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

    const { seo_title, seo_description, metadata: incomingMetadata, ...restBody } = parsedBody.data
    const updatePayload: Record<string, unknown> = { ...restBody }

    if (seo_title !== undefined || seo_description !== undefined || incomingMetadata !== undefined) {
      const nextMetadata: Record<string, unknown> = {
        ...existingMetadata,
        ...(incomingMetadata ?? {}),
      }
      if (seo_title !== undefined) {
        if (seo_title) {
          nextMetadata.seo_title = seo_title
        } else {
          delete nextMetadata.seo_title
        }
      }
      if (seo_description !== undefined) {
        if (seo_description) {
          nextMetadata.seo_description = seo_description
        } else {
          delete nextMetadata.seo_description
        }
      }
      updatePayload.metadata = nextMetadata
    }

    // 如果发布状态从 false 变为 true，且未显式传入发布时间，则更新为当前时间
    if (restBody.published === true && previousPost.published === false && !restBody.published_at) {
      updatePayload.published_at = new Date().toISOString()
    }

    const { data, error } = await client
      .from('posts')
      .update(updatePayload as never)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating post:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 每次发布或显式请求保存快照时，尝试记录历史版本（若迁移尚未执行则静默忽略）
    if (createSnapshot || restBody.published === true) {
      try {
        await (client as unknown as {
          from: (table: string) => {
            insert: (values: Record<string, unknown>) => Promise<{ error: unknown }>
          }
        })
          .from('post_revisions')
          .insert({
            post_id: id,
            title: restBody.title ?? previousPost.title ?? '未命名草稿',
            description: restBody.description ?? previousPost.description ?? null,
            content: restBody.content ?? previousPost.content ?? null,
            note: createSnapshot ? '手动保存快照' : '发布自动快照',
          })
      } catch {
        // post_revisions table may not be migrated yet
      }
    }

    revalidatePostMutation({
      before: previousRevalidationState,
      after: {
        publicId: previousPost.public_id,
        slug: restBody.slug ?? previousPost.slug,
        tags: restBody.tags ?? previousPost.tags ?? [],
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
      .select('public_id, slug, tags, published')
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
