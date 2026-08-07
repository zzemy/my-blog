import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequest } from '@/lib/auth'
import { friendLinkAdminSchema } from '@/lib/validation/friend-link'

async function getAuthorizedClient(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  const ok = await validateAdminRequest(token)
  return ok ? getAdminClient(token || undefined) : null
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = await getAuthorizedClient(request)
  if (!client) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const parsed = friendLinkAdminSchema.partial().safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: '请检查表单内容', details: parsed.error.flatten() }, { status: 400 })

    const payload = {
      ...parsed.data,
      ...(parsed.data.avatar_url !== undefined ? { avatar_url: parsed.data.avatar_url || null } : {}),
      ...(parsed.data.note !== undefined ? { note: parsed.data.note || null } : {}),
      ...(parsed.data.contact !== undefined ? { contact: parsed.data.contact || null } : {}),
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await client.from('friend_links').update(payload as never).eq('id', id).select().single()
    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ error: '友链不存在' }, { status: 404 })
      throw error
    }
    return NextResponse.json({ link: data })
  } catch (error) {
    console.error('Error updating friend link:', error)
    return NextResponse.json({ error: '友链更新失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = await getAuthorizedClient(request)
  if (!client) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const { error } = await client.from('friend_links').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting friend link:', error)
    return NextResponse.json({ error: '友链删除失败' }, { status: 500 })
  }
}
