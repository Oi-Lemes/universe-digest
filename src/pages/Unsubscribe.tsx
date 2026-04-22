import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_KEY } }
        );
        const data = await res.json();
        if (!res.ok) {
          setStatus("invalid");
          return;
        }
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already");
        } else if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "handle-email-unsubscribe",
        { body: { token } }
      );
      if (error) throw error;
      if (data?.success || data?.reason === "already_unsubscribed") {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">
          Cancelar inscrição
        </h1>
        {status === "loading" && (
          <p className="text-muted-foreground">Validando seu link…</p>
        )}
        {status === "valid" && (
          <>
            <p className="text-muted-foreground">
              Tem certeza que deseja cancelar o recebimento de e-mails do Império dos Quadrinhos?
            </p>
            <Button onClick={confirm} disabled={submitting} className="w-full">
              {submitting ? "Processando…" : "Confirmar cancelamento"}
            </Button>
          </>
        )}
        {status === "already" && (
          <p className="text-muted-foreground">
            Você já cancelou a inscrição anteriormente. Não enviaremos mais e-mails.
          </p>
        )}
        {status === "success" && (
          <p className="text-muted-foreground">
            Pronto! Sua inscrição foi cancelada. Você não receberá mais e-mails desta lista.
          </p>
        )}
        {status === "invalid" && (
          <p className="text-muted-foreground">
            Link inválido ou expirado.
          </p>
        )}
        {status === "error" && (
          <p className="text-destructive">
            Não foi possível processar agora. Tente novamente em instantes.
          </p>
        )}
      </Card>
    </main>
  );
}
