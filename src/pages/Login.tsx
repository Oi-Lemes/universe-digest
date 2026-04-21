import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
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
  const { hasAccess, loading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);

  if (loading) return null;
  if (hasAccess) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setChecking(true);
    const { ok, status } = await signIn(parsed.data);
    setChecking(false);

    if (ok) {
      toast.success("Acesso liberado!");
      return;
    }

    const reason =
      status === "refunded"
        ? "Identificamos um reembolso da sua compra. Acesso removido."
        : status === "chargeback"
        ? "Identificamos um chargeback. Acesso suspenso."
        : status === "manual_revoked"
        ? "Seu acesso foi revogado. Fale com o suporte."
        : "Este email não consta na nossa lista de compradores.";
    toast.error(reason);
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
              disabled={checking}
              className="w-full h-11 bg-cta shadow-cta font-bold uppercase tracking-wide"
            >
              {checking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Entrar"
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Use o mesmo email que você usou na compra.
            </p>
          </form>
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
