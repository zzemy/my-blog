import { supabase } from '@/lib/supabase/client'
import type { FriendLink } from '@/lib/supabase/types'
import { isExpectedSupabaseBuildError, logExpectedSupabaseBuildErrorOnce } from '@/lib/supabase/error-utils'

export type FriendLinkStatus = FriendLink['status']

export async function getApprovedFriendLinks(): Promise<FriendLink[]> {
  try {
    const { data, error } = await supabase
      .from('friend_links')
      .select('*')
      .eq('status', 'approved')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error?.code === '42703') {
      // Keep existing installations readable until the workflow migration is applied.
      const legacy = await supabase
        .from('friend_links')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (legacy.error) throw legacy.error
      const legacyLinks = (legacy.data ?? []) as Array<{
        id: string
        name: string
        url: string
        avatar_url: string | null
        description: string | null
        sort_order: number
        created_at: string
        updated_at?: string | null
      }>

      return legacyLinks.map((link) => ({
        id: link.id,
        name: link.name,
        url: link.url,
        avatar_url: link.avatar_url,
        description: link.description,
        sort_order: link.sort_order,
        created_at: link.created_at,
        note: null,
        contact: null,
        status: 'approved' as const,
        updated_at: link.updated_at ?? link.created_at,
      })) as FriendLink[]
    }
    if (error) throw error
    return (data ?? []) as FriendLink[]
  } catch (error) {
    if (isExpectedSupabaseBuildError(error)) {
      logExpectedSupabaseBuildErrorOnce(
        'get-approved-friend-links-build-fallback',
        'Using empty friend link list because Supabase is unavailable in this environment:',
        error,
      )
    } else {
      console.error('Error fetching friend links:', error)
    }
    return []
  }
}
