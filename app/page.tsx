import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { getPublishedPosts } from "@/lib/supabase/posts";
import { getPostRouteId } from "@/lib/post-public-id";
import { PostList } from "@/features/blog/components/shared/post-list";
import { FadeIn } from "@/shared/visuals/fade-in";
import { HeroTitle } from "@/shared/visuals/hero-title";
import { getSiteSettings } from "@/lib/site-settings";

export const revalidate = 60;

const HOME_POST_LIMIT = 6;

function formatLatestMonth(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}.${month}`;
}

function collectTopTags(posts: Array<{ tags?: string[] }>, limit = 6) {
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const rawTag of post.tags || []) {
      const tag = rawTag.trim();
      if (!tag) continue;
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export default async function Home() {
  const [settings, posts] = await Promise.all([
    getSiteSettings(),
    getPublishedPosts(),
  ]);

  const heroTitle =
    settings.site_title && settings.site_title !== 'My Blog'
      ? settings.site_title
      : 'emmm';
  const heroDescription =
    settings.site_description &&
    settings.site_description !== 'A dedicated space for sharing knowledge and insights.'
      ? settings.site_description
      : '记录想法，分享发现，也留下痕迹。';

  const featuredPosts = posts.filter((post) => post.featured).slice(0, 2);
  const recentPosts = posts.slice(0, HOME_POST_LIMIT);
  const topTags = collectTopTags(posts, 6);
  const latestDate = formatLatestMonth(posts[0]?.date);

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-10 pt-2 md:px-8 md:pb-16">
        <HeroTitle
          title={heroTitle}
          description={heroDescription}
          postCount={posts.length}
          latestDate={latestDate}
        />

        {featuredPosts.length > 0 && (
          <section className="mx-auto mt-6 max-w-4xl md:mt-8">
            <FadeIn>
              <div className="mb-4 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground/80">
                <Star className="size-3.5 text-amber-500/80" />
                <span>Featured / 精选置顶</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {featuredPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/posts/${getPostRouteId(post)}`}
                    className="group flex flex-col justify-between rounded-xl border border-border/80 bg-card/75 p-5 no-underline backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-card hover:shadow-md dark:border-white/12 dark:bg-card/65"
                  >
                    <div>
                      <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {post.title}
                      </h3>
                      {post.summary && (
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {post.summary}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-mono tabular-nums">
                        {new Date(post.date).toLocaleDateString('zh-CN', {
                          timeZone: 'Asia/Shanghai',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1 text-foreground/75 transition-colors group-hover:text-foreground">
                        阅读全文
                        <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </FadeIn>
          </section>
        )}

        <section
          id="recent-posts"
          className="mx-auto mt-8 max-w-4xl scroll-mt-24 md:mt-12"
        >
          <FadeIn className="border-b border-border/70 pb-5 dark:border-white/[0.09]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground/70 uppercase">
                  Recent Writings
                </p>
                <h2 className="mt-1.5 text-2xl font-semibold tracking-wide text-foreground md:text-[1.7rem]">
                  留下的痕迹
                </h2>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="font-mono tabular-nums text-muted-foreground/80">
                  共 {posts.length} 篇
                </span>
                <Link
                  href="/posts"
                  className="group inline-flex items-center gap-1 font-medium text-foreground/75 transition-colors hover:text-foreground"
                >
                  <span>全部文章</span>
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {topTags.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {topTags.map((tag) => (
                  <Link
                    key={tag.name}
                    href={`/tags/${encodeURIComponent(tag.name)}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm transition-colors duration-200 hover:border-foreground/25 hover:bg-foreground/[0.04] hover:text-foreground dark:border-white/10 dark:bg-white/[0.025]"
                  >
                    <span>#{tag.name}</span>
                    <span className="font-mono text-[10px] opacity-60">{tag.count}</span>
                  </Link>
                ))}
                <Link
                  href="/tags"
                  className="px-2 py-1 text-xs text-muted-foreground/75 transition-colors hover:text-foreground"
                >
                  全部标签 →
                </Link>
              </div>
            )}
          </FadeIn>

          <div className="mt-2">
            <PostList posts={recentPosts} readMoreText="阅读全文" />
          </div>

          {posts.length > HOME_POST_LIMIT && (
            <FadeIn className="mt-10 flex justify-center">
              <Link
                href="/posts"
                className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-6 py-2.5 text-sm text-foreground/80 backdrop-blur-sm transition-all duration-300 hover:border-foreground/30 hover:bg-foreground/[0.04] hover:text-foreground dark:border-white/12 dark:bg-white/[0.03]"
              >
                <span>浏览全部 {posts.length} 篇文章</span>
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </FadeIn>
          )}
        </section>
      </div>
    </div>
  );
}
