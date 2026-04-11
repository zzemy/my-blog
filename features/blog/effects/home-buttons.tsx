"use client"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/routing"
import { HandDrawnArrow } from "@/shared/visuals/doodles"

export function HomeButtons({ 
  viewPostsText, 
}: { 
  viewPostsText: string 
}) {
  return (
    <div className="flex flex-wrap items-center justify-start gap-4 lg:gap-5 w-full mt-4">
      <Button asChild size="lg" className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-black group bg-[#fca5a5] hover:bg-[#f87171] dark:bg-rose-800 dark:hover:bg-rose-700 text-slate-900 dark:text-rose-100 shadow-[4px_4px_0_0_#334155] dark:shadow-[4px_4px_0_0_#94a3b8] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_0_#334155] dark:hover:shadow-[2px_2px_0_0_#94a3b8] transition-all rounded-xl cursor-pointer border-[2.5px] border-slate-800 dark:border-slate-300 sketch-ui">
        <Link href="/posts" className="flex items-center justify-center whitespace-nowrap">
          <span className="truncate mr-2">{viewPostsText}</span>
          <HandDrawnArrow className="size-6 -rotate-12 group-hover:translate-x-2 group-hover:translate-y-[-2px] group-hover:-rotate-0 transition-transform stroke-[2.5px] fill-transparent" />
        </Link>
      </Button>
      <Button variant="outline" asChild size="lg" className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-black group bg-[#fef08a] dark:bg-yellow-900 hover:bg-[#fde047] dark:hover:bg-yellow-800 text-slate-800 dark:text-yellow-100 shadow-[4px_4px_0_0_#334155] dark:shadow-[4px_4px_0_0_#94a3b8] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_0_#334155] dark:hover:shadow-[2px_2px_0_0_#94a3b8] transition-all rounded-xl cursor-pointer border-[2.5px] border-slate-800 dark:border-slate-300 sketch-ui">
        <Link href="https://github.com/zzemy" target="_blank" rel="noreferrer" className="flex items-center justify-center whitespace-nowrap">
          <span className="truncate">GitHub</span>
        </Link>
      </Button>
    </div>
  )
}
