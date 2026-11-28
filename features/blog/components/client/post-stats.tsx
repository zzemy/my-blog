'use client';

import { useEffect, useState } from 'react';
import { Eye, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PostStatsProps {
  slug: string;
}

export function PostStats({ slug }: PostStatsProps) {
  const [views, setViews] = useState<number>(0);
  const [likes, setLikes] = useState<number>(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const encodedSlug = encodeURIComponent(slug);
    const viewedSessionKey = `viewed:${slug}`;

    const fetchStats = async () => {
      try {
        // 同会话内只记一次阅读量，避免 StrictMode 或刷新重复刷数
        let alreadyViewed = false;
        try {
          alreadyViewed = Boolean(sessionStorage.getItem(viewedSessionKey));
        } catch {
          alreadyViewed = false;
        }

        if (!alreadyViewed) {
          try {
            sessionStorage.setItem(viewedSessionKey, '1');
          } catch {
            // ignore
          }
          const postRes = await fetch(`/api/stats?slug=${encodedSlug}&type=view`, {
            method: 'POST',
          });
          if (postRes.ok) {
            const data = await postRes.json();
            if (!cancelled && typeof data.views === 'number') {
              setViews(data.views);
              setLikes(Number(data.likes) || 0);
              return;
            }
          }
        }

        const res = await fetch(`/api/stats?slug=${encodedSlug}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setViews(Number(data.views) || 0);
          setLikes(Number(data.likes) || 0);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    try {
      setHasLiked(Boolean(localStorage.getItem(`liked:${slug}`)));
    } catch {
      setHasLiked(false);
    }

    void fetchStats();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleLike = async () => {
    if (hasLiked) return;

    setLikes((prev) => prev + 1);
    setHasLiked(true);
    try {
      localStorage.setItem(`liked:${slug}`, 'true');
    } catch {
      // ignore
    }

    try {
      const res = await fetch(`/api/stats?slug=${encodeURIComponent(slug)}&type=like`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('like_failed');
    } catch (error) {
      console.error('Error liking post:', error);
      setLikes((prev) => Math.max(0, prev - 1));
      setHasLiked(false);
      try {
        localStorage.removeItem(`liked:${slug}`);
      } catch {
        // ignore
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-8 items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Eye className="size-4 animate-pulse" />
          <span className="h-4 w-7 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex items-center gap-1">
          <Heart className="size-4 animate-pulse" />
          <span className="h-4 w-6 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-1 tabular-nums" title="阅读量">
        <Eye className="size-4" />
        <span>{views.toLocaleString()}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'flex h-8 items-center gap-1 px-2 tabular-nums transition-colors hover:bg-red-500/10 hover:text-red-500',
          hasLiked && 'text-red-500',
        )}
        onClick={handleLike}
        disabled={hasLiked}
        aria-label={hasLiked ? '已点赞' : '点赞文章'}
        title={hasLiked ? '已点赞' : '点赞文章'}
      >
        <Heart className={cn('size-4', hasLiked && 'fill-current')} />
        <span>{likes.toLocaleString()}</span>
      </Button>
    </div>
  );
}
