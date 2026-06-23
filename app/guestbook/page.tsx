import { Comments } from "@/features/blog/components/client/comments";
import { FadeIn } from "@/shared/visuals/fade-in";

export default async function GuestbookPage() {
  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <FadeIn className="mx-auto max-w-3xl">
        <div className="space-y-4 border-b pb-8 mb-8">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">留言板</h1>
          <p className="text-xl text-muted-foreground">
            欢迎留下你的足迹，使用 GitHub 账号登录即可评论，可能需要几秒钟的加载……
          </p>
        </div>
        
        <Comments />
      </FadeIn>
    </div>
  );
}
