-- Create public bucket for comic covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('comic-covers', 'comic-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public can view comic covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'comic-covers');

-- Service role can upload
CREATE POLICY "Service role can upload comic covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'comic-covers' AND auth.role() = 'service_role');

-- Service role can update
CREATE POLICY "Service role can update comic covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'comic-covers' AND auth.role() = 'service_role');