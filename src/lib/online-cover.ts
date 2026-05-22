// Busca capas reais por nome para mangás/manhwas/manhuas.
// Pipeline: AniList → Jikan (MyAnimeList) → Google Books → IA (gerada).
// Cache em IndexedDB para nunca repetir a chamada. Nunca deixa sem capa.

import { supabase } from "@/integrations/supabase/client";

const DB_NAME = "online-cover-cache-v5";
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

// Pré-aquece a memória com TUDO que já está no IndexedDB, para que ao reabrir
// a aba/app as capas já cacheadas apareçam instantaneamente (sem refazer fetch).
let prewarmed: Promise<void> | null = null;
export function prewarmOnlineCoverCache(): Promise<void> {
  if (prewarmed) return prewarmed;
  prewarmed = (async () => {
    try {
      const db = await openDb();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE, "readonly");
        const store = tx.objectStore(STORE);
        const req = store.openCursor();
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            const entry = cursor.value as Entry;
            if (entry && entry.url && Date.now() - entry.ts < MAX_AGE) {
              mem.set(String(cursor.key), entry.url);
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        req.onerror = () => resolve();
      });
    } catch { /* ignore */ }
  })();
  return prewarmed;
}

/** Normaliza o nome de pasta/arquivo em um título pesquisável. */
export function normalizeTitle(raw: string): string {
  let s = raw;
  s = s.replace(/\.(cbr|cbz|rar|zip|pdf|epub)$/i, "");
  // Remove parênteses/colchetes (scan groups, anos, etc.)
  s = s.replace(/\([^)]*\)/g, " ");
  s = s.replace(/\[[^\]]*\]/g, " ");
  // Remove markers de capítulo/volume com números
  s = s.replace(/\b(vol(?:ume)?|cap(?:[ií]tulo|[ií]t)?|chapter|ch|tomo|tome|epis[oó]dio|ep)\b\.?\s*\d+(?:[.,]\d+)?/gi, " ");
  // Remove padrões compactos tipo "C6", "C 7", "Cap6", "Ch12"
  s = s.replace(/\b(c|ch|cap)\s*\.?\s*\d+\b/gi, " ");
  // Remove números soltos curtos (capítulos)
  s = s.replace(/\b\d{1,4}\b/g, " ");
  s = s.replace(/[_\-–—:|/.]+/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/** Heurística: o nome parece um capítulo/volume isolado (não um título)? */
export function looksLikeChapter(raw: string): boolean {
  const s = raw.trim();
  // "Cap 6", "C7", "Capítulo 12", "Vol 03", "Ch 5", "Episódio 2"
  if (/^\s*(c|ch|cap|cap[ií]tulo|chapter|vol(?:ume)?|tomo|tome|epis[oó]dio|ep)\s*\.?\s*\d+/i.test(s)) return true;
  // Apenas números (eventualmente com extensão)
  if (/^\s*\d{1,4}(\s|\.|$)/.test(s)) return true;
  return false;
}

const ANILIST_QUERY = `
query ($search: String) {
  Page(perPage: 8) {
    media(search: $search, type: MANGA, sort: SEARCH_MATCH) {
      id
      title { romaji english native }
      synonyms
      coverImage { extraLarge large medium }
    }
  }
}`;

/** Normaliza string para comparação (sem acento, só alfanum). */
function canon(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Similaridade simples baseada em tokens compartilhados (Jaccard). */
function similarity(a: string, b: string): number {
  const ta = new Set(canon(a).split(/\s+/).filter(Boolean));
  const tb = new Set(canon(b).split(/\s+/).filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  ta.forEach((t) => { if (tb.has(t)) inter++; });
  return inter / Math.max(ta.size, tb.size);
}

type AniMedia = {
  id: number;
  title: { romaji?: string | null; english?: string | null; native?: string | null };
  synonyms?: string[] | null;
  coverImage: { extraLarge?: string | null; large?: string | null; medium?: string | null };
};

type OnlineCoverResult = { url: string; mediaId: number };

async function fetchAniList(title: string): Promise<OnlineCoverResult | null> {
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query: ANILIST_QUERY, variables: { search: title } }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const list: AniMedia[] = j?.data?.Page?.media ?? [];
    if (!list.length) return null;
    // Escolhe o melhor candidato comparando título buscado com todas as
    // variantes (romaji/english/native/synonyms). Exige similaridade mínima
    // pra rejeitar matches genéricos do AniList que retornam o mesmo Media
    // pra títulos diferentes (causa raiz das capas repetidas).
    let best: { media: AniMedia; score: number } | null = null;
    for (const m of list) {
      const variants = [
        m.title?.romaji,
        m.title?.english,
        m.title?.native,
        ...(m.synonyms ?? []),
      ].filter((v): v is string => !!v);
      let score = 0;
      for (const v of variants) score = Math.max(score, similarity(title, v));
      if (!best || score > best.score) best = { media: m, score };
    }
    if (!best || best.score < 0.5) return null;
    const c = best.media.coverImage;
    const url = c?.extraLarge || c?.large || c?.medium || null;
    return url ? { url, mediaId: best.media.id } : null;
  } catch {
    return null;
  }
}

const MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 dias

// ---- Fallback: Jikan (MyAnimeList) ----
async function fetchJikan(title: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(title)}&limit=8&order_by=popularity`
    );
    if (!res.ok) return null;
    const j = await res.json();
    const list: any[] = j?.data ?? [];
    let best: { url: string; score: number } | null = null;
    for (const m of list) {
      const variants = [m.title, m.title_english, m.title_japanese, ...((m.titles ?? []).map((t: any) => t.title))]
        .filter((v: any): v is string => !!v);
      let score = 0;
      for (const v of variants) score = Math.max(score, similarity(title, v));
      const url = m.images?.webp?.large_image_url || m.images?.jpg?.large_image_url || m.images?.jpg?.image_url;
      if (url && (!best || score > best.score)) best = { url, score };
    }
    if (!best || best.score < 0.5) return null;
    return best.url;
  } catch { return null; }
}

// ---- Fallback: Google Books ----
async function fetchGoogleBooks(title: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}+manga&maxResults=8&printType=books`
    );
    if (!res.ok) return null;
    const j = await res.json();
    const list: any[] = j?.items ?? [];
    let best: { url: string; score: number } | null = null;
    for (const it of list) {
      const v = it.volumeInfo;
      if (!v) continue;
      const variants = [v.title, v.subtitle, ...((v.authors ?? []))].filter((x: any): x is string => !!x);
      let score = 0;
      for (const x of variants) score = Math.max(score, similarity(title, x));
      const raw = v.imageLinks?.extraLarge || v.imageLinks?.large || v.imageLinks?.medium || v.imageLinks?.thumbnail;
      const url = raw ? String(raw).replace(/^http:/, "https:").replace(/&edge=curl/, "") : null;
      if (url && (!best || score > best.score)) best = { url, score };
    }
    if (!best || best.score < 0.4) return null;
    return best.url;
  } catch { return null; }
}

