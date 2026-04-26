// Tema visual por editora: cor de destaque, fonte e mini logo.
// Cores são tokens HSL (sem `hsl(...)`) para combinarem com o design system.

import marvel from "@/assets/publishers/marvel.png";
import dc from "@/assets/publishers/dc.png";
import image from "@/assets/publishers/image.png";
import darkHorse from "@/assets/publishers/dark-horse.png";
import vertigo from "@/assets/publishers/vertigo.png";
import idw from "@/assets/publishers/idw.png";
import disney from "@/assets/publishers/disney.png";
import panini from "@/assets/publishers/panini.png";
import mad from "@/assets/publishers/mad.png";
import bonelli from "@/assets/publishers/bonelli.png";
import boom from "@/assets/publishers/boom.png";
import dynamite from "@/assets/publishers/dynamite.png";
import shueisha from "@/assets/publishers/shueisha.png";
import avatarPress from "@/assets/publishers/avatar-press.png";
import titan from "@/assets/publishers/titan.png";
import tex from "@/assets/publishers/tex.png";
import zagor from "@/assets/publishers/zagor.png";
import dargaud from "@/assets/publishers/dargaud.png";
import soleil from "@/assets/publishers/soleil.png";
import starComics from "@/assets/publishers/star-comics.png";
import ebal from "@/assets/publishers/ebal.png";
import abril from "@/assets/publishers/abril.png";
import globo from "@/assets/publishers/globo.png";
import mangas from "@/assets/publishers/mangas.png";
import turmaDaMonica from "@/assets/publishers/turma-da-monica.png";
import junjiIto from "@/assets/publishers/junji-ito.png";
import homemAranhaAbril from "@/assets/publishers/homem-aranha-abril.png";
import hulkAbril from "@/assets/publishers/hulk-abril.png";
import almanaqueDisney from "@/assets/publishers/almanaque-disney.png";
import magicoVento from "@/assets/publishers/magico-vento.png";
import trapalhoes from "@/assets/publishers/trapalhoes.png";
import bone from "@/assets/publishers/bone.png";
import asterix from "@/assets/publishers/asterix.png";
import tintin from "@/assets/publishers/tintin.png";
import chaves from "@/assets/publishers/chaves.png";
import classicos from "@/assets/publishers/classicos.png";

export type PublisherTheme = {
  /** HSL principal da marca, sem o wrapper hsl(). Ex: "0 84% 50%" */
  color: string;
  /** Segunda cor, usada para gradiente. */
  colorAlt: string;
  /** Cor do texto sobre `color`. */
  foreground: string;
  /** Font-family stack do nome da editora. */
  fontFamily: string;
  /** Tracking opcional. */
  letterSpacing?: string;
  /** Mini logo opcional. */
  logo?: string;
  /** Tamanho da fonte custom (sobrepõe text-xs). */
  fontSize?: string;
};

