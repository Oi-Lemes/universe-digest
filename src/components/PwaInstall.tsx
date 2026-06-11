import { useEffect, useState } from "react";
import { Download, Share, X, Plus } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function isStandalone() {
  if (typeof window === "undefined") return false;
  // iOS Safari
  // @ts-ignore
  if (window.navigator.standalone) return true;
  return window.matchMedia?.("(display-mode: standalone)").matches ?? false;
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
}

function isInSafari() {
  const ua = navigator.userAgent || "";
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

export default function PwaInstall() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [installed, setInstalled] = useState<boolean>(() => isStandalone());
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(DISMISS_KEY);
      if (!v) return false;
      return Date.now() - Number(v) < DISMISS_TTL_MS;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (installed) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt as any);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt as any);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [installed]);

  if (installed || dismissed) return null;

  const ios = isIos();
  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setDismissed(true);
  };

  // iOS: no install prompt API — show Safari instructions
  if (ios) {
    const safari = isInSafari();
    return (
      <>
        <button
          onClick={() => setShowIosHelp(true)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-2xl ring-1 ring-black/10 transition hover:scale-105 active:scale-95"
          aria-label="Instalar app"
        >
          <Download className="h-4 w-4" />
          Instalar app
        </button>
        {showIosHelp && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={() => setShowIosHelp(false)}>
            <div
              className="w-full max-w-sm rounded-2xl bg-card p-5 text-card-foreground shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold">Instalar no iPhone / iPad</h3>
                <button onClick={() => setShowIosHelp(false)} className="rounded p-1 hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {!safari && (
                <div className="mb-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs">
                  ⚠️ Abra este site no <strong>Safari</strong> (não funciona no Chrome do iPhone) para instalar.
                </div>
              )}
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                  <span>
                    Toque no botão <Share className="inline h-4 w-4 align-text-bottom" /> <strong>Compartilhar</strong> na barra do Safari (embaixo).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                  <span>
                    Role e toque em <Plus className="inline h-4 w-4 align-text-bottom" /> <strong>"Adicionar à Tela de Início"</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                  <span>Toque em <strong>"Adicionar"</strong> no canto superior direito. Pronto! 🎉</span>
                </li>
              </ol>
              <button
                onClick={handleDismiss}
                className="mt-4 w-full text-center text-xs text-muted-foreground hover:underline"
              >
                Não mostrar por 7 dias
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Android / desktop Chromium: trigger native prompt
  const handleInstall = async () => {
    if (!deferred) {
      // Fallback hint if browser hasn't fired the event yet
      alert(
        "Para instalar: abra o menu ⋮ do navegador e toque em 'Instalar app' ou 'Adicionar à tela inicial'."
      );
      return;
    }
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
    }
    setDeferred(null);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <button
        onClick={handleInstall}
        className="flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-2xl ring-1 ring-black/10 transition hover:scale-105 active:scale-95"
        aria-label="Instalar app"
      >
        <Download className="h-4 w-4" />
        Instalar app
      </button>
      <button
        onClick={handleDismiss}
        className="rounded-full bg-card/90 p-2 text-muted-foreground shadow-lg ring-1 ring-black/10 hover:text-foreground"
        aria-label="Dispensar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
