import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, ChevronRight, Loader2, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { downloadDriveFile, driveProxyHeaders, fileContentUrl, resolveDriveFileId } from "@/lib/drive";
import { useAuth } from "@/hooks/useAuth";
import * as pdfjsLib from "pdfjs-dist";

// Worker servido localmente (evita CORS e funciona offline depois do 1º load).
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// ---------- Cache em IndexedDB (PDF inteiro como Blob) ----------
const DB_NAME = "pdf-cache-v2";
const STORE = "pdfs";
let dbPromise: Promise<IDBDatabase> | null = null;
function openDb() {
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
async function cacheGet(key: string): Promise<Blob | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as Blob) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}
async function cacheSet(key: string, blob: Blob) {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* sem cache, segue */
  }
}

async function cacheDelete(key: string) {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* sem cache, segue */
  }
}

function looksLikePdf(buf: ArrayBuffer) {
  const head = new TextDecoder("ascii").decode(buf.slice(0, 5));
  return head === "%PDF-";
}

type Props = { fileId: string; fileName: string };

export const PdfReader = ({ fileId, fileName }: Props) => {
  const { isTrial } = useAuth();
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState("Carregando PDF…");
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  // Carrega bytes (cache → proxy) e abre o PDF.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(1);
    setProgress("Procurando no cache…");

    (async () => {
      try {
        let blob = await cacheGet(fileId);
        if (!blob) {
          setProgress("Baixando PDF…");
          const res = await fetch(fileContentUrl(fileId, fileName), {
            cache: "no-store",
            headers: driveProxyHeaders(),
          });
          if (!res.ok) throw new Error(`Falha no download (${res.status})`);
          const total = Number(res.headers.get("content-length") || 0);
          const reader = res.body?.getReader();
          const chunks: Uint8Array[] = [];
          let received = 0;
          if (reader) {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              if (value) {
                chunks.push(value);
                received += value.byteLength;
                if (total) {
                  setProgress(`Baixando… ${Math.round((received / total) * 100)}%`);
                } else {
                  setProgress(`Baixando… ${(received / 1024 / 1024).toFixed(1)} MB`);
                }
              }
            }
          }
          if (cancelled) return;
          blob = new Blob(chunks as BlobPart[], { type: "application/pdf" });
          // Salva no cache para próximas aberturas serem instantâneas.
          cacheSet(fileId, blob);
        } else {
          setProgress("Abrindo do cache…");
        }

        const buf = await blob.arrayBuffer();
        if (cancelled) return;
        if (!looksLikePdf(buf)) throw new Error("O arquivo recebido não é um PDF válido.");
        const doc = await pdfjsLib.getDocument({ data: buf }).promise;
        if (cancelled) {
          doc.destroy();
          return;
        }
        setPdf(doc);
        setNumPages(doc.numPages);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileId]);

  // Cleanup do documento ao trocar de arquivo / desmontar.
  useEffect(() => {
    return () => {
      pdf?.destroy();
    };
  }, [pdf]);

  // Renderiza página atual no canvas.
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const p = await pdf.getPage(page);
        if (cancelled) return;
        const container = containerRef.current;
        const maxW = container ? container.clientWidth - 16 : window.innerWidth;
        const viewport0 = p.getViewport({ scale: 1 });
        const fitScale = (maxW / viewport0.width) * scale;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = p.getViewport({ scale: fitScale * dpr });
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;
        renderTaskRef.current?.cancel();
        const task = p.render({ canvasContext: ctx, viewport, canvas });
        renderTaskRef.current = task;
        await task.promise;
      } catch (e) {
        // Ignora erro de cancelamento de render.
      }
    })();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [pdf, page, scale]);

  // Teclado: setas e espaço.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") setPage((p) => Math.min(p + 1, numPages));
      else if (e.key === "ArrowLeft") setPage((p) => Math.max(p - 1, 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [numPages]);

  const handleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
        <p className="text-destructive font-semibold">Não foi possível abrir o PDF</p>
        <p className="text-sm text-muted-foreground max-w-md">{error}</p>
        {!isTrial && (
          <Button type="button" size="sm" variant="secondary" onClick={() => void downloadDriveFile(fileId, fileName)}>
            Baixar arquivo
          </Button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">{progress}</p>
        <p className="text-[11px] opacity-70">Na primeira vez pode demorar. Depois abre na hora.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 min-h-0 flex flex-col bg-black">
      <div className="relative flex-1 overflow-auto flex items-center justify-center select-none">
        <canvas ref={canvasRef} className="block mx-auto" />
        <button
          type="button"
          aria-label="Página anterior"
          className="absolute left-0 top-0 h-full w-1/3 cursor-w-resize"
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
        />
        <button
          type="button"
          aria-label="Próxima página"
          className="absolute right-0 top-0 h-full w-1/3 cursor-e-resize"
          onClick={() => setPage((p) => Math.min(p + 1, numPages))}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] border-t border-border bg-secondary/40 shrink-0">
        <Button size="icon" variant="ghost" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-xs tabular-nums text-muted-foreground w-16 text-center">
          {page} / {numPages}
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8" disabled={page >= numPages} onClick={() => setPage((p) => Math.min(p + 1, numPages))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <Slider value={[page]} min={1} max={Math.max(numPages, 1)} step={1} onValueChange={(v) => setPage(v[0] ?? 1)} />
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setScale((s) => Math.max(s - 0.2, 0.4))} aria-label="Diminuir zoom">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setScale((s) => Math.min(s + 0.2, 3))} aria-label="Aumentar zoom">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleFullscreen} aria-label="Tela cheia">
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
