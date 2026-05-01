import { useEffect, useMemo, useRef, useState } from "react";
import {
  DriveNode,
  coverUrl,
  countDescendants,
  fileExt,
  firstArchiveIn,
  isViewableInDrive,
} from "@/lib/drive";
import { extractCover, getCachedCover } from "@/lib/cover-extract";
import { BookOpen, FolderOpen, FileWarning, Loader2, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { pickTrending } from "@/lib/manga-popularity";

type Props = {
  items: DriveNode[];
  onOpenFolder: (node: DriveNode) => void;
  onOpenFile: (node: DriveNode) => void;
  emptyHint?: string;
  /** "manga"/"manhwa" mantêm a ordem (já vem por popularidade) e mostram o badge 🔥 */
  mode?: "default" | "manga" | "manhwa";
};

const Cover = ({ node }: { node: DriveNode }) => {
  const [errored, setErrored] = useState(false);
  const directUrl = coverUrl(node, 400);
  const isFolder = node.type === "folder";
  const viewable = !isFolder && isViewableInDrive(node.name);
  // ----- Lazy CBR cover extraction fallback -----
  // When the node has no Drive thumbnail (typical for CBR/CBZ archives) we
  // try to unpack the first image from the archive itself once the card
  // becomes visible. Result is cached in IndexedDB for next loads.
  const needsArchive = !directUrl || errored;
  const archiveTarget = needsArchive ? firstArchiveIn(node) : null;
  const initialExtracted = archiveTarget ? getCachedCover(archiveTarget.id) ?? undefined : undefined;
  const [extractedUrl, setExtractedUrl] = useState<string | null | undefined>(initialExtracted);
  const [extracting, setExtracting] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!needsArchive || !archiveTarget) return;
    if (extractedUrl !== undefined) return; // already known (success or null)

    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      // Fallback: trigger immediately
      setExtracting(true);
      extractCover(archiveTarget.id, archiveTarget.name).then((url) => {
        setExtractedUrl(url);
        setExtracting(false);
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            io.disconnect();
            setExtracting(true);
            extractCover(archiveTarget.id, archiveTarget.name).then((url) => {
              setExtractedUrl(url);
              setExtracting(false);
            });
            break;
          }
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [needsArchive, archiveTarget, extractedUrl]);

  // Usa apenas capa real do próprio conteúdo: thumbnail do Drive ou a 1ª imagem
  // extraída do arquivo. Não reutiliza capa online genérica entre títulos.
  const finalUrl = errored ? extractedUrl ?? null : directUrl ?? extractedUrl ?? null;

  if (finalUrl) {
    return (
      <div
        ref={wrapRef}
        className={cn(
          "relative aspect-[2/3] rounded-md mb-2 overflow-hidden bg-secondary",
          isFolder ? "ring-1 ring-accent/30" : "ring-1 ring-primary/20"
        )}
      >
        <img
          src={finalUrl}
          alt={node.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setErrored(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {!isFolder && !viewable && (
          <span className="absolute top-1 right-1 text-[9px] uppercase font-bold bg-destructive/90 text-destructive-foreground px-1.5 py-0.5 rounded">
            {fileExt(node.name) || "?"}
          </span>
        )}
        {isFolder && (
          <span className="absolute bottom-1 left-1 bg-background/80 backdrop-blur rounded p-1">
            <FolderOpen className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
          </span>
        )}
      </div>
    );
  }

  // Sem capa real disponível: mostra somente estado neutro/loader, nunca capa falsa repetida.

  return (
    <div
      ref={wrapRef}
      className={cn(
        "aspect-[2/3] rounded-md mb-2 flex items-center justify-center relative overflow-hidden",
        isFolder
          ? "bg-gradient-to-br from-secondary to-muted"
          : "bg-gradient-to-br from-primary/30 to-accent/20"
      )}
    >
      {isFolder ? (
        <FolderOpen className="w-10 h-10 text-accent/80" strokeWidth={1.5} />
      ) : viewable ? (
        <BookOpen className="w-10 h-10 text-primary" strokeWidth={1.5} />
      ) : (
        <FileWarning className="w-10 h-10 text-destructive" strokeWidth={1.5} />
      )}
      {extracting && (
        <span className="absolute bottom-1 right-1 bg-background/70 backdrop-blur rounded p-1">
          <Loader2 className="w-3 h-3 text-primary animate-spin" />
        </span>
      )}
    </div>
  );
};

export const FolderGrid = ({ items, onOpenFolder, onOpenFile, emptyHint, mode = "default" }: Props) => {
  // Top trending para o modo "manga" — recalcula em tempo real,
  // destacando 1 dos top 6 a cada 3.5s (efeito "em alta agora").
  const isMangaLike = mode === "manga" || mode === "manhwa";
  const trendingNames = useMemo(
    () => (isMangaLike ? pickTrending(items.map((i) => i.name), 6) : []),
    [items, isMangaLike]
  );
  const [hotIdx, setHotIdx] = useState(0);
  useEffect(() => {
    if (!isMangaLike || trendingNames.length === 0) return;
    const id = setInterval(() => {
      setHotIdx((i) => (i + 1) % trendingNames.length);
    }, 3500);
    return () => clearInterval(id);
  }, [isMangaLike, trendingNames.length]);
  const hotNow = trendingNames[hotIdx] ?? null;
  const trendingSet = useMemo(
    () => new Set(trendingNames.map((n) => n.toLowerCase())),
    [trendingNames]
  );

  if (!items.length) {
    return (
      <div className="text-center text-muted-foreground py-16">
        {emptyHint ?? "Nada por aqui ainda."}
      </div>
    );
  }

  // No modo "manga"/"manhwa" mantemos a ordem (já vem por popularidade).
  const sorted =
    isMangaLike
      ? items
      : [...items].sort((a, b) => {
          if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
          return a.name.localeCompare(b.name, "pt-BR", { numeric: true });
        });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {sorted.map((node) => {
        const isFolder = node.type === "folder";
        const stats = isFolder ? countDescendants(node) : null;
        const isTrending = trendingSet.has(node.name.toLowerCase());
        const isHotNow = hotNow !== null && node.name.toLowerCase() === hotNow.toLowerCase();
        return (
          <button
            key={node.id}
            onClick={() => (isFolder ? onOpenFolder(node) : onOpenFile(node))}
            className={cn(
              "group relative text-left rounded-lg border border-border bg-card p-2 transition-all",
              "hover:border-primary hover:-translate-y-0.5 hover:shadow-[var(--shadow-comic)]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isHotNow && "border-[hsl(335_92%_60%)] shadow-[0_0_0_2px_hsl(335_92%_60%/0.45),0_8px_24px_-6px_hsl(335_92%_55%/0.6)] -translate-y-0.5"
            )}
          >
            <Cover node={node} />
            {isTrending && (
              <span
                className={cn(
                  "absolute top-1 left-1 z-10 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full",
                  "text-[9px] font-bold uppercase tracking-wide",
                  "bg-gradient-to-r from-[hsl(20_95%_55%)] via-[hsl(8_95%_52%)] to-[hsl(335_92%_55%)]",
                  "text-white shadow-[0_2px_8px_hsl(8_95%_52%/0.6)]",
                  isHotNow && "animate-pulse scale-110"
                )}
                title={isHotNow ? "🔥 Em alta agora" : "Em alta"}
              >
                <Flame className={cn("w-2.5 h-2.5", isHotNow && "animate-bounce")} strokeWidth={2.5} />
                {isHotNow ? "EM ALTA" : "HOT"}
              </span>
            )}
            <div className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-primary px-0.5">
              {node.name}
            </div>
            {stats && (
              <div className="mt-1 text-[10px] text-muted-foreground px-0.5">
                {stats.folders > 0 && `${stats.folders} pastas · `}
                {stats.files} HQs
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
