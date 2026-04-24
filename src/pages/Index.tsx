import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Home, LogOut } from "lucide-react";
import { DriveNode, DriveTree, loadDriveTree } from "@/lib/drive";
import { FolderGrid } from "@/components/FolderGrid";
import { ComicReader } from "@/components/ComicReader";
import { GlobalSearch } from "@/components/GlobalSearch";
import { PublisherTab } from "@/components/PublisherTab";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo-spiderman-new.png";

type Crumb = { id: string; name: string };

const Index = () => {
  const { email, signOut } = useAuth();
  const [tree, setTree] = useState<DriveTree | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePublisherId, setActivePublisherId] = useState<string | null>(null);
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [reader, setReader] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadDriveTree()
      .then((t) => {
        setTree(t);
      })
      .catch((e) => setError(e.message));
  }, []);


  // Ordem priorizada das editoras mais conhecidas no topo.
  // Nomes devem bater (case-insensitive) com os do drive_tree.json.
  const PUBLISHER_PRIORITY = [
    "Marvel",
    "DC",
    "Shueisha",
    "Vertigo",
    "Image Comics",
    "Dark Horse Comics",
    "IDW",
    "Boom! Studios",
    "Dynamite",
    "Avatar Press",
    "Titan Comics",
    "Panini",
    "Disney",
    "Sergio Bonelli",
    "Tex",
    "Zagor",
    "Dargaud",
    "Soleil",
    "Star Comics",
    "MAD",
    "Ebal",
    "Editora Abril",
    "Editora Globo",
    "Editora Indiana",
    "Editoras Brasileiras",
    "Mangás",
    "Scott Pilgrim",
    "Lobo Solitário 10 Volumes",
    "Mundo Sombrio de Sabrina",
    "Patsy Walker M.C.C. Felina",
    "Bíblia em Quadrinhos",
    "Infantil",
    "Oriental",
    "Independentes",
    "Variados",
    "Redbox",
    "Sentinela",
    "Beckett",
    "Abstract Studios",
    "Ablaze Publishing",
    "Arzach",
    "Éditions Atrabile",
    "Atualizações Quinzenais",
    "Bônus",
  ];

  const publishers = useMemo(() => {
    const list = tree?.children ?? [];
    const idx = (name: string) => {
      const i = PUBLISHER_PRIORITY.findIndex(
        (p) => p.toLowerCase() === name.toLowerCase()
      );
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    return [...list].sort((a, b) => {
      const ai = idx(a.name);
      const bi = idx(b.name);
      if (ai !== bi) return ai - bi;
      return a.name.localeCompare(b.name, "pt-BR", { numeric: true });
    });
  }, [tree]);

  // Seleciona a primeira editora respeitando a ordem priorizada.
  useEffect(() => {
    if (!activePublisherId && publishers.length) {
      setActivePublisherId(publishers[0].id);
    }
  }, [publishers, activePublisherId]);

  const activePublisher = useMemo(
    () => publishers.find((p) => p.id === activePublisherId) ?? null,
    [publishers, activePublisherId]
  );

  const currentFolder = useMemo<DriveNode | null>(() => {
    if (!activePublisher) return null;
    let node: DriveNode = activePublisher;
    for (const c of crumbs) {
      const next = node.children?.find((n) => n.id === c.id);
      if (!next) return activePublisher;
      node = next;
    }
    return node;
  }, [activePublisher, crumbs]);

  const items = useMemo<DriveNode[]>(
    () => currentFolder?.children ?? [],
    [currentFolder]
  );

  const handleSelectPublisher = (id: string) => {
    setActivePublisherId(id);
    setCrumbs([]);
  };

  const handleOpenFolder = (node: DriveNode) => {
    setCrumbs((c) => [...c, { id: node.id, name: node.name }]);
  };

  const handleCrumbClick = (idx: number) => {
    setCrumbs((c) => c.slice(0, idx + 1));
  };

  /** Jump to a folder anywhere in the tree (used by the global search). */
  const handleJumpTo = (
    publisher: DriveNode,
    pathIds: string[],
    pathNames: string[]
  ) => {
    setActivePublisherId(publisher.id);
    setCrumbs(pathIds.map((id, i) => ({ id, name: pathNames[i] })));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Erro ao carregar acervo</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="min-h-screen p-6 max-w-7xl mx-auto">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-10 w-full mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src={logo} alt="" className="w-9 h-9" />
          <div className="leading-tight">
            <h1 className="font-comic text-xl tracking-wide">
              IMPÉRIO DOS <span className="text-accent">QUADRINHOS</span>
            </h1>
            <p className="text-[10px] text-muted-foreground hidden sm:block">
              {publishers.length} editoras · acesso vitalício
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <GlobalSearch
              tree={tree}
              onOpenFile={(n) => setReader({ id: n.id, name: n.name })}
              onOpenFolder={(pub, ids, names) => handleJumpTo(pub, ids, names)}
              className="w-full max-w-xs hidden sm:block"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              title={email ?? ""}
              className="gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        </div>
        {/* mobile search */}
        <div className="px-4 pb-3 sm:hidden">
          <GlobalSearch
            tree={tree}
            onOpenFile={(n) => setReader({ id: n.id, name: n.name })}
            onOpenFolder={(pub, ids, names) => handleJumpTo(pub, ids, names)}
          />
        </div>
      </header>

      <Tabs
        value={activePublisherId ?? undefined}
        onValueChange={handleSelectPublisher}
        className="max-w-7xl mx-auto px-4 py-4"
      >
        <ScrollArea className="w-full whitespace-nowrap rounded-lg bg-secondary/40 border border-border">
          <TabsList className="bg-transparent h-auto p-2.5 gap-2 inline-flex w-max">
            {publishers.map((p) => (
              <PublisherTab key={p.id} id={p.id} name={p.name} />
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {publishers.map((p) => (
          <TabsContent key={p.id} value={p.id} className="mt-6">
            <nav className="flex items-center gap-1 text-sm mb-4 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCrumbClick(-1)}
                className="h-7 px-2 gap-1"
              >
                <Home className="w-3.5 h-3.5" />
                {p.name}
              </Button>
              {crumbs.map((c, i) => (
                <div key={c.id} className="flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCrumbClick(i)}
                    className="h-7 px-2 font-medium"
                  >
                    {c.name}
                  </Button>
                </div>
              ))}
            </nav>

            <FolderGrid
              items={items}
              onOpenFolder={handleOpenFolder}
              onOpenFile={(n) => setReader({ id: n.id, name: n.name })}
              emptyHint="Pasta vazia."
            />
          </TabsContent>
        ))}
      </Tabs>

      <ComicReader
        fileId={reader?.id ?? null}
        fileName={reader?.name ?? ""}
        onClose={() => setReader(null)}
      />
    </div>
  );
};

export default Index;
