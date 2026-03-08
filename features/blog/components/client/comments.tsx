'use client';

import Giscus from '@giscus/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function Comments() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const [enabled, setEnabled] = useState(true); // Optimistic: render immediately, toggle off only if API says so

  useEffect(() => {
    let cancelled = false;
    async function checkSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (cancelled) return;
        if (data.settings?.feature_flags) {
          setEnabled(data.settings.feature_flags.enable_comments !== false);
        }
      } catch (e) {
        console.error(e);
      }
    }
    checkSettings();
    return () => {
      cancelled = true;
    };
  }, []);
  if (!enabled) return (
      <div className="py-10 text-center text-muted-foreground border-t mt-10">
          <p>由于技术原因或维护需要，评论区已暂时关闭。</p>
      </div>
  );

  return (
    <div className="mt-10 animate-in fade-in slide-in-from-bottom-2">
      <Giscus
        id="comments"
        repo="zhalio/my-blog"
        repoId="R_kgDOQZTj3g"
        category="Announcements"
        categoryId="DIC_kwDOQZTj3s4CyBgh"
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={currentTheme === 'dark' ? 'dark' : 'light'}
        lang="zh-CN"
        loading="lazy"
      />
    </div>
  );
}
