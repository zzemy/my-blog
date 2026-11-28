"use client"

import * as React from "react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { ExternalLink } from "lucide-react"

interface LinkPreviewProps {
  url: string
  children: React.ReactNode
  className?: string
}

function getSafeHostname(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.hostname
  } catch {
    return null
  }
}

export function LinkPreview({ url, children, className }: LinkPreviewProps) {
  const [data, setData] = React.useState<{ title?: string; description?: string; image?: string } | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)

  const hostname = React.useMemo(() => getSafeHostname(url), [url])

  React.useEffect(() => {
    if (isOpen && hostname && !data && !loading && !hasError) {
      setLoading(true)
      fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch')
          return res.json()
        })
        .then((payload) => {
          if (payload.error) throw new Error(payload.error)
          setData(payload)
          setLoading(false)
        })
        .catch(() => {
          setHasError(true)
          setLoading(false)
        })
    }
  }, [isOpen, hostname, url, data, loading, hasError])

  // Internal, anchor, mailto, or invalid URLs render directly without preview card
  if (!hostname) {
    return (
      <a href={url} className={className}>
        {children}
      </a>
    )
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
      <HoverCardContent className="w-80 overflow-hidden p-0" sideOffset={10}>
        {loading ? (
          <div className="flex items-center justify-center space-x-2 p-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs text-muted-foreground">正在加载预览…</span>
          </div>
        ) : hasError ? (
          <div className="p-4 text-xs text-muted-foreground">暂无法获取链接预览</div>
        ) : data ? (
          <div className="flex flex-col bg-popover">
            {data.image && (
              <div className="relative h-40 w-full bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.image}
                  alt={data.title || "Preview image"}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="space-y-2 p-4">
              <h4 className="line-clamp-2 text-sm font-semibold leading-tight">
                {data.title || hostname}
              </h4>
              {data.description && (
                <p className="line-clamp-3 text-xs text-muted-foreground">{data.description}</p>
              )}
              <div className="flex items-center pt-1 text-xs text-muted-foreground">
                <ExternalLink className="mr-1 h-3 w-3" />
                <span className="max-w-[200px] truncate">{hostname}</span>
              </div>
            </div>
          </div>
        ) : null}
      </HoverCardContent>
    </HoverCard>
  )
}
