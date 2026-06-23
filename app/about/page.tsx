import { notFound } from 'next/navigation';
import { PostLayout } from "@/features/blog/components/client/post-layout";
import { TipTapRenderer } from "@/features/blog/editor/tiptap-renderer";
import { buildToc, type TiptapNode } from "@/features/blog/utils/toc";
import { supabase } from '@/lib/supabase/client';

// Always serve fresh content to reflect about page edits immediately
export const revalidate = 0;
export const dynamic = 'force-dynamic';

type AboutPost = {
  title: string;
  description: string | null;
  content: TiptapNode | TiptapNode[] | null;
};

function normalizeLegacyBranding(text: string): string {
  return text.replace(/ZHalio/g, 'emmm').replace(/github\.com\/zhalio/g, 'github.com/zzemy')
}

function normalizeAboutContent(node: TiptapNode | TiptapNode[] | null): TiptapNode | TiptapNode[] | null {
  if (!node) return node

  if (Array.isArray(node)) {
    return node.map((item) => normalizeAboutContent(item) as TiptapNode)
  }

  return {
    ...node,
    text: node.text ? normalizeLegacyBranding(node.text) : node.text,
    content: node.content ? node.content.map((item) => normalizeAboutContent(item) as TiptapNode) : node.content,
  }
}

async function getAboutPost() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', 'about')
    .eq('published', true)
    .single();

  if (error) return null;

  const post = data as AboutPost;
  return {
    ...post,
    title: normalizeLegacyBranding(post.title),
    description: post.description ? normalizeLegacyBranding(post.description) : post.description,
    content: normalizeAboutContent(post.content),
  };
}

export default async function AboutPage() {
  const post = await getAboutPost();
  if (!post) {
    notFound();
  }

  const toc = buildToc(post.content);

  return (
    <PostLayout toc={toc}>
      <article className="article-shell">
        <div className="article-hero">
          <h1 className="article-title text-4xl lg:text-5xl">{post.title}</h1>
          {post.description && (
            <p className="article-description">
              {post.description}
            </p>
          )}
        </div>

        <TipTapRenderer
          className="mt-10"
          content={post.content}
          toc={toc}
        />
      </article>
    </PostLayout>
  );
}
