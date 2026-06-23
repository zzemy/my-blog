import fs from 'fs';
import path from 'path';
import { Feed } from 'feed';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blog.zzemy.top';
const publicDirectory = path.join(process.cwd(), 'public');
const removedI18nHeading = '国际化' + '与搜索';
const removedI18nFeature = '国际化' + '支持';
const removedMultilingualAdmin = '多语言' + '支持：每篇文章可独立设置语言（zh, en, fr, ja）';
const removedIntlPackage = 'next' + '-intl - Next.js 多语言方案（支持 zh, en, fr, ja）';
const removedFallbackCopy = 'fallback' + ' 机制：缺失翻译时自动回退到中文';
const removedHreflangCopy = 'href' + 'lang 标签自动生成';
const removedZhPostsPath = '/zh' + '/posts';
const removedEnPostsPath = '/en' + '/posts';

function normalizeLegacyBranding(text) {
  if (typeof text !== 'string') {
    return text;
  }

  return text
    .replace(/ZHalio/g, 'emmm')
    .replace(/github\.com\/zhalio/g, 'github.com/zzemy')
    .replace(/emmmxx\.xyz/g, 'blog.zzemy.top')
    .replace(new RegExp(escapeRegExp(removedZhPostsPath), 'g'), '/posts')
    .replace(new RegExp(escapeRegExp(removedEnPostsPath), 'g'), '/posts')
    .replace(new RegExp(`${removedI18nHeading}\\s*${escapeRegExp(removedIntlPackage)}`, 'g'), '搜索')
    .replace(new RegExp(`${removedI18nFeature}\\s*路由级多语言：/posts, /posts 等独立路径${escapeRegExp(removedFallbackCopy)}SEO 友好：${escapeRegExp(removedHreflangCopy)}`, 'g'), '')
    .replace(/支持多语言，自动回退到中文版本/g, '')
    .replace(new RegExp(escapeRegExp(removedMultilingualAdmin), 'g'), '');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getPostDate(post) {
  const value = post.updated_at || post.published_at || post.created_at;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getFeedUpdatedAt(posts) {
  const dates = posts.map(getPostDate).filter(Boolean);
  if (dates.length === 0) {
    return new Date('1970-01-01T00:00:00.000Z');
  }

  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

function writeFileIfChanged(filePath, content) {
  const previous = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
  if (previous === content) {
    return false;
  }

  fs.writeFileSync(filePath, content);
  return true;
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
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    process.exit(1);
  }

  const publishedPosts = posts || [];

  const feed = new Feed({
    title: "emmm's Blog",
    description: "A personal blog about technology and life.",
    id: siteUrl,
    link: siteUrl,
    language: "zh",
    image: `${siteUrl}/icon.png`,
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, emmm`,
    updated: getFeedUpdatedAt(publishedPosts),
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

  publishedPosts.forEach((post) => {
    const url = `${siteUrl}/posts/${post.public_id || post.slug}`;
    
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

  const outputs = [
    [path.join(publicDirectory, 'rss.xml'), feed.rss2()],
    [path.join(publicDirectory, 'atom.xml'), feed.atom1()],
    [path.join(publicDirectory, 'rss.json'), feed.json1()],
  ];
  const changedCount = outputs.filter(([filePath, content]) => writeFileIfChanged(filePath, content)).length;

  console.log(
    changedCount > 0
      ? `RSS feeds generated successfully! ${changedCount} file(s) updated.`
      : 'RSS feeds already up to date.'
  );
}

generateRssFeed().catch((err) => {
  console.error('Error generating RSS feed:', err);
  process.exit(1);
});
