'use client';

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PostData } from "@/lib/types";
import { getPostRouteId } from "@/lib/post-public-id";

interface PostListProps {
  posts: PostData[];
  readMoreText: string;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date
    .toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replaceAll('/', '.');
}

export function PostList({ posts, readMoreText }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm tracking-wide text-muted-foreground">暂时还没有公开的文章。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {posts.map((post, index) => {
        const postRouteId = getPostRouteId(post);
        const excerpt = post.summary || post.excerpt;
        const hasCover = Boolean(post.coverImage);

        return (
          <article
            key={post.id}
            style={{ animationDelay: `${Math.min(index * 60, 300)}ms` }}
            className="animate-hero-rise group relative -mx-3 rounded-2xl px-3 py-8 transition-colors duration-300 before:pointer-events-none before:absolute before:bottom-7 before:left-0 before:top-7 before:w-[2px] before:rounded-full before:bg-foreground/45 before:opacity-0 before:transition-opacity before:duration-300 after:pointer-events-none after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-border/65 after:transition-opacity after:duration-200 last:after:hidden hover:bg-foreground/[0.025] hover:before:opacity-100 hover:after:opacity-0 dark:after:bg-white/[0.08] dark:hover:bg-white/[0.03] sm:-mx-5 sm:px-5 md:py-10 sm:after:inset-x-5"
          >
            <div
              className={
                hasCover
                  ? "grid gap-4 md:grid-cols-[8.5rem_minmax(0,1fr)_11rem] md:items-start md:gap-8"
                  : "grid gap-4 md:grid-cols-[8.5rem_minmax(0,1fr)] md:items-start md:gap-8"
              }
            >
              <div className="flex items-center gap-3 font-mono text-xs tabular-nums tracking-wider text-muted-foreground/75 md:flex-col md:items-start md:gap-2 md:pt-1.5">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                {post.readingTime && (
                  <span className="text-[11px] text-muted-foreground/55">
                    {post.readingTime}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <h3 className="text-xl font-semibold leading-snug tracking-[0.01em] text-foreground/95 transition-colors duration-200 group-hover:text-foreground md:text-[1.45rem] md:leading-[1.45]">
                  <Link
                    href={`/posts/${postRouteId}`}
                    className="inline no-underline focus-visible:outline-none focus-visible:underline"
                  >
                    {post.title}
                  </Link>
                </h3>

                {excerpt && (
                  <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-7 text-muted-foreground/85 md:text-[0.95rem]">
                    {excerpt}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {post.tags?.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tags/${encodeURIComponent(tag)}`}
                      className="rounded-full border border-border/70 bg-foreground/[0.02] px-2.5 py-0.5 text-[11px] text-muted-foreground no-underline transition-colors duration-200 hover:border-foreground/25 hover:bg-foreground/[0.05] hover:text-foreground dark:border-white/10 dark:bg-white/[0.025]"
                    >
                      #{tag}
                    </Link>
                  ))}

                  <Link
                    href={`/posts/${postRouteId}`}
                    className="ml-auto inline-flex items-center gap-1.5 font-medium text-foreground/60 no-underline transition-colors duration-200 group-hover:text-foreground"
                  >
                    <span>{readMoreText}</span>
                    <ArrowRight className="size-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {hasCover && post.coverImage && (
                <Link
                  href={`/posts/${postRouteId}`}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="mt-2 block aspect-[16/10] w-full overflow-hidden rounded-xl border border-border/60 bg-muted/40 dark:border-white/10 md:mt-0.5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                </Link>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
