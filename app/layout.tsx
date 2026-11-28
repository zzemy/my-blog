import "./globals.css"
import type { Metadata } from "next"
import { ThemeProvider } from "@/shared/layout/theme-provider"
import { RootShell } from "@/shared/layout/root-shell"
import {
  DEFAULT_PUBLIC_SITE_SETTINGS,
  type PublicSiteSettings,
  type PublicSocialLink,
} from "@/lib/public-site-settings"
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

  const seoExtra = (raw.seo_config ?? {}) as Record<string, unknown>
  const rawPreset = typeof seoExtra.accent_preset === "string" ? seoExtra.accent_preset : "ink"
  const accentPreset =
    rawPreset === "amber" || rawPreset === "teal" || rawPreset === "indigo" ? rawPreset : "ink"
  const foundedDate =
    typeof seoExtra.founded_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(seoExtra.founded_date.trim())
      ? seoExtra.founded_date.trim()
      : DEFAULT_PUBLIC_SITE_SETTINGS.foundedDate
  const customCss =
    typeof seoExtra.custom_css === "string" ? seoExtra.custom_css.slice(0, 8000) : ""

  return {
    siteTitle,
    siteDescription,
    footerText,
    siteUrl,
    foundedDate,
    accentPreset,
    customCss,
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
    <html
      lang="zh-CN"
      suppressHydrationWarning
      data-accent-preset={publicSettings.accentPreset !== "ink" ? publicSettings.accentPreset : undefined}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        {publicSettings.customCss ? (
          <style id="site-custom-css" dangerouslySetInnerHTML={{ __html: publicSettings.customCss }} />
        ) : null}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={true}
          disableTransitionOnChange
        >
          <RootShell settings={publicSettings}>{children}</RootShell>
          <SpeedInsights />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
