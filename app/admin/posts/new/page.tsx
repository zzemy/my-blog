'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { pinyin } from 'pinyin-pro'
import type { Content } from '@tiptap/react'
import { TipTapEditor } from '@/features/blog/editor/tiptap-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Save,
  Eye,
  Clock,
  Tag,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Calendar,
  Star,
  Search,
} from 'lucide-react'
import Link from 'next/link'

export default function NewPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const isoToLocalInput = (iso: string) => {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    const yyyy = d.getFullYear()
    const MM = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mm = pad(d.getMinutes())
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
  }
  const nowLocalInput = () => isoToLocalInput(new Date().toISOString())
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    cover_image: '',
    tags: [] as string[],
    content: undefined as Content | undefined,
    published: false,
    locale: 'zh',
    featured: false,
    reading_time: 0,
    published_at: '',
    seo_title: '',
    seo_description: '',
  })

  const [previewTag, setPreviewTag] = useState('')

  const handleSubmit = async (published: boolean) => {
    setError(null)

    // 验证
    const errors = []
    if (!formData.title.trim()) errors.push('标题不能为空')
    if (!formData.slug.trim()) errors.push('URL Slug 不能为空')
    if (!formData.content) errors.push('内容不能为空')
    if (formData.tags.length === 0) errors.push('至少需要一个标签')
    
    if (errors.length > 0) {
      setError(errors.join('，'))
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          reading_time: calculateWordCount(),
          published,
          // 若发布则传递 ISO UTC 时间；未勾选发布则忽略
          // 如果勾选了"设定发布时间" (formData.published) 且有值，则使用该时间，否则使用当前时间
          published_at: published
            ? (formData.published && formData.published_at
                ? new Date(formData.published_at).toISOString()
                : new Date().toISOString())
            : null,
        }),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || '保存失败')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/posts')
      }, 1500)
    } catch (err) {
      console.error('Failed to save post:', err)
      setError(err instanceof Error ? err.message : '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const generateSlug = () => {
    // 使用 pinyin-pro 将标题转换为拼音
    const slug = pinyin(formData.title, { 
      toneType: 'none', 
      type: 'array',
      v: true 
    })
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')

    setFormData({ ...formData, slug })
  }

  const handleAddTag = () => {
    const tag = previewTag.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] })
      setPreviewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tagToRemove),
    })
  }

  const calculateWordCount = () => {
    if (!formData.content) return 0
    // 获取 JSON 字符串长度作为粗略字数，或者更精确地提取文本内容
    // 这里简单使用 JSON 字符串长度，实际可能需要更复杂的逻辑来提取 pure text
    // 但对于 TiTap JSON 结构，JSON.stringify 长度是一个可接受的近似值（虽然会包含 key names）
    // 为了更准确，我们可以尝试简单过滤
    const text = JSON.stringify(formData.content)
    // 简单粗暴：统计非 ASCII 字符算作汉字，其他算作单词？
    // 为了保持一致性和简单性，暂时使用 content 的 string length.
    // 更好的方式其实是 Tiptap editor 提供 word count extension，但这里我们先用 length 兜底
    return text.length
  }

  const wordCount = calculateWordCount()

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* 页头 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin/posts">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回列表
              </Button>
            </Link>
          </div>
          {success && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
              <CheckCircle className="h-4 w-4" />
              保存成功，正在跳转...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主编辑区域 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900 dark:text-red-100">出错了</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* 基础信息卡片 */}
            <Card className="p-6">
              <h2 className="text-base font-semibold mb-5 text-foreground">基础信息</h2>
              <div className="space-y-5">
                {/* 标题 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    标题 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    onBlur={generateSlug}
                    placeholder="输入文章标题..."
                    className="text-base"
                  />
                </div>

                {/* URL Slug */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      placeholder="url-slug"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={generateSlug}
                      variant="outline"
                      size="sm"
                    >
                      自动生成
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    用于文章的 URL 路径
                  </p>
                </div>

                {/* 摘要 */}
                <div>
                  <label className="block text-sm font-medium mb-2">摘要</label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="文章摘要（在列表中显示）"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {formData.description.length}/200
                  </p>
                </div>
              </div>
            </Card>

            {/* SEO 设置 */}
            <Card className="p-6">
              <h2 className="text-base font-semibold mb-5 flex items-center gap-2 text-foreground">
                <Search className="h-4 w-4" />
                SEO 优化
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">SEO 标题</label>
                  <Input
                    value={formData.seo_title || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, seo_title: e.target.value })
                    }
                    placeholder="自定义搜索引擎显示的标题（默认为文章标题）"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    若不填写则直接使用文章标题
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">SEO 描述</label>
                  <Textarea
                     className="h-20"
                    value={formData.seo_description || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, seo_description: e.target.value })
                    }
                    placeholder="自定义搜索引擎显示的描述（默认为文章摘要）"
                  />
                </div>
              </div>
            </Card>

            {/* 封面图片 */}
            <Card className="p-6">
              <h2 className="text-base font-semibold mb-5 flex items-center gap-2 text-foreground">
                <ImageIcon className="h-4 w-4" />
                封面图片
              </h2>
              <div className="space-y-4">
                <Input
                  value={formData.cover_image}
                  onChange={(e) =>
                    setFormData({ ...formData, cover_image: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
                {formData.cover_image && (
                  <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.cover_image}
                      alt="Cover preview"
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* 内容编辑器 */}
            <Card className="p-6">
              <h2 className="text-base font-semibold mb-5 text-foreground">内容 <span className="text-red-500">*</span></h2>
              <TipTapEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="开始编写文章内容..."
              />
            </Card>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 发布设置 */}
            <Card className="p-6">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-foreground">
                <Eye className="h-4 w-4" />
                发布设置
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setFormData({
                          ...formData,
                          published: checked,
                          published_at:
                            checked && !formData.published_at ? nowLocalInput() : formData.published_at,
                        })
                      }}
                      className="h-4 w-4 rounded"
                    />
                    <span className="text-sm font-medium">设定发布时间</span>
                  </label>
                </div>
                
                {formData.published && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Calendar className="inline mr-1 h-4 w-4" />
                      发布时间
                    </label>
                    <Input
                      type="datetime-local"
                      value={formData.published_at}
                      onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) =>
                        setFormData({ ...formData, featured: e.target.checked })
                      }
                      className="h-4 w-4 rounded"
                    />
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      特色文章
                    </span>
                  </label>
                </div>
              </div>
            </Card>

            {/* 文章信息 */}
            <Card className="p-6">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-foreground">
                <Clock className="h-4 w-4" />
                文章信息
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">字数统计</span>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {wordCount}
                  </p>
                  <p className="text-xs text-muted-foreground">字</p>
                </div>
                <Separator />
                <div>
                  <span className="font-medium text-muted-foreground">语言</span>
                  <select
                    value={formData.locale}
                    onChange={(e) =>
                      setFormData({ ...formData, locale: e.target.value })
                    }
                    className="block w-full mt-2 rounded border border-neutral-300 dark:border-neutral-700 bg-background px-3 py-2 text-sm"
                  >
                    <option value="zh">中文</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="ja">日本語</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* 标签管理 */}
            <Card className="p-6">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-foreground">
                <Tag className="h-4 w-4" />
                标签 <span className="text-red-500">*</span>
              </h2>
              <div className="space-y-3">
                {/* 标签输入 */}
                <div className="flex gap-2">
                  <Input
                    value={previewTag}
                    onChange={(e) => setPreviewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="输入标签..."
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    size="sm"
                    variant="outline"
                  >
                    添加
                  </Button>
                </div>

                {/* 标签列表 */}
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <div
                      key={tag}
                      className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* 操作按钮 */}
            <div className="space-y-2 sticky top-8">
              <Button
                onClick={() => handleSubmit(false)}
                disabled={saving}
                variant="outline"
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? '保存中...' : '保存草稿'}
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={saving}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? '发布中...' : '发布文章'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
