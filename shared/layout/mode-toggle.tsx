"use client"

import * as React from "react"
import { Monitor, Moon, Sparkles, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  useVanta,
  VANTA_EFFECTS,
  VANTA_EFFECT_LABELS,
} from "@/shared/effects/vanta-context"
import { cn } from "@/lib/utils"

interface ModeToggleProps {
  simple?: boolean
}

export function ModeToggle({ simple = false }: ModeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { effect, setEffect } = useVanta()

  if (simple) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={resolvedTheme === "dark" ? "切换至浅色模式" : "切换至深色模式"}
        title={resolvedTheme === "dark" ? "切换至浅色模式" : "切换至深色模式"}
        className="relative size-8 rounded-lg text-foreground/65 transition-colors duration-200 hover:bg-foreground/[0.06] hover:text-foreground dark:hover:bg-white/[0.08]"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
        <span className="sr-only">切换明暗主题</span>
      </Button>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="外观与主题设置"
          title="外观与主题设置"
          className="relative size-8 rounded-lg text-foreground/65 transition-colors duration-200 hover:bg-foreground/[0.06] hover:text-foreground dark:hover:bg-white/[0.08]"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
          <span className="sr-only">外观与主题设置</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-60 space-y-4 p-3.5">
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-muted-foreground">主题模式</div>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: "light", label: "浅色", icon: Sun },
              { id: "dark", label: "深色", icon: Moon },
              { id: "system", label: "系统", icon: Monitor },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                className={cn(
                  "flex items-center justify-center gap-1 rounded-md border py-1.5 text-xs transition-colors",
                  theme === id
                    ? "border-primary bg-primary text-primary-foreground font-medium"
                    : "border-border/70 text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>页面背景氛围</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {VANTA_EFFECTS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setEffect(item)}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-xs transition-colors",
                  effect === item
                    ? "border-primary bg-primary text-primary-foreground font-medium"
                    : "border-border/70 text-muted-foreground hover:text-foreground",
                )}
              >
                {VANTA_EFFECT_LABELS[item]}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
