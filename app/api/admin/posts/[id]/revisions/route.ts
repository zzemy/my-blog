import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'

type RevisionRow = {
  id: string
  post_id: string
  title: string
  description: string | null
  content: unknown
  note: string | null
  created_at: string
}

export async function GET(
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
    const { data, error } = await (client as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            order: (col: string, opts: { ascending: boolean }) => {
              limit: (n: number) => Promise<{ data: RevisionRow[] | null; error: { code?: string; message?: string } | null }>
            }
          }
        }
      }
    })
      .from('post_revisions')
      .select('id, post_id, title, description, content, note, created_at')
      .eq('post_id', id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ revisions: [], migrationRequired: true })
      }
      return NextResponse.json({ error: error.message || '加载历史版本失败' }, { status: 500 })
    }

    return NextResponse.json({ revisions: data ?? [], migrationRequired: false })
  } catch (error) {
    console.error('GET /api/admin/posts/[id]/revisions error:', error)
    return NextResponse.json({ error: '加载历史版本失败' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = getAuthTokenFromRequest(request)
  if (!(await validateAdminRequest(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as {
      title?: string
      description?: string
      content?: unknown
      note?: string
    }

    const client = getAdminClient(token || undefined)
    const { data, error } = await (client as unknown as {
      from: (table: string) => {
        insert: (values: Record<string, unknown>) => {
          select: () => {
            single: () => Promise<{ data: RevisionRow | null; error: { code?: string; message?: string } | null }>
          }
        }
      }
    })
      .from('post_revisions')
      .insert({
        post_id: id,
        title: body.title?.trim() || '未命名草稿',
        description: body.description?.trim() || null,
        content: body.content ?? null,
        note: body.note?.trim() || '手动保存快照',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: '尚未执行 post_revisions 数据库迁移脚本', code: 'MIGRATION_REQUIRED' },
          { status: 400 },
        )
      }
      return NextResponse.json({ error: error.message || '保存快照失败' }, { status: 500 })
    }

    return NextResponse.json({ revision: data }, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/posts/[id]/revisions error:', error)
    return NextResponse.json({ error: '保存快照失败' }, { status: 500 })
  }
}
