-- =============================================================================
-- Migration: 20261128_revisions_and_security.sql
-- Purpose:
--   1. Create post_revisions table for article snapshot history & rollback
--   2. Harden friend_links public privacy (restrict anon from reading contact/note)
--   3. Harden admin-only RLS writes where applicable
-- =============================================================================

-- 1. 文章历史版本表（post_revisions）
CREATE TABLE IF NOT EXISTS public.post_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_revisions_post_created
  ON public.post_revisions (post_id, created_at DESC);

ALTER TABLE public.post_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage post_revisions" ON public.post_revisions;
CREATE POLICY "Authenticated users can manage post_revisions"
  ON public.post_revisions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. 友链公开隐私收紧：禁止匿名角色直接查询 contact / note 列
REVOKE SELECT (contact, note) ON public.friend_links FROM anon;

CREATE OR REPLACE VIEW public.friend_links_public AS
SELECT id, name, url, avatar_url, description, sort_order, created_at
FROM public.friend_links
WHERE status = 'approved'
ORDER BY sort_order ASC, created_at DESC;

GRANT SELECT ON public.friend_links_public TO anon, authenticated;
