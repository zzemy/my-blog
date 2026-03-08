"use client"

import * as React from "react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { ExternalLink } from "lucide-react"

interface LinkPreviewProps {
  url: string
  children: React.ReactNode
  className?: string
}

export function LinkPreview({ url, children, className }: LinkPreviewProps) {
  const [data, setData] = React.useState<{ title?: string, description?: string, image?: string } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && !data && !loading && !hasError) {
      setLoading(true);
      fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        })
        .then(data => {
            if (data.error) throw new Error(data.error);
            setData(data);
            setLoading(false);
        })
        .catch(() => {
            setHasError(true);
            setLoading(false);
        });
    }
  }, [isOpen, url, data, loading, hasError]);

  // If it's an internal link or anchor, just render the link
  if (url.startsWith('/') || url.startsWith('#')) {
      return <a href={url} className={className}>{children}</a>;
  }

  return (
    <HoverCard open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={className}
            onClick={(e) => e.stopPropagation()}
        >
          {children}
        </a>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-0 overflow-hidden" sideOffset={10}>
        {loading ? (
            <div className="p-4 flex items-center justify-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span className="text-xs text-muted-foreground">Loading preview...</span>
            </div>
        ) : hasError ? (
             <div className="p-4 text-xs text-muted-foreground">
                Preview unavailable
             </div>
        ) : data ? (
            <div className="flex flex-col bg-popover">
                {data.image && (
                    <div className="relative h-40 w-full bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={data.image} 
                            alt={data.title || "Preview image"} 
                            className="object-cover w-full h-full" 
                        />
                    </div>
                )}
                <div className="p-4 space-y-2">
                    <h4 className="text-sm font-semibold line-clamp-2 leading-tight">{data.title}</h4>
                    {data.description && <p className="text-xs text-muted-foreground line-clamp-3">{data.description}</p>}
                    <div className="flex items-center pt-1 text-xs text-muted-foreground">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        <span className="truncate max-w-[200px]">{new URL(url).hostname}</span>
                    </div>
                </div>
            </div>
        ) : null}
      </HoverCardContent>
    </HoverCard>
  )
}
