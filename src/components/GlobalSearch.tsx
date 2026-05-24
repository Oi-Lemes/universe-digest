import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Folder, BookOpen, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DriveNode, DriveTree, isViewableInDrive } from "@/lib/drive";
import { searchTree, SearchResult } from "@/lib/search";
import { cn } from "@/lib/utils";

type Props = {
  tree: DriveTree;
  /** Open a file inside the reader. */
  onOpenFile: (node: DriveNode) => void;
  /** Navigate to a folder: switches publisher and applies the breadcrumb path. */
  onOpenFolder: (
    publisher: DriveNode,
    pathIds: string[],
    pathNames: string[],
    target: DriveNode
  ) => void;
  className?: string;
  placeholder?: string;
  /** Notifies parent of debounced query changes (for live filtering below). */
  onQueryChange?: (query: string) => void;
};

export const GlobalSearch = ({
  tree,
  onOpenFile,
  onOpenFolder,
  className,
  placeholder = "Buscar HQs no acervo inteiro...",
  onQueryChange,
}: Props) => {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 120);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    onQueryChange?.(debounced.trim());
  }, [debounced, onQueryChange]);


  const results = useMemo<SearchResult[]>(
    () => (debounced.trim().length >= 2 ? searchTree(tree, debounced, 60) : []),
    [tree, debounced]
  );

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const showPanel = open && query.trim().length >= 2;

  const handleSelect = (r: SearchResult) => {
    if (r.node.type === "file") {
      onOpenFile(r.node);
    } else {
      // Folder: navigate. The publisher itself has empty pathIds; target is added by caller.
      const isPublisher = r.node.id === r.publisher.id;
      const pathIds = isPublisher ? [] : [...r.pathIds.slice(1), r.node.id];
      const pathNames = isPublisher ? [] : [...r.pathNames.slice(1), r.node.name];
      onOpenFolder(r.publisher, pathIds, pathNames, r.node);
    }
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results.length > 0) {
            e.preventDefault();
            handleSelect(results[0]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        className="pl-8 pr-8 h-9 bg-secondary border-border"
        aria-label="Buscar no acervo"
      />

      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setOpen(false);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Limpar busca"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {showPanel && (
        <div className="absolute z-40 mt-1 left-0 right-0 sm:right-auto sm:w-[28rem] rounded-lg border border-border bg-popover shadow-2xl overflow-hidden">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">
              Nenhum resultado para <strong>"{query}"</strong>.
            </div>
          ) : (
            <div className="max-h-[calc(100dvh-170px)] overflow-y-auto overscroll-contain touch-pan-y sm:max-h-[60vh]">
              <ul className="py-1">
                {results.map((r) => {
                  const isFile = r.node.type === "file";
                  const Icon = isFile ? BookOpen : Folder;
                  const breadcrumb = [r.publisher.name, ...r.pathNames.slice(1)].join(" › ");
                  const muted = isFile && !isViewableInDrive(r.node.name);
                  return (
                    <li key={`${r.node.id}-${r.score}`}>
                      <button
                        type="button"
                        onClick={() => handleSelect(r)}
                        className="w-full flex items-start gap-2 text-left px-3 py-2 hover:bg-secondary transition-colors"
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4 mt-0.5 shrink-0",
                            isFile ? "text-primary" : "text-accent"
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium truncate">
                            {r.node.name}
                          </span>
                          <span className="block text-[11px] text-muted-foreground truncate flex items-center gap-1">
                            <ChevronRight className="w-3 h-3 inline" />
                            {breadcrumb || r.publisher.name}
                          </span>
                        </span>
                        {muted && (
                          <span className="text-[9px] uppercase font-bold bg-destructive/80 text-destructive-foreground px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                            baixar
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <div className="px-3 py-1.5 border-t border-border bg-secondary/40 text-[10px] text-muted-foreground">
            Mostrando {results.length} resultado{results.length === 1 ? "" : "s"} · busca o acervo inteiro
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
