'use client';

import { motion } from 'framer-motion';
import { Link } from "@/i18n/routing";
import { HandDrawnArrow, HandDrawnStar, HandDrawnSmiley, HandDrawnCloud } from "@/shared/visuals/doodles";
import { PostData } from "@/lib/types";

const DOODLES = [HandDrawnStar, HandDrawnSmiley, HandDrawnCloud];

const CARD_COLORS = [
  'bg-[#ffdfba] dark:bg-orange-950', // pastel orange
  'bg-[#ffffba] dark:bg-yellow-950', // pastel yellow
  'bg-[#baffc9] dark:bg-green-950',  // pastel green
  'bg-[#bae1ff] dark:bg-sky-950',    // pastel blue
  'bg-[#ffb3ba] dark:bg-rose-950',   // pastel pink
  'bg-[#e2c6ff] dark:bg-purple-950'  // pastel purple
];

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
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

interface PostListProps {
  posts: PostData[];
  readMoreText: string;
}

export function PostList({ posts, readMoreText }: PostListProps) {
  return (
    <motion.div 
      className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {posts.map((post, i) => {
        const Icon = DOODLES[i % DOODLES.length];
        const thumbBg = CARD_COLORS[i % CARD_COLORS.length];

        return (
        <motion.article key={post.id} variants={item} className="h-full group">
          <Link href={`/posts/${post.slug}`} className="block h-full outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-3xl bg-white dark:bg-slate-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-700/50 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] dark:shadow-none active:translate-y-1 relative flex flex-col overflow-hidden">

            {/* Thumbnail Cover - Soft flat aesthetic */}
            <div className={`h-32 w-full relative overflow-hidden flex items-center justify-center transition-colors border-b border-black/5 dark:border-white/5 ${thumbBg}`}>
              <div className="absolute inset-0 bg-white/25 dark:bg-black/25 backdrop-blur-[1px]"></div>
              <Icon className="w-16 h-16 text-black/10 dark:text-white/10 stroke-[2px] group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-10" />
            </div>

            {/* Card Body */}
            <div className="px-6 py-7 flex-1 flex flex-col relative bg-transparent">  

              <div className="absolute -top-3 left-6 px-3.5 py-1 tracking-wider bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover:-translate-y-0.5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] border border-white dark:border-slate-600 shadow-sm shadow-slate-200/50 dark:shadow-black/50">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  }).replace(/\//g, '.')}
                </time>
              </div>

              <h3 className="line-clamp-2 text-lg md:text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors leading-snug mt-2 mb-3 font-heading" style={{wordBreak: "break-word"}}>
                {post.title}
              </h3>

              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 line-clamp-3">
                {post.summary || post.excerpt}
              </p>

              <div className="mt-auto pt-4 border-t border-slate-100/80 dark:border-slate-800/80 flex flex-col gap-4">
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2.5 py-0.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary rounded-md border border-slate-100/50 dark:border-slate-700/30 text-[10px] font-bold tracking-wide transition-colors cursor-pointer">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between font-bold text-xs mt-1 group-hover:text-primary text-slate-400 dark:text-slate-500 transition-colors uppercase tracking-widest">
                  <span>{readMoreText}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.article>
        );
      })}
    </motion.div>
  );
}
