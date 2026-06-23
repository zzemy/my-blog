-- Remove the legacy multilingual data model.
-- Duplicate localized slugs are preserved by suffixing non-primary rows before
-- the locale columns are dropped.

WITH ranked_posts AS (
  SELECT
    id,
    slug,
    row_number() OVER (
      PARTITION BY slug
      ORDER BY (locale = 'zh') DESC, updated_at DESC, created_at DESC, id
    ) AS duplicate_rank
  FROM posts
)
UPDATE posts
SET slug = posts.slug || '-' || left(posts.id::text, 8)
FROM ranked_posts
WHERE posts.id = ranked_posts.id
  AND ranked_posts.duplicate_rank > 1;

WITH ranked_pages AS (
  SELECT
    id,
    slug,
    row_number() OVER (
      PARTITION BY slug
      ORDER BY (locale = 'zh') DESC, updated_at DESC, created_at DESC, id
    ) AS duplicate_rank
  FROM pages
)
UPDATE pages
SET slug = pages.slug || '-' || left(pages.id::text, 8)
FROM ranked_pages
WHERE pages.id = ranked_pages.id
  AND ranked_pages.duplicate_rank > 1;

ALTER TABLE posts DROP CONSTRAINT IF EXISTS unique_slug_locale;
ALTER TABLE pages DROP CONSTRAINT IF EXISTS unique_page_slug_locale;

DROP INDEX IF EXISTS posts_locale_idx;
DROP INDEX IF EXISTS idx_posts_locale;
DROP INDEX IF EXISTS pages_locale_idx;
DROP INDEX IF EXISTS idx_pages_locale;

ALTER TABLE posts DROP COLUMN IF EXISTS locale;
ALTER TABLE pages DROP COLUMN IF EXISTS locale;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'posts'::regclass
      AND contype = 'u'
      AND conkey = ARRAY[
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'posts'::regclass AND attname = 'slug')
      ]::smallint[]
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_slug_key UNIQUE (slug);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'pages'::regclass
      AND contype = 'u'
      AND conkey = ARRAY[
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'pages'::regclass AND attname = 'slug')
      ]::smallint[]
  ) THEN
    ALTER TABLE pages ADD CONSTRAINT pages_slug_key UNIQUE (slug);
  END IF;
END $$;

DROP FUNCTION IF EXISTS increment_post_views(TEXT, TEXT);
DROP FUNCTION IF EXISTS increment_post_views(TEXT);

CREATE OR REPLACE FUNCTION increment_post_views(post_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET views = views + 1
  WHERE slug = post_slug OR public_id = post_slug;
END;
$$ LANGUAGE plpgsql;
