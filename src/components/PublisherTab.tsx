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
  const lname = name.trim().toLowerCase();
  const isClassicos = lname === "clássicos";
  const isCultura = lname === "cultura & biografias";
  const isTerror = lname === "terror";
  const isPlus18 = lname === "+18";
  const isStarWars = lname === "star wars";
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
        ],
        // Destaque especial "Cultura & Biografias": couro de biblioteca esmeralda + filete dourado
        isCultura && [
          "!bg-[radial-gradient(ellipse_at_top,hsl(150_45%_30%)_0%,hsl(155_55%_22%)_55%,hsl(30_45%_22%)_100%)]",
          "!text-[hsl(45_85%_88%)]",
          "!border-[hsl(42_75%_55%)]",
          "shadow-[0_4px_14px_-4px_hsl(155_60%_18%/0.7),inset_0_1px_0_hsl(45_80%_70%/0.35)]",
          "ring-1 ring-[hsl(42_75%_55%/0.55)]",
          "[text-shadow:0_1px_2px_hsl(0_0%_0%/0.6)]",
          "hover:!bg-[radial-gradient(ellipse_at_top,hsl(150_55%_38%)_0%,hsl(155_60%_28%)_55%,hsl(30_55%_28%)_100%)]",
          "data-[state=active]:!bg-[radial-gradient(ellipse_at_center,hsl(150_55%_42%)_0%,hsl(155_65%_28%)_60%,hsl(30_55%_22%)_100%)]",
          "data-[state=active]:!text-[hsl(45_95%_94%)]",
          "data-[state=active]:!border-[hsl(42_85%_62%)]",
          "data-[state=active]:shadow-[0_10px_28px_-6px_hsl(155_70%_18%/0.9),inset_0_1px_0_hsl(45_85%_70%/0.45)]",
        ],
        // Destaque especial "Terror": sangue + cripta + filete carmesim
        isTerror && [
          "!bg-[radial-gradient(ellipse_at_top,hsl(0_70%_28%)_0%,hsl(0_80%_14%)_55%,hsl(0_0%_4%)_100%)]",
          "!text-[hsl(0_85%_94%)]",
          "!border-[hsl(0_85%_45%)]",
          "shadow-[0_4px_14px_-4px_hsl(0_85%_25%/0.75),inset_0_1px_0_hsl(0_70%_60%/0.25)]",
          "ring-1 ring-[hsl(0_85%_40%/0.55)]",
          "[text-shadow:0_1px_2px_hsl(0_0%_0%/0.85)]",
          "hover:!bg-[radial-gradient(ellipse_at_top,hsl(0_75%_36%)_0%,hsl(0_85%_18%)_55%,hsl(0_0%_6%)_100%)]",
          "data-[state=active]:!bg-[radial-gradient(ellipse_at_center,hsl(0_85%_42%)_0%,hsl(0_85%_22%)_60%,hsl(0_0%_4%)_100%)]",
          "data-[state=active]:!text-[hsl(0_90%_96%)]",
          "data-[state=active]:!border-[hsl(0_90%_55%)]",
          "data-[state=active]:shadow-[0_10px_28px_-6px_hsl(0_90%_30%/0.95),inset_0_1px_0_hsl(0_70%_60%/0.35)]",
        ],
        // Destaque especial "+18": preto absoluto + alerta vermelho pulsante
        isPlus18 && [
          "!bg-[radial-gradient(ellipse_at_center,hsl(0_85%_28%)_0%,hsl(0_0%_6%)_55%,hsl(0_0%_0%)_100%)]",
          "!text-[hsl(0_0%_100%)]",
          "!border-[hsl(0_92%_50%)]",
          "shadow-[0_4px_14px_-4px_hsl(0_92%_45%/0.85),inset_0_1px_0_hsl(0_85%_60%/0.3)]",
          "ring-1 ring-[hsl(0_92%_50%/0.6)]",
          "[text-shadow:0_1px_2px_hsl(0_0%_0%/0.95)]",
          "hover:!bg-[radial-gradient(ellipse_at_center,hsl(0_90%_36%)_0%,hsl(0_0%_8%)_55%,hsl(0_0%_0%)_100%)]",
          "data-[state=active]:!bg-[radial-gradient(ellipse_at_center,hsl(0_92%_42%)_0%,hsl(0_0%_6%)_60%,hsl(0_0%_0%)_100%)]",
          "data-[state=active]:!text-[hsl(0_0%_100%)]",
          "data-[state=active]:!border-[hsl(0_95%_58%)]",
          "data-[state=active]:shadow-[0_10px_28px_-6px_hsl(0_95%_45%/0.95),inset_0_1px_0_hsl(0_85%_60%/0.4)]",
        ]
      )}
    >
      {theme.logo && (
        <span
          className={cn(
            "inline-flex items-center justify-center w-7 h-7 rounded-md shrink-0 overflow-hidden",
            isClassicos
              ? "bg-[hsl(45_60%_15%)] ring-1 ring-[hsl(48_100%_70%/0.6)] shadow-inner"
              : isCultura
              ? "bg-[hsl(45_70%_92%)] ring-1 ring-[hsl(42_75%_55%/0.7)] shadow-inner"
              : isTerror
              ? "bg-[hsl(0_0%_8%)] ring-1 ring-[hsl(0_85%_45%/0.7)] shadow-inner"
              : isPlus18
              ? "bg-[hsl(0_0%_0%)] ring-1 ring-[hsl(0_92%_50%/0.8)] shadow-inner"
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
