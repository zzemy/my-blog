// import { Geist, Geist_Mono } from "next/font/google";
// import { Lora } from 'next/font/google';

import "./globals.css";
import "katex/dist/katex.min.css";
import { ThemeProvider } from "@/shared/layout/theme-provider"
import { SiteHeader } from "@/shared/layout/site-header"
import { ScrollToTopButton } from "@/shared/layout/scroll-to-top-button"
import { SmoothScroll } from "@/shared/layout/smooth-scroll";
import { VantaProvider } from "@/shared/effects/vanta-context";
import { VantaBackground } from "@/shared/effects/vanta-background";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"
import { getSiteSettings } from "@/lib/site-settings";

export const revalidate = 60;

const geistSans = { variable: "font-sans" };
const geistMono = { variable: "font-mono" };

const defaultTitle = 'emmm'
const defaultDescription = '欢迎来到我的博客'

export async function generateMetadata() {
  const settings = await getSiteSettings();

  return {
    metadataBase: new URL('https://blog.zzemy.top'),
    title: {
      default: settings.site_title || defaultTitle,
      template: `%s | ${settings.site_title || defaultTitle}`
    },
    description: settings.site_description || defaultDescription,
    icons: {
      icon: settings.favicon_url || '/icon',
      shortcut: settings.favicon_url || '/icon',
    },
    keywords: settings.site_keywords
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}>
        <SmoothScroll>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <VantaProvider>
              <VantaBackground />
              <div className="relative flex min-h-screen flex-col">
                <SiteHeader />
                <main className="flex-1">
                  {children}
                </main>
                <ScrollToTopButton />
              </div>
              <SpeedInsights />
              <Analytics />
            </VantaProvider>
          </ThemeProvider>
        </SmoothScroll>
      </body>
    </html>
  )
}
