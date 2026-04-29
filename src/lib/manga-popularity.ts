// Ranking de popularidade dos mangás/manhwas/manhuas. Quanto MENOR o número,
// mais famoso. Usado pra ordenar a aba "Mangás" dos mais conhecidos pros menos.
// Match é case-insensitive contra `node.name.toLowerCase().includes(key)`.
const POPULARITY: Array<[string, number]> = [
  // Tier S — fenômenos globais
  ["one piece", 1],
  ["naruto", 2],
  ["dragon ball", 3],
  ["bleach", 4],
  ["jujutsu kaisen", 5],
  ["demon slayer", 6],
  ["kimetsu no yaiba", 6],
  ["chainsaw man", 7],
  ["attack on titan", 8],
  ["shingeki no kyojin", 8],
  ["death note", 9],
  ["tokyo ghoul", 10],
  ["hunter x hunter", 11],
  ["my hero academia", 12],
  ["boku no hero", 12],
  ["one punch man", 13],
  ["fullmetal alchemist", 14],
  ["solo leveling", 15],
  ["berserk", 16],
  ["vagabond", 17],
  // Tier A
  ["jojo", 20],
  ["saint seiya", 21],
  ["cdz", 21],
  ["yu yu hakusho", 22],
  ["yu-gi-oh", 23],
  ["fairy tail", 24],
  ["black clover", 25],
  ["dr. stone", 26],
  ["dr stone", 26],
  ["mob psycho", 27],
  ["spy x family", 28],
  ["spy family", 28],
  ["dan da dan", 29],
  ["dandadan", 29],
  ["blue lock", 30],
  ["kaiju no. 8", 31],
  ["kaiju no 8", 31],
  ["fire force", 32],
  ["food wars", 33],
  ["shokugeki", 33],
  ["the lost canvas", 34],
  ["soul eater", 35],
  ["claymore", 36],
  ["inuyasha", 37],
  ["rurouni kenshin", 38],
  ["samurai x", 38],
  ["captain tsubasa", 39],
  ["slam dunk", 40],
  ["haikyu", 41],
  ["hajime no ippo", 42],
  ["ao ashi", 43],
  ["diamond no ace", 44],
  ["nanatsu no taizai", 45],
  ["seven deadly sins", 45],
  ["edens zero", 46],
  ["the elusive samurai", 47],
  ["boruto", 48],
  ["dragon ball super", 49],
  // Tier B — clássicos / nicho
  ["gantz", 50],
  ["20th century boys", 51],
  ["monster", 52],
  ["pluto", 53],
  ["billy bat", 54],
  ["vinland saga", 55],
  ["historie", 56],
  ["beck", 57],
  ["nana", 58],
  ["fruits basket", 59],
  ["sailor moon", 60],
  ["card captor sakura", 61],
  ["sakura card captor", 61],
  ["clamp", 62],
  ["x/1999", 63],
  ["evangelion", 64],
  ["akira", 65],
  ["ghost in the shell", 66],
  ["cowboy bebop", 67],
  ["trigun", 68],
  ["hellsing", 69],
  ["air gear", 70],
  ["beelzebub", 71],
  ["magi", 72],
  ["rave master", 73],
  ["katekyo hitman reborn", 74],
  ["chihayafuru", 75],
  ["golden kamuy", 76],
  ["lipsticklove", 80],
  ["junji ito", 81],
  ["uzumaki", 82],
  ["tokyo revengers", 83],
  ["beastars", 84],
  ["chainsaw", 85],
  ["the promised neverland", 86],
  ["yakusoku no neverland", 86],
];

const ORIENTAL_KEYWORDS = [
  "manga", "mangá", "manhwa", "manhua", "doujinshi", "doujin",
  "shonen", "shōnen", "shoujo", "shōjo", "seinen", "josei",
  "webtoon", "webcomic",
];

/** Heurística: nome parece de mangá/manhwa/manhua/oriental? */
export function isOrientalLikeName(name: string): boolean {
  const n = name.toLowerCase();
  if (ORIENTAL_KEYWORDS.some((k) => n.includes(k))) return true;
  // Palavras-chave japonesas comuns em títulos
  if (/\b(no|wa|ga|kun|chan|sama|sensei|senpai)\b/.test(n)) return true;
  // Bate com algum título conhecido do ranking
  if (POPULARITY.some(([k]) => n.includes(k))) return true;
  // Manhwas/manhuas conhecidos
  return MANHWA_KEYS.some((k) => n.includes(k));
}

