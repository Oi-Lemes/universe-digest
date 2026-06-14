import { supabase } from "@/integrations/supabase/client";

const BUCKET = "comic-covers";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

let cache: Promise<Map<string, string>> | null = null;

export function publicCoverUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** Loads the file_id → public URL map from comic_cover_index. Cached. */
export function loadBucketCovers(): Promise<Map<string, string>> {
  if (!cache) {
    cache = (async () => {
      const map = new Map<string, string>();
      try {
        // Paginate to be safe (could be 10k+ entries)
        const pageSize = 1000;
        let from = 0;
        for (;;) {
          const { data, error } = await supabase
            .from("comic_cover_index")
            .select("file_id,bucket_path")
            .eq("status", "ok")
            .range(from, from + pageSize - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          for (const row of data) {
            if (row.file_id && row.bucket_path) {
              map.set(row.file_id, publicCoverUrl(row.bucket_path));
            }
          }
          if (data.length < pageSize) break;
          from += pageSize;
        }
      } catch (e) {
        console.warn("[bucket-covers] load failed", e);
      }
      return map;
    })();
  }
  return cache;
}

let memMap: Map<string, string> = new Map();
loadBucketCovers().then((m) => (memMap = m));

export function getBucketCoverSync(fileId: string): string | undefined {
  return memMap.get(fileId);
}
