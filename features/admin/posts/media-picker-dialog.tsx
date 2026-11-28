'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { toast } from 'sonner'
import { Image as ImageIcon, Loader2, RefreshCw, Search, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { uploadImage } from '@/lib/upload-image'

type MediaFileItem = {
  name: string
  url: string
  created_at?: string
}

type MediaPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (url: string) => void
  title?: string
  description?: string
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  title = '从媒体库选择图片',
  description = '点击任意已上传图片即可使用，或直接上传新图片。',
}: MediaPickerDialogProps) {
  const [files, setFiles] = useState<MediaFileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextOffset, setNextOffset] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMedia = useCallback(async (offset = 0, append = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError(null)
    try {
      const res = await fetch(`/api/admin/media?limit=48&offset=${offset}`)
      if (!res.ok) {
        throw new Error('加载媒体库失败')
      }
      const data = await res.json()
      const list = Array.isArray(data.files) ? (data.files as MediaFileItem[]) : []
      const cleaned = list.filter((item) => item && typeof item.url === 'string' && typeof item.name === 'string')
      setFiles((prev) => (append ? [...prev, ...cleaned] : cleaned))
      setHasMore(Boolean(data.hasMore))
      setNextOffset(Number(data.nextOffset) || offset + cleaned.length)
    } catch (err) {
      console.error('Failed to load media library:', err)
      setError(err instanceof Error ? err.message : '加载媒体库失败')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    void fetchMedia(0, false)
  }, [fetchMedia, open])

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const url = await uploadImage(file)
      if (!url) {
        toast.error('图片上传失败，请检查文件格式与大小（不超过 5MB）')
        return
      }
      toast.success('图片上传成功')
      onSelect(url)
      onOpenChange(false)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const normalizedQuery = query.trim().toLowerCase()
  const visibleFiles = normalizedQuery
    ? files.filter((file) => file.name.toLowerCase().includes(normalizedQuery))
    : files

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[82vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[12rem]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="按文件名筛选..."
              className="pl-9"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void handleUpload(event)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchMedia(0, false)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            上传新图片
          </Button>
        </div>

        <div className="min-h-[16rem] max-h-[52vh] overflow-y-auto rounded-lg border border-border/70 p-3">
          {loading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在加载媒体库...
            </div>
          ) : error ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-sm text-destructive">
              <p>{error}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => void fetchMedia(0, false)}>
                  重试
                </Button>
            </div>
          ) : visibleFiles.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="h-7 w-7 opacity-40" />
              <p>{files.length === 0 ? '媒体库暂时没有图片，点击右上角上传。' : '没有匹配的图片。'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {visibleFiles.map((file) => (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => {
                    onSelect(file.url)
                    onOpenChange(false)
                  }}
                  className="group relative flex flex-col overflow-hidden rounded-lg border border-border/70 bg-muted/30 text-left transition-all hover:border-primary hover:ring-2 hover:ring-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-muted/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={file.url}
                      alt={file.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                  <span className="truncate px-2 py-1.5 text-xs text-muted-foreground group-hover:text-foreground">
                    {file.name}
                  </span>
                </button>
              ))}
            </div>
          )}
          {hasMore && !loading && (
            <div className="mt-3 flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loadingMore}
                onClick={() => void fetchMedia(nextOffset, true)}
              >
                {loadingMore ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                加载更多图片
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
