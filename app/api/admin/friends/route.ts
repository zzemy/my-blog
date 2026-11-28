import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAdminClient } from '@/lib/supabase/client'
import { getAuthTokenFromRequest, validateAdminRequestWithReason } from '@/lib/auth'
import { friendLinkAdminSchema } from '@/lib/validation/friend-link'

const STATUS_PRIORITY: Record<string, number> = {
  pending: 0,
  approved: 1,
  rejected: 2,
}

async function authorize(request: NextRequest) {
  const token = getAuthTokenFromRequest(request)
  const auth = await validateAdminRequestWithReason(token)
  return { token, auth }
}

export async function GET(request: NextRequest) {
  const { token, auth } = await authorize(request)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized', reason: auth.reason }, { status: 401 })

  try {
    const client = getAdminClient(token || undefined)
    const { data, error } = await client
      .from('friend_links')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) throw error
    const links = ((data ?? []) as Array<{ status?: string }>).sort(
      (a, b) => (STATUS_PRIORITY[a.status ?? ''] ?? 9) - (STATUS_PRIORITY[b.status ?? ''] ?? 9),
    )
    return NextResponse.json({ links })
  } catch (error) {
    console.error('Error fetching admin friend links:', error)
    return NextResponse.json({ error: '友链加载失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { token, auth } = await authorize(request)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized', reason: auth.reason }, { status: 401 })

  try {
    const parsed = friendLinkAdminSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: '请检查表单内容', details: parsed.error.flatten() }, { status: 400 })

    const client = getAdminClient(token || undefined)
    const { data, error } = await client
      .from('friend_links')
      .insert({ ...parsed.data, avatar_url: parsed.data.avatar_url || null, description: parsed.data.description || null, note: parsed.data.note || null, contact: parsed.data.contact || null } as never)
      .select()
      .single()
    if (error) throw error
    revalidatePath('/friends')
    return NextResponse.json({ link: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating admin friend link:', error)
    return NextResponse.json({ error: '友链创建失败' }, { status: 500 })
  }
}
