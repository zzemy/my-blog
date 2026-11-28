'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { Input } from '@/components/ui/input'
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

export default function MediaLibraryPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/media')
      const data = await res.json()
      if (data.files) {
        setFiles(data.files)
      }
    } catch (error) {
      console.error('Failed to fetch media:', error)
      toast.error('加载媒体列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success('图片链接已复制')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (filename: string) => {
    if (!confirm('确定要永久删除这张图片吗？如果在文章中使用了它，删除后文章中的图片将无法显示。')) return

    setDeleting(filename)
    try {
      const res = await fetch(`/api/admin/media?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setFiles((current) => current.filter((f) => f.name !== filename))
        toast.success('图片已删除')
      } else {
        const data = await res.json().catch(() => null)
        toast.error(data?.error || '删除失败')
      }
    } catch {
      toast.error('删除失败')
    } finally {
      setDeleting(null)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? [])
    if (selectedFiles.length === 0) return

    setUploading(true)
    let uploadedCount = 0

    try {
      for (const file of selectedFiles) {
        if (!file.type.startsWith('image/')) {
          toast.error(`「${file.name}」不是有效的图片文件`)
          continue
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`「${file.name}」超过 5MB 限制`)
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
      }

      if (uploadedCount > 0) {
        toast.success(`成功上传 ${uploadedCount} 张图片`)
        await fetchFiles()
      }
    } catch {
      toast.error('上传失败')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
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
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">媒体库</h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">管理博客中的所有图片资源 ({files.length})</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFiles}
            disabled={loading}
            className="h-9 w-9 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <div className="relative">
            <Button disabled={uploading} className="relative cursor-pointer overflow-hidden" asChild>
              <label>
                {uploading ? (
                  <>上传中…</>
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
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-zinc-400" />
          <Input
            placeholder="搜索文件名..."
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
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">上传图片后将显示在这里</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFiles.map((file) => (
            <Card
              key={file.id}
              className="group relative gap-0 overflow-hidden rounded-lg border-zinc-200 bg-white p-0 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
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
                    onClick={() => handleDelete(file.name)}
                    title="删除图片"
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
                <p className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300" title={file.name}>
                  {file.name}
                </p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
                  <span>{formatSize(file.metadata?.size || 0)}</span>
                  <span>{new Date(file.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
