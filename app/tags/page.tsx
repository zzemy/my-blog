import { getPublishedPosts } from "@/lib/supabase/posts";
import Link from 'next/link';
import { Hash } from 'lucide-react';

export default async function TagsPage() {
  const posts = await getPublishedPosts();
  const tagCountMap = new Map<string, number>();

  for (const post of posts) {
    const tags = post.tags || [];
    for (const tag of tags) {
      const normalizedTag = tag.trim();
      if (!normalizedTag) continue;
      tagCountMap.set(normalizedTag, (tagCountMap.get(normalizedTag) || 0) + 1);
    }
  }

  const sortedTags = Array.from(tagCountMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const totalPosts = sortedTags.reduce((sum, item) => sum + item.count, 0);
  const maxCount = sortedTags[0]?.count || 1;

  const getTagSizeClass = (count: number) => {
    const ratio = count / maxCount;
    if (ratio >= 0.8) return 'text-base md:text-lg px-4 py-2.5';
    if (ratio >= 0.5) return 'text-sm md:text-base px-4 py-2';
    return 'text-sm px-3.5 py-1.5';
  };

  const getTagStyleClass = (count: number) => {
    const ratio = count / maxCount;
    if (ratio >= 0.8) {
      return 'border-border bg-muted text-foreground';
    }
    if (ratio >= 0.5) {
      return 'border-border/80 bg-muted/70 text-foreground/90';
    }
    return 'border-border/70 bg-muted/40 text-foreground/80';
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <section className="border-b pb-8">
        <div className="flex flex-col items-start gap-5 md:flex-row md:items-end md:justify-between md:gap-8">
          <div className="flex-1 space-y-3">
            <h1 className="inline-block font-bold text-4xl tracking-tight lg:text-5xl">标签</h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              按标签浏览文章
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              {sortedTags.length} 个标签
            </span>
            <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              {totalPosts} 次归档
            </span>
          </div>
        </div>
      </section>

      {sortedTags.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border/70 bg-card px-6 py-10 text-center text-muted-foreground shadow-sm">
          暂无标签数据
        </div>
      ) : (
        <section className="mt-8 rounded-xl border border-border/70 bg-card p-4 shadow-sm md:p-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Hash className="h-4 w-4" />
            <span>按标签浏览文章</span>
          </div>
          <div className="flex flex-wrap gap-3 md:gap-3.5">
            {sortedTags.map((tag) => (
              <Link
                key={tag.name}
                href={`/tags/${tag.name}`}
                className={`group inline-flex items-center gap-2 rounded-full border no-underline shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md ${getTagSizeClass(tag.count)} ${getTagStyleClass(tag.count)}`}
              >
                <span className="font-medium leading-none">#{tag.name}</span>
                <span className="rounded-full border border-border/70 bg-background px-2 py-0.5 text-xs text-muted-foreground">
                  {tag.count}
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-5 text-xs text-muted-foreground/90">
            {sortedTags.length} 个标签 · {totalPosts} 次归档
          </p>
        </section>
      )}
    </div>
  );
}
