'use client';

import { motion } from 'framer-motion';
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PostData } from "@/lib/types";
import { getPostRouteId } from "@/lib/post-public-id";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } }
};

interface PostListProps {
  posts: PostData[];
  readMoreText: string;
}

export function PostList({ posts, readMoreText }: PostListProps) {
  return (
    <motion.div 
      className="border-t border-border/70 dark:border-white/12"
      variants={container}
      initial={false}
      animate="show"
    >
      {posts.map((post) => {
        const postRouteId = getPostRouteId(post)

        return (
          <motion.article key={post.id} variants={item} className="group grid gap-4 border-b border-border/70 py-11 transition-colors duration-200 hover:border-foreground/35 dark:border-white/12 dark:hover:border-white/30 md:grid-cols-[9rem_minmax(0,1fr)] md:gap-10 md:py-14">
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground md:block md:pt-2">
              <time dateTime={post.date}>{new Date(post.date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replaceAll('/', '.')}</time>
              {post.readingTime && <span className="md:mt-2 md:block">{post.readingTime}</span>}
            </div>
            <div className="min-w-0">
              <h3 className="text-2xl font-semibold leading-9 text-foreground transition-colors group-hover:text-primary md:text-[1.7rem] md:leading-10">
                <Link href={`/posts/${postRouteId}`} className="inline no-underline">
                  {post.title}
                </Link>
              </h3>
              {(post.summary || post.excerpt) && <p className="mt-5 line-clamp-2 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">{post.summary || post.excerpt}</p>}
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                {post.tags?.map((tag) => (
                  <Link key={tag} href={`/tags/${tag}`} className="no-underline transition-colors hover:text-foreground">
                    #{tag}
                  </Link>
                ))}
                <Link href={`/posts/${postRouteId}`} className="ml-auto inline-flex items-center gap-1.5 font-medium text-foreground/70 no-underline transition-colors hover:text-primary dark:text-zinc-300">
                  {readMoreText} <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </motion.article>
        )
      })}
    </motion.div>
  );
}
