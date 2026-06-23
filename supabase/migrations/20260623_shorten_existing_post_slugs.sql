UPDATE posts
SET slug = 'p-' || lower(public_id)
WHERE slug <> 'about'
  AND public_id IS NOT NULL
  AND slug !~ '^p-[a-z0-9]{7}$';

