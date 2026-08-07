-- Make friend link writes explicit for the authenticated admin session.
ALTER TABLE friend_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage friend links" ON friend_links;
DROP POLICY IF EXISTS "Friend links admin select" ON friend_links;
DROP POLICY IF EXISTS "Friend links public application insert" ON friend_links;
DROP POLICY IF EXISTS "Friend links admin insert" ON friend_links;
DROP POLICY IF EXISTS "Friend links admin update" ON friend_links;
DROP POLICY IF EXISTS "Friend links admin delete" ON friend_links;

CREATE POLICY "Friend links admin insert"
  ON friend_links FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Friend links public application insert"
  ON friend_links FOR INSERT
  TO anon
  WITH CHECK (status = 'pending');

CREATE POLICY "Friend links admin select"
  ON friend_links FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Friend links admin update"
  ON friend_links FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Friend links admin delete"
  ON friend_links FOR DELETE
  TO authenticated
  USING (true);
