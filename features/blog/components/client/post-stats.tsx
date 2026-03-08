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
    const fetchStats = async () => {
      try {
        // Increment view
        await fetch(`/api/stats?slug=${slug}&type=view`, { method: 'POST' });
        
        // Get current stats
        const res = await fetch(`/api/stats?slug=${slug}`, { cache: 'no-store' });
        const data = await res.json();
        setViews(data.views);
        setLikes(data.likes);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Check local storage for like status
    const liked = localStorage.getItem(`liked:${slug}`);
    if (liked) {
      setHasLiked(true);
    }

    fetchStats();
  }, [slug]);

  const handleLike = async () => {
    if (hasLiked) return;

    // Optimistic update
    setLikes(prev => prev + 1);
    setHasLiked(true);
    localStorage.setItem(`liked:${slug}`, 'true');

    try {
      await fetch(`/api/stats?slug=${slug}&type=like`, { method: 'POST' });
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert on error
      setLikes(prev => prev - 1);
      setHasLiked(false);
      localStorage.removeItem(`liked:${slug}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 text-muted-foreground text-sm h-9">
        <div className="flex items-center gap-1">
          <Eye className="size-4 animate-pulse" />
          <span className="w-8 h-4 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex items-center gap-1">
          <Heart className="size-4 animate-pulse" />
          <span className="w-8 h-4 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-muted-foreground text-sm">
      <div className="flex items-center gap-1" title="Views">
        <Eye className="size-4" />
        <span>{views.toLocaleString()}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "flex items-center gap-1 px-2 h-8 hover:bg-red-500/10 hover:text-red-500 transition-colors",
          hasLiked && "text-red-500"
        )}
        onClick={handleLike}
        disabled={hasLiked}
        title="Like this post"
      >
        <Heart className={cn("size-4", hasLiked && "fill-current")} />
        <span>{likes.toLocaleString()}</span>
      </Button>
    </div>
  );
}
