-- Friend links workflow: public applications stay pending until approved.
ALTER TABLE friend_links
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS contact TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';

ALTER TABLE friend_links
  DROP CONSTRAINT IF EXISTS friend_links_status_check;

ALTER TABLE friend_links
  ADD CONSTRAINT friend_links_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS friend_links_status_sort_idx
  ON friend_links(status, sort_order, created_at DESC);

DROP POLICY IF EXISTS "Friend links are viewable by everyone" ON friend_links;

CREATE POLICY "Approved friend links are viewable by everyone"
  ON friend_links FOR SELECT
  USING (status = 'approved');
