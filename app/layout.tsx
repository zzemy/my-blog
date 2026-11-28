import "./globals.css"
import type { Metadata } from "next"
import { ThemeProvider } from "@/shared/layout/theme-provider"
import { VantaProvider } from "@/shared/effects/vanta-context"
import { RootShell } from "@/shared/layout/root-shell"
import {
  DEFAULT_PUBLIC_SITE_SETTINGS,
  type PublicSiteSettings,
  type PublicSocialLink,
} from "@/shared/layout/site-settings-context"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"
import { getSiteSettings } from "@/lib/site-settings"

export const revalidate = 60

function getBaseSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://blog.zzemy.top").replace(/\/$/, "")
}

function toPublicSiteSettings(raw: Awaited<ReturnType<typeof getSiteSettings>>): PublicSiteSettings {
  const siteUrl = getBaseSiteUrl()
  const siteTitle =
    raw.site_title && raw.site_title !== "My Blog"
      ? raw.site_title
      : DEFAULT_PUBLIC_SITE_SETTINGS.siteTitle
  const siteDescription =
    raw.site_description &&
    raw.site_description !== "A dedicated space for sharing knowledge and insights."
      ? raw.site_description
      : DEFAULT_PUBLIC_SITE_SETTINGS.siteDescription
  const footerText =
    raw.footer_text && raw.footer_text !== "© 2026 My Blog. All rights reserved."
      ? raw.footer_text
      : DEFAULT_PUBLIC_SITE_SETTINGS.footerText

  const rawSocials = Array.isArray(raw.social_links)
    ? (raw.social_links as PublicSocialLink[]).filter(
        (item) => item && typeof item.platform === "string" && typeof item.url === "string" && item.url.trim(),
      )
    : []

  return {
    siteTitle,
    siteDescription,
    footerText,
    siteUrl,
    socialLinks: rawSocials.length > 0 ? rawSocials : DEFAULT_PUBLIC_SITE_SETTINGS.socialLinks,
    authorInfo: {
      name: raw.author_info?.name?.trim() || siteTitle,
      bio: raw.author_info?.bio?.trim() || "",
      avatarUrl: raw.author_info?.avatar_url?.trim() || "",
    },
    featureFlags: {
      enableComments: raw.feature_flags?.enable_comments !== false,
      enableFooter: raw.feature_flags?.enable_footer !== false,
      maintenanceMode: Boolean(raw.feature_flags?.maintenance_mode),
    },
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const siteUrl = getBaseSiteUrl()
  const title =
    settings.site_title && settings.site_title !== "My Blog" ? settings.site_title : "emmm"
  const description =
    settings.site_description &&
    settings.site_description !== "A dedicated space for sharing knowledge and insights."
      ? settings.site_description
      : "记录想法，分享发现，也留下痕迹。"

  const googleVerification = settings.seo_config?.google_site_verification?.trim()
  const baiduVerification = settings.seo_config?.baidu_site_verification?.trim()
  const defaultOgImage = settings.seo_config?.og_image?.trim()

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    icons: {
      icon: settings.favicon_url || "/icon",
      shortcut: settings.favicon_url || "/icon",
    },
    keywords: settings.site_keywords,
    alternates: {
      types: {
        "application/rss+xml": `${siteUrl}/rss.xml`,
        "application/atom+xml": `${siteUrl}/atom.xml`,
      },
    },
    ...(defaultOgImage
      ? {
          openGraph: {
            title,
            description,
            url: siteUrl,
            siteName: title,
            images: [defaultOgImage],
          },
        }
      : {}),
    ...(googleVerification || baiduVerification
      ? {
          verification: {
            ...(googleVerification ? { google: googleVerification } : {}),
            ...(baiduVerification
              ? { other: { "baidu-site-verification": baiduVerification } }
              : {}),
          },
        }
      : {}),
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const rawSettings = await getSiteSettings()
  const publicSettings = toPublicSiteSettings(rawSettings)

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={true}
          disableTransitionOnChange
        >
          <VantaProvider>
            <RootShell settings={publicSettings}>{children}</RootShell>
            <SpeedInsights />
            <Analytics />
          </VantaProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
