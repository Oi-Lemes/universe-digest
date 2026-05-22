import { useEffect, useState } from "react";
import { DriveNode } from "@/lib/drive";
import { getOnlineCover } from "@/lib/online-cover";

type Props = {
  /** Já ordenados por popularidade (mais lidos primeiro). */
  items: DriveNode[];
  /** Quantos títulos do topo entram no carrossel. */
  limit?: number;
};

/**
 * Faixa de capas dos títulos mais lidos rolando infinitamente para a esquerda.
 * Duplica a lista para criar o loop sem corte. Sem interação — só visual.
 */
export const InfiniteCoverMarquee = ({ items, limit = 20 }: Props) => {
  const top = items.slice(0, limit);
  const [covers, setCovers] = useState<Array<{ id: string; name: string; url: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    const used = new Set<number>();
    const usedUrls = new Set<string>();
    (async () => {
      const results: Array<{ id: string; name: string; url: string }> = [];
      const seenUrls = new Set<string>();
      for (const node of top) {
        const url = await getOnlineCover(node.name, used, "manga", usedUrls);
        if (cancelled) return;
        if (url && !seenUrls.has(url)) {
          seenUrls.add(url);
          results.push({ id: node.id, name: node.name, url });
        }
        if (results.length && results.length % 3 === 0) {
          setCovers([...results]);
        }
      }
      if (!cancelled) setCovers(results);
    })();
    return () => { cancelled = true; };
  }, [top.map((t) => t.id).join("|")]);

  if (covers.length < 4) return null;

  // Duplica para o loop perfeito
  const loop = [...covers, ...covers];

  return (
    <div className="relative mb-5 -mx-4 sm:mx-0 overflow-hidden rounded-lg border border-border/50 bg-gradient-to-r from-background via-secondary/30 to-background py-3">
      <div className="flex items-center gap-2 px-4 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
          🔥 Mais lidos agora
        </span>
        <span className="text-[10px] text-muted-foreground">
          {covers.length} títulos em destaque
        </span>
      </div>
      <div className="relative w-full overflow-hidden">
        <div
          className="flex gap-3 w-max animate-[marquee_60s_linear_infinite] hover:[animation-play-state:paused]"
        >
          {loop.map((c, i) => (
            <div
              key={`${c.id}-${i}`}
              className="relative shrink-0 w-[90px] sm:w-[110px] aspect-[2/3] rounded-md overflow-hidden ring-1 ring-primary/20 shadow-md"
              title={c.name}
            >
              <img
                src={c.url}
                alt={c.name}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                <div className="text-[9px] font-medium text-white line-clamp-2 leading-tight">
                  {c.name}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Fades laterais */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
      </div>
    </div>
  );
};
