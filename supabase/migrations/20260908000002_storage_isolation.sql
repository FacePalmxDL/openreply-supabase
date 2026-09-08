-- Restrict card image writes to <auth.uid()>/... object paths.
-- Public reads remain enabled because Meta must fetch card images by URL.

DROP POLICY IF EXISTS "Auth users upload card images" ON storage.objects;
CREATE POLICY "Auth users upload card images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'card-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Auth users delete card images" ON storage.objects;
CREATE POLICY "Auth users delete card images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'card-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
