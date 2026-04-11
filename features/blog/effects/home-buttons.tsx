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
      <Button asChild size="lg" className="h-12 md:h-14 px-8 text-base md:text-lg font-black group bg-[#c4d2ff] hover:bg-[#b0c2ff] active:bg-[#a3b7ff] dark:bg-[#637dff] dark:hover:bg-[#526aeb] text-slate-800 dark:text-white transition-all rounded-full cursor-pointer border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0_0_rgb(15,23,42,1)] dark:shadow-[4px_4px_0_0_rgb(255,255,255,1)] hover:shadow-[6px_6px_0_0_rgb(15,23,42,1)] dark:hover:shadow-[6px_6px_0_0_rgb(255,255,255,1)] hover:-translate-y-1 active:translate-y-1 active:shadow-none hover:rotate-1 duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative overflow-visible">
        <Link href="/posts" className="flex items-center justify-center whitespace-nowrap">
          <span className="truncate mr-3 relative z-10">{viewPostsText}</span>  
          <svg xmlns="http://www.w3.org/2000/svg" className="size-5 relative z-10 group-hover:translate-x-1 group-hover:-rotate-12 transition-transform stroke-[4px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
        </Link>
      </Button>
      <Button variant="outline" asChild size="lg" className="h-12 md:h-14 px-8 text-base md:text-lg font-black group bg-[#a8f0cf] hover:bg-[#8eedc1] active:bg-[#7ce6b6] dark:bg-[#2eaa71] dark:hover:bg-[#25915d] text-slate-800 dark:text-white transition-all rounded-full cursor-pointer border-[3px] border-slate-900 dark:border-white shadow-[4px_4px_0_0_rgb(15,23,42,1)] dark:shadow-[4px_4px_0_0_rgb(255,255,255,1)] hover:shadow-[6px_6px_0_0_rgb(15,23,42,1)] dark:hover:shadow-[6px_6px_0_0_rgb(255,255,255,1)] hover:-translate-y-1 active:translate-y-1 active:shadow-none hover:-rotate-1 duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
        <Link href="https://github.com/zzemy" target="_blank" rel="noreferrer" className="flex items-center justify-center whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2 group-hover:scale-110 group-hover:rotate-12 transition-transform"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
          <span className="truncate">GitHub</span>
        </Link>
      </Button>
    </div>  )
}