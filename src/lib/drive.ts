export type DriveNode = {
  id: string;
  name: string;
  type: "folder" | "file";
  children?: DriveNode[];
};

export type DriveTree = {
  id: string;
  name: string;
  children: DriveNode[];
};

let cache: Promise<DriveTree> | null = null;

export function loadDriveTree(): Promise<DriveTree> {
  if (!cache) {
    cache = fetch("/data/drive_tree.json").then((r) => {
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
  return `https://drive.google.com/file/d/${id}/preview`;
}

export function folderEmbedUrl(id: string): string {
  return `https://drive.google.com/embeddedfolderview?id=${id}#grid`;
}

/** Find a node by id walking the tree. */
export function findNode(tree: DriveTree, id: string): DriveNode | null {
  if (id === tree.id)
    return { id: tree.id, name: tree.name, type: "folder", children: tree.children };
  const stack: DriveNode[] = [...tree.children];
  while (stack.length) {
    const n = stack.pop()!;
    if (n.id === id) return n;
    if (n.children) stack.push(...n.children);
  }
  return null;
}

/** Find the path (breadcrumb) from root to a node id. */
export function findPath(tree: DriveTree, id: string): DriveNode[] {
  const path: DriveNode[] = [];
  const dfs = (nodes: DriveNode[]): boolean => {
    for (const n of nodes) {
      path.push(n);
      if (n.id === id) return true;
      if (n.children && dfs(n.children)) return true;
      path.pop();
    }
    return false;
  };
  dfs(tree.children);
  return path;
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
