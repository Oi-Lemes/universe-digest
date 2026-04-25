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
const DRIVE_TREE_VERSION = "2026-04-25-3";

export function loadDriveTree(): Promise<DriveTree> {
  if (!cache) {
    cache = fetch(`/data/drive_tree.json?v=${DRIVE_TREE_VERSION}`, {
      cache: "no-store",
    }).then((r) => {
      if (!r.ok) throw new Error("Falha ao carregar árvore do Drive");
      return r.json() as Promise<DriveTree>;
    });
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
