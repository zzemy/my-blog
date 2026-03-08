import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PostLayout } from "@/features/blog/components/client/post-layout";
import { TipTapRenderer } from "@/features/blog/editor/tiptap-renderer";
import { supabase } from '@/lib/supabase/client';

// Always serve fresh content to reflect about page edits immediately
export const revalidate = 0;
export const dynamic = 'force-dynamic';

const locales = ['zh', 'en', 'fr', 'ja'];

type AboutPost = {
  title: string;
  description: string | null;
  content: TiptapNode | TiptapNode[] | null;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

async function getAboutPost(locale: string) {
  // Try locale first, then fallback to zh
  const fetchPost = async (loc: string): Promise<AboutPost | null> => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', 'about')
      .eq('locale', loc)
      .eq('published', true)
      .single();

    if (error) return null;
    return data as AboutPost;
  };

  const current = await fetchPost(locale);
  if (current) return current;
  if (locale !== 'zh') {
    const fallback = await fetchPost('zh');
    if (fallback) return fallback;
  }
  return null;
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const post = await getAboutPost(locale);
  if (!post) {
    notFound();
  }

  const toc = buildToc(post.content);

  return (
    <PostLayout toc={toc}>
      <article className="prose dark:prose-invert max-w-none">
        <div className="space-y-4 border-b pb-8">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">{post.title}</h1>
          {post.description && (
            <p className="text-xl text-muted-foreground">
              {post.description}
            </p>
          )}
        </div>

        <TipTapRenderer
          className="mt-8 leading-7 text-base md:text-lg"
          content={post.content}
          toc={toc}
        />
      </article>
    </PostLayout>
  );
}

type TocItem = {
  id: string;
  text: string;
  depth: number;
};

type TiptapNode = {
  type?: string;
  text?: string;
  attrs?: { level?: number };
  content?: TiptapNode[];
};

function buildToc(content: TiptapNode | TiptapNode[] | null | undefined): TocItem[] {
  const toc: TocItem[] = [];
  const idCount: Record<string, number> = {};

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const walk = (node: TiptapNode | TiptapNode[] | null | undefined) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    if (node.type === 'heading' && node.attrs?.level) {
      const text = extractText(node);
      if (text) {
        let base = slugify(text);
        if (!base) base = 'section';
        let unique = base;
        if (idCount[base] != null) {
          idCount[base] += 1;
          unique = `${base}-${idCount[base]}`;
        } else {
          idCount[base] = 0;
        }
        toc.push({ id: unique, text, depth: node.attrs.level });
      }
    }

    if (node.content) {
      walk(node.content);
    }
  };

  walk(content);
  return toc;
}

function extractText(node: TiptapNode | null | undefined): string {
  if (!node) return '';
  if (node.text) return node.text;
  if (node.content) {
    return node.content.map(extractText).join('');
  }
  return '';
}