import { DriveNode, DriveTree } from "./drive";

export type SearchResult = {
  /** The matching node (folder or file). */
  node: DriveNode;
  /** Names from the root publisher down to (but not including) the node. */
  pathNames: string[];
  /** Drive ids from the root publisher down to (but not including) the node. */
  pathIds: string[];
  /** The publisher this match lives under. */
  publisher: DriveNode;
  /** Lowercased score: lower = better. */
  score: number;
};

/**
 * Recursive search across the entire tree.
 * - Matches by case/accent-insensitive substring on node.name.
 * - Returns up to `limit` results, prioritising file matches and shallower depth.
 */
export function searchTree(
  tree: DriveTree,
  query: string,
  limit = 60
): SearchResult[] {
  const q = normalize(query);
  if (!q) return [];

  const results: SearchResult[] = [];

  const walk = (
    node: DriveNode,
    publisher: DriveNode,
    pathNames: string[],
    pathIds: string[]
  ) => {
    const norm = normalize(node.name);
    if (norm.includes(q)) {
      // Score: lower is better. Files outrank folders; exact-start beats mid-string;
      // shallower depth beats deeper.
      const startBonus = norm.startsWith(q) ? 0 : 5;
      const typeBonus = node.type === "file" ? 0 : 8;
      const depthPenalty = pathNames.length;
      results.push({
        node,
        publisher,
        pathNames,
        pathIds,
        score: startBonus + typeBonus + depthPenalty,
      });
    }
    if (node.children) {
      const nextNames = [...pathNames, node.name];
      const nextIds = [...pathIds, node.id];
      for (const child of node.children) {
        walk(child, publisher, nextNames, nextIds);
        if (results.length > limit * 4) return; // hard cap to avoid runaway
      }
    }
  };

  for (const publisher of tree.children) {
    walk(publisher, publisher, [], []);
  }

  results.sort((a, b) => a.score - b.score || a.node.name.localeCompare(b.node.name, "pt-BR"));
  return results.slice(0, limit);
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
