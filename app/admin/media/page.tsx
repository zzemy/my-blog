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
  Search
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import Image from 'next/image'

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
    } finally {
      setLoading(false)
    }
  }

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (filename: string) => {
    if (!confirm('确定要永久删除这张图片吗？如果在文章中使用了它，删除后文章中的图片将无法显示。')) return

    setDeleting(filename)
    try {
      const res = await fetch(`/api/admin/media?filename=${filename}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        setFiles(files.filter(f => f.name !== filename))
      } else {
        alert('删除失败')
      }
    } catch {
      alert('删除失败')
    } finally {
      setDeleting(null)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setUploading(true)
      
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('/api/admin/media', {
          method: 'POST',
          body: formData
        })
        
        if (res.ok) {
          fetchFiles() // Refresh list
        } else {
          alert('上传失败')
        }
      } catch {
        alert('上传失败')
      } finally {
        setUploading(false)
        // Reset input
        e.target.value = ''
      }
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">媒体库</h1>
           <p className="text-zinc-500 dark:text-zinc-400 mt-1">管理博客中的所有图片资源 ({files.length})</p>
        </div>
        
        <div className="flex items-center gap-2">
           <Button 
             variant="outline" 
             size="sm" 
             onClick={fetchFiles}
             disabled={loading}
             className="h-9 w-9 p-0"
           >
             <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
           </Button>
           <div className="relative">
             <Button disabled={uploading} className="relative overflow-hidden cursor-pointer" asChild>
                <label>
                   {uploading ? (
                     <>Uploading...</>
                   ) : (
                     <>
                       <UploadCloud className="mr-2 h-4 w-4" />
                       上传图片
                     </>
                   )}
                   <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                </label>
             </Button>
           </div>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
         <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
           <Input 
             placeholder="搜索文件名..." 
             className="pl-9 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-zinc-400"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
         </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
          <ImageIcon className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">暂无图片</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">上传图片后将显示在这里</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="group relative overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all">
              {/* Image Preview */}
              <div className="aspect-square relative bg-zinc-100 dark:bg-zinc-950/50 overflow-hidden">
                {file.url ? (
                   <Image 
                     src={file.url} 
                     alt={file.name}
                     fill
                     className="object-cover transition-transform duration-500 group-hover:scale-110"
                     unoptimized
                   />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-zinc-300">
                      <ImageIcon className="w-8 h-8" />
                   </div>
                )}
                
                {/* Overlay Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                   <Button 
                     size="icon" 
                     variant="secondary" 
                     className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-zinc-900"
                     onClick={() => handleCopyUrl(file.url, file.id)}
                     title="复制链接"
                   >
                     {copiedId === file.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                   </Button>
                   <Button 
                     size="icon" 
                     variant="destructive" 
                     className="h-8 w-8 rounded-full"
                     onClick={() => handleDelete(file.name)}
                     title="删除图片"
                   >
                     {deleting === file.name ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                   </Button>
                </div>
              </div>

              {/* Info Footer */}
              <div className="p-3">
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate" title={file.name}>
                  {file.name}
                </p>
                <div className="flex justify-between items-center mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                  <span>{formatSize(file.metadata?.size || 0)}</span>
                  <span>{new Date(file.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
