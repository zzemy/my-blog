import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Lottie404 } from '@/shared/effects/lottie-404'

export default function NotFound() {
  return (
    <section className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-4 text-center">
      <div className="flex flex-col items-center space-y-6">
        <Lottie404 />
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">页面不存在</h2>
          <p className="max-w-[500px] text-muted-foreground">
            这个页面可能已经移动、删除，或者地址输入有误。
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/">返回首页</Link>
        </Button>
      </div>
    </section>
  )
}
