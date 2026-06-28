'use client'

import { FormEvent, useState } from 'react'
import { Mail, Send, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type SubmitState =
  | { status: 'idle'; message: string }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false)
  const [state, setState] = useState<SubmitState>({ status: 'idle', message: '' })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setState({ status: 'idle', message: '' })

    const form = event.currentTarget
    const formData = new FormData(form)
    const payload = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      subject: String(formData.get('subject') || ''),
      message: String(formData.get('message') || ''),
      website: String(formData.get('website') || ''),
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.error || '发送失败，请稍后再试。')
      }

      form.reset()
      setState({ status: 'success', message: '已发送，我会在邮箱里收到这条消息。' })
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : '发送失败，请稍后再试。',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-lg border border-border bg-background/88 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.65)] backdrop-blur-xl dark:border-white/12 dark:bg-[#181818]/88 md:p-7"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#f97316,#14b8a6,#eab308)]" />

      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/60 dark:border-white/14 dark:bg-white/[0.04]">
          <Mail className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-tight">发送邮件</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            表单只会把消息发送到站长邮箱，不会公开显示。
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold">你的称呼</span>
          <Input name="name" autoComplete="name" required maxLength={80} placeholder="怎么称呼你" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold">回复邮箱</span>
          <Input name="email" type="email" autoComplete="email" required maxLength={160} placeholder="you@example.com" />
        </label>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-semibold">主题</span>
        <Input name="subject" maxLength={120} placeholder="可选，比如：博客交流 / 文章反馈" />
      </label>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-semibold">内容</span>
        <Textarea
          name="message"
          required
          minLength={10}
          maxLength={4000}
          className="min-h-[180px] resize-y leading-7"
          placeholder="写下你想发给我的内容..."
        />
      </label>

      <label className="hidden" aria-hidden="true">
        Website
        <Input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          <span>服务端校验，API key 不会进入浏览器。</span>
        </div>
        <Button type="submit" disabled={submitting} className="min-w-32">
          <Send className="mr-2 h-4 w-4" />
          {submitting ? '发送中' : '发送'}
        </Button>
      </div>

      {state.message && (
        <p
          className={`mt-4 rounded-md border px-3 py-2 text-sm ${
            state.status === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
          }`}
          role="status"
        >
          {state.message}
        </p>
      )}
    </form>
  )
}
