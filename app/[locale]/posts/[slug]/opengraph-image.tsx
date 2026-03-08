import { ImageResponse } from 'next/og'
import { getPostBySlug, getPublishedPosts } from '@/lib/supabase/posts'

export const runtime = 'nodejs'
export const dynamic = 'force-static'
export const alt = 'Blog Post Image'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

const locales = ['zh', 'en', 'fr', 'ja'];

export async function generateStaticParams() {
  const posts = await getPublishedPosts('zh');
  const params = [];
  for (const locale of locales) {
    for (const post of posts) {
      params.push({ locale, slug: post.slug });
    }
  }
  return params;
}

export default async function Image({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params
  const post = await getPostBySlug(slug, locale)

  if (!post) {
    return new ImageResponse(
      (
        <div style={{
          fontSize: 48,
          background: '#09090b',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'sans-serif',
        }}>
          <div style={{ fontSize: 48, fontWeight: 'bold' }}>Post Not Found</div>
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: '#09090b', // zinc-950 (dark theme background)
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '60px 80px',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
           <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
              color: 'black',
              fontSize: 24,
              fontWeight: 'bold',
            }}
          >
            &gt;_
          </div>
          <span style={{ fontSize: 32, fontWeight: 'bold', color: '#e4e4e7' }}>emmm</span>
        </div>

        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            lineHeight: 1.1,
            marginBottom: 30,
            color: '#fafafa',
            maxWidth: '90%',
          }}
        >
          {post.title}
        </div>

        <div
          style={{
            fontSize: 28,
            color: '#a1a1aa', // zinc-400
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          {post.tags && post.tags.length > 0 && (
            <>
              <span style={{ margin: '0 15px' }}>•</span>
              <span>{post.tags[0]}</span>
            </>
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
