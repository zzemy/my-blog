'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Trash2,
  Copy,
  UploadCloud,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Search,
  Loader2,
  CheckSquare,
  Square,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Image from 'next/image'
import { toast } from 'sonner'

interface MediaFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  url: string
  metadata: {
    size: number
    mimetype: string
  }
}

/** 客户端轻量 Canvas WebP 压缩（对 >400KB 的 JPG/PNG 自动优化，GIF/AVIF/小图保持原样） */
async function maybeCompressImage(file: File): Promise<File> {
  if (
    file.size < 400 * 1024 ||
    (file.type !== 'image/jpeg' && file.type !== 'image/png')
  ) {
    return file
  }
  try {
    const bitmap = await createImageBitmap(file)
    const maxDim = 2200
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.86),
    )
    if (!blob || blob.size >= file.size) return file
    const nextName = file.name.replace(/\.(jpe?g|png)$/i, '.webp')
    return new File([blob], nextName, { type: 'image/webp' })
  } catch {
    return file
  }
}

export default function MediaLibraryPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextOffset, setNextOffset] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedNames, setSelectedNames] = useState<string[]>([])
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{
    mode: 'single' | 'bulk'
    filenames: string[]
    references: Record<string, Array<{ id: string; title: string }>>
    checking: boolean
  } | null>(null)

  const fetchFiles = useCallback(async (offset = 0, append = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    try {
      const res = await fetch(`/api/admin/media?limit=48&offset=${offset}`)
      const data = await res.json()
      if (data.files) {
        setFiles((prev) => (append ? [...prev, ...data.files] : data.files))
        setHasMore(Boolean(data.hasMore))
        setNextOffset(Number(data.nextOffset) || offset + data.files.length)
      }
    } catch (error) {
      console.error('Failed to fetch media:', error)
      toast.error('加载媒体列表失败')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    void fetchFiles(0, false)
  }, [fetchFiles])

  const uploadFiles = useCallback(
    async (rawFiles: File[]) => {
      if (rawFiles.length === 0) return
      setUploading(true)
      setUploadProgress({ done: 0, total: rawFiles.length })
      let uploadedCount = 0
      let processedCount = 0

      try {
        for (const originalFile of rawFiles) {
          processedCount += 1
          if (!originalFile.type.startsWith('image/')) {
            toast.error(`「${originalFile.name}」不是有效的图片文件`)
            setUploadProgress({ done: processedCount, total: rawFiles.length })
            continue
          }
          const file = await maybeCompressImage(originalFile)
          if (file.size > 5 * 1024 * 1024) {
            toast.error(`「${file.name}」压缩后仍超过 5MB 限制`)
            setUploadProgress({ done: processedCount, total: rawFiles.length })
            continue
          }

          const formData = new FormData()
          formData.append('file', file)

          const res = await fetch('/api/admin/media', {
            method: 'POST',
            body: formData,
          })

          if (res.ok) {
            uploadedCount += 1
          } else {
            const data = await res.json().catch(() => null)
            toast.error(data?.error || `「${file.name}」上传失败`)
          }
          setUploadProgress({ done: processedCount, total: rawFiles.length })
        }

        if (uploadedCount > 0) {
          toast.success(`成功上传 ${uploadedCount} 张图片（大图已自动优化为 WebP）`)
          await fetchFiles(0, false)
        }
      } catch {
        toast.error('上传失败')
      } finally {
        setUploading(false)
        setUploadProgress(null)
      }
    },
    [fetchFiles],
  )

  // 支持页面内 Ctrl+V 直接粘贴剪贴板图片上传
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      const items = Array.from(event.clipboardData?.items ?? [])
      const imageFiles = items
        .filter((item) => item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter((f): f is File => Boolean(f))
      if (imageFiles.length > 0) {
        event.preventDefault()
        void uploadFiles(imageFiles)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [uploadFiles])

  const handleCopyUrl = (url: string, id: string) => {
    void navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success('图片链接已复制')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const openDeleteDialog = async (filenames: string[], mode: 'single' | 'bulk') => {
    if (filenames.length === 0) return
    setDeleteDialog({ mode, filenames, references: {}, checking: true })
    try {
      const query =
        filenames.length === 1
          ? `checkRef=${encodeURIComponent(filenames[0])}`
          : `checkRefs=${encodeURIComponent(filenames.join(','))}`
      const refRes = await fetch(`/api/admin/media?${query}`)
      if (refRes.ok) {
        const refData = (await refRes.json()) as {
          usedBy?: Array<{ id: string; title: string }>
          references?: Record<string, Array<{ id: string; title: string }>>
        }
        const references: Record<string, Array<{ id: string; title: string }>> =
          refData.references ??
          (refData.usedBy && refData.usedBy.length > 0 ? { [filenames[0]]: refData.usedBy } : {})
        setDeleteDialog((prev) => (prev ? { ...prev, references, checking: false } : null))
        return
      }
    } catch {
      // ignore check errors
    }
    setDeleteDialog((prev) => (prev ? { ...prev, checking: false } : null))
  }

  const handleDelete = (filename: string) => {
    void openDeleteDialog([filename], 'single')
  }

  const handleBulkDelete = () => {
    void openDeleteDialog(selectedNames, 'bulk')
  }

  const executeConfirmedDelete = async () => {
    if (!deleteDialog) return
    const targets = deleteDialog.filenames
    const isBulk = deleteDialog.mode === 'bulk'
    setDeleteDialog(null)

    if (isBulk) {
      setBulkDeleting(true)
    } else {
      setDeleting(targets[0])
    }

    try {
      const results = await Promise.all(
        targets.map(async (name) => {
          const res = await fetch(`/api/admin/media?filename=${encodeURIComponent(name)}`, {
            method: 'DELETE',
          })
          return { name, ok: res.ok }
        }),
      )
      const succeeded = new Set(results.filter((r) => r.ok).map((r) => r.name))
      const failed = results.filter((r) => !r.ok).map((r) => r.name)
      setFiles((current) => current.filter((f) => !succeeded.has(f.name)))
      setSelectedNames((current) => current.filter((n) => !succeeded.has(n)))
      if (failed.length > 0) {
        toast.error(`已删除 ${succeeded.size} 张，${failed.length} 张失败`)
      } else {
        toast.success(isBulk ? `已批量删除 ${succeeded.size} 张图片` : '图片已删除')
      }
    } catch {
      toast.error('删除失败')
    } finally {
      setDeleting(null)
      setBulkDeleting(false)
    }
  }

  const toggleSelect = (name: string) => {
    setSelectedNames((curr) =>
      curr.includes(name) ? curr.filter((n) => n !== name) : [...curr, name],
    )
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? [])
    e.target.value = ''
    await uploadFiles(selectedFiles)
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div
      className="mx-auto max-w-6xl space-y-6 px-4 py-8"
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
        setDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const dropped = Array.from(e.dataTransfer.files ?? []).filter((f) =>
          f.type.startsWith('image/'),
        )
        if (dropped.length > 0) void uploadFiles(dropped)
      }}
    >
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">媒体库</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            支持多图拖拽、Ctrl+V 粘贴上传与大图自动 WebP 压缩（已加载 {files.length} 张）
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedNames.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void handleBulkDelete()}
              disabled={bulkDeleting}
              className="gap-1.5"
            >
              {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              批量删除 ({selectedNames.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchFiles(0, false)}
            disabled={loading}
            className="h-9 w-9 p-0"
            title="刷新列表"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button disabled={uploading} className="relative cursor-pointer overflow-hidden" asChild>
            <label>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理上传中…
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  上传图片
                </>
              )}
              <input
                type="file"
                multiple
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={(e) => void handleFileUpload(e)}
                disabled={uploading}
              />
            </label>
          </Button>
        </div>
      </div>

      {/* 上传进度条 */}
      {uploadProgress && (
        <div className="space-y-1.5 rounded-xl border border-border/80 bg-card p-3.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>正在处理与上传图片…</span>
            <span className="font-mono">
              {uploadProgress.done} / {uploadProgress.total} (
              {Math.round((uploadProgress.done / Math.max(1, uploadProgress.total)) * 100)}%)
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{
                width: `${Math.round((uploadProgress.done / Math.max(1, uploadProgress.total)) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* 拖拽上传引导区 */}
      <div
        className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${
          dragging
            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
            : 'border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900'
        }`}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="搜索文件名…（也可直接拖入图片或按 Ctrl+V 粘贴上传）"
            className="border-none bg-transparent pl-9 placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[16/10] animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 py-20 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <ImageIcon className="mx-auto mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
          <p className="font-medium text-zinc-500 dark:text-zinc-400">暂无图片</p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">拖入图片或点击右上角上传</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFiles.map((file) => {
              const isSelected = selectedNames.includes(file.name)
              return (
                <Card
                  key={file.id || file.name}
                  className={`group relative gap-0 overflow-hidden rounded-lg bg-white p-0 transition-all hover:shadow-md dark:bg-zinc-900 ${
                    isSelected
                      ? 'border-primary ring-1 ring-primary'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSelect(file.name)}
                    aria-label={isSelected ? '取消选择' : '选择图片'}
                    className={`absolute left-2 top-2 z-10 rounded-md bg-background/85 p-1 backdrop-blur-sm transition-opacity ${
                      isSelected ? 'opacity-100 text-primary' : 'opacity-0 text-muted-foreground group-hover:opacity-100'
                    }`}
                  >
                    {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>

                  <div className="relative aspect-[16/10] overflow-hidden border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                    {file.url ? (
                      <Image
                        src={file.url}
                        alt={file.name}
                        fill
                        className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.02]"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-300">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full bg-white/90 text-zinc-900 hover:bg-white"
                        onClick={() => handleCopyUrl(file.url, file.id)}
                        title="复制链接"
                      >
                        {copiedId === file.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 rounded-full"
                        onClick={() => void handleDelete(file.name)}
                        title="删除图片（含引用检查）"
                      >
                        {deleting === file.name ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="p-3">
                    <p
                      className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
                      <span>{formatSize(file.metadata?.size || 0)}</span>
                      <span>{new Date(file.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => void fetchFiles(nextOffset, true)}
                disabled={loadingMore}
                className="gap-2"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                加载更多图片
              </Button>
            </div>
          )}
        </>
      )}
      <Dialog open={Boolean(deleteDialog)} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteDialog?.mode === 'bulk'
                ? `确认批量删除 ${deleteDialog.filenames.length} 张图片`
                : '确认永久删除图片'}
            </DialogTitle>
            <DialogDescription>
              {deleteDialog?.mode === 'single'
                ? `即将删除文件「${deleteDialog.filenames[0]}」，此操作不可撤销。`
                : `即将永久删除选中的 ${deleteDialog?.filenames.length ?? 0} 张图片，此操作不可撤销。`}
            </DialogDescription>
          </DialogHeader>

          {deleteDialog?.checking ? (
            <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>正在检查文章与译文中的图片引用…</span>
            </div>
          ) : deleteDialog && Object.keys(deleteDialog.references).length > 0 ? (
            <div className="space-y-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
              <p className="font-medium">
                ⚠️ 检测到 {Object.keys(deleteDialog.references).length} 张图片正被文章/译文引用，删除后将导致破图：
              </p>
              <ul className="max-h-32 list-disc space-y-1 overflow-y-auto pl-4">
                {Object.entries(deleteDialog.references).map(([name, refs]) => (
                  <li key={name}>
                    <span className="font-mono">{name}</span>：
                    {refs.map((r) => `《${r.title}》`).join('、')}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
              未检测到文章或译文引用，可安全删除。
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              disabled={deleteDialog?.checking}
              onClick={() => void executeConfirmedDelete()}
            >
              确认永久删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
