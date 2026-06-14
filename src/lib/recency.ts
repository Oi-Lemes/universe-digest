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

const CLEAR_FLAG = "drive:firstSeen:cleared-novo:v2";

function load(): SeenMap {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as SeenMap) : {};
  } catch {
    cache = {};
  }
  // Migração única: zera selos NOVO acumulados pela lógica antiga.
  try {
    if (localStorage.getItem(CLEAR_FLAG) !== "1") {
      const oldStamp = Date.now() - (NEW_WINDOW_DAYS + 30) * 86_400_000;
      const next: SeenMap = {};
      for (const id of Object.keys(cache!)) next[id] = oldStamp;
      cache = next;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
      localStorage.setItem(CLEAR_FLAG, "1");
    }
  } catch { /* ignore */ }
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
  // Timestamp bem antigo → isNew() sempre retorna false pra ids vistos via
  // simples carregamento da árvore. O selo NOVO só aparece quando você
  // marcar explicitamente via markAsNew() (ex.: ao subir conteúdo novo).
  const oldStamp = Date.now() - (NEW_WINDOW_DAYS + 30) * 86_400_000;
  let changed = false;
  for (const id of ids) {
    if (!(id in map)) {
      map[id] = oldStamp;
      changed = true;
    }
  }
  if (changed) persist(map);
  // Mantém a flag de bootstrap por compatibilidade (não é mais usada na lógica).
  try { localStorage.setItem(BOOTSTRAP_KEY, "1"); } catch { /* ignore */ }
  return map;
}

/** Marca explicitamente ids como recém-adicionados (mostra selo NOVO). */
export function markAsNew(ids: Iterable<string>): void {
  const map = { ...load() };
  const now = Date.now();
  for (const id of ids) map[id] = now;
  persist(map);
}

/** Reseta todos os timestamps para "antigos" — limpa selos NOVO em massa. */
export function clearAllNew(): void {
  const map = load();
  const oldStamp = Date.now() - (NEW_WINDOW_DAYS + 30) * 86_400_000;
  const next: SeenMap = {};
  for (const id of Object.keys(map)) next[id] = oldStamp;
  persist(next);
}

export function getFirstSeen(id: string): number | undefined {
  return load()[id];
}

export function isNew(id: string, now = Date.now()): boolean {
  const t = load()[id];
  if (!t) return false;
  return now - t <= NEW_WINDOW_DAYS * 86_400_000;
}
