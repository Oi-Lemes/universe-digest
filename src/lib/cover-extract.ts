// Extrai a 1ª imagem (capa) de um CBR/CBZ/RAR/ZIP do Google Drive,
// faz downscale e armazena em IndexedDB para reutilização instantânea.
//
// Estratégia:
//  - Limita concorrência global (CONCURRENCY) para não detonar a banda.
//  - Cacheia resultado (mesmo "sem imagem encontrada") para não re-tentar.
//  - Downscale para ~360px de largura, JPEG q=0.78 → ~20-40 KB por capa.

import { driveProxyHeaders } from "@/lib/drive";

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-proxy`;
const DB_NAME = "cover-cache-v1";
const STORE = "covers";
const TARGET_WIDTH = 360;
const JPEG_QUALITY = 0.78;
const CONCURRENCY = 4;
const MAX_ATTEMPTS = 3;
const IMAGE_RE = /\.(jpe?g|png|webp|gif|bmp|avif)$/i;

// ---------- IndexedDB helpers ----------

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

type CacheEntry = { dataUrl: string | null; ts: number };

async function cacheGet(key: string): Promise<CacheEntry | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as CacheEntry) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function cacheSet(key: string, entry: CacheEntry): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(entry, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* ignore — extração ainda funciona, só sem persistência */
  }
}

// ---------- Concurrency limiter ----------

let inFlight = 0;
const queue: Array<() => void> = [];

function acquire(): Promise<void> {
  return new Promise((resolve) => {
    const tryStart = () => {
      if (inFlight < CONCURRENCY) {
        inFlight++;
        resolve();
      } else {
        queue.push(tryStart);
      }
    };
    tryStart();
  });
}

function release() {
  inFlight = Math.max(0, inFlight - 1);
  const next = queue.shift();
  if (next) next();
}

// ---------- Image downscale ----------

async function downscaleToDataUrl(blob: Blob): Promise<string> {
  // Try createImageBitmap first (faster, off-main-thread decode in modern browsers)
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    // Fallback via <img>
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const el = new Image();
      el.onload = () => {
        URL.revokeObjectURL(url);
        resolve(el);
      };
      el.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("image decode failed"));
      };
      el.src = url;
    });
    const ratio = img.width > 0 ? Math.min(1, TARGET_WIDTH / img.width) : 1;
    const w = Math.max(1, Math.round(img.width * ratio));
    const h = Math.max(1, Math.round(img.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context unavailable");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  }

  const ratio = bitmap.width > 0 ? Math.min(1, TARGET_WIDTH / bitmap.width) : 1;
  const w = Math.max(1, Math.round(bitmap.width * ratio));
  const h = Math.max(1, Math.round(bitmap.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

// ---------- Main API ----------

const memoryCache = new Map<string, string | null>();
const inFlightExtract = new Map<string, Promise<string | null>>();

export function getCachedCover(fileId: string): string | null | undefined {
  return memoryCache.get(fileId);
}

// Pré-carrega todas as capas extraídas (CBR/CBZ) do IndexedDB para memória,
// para que, ao reabrir a aba, as miniaturas já apareçam instantaneamente.
let prewarmed: Promise<void> | null = null;
export function prewarmExtractedCovers(): Promise<void> {
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
            const entry = cursor.value as CacheEntry;
            if (entry) memoryCache.set(String(cursor.key), entry.dataUrl);
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

/**
 * Extrai (ou recupera do cache) a capa de um arquivo CBR/CBZ.
 * Retorna `null` se nenhum frame de imagem foi encontrado.
 */
export async function extractCover(fileId: string, fileName: string): Promise<string | null> {
  if (memoryCache.has(fileId)) return memoryCache.get(fileId)!;
  const existing = inFlightExtract.get(fileId);
  if (existing) return existing;

  const job = (async () => {
    // Persistent cache hit — só reaproveita quando temos uma capa de fato.
    // Entradas null antigas são ignoradas pra forçar nova tentativa
    // (garante que todo CBR acabe com capa original).
    const cached = await cacheGet(fileId);
    if (cached && cached.dataUrl) {
      memoryCache.set(fileId, cached.dataUrl);
      return cached.dataUrl;
    }

    await acquire();
    try {
      let lastErr: unknown = null;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const proxied = `${PROXY_URL}?id=${encodeURIComponent(fileId)}`;
          const res = await fetch(proxied, { cache: "force-cache", headers: driveProxyHeaders() });
          if (!res.ok) throw new Error(`download ${res.status}`);
          const blob = await res.blob();

          const { Archive } = await import("libarchive.js");
          Archive.init({ workerUrl: "/libarchive/worker-bundle.js" });

          const archive = await Archive.open(
            new File([blob], fileName, { type: "application/octet-stream" })
          );
          const arr = await archive.getFilesArray();

          const imageEntries = arr
            .filter((e: { file: { name: string } }) => IMAGE_RE.test(e.file.name))
            .sort(
              (
                a: { file: { name: string }; path: string },
                b: { file: { name: string }; path: string }
              ) =>
                `${a.path}${a.file.name}`.localeCompare(
                  `${b.path}${b.file.name}`,
                  undefined,
                  { numeric: true }
                )
            );

          if (!imageEntries.length) {
            // Arquivo sem imagens — não há o que extrair. Cacheia null
            // pra não re-baixar o mesmo CBR vazio toda vez.
            memoryCache.set(fileId, null);
            await cacheSet(fileId, { dataUrl: null, ts: Date.now() });
            return null;
          }

          const firstFile: Blob = await imageEntries[0].file.extract();
          const dataUrl = await downscaleToDataUrl(firstFile);
          memoryCache.set(fileId, dataUrl);
          await cacheSet(fileId, { dataUrl, ts: Date.now() });
          return dataUrl;
        } catch (e) {
          lastErr = e;
          if (attempt < MAX_ATTEMPTS) {
            // Backoff exponencial: 600ms, 1.2s, 2.4s…
            await new Promise((r) => setTimeout(r, 600 * 2 ** (attempt - 1)));
          }
        }
      }
      // Esgotou tentativas — NÃO cacheia (permite nova tentativa depois,
      // pra que nenhum CBR fique permanentemente sem capa por falha de rede).
      console.warn("[cover-extract] esgotou tentativas para", fileName, lastErr);
      return null;
    } finally {
      release();
      inFlightExtract.delete(fileId);
    }
  })();


  inFlightExtract.set(fileId, job);
  return job;
}
