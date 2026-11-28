"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wrench } from "lucide-react"
import { VantaBackground } from "@/shared/effects/vanta-background"
import { ScrollToTopButton } from "@/shared/layout/scroll-to-top-button"
import { SiteFooter } from "@/shared/layout/site-footer"
import { SiteHeader } from "@/shared/layout/site-header"
import { SmoothScroll } from "@/shared/layout/smooth-scroll"
import {
  SiteSettingsProvider,
  type PublicSiteSettings,
} from "@/shared/layout/site-settings-context"

export function RootShell({
  children,
  settings,
}: {
  children: React.ReactNode
  settings: PublicSiteSettings
}) {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) {
    return (
      <SiteSettingsProvider settings={settings}>
        {children}
      </SiteSettingsProvider>
    )
  }

  if (settings.featureFlags.maintenanceMode) {
    return (
      <SiteSettingsProvider settings={settings}>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
          <div className="max-w-md space-y-5 rounded-2xl border border-border/70 bg-card/80 p-8 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border/70 bg-muted/50 text-foreground">
              <Wrench className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {settings.siteTitle} 正在维护中
              </h1>
              <p className="text-sm leading-7 text-muted-foreground">
                站点正在进行短暂更新与维护，稍后恢复访问。感谢你的耐心等待。
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/admin"
                className="text-xs text-muted-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                站长登录后台
              </Link>
            </div>
          </div>
        </div>
      </SiteSettingsProvider>
    )
  }

  return (
    <SiteSettingsProvider settings={settings}>
      <SmoothScroll>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
        >
          跳至正文内容
        </a>
        <VantaBackground />
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          <div id="main-content" className="flex-1">
            {children}
          </div>
          <SiteFooter />
          <ScrollToTopButton />
        </div>
      </SmoothScroll>
    </SiteSettingsProvider>
  )
}
