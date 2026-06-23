import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { driveFolderUrl } from "@/lib/open-external";

const DRIVE_ID_RE = /^[A-Za-z0-9_-]{10,}$/;

const DriveRedirect = () => {
  const [params] = useSearchParams();
  const id = params.get("id") ?? "";
  const driveUrl = useMemo(() => (DRIVE_ID_RE.test(id) ? driveFolderUrl(id) : null), [id]);

  useEffect(() => {
    if (!driveUrl) return;
    const timeout = window.setTimeout(() => {
      window.location.replace(driveUrl);
    }, 120);
    return () => window.clearTimeout(timeout);
  }, [driveUrl]);

  if (!driveUrl) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <section className="max-w-md text-center space-y-3 rounded-lg border border-border bg-card p-6 shadow-lg">
          <h1 className="text-xl font-bold text-foreground">Link do Drive inválido</h1>
          <p className="text-sm text-muted-foreground">
            Volte ao app e tente abrir a pasta novamente.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <section className="max-w-md text-center space-y-4 rounded-lg border border-border bg-card p-6 shadow-lg">
        <h1 className="text-xl font-bold text-foreground">Abrindo Google Drive…</h1>
        <p className="text-sm text-muted-foreground">
          Se o navegador não redirecionar automaticamente, toque no botão abaixo.
        </p>
        <Button asChild className="w-full">
          <a href={driveUrl} rel="noopener noreferrer">
            Abrir pasta agora
          </a>
        </Button>
      </section>
    </main>
  );
};

export default DriveRedirect;