"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useVanta, VANTA_EFFECTS } from "./vanta-context"
import { Palette } from "lucide-react"
import { cn } from "@/lib/utils"

const effectLabels = {
  none: "关闭",
  video: "烟雾视频",
} as const

export function VantaSwitcher() {
  const { setEffect, effect } = useVanta()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title={`背景纹理：${effectLabels[effect]}`}
        >
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">切换背景纹理</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {VANTA_EFFECTS.map((vantaEffect) => (
          <DropdownMenuItem
            key={vantaEffect}
            onClick={() => setEffect(vantaEffect)}
            className={cn(
              effect === vantaEffect && "bg-accent text-accent-foreground"
            )}
          >
            {effectLabels[vantaEffect]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
