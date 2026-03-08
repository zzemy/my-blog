import { Link } from "@/i18n/routing";
import { ChevronRight, Home } from "lucide-react";
import { useTranslations } from "next-intl";

interface PostBreadcrumbProps {
  title: string;
}

export function PostBreadcrumb({ title }: PostBreadcrumbProps) {
  const t = useTranslations('Navigation');
  
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex items-center text-sm text-muted-foreground">
      <Link href="/" className="flex items-center hover:text-primary transition-colors">
        <Home className="h-4 w-4" />
        <span className="sr-only">{t('home')}</span>
      </Link>
      <ChevronRight className="mx-2 h-4 w-4" />
      <Link href="/posts" className="hover:text-primary transition-colors">
        {t('posts')}
      </Link>
      <ChevronRight className="mx-2 h-4 w-4" />
      <span className="font-medium text-foreground truncate max-w-[150px] sm:max-w-[300px] md:max-w-[500px]">
        {title}
      </span>
    </nav>
  );
}
