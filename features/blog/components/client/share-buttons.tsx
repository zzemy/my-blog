'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Link2, Share2, FileCode2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ShareButtonsProps {
  url: string;
  title?: string;
  label?: string;
}

export function ShareButtons({ url, title, label = '分享' }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const flashCopied = () => {
    setCopied(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      flashCopied();
      toast.success('文章链接已复制');
    } catch {
      toast.error('复制失败，请手动复制地址栏链接');
    }
  };

  const copyMarkdown = async () => {
    try {
      const md = `[${title || url}](${url})`;
      await navigator.clipboard.writeText(md);
      flashCopied();
      toast.success('已复制 Markdown 引用');
    } catch {
      toast.error('复制失败');
    }
  };

  const nativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: title || document.title, url });
        return;
      } catch {
        // user cancelled or unsupported
      }
    }
    await copyLink();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex h-8 items-center gap-1.5 px-2 text-sm text-muted-foreground hover:text-foreground"
          title={label}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
          <span>{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => void copyLink()} className="cursor-pointer gap-2 text-xs">
          <Link2 className="h-3.5 w-3.5" />
          复制文章链接
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void copyMarkdown()} className="cursor-pointer gap-2 text-xs">
          <FileCode2 className="h-3.5 w-3.5" />
          复制 Markdown 引用
        </DropdownMenuItem>
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <DropdownMenuItem onClick={() => void nativeShare()} className="cursor-pointer gap-2 text-xs">
            <Share2 className="h-3.5 w-3.5" />
            系统分享…
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
