// Busca capas reais (AniList) por nome para mangás/manhwas/manhuas.
// Cache em IndexedDB para nunca repetir a chamada.
// Negativos também são cacheados para evitar tempestade de requests.

const DB_NAME = "online-cover-cache-v1";
const STORE = "covers";

let dbPromise: Promise<IDBDatabase> | null = null;
function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

type Entry = { url: string | null; ts: number };

async function cacheGet(key: string): Promise<Entry | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as Entry) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch { return null; }
}
async function cacheSet(key: string, e: Entry) {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(e, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* ignore */ }
}

// In-memory cache + de-duplication
const mem = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

/** Normaliza o nome de pasta/arquivo em um título pesquisável. */
export function normalizeTitle(raw: string): string {
  let s = raw;
  s = s.replace(/\.(cbr|cbz|rar|zip|pdf|epub)$/i, "");
  s = s.replace(/\b(vol(?:ume)?|cap(?:[ií]tulo|[ií]t)?|chapter|ch|tomo|tomo|tome|episodio|ep)\b\.?\s*\d+(?:\.\d+)?/gi, "");
  s = s.replace(/\b\d{1,4}\b/g, " ");
  s = s.replace(/[_\-–—]+/g, " ");
  s = s.replace(/\([^)]*\)/g, " ");
  s = s.replace(/\[[^\]]*\]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

const ANILIST_QUERY = `
query ($search: String) {
  Media(search: $search, type: MANGA) {
    id
    title { romaji english native }
    coverImage { extraLarge large medium }
  }
}`;

async function fetchAniList(title: string): Promise<string | null> {
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query: ANILIST_QUERY, variables: { search: title } }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const cover = j?.data?.Media?.coverImage;
    return cover?.extraLarge || cover?.large || cover?.medium || null;
  } catch {
    return null;
  }
}

const MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 dias

/** Busca capa online (AniList) com cache. */
export async function getOnlineCover(rawName: string): Promise<string | null> {
  const title = normalizeTitle(rawName);
  if (!title || title.length < 2) return null;
  const key = title.toLowerCase();

  if (mem.has(key)) return mem.get(key) ?? null;

  const cached = await cacheGet(key);
  if (cached && Date.now() - cached.ts < MAX_AGE) {
    mem.set(key, cached.url);
    return cached.url;
  }

  if (inflight.has(key)) return inflight.get(key)!;
  const p = (async () => {
    const url = await fetchAniList(title);
    mem.set(key, url);
    cacheSet(key, { url, ts: Date.now() });
    inflight.delete(key);
    return url;
  })();
  inflight.set(key, p);
  return p;
}

/** Lookup somente em memória (sincrônico). Útil pra render imediato. */
export function getCachedOnlineCover(rawName: string): string | null | undefined {
  const key = normalizeTitle(rawName).toLowerCase();
  if (mem.has(key)) return mem.get(key);
  return undefined;
}
