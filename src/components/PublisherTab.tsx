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
  const isClassicos = name.trim().toLowerCase() === "clássicos";
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
        "border-2 transition-all duration-200",
        // Inativo: já com gradiente VIVO da marca (mesmo destaque do Clássicos),
        // só um pouco mais sóbrio que o ativo. Texto contrastante da marca.
        "bg-[linear-gradient(135deg,hsl(var(--pub-color)/0.92),hsl(var(--pub-color-alt)/0.92))]",
        "border-[hsl(var(--pub-color))]",
        "text-[hsl(var(--pub-fg))]",
        "shadow-[0_4px_14px_-4px_hsl(var(--pub-color)/0.55),inset_0_1px_0_hsl(0_0%_100%/0.18)]",
        "[text-shadow:0_1px_2px_hsl(0_0%_0%/0.45)]",
        // Hover: intensifica gradiente + leve elevação
        "hover:bg-[linear-gradient(135deg,hsl(var(--pub-color)),hsl(var(--pub-color-alt)))]",
        "hover:-translate-y-0.5",
        "hover:shadow-[0_6px_18px_-4px_hsl(var(--pub-color)/0.7),inset_0_1px_0_hsl(0_0%_100%/0.25)]",
        // Ativo: gradiente full + glow forte + escala
        "data-[state=active]:bg-[linear-gradient(135deg,hsl(var(--pub-color)),hsl(var(--pub-color-alt)))]",
        "data-[state=active]:text-[hsl(var(--pub-fg))]",
        "data-[state=active]:border-[hsl(var(--pub-color))]",
        "data-[state=active]:shadow-[0_10px_28px_-6px_hsl(var(--pub-color)/0.9),inset_0_1px_0_hsl(0_0%_100%/0.3)]",
        "data-[state=active]:scale-105",
        "data-[state=active]:ring-2 data-[state=active]:ring-[hsl(var(--pub-color)/0.4)]",
        // Destaque especial "Clássicos": pergaminho dourado mesmo inativo
        isClassicos && [
          "!bg-[radial-gradient(ellipse_at_top,hsl(45_85%_88%)_0%,hsl(38_70%_72%)_55%,hsl(28_55%_55%)_100%)]",
          "!text-[hsl(350_75%_22%)]",
          "!border-[hsl(38_75%_42%)]",
          "shadow-[0_4px_14px_-4px_hsl(38_75%_45%/0.55),inset_0_1px_0_hsl(48_100%_92%/0.7)]",
          "ring-1 ring-[hsl(48_100%_88%/0.6)]",
          "[text-shadow:none]",
          "hover:!bg-[radial-gradient(ellipse_at_top,hsl(48_95%_92%)_0%,hsl(40_85%_78%)_55%,hsl(30_70%_58%)_100%)]",
          "data-[state=active]:!bg-[radial-gradient(ellipse_at_center,hsl(45_90%_82%)_0%,hsl(38_80%_60%)_60%,hsl(350_60%_28%)_100%)]",
          "data-[state=active]:!text-[hsl(48_100%_96%)]",
          "data-[state=active]:shadow-[0_10px_28px_-6px_hsl(38_85%_45%/0.85),inset_0_1px_0_hsl(48_100%_92%/0.4)]",
        ]
      )}
    >
      {theme.logo && (
        <span
          className={cn(
            "inline-flex items-center justify-center w-7 h-7 rounded-md shrink-0 overflow-hidden",
            isClassicos
              ? "bg-[hsl(45_60%_15%)] ring-1 ring-[hsl(48_100%_70%/0.6)] shadow-inner"
              : "bg-white ring-1 ring-black/10 shadow-sm"
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
