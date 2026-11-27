import { NextRequest, NextResponse } from 'next/server'
import type { JSONContent } from '@tiptap/react'
import { z } from 'zod'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import { revalidatePostMutation } from '@/lib/revalidation/posts'

const updateTranslationSchema = z.object({
  title: z.string().trim().min(1, '标题不能为空').max(300).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  content: z
    .custom<JSONContent>((val) => typeof val === 'object' && val !== null, {
      message: '正文必须为合法的 TipTap JSON',
    })
    .optional(),
  ai_summary: z.record(z.string(), z.unknown()).nullable().optional(),
  published: z.boolean().optional(),
})

async function revalidateRelatedPost(
  client: ReturnType<typeof getAdminClient>,
  postId: string,
) {
  const { data } = await client
    .from('posts')
    .select('public_id, slug, tags')
    .eq('id', postId)
    .maybeSingle()

  const post = data as { public_id: string | null; slug: string; tags: string[] | null } | null
  if (post) {
    revalidatePostMutation({
      after: {
        publicId: post.public_id,
        slug: post.slug,
        tags: post.tags ?? [],
      },
    })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = getAuthTokenFromRequest(request)
  if (!(await validateAdminRequest(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const rawBody: unknown = await request.json()
    const parsed = updateTranslationSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '请求参数无效', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const client = getAdminClient(token || undefined)
    const { data, error } = await client
      .from('post_translations')
      .update(parsed.data as never)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '译文不存在' }, { status: 404 })
      }
      throw error
    }

    const updated = data as { post_id: string }
    await revalidateRelatedPost(client, updated.post_id)

    return NextResponse.json({ translation: data })
  } catch (error) {
    console.error('PUT /api/admin/ai/translations/[id] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新译文失败' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = getAuthTokenFromRequest(request)
  if (!(await validateAdminRequest(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const client = getAdminClient(token || undefined)

    const { data: existing } = await client
      .from('post_translations')
      .select('post_id')
      .eq('id', id)
      .maybeSingle()

    const { error } = await client.from('post_translations').delete().eq('id', id)
    if (error) throw error

    const row = existing as { post_id: string } | null
    if (row?.post_id) {
      await revalidateRelatedPost(client, row.post_id)
    }

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('DELETE /api/admin/ai/translations/[id] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除译文失败' },
      { status: 500 },
    )
  }
}
