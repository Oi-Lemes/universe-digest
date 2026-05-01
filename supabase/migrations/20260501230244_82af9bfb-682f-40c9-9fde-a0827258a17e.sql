INSERT INTO storage.buckets (id, name, public) VALUES ('generated-covers', 'generated-covers', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read generated covers" ON storage.objects FOR SELECT USING (bucket_id = 'generated-covers');
CREATE POLICY "Service role write generated covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'generated-covers');