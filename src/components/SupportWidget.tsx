import { useState } from "react";
import { Headphones, X, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SUPPORT_EMAIL = "dacruzmarketing@gmail.com";
const DRIVE_URL =
  "https://drive.google.com/drive/folders/11SVA323KWtChNn9SdhfqhhkewLlsy683?usp=drive_link";
const DRIVE_REDIRECT_PATH = "/abrir-drive";

// Ícone oficial do Google Drive
const GoogleDriveIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 87.3 78"
    className={className}
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
  </svg>
);

const CATEGORIES = [
  { value: "drive", label: "Solicitar acesso ao Drive dos arquivos", icon: true },
  { value: "recomendacao", label: "Recomendação" },
  { value: "reclamacao", label: "Reclamação" },
  { value: "duvida", label: "Dúvida" },
  { value: "bug", label: "Reportar problema" },
  { value: "elogio", label: "Elogio" },
  { value: "outro", label: "Outro" },
];

export const SupportWidget = () => {
  const { email: userEmail } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("drive");
  const [message, setMessage] = useState("");
  const [driveStep, setDriveStep] = useState<"warning" | "link">("warning");

  const isDrive = category === "drive";

  const handleSend = () => {
    if (!message.trim()) return;
    const label = CATEGORIES.find((c) => c.value === category)?.label ?? "Mensagem";
    const senderTag = userEmail ?? "não identificado";
    const subject = encodeURIComponent(
      `[Império dos Quadrinhos] ${label} — ${senderTag}`,
    );
    const body = encodeURIComponent(
      `Cliente: ${senderTag}\nCategoria: ${label}\n\n${message}\n\n---\nEnviado pelo app`,
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    toast.success("Email enviado com sucesso!", {
      description: "O retorno pode vir de 3 a 5 dias úteis.",
    });
    setMessage("");
    setOpen(false);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setDriveStep("warning");
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir suporte"
        className={cn(
          "fixed bottom-4 left-4 z-[60] h-10 w-10 rounded-full bg-cta shadow-cta",
          "flex items-center justify-center text-primary-foreground",
          "transition-transform hover:scale-105 active:scale-95",
          !open && "animate-pulse",
        )}
      >
        {open ? <X className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
        {!open && (
          <span className="absolute inset-0 rounded-full ring-2 ring-primary/60 animate-ping" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className={cn(
            "fixed bottom-20 left-4 z-[60] w-[calc(100vw-2rem)] max-w-sm",
            "rounded-xl border border-border bg-card shadow-card overflow-hidden",
            "animate-in fade-in slide-in-from-bottom-2",
          )}
        >
          <div className="bg-cta p-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              <div>
                <div className="font-semibold leading-tight">Suporte</div>
                <div className="text-xs opacity-90">Fale com a gente</div>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Tipo de mensagem</label>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[80]" position="popper">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        {c.icon && <GoogleDriveIcon className="w-4 h-4" />}
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isDrive ? (
              driveStep === "warning" ? (
                <div className="space-y-3">
                  <div className="rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-foreground/90 space-y-2">
                    <p className="font-semibold text-foreground">
                      Antes de acessar o Drive, leia com atenção:
                    </p>
                    <p>
                      Ao acessar a pasta do Google Drive você declara estar ciente
                      e de acordo com os termos abaixo:
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>
                        <strong>Não há reembolso</strong> após o acesso aos
                        arquivos ser liberado, pois trata-se de produto digital
                        de entrega imediata.
                      </li>
                      <li>
                        O conteúdo é de uso{" "}
                        <strong>pessoal e intransferível</strong>. É proibido
                        revender, redistribuir ou compartilhar o link.
                      </li>
                      <li>
                        Os arquivos pertencem aos seus respectivos autores e
                        editoras. Este acervo é disponibilizado apenas para
                        fins de leitura/colecionismo pessoal.
                      </li>
                      <li>O acesso pode ser revogado em caso de uso indevido.</li>
                    </ul>
                  </div>
                  <Button
                    onClick={() => setDriveStep("link")}
                    className="w-full bg-cta"
                  >
                    Li e concordo com os termos
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <GoogleDriveIcon className="w-5 h-5 shrink-0" />
                    <span>Clique no link abaixo para abrir o acervo:</span>
                  </div>
                  <a
                    href={DRIVE_REDIRECT_PATH}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block break-all text-sm text-primary underline underline-offset-2 hover:opacity-80"
                  >
                    {DRIVE_URL}
                  </a>
                  <Button asChild className="w-full bg-cta">
                    <a href={DRIVE_REDIRECT_PATH} target="_blank" rel="noopener noreferrer">
                      Abrir Google Drive
                    </a>
                  </Button>
                  <Button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(DRIVE_URL);
                        toast.success("Link copiado!", {
                          description: "Cole no seu navegador caso o clique seja bloqueado.",
                        });
                      } catch {
                        toast.error("Não foi possível copiar. Selecione o link manualmente.");
                      }
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Copiar link
                  </Button>
                </div>
              )
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Sua mensagem</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escreva aqui..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="w-full bg-cta"
                >
                  <Send className="h-4 w-4" />
                  Enviar
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
