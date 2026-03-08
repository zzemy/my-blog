"use client"

import Lottie from "lottie-react";
import { useEffect, useState } from "react";

export function Lottie404() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    // Try the user provided animation first (without /embed/)
    fetch('https://lottie.host/9866e4f6-f3cd-4476-863d-28f129285123/2j5X252222.json')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => setAnimationData(data))
      .catch(() => {
        // Fallback to a reliable public JSON for 404 (Ghost)
        fetch('https://assets2.lottiefiles.com/packages/lf20_kcsr6fcp.json')
          .then(res => res.json())
          .then(data => setAnimationData(data))
          .catch(e => console.error("Fallback failed", e));
      });
  }, []);

  if (!animationData) return <div className="h-64 w-64 bg-muted/20 animate-pulse rounded-lg" />;

  return (
    <div className="w-full max-w-md mx-auto">
      <Lottie animationData={animationData} loop={true} />
    </div>
  );
}
