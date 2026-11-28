import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface PostBreadcrumbProps {
  title: string;
  homeLabel?: string;
  postsLabel?: string;
}

export function PostBreadcrumb({
  title,
  homeLabel = "首页",
  postsLabel = "文章",
}: PostBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex items-center text-sm text-muted-foreground">
      <Link href="/" className="flex items-center transition-colors hover:text-primary">
        <Home className="h-4 w-4" />
        <span className="sr-only">{homeLabel}</span>
      </Link>
      <ChevronRight className="mx-2 h-4 w-4 shrink-0" />
      <Link href="/posts" className="shrink-0 transition-colors hover:text-primary">
        {postsLabel}
      </Link>
      <ChevronRight className="mx-2 h-4 w-4 shrink-0" />
      <span className="max-w-[160px] truncate font-medium text-foreground sm:max-w-[320px] md:max-w-[520px]">
        {title}
      </span>
    </nav>
  );
}