// ---- Manhwa / Manhua (coreano/chinês) ----
// Lista de keywords (lowercase) — match por includes contra node.name.
// Cobre os mais populares + obras presentes no acervo.
const MANHWA_KEYS = [
  "solo leveling", "tower of god", "noblesse", "god of high school",
  "the god of high", "bastard", "sweet home", "the gamer",
  "hardcore leveling", "omniscient reader", "beginning after the end",
  "return of mount hua", "mercenary enrollment", "nano machine",
  "kill the hero", "reaper of the drifting", "i alone level up",
  "seoul station", "ragna crimson", "second life ranker", "overgeared",
  "revenge of baskerville", "ghost teller", "bone collection",
  "itaewon class", "cheese in the trap", "study group", "viral hit",
  "girls of the wilds", "look out the studio", "wind breaker",
  "teenage mercenary", "hellbound", "duty after school", "annarasumanara",
  "as the gods will", "navillera", "my id is gangnam", "your letter",
  "lookism", "true beauty", "operation true love", "the boxer",
  "remarried empress", "who made me a princess", "daughter of the emperor",
  "villains are destined to die", "tomb raider king", "damn reincarnation",
  "tanmoonki", "manhwa", "manhua", "webtoon", "webcomic",
  "leveling up", "regressor", "reincarnation", "academy",
];

/** Detecta se é manhwa/manhua (coreano/chinês) — separa do mangá japonês. */
export function isManhwaName(name: string): boolean {
  const n = name.toLowerCase();
  // Exclui se for claramente japonês (mangá tradicional)
  // mas alguns títulos têm "no" — só descarta se outras pistas não baterem.
  if (MANHWA_KEYS.some((k) => n.includes(k))) {
    // Se também bater como mangá top-tier japonês, fica em mangá
    // (ex.: "boku no hero academia" tem "academia" mas é Shueisha)
    const japaneseTop = ["one piece","naruto","bleach","dragon ball","jujutsu","demon slayer","kimetsu","chainsaw","attack on titan","shingeki","death note","tokyo ghoul","hunter x hunter","my hero","boku no hero","one punch","fullmetal","berserk","vagabond","jojo","saint seiya","cdz","yu yu","yu-gi-oh","fairy tail","black clover","dr stone","dr. stone","mob psycho","spy family","spy x family","dandadan","dan da dan","blue lock","kaiju no","fire force","food wars","shokugeki","slam dunk","haikyu","hajime no ippo","ao ashi","diamond no ace","nanatsu","seven deadly","edens zero","elusive samurai","boruto","gantz","20th century","monster","pluto","billy bat","vinland","historie","beck","nana","fruits basket","sailor moon","sakura","clamp","evangelion","akira","ghost in the shell","cowboy bebop","trigun","hellsing","magi","rave master","katekyo","chihayafuru","golden kamuy","junji ito","uzumaki","tokyo revengers","beastars","promised neverland","yakusoku","samurai x","rurouni","inuyasha","claymore","soul eater","captain tsubasa"];
    if (japaneseTop.some((k) => n.includes(k))) return false;
    return true;
  }
  return false;
}

/** Score de popularidade (menor = mais famoso). Sem match → final da fila. */
export function popularityScore(name: string): number {
  const n = name.toLowerCase();
  let best = Number.MAX_SAFE_INTEGER;
  for (const [k, score] of POPULARITY) {
    if (n.includes(k) && score < best) best = score;
  }
  return best;
}

/** Os N mais "em alta" entre os mangás passados (top do ranking). */
export function pickTrending(names: string[], topN = 6): string[] {
  const ranked = names
    .map((name) => ({ name, score: popularityScore(name) }))
    .filter((x) => x.score < Number.MAX_SAFE_INTEGER)
    .sort((a, b) => a.score - b.score);
  return ranked.slice(0, topN).map((x) => x.name);
}
