'use client';

import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ShareButtons({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors silently
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" className="px-2 py-1 flex items-center gap-2 text-sm" onClick={onCopy} title="复制链接">
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
        <span className="text-muted-foreground">分享</span>
      </Button>
    </div>
  );
}
