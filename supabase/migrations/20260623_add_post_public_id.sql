ALTER TABLE posts
ADD COLUMN IF NOT EXISTS public_id TEXT;

UPDATE posts
SET public_id = substring(replace(id::text, '-', '') from 1 for 7)
WHERE public_id IS NULL OR public_id = '';

ALTER TABLE posts
ALTER COLUMN public_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS posts_public_id_idx ON posts(public_id);

