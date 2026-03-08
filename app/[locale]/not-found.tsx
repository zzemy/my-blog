import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl';
import { Lottie404 } from '@/shared/effects/lottie-404';

export default function NotFound() {
  const t = useTranslations('NotFound');
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center px-4">
      <div className="space-y-2 flex flex-col items-center">
        <Lottie404 />
        <h2 className="text-2xl font-semibold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground max-w-[500px]">
          {t('description')}
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/">
          {t('backHome')}
        </Link>
      </Button>
    </div>
  )
}

