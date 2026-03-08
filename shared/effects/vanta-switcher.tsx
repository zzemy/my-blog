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

export function VantaSwitcher() {
  const { setEffect, effect } = useVanta()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title={`Change Background Effect (Current: ${effect})`}
        >
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change Background Effect</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {VANTA_EFFECTS.map((vantaEffect) => (
          <DropdownMenuItem
            key={vantaEffect}
            onClick={() => setEffect(vantaEffect)}
            className={cn(
              "capitalize",
              effect === vantaEffect && "bg-accent text-accent-foreground"
            )}
          >
            {vantaEffect}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
