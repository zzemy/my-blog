'use client';

import { motion } from 'framer-motion';
import { Link } from "@/i18n/routing";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PostData } from "@/lib/types";

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
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {posts.map((post) => (
        <motion.div key={post.id} variants={item} className="h-full">
          <Card className="group/card flex h-full flex-col rounded-2xl border border-border/70 bg-gradient-to-r from-background/90 via-background/82 to-background/70 shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-border hover:from-background/94 hover:via-background/88 hover:to-background/78 dark:border-white/6 dark:from-zinc-900/40 dark:via-zinc-900/30 dark:to-zinc-900/20 dark:shadow-lg dark:shadow-black/20">
              <CardHeader className="space-y-3">
                <CardTitle className="line-clamp-2 text-lg">
                  <Link
                    href={`/posts/${post.slug}`}
                    className="inline-block no-underline text-foreground transition-colors duration-200"
                  >
                    {post.title}
                  </Link>
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 group-hover/card:text-foreground/80 dark:group-hover/card:text-zinc-300">
                  <time dateTime={post.date}>{new Date(post.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                  {post.readingTime && (
                    <>
                      <span>•</span>
                      <span>{post.readingTime}</span>
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {post.summary || post.excerpt}
                </p>
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.tags.map(tag => (
                      <Link key={tag} href={`/tags/${tag}`} className="relative z-10 no-underline">
                        <span className="rounded-md border border-border/80 bg-background/70 px-2 py-1 text-xs text-muted-foreground backdrop-blur-md transition-colors hover:border-border hover:bg-background/90 hover:text-foreground dark:border-white/10 dark:bg-white/6 dark:text-zinc-300/85 dark:hover:bg-white/10">
                          #{tag}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="ghost" className="w-full justify-start px-0 text-foreground/80 transition-colors hover:bg-transparent hover:text-primary">
                  <Link href={`/posts/${post.slug}`} className="flex items-center">
                    {readMoreText} <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
