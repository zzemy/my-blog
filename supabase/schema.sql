-- Supabase Database Schema for Blog
-- 执行此SQL脚本以创建所需的数据库表

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建posts表
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content JSONB NOT NULL, -- TipTap JSON格式内容
  cover_image TEXT,
  author TEXT DEFAULT 'Admin',
  locale TEXT DEFAULT 'zh', -- 语言代码: zh, en, fr, ja
  tags TEXT[] DEFAULT '{}', -- 标签数组
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  reading_time INTEGER, -- 阅读时间（分钟）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}' -- 额外的元数据
);

-- 创建pages表（用于about等静态页面）
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL, -- TipTap JSON格式内容
  locale TEXT DEFAULT 'zh',
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- 创建tags表（用于标签管理）
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  count INTEGER DEFAULT 0, -- 使用此标签的文章数量
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 创建media表（用于图片和文件管理）
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Supabase Storage中的路径
  mime_type TEXT,
  size INTEGER, -- 文件大小（字节）
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts(slug);
CREATE INDEX IF NOT EXISTS posts_public_id_idx ON posts(public_id);
CREATE INDEX IF NOT EXISTS posts_locale_idx ON posts(locale);
CREATE INDEX IF NOT EXISTS posts_published_idx ON posts(published);
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS posts_tags_idx ON posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);

CREATE INDEX IF NOT EXISTS pages_slug_idx ON pages(slug);
CREATE INDEX IF NOT EXISTS pages_locale_idx ON pages(locale);

CREATE INDEX IF NOT EXISTS tags_slug_idx ON tags(slug);
CREATE INDEX IF NOT EXISTS tags_name_idx ON tags(name);

CREATE INDEX IF NOT EXISTS media_storage_path_idx ON media(storage_path);

-- 创建全文搜索索引
CREATE INDEX IF NOT EXISTS posts_search_idx ON posts USING GIN(
  to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
);

-- 自动更新updated_at时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 删除已存在的触发器（如果存在）
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
DROP TRIGGER IF EXISTS update_tag_count_trigger ON posts;

-- 为posts表创建触发器
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为pages表创建触发器
CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 自动更新标签计数的触发器函数
CREATE OR REPLACE FUNCTION update_tag_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新所有涉及的标签的计数
  UPDATE tags
  SET count = (
    SELECT COUNT(*)
    FROM posts
    WHERE published = true AND tags.name = ANY(posts.tags)
  )
  WHERE name = ANY(NEW.tags) OR name = ANY(COALESCE(OLD.tags, '{}'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为posts表创建标签计数更新触发器
CREATE TRIGGER update_tag_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_tag_count();

-- 启用行级安全（Row Level Security）
-- 因为所有 admin 操作都通过后端 API，不直接使用 anon key
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE media DISABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Public pages are viewable by everyone" ON pages;
DROP POLICY IF EXISTS "Tags are viewable by everyone" ON tags;
DROP POLICY IF EXISTS "Media is viewable by everyone" ON media;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON posts;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON posts;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON posts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON pages;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON pages;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON pages;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON tags;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON tags;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON media;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON media;

-- 创建允许所有人读取已发布内容的策略
CREATE POLICY "Public posts are viewable by everyone"
  ON posts FOR SELECT
  USING (published = true);

CREATE POLICY "Public pages are viewable by everyone"
  ON pages FOR SELECT
  USING (published = true);

CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Media is viewable by everyone"
  ON media FOR SELECT
  USING (true);

-- 注意：管理员写入权限需要配合Supabase Auth
-- 这里我们先创建一个简单的策略，后续可以根据认证系统调整
-- 临时允许所有人写入（用于开发，生产环境需要修改）
CREATE POLICY "Enable insert for authenticated users only"
  ON posts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only"
  ON posts FOR UPDATE
  USING (true);

CREATE POLICY "Enable delete for authenticated users only"
  ON posts FOR DELETE
  USING (true);

CREATE POLICY "Enable insert for authenticated users only"
  ON pages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only"
  ON pages FOR UPDATE
  USING (true);

CREATE POLICY "Enable delete for authenticated users only"
  ON pages FOR DELETE
  USING (true);

CREATE POLICY "Enable insert for authenticated users only"
  ON tags FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only"
  ON tags FOR UPDATE
  USING (true);

CREATE POLICY "Enable insert for authenticated users only"
  ON media FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only"
  ON media FOR DELETE
  USING (true);

-- 插入一些初始标签
INSERT INTO tags (name, slug, description) VALUES
  ('技术', 'tech', '技术相关文章'),
  ('生活', 'life', '生活随笔'),
  ('教程', 'tutorial', '教程和指南'),
  ('思考', 'thoughts', '个人思考')
ON CONFLICT (slug) DO NOTHING;

-- 创建增加浏览量的函数
CREATE OR REPLACE FUNCTION increment_post_views(post_slug TEXT, post_locale TEXT DEFAULT 'zh')
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET views = views + 1
  WHERE slug = post_slug AND locale = post_locale;
END;
$$ LANGUAGE plpgsql;
