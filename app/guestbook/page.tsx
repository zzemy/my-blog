import type { Metadata } from "next";
import { Comments } from "@/features/blog/components/client/comments";
import { FadeIn } from "@/shared/visuals/fade-in";
import { getSiteSettings } from "@/lib/site-settings";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "留言",
  description: "欢迎留下你的足迹与想法。",
};

export default async function GuestbookPage() {
  const settings = await getSiteSettings();
  const commentsEnabled = settings.feature_flags?.enable_comments !== false;

  return (
    <div className="container mx-auto px-5 py-10 md:px-8 md:py-16">
      <FadeIn className="mx-auto max-w-4xl">
        <div className="mb-10 border-b border-border/70 pb-8 dark:border-white/12 md:mb-12">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Guestbook / 留言</p>
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">留下几句话</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
            欢迎留下你的足迹。使用 GitHub 账号登录即可评论，评论区加载可能需要几秒钟。
          </p>
        </div>
        <div>
          <Comments enabled={commentsEnabled} />
        </div>
      </FadeIn>
    </div>
  );
}
