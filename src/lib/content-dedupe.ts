import type { DriveNode } from "@/lib/drive";

const COPY_MARKERS = /\s*(?:\((?:copy|c[oó]pia|duplicado|dupe|\d+)\)|[-_\s]+(?:copy|c[oó]pia|duplicado|dupe))\s*$/gi;
const EXTENSION = /\.(cbr|cbz|rar|zip|pdf|epub|jpg|jpeg|png|webp|gif|mp4|webm|mov)$/i;

export function contentKey(name: string): string {
  return name
    .replace(EXTENSION, "")
    .replace(COPY_MARKERS, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_\-–—]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function dedupeVisibleNodes(nodes: DriveNode[]): DriveNode[] {
  const seenIds = new Set<string>();

  const walkList = (list: DriveNode[]): DriveNode[] => {
    const siblingKeys = new Set<string>();

    return list.flatMap((node) => {
      if (seenIds.has(node.id)) return [];
      seenIds.add(node.id);

      const key = `${node.type}:${contentKey(node.name)}`;
      if (key !== `${node.type}:` && siblingKeys.has(key)) return [];
      siblingKeys.add(key);

      if (!node.children) return [node];
      return [{ ...node, children: walkList(node.children) }];
    });
  };

  return walkList(nodes);
}