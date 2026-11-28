"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Type,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReadingProgress } from "@/features/blog/components/client/reading-progress";

interface TocItem {
  id: string;
  text: string;
  depth: number;
}

interface PostLayoutProps {
  children: React.ReactNode;
  toc?: TocItem[];
  tocTitle?: string;
}

type ReaderFontSize = "sm" | "md" | "lg" | "xl";
type ReaderWidth = "narrow" | "standard" | "wide";
type ReaderFont = "wenkai" | "sans" | "serif";

type ReaderPrefs = {
  fontSize: ReaderFontSize;
  width: ReaderWidth;
  font: ReaderFont;
};

const DEFAULT_PREFS: ReaderPrefs = {
  fontSize: "md",
  width: "standard",
  font: "wenkai",
};

const PREFS_STORAGE_KEY = "blog-reader-prefs:v1";

const FONT_SIZE_SCALE: Record<ReaderFontSize, { mobile: string; desktop: string; label: string }> = {
  sm: { mobile: "0.96rem", desktop: "1.02rem", label: "小" },
  md: { mobile: "1.0625rem", desktop: "1.125rem", label: "标准" },
  lg: { mobile: "1.15rem", desktop: "1.22rem", label: "大" },
  xl: { mobile: "1.24rem", desktop: "1.32rem", label: "特大" },
};

const WIDTH_CLASS: Record<ReaderWidth, { className: string; label: string }> = {
  narrow: { className: "max-w-[700px]", label: "专注" },
  standard: { className: "max-w-[860px]", label: "标准" },
  wide: { className: "max-w-[1040px]", label: "宽屏" },
};

const FONT_FAMILY_MAP: Record<ReaderFont, { value: string; label: string }> = {
  wenkai: { value: "var(--font-wenkai)", label: "文楷" },
  sans: {
    value: 'system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
    label: "黑体",
  },
  serif: {
    value: '"Iowan Old Style", "Palatino Linotype", Georgia, "Songti SC", "STSong", serif',
    label: "宋体",
  },
};

