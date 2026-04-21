import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-spiderman-new.png";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { loading, email, hasAccess, accessStatus, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!email) return <Navigate to="/login" replace />;

  if (!hasAccess) {
    const reason =
      accessStatus === "refunded"
        ? "Identificamos um reembolso da sua compra. Por isso o acesso foi removido."
        : accessStatus === "chargeback"
        ? "Identificamos um chargeback ligado à sua compra. Acesso suspenso."
        : accessStatus === "manual_revoked"
        ? "Seu acesso foi revogado manualmente. Fale com o suporte."
        : "O email com o qual você entrou não consta na nossa lista de compradores.";

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-card">
          <img src={logo} alt="" className="w-14 h-14 mx-auto mb-4" />
          <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-destructive" />
          <h1 className="font-comic text-2xl mb-2">Acesso não liberado</h1>
          <p className="text-sm text-muted-foreground mb-1">
            <strong>{email}</strong>
          </p>
          <p className="text-sm text-muted-foreground mb-6">{reason}</p>
          <div className="space-y-2">
            <Button
              asChild
              className="w-full bg-cta shadow-cta font-bold uppercase"
            >
              <a
                href="https://www.imperiodosquadrinhos.site"
                target="_blank"
                rel="noreferrer"
              >
                Comprar acesso
              </a>
            </Button>
            <Button variant="ghost" onClick={signOut} className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Sair e usar outro email
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
