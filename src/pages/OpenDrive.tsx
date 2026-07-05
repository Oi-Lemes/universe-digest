import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { IMPERIO_DRIVE_ROOT_URL } from "@/lib/imperio-drive";

const OpenDrive = () => {
  useEffect(() => {
    const redirect = window.setTimeout(() => {
      window.location.replace(IMPERIO_DRIVE_ROOT_URL);
    }, 150);

    return () => window.clearTimeout(redirect);
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <section className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Abrindo Google Drive</h1>
        <p className="text-sm text-muted-foreground">
          Se o redirecionamento não acontecer automaticamente, toque no botão abaixo.
        </p>
        <Button asChild className="w-full bg-cta">
          <a href={IMPERIO_DRIVE_ROOT_URL} rel="noopener noreferrer">
            Abrir pasta do Drive
          </a>
        </Button>
        <a
          href={IMPERIO_DRIVE_ROOT_URL}
          rel="noopener noreferrer"
          className="block break-all text-sm text-primary underline underline-offset-2"
        >
          {IMPERIO_DRIVE_ROOT_URL}
        </a>
      </section>
    </main>
  );
};

export default OpenDrive;