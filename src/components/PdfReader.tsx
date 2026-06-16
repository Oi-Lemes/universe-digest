import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, ChevronRight, Loader2, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { downloadDriveFile, driveProxyHeaders, fileContentUrl } from "@/lib/drive";
import { useAuth } from "@/hooks/useAuth";
import * as pdfjsLib from "pdfjs-dist";

// Worker servido localmente (evita CORS e funciona offline depois do 1º load).
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

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
  const loadingTaskRef = useRef<ReturnType<typeof pdfjsLib.getDocument> | null>(null);

  // Abre o PDF por range/stream, sem baixar o arquivo inteiro na memória.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(1);
    setProgress("Carregando PDF…");

    (async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: fileContentUrl(fileId, fileName),
          httpHeaders: driveProxyHeaders(),
          rangeChunkSize: 256 * 1024,
        });
        loadingTaskRef.current = loadingTask;
        loadingTask.onProgress = ({ loaded, total }) => {
          if (cancelled) return;
          if (total) setProgress(`Carregando… ${Math.round((loaded / total) * 100)}%`);
          else if (loaded) setProgress(`Carregando… ${(loaded / 1024 / 1024).toFixed(1)} MB`);
        };
        const doc = await loadingTask.promise;
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
      loadingTaskRef.current?.destroy();
      loadingTaskRef.current = null;
    };
  }, [fileId, fileName]);

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
