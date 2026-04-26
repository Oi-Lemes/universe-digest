import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Realtime presence indicator: shows how many people are currently in the app
 * with a subtle pulsing green dot. Uses Supabase Realtime Presence.
 */
export const OnlinePresence = () => {
  const { email } = useAuth();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!email) return;

    const channel = supabase.channel("online-users", {
      config: { presence: { key: email } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        // count distinct keys (one per email)
        setCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [email]);

  if (count <= 0) return null;

  return (
    <div
      className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground px-2 py-1 rounded-full border border-border/60 bg-background/60"
      title={`${count} ${count === 1 ? "pessoa online agora" : "pessoas online agora"}`}
      aria-label={`${count} pessoas online agora`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70 animate-ping" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="tabular-nums font-medium">
        {count} <span className="hidden md:inline">online</span>
      </span>
    </div>
  );
};
