"use client"

import { useEffect, useState } from "react"
import { Check, Code, Italic, Sparkles, Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const FONT_STORAGE_KEY = "article-font-preference"

type FontChoice = "system-sans" | "source-han" | "pingfang" | "source-han-serif" | "songti" | "rounded" | "kaiti" | "mono"
type FontSizeChoice = "xs" | "sm" | "base" | "lg" | "xl" | "2xl"

type FontOption = {
  id: FontChoice
  label: string
  hint: string
  stack: string
}

const FONT_OPTIONS: FontOption[] = [
  { 
    id: "system-sans", 
    label: "系统默认", 
    hint: "清晰易读", 
    stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "Microsoft YaHei", sans-serif' 
  },
  { 
    id: "source-han", 
    label: "思源黑体", 
    hint: "现代简洁", 
    stack: '"Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif' 
  },
  { 
    id: "pingfang", 
    label: "苹方/雅黑", 
    hint: "优雅流畅", 
    stack: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif' 
  },
  { 
    id: "source-han-serif", 
    label: "思源宋体", 
    hint: "雅致书卷", 
    stack: '"Noto Serif SC", "Source Han Serif SC", "Songti SC", Georgia, serif' 
  },
  { 
    id: "songti", 
    label: "传统宋体", 
    hint: "经典阅读", 
    stack: '"Songti SC", "STSong", SimSun, "Noto Serif SC", Georgia, serif' 
  },
  { 
    id: "rounded", 
    label: "圆润黑体", 
    hint: "柔和亲切", 
    stack: '"MiSans", "HarmonyOS Sans SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif' 
  },
  { 
    id: "kaiti", 
    label: "楷体", 
    hint: "手写质感", 
    stack: '"Kaiti SC", "STKaiti", KaiTi, "FangSong", serif' 
  },
  { 
    id: "mono", 
    label: "等宽字体", 
    hint: "代码风格", 
    stack: '"Fira Code", "JetBrains Mono", "Source Code Pro", Consolas, "Courier New", monospace' 
  },
]

const FONT_MAP = Object.fromEntries(FONT_OPTIONS.map((o) => [o.id, o.stack])) as Record<FontChoice, string>

const FONT_SIZE_OPTIONS = [
  { id: "xs" as const, label: "特小", size: "0.875rem", lineHeight: "1.6" },
  { id: "sm" as const, label: "小", size: "0.9375rem", lineHeight: "1.65" },
  { id: "base" as const, label: "标准", size: "1rem", lineHeight: "1.7" },
  { id: "lg" as const, label: "大", size: "1.0625rem", lineHeight: "1.75" },
  { id: "xl" as const, label: "特大", size: "1.125rem", lineHeight: "1.8" },
  { id: "2xl" as const, label: "超大", size: "1.25rem", lineHeight: "1.85" },
]

const FONT_SIZE_MAP = Object.fromEntries(FONT_SIZE_OPTIONS.map((o) => [o.id, { size: o.size, lineHeight: o.lineHeight }])) as Record<FontSizeChoice, { size: string; lineHeight: string }>

type StoredPref = { font: FontChoice; size: FontSizeChoice }

function applyFontPreference(pref: StoredPref) {
  const root = document.documentElement
  const fontStack = FONT_MAP[pref.font] ?? FONT_MAP["system-sans"]
  const sizeConfig = FONT_SIZE_MAP[pref.size] ?? FONT_SIZE_MAP["base"]
  
  // 移除旧的动态样式
  const oldStyle = document.getElementById('article-font-dynamic')
  if (oldStyle) oldStyle.remove()
  
  // 创建新的样式标签
  const style = document.createElement('style')
  style.id = 'article-font-dynamic'
  style.textContent = `
    .article-font {
      font-family: ${fontStack} !important;
    }
  `
  document.head.appendChild(style)
  
  root.style.setProperty("--article-font-size", sizeConfig.size)
  root.style.setProperty("--article-line-height", sizeConfig.lineHeight)
  root.dataset.articleFont = pref.font
  root.dataset.articleFontSize = pref.size
}

export function FontToggle() {
  const [font, setFont] = useState<FontChoice>("system-sans")
  const [size, setSize] = useState<FontSizeChoice>("base")

  useEffect(() => {
    if (typeof window === "undefined") return
    const savedRaw = window.localStorage.getItem(FONT_STORAGE_KEY)
    try {
      const parsed = savedRaw ? (JSON.parse(savedRaw) as Partial<StoredPref>) : null
      const initial: StoredPref = {
        font: parsed?.font && parsed.font in FONT_MAP ? (parsed.font as FontChoice) : "system-sans",
        size: parsed?.size && parsed.size in FONT_SIZE_MAP ? (parsed.size as FontSizeChoice) : "base",
      }
      setFont(initial.font)
      setSize(initial.size)
      applyFontPreference(initial)
    } catch {
      applyFontPreference({ font: "system-sans", size: "base" })
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const pref: StoredPref = { font, size }
    applyFontPreference(pref)
    window.localStorage.setItem(FONT_STORAGE_KEY, JSON.stringify(pref))
  }, [font, size])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="切换正文字体">
          {font === "mono" ? <Code className="h-4 w-4" /> : 
           font.includes("serif") || font.includes("songti") || font.includes("kaiti") ? <Italic className="h-4 w-4" /> :
           font === "rounded" ? <Sparkles className="h-4 w-4" /> :
           <Type className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <DropdownMenuLabel>字体样式</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {FONT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.id}
            className="flex items-center justify-between gap-2"
            onSelect={(e) => {
              e.preventDefault()
              setFont(option.id)
            }}
          >
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.hint}</span>
            </div>
            {font === option.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>字号大小</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="grid grid-cols-3 gap-1 px-2 pb-2">
          {FONT_SIZE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setSize(option.id)}
              className={`px-2 py-1.5 text-xs rounded transition-colors ${
                size === option.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
