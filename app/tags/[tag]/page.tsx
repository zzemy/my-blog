import { getPostsByTag, getPublishedPosts } from "@/lib/supabase/posts";
import { PostList } from "@/features/blog/components/shared/post-list";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  const tagSet = new Set<string>();

  for (const post of posts) {
    const tags = post.tags || [];
    for (const tag of tags) {
      const normalizedTag = tag.trim();
      if (normalizedTag) {
        tagSet.add(normalizedTag);
      }
    }
  }

  return Array.from(tagSet).map((tag) => ({ tag }));
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = await getPostsByTag(decodedTag);

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
        <div className="flex-1 space-y-4">
          <h1 className="inline-block font-bold text-4xl tracking-tight lg:text-5xl">#{decodedTag}</h1>
          <p className="text-xl text-muted-foreground">
            共 {posts.length} 篇文章
          </p>
        </div>
      </div>
      <hr className="my-8" />
      <PostList posts={posts} readMoreText="阅读更多" />
    </div>
  );
}
