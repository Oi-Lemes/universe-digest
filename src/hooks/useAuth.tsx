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
  signOut: () => void;
};

const STORAGE_KEY = "iq_email";
const TRIAL_KEY = "iq_trial_expires_v2";
const TRIAL_DEADLINE_KEY = "iq_trial_deadline_v2"; // absolute deadline, survives signOut
const TRIAL_REVOKED_KEY = "iq_trial_revoked_v2";
const TRIAL_EMAIL = "teste123@gmail.com";
const TRIAL_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const isTrialEmail = (e: string) => e.trim().toLowerCase() === TRIAL_EMAIL;

const Ctx = createContext<AuthCtx | null>(null);

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

  const clearTrialTimer = () => {
    if (trialTimer.current) {
      window.clearTimeout(trialTimer.current);
      trialTimer.current = null;
    }
  };

  const signOut = useCallback(() => {
    clearTrialTimer();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TRIAL_KEY);
    setEmail(null);
    setAccessStatus(null);
    setTrialExpiresAt(null);
  }, []);

  const expireTrial = useCallback(() => {
    // Mark trial email as permanently revoked on this device.
    localStorage.setItem(TRIAL_REVOKED_KEY, "1");
    localStorage.removeItem(TRIAL_DEADLINE_KEY);
    signOut();
  }, [signOut]);

  const scheduleTrialExpiry = useCallback(
    (expiresAt: number) => {
      clearTrialTimer();
      const ms = expiresAt - Date.now();
      if (ms <= 0) {
        expireTrial();
        return;
      }
      trialTimer.current = window.setTimeout(() => {
        expireTrial();
      }, ms);
    },
    [expireTrial],
  );

  // Load saved session on mount
  useEffect(() => {
    const trialRaw = localStorage.getItem(TRIAL_KEY);
    if (trialRaw) {
      const exp = Number(trialRaw);
      if (Number.isFinite(exp) && exp > Date.now()) {
        const savedEmail = localStorage.getItem(STORAGE_KEY) ?? TRIAL_EMAIL;
        setEmail(savedEmail);
        setAccessStatus("active");
        setTrialExpiresAt(exp);
        scheduleTrialExpiry(exp);
        setLoading(false);
        return;
      }
      // expired between sessions → revoke
      localStorage.setItem(TRIAL_REVOKED_KEY, "1");
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
      // Special trial email — bypasses the DB. Deadline is absolute and
      // continues counting down even after signOut or closing the app.
      if (isTrialEmail(e)) {
        if (localStorage.getItem(TRIAL_REVOKED_KEY)) {
          return { ok: false, status: "manual_revoked" as AccessStatus };
        }
        let deadline = Number(localStorage.getItem(TRIAL_DEADLINE_KEY) || 0);
        if (!Number.isFinite(deadline) || deadline <= 0) {
          deadline = Date.now() + TRIAL_DURATION_MS;
          localStorage.setItem(TRIAL_DEADLINE_KEY, String(deadline));
        }
        if (deadline <= Date.now()) {
          localStorage.setItem(TRIAL_REVOKED_KEY, "1");
          localStorage.removeItem(TRIAL_DEADLINE_KEY);
          return { ok: false, status: "manual_revoked" as AccessStatus };
        }
        localStorage.setItem(STORAGE_KEY, TRIAL_EMAIL);
        localStorage.setItem(TRIAL_KEY, String(deadline));
        setEmail(TRIAL_EMAIL);
        setAccessStatus("active");
        setTrialExpiresAt(deadline);
        scheduleTrialExpiry(deadline);
        return { ok: true, status: "active" as AccessStatus };
      }

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
    [checkAccess, scheduleTrialExpiry],
  );

  const isTrial = trialExpiresAt !== null;

  const value: AuthCtx = {
    email,
    loading,
    accessStatus,
    hasAccess: accessStatus === "active",
    isTrial,
    trialExpiresAt,
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
