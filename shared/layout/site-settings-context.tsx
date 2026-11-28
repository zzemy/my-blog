'use client'

import * as React from 'react'
import {
  DEFAULT_PUBLIC_SITE_SETTINGS,
  type PublicSiteSettings,
  type PublicSocialLink,
} from '@/lib/public-site-settings'

export { DEFAULT_PUBLIC_SITE_SETTINGS, type PublicSiteSettings, type PublicSocialLink }

const SiteSettingsContext = React.createContext<PublicSiteSettings>(DEFAULT_PUBLIC_SITE_SETTINGS)

export function SiteSettingsProvider({
  settings,
  children,
}: {
  settings: PublicSiteSettings
  children: React.ReactNode
}) {
  return (
    <SiteSettingsContext.Provider value={settings ?? DEFAULT_PUBLIC_SITE_SETTINGS}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings(): PublicSiteSettings {
  return React.useContext(SiteSettingsContext) ?? DEFAULT_PUBLIC_SITE_SETTINGS
}
