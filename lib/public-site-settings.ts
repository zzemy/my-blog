export type PublicSocialLink = {
  platform: string
  url: string
  icon?: string
}

export type PublicSiteSettings = {
  siteTitle: string
  siteDescription: string
  footerText: string
  siteUrl: string
  socialLinks: PublicSocialLink[]
  authorInfo: {
    name: string
    bio: string
    avatarUrl: string
  }
  featureFlags: {
    enableComments: boolean
    enableFooter: boolean
    maintenanceMode: boolean
  }
}

export const DEFAULT_PUBLIC_SITE_SETTINGS: PublicSiteSettings = {
  siteTitle: 'emmm',
  siteDescription: '记录想法，分享发现，也留下痕迹。',
  footerText: '慢下来，写给时间与自己。',
  siteUrl: 'https://blog.zzemy.top',
  socialLinks: [
    { platform: 'GitHub', url: 'https://github.com/zzemy' },
    { platform: 'QQ', url: 'https://qm.qq.com/cgi-bin/qm/qr?k=GJV7-av-NF7gsXV13umV8RqQC0Cum5zo' },
  ],
  authorInfo: {
    name: 'emmm',
    bio: '',
    avatarUrl: '',
  },
  featureFlags: {
    enableComments: true,
    enableFooter: true,
    maintenanceMode: false,
  },
}
