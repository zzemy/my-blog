"use client"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/routing"
import { ArrowRight, Github, MessageCircle } from "lucide-react"
import { MagneticButton } from "@/shared/visuals/magnetic-button"

export function HomeButtons({ 
  viewPostsText, 
}: { 
  viewPostsText: string 
}) {
  return (
    <div className="grid w-full max-w-2xl grid-cols-3 gap-2 py-4 sm:gap-3">
      <MagneticButton className="w-full min-w-0">
        <Button asChild className="h-10 w-full px-2 text-xs sm:h-11 sm:px-4 sm:text-sm">
          <Link href="/posts" className="flex items-center justify-center whitespace-nowrap">
            <span className="truncate">{viewPostsText}</span>
            <ArrowRight className="ml-1 hidden size-4 sm:inline" />
          </Link>
        </Button>
      </MagneticButton>
      <MagneticButton className="w-full min-w-0">
        <Button variant="outline" asChild className="h-10 w-full px-2 text-xs sm:h-11 sm:px-4 sm:text-sm">
          <Link href="https://github.com/zhalio" target="_blank" rel="noreferrer" className="flex items-center justify-center whitespace-nowrap">
            <Github className="mr-1 hidden size-4 sm:inline" /> <span className="truncate">GitHub</span>
          </Link>
        </Button>
      </MagneticButton>
      <MagneticButton className="w-full min-w-0">
        <Button variant="outline" asChild className="h-10 w-full px-2 text-xs sm:h-11 sm:px-4 sm:text-sm">
          <Link href="https://qm.qq.com/cgi-bin/qm/qr?k=GJV7-av-NF7gsXV13umV8RqQC0Cum5zo" target="_blank" rel="noreferrer" className="flex items-center justify-center whitespace-nowrap">
            <MessageCircle className="mr-1 hidden size-4 sm:inline" /> <span className="truncate">QQ</span>
          </Link>
        </Button>
      </MagneticButton>
    </div>
  )
}
