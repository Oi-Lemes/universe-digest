import { TabsTrigger } from "@/components/ui/tabs";
import { getPublisherTheme } from "@/lib/publisher-theme";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type Props = {
  id: string;
  name: string;
};

/**
 * Tab trigger temático por editora:
 * - Cor + fonte oficial da marca
 * - Gradiente + glow quando ativa
 * - Borda colorida sutil mesmo quando inativa para "trazer vida"
 */
export const PublisherTab = ({ id, name }: Props) => {
  const theme = getPublisherTheme(name);
  const style: CSSProperties = {
    ["--pub-color" as string]: theme.color,
    ["--pub-color-alt" as string]: theme.colorAlt,
    ["--pub-fg" as string]: theme.foreground,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
    fontSize: theme.fontSize,
  };

  return (
    <TabsTrigger
      value={id}
      style={style}
      className={cn(
        "relative rounded-md font-bold uppercase gap-2.5 px-4 py-2.5 whitespace-nowrap",
        "border transition-all duration-200",
        // Inativo: tom da marca esmaecido + texto desbotado
        "border-[hsl(var(--pub-color)/0.35)]",
        "bg-[hsl(var(--pub-color)/0.08)]",
        "text-[hsl(var(--pub-color))]",
        // Hover (inativo): intensifica
        "hover:bg-[hsl(var(--pub-color)/0.18)]",
        "hover:border-[hsl(var(--pub-color)/0.7)]",
        "hover:-translate-y-0.5",
        // Ativo: gradiente da marca + glow + texto contrastante
        "data-[state=active]:bg-[linear-gradient(135deg,hsl(var(--pub-color)),hsl(var(--pub-color-alt)))]",
        "data-[state=active]:text-[hsl(var(--pub-fg))]",
        "data-[state=active]:border-[hsl(var(--pub-color))]",
        "data-[state=active]:shadow-[0_8px_24px_-6px_hsl(var(--pub-color)/0.7),inset_0_1px_0_hsl(0_0%_100%/0.2)]",
        "data-[state=active]:scale-105",
        "data-[state=active]:[text-shadow:0_1px_2px_hsl(0_0%_0%/0.35)]"
      )}
    >
      {theme.logo && (
        <span
          className={cn(
            "inline-flex items-center justify-center w-7 h-7 rounded-md shrink-0 overflow-hidden",
            "bg-white ring-1 ring-black/10 shadow-sm"
          )}
        >
          <img
            src={theme.logo}
            alt=""
            aria-hidden
            loading="lazy"
            width={28}
            height={28}
            className="w-full h-full object-contain p-0.5"
          />
        </span>
      )}
      <span>{name}</span>
    </TabsTrigger>
  );
};

export default PublisherTab;
