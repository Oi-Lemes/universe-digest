import { TabsTrigger } from "@/components/ui/tabs";
import { getPublisherTheme } from "@/lib/publisher-theme";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type Props = {
  id: string;
  name: string;
};

/**
 * Tab trigger themed per publisher: applies brand color (when active),
 * brand font-family, and an optional mini logo.
 */
export const PublisherTab = ({ id, name }: Props) => {
  const theme = getPublisherTheme(name);
  const style: CSSProperties = {
    // CSS variables consumed by the inline classes below
    ["--pub-color" as string]: theme.color,
    ["--pub-fg" as string]: theme.foreground,
    fontFamily: theme.fontFamily,
    letterSpacing: theme.letterSpacing,
  };

  return (
    <TabsTrigger
      value={id}
      style={style}
      className={cn(
        "rounded-md text-xs font-bold uppercase tracking-wide gap-1.5 px-3",
        "border border-transparent transition-all",
        // Inactive: subtle hint of brand color on the bottom border + text
        "hover:border-[hsl(var(--pub-color)/0.5)]",
        // Active: full brand background
        "data-[state=active]:bg-[hsl(var(--pub-color))]",
        "data-[state=active]:text-[hsl(var(--pub-fg))]",
        "data-[state=active]:shadow-[0_6px_18px_-6px_hsl(var(--pub-color)/0.7)]",
        "data-[state=active]:border-[hsl(var(--pub-color))]"
      )}
    >
      {theme.logo && (
        <img
          src={theme.logo}
          alt=""
          aria-hidden
          loading="lazy"
          width={20}
          height={20}
          className="w-5 h-5 object-contain shrink-0"
        />
      )}
      <span>{name}</span>
    </TabsTrigger>
  );
};

export default PublisherTab;
