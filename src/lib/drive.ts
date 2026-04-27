export type DriveNode = {
  id: string;
  name: string;
  type: "folder" | "file";
  children?: DriveNode[];
  coverUrl?: string;
};

export type DriveTree = {
  id: string;
  name: string;
  children: DriveNode[];
};

let cache: Promise<DriveTree> | null = null;
const DRIVE_TREE_VERSION = "2026-04-25-8";

/**
 * Aplica capas manuais (cover_overrides.json) em pastas/arquivos cujo id
 * está mapeado. Útil pra acervos onde o Drive não gera thumbnail (CBR/CBZ).
 * O id no JSON é o id da pasta (ou arquivo) — vira node.coverUrl.
 */
function applyCoverOverrides(node: DriveNode, overrides: Record<string, string>): DriveNode {
  const url = overrides[node.id];
  const next: DriveNode = url && !node.coverUrl ? { ...node, coverUrl: url } : node;
  if (!next.children) return next;
  return { ...next, children: next.children.map((c) => applyCoverOverrides(c, overrides)) };
}

/**
 * Remove "clones literais" gerados pelo Drive: um arquivo cujo nome é
 * exatamente outro + sufixo " (1)" / "(1)" / "(2)" etc. antes da extensão,
 * desde que o "original" (sem o sufixo) exista na MESMA pasta.
 *
 * Exemplos removidos:
 *   "Foo.pdf" + "Foo (1).pdf"     → remove o (1)
 *   "Bar.cbr" + "Bar(1).cbr"      → remove o (1)
 *   "X.PDF"   + "X (1).PDF" + "X (2).PDF" → mantém só "X.PDF"
 *
 * Não remove arquivos onde o (N) faz parte do nome original (ex: anos
 * "(2022)") porque exigimos que exista a versão SEM o sufixo na mesma pasta.
 */
const CLONE_PAT = /^(.+?)\s*\((\d+)\)(\.[A-Za-z0-9]+)$/;
function dedupeClones(node: DriveNode): DriveNode {
  if (!node.children) return node;
  const existing = new Set(
    node.children
      .filter((c) => c.type === "file")
      .map((c) => c.name.toLowerCase())
  );
  const filtered = node.children.filter((c) => {
    if (c.type !== "file") return true;
    const m = CLONE_PAT.exec(c.name);
    if (!m) return true;
    const original = (m[1].trim() + m[3]).toLowerCase();
    // Se o "original" sem (N) existe nesta mesma pasta, este é clone -> remove.
    return !existing.has(original);
  });
  return {
    ...node,
    children: filtered.map((c) => (c.type === "folder" ? dedupeClones(c) : c)),
  };
}

export function loadDriveTree(): Promise<DriveTree> {
  if (!cache) {
    cache = (async () => {
      const [treeRes, overridesRes] = await Promise.all([
        fetch(`/data/drive_tree.json?v=${DRIVE_TREE_VERSION}`, { cache: "no-store" }),
        fetch(`/data/cover_overrides.json?v=${DRIVE_TREE_VERSION}`, { cache: "no-store" }),
      ]);
      if (!treeRes.ok) throw new Error("Falha ao carregar árvore do Drive");
      const tree = (await treeRes.json()) as DriveTree;
      const overrides: Record<string, string> = overridesRes.ok
        ? await overridesRes.json().catch(() => ({}))
        : {};
      // Remove duplicatas geradas pelo Drive ("Foo (1).pdf" quando "Foo.pdf" existe).
      const deduped = dedupeClones(tree as unknown as DriveNode) as DriveTree;
      // Aplica capas manuais (acervos CBR/CBZ que o Drive não thumbnaila).
      return applyCoverOverrides(deduped as unknown as DriveNode, overrides) as unknown as DriveTree;
    })();
  }
  return cache;
}

export function folderUrl(id: string): string {
  return `https://drive.google.com/drive/folders/${id}`;
}

export function filePreviewUrl(id: string): string {
  // rm=minimal hides the Drive viewer toolbar (open in new window, popout, etc.)
  return `https://drive.google.com/file/d/${id}/preview?rm=minimal`;
}

export function fileViewUrl(id: string): string {
  return `https://drive.google.com/file/d/${id}/view`;
}

export function fileDownloadUrl(id: string): string {
  // usercontent endpoint serves Content-Disposition: attachment and bypasses
  // the "can't scan for viruses" interstitial for large files.
  return `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;
}

export function thumbnailUrl(id: string, size = 400): string {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`;
}

const VIEWABLE_EXTS = ["pdf", "jpg", "jpeg", "png", "gif", "webp", "mp4", "webm", "mov"];
const ARCHIVE_EXTS = ["cbr", "cbz", "rar", "zip"];

export function isArchive(name: string): boolean {
  return ARCHIVE_EXTS.includes(fileExt(name));
}

/** Find the first CBR/CBZ/RAR/ZIP archive descending the tree (for cover extraction). */
export function firstArchiveIn(node: DriveNode): DriveNode | null {
  if (node.type === "file") return isArchive(node.name) ? node : null;
  if (!node.children) return null;
  const sortName = (a: DriveNode, b: DriveNode) =>
    a.name.localeCompare(b.name, "pt-BR", { numeric: true });
  const archivesHere = node.children
    .filter((c) => c.type === "file" && isArchive(c.name))
    .sort(sortName);
  if (archivesHere.length) return archivesHere[0];
  const folders = node.children.filter((c) => c.type === "folder").sort(sortName);
  for (const f of folders) {
    const found = firstArchiveIn(f);
    if (found) return found;
  }
  return null;
}

export function fileExt(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

export function isViewableInDrive(name: string): boolean {
  return VIEWABLE_EXTS.includes(fileExt(name));
}

/** Find the first viewable file (PDF/image) descending the tree — used to pick a cover. */
export function firstFileIn(node: DriveNode): DriveNode | null {
  if (!node.children) return null;
  const sortName = (a: DriveNode, b: DriveNode) =>
    a.name.localeCompare(b.name, "pt-BR", { numeric: true });

  const viewableHere = node.children
    .filter((c) => c.type === "file" && isViewableInDrive(c.name))
    .sort(sortName);
  if (viewableHere.length) return viewableHere[0];

  const filesHere = node.children
    .filter((c) => c.type === "file")
    .sort(sortName);
  if (filesHere.length) return filesHere[0];

  const folders = node.children.filter((c) => c.type === "folder").sort(sortName);
  for (const f of folders) {
    const found = firstFileIn(f);
    if (found) return found;
  }
  return null;
}

/** Cover image URL for any node (folder uses first descendant viewable file). */
export function coverUrl(node: DriveNode, size = 400): string | null {
  if (node.coverUrl) return node.coverUrl;
  if (node.type === "file") {
    return isViewableInDrive(node.name) ? thumbnailUrl(node.id, size) : null;
  }
  const first = firstFileIn(node);
  if (!first) return null;
  // Prefer an explicit coverUrl set on the descendant (used when Drive
  // thumbnails 404 for old PDFs); fall back to the Drive thumbnail.
  if (first.coverUrl) return first.coverUrl;
  return thumbnailUrl(first.id, size);
}

export function countDescendants(node: DriveNode): { folders: number; files: number } {
  let folders = 0;
  let files = 0;
  const walk = (n: DriveNode) => {
    if (!n.children) return;
    for (const c of n.children) {
      if (c.type === "folder") {
        folders++;
        walk(c);
      } else {
        files++;
      }
    }
  };
  walk(node);
  return { folders, files };
}
