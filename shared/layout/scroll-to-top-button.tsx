"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 360);
    };

    toggleVisibility();
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "fixed bottom-7 right-6 z-50 h-10 w-10 rounded-full border-border/70 bg-background/80 text-foreground/75 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-background hover:text-foreground dark:border-white/12 dark:bg-[#17181b]/80 md:bottom-8 md:right-8",
        isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      )}
      onClick={scrollToTop}
      aria-label="返回顶部"
      title="返回顶部"
    >
      <ArrowUp className="h-4 w-4" />
    </Button>
  );
}
