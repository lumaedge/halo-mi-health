-- Create medical-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-images',
  'medical-images',
  false,
  20971520,
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: patients can view their own images
CREATE POLICY "Patients can view own medical images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM profiles WHERE user_id = auth.uid()
    )
  );

-- RLS: providers can manage all medical images
CREATE POLICY "Providers can manage medical images"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'medical-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('provider', 'admin')
    )
  );
