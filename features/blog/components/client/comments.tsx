'use client';

import Giscus from '@giscus/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface CommentsProps {
  enabled?: boolean;
  lang?: string;
}

export function Comments({ enabled = true, lang = 'zh-CN' }: CommentsProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!enabled) {
    return (
      <div className="mt-10 border-t py-10 text-center text-muted-foreground">
        <p>由于技术原因或维护需要，评论区已暂时关闭。</p>
      </div>
    );
  }

  return (
    <div className="mt-10 animate-in fade-in slide-in-from-bottom-2">
      {mounted ? (
        <Giscus
          id="comments"
          repo="zzemy/my-blog"
          repoId="R_kgDOQZTj3g"
          category="Announcements"
          categoryId="DIC_kwDOQZTj3s4CyBgh"
          mapping="pathname"
          strict="0"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="top"
          theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
          lang={lang}
          loading="lazy"
        />
      ) : (
        <div className="h-44 animate-pulse rounded-xl border border-border/60 bg-muted/25" />
      )}
    </div>
  );
}
