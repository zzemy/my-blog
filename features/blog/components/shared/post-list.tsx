'use client';

import { motion } from 'framer-motion';
import { Link } from "@/i18n/routing";
import { HandDrawnArrow } from "@/shared/visuals/doodles";
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
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } }
};

interface PostListProps {
  posts: PostData[];
  readMoreText: string;
}

export function PostList({ posts, readMoreText }: PostListProps) {
  return (
    <motion.div 
      className="flex flex-col gap-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {posts.map((post) => (
        <motion.article key={post.id} variants={item} className="group relative pl-4 md:pl-8 border-l-2 border-dashed border-border/50 hover:border-primary/50 transition-colors">
          
          {/* Handdrawn circle accent on the border */}
          <div className="absolute -left-[5px] top-6 w-[8px] h-[8px] rounded-full bg-background border-2 border-primary sketch-ui group-hover:scale-150 transition-all" />

          <Link href={`/posts/${post.slug}`} className="block outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-2 -ml-2">
            <header className="mb-3">
              <time dateTime={post.date} className="text-sm md:text-base font-bold text-muted-foreground/70 mb-2 block font-handwriting tracking-widest">
                {new Date(post.date).toLocaleDateString(undefined, { 
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit' 
                }).replace(/\//g, '.')}
                {post.readingTime && <span className="ml-2">• {post.readingTime}</span>}
              </time>
              <h3 className="text-2xl md:text-3xl font-extrabold tracking-wide text-foreground group-hover:text-primary transition-colors decoration-wavy decoration-2 underline-offset-4 group-hover:underline decoration-primary/60">
                {post.title}
              </h3>
            </header>

            <p className="text-base md:text-lg leading-relaxed text-foreground/80 font-medium mb-4 max-w-3xl">
              {post.summary || post.excerpt}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2.5">
                {post.tags?.map((tag) => (
                  <span key={tag} className="sketch-ui inline-flex items-center px-3 py-1 text-xs md:text-sm font-bold text-primary/80 bg-primary/10 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    # {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 font-bold text-lg text-primary/80 group-hover:text-primary transition-colors">
                <span className="font-handwriting">{readMoreText}</span>
                <HandDrawnArrow className="w-6 h-6 -rotate-6 group-hover:translate-x-2 group-hover:-rotate-12 transition-all stroke-[2.5px] fill-transparent" />
              </div>
            </div>
          </Link>
        </motion.article>
      ))}
    </motion.div>
  );
}
