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
  const socialList = Array.isArray(settings.social_links)
    ? (settings.social_links as Array<{ platform?: string; url?: string }>)
    : [];
  const emailLink = socialList.find(
    (item) =>
      item &&
      typeof item.url === "string" &&
      (item.platform?.toLowerCase() === "email" || item.url.startsWith("mailto:")),
  );
  const fallbackContact =
    emailLink?.url ||
    (process.env.ADMIN_NOTIFICATION_EMAIL
      ? `mailto:${process.env.ADMIN_NOTIFICATION_EMAIL.trim()}`
      : "https://github.com/zzemy/my-blog/discussions");

  return (
    <div className="container mx-auto px-5 py-10 md:px-8 md:py-16">
      <FadeIn className="mx-auto max-w-4xl">
        <div className="mb-10 border-b border-border/70 pb-8 dark:border-white/12 md:mb-12">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Guestbook / 留言</p>
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">留下几句话</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
            无论是文章勘误、技术交流，还是路过打个招呼，都很欢迎在这里留言。使用 GitHub 账号登录即可参与讨论。
          </p>
          <p className="mt-2 text-xs text-muted-foreground/80">
            没有 GitHub 账号？也可以通过{' '}
            <a
              href={fallbackContact}
              target={fallbackContact.startsWith("mailto:") ? undefined : "_blank"}
              rel={fallbackContact.startsWith("mailto:") ? undefined : "noopener noreferrer"}
              className="underline underline-offset-4 transition-colors hover:text-foreground"
            >
              {fallbackContact.startsWith("mailto:") ? fallbackContact.replace("mailto:", "") : "GitHub Discussions"}
            </a>{' '}
            直接联系我。
          </p>
        </div>
        <div>
          <Comments enabled={commentsEnabled} />
        </div>
      </FadeIn>
    </div>
  );
}
