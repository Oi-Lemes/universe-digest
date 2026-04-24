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