export function PostLayout({ children, toc = [], tocTitle = "目录" }: PostLayoutProps) {
  const hasToc = toc.length > 0;
  // 桌面端默认展开（CSS 驱动避免水合 CLS），移动端默认收起
  const [desktopCollapsed, setDesktopCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [focusMode, setFocusMode] = React.useState(false);
  const [smoothScrollOn, setSmoothScrollOn] = React.useState(true);
  const [prefs, setPrefs] = React.useState<ReaderPrefs>(DEFAULT_PREFS);
  const [activeId, setActiveId] = React.useState<string>("");
  const tocRef = React.useRef<HTMLDivElement>(null);

  // 读取持久化的读者排版偏好
  React.useEffect(() => {
    try {
      setSmoothScrollOn(window.localStorage.getItem("reader-smooth-scroll") !== "off");
      const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ReaderPrefs>;
      setPrefs({
        fontSize: parsed.fontSize && parsed.fontSize in FONT_SIZE_SCALE ? parsed.fontSize : "md",
        width: parsed.width && parsed.width in WIDTH_CLASS ? parsed.width : "standard",
        font: parsed.font && parsed.font in FONT_FAMILY_MAP ? parsed.font : "wenkai",
      });
    } catch {
      // ignore storage failures
    }
  }, []);

  const updatePrefs = React.useCallback((patch: Partial<ReaderPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // 沉浸阅读模式：隐藏全站顶栏并支持 Esc 退出
  React.useEffect(() => {
    document.documentElement.dataset.readerFocus = focusMode ? "true" : "false";
    if (!focusMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocusMode(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      delete document.documentElement.dataset.readerFocus;
    };
  }, [focusMode]);

  // 监听滚动，更新 activeId
  React.useEffect(() => {
    if (!hasToc) return;

    const handleScroll = () => {
      let currentActiveId = "";
      const offset = 96;

      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 16) {
        if (toc.length > 0) {
          setActiveId(toc[toc.length - 1].id);
          return;
        }
      }

      for (const item of toc) {
        const element = document.getElementById(item.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= offset) {
            currentActiveId = item.id;
          } else {
            break;
          }
        }
      }
      setActiveId(currentActiveId || toc[0]?.id || "");
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // TipTap 客户端挂载后可能更新标题 id，稍后补测一次
    const settleTimer = window.setTimeout(handleScroll, 350);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(settleTimer);
    };
  }, [hasToc, toc]);

  // activeId 变化时平滑保持当前 TOC 项居中可见
  React.useEffect(() => {
    if (!activeId || !tocRef.current) return;
    const activeElement = document.getElementById(`toc-item-${activeId}`);
    if (!activeElement) return;
    const container = tocRef.current;
    const scrollTop =
      activeElement.offsetTop - container.clientHeight / 2 + activeElement.clientHeight / 2;
    container.scrollTo({ top: scrollTop, behavior: "smooth" });
  }, [activeId]);

  const showDesktopSidebar = hasToc && !desktopCollapsed && !focusMode;
  const fontScale = FONT_SIZE_SCALE[prefs.fontSize];

  const readerVars = {
    "--article-font-size": fontScale.mobile,
    "--article-font-size-desktop": fontScale.desktop,
    "--article-font": FONT_FAMILY_MAP[prefs.font].value,
  } as React.CSSProperties;

  return (
    <div className="relative min-h-screen" style={readerVars}>
      <ReadingProgress />

      {/* Mobile TOC Backdrop */}
      {hasToc && mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (TOC) — 仅当文章有目录时渲染 */}
      {hasToc && (
        <aside
          aria-label={tocTitle}
          className={cn(
            "article-toc-sidebar fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-border/70 bg-background/95 backdrop-blur-md transition-transform duration-300 ease-in-out",
            mobileOpen ? "translate-x-0 shadow-lg lg:shadow-none" : "-translate-x-full",
            showDesktopSidebar ? "lg:translate-x-0" : "lg:-translate-x-full",
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex h-12 items-center justify-between border-b border-border/60 px-4">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {tocTitle}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md text-muted-foreground/80 hover:bg-accent/70 hover:text-foreground"
                onClick={() => {
                  setMobileOpen(false);
                  setDesktopCollapsed(true);
                }}
                aria-label="收起目录"
                title="收起目录"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div
              ref={tocRef}
              data-lenis-prevent
              className="no-scrollbar flex-1 overflow-y-auto p-4"
              style={{ scrollbarWidth: "none" }}
            >
              <nav className="space-y-0.5">
                {toc.map((item) => (
                  <a
                    id={`toc-item-${item.id}`}
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const target = document.getElementById(item.id);
                      if (target) {
                        const headerOffset = focusMode ? 32 : 88;
                        if (window.__blogLenis) {
                          window.__blogLenis.scrollTo(target, { offset: -headerOffset });
                        } else {
                          const y = target.getBoundingClientRect().top + window.scrollY - headerOffset;
                          window.scrollTo({ top: y, behavior: "smooth" });
                        }
                        window.history.replaceState(null, "", `#${item.id}`);
                      }
                      setMobileOpen(false);
                    }}
                    className={cn(
                      "block border-l-2 py-1.5 text-[14px] leading-snug transition-colors hover:text-primary -ml-4 pl-4",
                      item.depth === 1 && "font-semibold",
                      item.depth === 2 && "pl-4",
                      item.depth === 3 && "pl-7 text-[13.5px]",
                      item.depth === 4 && "pl-10 text-[13px]",
                      item.depth >= 5 && "pl-12 text-[12.5px]",
                      activeId === item.id
                        ? "border-primary bg-accent/25 font-medium text-primary"
                        : "border-transparent text-foreground/65 hover:border-foreground/35 hover:text-foreground/90",
                    )}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </aside>
      )}

      {/* Left Floating TOC Open Button */}
      {hasToc && (
        <div
          className={cn(
            "article-floating-controls fixed left-4 top-20 z-30 transition-opacity",
            showDesktopSidebar ? "lg:hidden" : "block",
            mobileOpen ? "hidden lg:block" : "",
          )}
        >
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full border-border/80 bg-background/85 shadow-sm backdrop-blur-md"
            onClick={() => {
              if (window.innerWidth >= 1024) {
                setDesktopCollapsed(false);
                setFocusMode(false);
              } else {
                setMobileOpen(true);
              }
            }}
            aria-label="展开目录"
            title="展开目录"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Right Floating Reader Preferences & Focus Mode */}
      <div className="article-floating-controls fixed bottom-20 right-4 z-30 flex flex-col gap-2 sm:right-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-border/80 bg-background/85 shadow-sm backdrop-blur-md"
              aria-label="阅读排版设置"
              title="阅读排版设置"
            >
              <Type className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" side="left" sideOffset={10} className="w-64 space-y-4 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">阅读排版</span>
              <button
                type="button"
                onClick={() => updatePrefs(DEFAULT_PREFS)}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                重置
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground">字号</span>
              <div className="grid grid-cols-4 gap-1">
                {(Object.keys(FONT_SIZE_SCALE) as ReaderFontSize[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updatePrefs({ fontSize: key })}
                    className={cn(
                      "rounded-md border py-1 text-xs transition-colors",
                      prefs.fontSize === key
                        ? "border-primary bg-primary text-primary-foreground font-medium"
                        : "border-border/70 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {FONT_SIZE_SCALE[key].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground">版心宽度</span>
              <div className="grid grid-cols-3 gap-1">
                {(Object.keys(WIDTH_CLASS) as ReaderWidth[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updatePrefs({ width: key })}
                    className={cn(
                      "rounded-md border py-1 text-xs transition-colors",
                      prefs.width === key
                        ? "border-primary bg-primary text-primary-foreground font-medium"
                        : "border-border/70 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {WIDTH_CLASS[key].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground">正文字体</span>
              <div className="grid grid-cols-3 gap-1">
                {(Object.keys(FONT_FAMILY_MAP) as ReaderFont[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updatePrefs({ font: key })}
                    className={cn(
                      "rounded-md border py-1 text-xs transition-colors",
                      prefs.font === key
                        ? "border-primary bg-primary text-primary-foreground font-medium"
                        : "border-border/70 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {FONT_FAMILY_MAP[key].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-3">
              <span className="text-[11px] text-muted-foreground">平滑滚动</span>
              <button
                type="button"
                role="switch"
                aria-checked={smoothScrollOn}
                onClick={() => {
                  const next = !smoothScrollOn;
                  setSmoothScrollOn(next);
                  try {
                    window.localStorage.setItem("reader-smooth-scroll", next ? "on" : "off");
                  } catch {
                    // ignore
                  }
                  window.dispatchEvent(new Event("blog-smooth-scroll-change"));
                }}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                  smoothScrollOn
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 text-muted-foreground hover:text-foreground",
                )}
              >
                {smoothScrollOn ? "开启" : "关闭"}
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant={focusMode ? "default" : "outline"}
          size="icon"
          className="h-9 w-9 rounded-full border-border/80 bg-background/85 shadow-sm backdrop-blur-md"
          onClick={() => setFocusMode((prev) => !prev)}
          aria-label={focusMode ? "退出沉浸阅读" : "沉浸阅读模式"}
          aria-pressed={focusMode}
          title={focusMode ? "退出沉浸阅读 (Esc)" : "沉浸阅读模式"}
        >
          {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Main Content Area */}
      <main
        className={cn(
          "transition-[margin] duration-300 ease-in-out",
          showDesktopSidebar ? "lg:ml-64" : "lg:ml-0",
        )}
      >
        <div
          className={cn(
            "container mx-auto px-4 py-8 transition-[max-width] duration-300 md:px-6 md:py-12",
            WIDTH_CLASS[prefs.width].className,
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
