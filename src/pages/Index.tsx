import { forwardRef, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Home, LogOut } from "lucide-react";
import { DriveNode, DriveTree, loadDriveFolderTree, loadDriveTree } from "@/lib/drive";
import { FolderGrid } from "@/components/FolderGrid";
import { InfiniteCoverMarquee } from "@/components/InfiniteCoverMarquee";
import { ComicReader } from "@/components/ComicReader";
import { GlobalSearch } from "@/components/GlobalSearch";
import { searchTree } from "@/lib/search";
import {
  driveDebugFields,
  IMPERIO_DRIVE_ROOT_REFERENCE,
  IMPERIO_DRIVE_ROOT_URL,
} from "@/lib/imperio-drive";
import { openExternalUrl } from "@/lib/open-external";

import { PublisherTab } from "@/components/PublisherTab";
import { OnlinePresence } from "@/components/OnlinePresence";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo-spiderman-new.png";
import { isOrientalLikeName, isManhwaName, popularityScore, pickTrending } from "@/lib/manga-popularity";
import { dedupeVisibleNodes } from "@/lib/content-dedupe";
import { groupLooseSeries } from "@/lib/series-group";

import { registerSeen } from "@/lib/recency";

// Ícone moderno do Google Drive (paleta oficial atualizada).
const GoogleDriveIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 87.3 78"
    className={className}
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
  </svg>
);
import { toast } from "sonner";

type Crumb = { id: string; name: string };

type DriveOpenButtonProps = {
  className?: string;
  children: ReactNode;
};

const DriveOpenButton = forwardRef<HTMLAnchorElement, DriveOpenButtonProps>(
  ({ className, children }, ref) => {
  const finalUrl = IMPERIO_DRIVE_ROOT_URL;

  useEffect(() => {
    console.info("PROPS DO BOTÃO DRIVE:", {
      props: { fixedUrl: finalUrl },
    });
  }, [finalUrl]);

  return (
    <a
      ref={ref}
      href={finalUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        console.info("[drive-debug] clique recebido pelo botão canônico", {
          renderHref: finalUrl,
          sourceOfTruth: "URL fixa do botão Drive",
        });
        openExternalUrl(finalUrl);
      }}
      className={className}
    >
      {children}
    </a>
  );
  }
);

DriveOpenButton.displayName = "DriveOpenButton";