const THEMES: Record<string, PublisherTheme> = {
  // Marvel — vermelho oficial #ED1D24 + preto-azulado profundo
  marvel: {
    color: "357 84% 52%",
    colorAlt: "230 40% 12%",
    foreground: "0 0% 100%",
    fontFamily: '"Bowlby One", "Anton", Impact, sans-serif',
    logo: marvel,
    letterSpacing: "0.08em",
    fontSize: "0.78rem",
  },
  // DC — azul DC #0476F2 + dourado de logos clássicos
  dc: {
    color: "214 95% 48%",
    colorAlt: "45 90% 50%",
    foreground: "0 0% 100%",
    fontFamily: '"Russo One", "Anton", Impact, sans-serif',
    logo: dc,
    letterSpacing: "0.1em",
    fontSize: "0.78rem",
  },
  // Shueisha / Shonen Jump — vermelho-laranja Jump + branco-gelo
  shueisha: {
    color: "8 92% 52%",
    colorAlt: "0 0% 96%",
    foreground: "0 0% 100%",
    fontFamily: '"Reggae One", "RocknRoll One", "Bungee", Impact, sans-serif',
    logo: shueisha,
    letterSpacing: "0.05em",
    fontSize: "0.82rem",
  },
  // Vertigo — bordô-sangue + roxo-meia-noite (vibe horror/maduro)
  vertigo: {
    color: "345 75% 38%",
    colorAlt: "270 50% 18%",
    foreground: "0 0% 100%",
    fontFamily: '"Creepster", "Bangers", Impact, sans-serif',
    logo: vertigo,
    letterSpacing: "0.06em",
    fontSize: "0.95rem",
  },
  // Image Comics — preto-aço + cinza-prata (logo "I" preto sobre cinza)
  "image comics": {
    color: "0 0% 12%",
    colorAlt: "210 12% 65%",
    foreground: "0 0% 100%",
    fontFamily: '"Bungee", Impact, sans-serif',
    logo: image,
    letterSpacing: "0.05em",
    fontSize: "0.75rem",
  },
  // Dark Horse — laranja-âmbar + marrom-cavalo
  "dark horse comics": {
    color: "30 95% 55%",
    colorAlt: "20 70% 22%",
    foreground: "0 0% 100%",
    fontFamily: '"Black Ops One", "Anton", Impact, sans-serif',
    logo: darkHorse,
    letterSpacing: "0.06em",
    fontSize: "0.78rem",
  },
  // IDW — prata + grafite escuro
  idw: {
    color: "210 8% 70%",
    colorAlt: "210 10% 22%",
    foreground: "0 0% 100%",
    fontFamily: '"Anton", Impact, sans-serif',
    logo: idw,
    letterSpacing: "0.12em",
    fontSize: "0.85rem",
  },
  // Disney — azul-castelo + magenta Mickey
  disney: {
    color: "215 85% 38%",
    colorAlt: "320 75% 50%",
    foreground: "0 0% 100%",
    fontFamily: '"Permanent Marker", "Bangers", cursive',
    logo: disney,
    letterSpacing: "0.04em",
    fontSize: "0.85rem",
  },
  // Panini — vermelho Panini #E4002B + amarelo do logo
  panini: {
    color: "350 95% 45%",
    colorAlt: "48 100% 50%",
    foreground: "0 0% 100%",
    fontFamily: '"Bungee", Impact, sans-serif',
    logo: panini,
    letterSpacing: "0.06em",
    fontSize: "0.75rem",
  },
  // MAD Magazine — amarelo MAD + vermelho-stamp
  mad: {
    color: "50 100% 55%",
    colorAlt: "355 80% 45%",
    foreground: "0 0% 8%",
    fontFamily: '"Bungee", Impact, sans-serif',
    logo: mad,
    letterSpacing: "0.08em",
    fontSize: "0.78rem",
  },
  // Sergio Bonelli — vermelho-tijolo italiano + creme jornal
  "sergio bonelli": {
    color: "5 70% 45%",
    colorAlt: "35 35% 75%",
    foreground: "0 0% 100%",
    fontFamily: '"Anton", Impact, sans-serif',
    logo: bonelli,
    letterSpacing: "0.1em",
    fontSize: "0.78rem",
  },
  // BOOM! Studios — amarelo-explosão + laranja-foguete
  "boom! studios": {
    color: "45 100% 52%",
    colorAlt: "20 95% 50%",
    foreground: "0 0% 8%",
    fontFamily: '"Bungee", Impact, sans-serif',
    logo: boom,
    letterSpacing: "0.06em",
    fontSize: "0.78rem",
  },
  // Dynamite — vermelho-chama + dourado-explosão (vibe pulp)
  dynamite: {
    color: "12 90% 50%",
    colorAlt: "42 95% 50%",
    foreground: "0 0% 100%",
    fontFamily: '"Russo One", Impact, sans-serif',
    logo: dynamite,
    letterSpacing: "0.06em",
    fontSize: "0.78rem",
  },
  // Avatar Press — vermelho-sangue + roxo-vinho (horror gráfico)
  "avatar press": {
    color: "355 85% 45%",
    colorAlt: "300 55% 18%",
    foreground: "0 0% 100%",
    fontFamily: '"Creepster", "Bangers", Impact, sans-serif',
    logo: avatarPress,
    letterSpacing: "0.08em",
    fontSize: "0.92rem",
  },
  // Titan Comics — azul-marinho profundo + cinza-aço
  "titan comics": {
    color: "215 65% 28%",
    colorAlt: "210 15% 45%",
    foreground: "0 0% 100%",
    fontFamily: '"Russo One", "Anton", Impact, sans-serif',
    logo: titan,
    letterSpacing: "0.1em",
    fontSize: "0.78rem",
  },
  // Tex — marrom-couro velho + sépia (faroeste clássico)
  tex: {
    color: "25 65% 35%",
    colorAlt: "35 45% 22%",
    foreground: "35 70% 92%",
    fontFamily: '"Rye", "IM Fell English SC", serif',
    logo: tex,
    letterSpacing: "0.08em",
    fontSize: "0.85rem",
  },
  // Zagor — vermelho-Zagor + verde-floresta
  zagor: {
    color: "0 88% 48%",
    colorAlt: "130 60% 22%",
    foreground: "0 0% 100%",
    fontFamily: '"Pirata One", "Black Ops One", Impact, sans-serif',
    logo: zagor,
    letterSpacing: "0.06em",
    fontSize: "0.95rem",
  },
  // Dargaud — azul-marinho francês + dourado clássico
  dargaud: {
    color: "225 70% 25%",
    colorAlt: "42 80% 52%",
    foreground: "0 0% 100%",
    fontFamily: '"Cinzel", "Playfair Display", serif',
    logo: dargaud,
    letterSpacing: "0.12em",
    fontSize: "0.78rem",
  },
  // Soleil — dourado-sol + laranja-pôr-do-sol
  soleil: {
    color: "42 95% 55%",
    colorAlt: "18 90% 48%",
    foreground: "0 0% 8%",
    fontFamily: '"Cinzel", "Playfair Display", serif',
    logo: soleil,
    letterSpacing: "0.1em",
    fontSize: "0.78rem",
  },
  // Star Comics — roxo + violeta (mangá italiano)
  "star comics": {
    color: "285 70% 45%",
    colorAlt: "265 80% 28%",
    foreground: "0 0% 100%",
    fontFamily: '"Bungee", "Russo One", Impact, sans-serif',
    logo: starComics,
    letterSpacing: "0.08em",
    fontSize: "0.78rem",
  },
  // EBAL — verde-garrafa antigo + creme envelhecido (gibi BR clássico)
  ebal: {
    color: "150 55% 25%",
    colorAlt: "40 35% 70%",
    foreground: "0 0% 100%",
    fontFamily: '"IM Fell English SC", "Special Elite", serif',
    logo: ebal,
    letterSpacing: "0.1em",
    fontSize: "0.85rem",
  },
  // Editora Abril — vermelho Abril + cinza-grafite (revistas)
  "editora abril": {
    color: "5 85% 45%",
    colorAlt: "210 8% 22%",
    foreground: "0 0% 100%",
    fontFamily: '"Anton", Impact, sans-serif',
    logo: abril,
    letterSpacing: "0.12em",
    fontSize: "0.82rem",
  },
  // Editora Globo — azul-Globo + verde-esfera (Globo logo)
  "editora globo": {
    color: "210 80% 38%",
    colorAlt: "150 55% 30%",
    foreground: "0 0% 100%",
    fontFamily: '"Russo One", Impact, sans-serif',
    logo: globo,
    letterSpacing: "0.08em",
    fontSize: "0.78rem",
  },
  // Mangás — rosa-shojo + índigo-anime
  "mangás": {
    color: "335 78% 58%",
    colorAlt: "250 60% 30%",
    foreground: "0 0% 100%",
    fontFamily: '"Reggae One", "RocknRoll One", "Bungee", Impact, sans-serif',
    logo: mangas,
    letterSpacing: "0.05em",
    fontSize: "0.82rem",
  },
  // Turma da Mônica — vermelho-Mônica + verde-Cebolinha
  "turma da mônica": {
    color: "358 85% 55%",
    colorAlt: "135 65% 38%",
    foreground: "0 0% 100%",
    fontFamily: '"Fredoka", "Patrick Hand", "Bangers", sans-serif',
    logo: turmaDaMonica,
    letterSpacing: "0.04em",
    fontSize: "0.82rem",
  },
  // Junji Ito — cinza-pesadelo + vermelho-sangue (terror P&B com respingo)
  "junji ito": {
    color: "0 0% 42%",
    colorAlt: "0 75% 30%",
    foreground: "0 0% 100%",
    fontFamily: '"Creepster", "Bangers", Impact, sans-serif',
    logo: junjiIto,
    letterSpacing: "0.08em",
    fontSize: "0.82rem",
  },
  // Homem-Aranha (Abril) — vermelho-aranha + azul-uniforme
  "homem-aranha (abril)": {
    color: "0 88% 50%",
    colorAlt: "220 85% 32%",
    foreground: "0 0% 100%",
    fontFamily: '"Bowlby One", "Anton", Impact, sans-serif',
    logo: homemAranhaAbril,
    letterSpacing: "0.06em",
    fontSize: "0.78rem",
  },
  // Hulk (Abril) — verde-Hulk + roxo-calça-rasgada
  "hulk (abril)": {
    color: "115 65% 32%",
    colorAlt: "275 55% 32%",
    foreground: "0 0% 100%",
    fontFamily: '"Bowlby One", "Anton", Impact, sans-serif',
    logo: hulkAbril,
    letterSpacing: "0.08em",
    fontSize: "0.78rem",
  },
  // Almanaque Disney — amarelo-Pateta + azul-Donald
  "almanaque disney": {
    color: "48 95% 55%",
    colorAlt: "205 80% 42%",
    foreground: "0 0% 10%",
    fontFamily: '"Fredoka", "Patrick Hand", "Bangers", sans-serif',
    logo: almanaqueDisney,
    letterSpacing: "0.04em",
    fontSize: "0.82rem",
  },
  // Mágico Vento — ocre-deserto + turquesa-espírito (faroeste místico)
  "mágico vento": {
    color: "32 75% 45%",
    colorAlt: "180 60% 35%",
    foreground: "0 0% 100%",
    fontFamily: '"Rye", "Anton", Impact, serif',
    logo: magicoVento,
    letterSpacing: "0.06em",
    fontSize: "0.82rem",
  },
  // Os Trapalhões — laranja-circo + azul-palco
  "os trapalhões": {
    color: "22 95% 52%",
    colorAlt: "215 75% 35%",
    foreground: "0 0% 100%",
    fontFamily: '"Fredoka", "Patrick Hand", "Bangers", sans-serif',
    logo: trapalhoes,
    letterSpacing: "0.04em",
    fontSize: "0.82rem",
  },
  // Bone — bege-osso + azul-rio Boneville
  "bone": {
    color: "38 35% 68%",
    colorAlt: "200 65% 38%",
    foreground: "0 0% 12%",
    fontFamily: '"Patrick Hand", "Fredoka", sans-serif',
    logo: bone,
    letterSpacing: "0.04em",
    fontSize: "0.82rem",
  },
  // Astérix — amarelo-poção + verde-floresta gaulesa
  "astérix": {
    color: "48 95% 52%",
    colorAlt: "115 55% 28%",
    foreground: "0 0% 10%",
    fontFamily: '"Fredoka", "Bangers", Impact, sans-serif',
    logo: asterix,
    letterSpacing: "0.05em",
    fontSize: "0.82rem",
  },
  // Tintin — azul-Tintin (cobalto) + bege-clássico
  "tintin": {
    color: "210 90% 42%",
    colorAlt: "38 50% 65%",
    foreground: "0 0% 100%",
    fontFamily: '"Russo One", "Anton", Impact, sans-serif',
    logo: tintin,
    letterSpacing: "0.08em",
    fontSize: "0.78rem",
  },
  // Chaves — marrom-barril + amarelo-listra (camiseta clássica)
  "chaves": {
    color: "25 70% 38%",
    colorAlt: "45 95% 55%",
    foreground: "0 0% 100%",
    fontFamily: '"Fredoka", "Bangers", Impact, sans-serif',
    logo: chaves,
    letterSpacing: "0.04em",
    fontSize: "0.82rem",
  },
  // Clássicos — pergaminho dourado + bordô (livro raro)
  "clássicos": {
    color: "38 75% 48%",
    colorAlt: "350 65% 28%",
    foreground: "45 95% 96%",
    fontFamily: '"Cinzel", "IM Fell English SC", "Playfair Display", serif',
    logo: classicos,
    letterSpacing: "0.18em",
    fontSize: "0.82rem",
  },
};

export function getPublisherTheme(name: string): PublisherTheme {
  const key = name.trim().toLowerCase();
  if (THEMES[key]) return THEMES[key];
  return {
    color: "0 84% 55%",
    colorAlt: "0 90% 40%",
    foreground: "0 0% 100%",
    fontFamily: '"Bangers", Impact, sans-serif',
    letterSpacing: "0.06em",
  };
}