// ---- Último recurso: gerar via IA (edge function) ----
// Cache em memória de "desistir" — se a IA falhou (sem créditos / rate limit),
// não tenta de novo nesta sessão pra não floodar requisições com erro.
let aiDisabled = false;

async function generateAICover(title: string, kind: "manga" | "manhwa"): Promise<string | null> {
  if (aiDisabled) return null;
  try {
    const { data, error } = await supabase.functions.invoke("cover-generate", {
      body: { title, kind },
    });
    if (error) {
      const msg = String((error as any)?.message ?? "");
      if (msg.includes("402") || msg.includes("429")) aiDisabled = true;
      return null;
    }
    const d = data as any;
    if (d?.fallback || !d?.url) {
      if (d?.aiStatus === 402 || d?.aiStatus === 429) aiDisabled = true;
      return null;
    }
    return d.url ?? null;
  } catch { return null; }
}

/**
 * Pipeline em cascata: AniList → Jikan → Google Books → IA gerada.
 * Garante que sempre retorna uma URL válida para títulos não-capítulos.
 */
// Mapa global URL → key (título) que já está usando a URL. Garante que duas
// edições/pastas diferentes NUNCA terminem com a mesma capa.
const urlOwner = new Map<string, string>();

function claimUrl(url: string | null, key: string, usedUrls?: Set<string>): boolean {
  if (!url) return false;
  const owner = urlOwner.get(url);
  if (owner && owner !== key) return false;
  if (usedUrls?.has(url) && owner !== key) return false;
  urlOwner.set(url, key);
  usedUrls?.add(url);
  return true;
}

export async function getOnlineCover(
  rawName: string,
  usedMediaIds?: Set<number>,
  kind: "manga" | "manhwa" = "manga",
  usedUrls?: Set<string>
): Promise<string | null> {
  if (looksLikeChapter(rawName)) return null;
  const title = normalizeTitle(rawName);
  if (!title || title.length < 3) return null;
  const key = `${kind}:${title.toLowerCase()}`;

  if (mem.has(key)) {
    const u = mem.get(key) ?? null;
    if (u) { urlOwner.set(u, key); usedUrls?.add(u); }
    return u;
  }

  const cached = await cacheGet(key);
  if (cached && Date.now() - cached.ts < MAX_AGE && cached.url) {
    // Só reusa o cache se ninguém mais reivindicou essa URL.
    if (claimUrl(cached.url, key, usedUrls)) {
      mem.set(key, cached.url);
      return cached.url;
    }
  }

  if (inflight.has(key)) return inflight.get(key)!;
  const p = (async () => {
    let url: string | null = null;

    const ani = await fetchAniList(title);
    if (ani && !usedMediaIds?.has(ani.mediaId) && claimUrl(ani.url, key, usedUrls)) {
      url = ani.url;
      usedMediaIds?.add(ani.mediaId);
    }

    if (!url) {
      const j = await fetchJikan(title);
      if (claimUrl(j, key, usedUrls)) url = j;
    }
    if (!url) {
      const g = await fetchGoogleBooks(title);
      if (claimUrl(g, key, usedUrls)) url = g;
    }
    if (!url) {
      const a = await generateAICover(title, kind);
      if (claimUrl(a, key, usedUrls)) url = a;
    }

    mem.set(key, url);
    cacheSet(key, { url, ts: Date.now() });
    inflight.delete(key);
    return url;
  })();
  inflight.set(key, p);
  return p;
}

/** Lookup somente em memória (sincrônico). Útil pra render imediato. */
export function getCachedOnlineCover(rawName: string, kind: "manga" | "manhwa" = "manga"): string | null | undefined {
  const key = `${kind}:${normalizeTitle(rawName).toLowerCase()}`;
  if (mem.has(key)) return mem.get(key);
  return undefined;
}
