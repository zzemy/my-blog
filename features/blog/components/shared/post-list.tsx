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
          <Link href={`/posts/${post.slug}`} className="block h-full outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-[2rem] bg-white dark:bg-slate-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] border-2 border-slate-100 dark:border-slate-700/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] dark:shadow-none active:translate-y-1 relative flex flex-col overflow-hidden">

            {/* Thumbnail Cover - Soft flat aesthetic */}
            <div className={`h-40 w-full relative overflow-hidden flex items-center justify-center transition-colors border-b border-white/50 dark:border-white/10 ${thumbBg}`}>
              <Icon className="w-20 h-20 text-slate-800/80 dark:text-slate-100/90 stroke-[2px] fill-white/60 dark:fill-slate-900/40 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 ease-out z-10 drop-shadow-sm" />
            </div>

            {/* Card Body */}
            <div className="p-6 flex-1 flex flex-col relative bg-transparent">  

              <div className="absolute -top-4 left-6 px-4 py-1 tracking-wider bg-white dark:bg-slate-800 rounded-[1rem] text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover:-translate-y-1 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] border border-slate-100 dark:border-slate-700 shadow-sm">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  }).replace(/\//g, '.')}
                </time>
              </div>

              <h3 className="line-clamp-2 text-xl md:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors leading-snug mt-4 mb-3 font-heading" style={{wordBreak: "break-word"}}>
                {post.title}
              </h3>

              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 line-clamp-3">
                {post.summary || post.excerpt}
              </p>

              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-4">
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-primary/5 rounded-full text-xs font-bold transition-colors cursor-pointer">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between font-bold text-[13px] mt-2 group-hover:text-primary text-slate-400 dark:text-slate-500 transition-colors uppercase tracking-wider">
                  <span>{readMoreText}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
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
