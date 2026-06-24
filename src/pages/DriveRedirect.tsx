import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { buildGoogleDriveUrl, DriveType } from "@/lib/google-drive-link";

const DRIVE_ID_RE = /^[A-Za-z0-9_-]{10,}$/;
const DRIVE_TYPES: DriveType[] = ["file", "folder"];

const DriveRedirect = () => {
  const [params] = useSearchParams();
  const id = params.get("id") ?? "";
  const typeParam = params.get("type") ?? "folder";
  const driveType = DRIVE_TYPES.includes(typeParam as DriveType) ? (typeParam as DriveType) : null;
  const driveUrl = useMemo(
    () => (driveType && DRIVE_ID_RE.test(id) ? buildGoogleDriveUrl(driveType, id) : null),
    [driveType, id]
  );

  if (driveUrl && driveType) {
    console.info("[drive:redirect] URL reconstruída por tipo/id", {
      item: { driveType, driveId: id },
      driveType,
      driveId: id,
      finalUrl: driveUrl,
    });
  }

  if (!driveUrl) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <section className="max-w-md text-center space-y-3 rounded-lg border border-border bg-card p-6 shadow-lg">
          <h1 className="text-xl font-bold text-foreground">Link do Drive inválido</h1>
          <p className="text-sm text-muted-foreground">
            Volte ao app e tente abrir o item novamente.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <section className="max-w-md text-center space-y-4 rounded-lg border border-border bg-card p-6 shadow-lg">
        <h1 className="text-xl font-bold text-foreground">Abrir Google Drive</h1>
        <p className="text-sm text-muted-foreground">
          Para evitar o bloqueio do navegador, abra o item substituindo esta janela pelo Drive.
        </p>
        <Button asChild className="w-full">
          <a href={driveUrl} target="_top" rel="external">
            Abrir no Google Drive
          </a>
        </Button>
      </section>
    </main>
  );
};

export default DriveRedirect;