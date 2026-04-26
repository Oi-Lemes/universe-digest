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
  marvel: {
    color: "0 90% 48%",
    colorAlt: "0 95% 38%",
    foreground: "0 0% 100%",
    fontFamily: '"Bowlby One", "Anton", Impact, sans-serif',
    logo: marvel,
    letterSpacing: "0.08em",
    fontSize: "0.78rem",
  },
  dc: {
    color: "214 95% 45%",
    colorAlt: "220 90% 30%",
    foreground: "0 0% 100%",
    fontFamily: '"Russo One", "Anton", Impact, sans-serif',
    logo: dc,
    letterSpacing: "0.1em",
    fontSize: "0.78rem",
  },
  shueisha: {
    color: "0 88% 50%",
    colorAlt: "0 0% 8%",
    foreground: "0 0% 100%",
    fontFamily: '"Reggae One", "RocknRoll One", "Bungee", Impact, sans-serif',
    logo: shueisha,
    letterSpacing: "0.05em",
    fontSize: "0.82rem",
  },
  vertigo: {
    color: "350 85% 45%",
    colorAlt: "0 0% 5%",
    foreground: "0 0% 100%",
    fontFamily: '"Creepster", "Bangers", Impact, sans-serif',
    logo: vertigo,
    letterSpacing: "0.06em",
    fontSize: "0.95rem",
  },
  "image comics": {
    color: "0 0% 8%",
    colorAlt: "0 0% 25%",
    foreground: "0 0% 100%",
    fontFamily: '"Bungee", Impact, sans-serif',
    logo: image,
    letterSpacing: "0.05em",
    fontSize: "0.75rem",
  },
  "dark horse comics": {
    color: "30 75% 45%",
    colorAlt: "20 80% 25%",
    foreground: "0 0% 100%",
    fontFamily: '"Black Ops One", "Anton", Impact, sans-serif',
    logo: darkHorse,
    letterSpacing: "0.06em",
    fontSize: "0.78rem",
  },
  idw: {
    color: "0 0% 12%",
    colorAlt: "0 0% 30%",
    foreground: "0 0% 100%",
    fontFamily: '"Anton", Impact, sans-serif',
    logo: idw,
    letterSpacing: "0.12em",
    fontSize: "0.85rem",
  },
  disney: {
    color: "215 85% 35%",
    colorAlt: "260 70% 45%",
    foreground: "0 0% 100%",
    fontFamily: '"Permanent Marker", "Bangers", cursive',
    logo: disney,
    letterSpacing: "0.04em",
    fontSize: "0.85rem",
  },
  panini: {
    color: "0 88% 48%",
    colorAlt: "10 90% 35%",
    foreground: "0 0% 100%",
    fontFamily: '"Bungee", Impact, sans-serif',
    logo: panini,
    letterSpacing: "0.06em",
    fontSize: "0.75rem",
  },
  mad: {
    color: "48 100% 55%",
    colorAlt: "38 100% 48%",
    foreground: "0 0% 8%",
    fontFamily: '"Bungee", Impact, sans-serif',
    logo: mad,
    letterSpacing: "0.08em",
    fontSize: "0.78rem",
  },
  "sergio bonelli": {
    color: "0 0% 8%",
    colorAlt: "0 70% 35%",
    foreground: "0 0% 100%",
    fontFamily: '"Anton", Impact, sans-serif',
    logo: bonelli,
    letterSpacing: "0.1em",
    fontSize: "0.78rem",
  },
  "boom! studios": {
    color: "48 100% 50%",
    colorAlt: "38 100% 42%",
    foreground: "0 0% 8%",
    fontFamily: '"Bungee", Impact, sans-serif',
    logo: boom,
    letterSpacing: "0.06em",
    fontSize: "0.78rem",
  },
  dynamite: {
    color: "0 85% 45%",
    colorAlt: "10 90% 30%",
    foreground: "0 0% 100%",
    fontFamily: '"Russo One", Impact, sans-serif',
    logo: dynamite,
    letterSpacing: "0.06em",
    fontSize: "0.78rem",
  },
  "avatar press": {
    color: "0 0% 8%",
    colorAlt: "0 80% 35%",
    foreground: "0 0% 100%",
    fontFamily: '"Creepster", "Bangers", Impact, sans-serif',
    logo: avatarPress,
    letterSpacing: "0.08em",
    fontSize: "0.92rem",
  },
  "titan comics": {
    color: "220 80% 40%",
    colorAlt: "220 90% 25%",
    foreground: "0 0% 100%",
    fontFamily: '"Russo One", "Anton", Impact, sans-serif',
    logo: titan,
    letterSpacing: "0.1em",
    fontSize: "0.78rem",
  },
  tex: {
    color: "25 70% 38%",
    colorAlt: "20 80% 22%",
    foreground: "0 0% 100%",
    fontFamily: '"Rye", "IM Fell English SC", serif',
    logo: tex,
    letterSpacing: "0.08em",
    fontSize: "0.85rem",
  },
  zagor: {
    color: "0 88% 45%",
    colorAlt: "0 0% 8%",
    foreground: "0 0% 100%",
    fontFamily: '"Pirata One", "Black Ops One", Impact, sans-serif',
    logo: zagor,
    letterSpacing: "0.06em",
    fontSize: "0.95rem",
  },
  dargaud: {
    color: "220 80% 28%",
    colorAlt: "220 70% 18%",
    foreground: "0 0% 100%",
    fontFamily: '"Cinzel", "Playfair Display", serif',
    logo: dargaud,
    letterSpacing: "0.12em",
    fontSize: "0.78rem",
  },
  soleil: {
    color: "42 95% 50%",
    colorAlt: "30 95% 42%",
    foreground: "0 0% 8%",
    fontFamily: '"Cinzel", "Playfair Display", serif',
    logo: soleil,
    letterSpacing: "0.1em",
    fontSize: "0.78rem",
  },
  "star comics": {
    color: "285 70% 42%",
    colorAlt: "275 80% 28%",
    foreground: "0 0% 100%",
    fontFamily: '"Bungee", "Russo One", Impact, sans-serif',
    logo: starComics,
    letterSpacing: "0.08em",
    fontSize: "0.78rem",
  },
  ebal: {
    color: "140 65% 28%",
    colorAlt: "140 70% 18%",
    foreground: "0 0% 100%",
    fontFamily: '"IM Fell English SC", "Special Elite", serif',
    logo: ebal,
    letterSpacing: "0.1em",
    fontSize: "0.85rem",
  },
  "editora abril": {
    color: "0 88% 48%",
    colorAlt: "0 90% 35%",
    foreground: "0 0% 100%",
    fontFamily: '"Anton", Impact, sans-serif',
    logo: abril,
    letterSpacing: "0.12em",
    fontSize: "0.82rem",
  },
  "editora globo": {
    color: "220 75% 32%",
    colorAlt: "220 80% 20%",
    foreground: "0 0% 100%",
    fontFamily: '"Russo One", Impact, sans-serif',
    logo: globo,
    letterSpacing: "0.08em",
    fontSize: "0.78rem",
  },
  "mangás": {
    color: "0 0% 8%",
    colorAlt: "0 85% 45%",
    foreground: "0 0% 100%",
    fontFamily: '"Reggae One", "RocknRoll One", "Bungee", Impact, sans-serif',
    logo: mangas,
    letterSpacing: "0.05em",
    fontSize: "0.82rem",
  },
  "turma da mônica": {
    color: "0 85% 52%",
    colorAlt: "48 100% 55%",
    foreground: "0 0% 100%",
    fontFamily: '"Fredoka", "Patrick Hand", "Bangers", sans-serif',
    logo: turmaDaMonica,
    letterSpacing: "0.04em",
    fontSize: "0.82rem",
  },
  "junji ito": {
    color: "0 0% 6%",
    colorAlt: "0 85% 35%",
    foreground: "0 0% 100%",
    fontFamily: '"Creepster", "Bangers", Impact, sans-serif',
    logo: junjiIto,
    letterSpacing: "0.08em",
    fontSize: "0.82rem",
  },
  "homem-aranha (abril)": {
    color: "0 90% 48%",
    colorAlt: "214 95% 38%",
    foreground: "0 0% 100%",
    fontFamily: '"Bowlby One", "Anton", Impact, sans-serif',
    logo: homemAranhaAbril,
    letterSpacing: "0.06em",
    fontSize: "0.78rem",
  },
  "hulk (abril)": {
    color: "120 70% 32%",
    colorAlt: "120 80% 18%",
    foreground: "0 0% 100%",
    fontFamily: '"Bowlby One", "Anton", Impact, sans-serif',
    logo: hulkAbril,
    letterSpacing: "0.08em",
    fontSize: "0.78rem",
  },
  "almanaque disney": {
    color: "0 85% 50%",
    colorAlt: "48 100% 50%",
    foreground: "0 0% 100%",
    fontFamily: '"Fredoka", "Patrick Hand", "Bangers", sans-serif',
    logo: almanaqueDisney,
    letterSpacing: "0.04em",
    fontSize: "0.82rem",
  },
  "mágico vento": {
    color: "28 75% 38%",
    colorAlt: "190 70% 40%",
    foreground: "0 0% 100%",
    fontFamily: '"Rye", "Anton", Impact, serif',
    logo: magicoVento,
    letterSpacing: "0.06em",
    fontSize: "0.82rem",
  },
  "os trapalhões": {
    color: "48 100% 50%",
    colorAlt: "0 85% 50%",
    foreground: "0 0% 10%",
    fontFamily: '"Fredoka", "Patrick Hand", "Bangers", sans-serif',
    logo: trapalhoes,
    letterSpacing: "0.04em",
    fontSize: "0.82rem",
  },
  "bone": {
    color: "0 0% 18%",
    colorAlt: "200 60% 50%",
    foreground: "0 0% 100%",
    fontFamily: '"Patrick Hand", "Fredoka", sans-serif',
    logo: bone,
    letterSpacing: "0.04em",
    fontSize: "0.82rem",
  },
  "astérix": {
    color: "0 85% 50%",
    colorAlt: "48 100% 45%",
    foreground: "0 0% 100%",
    fontFamily: '"Fredoka", "Bangers", Impact, sans-serif',
    logo: asterix,
    letterSpacing: "0.05em",
    fontSize: "0.82rem",
  },
  "tintin": {
    color: "214 90% 45%",
    colorAlt: "0 85% 50%",
    foreground: "0 0% 100%",
    fontFamily: '"Russo One", "Anton", Impact, sans-serif',
    logo: tintin,
    letterSpacing: "0.08em",
    fontSize: "0.78rem",
  },
  "chaves": {
    color: "28 80% 45%",
    colorAlt: "48 100% 50%",
    foreground: "0 0% 100%",
    fontFamily: '"Fredoka", "Bangers", Impact, sans-serif',
    logo: chaves,
    letterSpacing: "0.04em",
    fontSize: "0.82rem",
  },
  "clássicos": {
    // Pergaminho dourado + bordô — vibe livro raro / colecionador
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
