import fs from 'fs';
import path from 'path';
import { Feed } from 'feed';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://emmmxx.xyz';
const publicDirectory = path.join(process.cwd(), 'public');

function normalizeLegacyBranding(text) {
  if (typeof text !== 'string') {
    return text;
  }

  return text.replace(/ZHalio/g, 'emmm').replace(/github\.com\/zhalio/g, 'github.com/zzemy');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase environment variables. Skipping RSS generation.');
  process.exit(0);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function generateRssFeed() {
  const feed = new Feed({
    title: "emmm's Blog",
    description: "A personal blog about technology and life.",
    id: siteUrl,
    link: siteUrl,
    language: "zh",
    image: `${siteUrl}/icon.png`,
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, emmm`,
    updated: new Date(),
    generator: "Feed for Node.js",
    feedLinks: {
      rss2: `${siteUrl}/rss.xml`,
      json: `${siteUrl}/rss.json`,
      atom: `${siteUrl}/atom.xml`,
    },
    author: {
      name: "emmm",
      email: "1992107794@qq.com",
      link: siteUrl,
    },
  });

  // Fetch published posts from Supabase for zh locale
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('locale', 'zh')
    .eq('published', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    process.exit(1);
  }

  posts.forEach((post) => {
    const url = `${siteUrl}/zh/posts/${post.slug}`;
    
    // Extract plain text from TipTap JSON content
    let content = '';
    if (post.content && typeof post.content === 'object') {
      const extractText = (node) => {
        if (node.type === 'text') {
          return node.text || '';
        }
        if (node.content && Array.isArray(node.content)) {
          return node.content.map(extractText).join('');
        }
        return '';
      };
      
      if (post.content.content && Array.isArray(post.content.content)) {
        content = post.content.content.map(extractText).join('\n\n');
      }
    }

    feed.addItem({
      title: normalizeLegacyBranding(post.title),
      id: url,
      link: url,
      description: normalizeLegacyBranding(post.description || ''),
      content: normalizeLegacyBranding(content),
      author: [
        {
          name: normalizeLegacyBranding(post.author || "emmm"),
          email: "1992107794@qq.com",
          link: siteUrl,
        },
      ],
      date: new Date(post.published_at || post.created_at),
    });
  });

  if (!fs.existsSync(publicDirectory)) {
    fs.mkdirSync(publicDirectory, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDirectory, 'rss.xml'), feed.rss2());
  fs.writeFileSync(path.join(publicDirectory, 'atom.xml'), feed.atom1());
  fs.writeFileSync(path.join(publicDirectory, 'rss.json'), feed.json1());

  console.log('RSS feeds generated successfully!');
}

generateRssFeed().catch((err) => {
  console.error('Error generating RSS feed:', err);
  process.exit(1);
});
