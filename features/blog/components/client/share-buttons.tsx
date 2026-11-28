'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Download, Link2, Share2, FileCode2 } from 'lucide-react';
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

  const downloadSharePoster = () => {
    try {
      const width = 1080;
      const height = 640;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no_canvas');

      // 纸质编辑风渐变底板
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#141518');
      grad.addColorStop(1, '#1d1f24');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 细框线
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 2;
      ctx.strokeRect(36, 36, width - 72, height - 72);

      // 顶部标签
      ctx.fillStyle = 'rgba(255,255,255,0.52)';
      ctx.font = '600 18px ui-monospace, Menlo, Consolas, monospace';
      ctx.fillText('ARTICLE SHARE CARD', 78, 108);

      // 分隔线
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(78, 130, 56, 2);

      // 自动换行绘制标题
      const displayTitle = (title || document.title || 'Article').trim();
      ctx.fillStyle = '#f5f5f7';
      ctx.font = '600 46px "LXGW WenKai", "PingFang SC", "Microsoft YaHei", sans-serif';
      const maxTextWidth = width - 156;
      const lines: string[] = [];
      let current = '';
      for (const ch of displayTitle) {
        const test = current + ch;
        if (ctx.measureText(test).width > maxTextWidth && current) {
          lines.push(current);
          current = ch;
          if (lines.length >= 4) break;
        } else {
          current = test;
        }
      }
      if (current && lines.length < 4) lines.push(current);

      let y = 225;
      for (const line of lines) {
        ctx.fillText(line, 78, y);
        y += 66;
      }

      // 底部链接信息
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(78, height - 134, width - 156, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.68)';
      ctx.font = '400 20px ui-monospace, Menlo, Consolas, monospace';
      ctx.fillText(url.slice(0, 72), 78, height - 86);

      const link = document.createElement('a');
      link.download = `${displayTitle.replace(/[\\/:*?"<>|]/g, '-').slice(0, 40) || 'share-card'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('分享海报已保存');
    } catch {
      toast.error('生成分享海报失败');
    }
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
        <DropdownMenuItem onClick={downloadSharePoster} className="cursor-pointer gap-2 text-xs">
          <Download className="h-3.5 w-3.5" />
          保存分享海报 PNG
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
