"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect, useState } from "react";

const SMOOTH_SCROLL_STORAGE_KEY = "reader-smooth-scroll";

declare global {
  interface Window {
    __blogLenis?: {
      scrollTo: (target: number | HTMLElement, options?: { offset?: number; duration?: number }) => void;
    } | null;
  }
}

function LenisBridge() {
  const lenis = useLenis();
  useEffect(() => {
    window.__blogLenis = lenis
      ? {
          scrollTo: (target, options) => {
            lenis.scrollTo(target, options);
          },
        }
      : null;
    return () => {
      window.__blogLenis = null;
    };
  }, [lenis]);
  return null;
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [enableLenis, setEnableLenis] = useState(false);

  useEffect(() => {
    const check = () => {
      const isDesktop = window.innerWidth >= 768;
      const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      let userDisabled = false;
      try {
        userDisabled = localStorage.getItem(SMOOTH_SCROLL_STORAGE_KEY) === "off";
      } catch {
        userDisabled = false;
      }
      setEnableLenis(isDesktop && !prefersReduced && !userDisabled);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("blog-smooth-scroll-change", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("blog-smooth-scroll-change", check);
    };
  }, []);

  if (!enableLenis) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.05, smoothWheel: true }}>
      <LenisBridge />
      {children}
    </ReactLenis>
  );
}
