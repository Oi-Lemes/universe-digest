
CREATE TABLE public.comic_cover_index (
  file_id text PRIMARY KEY,
  bucket_path text NOT NULL,
  publisher text NOT NULL,
  status text NOT NULL DEFAULT 'ok',
  extracted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.comic_cover_index TO anon, authenticated;
GRANT ALL ON public.comic_cover_index TO service_role;

ALTER TABLE public.comic_cover_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read comic_cover_index"
  ON public.comic_cover_index
  FOR SELECT
  USING (true);

CREATE TRIGGER comic_cover_index_set_updated_at
  BEFORE UPDATE ON public.comic_cover_index
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
