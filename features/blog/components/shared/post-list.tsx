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
          <Link href={`/posts/${post.slug}`} className="block h-full outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl bg-[#fffcf5] dark:bg-zinc-800 transition-all hover:translate-y-[2px] border-[2.5px] border-slate-700 dark:border-slate-300 shadow-[6px_6px_0_0_#334155] dark:shadow-[6px_6px_0_0_#94a3b8] hover:shadow-[3px_3px_0_0_#334155] hover:dark:shadow-[3px_3px_0_0_#94a3b8] relative flex flex-col overflow-hidden sketch-ui group-hover:-rotate-1">
            
            {/* Colorful Thumbnail Cover */}
            <div className={`h-40 sm:h-48 w-full border-b-[2.5px] border-slate-700 dark:border-slate-300 relative overflow-hidden flex items-center justify-center transition-colors ${thumbBg}`}>
              {/* Subtle line pattern on cover */}
              <div className="absolute inset-0 opacity-[0.15] bg-[radial-gradient(#000_2px,transparent_2px)] [background-size:24px_24px] dark:bg-[radial-gradient(#fff_2px,transparent_2px)]"></div>
              
              <Icon className="w-24 h-24 text-slate-700 dark:text-slate-300 stroke-[2px] fill-white/80 dark:fill-black/30 group-hover:scale-[1.3] group-hover:rotate-12 transition-transform duration-500 z-10 animate-[bounce_4s_infinite]" />
              
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/40 dark:bg-black/20 rounded-full blur-xl z-0"></div>
            </div>

            {/* Card Body */}
            <div className="p-6 flex-1 flex flex-col relative bg-transparent">
              
              <time dateTime={post.date} className="absolute -top-4 left-6 px-4 py-1.5 bg-[#fef08a] dark:bg-yellow-900/80 rounded-xl text-xs font-extrabold font-mono z-20 shadow-[2px_2px_0_0_#334155] dark:shadow-[2px_2px_0_0_#94a3b8] text-slate-800 dark:text-yellow-100 group-hover:rotate-[4deg] transition-transform border-[2px] border-slate-700 dark:border-slate-300 sketch-ui">
                {new Date(post.date).toLocaleDateString(undefined, { 
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit' 
                }).replace(/\//g, '.')}
              </time>

              <h3 className="line-clamp-2 text-xl md:text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors leading-snug mt-3 mb-3">
                {post.title}
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-6 line-clamp-3">
                {post.summary || post.excerpt}
              </p>

              <div className="mt-auto pt-4 border-t-[2.5px] border-slate-700 dark:border-slate-300 border-dashed flex flex-col gap-4">
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-white dark:bg-zinc-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 border-[2px] border-slate-700 dark:border-slate-300 shadow-[2px_2px_0_0_#334155] dark:shadow-[2px_2px_0_0_#94a3b8] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0_0_#334155] dark:hover:shadow-[1px_1px_0_0_#94a3b8] transition-all sketch-ui cursor-crosshair">
                        # {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between font-bold text-[15px] text-slate-800 dark:text-slate-200 mt-2">
                  <span className="font-handwriting-cjk text-lg decoration-wavy underline-offset-4 group-hover:underline group-hover:text-primary transition-colors">{readMoreText}</span>
                  <HandDrawnArrow className="w-6 h-6 -rotate-12 group-hover:translate-x-2 group-hover:translate-y-[-2px] group-hover:rotate-0 transition-all stroke-[2.5px] fill-transparent text-primary/80 group-hover:text-primary" />
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
