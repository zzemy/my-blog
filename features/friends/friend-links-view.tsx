'use client'

import { FormEvent, useEffect, useState } from 'react'
import { ArrowUpRight, CheckCircle2, Globe2, Link2, Loader2, Send, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { FriendLink } from '@/lib/supabase/types'

type FormState = {
  name: string
  url: string
  avatar_url: string
  description: string
  contact: string
  note: string
}

const initialForm: FormState = {
  name: '',
  url: 'https://',
  avatar_url: '',
  description: '',
  contact: '',
  note: '',
}

function FriendAvatar({ link }: { link: Pick<FriendLink, 'name' | 'avatar_url'> }) {
  const [failed, setFailed] = useState(false)
  const initial = link.name.trim().charAt(0).toUpperCase() || '?'

  if (!link.avatar_url || failed) {
    return (
      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary ring-1 ring-inset ring-primary/20">
        {initial}
      </div>
    )
  }

  return (
    <img
      src={link.avatar_url}
      alt={`${link.name} 的头像`}
      className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-border/70 dark:ring-white/15"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}

function FriendLinkCard({ link }: { link: FriendLink }) {
  return (
    <Card className="group h-full rounded-lg border-border/70 bg-card/72 shadow-sm backdrop-blur-md transition-[border-color,box-shadow,transform,background-color] duration-200 hover:-translate-y-1 hover:border-primary/35 hover:bg-card/88 hover:shadow-lg dark:border-white/12 dark:bg-[#242424]/62 dark:hover:border-primary/40 dark:hover:bg-[#292929]/78">
      <CardContent className="flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <FriendAvatar link={link} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-foreground dark:text-zinc-100">{link.name}</h2>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              <Globe2 className="size-3.5 shrink-0" />
              <span className="truncate">{link.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
              <ArrowUpRight className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          </div>
        </div>
        {link.description && <p className="mt-5 line-clamp-3 flex-1 text-sm leading-7 text-muted-foreground dark:text-zinc-300">{link.description}</p>}
      </CardContent>
    </Card>
  )
}

export function FriendLinksView({ links }: { links: FriendLink[] }) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [csrfToken, setCsrfToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/csrf', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => setCsrfToken(data.csrfToken || ''))
      .catch(() => setCsrfToken(''))
  }, [])

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setFeedback(null)

    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, csrfToken, website: '' }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || '提交失败，请稍后再试')

      setForm(initialForm)
      setFeedback({ type: 'success', text: '申请已提交，审核通过后会出现在友链列表中。' })
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : '提交失败，请稍后再试' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-5 border-b border-border/70 pb-8 dark:border-white/12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <Link2 className="size-4" />
              <span>LINKS / 友链</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">和有趣的网站交换链接</h1>
            <p className="mt-4 text-base leading-8 text-muted-foreground md:text-lg">这里收集我愿意推荐的个人站点、独立博客和小项目。每一条链接都来自真实的交流与发现。</p>
          </div>
          <a href="#apply" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary dark:text-zinc-200">
            申请友链 <ArrowUpRight className="size-4" />
          </a>
        </div>

        {links.length > 0 ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => <FriendLinkCard key={link.id} link={link} />)}
          </div>
        ) : (
          <div className="mt-10 rounded-lg border border-dashed border-border/80 px-6 py-16 text-center dark:border-white/15">
            <Globe2 className="mx-auto size-9 text-muted-foreground/60" />
            <p className="mt-4 text-sm text-muted-foreground">友链列表还在慢慢建立，欢迎成为第一位朋友。</p>
          </div>
        )}
      </section>

      <section id="apply" className="mx-auto mt-20 max-w-5xl scroll-mt-28 border-t border-border/70 pt-10 dark:border-white/12">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <Send className="size-4" />
              <span>APPLY / 申请</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">申请加入</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">填写站点信息后提交即可。申请会先进入待审核状态，审核通过后公开展示。</p>
            <div className="mt-7 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" /><span>请确保网站可以正常访问，并已添加本站链接。</span></div>
              <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /><span>你的邮箱或联系方式只用于审核沟通，不会公开展示。</span></div>
            </div>
          </div>

          <form onSubmit={submitApplication} className="space-y-6 rounded-xl border border-border/80 bg-background/75 p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.6)] backdrop-blur-xl dark:border-white/14 dark:bg-[#1d1f21]/78 dark:shadow-[0_18px_50px_-34px_rgba(0,0,0,0.95)] sm:p-7">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2"><Label className="text-foreground/75 dark:text-white/75" htmlFor="friend-name">个人昵称 *</Label><Input className="border-border/80 bg-background/80 shadow-none placeholder:text-muted-foreground/60 dark:border-white/14 dark:bg-white/[0.04]" id="friend-name" value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="你希望展示的昵称" required maxLength={60} /></div>
              <div className="grid gap-2"><Label className="text-foreground/75 dark:text-white/75" htmlFor="friend-url">网站地址 *</Label><Input className="border-border/80 bg-background/80 shadow-none placeholder:text-muted-foreground/60 dark:border-white/14 dark:bg-white/[0.04]" id="friend-url" type="url" value={form.url} onChange={(event) => updateField('url', event.target.value)} placeholder="example.com" required /></div>
            </div>
            <div className="grid gap-2"><Label className="text-foreground/75 dark:text-white/75" htmlFor="friend-avatar">头像地址</Label><Input className="border-border/80 bg-background/80 shadow-none placeholder:text-muted-foreground/60 dark:border-white/14 dark:bg-white/[0.04]" id="friend-avatar" type="url" value={form.avatar_url} onChange={(event) => updateField('avatar_url', event.target.value)} placeholder="https://example.com/avatar.png" /><p className="text-xs text-muted-foreground">没有头像也可以提交，页面会使用昵称首字。</p></div>
            <div className="grid gap-2"><Label className="text-foreground/75 dark:text-white/75" htmlFor="friend-description">网站介绍</Label><Textarea id="friend-description" value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="可选，一句话介绍你的网站" maxLength={180} rows={3} className="resize-none border-border/80 bg-background/80 shadow-none placeholder:text-muted-foreground/60 dark:border-white/14 dark:bg-white/[0.04]" /></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2"><Label className="text-foreground/75 dark:text-white/75" htmlFor="friend-contact">联系方式</Label><Input className="border-border/80 bg-background/80 shadow-none placeholder:text-muted-foreground/60 dark:border-white/14 dark:bg-white/[0.04]" id="friend-contact" value={form.contact} onChange={(event) => updateField('contact', event.target.value)} placeholder="邮箱 / QQ / Telegram" maxLength={120} /></div>
              <div className="grid gap-2"><Label className="text-foreground/75 dark:text-white/75" htmlFor="friend-note">给站长留言</Label><Input className="border-border/80 bg-background/80 shadow-none placeholder:text-muted-foreground/60 dark:border-white/14 dark:bg-white/[0.04]" id="friend-note" value={form.note} onChange={(event) => updateField('note', event.target.value)} placeholder="选填，不会公开展示" maxLength={180} /></div>
            </div>
            <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" name="website" />
            {feedback && <p role="status" className={`rounded-md border px-3 py-2 text-sm ${feedback.type === 'success' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-destructive/25 bg-destructive/10 text-destructive'}`}>{feedback.text}</p>}
            <Button type="submit" disabled={submitting || !csrfToken} className="w-full gap-2 sm:w-auto">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {submitting ? '提交中…' : '提交申请'}
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}
