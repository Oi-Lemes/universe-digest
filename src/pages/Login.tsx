import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import logo from "@/assets/logo-spiderman-new.png";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Email inválido" })
  .max(255);

const Login = () => {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Link de acesso enviado para o seu email!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 bg-hero opacity-60 pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="Império dos Quadrinhos" className="w-16 h-16 mb-3" />
            <h1 className="font-comic text-3xl text-center">
              Império dos <span className="text-accent">Quadrinhos</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Acesse o seu acervo com seu email de compra
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-3 py-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Mail className="w-6 h-6 text-accent" />
              </div>
              <h2 className="font-semibold text-lg">Confira seu email</h2>
              <p className="text-sm text-muted-foreground">
                Enviamos um link de acesso para <strong>{email}</strong>. Abra o link
                para entrar no app.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
              >
                Usar outro email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email da compra</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                disabled={sending}
                className="w-full h-11 bg-cta shadow-cta font-bold uppercase tracking-wide"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Receber link de acesso"
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Use o mesmo email que você usou na compra. Sem senha — apenas um
                link mágico no seu email.
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Ainda não tem acesso?{" "}
          <a
            href="https://www.imperiodosquadrinhos.site"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Comprar agora
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
