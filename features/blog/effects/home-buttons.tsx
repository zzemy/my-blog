"use client"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/routing"

export function HomeButtons({
  viewPostsText,
}: {
  viewPostsText: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-start gap-4 lg:gap-5 w-full mt-4">
      <Button asChild size="lg" className="h-12 md:h-14 px-8 text-base md:text-lg font-bold group bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 hover:from-pink-100 hover:to-rose-100 dark:hover:from-pink-900/40 dark:hover:to-rose-900/40 text-pink-600 dark:text-pink-300 transition-all rounded-full cursor-pointer border border-pink-200 dark:border-pink-800/30 shadow-sm hover:translate-y-[-2px] hover:shadow-md active:translate-y-0 active:shadow-sm duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative overflow-visible">
        <Link href="/posts" className="flex items-center justify-center whitespace-nowrap">
          <span className="truncate mr-3 relative z-10">{viewPostsText}</span>  
          <svg xmlns="http://www.w3.org/2000/svg" className="size-5 relative z-10 group-hover:translate-x-1 group-hover:rotate-12 transition-transform stroke-[2.5px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
        </Link>
      </Button>
      <Button variant="outline" asChild size="lg" className="h-12 md:h-14 px-8 text-base md:text-lg font-bold group bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-800 text-emerald-700 dark:text-emerald-300 transition-all rounded-full cursor-pointer border border-emerald-200 dark:border-emerald-700 shadow-sm hover:translate-y-[-2px] hover:shadow-md active:translate-y-0 active:shadow-sm duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
        <Link href="https://github.com/zzemy" target="_blank" rel="noreferrer" className="flex items-center justify-center whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2 group-hover:scale-110 group-hover:-rotate-12 transition-transform"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
          <span className="truncate">GitHub</span>
        </Link>
      </Button>
    </div>  )
}