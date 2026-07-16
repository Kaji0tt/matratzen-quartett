-- ============================================================
-- Matratzen Quartett – Storage Bucket & Policies
-- ============================================================

-- Create storage bucket for card images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'card-images',
  'card-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read access for all card images
CREATE POLICY "Card images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'card-images');

-- Authenticated users can upload to their own folder (card-images/{user_id}/*)
CREATE POLICY "Authenticated users can upload card images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'card-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update (replace) their own images
CREATE POLICY "Users can update own card images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'card-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own images
CREATE POLICY "Users can delete own card images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'card-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
