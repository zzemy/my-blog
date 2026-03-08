'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Save, Loader2, Plus, Trash2 } from 'lucide-react'
import { useForm, useFieldArray, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner' // Assuming you have sommer or similar toast, or use standard alert for now
import { Separator } from '@/components/ui/separator'

// --- Schema & Types ---
const socialLinkSchema = z.object({
  platform: z.string(),
  url: z.string().url('请输入有效的 URL'),
  icon: z.string().optional()
})

const settingsSchema = z.object({
  site_title: z.string().min(1, '网站标题不能为空'),
  site_description: z.string(),
  site_keywords: z.array(z.string()),
  favicon_url: z.string(),
  footer_text: z.string().optional(),
  social_links: z.array(socialLinkSchema).optional(),
  
  // New Fields
  author_info: z.object({
    name: z.string().optional(),
    bio: z.string().optional(),
    avatar_url: z.string().optional()
  }).optional(),
  
  seo_config: z.object({
    google_site_verification: z.string().optional(),
    baidu_site_verification: z.string().optional(),
    og_image: z.string().optional()
  }).optional(),

  feature_flags: z.object({
    enable_comments: z.boolean().optional(),
    enable_footer: z.boolean().optional(),
    enable_registrations: z.boolean().optional(),
    maintenance_mode: z.boolean().optional()
  }).optional()
})

type SiteSettings = z.infer<typeof settingsSchema>

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)
  
  const form = useForm<SiteSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
       site_title: '',
       site_description: '',
       site_keywords: [],
       footer_text: '',
       social_links: [],
       author_info: { name: '', bio: '', avatar_url: '' },
       seo_config: { google_site_verification: '', baidu_site_verification: '', og_image: '' },
       feature_flags: { enable_comments: false, enable_footer: true, enable_registrations: false, maintenance_mode: false }
    }
  })

  const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({
    control: form.control,
    name: "social_links"
  });

  // Keywords handling
  const [keywordInput, setKeywordInput] = useState('')
  const keywords = form.watch('site_keywords') || []

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const settingsRes = await fetch('/api/admin/settings')
      if (!settingsRes.ok) {
        const err = await settingsRes.json().catch(() => null)
        const details = Array.isArray(err?.details)
          ? err.details.join('；')
          : (typeof err?.details === 'string' ? err.details : '')
        throw new Error(details ? `${err?.error || '加载失败'}：${details}` : (err?.error || '加载失败'))
      }
      const data = await settingsRes.json()
      if (data.settings) {
         const s = data.settings
         // Manually sanitize top-level string fields that might be null from DB
         const cleanSettings = {
            ...s,
            site_title: s.site_title ?? '',
            site_description: s.site_description ?? '',
            site_keywords: s.site_keywords ?? [],
            social_links: s.social_links ?? [],
            favicon_url: s.favicon_url ?? '',
            footer_text: s.footer_text ?? '',
            author_info: {
                name: s.author_info?.name ?? '',
                bio: s.author_info?.bio ?? '',
                avatar_url: s.author_info?.avatar_url ?? ''
            },
            seo_config: {
                google_site_verification: s.seo_config?.google_site_verification ?? '',
                baidu_site_verification: s.seo_config?.baidu_site_verification ?? '',
                og_image: s.seo_config?.og_image ?? ''
            },
            feature_flags: {
                enable_comments: s.feature_flags?.enable_comments ?? true,
              enable_footer: s.feature_flags?.enable_footer ?? true,
                enable_registrations: s.feature_flags?.enable_registrations ?? false,
                maintenance_mode: s.feature_flags?.maintenance_mode ?? false
            }
         }

        form.reset(cleanSettings)
      }
    } catch (error) {
      console.error('Failed to load settings', error)
      const message = error instanceof Error ? error.message : '加载设置失败'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [form])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const onSubmit = async (data: SiteSettings) => {
    console.log('Submitting data:', data)
    
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        const details = Array.isArray(err?.details)
          ? err.details.join('；')
          : (typeof err?.details === 'string' ? err.details : '')
        throw new Error(details ? `${err?.error || 'Failed to save'}：${details}` : (err?.error || 'Failed to save'))
      }
      toast.success('所有配置已成功更新')
      // Refresh local data to ensure sync
      fetchData() 
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : '保存失败'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const onInvalid = (errors: FieldErrors<SiteSettings>) => {
    console.error('Form validation errors:', errors)
    const firstError = Object.values(errors)[0] as { message?: string } | undefined
    toast.error(`校验失败: ${firstError?.message || '请检查表单填写'}`)
  }

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      form.setValue('site_keywords', [...keywords, keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const removeKeyword = (kw: string) => {
    form.setValue('site_keywords', keywords.filter(k => k !== kw))
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center border-b pb-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
            <p className="text-muted-foreground mt-2">管理站点的全局配置、SEO 信息及功能开关</p>
        </div>
        <Button onClick={form.handleSubmit(onSubmit, onInvalid)} disabled={saving} className="gap-2 min-w-[120px]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          保存更改
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] bg-muted/50 p-1">
          <TabsTrigger value="general" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">基本设置</TabsTrigger>
          <TabsTrigger value="author" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">作者信息</TabsTrigger>
          <TabsTrigger value="seo" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">SEO & 链接</TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">高级选项</TabsTrigger>
        </TabsList>

        <div className="mt-8 space-y-6">
            
            {/* --- General Settings --- */}
            <TabsContent value="general">
                <Card>
                    <CardHeader>
                        <CardTitle>站点基础信息</CardTitle>
                        <CardDescription>配置博客的标题、描述和版权信息。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                          <Label>主标题（首页大标题）</Label>
                            <Input {...form.register('site_title')} placeholder="我的博客" />
                        </div>
                        <div className="grid gap-2">
                          <Label>副标题（首页副标题）</Label>
                            <Textarea {...form.register('site_description')} placeholder="关于博客的简短介绍..." rows={4} className="resize-none" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Favicon URL</Label>
                            <Input {...form.register('favicon_url')} placeholder="https://..." />
                        </div>
                        <div className="grid gap-2">
                            <Label>页脚文本</Label>
                            <Input {...form.register('footer_text')} placeholder="© 2024 All Rights Reserved" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                          <div className="space-y-0.5">
                            <Label className="text-base">显示页脚</Label>
                            <p className="text-sm text-muted-foreground">关闭后前台将隐藏页脚区域。</p>
                          </div>
                          <Switch
                            checked={form.watch('feature_flags.enable_footer')}
                            onCheckedChange={(checked) => form.setValue('feature_flags.enable_footer', checked)}
                          />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* --- Author Settings --- */}
            <TabsContent value="author">
                <Card>
                    <CardHeader>
                        <CardTitle>作者资料</CardTitle>
                        <CardDescription>设置全局作者展示信息。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>显示名称</Label>
                                <Input {...form.register('author_info.name')} placeholder="Admin" />
                            </div>
                            <div className="space-y-2">
                                <Label>头像 URL</Label>
                                <Input {...form.register('author_info.avatar_url')} placeholder="https://..." />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <Label>个人简介</Label>
                            <Textarea {...form.register('author_info.bio')} placeholder="写一段简短的自我介绍..." className="resize-none" rows={4} />
                         </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* --- SEO & Social --- */}
            <TabsContent value="seo" className="space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>SEO 元数据</CardTitle>
                        <CardDescription>配置搜索引擎验证和 OpenGraph 图片。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>关键词 (Tags)</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={keywordInput} 
                                    onChange={(e) => setKeywordInput(e.target.value)}
                                    placeholder="输入关键词后按回车或添加"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                                />
                                <Button type="button" onClick={handleAddKeyword} variant="secondary">添加</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {keywords.map(kw => (
                                    <span key={kw} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-1 group transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer" onClick={() => removeKeyword(kw)}>
                                        {kw}
                                        <span className="w-3 h-3 group-hover:block hidden">×</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <Label>Google Site Verification</Label>
                                <Input {...form.register('seo_config.google_site_verification')} />
                             </div>
                             <div className="space-y-2">
                                <Label>Baidu Site Verification</Label>
                                <Input {...form.register('seo_config.baidu_site_verification')} />
                             </div>
                        </div>
                        <div className="space-y-2">
                             <Label>默认 OG Image URL</Label>
                             <Input {...form.register('seo_config.og_image')} placeholder="https://.../og.jpg" />
                        </div>
                    </CardContent>
                 </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>社交链接</CardTitle>
                        <CardDescription>管理页脚或侧边栏显示的社交媒体图标。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {socialFields.map((field, index) => (
                            <div key={field.id} className="flex gap-4 items-start animate-in fade-in slide-in-from-left-2">
                                <div className="flex-1 grid grid-cols-3 gap-4">
                                     <Input {...form.register(`social_links.${index}.platform`)} placeholder="平台 (e.g. Github)" />
                                     <Input {...form.register(`social_links.${index}.url`)} placeholder="链接 URL" className="col-span-2" />
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeSocial(index)} className="text-destructive hover:bg-destructive/10">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => appendSocial({ platform: '', url: '' })} className="mt-2">
                            <Plus className="w-4 h-4 mr-2" />
                            添加链接
                        </Button>
                    </CardContent>
                 </Card>
            </TabsContent>

            {/* --- Advanced Settings --- */}
            <TabsContent value="advanced">
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-destructive">功能开关</CardTitle>
                        <CardDescription>控制站点的某些敏感功能或状态。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                            <div className="space-y-0.5">
                                <Label className="text-base">评论系统</Label>
                                <p className="text-sm text-muted-foreground">是否允许用户在文章下发表评论。</p>
                            </div>
                            <Switch 
                                checked={form.watch('feature_flags.enable_comments')}
                                onCheckedChange={(checked) => form.setValue('feature_flags.enable_comments', checked)}
                            />
                        </div>
                         {/* Registration Removed - Not applicable for Personal Blog */}
                         <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-destructive/30">
                            <div className="space-y-0.5">
                                <Label className="text-base text-destructive">维护模式</Label>
                                <p className="text-sm text-destructive/80">开启后，普通用户将无法访问站点内容。</p>
                            </div>
                            <Switch 
                                checked={form.watch('feature_flags.maintenance_mode')}
                                onCheckedChange={(checked) => form.setValue('feature_flags.maintenance_mode', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

        </div>
      </Tabs>
    </div>
  )
}
