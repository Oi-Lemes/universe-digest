import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type AccessStatus = "active" | "refunded" | "chargeback" | "manual_revoked" | null;

type AuthCtx = {
  email: string | null;
  loading: boolean;
  accessStatus: AccessStatus;
  hasAccess: boolean;
  isTrial: boolean;
  trialExpiresAt: number | null;
  signIn: (email: string) => Promise<{ ok: boolean; status: AccessStatus; error?: string }>;
  signInTrial: () => void;
  signOut: () => void;
};

const STORAGE_KEY = "iq_email";
const TRIAL_KEY = "iq_trial_expires";
const TRIAL_DURATION_MS = 3 * 60 * 1000; // 3 minutes

const Ctx = createContext<AuthCtx | null>(null);

const randomTrialEmail = () => {
  const n = Math.random().toString(36).slice(2, 10);
  return `trial_${n}@demo.imperio`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>(null);
  const [loading, setLoading] = useState(true);
  const [trialExpiresAt, setTrialExpiresAt] = useState<number | null>(null);
  const trialTimer = useRef<number | null>(null);

  const checkAccess = useCallback(async (e: string): Promise<AccessStatus> => {
    const { data } = await supabase
      .from("access_grants")
      .select("status")
      .ilike("email", e)
      .maybeSingle();
    return (data?.status ?? null) as AccessStatus;
  }, []);

  const signOut = useCallback(() => {
    if (trialTimer.current) {
      window.clearTimeout(trialTimer.current);
      trialTimer.current = null;
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TRIAL_KEY);
    setEmail(null);
    setAccessStatus(null);
    setTrialExpiresAt(null);
  }, []);

  const scheduleTrialExpiry = useCallback(
    (expiresAt: number) => {
      if (trialTimer.current) window.clearTimeout(trialTimer.current);
      const ms = expiresAt - Date.now();
      if (ms <= 0) {
        signOut();
        return;
      }
      trialTimer.current = window.setTimeout(() => {
        signOut();
      }, ms);
    },
    [signOut],
  );

  // Load saved session on mount
  useEffect(() => {
    const trialRaw = localStorage.getItem(TRIAL_KEY);
    if (trialRaw) {
      const exp = Number(trialRaw);
      if (Number.isFinite(exp) && exp > Date.now()) {
        const savedEmail = localStorage.getItem(STORAGE_KEY) ?? randomTrialEmail();
        setEmail(savedEmail);
        setAccessStatus("active");
        setTrialExpiresAt(exp);
        scheduleTrialExpiry(exp);
        setLoading(false);
        return;
      }
      // expired
      localStorage.removeItem(TRIAL_KEY);
      localStorage.removeItem(STORAGE_KEY);
    }

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
  }, [checkAccess, scheduleTrialExpiry]);

  const signIn = useCallback(
    async (e: string) => {
      const status = await checkAccess(e);
      if (status === "active") {
        localStorage.setItem(STORAGE_KEY, e);
        localStorage.removeItem(TRIAL_KEY);
        setEmail(e);
        setAccessStatus(status);
        setTrialExpiresAt(null);
        return { ok: true, status };
      }
      return { ok: false, status };
    },
    [checkAccess],
  );

  const signInTrial = useCallback(() => {
    const e = randomTrialEmail();
    const exp = Date.now() + TRIAL_DURATION_MS;
    localStorage.setItem(STORAGE_KEY, e);
    localStorage.setItem(TRIAL_KEY, String(exp));
    setEmail(e);
    setAccessStatus("active");
    setTrialExpiresAt(exp);
    scheduleTrialExpiry(exp);
  }, [scheduleTrialExpiry]);

  const isTrial = trialExpiresAt !== null;

  const value: AuthCtx = {
    email,
    loading,
    accessStatus,
    hasAccess: accessStatus === "active",
    isTrial,
    trialExpiresAt,
    signIn,
    signInTrial,
    signOut,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
