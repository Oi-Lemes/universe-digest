import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type AccessStatus = "active" | "refunded" | "chargeback" | "manual_revoked" | null;

type AuthCtx = {
  email: string | null;
  loading: boolean;
  accessStatus: AccessStatus;
  hasAccess: boolean;
  signIn: (email: string) => Promise<{ ok: boolean; status: AccessStatus; error?: string }>;
  signOut: () => void;
};

const STORAGE_KEY = "iq_email";

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>(null);
  const [loading, setLoading] = useState(true);

  // Check access for a given email (returns status)
  const checkAccess = useCallback(async (e: string): Promise<AccessStatus> => {
    const { data } = await supabase
      .from("access_grants")
      .select("status")
      .ilike("email", e)
      .maybeSingle();
    return (data?.status ?? null) as AccessStatus;
  }, []);

  // Load saved email on mount and re-validate
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setLoading(false);
      return;
    }
    setEmail(saved);
    checkAccess(saved).then((status) => {
      setAccessStatus(status);
      setLoading(false);
    });
  }, [checkAccess]);

  const signIn = useCallback(
    async (e: string) => {
      const status = await checkAccess(e);
      if (status === "active") {
        localStorage.setItem(STORAGE_KEY, e);
        setEmail(e);
        setAccessStatus(status);
        return { ok: true, status };
      }
      return { ok: false, status };
    },
    [checkAccess],
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setEmail(null);
    setAccessStatus(null);
  }, []);

  const value: AuthCtx = {
    email,
    loading,
    accessStatus,
    hasAccess: accessStatus === "active",
    signIn,
    signOut,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
