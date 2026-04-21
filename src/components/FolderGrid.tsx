import { useState } from "react";
import { DriveNode, coverUrl, countDescendants, fileExt, isViewableInDrive } from "@/lib/drive";
import { BookOpen, FolderOpen, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  items: DriveNode[];
  onOpenFolder: (node: DriveNode) => void;
  onOpenFile: (node: DriveNode) => void;
  emptyHint?: string;
};

const Cover = ({ node }: { node: DriveNode }) => {
  const [errored, setErrored] = useState(false);
  const url = coverUrl(node, 400);
  const isFolder = node.type === "folder";
  const viewable = !isFolder && isViewableInDrive(node.name);

  if (url && !errored) {
    return (
      <div
        className={cn(
          "relative aspect-[2/3] rounded-md mb-2 overflow-hidden bg-secondary",
          isFolder ? "ring-1 ring-accent/30" : "ring-1 ring-primary/20"
        )}
      >
        <img
          src={url}
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

  // Fallback (no thumb available)
  return (
    <div
      className={cn(
        "aspect-[2/3] rounded-md mb-2 flex items-center justify-center",
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
    </div>
  );
};

export const FolderGrid = ({ items, onOpenFolder, onOpenFile, emptyHint }: Props) => {
  if (!items.length) {
    return (
      <div className="text-center text-muted-foreground py-16">
        {emptyHint ?? "Nada por aqui ainda."}
      </div>
    );
  }

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
              "group relative text-left rounded-lg border border-border bg-card p-2 transition-all",
              "hover:border-primary hover:-translate-y-0.5 hover:shadow-[var(--shadow-comic)]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <Cover node={node} />
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
