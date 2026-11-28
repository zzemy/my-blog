import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Lottie404 } from '@/shared/effects/lottie-404'

export default function NotFound() {
  return (
    <section className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-4 text-center">
      <div className="flex flex-col items-center space-y-6">
        <Lottie404 />
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Error 404
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            页面不存在
          </h1>
          <p className="max-w-[460px] text-sm leading-relaxed text-muted-foreground md:text-base">
            这个页面可能已经移动、删除，或者地址输入有误。你可以返回首页，或去文章归档里继续逛逛。
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/">返回首页</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/posts">浏览全部文章</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
