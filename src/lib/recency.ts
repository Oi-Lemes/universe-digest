// Tracks when each Drive node id was first seen by THIS browser. Lets us show
// "Recém adicionados" filters and a NEW badge in real time, even though the
// drive_tree.json itself has no timestamps. The very first time a tree is
// loaded everything gets the same timestamp (so nothing is "new"). On every
// subsequent load, only ids that weren't in storage before are marked new.

const STORAGE_KEY = "drive:firstSeen:v1";
const BOOTSTRAP_KEY = "drive:firstSeen:bootstrapped:v1";
// Janelas de "novidade" (em dias)
export const NEW_WINDOW_DAYS = 14;

type SeenMap = Record<string, number>;

let cache: SeenMap | null = null;

function load(): SeenMap {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as SeenMap) : {};
  } catch {
    cache = {};
  }
  return cache!;
}

function persist(map: SeenMap) {
  cache = map;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* quota cheia: ignora */
  }
}

/**
 * Registra IDs vistos agora. Retorna o mapa atualizado.
 * - 1ª execução do app no navegador: marca TODOS com o mesmo timestamp (bootstrap),
 *   pra ninguém aparecer como "novo" no primeiro acesso.
 * - Execuções seguintes: só ids inéditos recebem timestamp = agora → "novos".
 */
export function registerSeen(ids: Iterable<string>): SeenMap {
  const map = { ...load() };
  const now = Date.now();
  const bootstrapped = (() => {
    try { return localStorage.getItem(BOOTSTRAP_KEY) === "1"; } catch { return false; }
  })();
  // Bootstrap: usa timestamp ANTIGO pra nada aparecer como novo no 1º load.
  const stamp = bootstrapped ? now : now - (NEW_WINDOW_DAYS + 1) * 86_400_000;
  let changed = false;
  for (const id of ids) {
    if (!(id in map)) {
      map[id] = stamp;
      changed = true;
    }
  }
  if (changed) persist(map);
  if (!bootstrapped) {
    try { localStorage.setItem(BOOTSTRAP_KEY, "1"); } catch { /* ignore */ }
  }
  return map;
}

export function getFirstSeen(id: string): number | undefined {
  return load()[id];
}

export function isNew(id: string, now = Date.now()): boolean {
  const t = load()[id];
  if (!t) return false;
  return now - t <= NEW_WINDOW_DAYS * 86_400_000;
}
