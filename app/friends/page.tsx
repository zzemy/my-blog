import type { Metadata } from 'next'

import { getApprovedFriendLinks } from '@/lib/supabase/friend-links'
import { FriendLinksView } from '@/features/friends/friend-links-view'

export const revalidate = 60

export const metadata: Metadata = {
  title: '友链',
  description: 'emmm 博客的友情链接与交换申请。',
}

export default async function FriendsPage() {
  const links = await getApprovedFriendLinks()
  return <FriendLinksView links={links} />
}
