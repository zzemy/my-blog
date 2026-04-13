'use client';

import { motion } from 'framer-motion';
import { Link } from "@/i18n/routing";
import { HandDrawnArrow, HandDrawnStar, HandDrawnSmiley, HandDrawnCloud, HandDrawnPlanet, HandDrawnSparkle, HandDrawnSwirl } from "@/shared/visuals/doodles";
import { CartoonBlob1, CartoonBlob2, CartoonBlob3 } from "@/shared/visuals/cartoon-shapes";
import { PostData } from "@/lib/types";

const DOODLES = [HandDrawnStar, HandDrawnSmiley, HandDrawnCloud, HandDrawnPlanet, HandDrawnSparkle, HandDrawnSwirl];
const BLOBS = [CartoonBlob1, CartoonBlob2, CartoonBlob3];

const CARD_COLORS = [
  { bg: 'bg-sky-100/90 dark:bg-sky-500/20', text: 'text-sky-500 dark:text-sky-300', blob: 'text-sky-200 fill-sky-100 dark:text-sky-400/20 dark:fill-sky-500/10' },
  { bg: 'bg-emerald-100/90 dark:bg-emerald-500/20', text: 'text-emerald-500 dark:text-emerald-300', blob: 'text-emerald-200 fill-emerald-100 dark:text-emerald-400/20 dark:fill-emerald-500/10' },
  { bg: 'bg-amber-100/90 dark:bg-amber-500/20', text: 'text-amber-500 dark:text-amber-300', blob: 'text-amber-200 fill-amber-100 dark:text-amber-400/20 dark:fill-amber-500/10' },
  { bg: 'bg-indigo-100/90 dark:bg-indigo-500/20', text: 'text-indigo-500 dark:text-indigo-300', blob: 'text-indigo-200 fill-indigo-100 dark:text-indigo-400/20 dark:fill-indigo-500/10' },
  { bg: 'bg-rose-100/90 dark:bg-rose-500/20', text: 'text-rose-500 dark:text-rose-300', blob: 'text-rose-200 fill-rose-100 dark:text-rose-400/20 dark:fill-rose-500/10' },
  { bg: 'bg-violet-100/90 dark:bg-violet-500/20', text: 'text-violet-500 dark:text-violet-300', blob: 'text-violet-200 fill-violet-100 dark:text-violet-400/20 dark:fill-violet-500/10' }
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
          <Link href={`/posts/${post.slug}`} className="block h-full outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-[2rem] bg-white dark:bg-slate-800 transition-all duration-300 shadow-[6px_6px_0px_rgba(203,213,225,0.35)] dark:shadow-[6px_6px_0px_rgba(30,41,59,0.35)] hover:-translate-y-3 hover:translate-x-1 hover:-rotate-1 hover:shadow-[14px_14px_0px_rgba(203,213,225,0.55)] dark:hover:shadow-[14px_14px_0px_rgba(30,41,59,0.55)] border-2 border-slate-200 dark:border-slate-700/80 active:translate-y-1 active:translate-x-1 active:shadow-[2px_2px_0px_rgba(203,213,225,0.45)] dark:active:shadow-[2px_2px_0px_rgba(30,41,59,0.45)] relative flex flex-col overflow-hidden group">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.55),transparent_35%)] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_35%)] pointer-events-none" />

            {/* Thumbnail Cover - Rich colorful blocks */}
            <div className="h-40 sm:h-46 w-full relative overflow-hidden flex items-center justify-center transition-colors bg-slate-50/90 dark:bg-slate-900/50 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#334155_1px,transparent_1px)]">
              <div className="absolute inset-x-10 top-6 h-12 rounded-full bg-white/50 blur-2xl dark:bg-white/10" />
              {/* Decorative Blob */}
              {(() => {
                const Blob = BLOBS[i % BLOBS.length];
                return (
                  <Blob className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] animate-[spin_40s_linear_infinite] opacity-90 group-hover:scale-[1.08] transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${thumbBg.blob}`}/>
                )
              })()}

              {/* Additional scattered doodles within the card banner */}       
              <HandDrawnStar className={`absolute top-4 left-4 w-8 h-8 opacity-0 -translate-y-2 group-hover:opacity-80 group-hover:translate-y-0 group-hover:rotate-[360deg] transition-all duration-700 delay-100 ${thumbBg.text}`} />
              <HandDrawnSparkle className={`absolute bottom-4 left-1/4 w-6 h-6 opacity-0 translate-y-2 group-hover:opacity-80 group-hover:translate-y-0 group-hover:animate-pulse transition-all duration-700 delay-200 ${thumbBg.text}`} />
              <div className="absolute inset-0 bg-white/10 dark:bg-slate-900/10 backdrop-blur-[1px] transition-all duration-500 group-hover:backdrop-blur-sm"></div>
              <div className={`w-[5.5rem] h-[5.5rem] bg-white dark:bg-slate-800/90 backdrop-blur-sm rounded-[1.5rem] shadow-[6px_6px_0px_rgba(0,0,0,0.06)] dark:shadow-[6px_6px_0px_rgba(0,0,0,0.3)] flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border-2 border-slate-100 dark:border-slate-700 ${thumbBg.text}`}>
                <Icon className="w-10 h-10 drop-shadow-sm" />
              </div>
            </div>

            {/* Card Body */}
            <div className="px-6 py-7 flex-1 flex flex-col relative bg-transparent">

              <div className="absolute -top-3 left-6 px-3 py-1 tracking-wider bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:-translate-y-0.5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] border border-slate-100 dark:border-slate-600/60 shadow-sm">
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
                      <span key={tag} className="px-2.5 py-0.5 bg-slate-50/95 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary rounded-full border border-slate-100/50 dark:border-slate-700/30 text-[10px] font-bold tracking-wide transition-colors cursor-pointer shadow-sm shadow-slate-100/80 dark:shadow-none">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between font-bold text-xs mt-1 group-hover:text-primary text-slate-400 dark:text-slate-500 transition-colors uppercase tracking-widest">
                  <span>{readMoreText}</span>
                  <div className={`w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300 ${thumbBg.bg}`}>
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
