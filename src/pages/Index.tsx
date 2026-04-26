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
    "Mangás",
    "Turma da Mônica",
    "Junji Ito",
    "Homem-Aranha (Abril)",
    "Hulk (Abril)",
    "Almanaque Disney",
    "Mágico Vento",
    "Astérix",
    "Tintin",
    "Bone",
    "Chaves",
    "Os Trapalhões",
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
    "Scott Pilgrim",
    "Lobo Solitário 10 Volumes",
    "Mundo Sombrio de Sabrina",
    "Patsy Walker M.C.C. Felina",
    "Bíblia em Quadrinhos",
    "Infantil",
    "Oriental",
    "Independentes",
    "Variados",
    "Clássicos",
    "Cultura & Biografias",
    "Redbox",
    "Sentinela",
    "Beckett",
    "Abstract Studios",
    "Ablaze Publishing",
    "Arzach",
    "Éditions Atrabile",
    "Bônus",
  ];

  // ---- Curadoria "Clássicos": pega edições vintage soltas em "Variados" ----
  const CLASSICOS_KEYWORDS = [
    "ebal", "rge", "cruzeiro", "cedibra", "bloch", "artenova", "taika",
    "edicao maravilhosa", "edição maravilhosa", "edio-maravilhosa", "edio maravilhosa",
    "grandes figuras", "romances eternos", "almanaque", "edição ouro",
    "série ouro", "serie ouro", "agente secreto", "sombra", "fantasma-especial",
    "far-west", "per-lim-pim-pim", "pingo de gente", "mestre kim", "robinson",
    "riquinho", "super-homem-crnicas", "graphic album 05", "coleção gibi especial",
    "biblia em quadrinhos", "bíblia em quadrinhos", "bone-36-1999", "fofão",
    "pica-pau", "addams 001, 10.1974", "almanaque zero", "superalmanaque",
    "familia addams", "spirit (1985)", "spirit (1987)", "spirit (1991)",
    "spirit (1997)", "spirit 01", "spirit 05", "cinemin", "will eisner - 1991",
    "vizinhança - avenida dropsie",
  ];
  const CLASSICOS_YEAR_RE = /\b(19[5-9]\d|200[0-5])\b/;
  const isClassico = (name: string) => {
    const n = name.toLowerCase();
    if (CLASSICOS_KEYWORDS.some((k) => n.includes(k))) return true;
    if (CLASSICOS_YEAR_RE.test(name)) return true;
    return false;
  };

  // ---- Pastas inteiras (de outras editoras) que vão para "Clássicos" ----
  // Match exato pelo nome da pasta (case-insensitive).
  // ⚠️ Marvel, DC, Vertigo (DC) e Turma da Mônica NUNCA têm conteúdo movido.
  const CLASSICOS_FOLDER_NAMES = new Set<string>([
    // Editora Brasileira / EBAL / RGE
    "ebal",
    "edição maravilhosa", "edicao maravilhosa",
    "grandes figuras em quadrinhos",
    "fantasma rge",
    "zorro (ebal)",
    "almanaque piteco e horácio",
    // Bônus terror antigo (RGE)
    "3 geracao - kripta (rge)",
    "almanaque de terror",
    "almanaque de terror 2",
    "almanaque terror especial",
    "classicos do pavor",
    // MAD anos 70/80
    "(1974-1980)", "(1984-2000)",
    // Tex (Bonelli) – clássicos
    "tex grandes clássicos", "tex, os grandes classicos", "almanaque tex",
    "tex 1971", "tex 1999", "tex 2000",
    // Disney clássico
    "clássicos de walt disney",
    // Infantil clássico (sem mexer em Mônica/Chaves/Trapalhões)
    // OBS: "clássicos do cinema" não entra aqui — vai pra aba Turma da Mônica
    "mortadelo e salaminho cedibra",
    // Atualizações antigas (de fontes não-Marvel/DC)
    "plop! (1973)",
    // Zagor (Bonelli)
    "zagor - almanaque de aventura",
    // Soleil
    "merlin - 2001 (soleil",
  ]);
  // Editoras que NÃO devem ter pastas movidas — pedido do usuário:
  // Marvel, DC, Vertigo e Turma da Mônica ficam intactas.
  const CLASSICOS_BLACKLIST_TOPS = new Set<string>([
    "marvel", "dc", "vertigo", "dark horse comics",
    "turma da mônica", "chaves", "os trapalhões",
    "mangás", "shueisha", "junji ito",
    "almanaque disney", "mágico vento",
    "astérix", "tintin", "bone",
    "homem-aranha (abril)", "hulk (abril)",
  ]);

  // Mangás populares hoje "enterrados" em Atualizações Quinzenais → Inclusão → Mangás.
  // Vamos mesclá-los na aba "Mangás" para ficarem visíveis sem criar nova editora.
  const POPULAR_MANGAS_FROM_UPDATES = [
    "Boku no Hero",
    "Blue Lock",
    "Chainsaw Man",
    "SOLO LEVELING",
    "Solo Leveling Ragnarok",
    "Dan da Dan",
    "Hajime No Ippo",
    "Nanatsu no Taizai",
    "Kaiju No. 8",
    "HUNTER X HUNTER",
    "VAGABOND",
    "HAIKYU!!",
    "InuYasha Dows",
    "MAGI",
    "FOOD WARS (SHOKUGEKI NO SOUMA)",
    "FIRE FORCE",
    "GOLDEN KAMUY",
    "BECK",
    "EDENS ZERO",
    "AO ASHI",
    "DIAMOND NO ACE",
    "RAVE MASTER",
    "KATEKYO HITMAN REBORN",
    "CHIHAYAFURU",
    "MY HERO ACADEMIA",
  ];

  // Obras Shueisha (Weekly Shōnen Jump, Jump SQ, Young Jump etc.) presentes em "Mangás".
  // Match case-insensitive com o nome da pasta no drive_tree.
  const SHUEISHA_TITLES = [
    "ONE PIECE",
    "NARUTO",
    "BORUTO",
    "BORUTO TWO BLUE VORTEX",
    "BLEACH",
    "Dragon Ball",
    "DRAGON BALL",
    "DEMON SLAYER",
    "JUJUTSU KAISEN",
    "BLACK CLOVER",
    "DEATH NOTE",
    "ONE PUNCH MAN",
    "JOJO COMPLETO",
    "CDZ - Saint Seiya",
    "THE LOST CANVAS CDZ",
    "SAMURAI X",
    "Slam Dunk",
    "YU YU HAKUSHO",
    "Yu-Gi-Oh!",
    "Captain Tsubasa",
    "Shueisha_s Shōnen Jump",
    "GANTZ",
    "THE ELUSIVE SAMURAI",
    "FULLMETAL ALCHEMIST",
  ];

  const publishers = useMemo(() => {
    const list = tree?.children ?? [];

    // ---------- Helpers ----------
    const findChild = (parent: DriveNode | undefined, predicate: (n: DriveNode) => boolean) =>
      parent?.children?.find(predicate);
    const sortPtBr = (a: DriveNode, b: DriveNode) =>
      a.name.localeCompare(b.name, "pt-BR", { numeric: true });
    const lower = (s: string) => s.trim().toLowerCase();

    const buildVirtual = (
      id: string,
      name: string,
      children: DriveNode[]
    ): DriveNode | null =>
      children.length > 0
        ? {
            id,
            name,
            type: "folder",
            children: [...children].sort(sortPtBr),
          }
        : null;

    // ---------- Localiza pastas-fonte ----------
    const mangas = list.find((n) => lower(n.name) === "mangás");
    const infantil = list.find((n) => lower(n.name) === "infantil");
    const panini = list.find((n) => lower(n.name) === "panini");
    const disney = list.find((n) => lower(n.name) === "disney");
    const bonelli = list.find((n) => lower(n.name) === "sergio bonelli");
    const dargaud = list.find((n) => lower(n.name) === "dargaud");
    const editoraAbril = list.find((n) => lower(n.name) === "editora abril");
    const editorasBr = list.find((n) => lower(n.name) === "editoras brasileiras");
    const bonus = list.find((n) => lower(n.name) === "bônus");
    const atualizacoes = list.find((n) =>
      /atualiza[cç][ãa]o|atualiza[cç][õo]es\s+quinzenais/i.test(n.name)
    );

    // Bônus → "Mangás e Quadrinhos de terror" (pasta com Junji Ito, Calafrio, etc.)
    const bonusTerror = findChild(bonus, (n) =>
      /mang[áa]s\s+e\s+quadrinhos\s+de\s+terror/i.test(n.name)
    );

    // Atualizações Quinzenais → Inclusão de conteúdos → Mangás
    const atualizacoesInclusao = findChild(atualizacoes, (n) =>
      /inclus[ãa]o\s+de\s+conte/i.test(n.name)
    );
    const atualizacoesMangas = findChild(atualizacoesInclusao, (n) =>
      lower(n.name).startsWith("mang")
    );

    // ---------- Editora virtual: Shueisha ----------
    const shueishaSet = new Set(SHUEISHA_TITLES.map(lower));
    const virtualShueisha = buildVirtual(
      "virtual-shueisha",
      "Shueisha",
      (mangas?.children ?? []).filter((n) => shueishaSet.has(lower(n.name)))
    );

    // ---------- Editora virtual: Turma da Mônica ----------
    // Detecta nomes ligados ao Mauricio de Sousa (Turma da Mônica e personagens).
    // Usado tanto pra puxar pastas/arquivos pra aba "Turma da Mônica" quanto pra
    // tirá-los de "Clássicos" / "Variados". Inclui exclusões pra falsos positivos.
    const isMonicaName = (name: string) => {
      const n = name.toLowerCase();
      // Exclusões (mesmo termo, contexto diferente)
      if (/s[íi]tio\s+do\s+pica/.test(n)) return false; // Sítio do Picapau Amarelo (Lobato)
      if (/horacio\s+(quiroga|altuna)/.test(n)) return false;
      if (/tokyo|revengers/.test(n)) return false; // mangá
      if (/pouso\s+do\s+astronauta/.test(n)) return false; // HQ indie, não MSP
      // Inclusões: personagens e marcas Mauricio de Sousa
      const re = /(m[ôo]nica|mauricio\s+de\s+sou[sz]a|maur[íi]cio\s+de\s+sou[sz]a|\bmsp\b|\bcebolinha\b|casc[ãa]o|\bmagali\b|magal[íi]ce|chico\s*-?\s*bento|\bpenadinho\b|\bpiteco\b|hor[áa]cio|\bbidu\b|franjinha|\bnimbus\b|\bdo[\s-]+contra\b|papa[\s-]?capim|turma\s+da\s+mata|turma\s+do\s+penadinho|turma\s+do\s+chico|floresta\s+azul|pelezinho|ronaldinho\s+ga[uú]cho|\bastronauta\b|sambinha)/i;
      return re.test(name);
    };

    // Pasta "Clássicos do Cinema" (Infantil) → paródias MSP de filmes.
    // Vai pra aba Turma da Mônica com nome corrigido.
    const classicosCinemaFolder = findChild(infantil, (n) =>
      /^cl[áa]ssicos\s+do\s+cinema$/i.test(n.name)
    );
    const renamedClassicosCinema = classicosCinemaFolder
      ? {
          ...classicosCinemaFolder,
          name: "Clássicos do Cinema da Turma da Mônica",
        }
      : null;

    // Coleta recursivamente pastas/arquivos do Mauricio espalhados em outras editoras
    // (exceto a própria Turma da Mônica), pra mover pra aba dela.
    type MonicaPick = { node: DriveNode; topPublisher: string };
    const monicaPicks: MonicaPick[] = [];
    const monicaPickedIds = new Set<string>();
    // Pastas/itens que JÁ vão entrar na Mônica por outro caminho — pular pra
    // não pegar arquivos internos duplicados.
    const monicaSkipIds = new Set<string>(
      classicosCinemaFolder ? [classicosCinemaFolder.id] : []
    );
    const collectMonica = (
      node: DriveNode,
      topPublisher: string,
      depth: number
    ): void => {
      if (monicaSkipIds.has(node.id)) return;
      if (depth >= 1) {
        const tp = topPublisher.toLowerCase();
        if (tp === "turma da mônica") return;
        if (isMonicaName(node.name)) {
          monicaPicks.push({ node, topPublisher });
          monicaPickedIds.add(node.id);
          return;
        }
      }
      for (const c of node.children ?? []) {
        const newTop = depth >= 1 ? topPublisher : c.name;
        collectMonica(c, newTop, depth + 1);
      }
    };
    for (const pub of list) {
      const tp = pub.name.toLowerCase();
      if (tp === "turma da mônica") continue;
      collectMonica(pub, pub.name, 1);
    }

    // Renomeia pra deixar a origem clara, ex: "Almanaque Piteco e Horácio (Panini)"
    const renamedMonicaPicks: DriveNode[] = monicaPicks
      .filter(({ topPublisher }) => {
        const tp = topPublisher.toLowerCase();
        return !(tp === "infantil" || tp === "panini");
      })
      .map(({ node, topPublisher }) => {
        const alreadyHasOrigin = node.name
          .toLowerCase()
          .includes(topPublisher.toLowerCase());
        return alreadyHasOrigin
          ? node
          : { ...node, name: `${node.name} (${topPublisher})` };
      });

    const monicaChildren: DriveNode[] = [
      ...(infantil?.children?.filter((n) => isMonicaName(n.name)) ?? []),
      ...(panini?.children?.filter((n) => isMonicaName(n.name)) ?? []),
      ...renamedMonicaPicks,
      ...(renamedClassicosCinema ? [renamedClassicosCinema] : []),
    ];
    const virtualMonica = buildVirtual(
      "virtual-turma-da-monica",
      "Turma da Mônica",
      monicaChildren
    );

    // Pra remover da Infantil original
    if (classicosCinemaFolder) {
      monicaPickedIds.add(classicosCinemaFolder.id);
    }




    // ---------- Editora virtual: Junji Ito ----------
    const junjiItoFolder = findChild(bonusTerror, (n) =>
      /junji\s*ito/i.test(n.name)
    );
    const virtualJunjiIto = junjiItoFolder
      ? { ...junjiItoFolder, id: "virtual-junji-ito", name: "Junji Ito" }
      : null;

    // ---------- Editora virtual: Homem-Aranha (Abril) ----------
    const homemAranhaAbrilFolder = findChild(
      editoraAbril,
      (n) => lower(n.name) === "homem aranha"
    );
    const virtualHomemAranhaAbril = homemAranhaAbrilFolder
      ? {
          ...homemAranhaAbrilFolder,
          id: "virtual-homem-aranha-abril",
          name: "Homem-Aranha (Abril)",
        }
      : null;

    // ---------- Editora virtual: Hulk (Abril) ----------
    const hulkAbrilFolder = findChild(editoraAbril, (n) =>
      /incr[íi]vel\s+hulk/i.test(n.name)
    );
    const virtualHulkAbril = hulkAbrilFolder
      ? { ...hulkAbrilFolder, id: "virtual-hulk-abril", name: "Hulk (Abril)" }
      : null;

    // ---------- Editora virtual: Almanaque Disney ----------
    const almanaqueDisneyFolder = findChild(disney, (n) =>
      /almanaque\s+disney/i.test(n.name)
    );
    const virtualAlmanaqueDisney = almanaqueDisneyFolder
      ? {
          ...almanaqueDisneyFolder,
          id: "virtual-almanaque-disney",
          name: "Almanaque Disney",
        }
      : null;

    // ---------- Editora virtual: Mágico Vento (junto com Ken Parker) ----------
    const magicoVentoFolder = findChild(bonelli, (n) =>
      /m[áa]gico\s+vento/i.test(n.name)
    );
    const kenParkerFolder = findChild(bonelli, (n) =>
      /ken\s+parker/i.test(n.name)
    );
    const virtualMagicoVento = buildVirtual(
      "virtual-magico-vento",
      "Mágico Vento",
      [
        ...(magicoVentoFolder ? [magicoVentoFolder] : []),
        ...(kenParkerFolder ? [kenParkerFolder] : []),
      ]
    );

    // ---------- Editora virtual: Astérix ----------
    const asterixFolder = findChild(dargaud, (n) => /ast[ée]rix/i.test(n.name));
    const virtualAsterix = asterixFolder
      ? { ...asterixFolder, id: "virtual-asterix", name: "Astérix" }
      : null;

    // ---------- Editora virtual: Tintin ----------
    const tintinFolder = findChild(infantil, (n) =>
      /herg[ée]|tintin|tintim/i.test(n.name)
    );
    const virtualTintin = tintinFolder
      ? { ...tintinFolder, id: "virtual-tintin", name: "Tintin" }
      : null;

    // ---------- Editora virtual: Bone ----------
    const boneFolder = findChild(infantil, (n) => /^bone\b/i.test(n.name));
    const virtualBone = boneFolder
      ? { ...boneFolder, id: "virtual-bone", name: "Bone" }
      : null;

    // ---------- Editora virtual: Chaves ----------
    const chavesFolder = findChild(infantil, (n) => lower(n.name) === "chaves");
    const virtualChaves = chavesFolder
      ? { ...chavesFolder, id: "virtual-chaves", name: "Chaves" }
      : null;

    // ---------- Editora virtual: Os Trapalhões ----------
    const trapalhoesFolder = findChild(editorasBr, (n) =>
      /trapalho/i.test(n.name)
    );
    const virtualTrapalhoes = trapalhoesFolder
      ? {
          ...trapalhoesFolder,
          id: "virtual-trapalhoes",
          name: "Os Trapalhões",
        }
      : null;

    // ---------- Editora virtual: Clássicos ----------
    // Combina:
    //   1) PDFs vintage soltos em "Variados"
    //   2) Pastas inteiras vintage espalhadas por outras editoras (CLASSICOS_FOLDER_NAMES)
    const variados = list.find((n) => lower(n.name) === "variados");
    const classicosLooseFiles = (variados?.children ?? []).filter(
      (c) => c.type === "file" && isClassico(c.name)
    );
    const classicosLooseIds = new Set(classicosLooseFiles.map((c) => c.id));

    // Coleta pastas vintage recursivamente, ignorando editoras-raiz da blacklist.
    type ClassicoFound = { folder: DriveNode; topPublisher: string };
    const classicosFolders: ClassicoFound[] = [];
    const classicosFolderIds = new Set<string>();
    const collectClassicoFolders = (
      node: DriveNode,
      topPublisher: string,
      depth: number
    ): void => {
      if (depth >= 1 && node.type === "folder") {
        if (CLASSICOS_BLACKLIST_TOPS.has(lower(topPublisher))) return;
        if (CLASSICOS_FOLDER_NAMES.has(lower(node.name))) {
          classicosFolders.push({ folder: node, topPublisher });
          classicosFolderIds.add(node.id);
          return; // não desce mais — pega a pasta toda
        }
      }
      for (const c of node.children ?? []) {
        const newTop = depth >= 1 ? topPublisher : c.name;
        collectClassicoFolders(c, newTop, depth + 1);
      }
    };
    for (const pub of list) {
      collectClassicoFolders(pub, pub.name, 1);
    }

    // Renomeia as pastas movidas pra deixar claro de onde vieram (ex: "Sandman (Vertigo)")
    const renamedClassicoFolders: DriveNode[] = classicosFolders.map(
      ({ folder, topPublisher }) => {
        const alreadyHasOrigin = folder.name
          .toLowerCase()
          .includes(topPublisher.toLowerCase());
        return alreadyHasOrigin
          ? folder
          : { ...folder, name: `${folder.name} (${topPublisher})` };
      }
    );

    // Antes de exibir, tira de dentro das pastas migradas qualquer arquivo do
    // Mauricio que vai pra aba "Turma da Mônica" (ex.: Cascão Porker dentro de
    // "Clássicos do Cinema"). Também tira arquivos avulsos do Mauricio.
    const deepStripEarly = (node: DriveNode, ids: Set<string>): DriveNode => {
      if (!node.children) return node;
      const next = node.children
        .filter((c) => !ids.has(c.id))
        .map((c) => (c.type === "folder" ? deepStripEarly(c, ids) : c))
        .filter((c) => {
          if (c.type !== "folder") return true;
          const hasAnyFile = (n: DriveNode): boolean =>
            (n.children ?? []).some((cc) =>
              cc.type === "file" ? true : hasAnyFile(cc)
            );
          return hasAnyFile(c);
        });
      return { ...node, children: next };
    };
    const cleanedClassicoFolders = renamedClassicoFolders
      .map((f) =>
        monicaPickedIds.size > 0 ? deepStripEarly(f, monicaPickedIds) : f
      )
      .filter((f) => (f.children?.length ?? 0) > 0 || f.type === "file");
    const cleanedLoose = classicosLooseFiles.filter(
      (f) => !monicaPickedIds.has(f.id) && !isMonicaName(f.name)
    );

    const virtualClassicos = buildVirtual(
      "virtual-classicos",
      "Clássicos",
      [...cleanedLoose, ...cleanedClassicoFolders]
    );

    // ---------- Mangás populares: mesclar dentro de "Mangás" ----------
    // IDs dos títulos da Shueisha já promovidos para não duplicar.
    const shueishaIds = new Set(
      (virtualShueisha?.children ?? []).map((n) => n.id)
    );
    const popularSet = new Set(POPULAR_MANGAS_FROM_UPDATES.map(lower));
    const popularFromUpdates = (atualizacoesMangas?.children ?? []).filter(
      (n) => popularSet.has(lower(n.name))
    );
    const existingMangaIds = new Set(
      (mangas?.children ?? []).map((n) => n.id)
    );
    const popularToAdd = popularFromUpdates.filter(
      (n) => !existingMangaIds.has(n.id) && !shueishaIds.has(n.id)
    );

    const enrichedMangas: DriveNode | undefined = mangas
      ? {
          ...mangas,
          children: [
            ...(mangas.children ?? []).filter(
              (n) => !shueishaIds.has(n.id)
            ),
            ...popularToAdd,
          ].sort(sortPtBr),
        }
      : undefined;

    // ---------- IDs movidos (para remover dos pais originais) ----------
    const movedIds = new Set<string>(
      [
        ...(virtualJunjiIto ? [junjiItoFolder!.id] : []),
        ...(virtualHomemAranhaAbril ? [homemAranhaAbrilFolder!.id] : []),
        ...(virtualHulkAbril ? [hulkAbrilFolder!.id] : []),
        ...(virtualAlmanaqueDisney ? [almanaqueDisneyFolder!.id] : []),
        ...(magicoVentoFolder ? [magicoVentoFolder.id] : []),
        ...(kenParkerFolder ? [kenParkerFolder.id] : []),
        ...(virtualAsterix ? [asterixFolder!.id] : []),
        ...(virtualTintin ? [tintinFolder!.id] : []),
        ...(virtualBone ? [boneFolder!.id] : []),
        ...(virtualChaves ? [chavesFolder!.id] : []),
        ...(virtualTrapalhoes ? [trapalhoesFolder!.id] : []),
      ].filter(Boolean)
    );

    // Remove pastas movidas e remove subpastas/filhas pertencentes aos virtuais nos pais originais.
    const stripChildren = (
      node: DriveNode,
      shouldRemove: (c: DriveNode) => boolean
    ): DriveNode =>
      node.children
        ? { ...node, children: node.children.filter((c) => !shouldRemove(c)) }
        : node;

    // Remove em qualquer profundidade pastas/arquivos cujo id esteja em ids,
    // e também limpa pastas que ficaram vazias por conta da remoção (exceto raiz).
    const deepStrip = (node: DriveNode, ids: Set<string>): DriveNode => {
      if (!node.children) return node;
      const next = node.children
        .filter((c) => !ids.has(c.id))
        .map((c) => (c.type === "folder" ? deepStrip(c, ids) : c))
        // Pasta filha que ficou sem nenhum descendente -> remove também
        .filter((c) => {
          if (c.type !== "folder") return true;
          const hasAnyFile = (n: DriveNode): boolean =>
            (n.children ?? []).some((cc) =>
              cc.type === "file" ? true : hasAnyFile(cc)
            );
          return hasAnyFile(c);
        });
      return { ...node, children: next };
    };

    const filtered = list.map((n): DriveNode => {
      const lname = lower(n.name);
      let cur: DriveNode = n;
      // Remove em profundidade qualquer pasta vintage que migrou para Clássicos.
      if (classicosFolderIds.size > 0 && !CLASSICOS_BLACKLIST_TOPS.has(lname)) {
        cur = deepStrip(cur, classicosFolderIds);
      }
      // Remove em profundidade qualquer item do Mauricio que migrou pra Mônica.
      if (monicaPickedIds.size > 0 && lname !== "turma da mônica") {
        cur = deepStrip(cur, monicaPickedIds);
      }
      if (lname === "mangás" && enrichedMangas) return enrichedMangas;
      if (lname === "infantil") {
        return stripChildren(
          cur,
          (c) => isMonicaName(c.name) || movedIds.has(c.id)
        );
      }
      if (lname === "panini") {
        return stripChildren(cur, (c) => isMonicaName(c.name));
      }
      if (lname === "disney") return stripChildren(cur, (c) => movedIds.has(c.id));
      if (lname === "sergio bonelli")
        return stripChildren(cur, (c) => movedIds.has(c.id));
      if (lname === "dargaud") return stripChildren(cur, (c) => movedIds.has(c.id));
      if (lname === "editora abril")
        return stripChildren(cur, (c) => movedIds.has(c.id));
      if (lname === "editoras brasileiras")
        return stripChildren(cur, (c) => movedIds.has(c.id));
      if (lname === "variados") {
        // Tira os PDFs vintage que viraram a aba "Clássicos".
        return stripChildren(cur, (c) => classicosLooseIds.has(c.id));
      }
      if (lname === "bônus") {
        // Remove Junji Ito de dentro de Bônus -> Mangás e Quadrinhos de terror.
        return {
          ...cur,
          children: (cur.children ?? []).map((sub) => {
            if (/mang[áa]s\s+e\s+quadrinhos\s+de\s+terror/i.test(sub.name)) {
              return stripChildren(sub, (c) => movedIds.has(c.id));
            }
            return sub;
          }),
        };
      }
      return cur;
    });

    const merged = [
      ...filtered.filter(
        (n) => !/atualiza[cç][ãa]o|atualiza[cç][õo]es\s+quinzenais/i.test(n.name)
      ),
      ...(virtualShueisha ? [virtualShueisha] : []),
      ...(virtualMonica ? [virtualMonica] : []),
      ...(virtualJunjiIto ? [virtualJunjiIto] : []),
      ...(virtualHomemAranhaAbril ? [virtualHomemAranhaAbril] : []),
      ...(virtualHulkAbril ? [virtualHulkAbril] : []),
      ...(virtualAlmanaqueDisney ? [virtualAlmanaqueDisney] : []),
      ...(virtualMagicoVento ? [virtualMagicoVento] : []),
      ...(virtualAsterix ? [virtualAsterix] : []),
      ...(virtualTintin ? [virtualTintin] : []),
      ...(virtualBone ? [virtualBone] : []),
      ...(virtualChaves ? [virtualChaves] : []),
      ...(virtualTrapalhoes ? [virtualTrapalhoes] : []),
      ...(virtualClassicos ? [virtualClassicos] : []),
    ];

    const idx = (name: string) => {
      const i = PUBLISHER_PRIORITY.findIndex(
        (p) => p.toLowerCase() === name.toLowerCase()
      );
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    return [...merged].sort((a, b) => {
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
          <Button
            asChild
            size="sm"
            variant="outline"
            className="ml-3 gap-2 hidden md:inline-flex border-accent/40 hover:bg-accent/10"
            title="Abrir o acervo no Google Drive"
          >
            <a
              href="https://drive.google.com/drive/folders/11SVA323KWtChNn9SdhfqhhkewLlsy683?usp=drive_link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 87.3 78" className="w-4 h-4" aria-hidden="true">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
              <span>Acessar pelo Google Drive</span>
            </a>
          </Button>
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
        {/* mobile: drive button + search */}
        <div className="px-4 pb-3 sm:hidden flex flex-col gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="w-full gap-2 border-accent/40 hover:bg-accent/10"
          >
            <a
              href="https://drive.google.com/drive/folders/11SVA323KWtChNn9SdhfqhhkewLlsy683?usp=drive_link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 87.3 78" className="w-4 h-4" aria-hidden="true">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
              <span>Acessar pelo Google Drive</span>
            </a>
          </Button>
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
