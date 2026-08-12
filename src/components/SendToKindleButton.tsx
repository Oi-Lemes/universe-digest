import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2 } from "lucide-react";
import { downloadAsEpub } from "@/lib/kindle-epub";
import { toast } from "@/hooks/use-toast";

type Props = {
  fileId: string;
  fileName: string;
};

/**
 * Converte o CBZ/CBR aberto em EPUB (formato aceito pelo "Enviar para Kindle")
 * e baixa o arquivo pronto pra ser enviado.
 */
export const SendToKindleButton = ({ fileId, fileName }: Props) => {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    setProgress("Preparando…");
    try {
      await downloadAsEpub(fileId, fileName, setProgress);
      toast({
        title: "EPUB pronto pro Kindle",
        description:
          "Agora envie o arquivo .epub em sendtokindle.amazon.com ou por e-mail para o seu endereço @kindle.com. A Amazon converte automaticamente.",
      });
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
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-8 gap-1 px-2.5 rounded-full text-white hover:text-white hover:bg-white/15"
      onClick={() => void handleClick()}
      disabled={busy}
      title="Baixar em EPUB para enviar ao Kindle"
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
  );
};
