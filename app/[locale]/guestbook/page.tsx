import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Comments } from "@/features/blog/components/client/comments";
import { FadeIn } from "@/shared/visuals/fade-in";

const locales = ['zh', 'en', 'fr', 'ja'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function GuestbookPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Guestbook');

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <FadeIn className="mx-auto max-w-3xl">
        <div className="space-y-4 border-b pb-8 mb-8">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">{t('title')}</h1>
          <p className="text-xl text-muted-foreground">
            {t('description')}
          </p>
        </div>
        
        <Comments />
      </FadeIn>
    </div>
  );
}
