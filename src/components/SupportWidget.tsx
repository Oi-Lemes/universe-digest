import { useState } from "react";
import { Headphones, X, Send } from "lucide-react";
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

const CATEGORIES = [
  { value: "recomendacao", label: "Recomendação" },
  { value: "reclamacao", label: "Reclamação" },
  { value: "duvida", label: "Dúvida" },
  { value: "bug", label: "Reportar problema" },
  { value: "elogio", label: "Elogio" },
  { value: "outro", label: "Outro" },
];

export const SupportWidget = () => {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("recomendacao");
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    const label = CATEGORIES.find((c) => c.value === category)?.label ?? "Mensagem";
    const subject = encodeURIComponent(`[Império dos Quadrinhos] ${label}`);
    const body = encodeURIComponent(
      `Categoria: ${label}\n\n${message}\n\n---\nEnviado pelo app`,
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    toast.success("Mensagem pronta para envio!", {
      description: "Conclua o envio no seu app de email para finalizar.",
    });
    setMessage("");
    setOpen(false);
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
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[80]" position="popper">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
            <p className="text-[10px] text-muted-foreground text-center">
              Abre seu app de email para finalizar o envio
            </p>
          </div>
        </div>
      )}
    </>
  );
};
