"use client";

import { ReactLenis } from "lenis/react";
import { useEffect, useState } from "react";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [enableLenis, setEnableLenis] = useState(false);

  useEffect(() => {
    const check = () => {
      const isDesktop = window.innerWidth >= 768;
      const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      setEnableLenis(isDesktop && !prefersReduced);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!enableLenis) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.05, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
