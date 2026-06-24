'use client';

import { motion } from 'framer-motion';
import Link from "next/link";
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
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {posts.map((post) => {
        const postRouteId = getPostRouteId(post)

        return (
          <motion.div key={post.id} variants={item} className="h-full">
            <Card className="h-full border-border/70 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md dark:shadow-sm dark:hover:shadow-md">
              <CardHeader className="space-y-3">
                <CardTitle className="line-clamp-2 text-lg">
                  <Link
                    href={`/posts/${postRouteId}`}
                    className="inline-block no-underline text-foreground transition-colors hover:text-primary"
                  >
                    {post.title}
                  </Link>
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm text-muted-foreground">
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
                        <span className="rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground">
                          #{tag}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="ghost" className="w-full justify-start px-0 text-muted-foreground transition-colors hover:bg-transparent hover:text-primary">
                  <Link href={`/posts/${postRouteId}`} className="flex items-center">
                    {readMoreText} <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  );
}
