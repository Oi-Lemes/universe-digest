// Agrupa arquivos "soltos" (CBR/CBZ/PDF) em pastas virtuais por série,
// pra que editoras como Marvel não exibam dezenas de edições avulsas no nível
// raiz. Quando 2+ arquivos compartilham o mesmo "nome de série" inferido
// (tudo antes do marcador de volume/número), eles viram uma pasta virtual.

import type { DriveNode } from "./drive";

// Marcadores que indicam onde termina o nome da série e começa a numeração.
// Casamos com o ÚLTIMO marcador da string para tolerar nomes com hifens.
const SERIES_SPLIT_RE =
  /\s*[-–—]?\s*(?:volume|vol\.?|tomo|tomos|edi[cç][aã]o|ed\.?|n[º°o]\.?|#)\s*\d+.*$|\s+\d{1,4}\s*(?:\.|$)|\s+#\d+.*$/i;

// Sufixos editoriais que não devem influenciar o agrupamento.
const TRAILING_NOISE_RE = /\s*[-–—]?\s*(?:[úu]ltimo|final|completo|oficial|panini|abril|salvat|hq br|br|pt-?br)\s*$/i;

function stripExt(name: string): string {
  return name.replace(/\.(cbr|cbz|cb7|pdf|epub|zip|rar)$/i, "");
}

/** Extrai o nome canônico da série a partir do nome de arquivo. */
function inferSeriesName(fileName: string): string | null {
  let base = stripExt(fileName).trim();
  // Tenta cortar no marcador de volume/número.
  const cut = base.search(SERIES_SPLIT_RE);
  if (cut > 3) base = base.slice(0, cut).trim();
  // Limpa sufixos editoriais.
  for (let i = 0; i < 3; i++) {
    const next = base.replace(TRAILING_NOISE_RE, "").trim();
    if (next === base) break;
    base = next;
  }
  // Remove parênteses finais "(Panini)" etc.
  base = base.replace(/\s*\([^)]*\)\s*$/g, "").trim();
  // Remove pontuação solta no fim.
  base = base.replace(/[-–—.:,;]+$/g, "").trim();
  if (base.length < 3) return null;
  return base;
}

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Recebe os filhos diretos de uma pasta e, quando há 2+ arquivos com a mesma
 * série inferida, agrupa-os numa pasta virtual. Mantém arquivos únicos e
 * pastas reais intactos. Idempotente.
 */
export function groupLooseSeries(children: DriveNode[]): DriveNode[] {
  if (!children?.length) return children ?? [];

  const folders: DriveNode[] = [];
  const fileBuckets = new Map<string, { display: string; files: DriveNode[] }>();
  const singles: DriveNode[] = [];

  for (const node of children) {
    if (node.type === "folder") {
      folders.push(node);
      continue;
    }
    const series = inferSeriesName(node.name);
    if (!series) {
      singles.push(node);
      continue;
    }
    const key = normalizeKey(series);
    const bucket = fileBuckets.get(key);
    if (bucket) {
      bucket.files.push(node);
    } else {
      fileBuckets.set(key, { display: series, files: [node] });
    }
  }

  const grouped: DriveNode[] = [];
  for (const { display, files } of fileBuckets.values()) {
    if (files.length >= 2) {
      // Pasta virtual estável: id derivado dos ids dos filhos pra não colidir.
      const virtualId = `virtual:${files
        .map((f) => f.id)
        .sort()
        .join(":")
        .slice(0, 80)}`;
      grouped.push({
        id: virtualId,
        name: display,
        type: "folder",
        children: files.sort((a, b) =>
          a.name.localeCompare(b.name, "pt-BR", { numeric: true })
        ),
      });
    } else {
      singles.push(...files);
    }
  }

  return [...folders, ...grouped, ...singles];
}