const Index = () => {
  const { email, signOut, isTrial, trialExpiresAt } = useAuth();
  const [trialRemaining, setTrialRemaining] = useState<number>(0);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isTrial || !trialExpiresAt) return;
    const tick = () => setTrialRemaining(Math.max(0, trialExpiresAt - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [isTrial, trialExpiresAt]);

  const trialMmSs = (() => {
    const s = Math.ceil(trialRemaining / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  })();
  const [tree, setTree] = useState<DriveTree | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePublisherId, setActivePublisherId] = useState<string | null>(null);
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [reader, setReader] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [plus18Children, setPlus18Children] = useState<DriveNode[] | null>(null);
  const [plus18Loading, setPlus18Loading] = useState(false);
  const [plus18Loaded, setPlus18Loaded] = useState(false);

  useEffect(() => {
    const isSearchOpen = searchQuery.length >= 2;

    const updateHeaderHeight = () => {
      document.documentElement.style.setProperty(
        "--app-header-height",
        `${headerRef.current?.offsetHeight ?? 0}px`
      );
    };

    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);

    const originalOverflow = document.body.style.overflow;
    if (isSearchOpen && window.matchMedia("(max-width: 639px)").matches) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
      document.body.style.overflow = originalOverflow;
    };
  }, [isTrial, searchQuery]);


  useEffect(() => {
    loadDriveTree()
      .then((t) => {
        console.info("ITEM RENDERIZADO:", t);
        console.info("Campos de Drive encontrados:", driveDebugFields(t));
        console.info("[drive-debug] fonte única do botão Drive", {
          driveType: IMPERIO_DRIVE_ROOT_REFERENCE.driveType,
          driveId: IMPERIO_DRIVE_ROOT_REFERENCE.driveId,
          finalUrl: IMPERIO_DRIVE_ROOT_URL,
        });
        setTree(t);
        // Registra todos os ids do drive pra detectar "novos" entre cargas.
        const ids: string[] = [];
        const walk = (n: DriveNode) => {
          ids.push(n.id);
          n.children?.forEach(walk);
        };
        t.children.forEach(walk);
        registerSeen(ids);
      })
      .catch((e) => setError(e.message));
  }, []);


  // Ordem priorizada das editoras mais conhecidas no topo.
  // Nomes devem bater (case-insensitive) com os do drive_tree.json.
  const PUBLISHER_PRIORITY = [
    "Marvel",
    "Star Wars",
    "DC",
    "DC Vertigo",
    "Mangás",
    "Turma da Mônica",
    "Terror",
    "Homem-Aranha (Abril)",
    "Hulk (Abril)",
    "Almanaque Disney",
    "Mágico Vento",
    "Astérix",
    "Tintin",
    "Bone",
    "Chaves",
    "Os Trapalhões",
    // "Vertigo" foi unificada em "DC Vertigo" (já posicionada após "DC" acima)
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
    "+18",
  ];

  const PLUS18_DRIVE_ID = "1JQwmwaCod3_lmCsOxGRwz_I4nYW64WDZ";
  const EXTERNAL_PUBLISHER_ID = "virtual-plus18";

  const getDefaultPublisher = (list: DriveNode[]) =>
    list.find((p) => p.name.trim().toLowerCase() === "marvel") ??
    list.find((p) => p.id !== EXTERNAL_PUBLISHER_ID) ??
    null;

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

  // ---- Curadoria "Cultura & Biografias" ----
  // Pega arquivos de literatura adaptada, biografias, história, ciência,
  // educação e curiosidades que estão soltos em "Variados".
  // Tem PRIORIDADE sobre "Clássicos" — se bater aqui, sai dos Clássicos.
  const CULTURA_KEYWORDS = [
    // Marcadores explícitos
    "biografia", "biograf", "biografica", "biográfica",
    "literatura brasileira", "literatura ", "romances eternos",
    "grandes figuras em quadrinhos", "edição maravilhosa", "edicao maravilhosa",
    "edio-maravilhosa", "edio maravilhosa",
    // Bíblia / religioso
    "bíblia em quadrinhos", "biblia em quadrinhos", "jacó e esáu",
    "jaco e esau", "rebelião de corá", "rebeliao de cora", "gênesis - robert",
    "genesis - robert", "parabolas", "parábolas",
    // Autores brasileiros / portugueses (literatura)
    "machado de assis", "lima barreto", "lima barret", "jose de alencar",
    "josé de alencar", "graciliano ramos", "lygia fagundes",
    "euclides da cunha", "manuel antônio", "manuel antonio",
    "luis fernando verissimo", "luís fernando verissimo", "sergio porto",
    "sérgio porto", "edney silvestre", "samir machado", "stefan zweig",
    "pero vaz", "carta ao rei", "lira neto", "drauzio varella",
    "marcelo rezende", "leandro narloch", "orlandeli",
    // Autores estrangeiros / clássicos universais
    "aldous huxley", "jonathan franzen", "fiodor dostoievski",
    "dostoievski", "dostoiévski", "stephen collins", "guy durandin",
    "vera portocarrero", "albert einstein", "bertrand russell",
    "paul strathern", "sophie chauveau", "jared diamond",
    "harald welzer", "fernando baez", "robert louis stevenson",
    "scott mccloud", "scott-mccloud", "alison bechdel", "robert crumb",
    "contardo calligaris", "ron martinez", "mick wall", "denilson monteiro",
    "ozzy osbourne", "alexandre rangel", "foenkinos", "cesar almeida",
    "mademoiselle caroline",
    // Obras literárias famosas adaptadas
    "tom sawyer", "ilha do tesouro", "robin hood", "beowulf",
    "ilíada", "iliada", "odisseia", "baleia branca", "admiravel mundo novo",
    "admirável mundo novo", "anne frank", "diário de anne",
    "diario de anne", "dom joao carioca", "dom joão carioca",
    "guerra dos farrapos", "as cariocas", "antes do baile verde",
    "amor verissimo", "amor veríssimo", "aqui e acolá",
    "contos completos", "varias historias", "várias historias",
    "reliquias de casa velha", "relíquias de casa velha",
    "cartomante", "uns braços", "uns bracos", "pavão misterioso",
    "pavao misterioso", "enfermeiro machado", "homem que sabia javanês",
    "homem que sabia javanes", "sertanejo", "sgt de milicias",
    "sgt de milícias", "memorias de um sgt", "memórias de um sgt",
    "musico extraordinario", "músico extraordinário",
    "alexandre e outros herois", "miss edi", "bobok",
    // História / não ficção
    "arte da guerra em quadrinhos", "auschwitz", "história universal",
    "historia universal da destruic", "guerras climaticas",
    "guerras climáticas", "colapso - jared", "guia politicamente incorreto",
    "amazonia em quadrinhos", "amazônia em quadrinhos",
    "história em quadrinhos equi", "historia em quadrinhos equi",
    "história do universo", "historia do universo", "big bang",
    "25-de-abril-pt", "historia-da-nossa-terra", "história-da-nossa-terra",
    "contrastes e confrontos",
    // Curiosidades / saúde / educação / ciência
    "cálculo em quadrinhos", "calculo em quadrinhos",
    "genética e dna", "genetica e dna", "alimentação saud",
    "alimentacao saud", "autismo", "bullying",
    "educação ambiental", "educacao ambiental", "mentiras na propaganda",
    "origem do mundo", "origem-do-mundo", "liv strömquist",
    "liv stromquist", "liv strmquist", "conheça freud", "conheca freud",
    "freud em quadrinhos", "obras completas - dr. sigmund",
    "futebol e raça", "futebol e raca", "bruna surfistinha",
    "carcereiros", "como dizer tudo em ingles", "como dizer tudo em inglês",
    "como vejo o mundo", "como ficar sozinho",
    "como e porque sou romancista", "como é porque sou romancista",
    "cartas a um jovem", "arquivos da loucura",
    "diferença invisível", "diferenca invisivel",
    "desvendando os quadrinhos", "reinventando os quadrinhos",
    "fun home", "maus vol", "14° dalai lama",
    "narradora das neves", "aos cuidados de rafaela",
    "cemiterio perdido dos filmes", "cemitério perdido dos filmes",
    "corta pra mim", "aqueles tempos", "a força da vida",
    "a forca da vida", "ficcao de polpa", "ficção de polpa",
    "gigantesca barba do mal", "eu matei o libório", "eu matei o liborio",
    "banzai - o melhor", "chacrinha", "lennon", "leonardo da vinci",
    "black sabbath", "dr. ozz", "anne frank",
    "aprendar fácil", "aprendar facil", "gibi bullying",
    "quebrando o silêncio", "quebrando o silencio",
    // Filosofia / ensaios / curadoria adicional
    "filsofos-em-ao", "filósofos em ação", "filosofos em acao",
    "golias-tom-gauld", "tom gauld",
    "natureza - a biblia do naturali", "ralph waldo emerson",
    "brasil pais do futuro", "brasil país do futuro",
    "robert crumb - meus problemas", "robert crumb - minha vida",
    "romances eternos - br0004", "homero",
  ];
  const isCultura = (name: string) => {
    const n = name.toLowerCase();
    return CULTURA_KEYWORDS.some((k) => n.includes(k));
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

    // ---------- Super-aba Mangás (consolidação) ----------
    // Coletamos TODOS os títulos da Shueisha (que antes tinham aba própria) e
    // os juntamos em "Mangás" — não existe mais aba "Shueisha".
    // (a montagem final dos children acontece mais abaixo, depois de descobrir
    // mangás avulsos em outras pastas).

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




    // ---------- Editora virtual: Star Wars ----------
    // Pega a pasta inteira "STAR WARS" da Marvel (universo Disney/Lucasfilm)
    // e move pra aba própria, com destaque visual amarelo+preto.
    // Também puxa avulsos de "Variados" e Bônus que mencionem Star Wars.
    const marvel = list.find((n) => lower(n.name) === "marvel");
    const starWarsFolder = findChild(marvel, (n) =>
      /^star\s*wars$/i.test(n.name)
    );
    const isStarWarsName = (name: string) => /\bstar\s*wars\b/i.test(name);
    const variadosForSW = list.find((n) => lower(n.name) === "variados");
    const starWarsLooseFiles = (variadosForSW?.children ?? []).filter(
      (c) => c.type === "file" && isStarWarsName(c.name)
    );
    const starWarsLooseIds = new Set(starWarsLooseFiles.map((c) => c.id));
    const starWarsChildren: DriveNode[] = [
      ...(starWarsFolder?.children ?? []),
      ...starWarsLooseFiles,
    ];
    const virtualStarWars = buildVirtual(
      "virtual-star-wars",
      "Star Wars",
      starWarsChildren
    );


    const junjiItoFolder = findChild(bonusTerror, (n) =>
      /junji\s*ito/i.test(n.name)
    );
    const virtualJunjiIto = junjiItoFolder
      ? { ...junjiItoFolder, id: "virtual-junji-ito", name: "Junji Ito" }
      : null;

    // ---------- Editora virtual: Terror ----------
    // Pega TODA a pasta "Mangás e Quadrinhos de terror" (exceto Junji Ito que tem aba própria).
    // Antes: filtra títulos que são originalmente Marvel ou DC/Vertigo e
    // realoca para suas abas corretas.
    const isTerrorMarvelTitle = (name: string) => {
      const n = name.toLowerCase();
      return (
        /tumba\s+do?\s+dr[áa]cula/.test(n) ||
        /tumba\s+de\s+dr[áa]cula/.test(n) ||
        /terror\s+de\s+dr[áa]cula/.test(n) ||
        /monster\s+unleashed/.test(n) ||
        /^terror\s+inc\b/.test(n)
      );
    };
    const isTerrorDCTitle = (name: string) => {
      const n = name.toLowerCase();
      return (
        /houses?\s+of\s+unholy/.test(n) ||
        /\(vertigem\)/.test(n) ||
        /\(vertigo\)/.test(n)
      );
    };
    const terrorMarvelExtras: DriveNode[] = [];
    const terrorDCExtras: DriveNode[] = [];
    const terrorChildren = (bonusTerror?.children ?? []).filter((c) => {
      if (/junji\s*ito/i.test(c.name)) return false;
      if (isTerrorMarvelTitle(c.name)) { terrorMarvelExtras.push(c); return false; }
      if (isTerrorDCTitle(c.name)) { terrorDCExtras.push(c); return false; }
      return true;
    });
    const virtualTerror = bonusTerror
      ? buildVirtual("virtual-terror", "Terror", terrorChildren)
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

    // ---------- Editora virtual: Cultura & Biografias ----------
    // Pega arquivos de literatura, biografias, história, ciência e curiosidades
    // que estão soltos em "Variados". Tem PRIORIDADE sobre "Clássicos".
    const variados = list.find((n) => lower(n.name) === "variados");
    const culturaLooseFiles = (variados?.children ?? []).filter(
      (c) => c.type === "file" && isCultura(c.name) && !isMonicaName(c.name)
    );
    const culturaLooseIds = new Set(culturaLooseFiles.map((c) => c.id));
    const virtualCultura = buildVirtual(
      "virtual-cultura-biografias",
      "Cultura & Biografias",
      culturaLooseFiles
    );

    // ---------- Editora virtual: Clássicos ----------
    // Combina:
    //   1) PDFs vintage soltos em "Variados" (excluindo os que viraram Cultura)
    //   2) Pastas inteiras vintage espalhadas por outras editoras (CLASSICOS_FOLDER_NAMES)
    const classicosLooseFiles = (variados?.children ?? []).filter(
      (c) =>
        c.type === "file" &&
        isClassico(c.name) &&
        !culturaLooseIds.has(c.id)
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

    // ---------- Realocação de arquivos avulsos de "Variados" ----------
    // Pega PDFs soltos no Variados que claramente pertencem a outras abas
    // (MAD, Disney, Astérix, Bonelli, Junji Ito, DC, Trapalhões, Bíblia,
    // Image, Marvel) e injeta na pasta da editora correspondente.
    // Roda DEPOIS da extração de Cultura/Clássicos — não pega o que já saiu.
    type ReallocTarget =
      | "mad" | "disney" | "asterix" | "bonelli" | "junji" | "dc"
      | "trapalhoes" | "biblia" | "image" | "marvel" | "mangas";
    const reallocTarget = (rawName: string): ReallocTarget | null => {
      const n = rawName.toLowerCase();
      // Junji Ito / Shintarou Kago / Dementia
      if (/(junji[\s-]?ito|cat[\s-]?diary[\s-]?junji|shintarou[\s-]?kago|dementia[\s-]?21)/.test(n)) return "junji";
      // MAD
      if (/(^|[^a-z])mad([\s\-#]|$)/.test(n) && !/madame|madagascar|madrasta/.test(n)) return "mad";
      // Astérix
      if (/(^|[\s\-_])(asterix|astérix)([\s\-_]|$)/.test(n)) return "asterix";
      // Disney / Cartoon clássicos animados
      if (/(almanaque\s+disney|essencial\s+disney|cl[sá]ssicos[\s-]?disney|aristogatas|carros\s*-\s*radiator|kung-?fu\s+panda|hora\s+de\s+aventura|marceline|album\s+dinheirinho|marte\s+ataca\s+popeye|little\s+pony|tio\s+patinhas|barks\s*&|barks\s+and\s+rosa)/.test(n)) return "disney";
      // Sergio Bonelli (Dylan Dog etc.)
      if (/(dylan[\s-]?dog|martin\s+myst[èe]re|mister\s+no|dampyr|nathan\s+never)/.test(n)) return "bonelli";
      // DC
      if (/(morte\s+do\s+superman|detective\s+comics|batman[\s-]?arkham|superman[\s-]?vs[\s-]?muhammad)/.test(n)) return "dc";
      // Marvel
      if (/(sergio\s+arag.n.s\s+massacra\s+a\s+marvel)/.test(n)) return "marvel";
      // Trapalhões
      if (/(as[\s_]?aventuras[\s_]?dos[\s_]?trapalho|trapalho)/.test(n)) return "trapalhoes";
      // Bíblia em Quadrinhos (avulsos)
      if (/(b[íi]blia\s+em\s+quadrinhos|jac[óo]\s+e\s+es[áa]u|rebeli[ãa]o\s+de\s+cor[áa]|g[êe]nesis\s*-\s*robert\s+crumb|parabolas\s+de\s+todo|par[áa]bolas\s+de\s+todo)/.test(n)) return "biblia";
      // Image Comics (Liga Extraordinária / Lady Killer)
      if (/(liga\s+extraordin[áa]ria|lady\s+killer)/.test(n)) return "image";
      // Mangás avulsos
      if (/(mang[áa]\s*-\s*lipsticklove|mang[áa]\s*-\s*samurai\s*x)/.test(n)) return "mangas";
      return null;
    };

    // Só pega arquivos que ainda estão no Variados (não migraram pra Cultura/Clássicos)
    const reallocBuckets: Record<ReallocTarget, DriveNode[]> = {
      mad: [], disney: [], asterix: [], bonelli: [], junji: [], dc: [],
      trapalhoes: [], biblia: [], image: [], marvel: [], mangas: [],
    };
    const reallocIds = new Set<string>();
    for (const c of variados?.children ?? []) {
      if (c.type !== "file") continue;
      if (classicosLooseIds.has(c.id) || culturaLooseIds.has(c.id)) continue;
      const t = reallocTarget(c.name);
      if (t) {
        reallocBuckets[t].push(c);
        reallocIds.add(c.id);
      }
    }

    // ---------- Super-aba Mangás: consolidação total ----------
    // Junta na pasta "Mangás":
    //  • Tudo que já estava em "Mangás" (inclusive títulos da Shueisha)
    //  • TODOS os mangás de "Atualizações Quinzenais → Inclusão → Mangás"
    //  • Arquivos avulsos com cara de mangá em "Variados"
    //  • Pastas/arquivos com cara de mangá em "Bônus" e "Editoras Brasileiras"
    //  • Avulsos de Variados que o reallocator marcou como "mangas"
    const existingMangaIds = new Set((mangas?.children ?? []).map((n) => n.id));
    const dedupeAdd = (arr: DriveNode[]) =>
      arr.filter((n) => {
        if (existingMangaIds.has(n.id)) return false;
        existingMangaIds.add(n.id);
        return true;
      });

    const fromUpdates = dedupeAdd(atualizacoesMangas?.children ?? []);
    const orientalFromVariados = dedupeAdd(
      (variados?.children ?? []).filter(
        (c) =>
          c.type === "file" &&
          !culturaLooseIds.has(c.id) &&
          !classicosLooseIds.has(c.id) &&
          !reallocIds.has(c.id) &&
          !starWarsLooseIds.has(c.id) &&
          isOrientalLikeName(c.name)
      )
    );
    const orientalFromVariadosIds = new Set(orientalFromVariados.map((n) => n.id));
    const orientalFromBonus = dedupeAdd(
      (bonus?.children ?? []).filter(
        (c) =>
          !/mang[áa]s\s+e\s+quadrinhos\s+de\s+terror/i.test(c.name) &&
          isOrientalLikeName(c.name)
      )
    );
    const orientalFromBonusIds = new Set(orientalFromBonus.map((n) => n.id));
    const orientalFromEditorasBr = dedupeAdd(
      (editorasBr?.children ?? []).filter((c) => isOrientalLikeName(c.name))
    );
    const orientalFromEditorasBrIds = new Set(orientalFromEditorasBr.map((n) => n.id));
    const orientalFromReallocator = dedupeAdd(reallocBuckets.mangas);
    reallocBuckets.mangas = []; // já consumido — não duplicar via appendBucket

    // Junji Ito vira uma subpasta dentro de Mangás (com seus avulsos do Variados)
    const junjiForMangas: DriveNode[] = junjiItoFolder
      ? [
          {
            ...junjiItoFolder,
            name: "Junji Ito",
            children: [
              ...(junjiItoFolder.children ?? []),
              ...reallocBuckets.junji,
            ],
          },
        ]
      : reallocBuckets.junji.length > 0
      ? [
          {
            id: "virtual-junji-ito-bucket",
            name: "Junji Ito",
            type: "folder" as const,
            children: [...reallocBuckets.junji],
          },
        ]
      : [];
    reallocBuckets.junji = []; // consumido

    const allMangaChildrenRaw: DriveNode[] = [
      ...(mangas?.children ?? []),
      ...fromUpdates,
      ...orientalFromVariados,
      ...orientalFromBonus,
      ...orientalFromEditorasBr,
      ...orientalFromReallocator,
      ...junjiForMangas,
    ];

    // Mangás + Manhwa juntos: a aba "Mangás" agora inclui manhwas/manhuas.
    const allMangaChildren = allMangaChildrenRaw;

    // Ordena por POPULARIDADE (mais famosos primeiro), tie-break alfabético.
    const sortByFame = (a: DriveNode, b: DriveNode) => {
      const sa = popularityScore(a.name);
      const sb = popularityScore(b.name);
      if (sa !== sb) return sa - sb;
      return a.name.localeCompare(b.name, "pt-BR", { numeric: true });
    };

    const enrichedMangas: DriveNode | undefined =
      allMangaChildren.length > 0
        ? {
            id: mangas?.id ?? "virtual-mangas",
            name: "Mangás",
            type: "folder" as const,
            children: [...allMangaChildren].sort(sortByFame),
          }
        : mangas;

    const virtualManhwa: DriveNode | null = null;

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

    // ---------- Helper para anexar bucket à pasta destino ----------
    // Cria uma subpasta "Avulsos (de Variados)" dentro do destino com os
    // arquivos realocados, mantendo a organização original.
    const appendBucket = (
      target: DriveNode | null | undefined,
      bucket: DriveNode[]
    ): DriveNode | null | undefined => {
      if (!target || bucket.length === 0) return target;
      const sub: DriveNode = {
        id: `${target.id}-avulsos-variados`,
        name: "Avulsos (de Variados)",
        type: "folder",
        children: [...bucket].sort(sortPtBr),
      };
      return {
        ...target,
        children: [...(target.children ?? []), sub].sort(sortPtBr),
      };
    };

    // Aplica agrupamento de séries (CBRs soltos) recursivamente numa árvore.
    const groupLooseInTree = (node: DriveNode): DriveNode => {
      if (!node.children) return node;
      const groupedChildren = groupLooseSeries(
        node.children.map((c) => (c.type === "folder" ? groupLooseInTree(c) : c))
      );
      return { ...node, children: groupedChildren };
    };

    // Aplica nos virtuais (que vão direto pro merged)
    const virtualJunjiItoFinal = appendBucket(virtualJunjiIto, reallocBuckets.junji);
    const virtualAsterixFinal = appendBucket(virtualAsterix, reallocBuckets.asterix);
    const virtualTrapalhoesFinal = appendBucket(virtualTrapalhoes, reallocBuckets.trapalhoes);

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
      if (lname === "mangás" && enrichedMangas) {
        return appendBucket(enrichedMangas, reallocBuckets.mangas) ?? enrichedMangas;
      }
      if (lname === "infantil") {
        return stripChildren(
          cur,
          (c) => isMonicaName(c.name) || movedIds.has(c.id)
        );
      }
      if (lname === "panini") {
        return stripChildren(cur, (c) => isMonicaName(c.name));
      }
      if (lname === "disney") {
        const stripped = stripChildren(cur, (c) => movedIds.has(c.id));
        return appendBucket(stripped, reallocBuckets.disney) ?? stripped;
      }
      if (lname === "sergio bonelli") {
        const stripped = stripChildren(cur, (c) => movedIds.has(c.id));
        return appendBucket(stripped, reallocBuckets.bonelli) ?? stripped;
      }
      if (lname === "dargaud") return stripChildren(cur, (c) => movedIds.has(c.id));
      if (lname === "editora abril")
        return stripChildren(cur, (c) => movedIds.has(c.id));
      if (lname === "editoras brasileiras")
        return stripChildren(
          cur,
          (c) => movedIds.has(c.id) || orientalFromEditorasBrIds.has(c.id)
        );
      if (lname === "mad") {
        return appendBucket(cur, reallocBuckets.mad) ?? cur;
      }
      if (lname === "marvel") {
        // Remove a pasta STAR WARS — agora tem aba própria.
        const stripped = starWarsFolder
          ? stripChildren(cur, (c) => c.id === starWarsFolder.id)
          : cur;
        const withRealloc = appendBucket(stripped, reallocBuckets.marvel) ?? stripped;
        const withTerror = appendBucket(withRealloc, terrorMarvelExtras) ?? withRealloc;
        return groupLooseInTree(withTerror);
      }
      if (lname === "dc") {
        const withRealloc = appendBucket(cur, reallocBuckets.dc) ?? cur;
        const withTerror = appendBucket(withRealloc, terrorDCExtras) ?? withRealloc;
        return groupLooseInTree(withTerror);
      }
      if (lname === "image comics") {
        return appendBucket(cur, reallocBuckets.image) ?? cur;
      }
      if (lname === "bíblia em quadrinhos") {
        return appendBucket(cur, reallocBuckets.biblia) ?? cur;
      }
      if (lname === "variados") {
        // Tira PDFs que viraram Cultura, Clássicos, foram realocados, viraram Star Wars
        // ou foram absorvidos pela super-aba Mangás.
        return stripChildren(
          cur,
          (c) =>
            classicosLooseIds.has(c.id) ||
            culturaLooseIds.has(c.id) ||
            reallocIds.has(c.id) ||
            starWarsLooseIds.has(c.id) ||
            orientalFromVariadosIds.has(c.id)
        );
      }
      if (lname === "bônus") {
        // Remove inteiramente a pasta "Mangás e Quadrinhos de terror" de Bônus
        // (o conteúdo vive em "Junji Ito" e "Terror") e também os mangás
        // já absorvidos pela super-aba Mangás.
        return {
          ...cur,
          children: (cur.children ?? []).filter(
            (sub) =>
              !/mang[áa]s\s+e\s+quadrinhos\s+de\s+terror/i.test(sub.name) &&
              !orientalFromBonusIds.has(sub.id)
          ),
        };
      }
      return cur;
    });

    // Se a pasta "Mangás" não existir no nível raiz mas tivermos coletado
    // mangás de outras fontes, injetamos uma virtual.
    const mangasInList = filtered.some((n) => lower(n.name) === "mangás");
    const virtualMangasFallback =
      !mangasInList && enrichedMangas ? enrichedMangas : null;

    const merged = [
      ...filtered.filter(
        (n) => !/atualiza[cç][ãa]o|atualiza[cç][õo]es\s+quinzenais/i.test(n.name)
      ),
      ...(virtualMangasFallback ? [virtualMangasFallback] : []),
      ...(virtualManhwa ? [virtualManhwa] : []),
      ...(virtualStarWars ? [virtualStarWars] : []),
      ...(virtualMonica ? [virtualMonica] : []),
      
      ...(virtualTerror ? [virtualTerror] : []),
      ...(virtualHomemAranhaAbril ? [virtualHomemAranhaAbril] : []),
      ...(virtualHulkAbril ? [virtualHulkAbril] : []),
      ...(virtualAlmanaqueDisney ? [virtualAlmanaqueDisney] : []),
      ...(virtualMagicoVento ? [virtualMagicoVento] : []),
      ...(virtualAsterixFinal ? [virtualAsterixFinal] : []),
      ...(virtualTintin ? [virtualTintin] : []),
      ...(virtualBone ? [virtualBone] : []),
      ...(virtualChaves ? [virtualChaves] : []),
      ...(virtualTrapalhoesFinal ? [virtualTrapalhoesFinal] : []),
      ...(virtualClassicos ? [virtualClassicos] : []),
      ...(virtualCultura ? [virtualCultura] : []),
      {
        id: "virtual-plus18",
        name: "+18",
        type: "folder" as const,
        children: plus18Children ?? [],
      },
    ];

    const idx = (name: string) => {
      const i = PUBLISHER_PRIORITY.findIndex(
        (p) => p.toLowerCase() === name.toLowerCase()
      );
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    const sorted = [...merged].sort((a, b) => {
      const ai = idx(a.name);
      const bi = idx(b.name);
      if (ai !== bi) return ai - bi;
      return a.name.localeCompare(b.name, "pt-BR", { numeric: true });
    });
    // Separa o +18 antes do dedupe — ele tem children vazio e seria descartado.
    const plus18 = sorted.find((n) => n.id === EXTERNAL_PUBLISHER_ID) ?? null;
    const rest = sorted.filter((n) => n.id !== EXTERNAL_PUBLISHER_ID);
    const deduped = dedupeVisibleNodes(rest).filter(
      (n) => n.type === "file" || (n.children?.length ?? 0) > 0
    );
    return plus18 ? [...deduped, plus18] : deduped;
  }, [tree, plus18Children]);

  // Seleciona Marvel como padrão. A aba "+18" agora pode ser ativa
  // (carrega o conteúdo via edge function), mas só pra quem não é trial.
  useEffect(() => {
    if (!publishers.length) return;

    const active = activePublisherId
      ? publishers.find((p) => p.id === activePublisherId)
      : null;
    if (!active) {
      const defaultPublisher = getDefaultPublisher(publishers);
      if (defaultPublisher) {
        setActivePublisherId(defaultPublisher.id);
        setCrumbs([]);
      }
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

  useEffect(() => {
    if (!currentFolder) return;
    console.info("ITEM RENDERIZADO:", currentFolder);
    console.info("Campos de Drive encontrados:", driveDebugFields(currentFolder));
  }, [currentFolder?.id, currentFolder]);

  const items = useMemo<DriveNode[]>(
    () => currentFolder?.children ?? [],
    [currentFolder]
  );

  const handleSelectPublisher = (id: string) => {
    if (id === EXTERNAL_PUBLISHER_ID) {
      if (isTrial) {
        toast.error("Pack +18 bloqueado. Somente quem comprou pode acessar.");
        return;
      }
      setActivePublisherId(id);
      setCrumbs([]);
      if (!plus18Loaded && !plus18Loading) {
        setPlus18Loading(true);
        loadDriveFolderTree(PLUS18_DRIVE_ID, "+18")
          .then((folder) => {
            setPlus18Children(folder.children ?? []);
            setPlus18Loaded(true);
          })
          .catch(() => {
            toast.error("Não consegui carregar o +18 agora. Tente novamente em alguns segundos.");
          })
          .finally(() => setPlus18Loading(false));
      }
      return;
    }

    if (isTrial) {
      const target = publishers.find((p) => p.id === id);
      if (target && target.name.trim().toLowerCase() === "star wars") {
        toast.error("Pack Star Wars bloqueado. Somente quem comprou pode acessar.");
        return;
      }
    }
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
      <header ref={headerRef} className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        {isTrial && (
          <div className="bg-destructive text-destructive-foreground text-center text-xs sm:text-sm font-bold py-1.5 px-3">
            ⏱️ Modo demonstração. Expira em <span className="tabular-nums">{trialMmSs}</span> · Downloads bloqueados
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src={logo} alt="" className="w-9 h-9" />
          <div className="leading-tight">
            <h1 className="font-comic text-xl tracking-wide">
              IMPÉRIO DOS <span className="text-accent">QUADRINHOS</span>
            </h1>
            {isTrial && (
              <p className="text-[10px] text-muted-foreground hidden sm:block">
                modo demonstração
              </p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <OnlinePresence />
            <GlobalSearch
              tree={tree}
              onOpenFile={(n) => setReader({ id: n.id, name: n.name })}
              onOpenFolder={(pub, ids, names) => handleJumpTo(pub, ids, names)}
              onQueryChange={setSearchQuery}
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
          {!isTrial && (
            <DriveOpenButton
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background h-9 px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <GoogleDriveIcon className="w-4 h-4" />
              Abrir pasta no Google Drive
            </DriveOpenButton>
          )}
          <GlobalSearch
            tree={tree}
            onOpenFile={(n) => setReader({ id: n.id, name: n.name })}
            onOpenFolder={(pub, ids, names) => handleJumpTo(pub, ids, names)}
            onQueryChange={setSearchQuery}
          />

        </div>
      </header>


      {searchQuery.length >= 2 ? (
        (() => {
          const results = tree ? searchTree(tree, searchQuery, 120) : [];
          const nodes = results.map((r) => r.node);
          return (
            <section className="max-w-7xl mx-auto px-4 py-4 sm:py-6 h-[calc(100dvh-var(--app-header-height,0px))] sm:h-auto overflow-hidden sm:overflow-visible flex flex-col">
              <h2 className="text-sm text-muted-foreground mb-3 shrink-0">
                {nodes.length === 0
                  ? <>Nenhum resultado para <strong className="text-foreground">"{searchQuery}"</strong>.</>
                  : <>Mostrando <strong className="text-foreground">{nodes.length}</strong> resultado{nodes.length === 1 ? "" : "s"} para <strong className="text-foreground">"{searchQuery}"</strong></>}
              </h2>
              {nodes.length > 0 && (
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y pr-1 pb-6 rounded-lg sm:max-h-[calc(100dvh-220px)] sm:pr-2">
                  <FolderGrid
                    items={nodes}
                    onOpenFolder={(n) => {
                      const hit = results.find((r) => r.node.id === n.id);
                      if (!hit) return;
                      const isPublisher = hit.node.id === hit.publisher.id;
                      const pathIds = isPublisher ? [] : [...hit.pathIds.slice(1), hit.node.id];
                      const pathNames = isPublisher ? [] : [...hit.pathNames.slice(1), hit.node.name];
                      handleJumpTo(hit.publisher, pathIds, pathNames);
                      setSearchQuery("");
                    }}
                    onOpenFile={(n) => setReader({ id: n.id, name: n.name })}
                    emptyHint="Sem resultados."
                  />
                </div>
              )}
            </section>
          );
        })()
      ) : (
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

            {(() => {
              const n = p.name.trim().toLowerCase();
              const isMangaTab = n === "mangás" || n === "mangas";
              if (isMangaTab && crumbs.length === 0) {
                return <InfiniteCoverMarquee items={items} limit={20} />;
              }
              return null;
            })()}

            <FolderGrid
              items={items}
              onOpenFolder={handleOpenFolder}
              onOpenFile={(n) => setReader({ id: n.id, name: n.name })}
              emptyHint={p.id === EXTERNAL_PUBLISHER_ID && plus18Loading ? "Carregando +18…" : "Pasta vazia."}
              mode={(() => {
                if (crumbs.length !== 0) return "default";
                const n = p.name.trim().toLowerCase();
                if (n === "mangás" || n === "mangas") return "manga";
                return "default";
              })()}
            />
          </TabsContent>
        ))}
      </Tabs>
      )}


      <ComicReader
        fileId={reader?.id ?? null}
        fileName={reader?.name ?? ""}
        onClose={() => setReader(null)}
      />
    </div>
  );
};

export default Index;
