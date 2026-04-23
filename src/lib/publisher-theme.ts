// Tema visual por editora: cor de destaque, fonte e mini logo.
// As cores são tokens HSL (sem `hsl(...)`) para combinarem com o design system.

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

export type PublisherTheme = {
  /** HSL components without `hsl()` wrapper, e.g. "0 84% 50%" */
  color: string;
  /** Foreground used on top of `color`. */
  foreground: string;
  /** Tailwind/Inline font-family stack used in the tab label. */
  fontFamily: string;
  /** Optional small logo. */
  logo?: string;
  /** Optional letter spacing tweak. */
  letterSpacing?: string;
};

const THEMES: Record<string, PublisherTheme> = {
  marvel: {
    color: "0 84% 50%",
    foreground: "0 0% 100%",
    fontFamily: '"Bowlby One", "Anton", Impact, sans-serif',
    logo: marvel,
    letterSpacing: "0.06em",
  },
  dc: {
    color: "214 90% 48%",
    foreground: "0 0% 100%",
    fontFamily: '"Russo One", "Anton", Impact, sans-serif',
    logo: dc,
    letterSpacing: "0.08em",
  },
  vertigo: {
    color: "0 0% 8%",
    foreground: "0 84% 60%",
    fontFamily: '"Creepster", "Bangers", Impact, sans-serif',
    logo: vertigo,
    letterSpacing: "0.05em",
  },
  "image comics": {
    color: "0 0% 5%",
    foreground: "0 0% 100%",
    fontFamily: '"Bungee", Impact, sans-serif',
    logo: image,
    letterSpacing: "0.04em",
  },
  "dark horse comics": {
    color: "0 0% 10%",
    foreground: "0 0% 95%",
    fontFamily: '"Black Ops One", "Anton", Impact, sans-serif',
    logo: darkHorse,
    letterSpacing: "0.05em",
  },
  idw: {
    color: "0 0% 12%",
    foreground: "0 0% 100%",
    fontFamily: '"Anton", Impact, sans-serif',
    logo: idw,
    letterSpacing: "0.08em",
  },
  disney: {
    color: "224 70% 30%",
    foreground: "0 0% 100%",
    fontFamily: '"Permanent Marker", "Bangers", cursive',
    logo: disney,
    letterSpacing: "0.04em",
  },
  panini: {
    color: "0 84% 50%",
    foreground: "0 0% 100%",
    fontFamily: '"Bungee", Impact, sans-serif',
    logo: panini,
    letterSpacing: "0.05em",
  },
  mad: {
    color: "48 100% 55%",
    foreground: "0 0% 8%",
    fontFamily: '"Bungee", Impact, sans-serif',
    logo: mad,
    letterSpacing: "0.06em",
  },
  "sergio bonelli": {
    color: "0 0% 8%",
    foreground: "0 0% 98%",
    fontFamily: '"Anton", Impact, sans-serif',
    logo: bonelli,
    letterSpacing: "0.07em",
  },
  "boom! studios": {
    color: "48 100% 50%",
    foreground: "0 0% 8%",
    fontFamily: '"Bungee", Impact, sans-serif',
    logo: boom,
    letterSpacing: "0.05em",
  },
  dynamite: {
    color: "0 80% 45%",
    foreground: "0 0% 100%",
    fontFamily: '"Russo One", Impact, sans-serif',
    logo: dynamite,
    letterSpacing: "0.05em",
  },
  // Demais editoras herdam tema padrão.
};

export function getPublisherTheme(name: string): PublisherTheme {
  const key = name.trim().toLowerCase();
  if (THEMES[key]) return THEMES[key];
  return {
    color: "0 84% 55%",
    foreground: "0 0% 100%",
    fontFamily: '"Bangers", Impact, sans-serif',
    letterSpacing: "0.05em",
  };
}
