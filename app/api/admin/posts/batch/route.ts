import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import { revalidatePostMutation } from '@/lib/revalidation/posts'

const batchRequestSchema = z.object({
  action: z.enum(['publish', 'unpublish', 'delete']),
  ids: z.array(z.string().min(1)).min(1).max(100),
})

export async function POST(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  if (!(await validateAdminRequest(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: unknown = await request.json()
    const parsed = batchRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '请求参数不合法', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { action, ids } = parsed.data
    const client = getAdminClient(token || undefined)

    const { data: existingRows, error: fetchError } = await client
      .from('posts')
      .select('id, public_id, slug, tags, published')
      .in('id', ids)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const posts =
      (existingRows as Array<{
        id: string
        public_id: string | null
        slug: string
        tags: string[] | null
        published: boolean
      }> | null) ?? []

    if (action === 'delete') {
      const { error } = await client.from('posts').delete().in('id', ids)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      const published = action === 'publish'
      const updatePayload: Record<string, unknown> = { published }
      if (published) {
        updatePayload.published_at = new Date().toISOString()
      }
      const { error } = await client.from('posts').update(updatePayload as never).in('id', ids)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    for (const post of posts) {
      revalidatePostMutation({
        before: {
          publicId: post.public_id,
          slug: post.slug,
          tags: post.tags ?? [],
        },
        after:
          action === 'delete'
            ? undefined
            : {
                publicId: post.public_id,
                slug: post.slug,
                tags: post.tags ?? [],
              },
      })
    }

    return NextResponse.json({
      success: true,
      affectedIds: posts.map((p) => p.id),
      count: posts.length,
    })
  } catch (error) {
    console.error('POST /api/admin/posts/batch error:', error)
    return NextResponse.json({ error: '批量操作失败' }, { status: 500 })
  }
}
