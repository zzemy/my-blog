"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReadingProgress } from "@/features/blog/components/client/reading-progress";

interface TocItem {
  id: string;
  text: string;
  depth: number;
}

interface PostLayoutProps {
  children: React.ReactNode;
  toc?: TocItem[];
}

export function PostLayout({ children, toc = [] }: PostLayoutProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string>("");
  const tocRef = React.useRef<HTMLDivElement>(null);

  // Initialize state based on screen size
  React.useEffect(() => {
    if (window.innerWidth >= 1024) {
      setIsOpen(true);
    }
  }, []);

  // 监听滚动，更新 activeId
  React.useEffect(() => {
    const handleScroll = () => {
      let currentActiveId = "";
      // Offset to account for sticky header (h-14 = 56px) + some buffer
      // Reducing this ensures we don't highlight the next section too early
      // while the user is still reading the end of the previous one.
      const offset = 80;

      // Handle bottom of page case
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
         if (toc.length > 0) {
             setActiveId(toc[toc.length - 1].id);
             return;
         }
      }

      for (const item of toc) {
        const element = document.getElementById(item.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          // If the element is above the offset, it's the current active section
          if (rect.top <= offset) {
            currentActiveId = item.id;
          } else {
            break;
          }
        }
      }
      setActiveId(currentActiveId);
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

    window.addEventListener("scroll", onScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", onScroll);
  }, [toc]);

  // 监听 activeId 变化，自动滚动 TOC
  React.useEffect(() => {
    if (activeId && isOpen) {
      const activeElement = document.getElementById(`toc-item-${activeId}`);
      if (activeElement && tocRef.current) {
        // 简单的计算，保持高亮项在视口中间附近，或者直接 scrollIntoView
        // 使用 scrollIntoView 可能导致整个页面滚动，需要小心配置
        // 这里我们只滚动 tocRef 容器
        const container = tocRef.current;
        const offsetTop = activeElement.offsetTop;
        const containerHeight = container.clientHeight;
        const scrollTop = offsetTop - containerHeight / 2 + activeElement.clientHeight / 2;
        
        container.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }
  }, [activeId, isOpen]);

  return (
    <div className="relative min-h-screen">
      <ReadingProgress />
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar (TOC) */}
      <aside
        className={cn(
          // Sidebar is fixed on the left; hidden by translate-x when closed on all breakpoints
          "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] border-r bg-background transition-all duration-300 ease-in-out w-64",
          isOpen ? "translate-x-0 shadow-lg lg:shadow-none" : "-translate-x-full"
        )}
      >
        <div className={cn("flex h-full flex-col")}>
            {/* Fixed Header in Sidebar */}
            <div className="flex items-center justify-between border-b p-4">
                <span className="text-sm font-semibold">目录</span>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => setIsOpen(false)}
                    title="收起目录"
                >
                    <PanelLeftClose className="h-4 w-4" />
                </Button>
            </div>

            {/* Scrollable Content */}
            <div 
              ref={tocRef}
              className="flex-1 overflow-y-auto p-4 no-scrollbar touch-auto pointer-events-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
              onWheel={(event) => {
                // Ensure scrolling affects the TOC container instead of bubbling to the page
                if (!tocRef.current) return;
                event.preventDefault();
                event.stopPropagation();
                tocRef.current.scrollTop += event.deltaY;
              }}
            >
                <div className="space-y-1">
                    {toc.map((item) => (
                    <a
                        id={`toc-item-${item.id}`}
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const target = document.getElementById(item.id);
                          if (target) {
                            const headerOffset = 80; // 与滚动监听 offset 保持一致
                            const rect = target.getBoundingClientRect();
                            const y = rect.top + window.pageYOffset - headerOffset;
                            window.scrollTo({ top: y, behavior: 'smooth' });
                          }
                          if (window.innerWidth < 1024) {
                            setIsOpen(false);
                          }
                        }}
                        className={cn(
                        "block text-sm transition-colors hover:text-primary py-1.5 border-l-2 pl-4 -ml-4",
                        item.depth === 1 && "font-bold",
                        item.depth === 2 && "pl-4",
                        item.depth === 3 && "pl-8",
                        item.depth === 4 && "pl-12",
                        item.depth === 5 && "pl-16",
                        item.depth >= 6 && "pl-20",
                        activeId === item.id
                            ? "border-primary font-medium text-primary bg-accent/10"
                            : "border-transparent text-muted-foreground hover:border-muted-foreground/50"
                        )}
                    >
                        {item.text}
                    </a>
                    ))}
                </div>
            </div>
        </div>
      </aside>

      {/* Toggle Button (Visible when collapsed) */}
        {!isOpen && (
          <div className="fixed left-4 top-20 z-40">
            <Button
            variant="outline"
            size="icon"
            className="rounded-full shadow-md bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(true)}
            title="展开目录"
            >
                <PanelLeftOpen className="h-4 w-4" />
            </Button>
        </div>
      )}

      {/* Main Content Area */}
      <main
        className={cn(
          "transition-all duration-300 ease-in-out",
          isOpen ? "lg:ml-64" : "lg:ml-0"
        )}
      >
        <div className="container mx-auto max-w-4xl px-4 py-8 pt-24 md:pt-12 md:px-6">
            {children}
        </div>
      </main>
    </div>
  );
}
