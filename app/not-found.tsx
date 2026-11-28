import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Lottie404 } from '@/shared/effects/lottie-404'
import { getPublishedPosts } from '@/lib/supabase/posts'
import { getPostRouteId } from '@/lib/post-public-id'

export default async function NotFound() {
  let recommendedPosts: Awaited<ReturnType<typeof getPublishedPosts>> = []
  try {
    const posts = await getPublishedPosts()
    recommendedPosts = posts.slice(0, 4)
  } catch {
    recommendedPosts = []
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="flex w-full flex-col items-center space-y-6">
        <Lottie404 />
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Error 404
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            页面不存在
          </h1>
          <p className="max-w-[460px] text-sm leading-relaxed text-muted-foreground md:text-base">
            这个页面可能已经移动、删除，或者地址输入有误。你可以返回首页，或阅读下面的最近文章。
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

        {recommendedPosts.length > 0 && (
          <div className="mt-6 w-full border-t border-border/70 pt-6 text-left">
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              最近文章推荐
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {recommendedPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${getPostRouteId(post)}`}
                  className="group flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-card/50 px-3.5 py-2.5 text-sm transition-colors hover:border-foreground/30 hover:bg-muted/40"
                >
                  <span className="truncate font-medium text-foreground">{post.title}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
