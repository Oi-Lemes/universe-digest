import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AccessStatus = "active" | "refunded" | "chargeback" | "manual_revoked" | null;

type AuthCtx = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  accessStatus: AccessStatus;
  hasAccess: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>(null);

  useEffect(() => {
    // Listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Whenever session email changes, look up access status
  useEffect(() => {
    const email = session?.user?.email;
    if (!email) {
      setAccessStatus(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("access_grants")
      .select("status")
      .ilike("email", email)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setAccessStatus((data?.status ?? null) as AccessStatus);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.email]);

  const value: AuthCtx = {
    session,
    user: session?.user ?? null,
    loading,
    accessStatus,
    hasAccess: accessStatus === "active",
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
