"use client";

import * as React from "react";

interface FallbackBannerProps {
  postId: string;
  message: string;
}

export function FallbackBanner({ postId, message }: FallbackBannerProps) {
  const storageKey = `fallbackNoteHidden:${postId}`;
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v === 'true') {
        setHidden(true);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const onClose = () => {
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {
      // ignore
    }
    setHidden(true);
  };

  if (hidden) return null;

  return (
    <div className="mb-4 rounded-md px-3 py-2 text-sm bg-yellow-50 text-amber-800 dark:bg-yellow-900/30 dark:text-amber-300 flex items-start justify-between">
      <div className="flex-1">{message}</div>
      <button
        aria-label="Close"
        onClick={onClose}
        className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/5"
      >
        <span className="text-sm">✕</span>
      </button>
    </div>
  );
}
