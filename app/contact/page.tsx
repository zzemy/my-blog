import type { Metadata } from 'next'
import { Mail, MessageSquareText, Reply } from 'lucide-react'
import { ContactForm } from '@/features/contact/contact-form'
import { FadeIn } from '@/shared/visuals/fade-in'

export const metadata: Metadata = {
  title: '联系我',
  description: '通过邮件联系 emmm',
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <FadeIn className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
        <section className="pt-2">
          <p className="mb-3 inline-flex items-center rounded-md border border-border bg-background/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground dark:border-white/12 dark:bg-white/[0.04]">
            Contact
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            有想法可以直接发到我的邮箱。
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
            适合文章反馈、学习交流、站点问题和合作沟通。提交后网站会通过 Resend 把内容发给我，你的邮箱会作为回复地址。
          </p>

          <div className="mt-8 grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-foreground" />
              <span>邮件地址不会在页面上暴露。</span>
            </div>
            <div className="flex items-start gap-3">
              <Reply className="mt-0.5 h-4 w-4 text-foreground" />
              <span>我可以直接回复你填写的邮箱。</span>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquareText className="mt-0.5 h-4 w-4 text-foreground" />
              <span>公开留言仍然可以走留言板。</span>
            </div>
          </div>
        </section>

        <ContactForm />
      </FadeIn>
    </div>
  )
}
