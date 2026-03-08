"use client";

import { useEffect, useState } from "react";

interface TypewriterEffectProps {
  text: string;
  speed?: number;
  waitBeforeDelete?: number;
  waitBeforeRestart?: number;
  cursor?: boolean;
  loop?: boolean;
}

export function TypewriterEffect({
  text,
  speed = 100,
  waitBeforeDelete = 2000,
  waitBeforeRestart = 500,
  cursor = true,
  loop = true,
}: TypewriterEffectProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleTyping = () => {
      const currentLength = displayedText.length;
      const fullLength = text.length;

      if (!isDeleting) {
        // Typing
        if (currentLength < fullLength) {
          setDisplayedText(text.slice(0, currentLength + 1));
          timeout = setTimeout(handleTyping, speed);
        } else {
          // Finished typing
          if (loop) {
            timeout = setTimeout(() => setIsDeleting(true), waitBeforeDelete);
          }
        }
      } else {
        // Clearing phase
        if (currentLength > 0) {
          // Clear immediately
          setDisplayedText("");
          // The effect will re-run because of state change
        } else {
          // Text is cleared, wait before restarting
          timeout = setTimeout(() => setIsDeleting(false), waitBeforeRestart);
        }
      }
    };

    // Start the typing loop
    timeout = setTimeout(handleTyping, speed);

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, text, speed, waitBeforeDelete, waitBeforeRestart, loop]);

  return (
    <span className="inline-block min-h-[1.5em]">
      {displayedText}
      {cursor && (
        <span className="ml-1 animate-pulse font-bold text-primary">|</span>
      )}
    </span>
  );
}
