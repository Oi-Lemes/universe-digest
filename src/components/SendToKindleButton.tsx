import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadAsEpub, type EpubDelivery } from "@/lib/kindle-epub";
import { toast } from "@/hooks/use-toast";

type Props = {
  fileId: string;
  fileName: string;
};

/**
 * Converte o CBZ/CBR aberto em EPUB (formato aceito pelo "Enviar para Kindle").
 * No iPhone abre a folha de compartilhamento; no PC baixa o arquivo.
 */
export const SendToKindleButton = ({ fileId, fileName }: Props) => {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [done, setDone] = useState<EpubDelivery | null>(null);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    setProgress("Preparando…");
    try {
      const delivery = await downloadAsEpub(fileId, fileName, setProgress);
      setDone(delivery);
    } catch (e) {
      toast({
        title: "Não foi possível converter",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 gap-1 px-2.5 rounded-full text-white hover:text-white hover:bg-white/15"
        onClick={() => void handleClick()}
        disabled={busy}
        title="Gerar EPUB para enviar ao Kindle"
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <BookOpen className="w-4 h-4" />
        )}
        <span className="hidden sm:inline text-xs font-semibold">
          {busy ? progress || "Convertendo…" : "Kindle"}
        </span>
      </Button>

      {busy && (
        <span className="sm:hidden text-[11px] font-semibold text-white/90 pr-1">
          {progress || "Convertendo…"}
        </span>
      )}

      <Dialog open={done !== null} onOpenChange={(o) => !o && setDone(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>EPUB pronto pro Kindle</DialogTitle>
            <DialogDescription>
              {done === "shared"
                ? "O arquivo .epub foi gerado e enviado pra tela de compartilhamento do seu aparelho."
                : "O arquivo .epub foi salvo nos seus downloads."}
            </DialogDescription>
          </DialogHeader>

          <div className="text-sm text-muted-foreground space-y-2">
            {done === "shared" ? (
              <ol className="list-decimal pl-5 space-y-1">
                <li>Escolha <strong>Salvar em Arquivos</strong> (ou o app Kindle, se aparecer).</li>
                <li>Abra o app <strong>Kindle</strong> → <strong>Mais</strong> → <strong>Importar arquivo</strong> e selecione o .epub.</li>
                <li>Ou envie o .epub por e-mail para o seu endereço <strong>@kindle.com</strong>.</li>
              </ol>
            ) : (
              <ol className="list-decimal pl-5 space-y-1">
                <li>Acesse <strong>sendtokindle.amazon.com</strong> e faça login.</li>
                <li>Arraste o arquivo <strong>.epub</strong> que acabou de baixar.</li>
                <li>Ou envie por e-mail para o seu endereço <strong>@kindle.com</strong>.</li>
              </ol>
            )}
            <p className="text-xs">A Amazon converte o EPUB automaticamente pro formato do Kindle.</p>
          </div>

          <DialogFooter>
            <Button type="button" onClick={() => setDone(null)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
