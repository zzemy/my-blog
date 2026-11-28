export const REPO_URL = 'https://github.com/zzemy/my-blog'

export interface SiteNavItem {
  id: 'home' | 'posts' | 'tags' | 'friends' | 'guestbook' | 'about'
  href: string
  label: string
  external?: boolean
  showInFooter?: boolean
}

export const SITE_NAV_ITEMS: readonly SiteNavItem[] = [
  { id: 'home', href: '/', label: '首页', showInFooter: false },
  { id: 'posts', href: '/posts', label: '文章', showInFooter: true },
  { id: 'tags', href: '/tags', label: '标签', showInFooter: true },
  { id: 'friends', href: '/friends', label: '友链', showInFooter: true },
  { id: 'guestbook', href: '/guestbook', label: '留言', showInFooter: true },
  { id: 'about', href: REPO_URL, label: '关于', external: true, showInFooter: true },
]
