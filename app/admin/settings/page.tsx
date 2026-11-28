'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Save, Loader2, Plus, Trash2, Mail, Monitor, Smartphone, Send } from 'lucide-react'
import { useForm, useFieldArray, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'

const socialLinkSchema = z.object({
  platform: z.string().min(1, '请填写平台名称'),
  url: z.string().url('请输入有效的 URL'),
  icon: z.string().optional(),
})

const settingsSchema = z.object({
  site_title: z.string().min(1, '网站标题不能为空'),
  site_description: z.string(),
  site_keywords: z.array(z.string()),
  favicon_url: z.string(),
  footer_text: z.string().optional(),
  social_links: z.array(socialLinkSchema).optional(),
  author_info: z
    .object({
      name: z.string().optional(),
      bio: z.string().optional(),
      avatar_url: z.string().optional(),
    })
    .optional(),
  seo_config: z
    .object({
      google_site_verification: z.string().optional(),
      baidu_site_verification: z.string().optional(),
      og_image: z.string().optional(),
    })
    .optional(),
  feature_flags: z
    .object({
      enable_comments: z.boolean().optional(),
      enable_footer: z.boolean().optional(),
      enable_registrations: z.boolean().optional(),
      maintenance_mode: z.boolean().optional(),
    })
    .optional(),
})

type SiteSettings = z.infer<typeof settingsSchema>
type EmailTemplateType = 'weekly' | 'comment' | 'friend' | 'alert'

const EMAIL_TEMPLATES: Array<{ id: EmailTemplateType; label: string; desc: string }> = [
  { id: 'weekly', label: '每周简报', desc: '每周一定时发送的阅读、草稿与运行状态摘要' },
  { id: 'comment', label: 'Giscus 新评论', desc: '访客在文章或留言板发表新评论时的即时提醒' },
  { id: 'friend', label: '友链申请', desc: '收到新友链交换申请时的审核提醒' },
  { id: 'alert', label: '后台登录提醒', desc: '后台管理员登录时的安全通知' },
]

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Email preview state
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplateType>('weekly')
  const [emailViewport, setEmailViewport] = useState<'desktop' | 'mobile'>('desktop')
  const [emailPreview, setEmailPreview] = useState<{ subject: string; html: string } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [sendingTestEmail, setSendingTestEmail] = useState(false)

  const form = useForm<SiteSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      site_title: '',
      site_description: '',
      site_keywords: [],
      favicon_url: '',
      footer_text: '',
      social_links: [],
      author_info: { name: '', bio: '', avatar_url: '' },
      seo_config: { google_site_verification: '', baidu_site_verification: '', og_image: '' },
      feature_flags: {
        enable_comments: true,
        enable_footer: true,
        enable_registrations: false,
        maintenance_mode: false,
      },
    },
  })

  const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({
    control: form.control,
    name: 'social_links',
  })

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
          : typeof err?.details === 'string'
            ? err.details
            : ''
        throw new Error(details ? `${err?.error || '加载失败'}：${details}` : err?.error || '加载失败')
      }
      const data = await settingsRes.json()
      if (data.settings) {
        const s = data.settings
        const cleanSettings: SiteSettings = {
          site_title: s.site_title ?? '',
          site_description: s.site_description ?? '',
          site_keywords: s.site_keywords ?? [],
          social_links: s.social_links ?? [],
          favicon_url: s.favicon_url ?? '',
          footer_text: s.footer_text ?? '',
          author_info: {
            name: s.author_info?.name ?? '',
            bio: s.author_info?.bio ?? '',
            avatar_url: s.author_info?.avatar_url ?? '',
          },
          seo_config: {
            google_site_verification: s.seo_config?.google_site_verification ?? '',
            baidu_site_verification: s.seo_config?.baidu_site_verification ?? '',
            og_image: s.seo_config?.og_image ?? '',
          },
          feature_flags: {
            enable_comments: s.feature_flags?.enable_comments ?? true,
            enable_footer: s.feature_flags?.enable_footer ?? true,
            enable_registrations: s.feature_flags?.enable_registrations ?? false,
            maintenance_mode: s.feature_flags?.maintenance_mode ?? false,
          },
        }
        form.reset(cleanSettings)
      }
    } catch (error) {
      console.error('Failed to load settings', error)
      toast.error(error instanceof Error ? error.message : '加载设置失败')
    } finally {
      setLoading(false)
    }
  }, [form])

  const loadEmailPreview = useCallback(async (template: EmailTemplateType) => {
    setPreviewLoading(true)
    try {
      const res = await fetch(`/api/admin/email/preview?template=${template}`)
      if (!res.ok) throw new Error('加载预览失败')
      const data = await res.json()
      setEmailPreview({ subject: data.subject, html: data.html })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加载邮件预览失败')
    } finally {
      setPreviewLoading(false)
    }
  }, [])

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true)
    try {
      const res = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: emailTemplate }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || '发送测试邮件失败')
      }
      toast.success('测试邮件已发出，请查收管理员邮箱')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '发送测试邮件失败')
    } finally {
      setSendingTestEmail(false)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  useEffect(() => {
    void loadEmailPreview(emailTemplate)
  }, [emailTemplate, loadEmailPreview])

  const onSubmit = async (data: SiteSettings) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        const details = Array.isArray(err?.details)
          ? err.details.join('；')
          : typeof err?.details === 'string'
            ? err.details
            : ''
        throw new Error(details ? `${err?.error || '保存失败'}：${details}` : err?.error || '保存失败')
      }
      toast.success('所有配置已成功更新并同步前台')
      void fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const onInvalid = (errors: FieldErrors<SiteSettings>) => {
    const firstError = Object.values(errors)[0] as { message?: string } | undefined
    toast.error(`校验失败: ${firstError?.message || '请检查表单填写'}`)
  }

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim()
    if (trimmed && !keywords.includes(trimmed)) {
      form.setValue('site_keywords', [...keywords, trimmed])
      setKeywordInput('')
    }
  }

  const removeKeyword = (kw: string) => {
    form.setValue(
      'site_keywords',
      keywords.filter((k) => k !== kw),
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
          <p className="mt-2 text-muted-foreground">
            管理站点全局信息、作者名片、SEO、功能开关与自动化邮件预览
          </p>
        </div>
        <Button
          onClick={form.handleSubmit(onSubmit, onInvalid)}
          disabled={saving}
          className="min-w-[120px] gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          保存更改
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1 lg:w-[700px]">
          <TabsTrigger value="general" className="transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
            基本设置
          </TabsTrigger>
          <TabsTrigger value="author" className="transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
            作者信息
          </TabsTrigger>
          <TabsTrigger value="seo" className="transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
            SEO & 链接
          </TabsTrigger>
          <TabsTrigger value="emails" className="transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
            邮件预览
          </TabsTrigger>
          <TabsTrigger value="advanced" className="transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
            高级选项
          </TabsTrigger>
        </TabsList>

        <div className="mt-8 space-y-6">
          {/* 基本设置 */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>站点基础信息</CardTitle>
                <CardDescription>配置博客标题、简介、Favicon 与页脚（保存后实时同步全站）。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label>主标题（品牌名 / 首页大标题）</Label>
                  <Input {...form.register('site_title')} placeholder="emmm" />
                </div>
                <div className="grid gap-2">
                  <Label>副标题（首页副标题 / SEO 默认描述）</Label>
                  <Textarea
                    {...form.register('site_description')}
                    placeholder="关于博客的简短介绍..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Favicon URL</Label>
                  <Input {...form.register('favicon_url')} placeholder="留空使用默认动态图标 /icon" />
                </div>
                <div className="grid gap-2">
                  <Label>页脚寄语文本</Label>
                  <Input {...form.register('footer_text')} placeholder="慢下来，写给时间与自己。" />
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">显示页脚</Label>
                    <p className="text-sm text-muted-foreground">关闭后前台将隐藏全站页脚区域。</p>
                  </div>
                  <Switch
                    checked={form.watch('feature_flags.enable_footer')}
                    onCheckedChange={(checked) => form.setValue('feature_flags.enable_footer', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 作者信息 */}
          <TabsContent value="author">
            <Card>
              <CardHeader>
                <CardTitle>作者资料</CardTitle>
                <CardDescription>将展示在文章署名、RSS 订阅源与友链交换卡片中。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>显示名称</Label>
                    <Input {...form.register('author_info.name')} placeholder="emmm" />
                  </div>
                  <div className="space-y-2">
                    <Label>头像 URL</Label>
                    <Input {...form.register('author_info.avatar_url')} placeholder="https://..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>个人简介</Label>
                  <Textarea
                    {...form.register('author_info.bio')}
                    placeholder="写一段简短的自我介绍..."
                    className="resize-none"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO & 社交链接 */}
          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO 元数据</CardTitle>
                <CardDescription>配置站点关键词、搜索引擎验证令牌与默认 OpenGraph 图片。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>关键词 (Keywords)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      placeholder="输入关键词后按回车或添加"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddKeyword()
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddKeyword} variant="secondary">
                      添加
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {keywords.map((kw) => (
                      <span
                        key={kw}
                        className="group flex cursor-pointer items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary transition-colors hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeKeyword(kw)}
                      >
                        {kw}
                        <span className="hidden h-3 w-3 group-hover:block">×</span>
                      </span>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                <CardDescription>动态渲染至顶栏、移动端抽屉、页脚与关于页名片。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {socialFields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-4 animate-in fade-in slide-in-from-left-2">
                    <div className="grid flex-1 grid-cols-3 gap-4">
                      <Input
                        {...form.register(`social_links.${index}.platform`)}
                        placeholder="平台 (如 GitHub)"
                      />
                      <Input
                        {...form.register(`social_links.${index}.url`)}
                        placeholder="链接 URL"
                        className="col-span-2"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSocial(index)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendSocial({ platform: '', url: '' })}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  添加链接
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 邮件模板实时预览与测试发送 */}
          <TabsContent value="emails">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      自动化邮件模板预览
                    </CardTitle>
                    <CardDescription className="mt-1">
                      实时检视周报、评论、友链与安全登录通知的视觉排版，并支持发送测试邮件到你的管理员邮箱。
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
                      <button
                        type="button"
                        onClick={() => setEmailViewport('desktop')}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors ${
                          emailViewport === 'desktop'
                            ? 'bg-background font-medium text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Monitor className="h-3.5 w-3.5" />
                        桌面
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailViewport('mobile')}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors ${
                          emailViewport === 'mobile'
                            ? 'bg-background font-medium text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                        手机
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => void handleSendTestEmail()}
                      disabled={sendingTestEmail}
                      className="gap-1.5"
                    >
                      {sendingTestEmail ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      发送测试邮件
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-2 sm:grid-cols-4">
                  {EMAIL_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setEmailTemplate(tpl.id)}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        emailTemplate === tpl.id
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border/70 text-muted-foreground hover:border-foreground/25 hover:text-foreground'
                      }`}
                    >
                      <div className="text-xs font-semibold">{tpl.label}</div>
                      <div className="mt-1 line-clamp-2 text-[11px] opacity-75">{tpl.desc}</div>
                    </button>
                  ))}
                </div>

                {emailPreview?.subject && (
                  <div className="rounded-lg border border-border/70 bg-muted/30 px-3.5 py-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">邮件主题：</span>
                    {emailPreview.subject}
                  </div>
                )}

                <div className="flex justify-center rounded-xl border border-border/70 bg-[#ecece8] p-4 dark:bg-zinc-900">
                  {previewLoading ? (
                    <div className="flex h-[560px] items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <iframe
                      title="Email Template Preview"
                      sandbox=""
                      srcDoc={emailPreview?.html || ''}
                      className={`h-[640px] rounded-lg border border-black/10 bg-white shadow-sm transition-all ${
                        emailViewport === 'mobile' ? 'w-[390px]' : 'w-full max-w-[680px]'
                      }`}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 高级选项 */}
          <TabsContent value="advanced">
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive">功能开关</CardTitle>
                <CardDescription>控制站点的核心功能状态（保存后立即同步前台）。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">评论系统</Label>
                    <p className="text-sm text-muted-foreground">关闭后文章页与留言板将停止显示评论区。</p>
                  </div>
                  <Switch
                    checked={form.watch('feature_flags.enable_comments')}
                    onCheckedChange={(checked) => form.setValue('feature_flags.enable_comments', checked)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-background p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base text-destructive">维护模式</Label>
                    <p className="text-sm text-destructive/80">
                      开启后，普通访客访问前台页面将看到维护公告（后台 `/admin` 仍可正常登录管理）。
                    </p>
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
