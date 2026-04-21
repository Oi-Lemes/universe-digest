import { DriveNode, countDescendants } from "@/lib/drive";
import { BookOpen, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  items: DriveNode[];
  onOpenFolder: (node: DriveNode) => void;
  onOpenFile: (node: DriveNode) => void;
  emptyHint?: string;
};

export const FolderGrid = ({ items, onOpenFolder, onOpenFile, emptyHint }: Props) => {
  if (!items.length) {
    return (
      <div className="text-center text-muted-foreground py-16">
        {emptyHint ?? "Nada por aqui ainda."}
      </div>
    );
  }

  // Folders first, then files; both alphabetic
  const sorted = [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name, "pt-BR", { numeric: true });
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {sorted.map((node) => {
        const isFolder = node.type === "folder";
        const stats = isFolder ? countDescendants(node) : null;
        return (
          <button
            key={node.id}
            onClick={() => (isFolder ? onOpenFolder(node) : onOpenFile(node))}
            className={cn(
              "group relative text-left rounded-lg border border-border bg-card p-3 transition-all",
              "hover:border-primary hover:-translate-y-0.5 hover:shadow-[var(--shadow-comic)]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <div
              className={cn(
                "aspect-[3/4] rounded-md mb-2 flex items-center justify-center",
                isFolder
                  ? "bg-gradient-to-br from-secondary to-muted"
                  : "bg-gradient-to-br from-primary/30 to-accent/20"
              )}
            >
              {isFolder ? (
                <FolderOpen className="w-10 h-10 text-accent/80" strokeWidth={1.5} />
              ) : (
                <BookOpen className="w-10 h-10 text-primary" strokeWidth={1.5} />
              )}
            </div>
            <div className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-primary">
              {node.name}
            </div>
            {stats && (
              <div className="mt-1 text-[10px] text-muted-foreground">
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
