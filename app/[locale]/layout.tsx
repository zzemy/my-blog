import { Nunito, Quicksand, ZCOOL_KuaiLe } from "next/font/google";

const zcool = ZCOOL_KuaiLe({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-heading-cjk",
});

import "../globals.css";
import "katex/dist/katex.min.css";
import { ThemeProvider } from "@/shared/layout/theme-provider"
import { SiteHeader } from "@/shared/layout/site-header"
import { ScrollToTopButton } from "@/shared/layout/scroll-to-top-button"
import { NextIntlClientProvider } from 'next-intl';
import { SmoothScroll } from "@/shared/layout/smooth-scroll";
import { getMessages, setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { VantaProvider } from "@/shared/effects/vanta-context";
import { VantaBackground } from "@/shared/effects/vanta-background";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"
import { getSiteSettings } from "@/lib/site-settings";
import { SiteFooter } from "@/shared/layout/site-footer";

export const revalidate = 60;

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-heading",
  subsets: ["latin"],
});

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({locale, namespace: 'Home'});
  const settings = await getSiteSettings();
 
  return {
    metadataBase: new URL('https://emmmxx.xyz'),
    title: {
      default: settings.site_title || t('title'),
      template: `%s | ${settings.site_title || t('title')}`
    },
    description: settings.site_description || t('description'),
    icons: {
      icon: settings.favicon_url || '/icon',
      shortcut: settings.favicon_url || '/icon',
    },
    keywords: settings.site_keywords
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const settings = await getSiteSettings();

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
  
  // No RTL languages currently supported
  const isRtl = false;

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
      </head>
      <body className={`${nunito.variable} ${quicksand.variable} ${zcool.variable} min-h-screen bg-background font-sans antialiased text-slate-800 dark:text-slate-200`}>
        <SmoothScroll>
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem={false}
                disableTransitionOnChange
              >
                <VantaProvider>
                  {/* <VantaBackground /> */}
                  <div className="relative flex min-h-screen flex-col">
                    <SiteHeader />
                    {/* Main Content */}
                    <main className="flex-1">
                      {children}
                    </main>
                    {settings.feature_flags?.enable_footer !== false && (
                      <SiteFooter text={settings.footer_text || '© 2026 My Blog'} />
                    )}
                    <ScrollToTopButton />
                  </div>
                  <SpeedInsights />
                  <Analytics />
                </VantaProvider>
            </ThemeProvider>
          </NextIntlClientProvider>
        </SmoothScroll>
      </body>
    </html>
  )
}