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
    <div className="flex flex-wrap items-center justify-start gap-4 py-4 sm:gap-6 w-full">
      <Button asChild size="lg" className="sketch-ui h-12 w-[160px] md:h-14 md:w-[180px] px-4 text-sm md:text-base font-black group">
        <Link href="/posts" className="flex items-center justify-center whitespace-nowrap">
          <span className="truncate">{viewPostsText}</span>
          <HandDrawnArrow className="ml-2 size-5 group-hover:translate-x-1 group-hover:-rotate-12 transition-transform hidden sm:inline stroke-[2px] fill-transparent" />
        </Link>
      </Button>
      <Button variant="outline" asChild size="lg" className="sketch-ui h-12 w-[140px] md:h-14 md:w-[160px] px-4 text-sm md:text-base font-black group hover:bg-neutral-100 dark:hover:bg-neutral-800">
        <Link href="https://github.com/zzemy" target="_blank" rel="noreferrer" className="flex items-center justify-center whitespace-nowrap">
          <span className="truncate">GitHub</span>
        </Link>
      </Button>
      <Button variant="outline" asChild size="lg" className="sketch-ui h-12 w-[140px] md:h-14 md:w-[160px] px-4 text-sm md:text-base font-black group hover:bg-neutral-100 dark:hover:bg-neutral-800">
        <Link href="https://qm.qq.com/cgi-bin/qm/qr?k=GJV7-av-NF7gsXV13umV8RqQC0Cum5zo" target="_blank" rel="noreferrer" className="flex items-center justify-center whitespace-nowrap">
          <span className="truncate">QQ</span>
        </Link>
      </Button>
    </div>
  )
}
