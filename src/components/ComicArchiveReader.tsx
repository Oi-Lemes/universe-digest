import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft, ChevronRight, Loader2, Maximize2 } from "lucide-react";
import { fileDownloadUrl } from "@/lib/drive";
import { useAuth } from "@/hooks/useAuth";

// Supabase edge function that proxies Google Drive downloads with CORS headers
// so libarchive.js can read the bytes from the browser.
const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drive-proxy`;

type Props = {
  fileId: string;
  fileName: string;
};

type Page = { name: string; url: string };

const IMAGE_RE = /\.(jpe?g|png|webp|gif|bmp|avif)$/i;

export const ComicArchiveReader = ({ fileId, fileName }: Props) => {
  const { isTrial } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<string>("Baixando arquivo…");
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const objectUrls = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    objectUrls.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrls.current = [];
    setPages([]);
    setIndex(0);
    setError(null);
    setLoading(true);
    setProgress("Baixando arquivo…");

    (async () => {
      try {
        const proxied = `${PROXY_URL}?id=${encodeURIComponent(fileId)}`;
        const res = await fetch(proxied);
        if (!res.ok) throw new Error(`Falha no download (${res.status})`);

        // Stream-aware progress when content-length is known.
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
                const pct = Math.round((received / total) * 100);
                setProgress(`Baixando… ${pct}%`);
              } else {
                setProgress(`Baixando… ${(received / 1024 / 1024).toFixed(1)} MB`);
              }
            }
          }
        }
        if (cancelled) return;
        const blob = new Blob(chunks as BlobPart[]);

        setProgress("Descomprimindo páginas…");

        // Dynamic import keeps libarchive.js out of the initial bundle.
        const { Archive } = await import("libarchive.js");
        Archive.init({ workerUrl: "/libarchive/worker-bundle.js" });

        const archive = await Archive.open(
          new File([blob], fileName, { type: "application/octet-stream" })
        );
        const arr = await archive.getFilesArray();

        // Filter to images only, preserving alphabetical order so reading flows
        // naturally page-by-page.
        const imageEntries = arr
          .filter((e: { file: { name: string } }) => IMAGE_RE.test(e.file.name))
          .sort(
            (
              a: { file: { name: string }; path: string },
              b: { file: { name: string }; path: string }
            ) => {
              const an = `${a.path}${a.file.name}`;
              const bn = `${b.path}${b.file.name}`;
              return an.localeCompare(bn, undefined, { numeric: true });
            }
          );

        if (imageEntries.length === 0) {
          throw new Error("Nenhuma imagem encontrada dentro do arquivo.");
        }

        const out: Page[] = [];
        for (let i = 0; i < imageEntries.length; i++) {
          if (cancelled) break;
          const entry = imageEntries[i];
          const file: Blob = await entry.file.extract();
          const url = URL.createObjectURL(file);
          objectUrls.current.push(url);
          out.push({ name: entry.file.name, url });
          if (i % 5 === 0) {
            setProgress(`Descomprimindo… ${i + 1}/${imageEntries.length}`);
          }
        }
        if (cancelled) return;
        setPages(out);
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
  }, [fileId, fileName]);

  // Keyboard navigation: arrow keys to flip pages.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        setIndex((i) => Math.min(i + 1, pages.length - 1));
      } else if (e.key === "ArrowLeft") {
        setIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pages.length]);

  // Cleanup blob URLs on unmount.
  useEffect(() => {
    return () => {
      objectUrls.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrls.current = [];
    };
  }, []);

  const handleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  };

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
        <p className="text-destructive font-semibold">Não foi possível abrir o arquivo</p>
        <p className="text-sm text-muted-foreground max-w-md">{error}</p>
        {!isTrial && (
          <Button asChild size="sm" variant="secondary">
            <a href={fileDownloadUrl(fileId)} download={fileName}>
              Baixar arquivo
            </a>
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
        <p className="text-[11px] opacity-70">Arquivos grandes podem demorar alguns segundos.</p>
      </div>
    );
  }

  const current = pages[index];

  return (
    <div ref={containerRef} className="flex-1 flex flex-col bg-black">
      <div className="relative flex-1 overflow-auto flex items-center justify-center select-none">
        {current && (
          <img
            key={current.url}
            src={current.url}
            alt={`Página ${index + 1}`}
            className="max-h-full max-w-full object-contain mx-auto"
            draggable={false}
          />
        )}

        {/* Click zones for left/right page flipping */}
        <button
          type="button"
          aria-label="Página anterior"
          className="absolute left-0 top-0 h-full w-1/3 cursor-w-resize"
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
        />
        <button
          type="button"
          aria-label="Próxima página"
          className="absolute right-0 top-0 h-full w-1/3 cursor-e-resize"
          onClick={() => setIndex((i) => Math.min(i + 1, pages.length - 1))}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-secondary/40">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-xs tabular-nums text-muted-foreground w-16 text-center">
          {index + 1} / {pages.length}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          disabled={index >= pages.length - 1}
          onClick={() => setIndex((i) => Math.min(i + 1, pages.length - 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <Slider
            value={[index]}
            min={0}
            max={Math.max(pages.length - 1, 0)}
            step={1}
            onValueChange={(v) => setIndex(v[0] ?? 0)}
          />
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleFullscreen}
          aria-label="Tela cheia"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
