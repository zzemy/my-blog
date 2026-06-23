"use client"

import { usePathname } from "next/navigation"
import { VantaBackground } from "@/shared/effects/vanta-background"
import { ScrollToTopButton } from "@/shared/layout/scroll-to-top-button"
import { SiteHeader } from "@/shared/layout/site-header"
import { SmoothScroll } from "@/shared/layout/smooth-scroll"

export function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) {
    return <>{children}</>
  }

  return (
    <SmoothScroll>
      <VantaBackground />
      <div className="relative flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          {children}
        </main>
        <ScrollToTopButton />
      </div>
    </SmoothScroll>
  )
}
