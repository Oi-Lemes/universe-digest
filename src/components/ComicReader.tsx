import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  downloadDriveFile,
  filePreviewUrl,
  isViewableInDrive,
  fileExt,
} from "@/lib/drive";
import { Check, Download, FileWarning, Lock } from "lucide-react";
import { ComicArchiveReader } from "./ComicArchiveReader";
import { PdfReader } from "./PdfReader";
import { useAuth } from "@/hooks/useAuth";
import { toggleRead, useReadStatus } from "@/lib/read-status";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// CBR/CBZ/RAR/ZIP — extracted client-side via libarchive.js (WASM).
const ARCHIVE_EXTS = new Set(["cbr", "cbz", "rar", "zip"]);

type Props = {
  fileId: string | null;
  fileName: string;
  onClose: () => void;
};

export const ComicReader = ({ fileId, fileName, onClose }: Props) => {
  const { isTrial } = useAuth();
  const read = useReadStatus(fileId);
  const ext = fileName ? fileExt(fileName) : "";
  const isArchive = !!fileId && ARCHIVE_EXTS.has(ext);
  const isPdf = !!fileId && ext === "pdf";
  const viewable = fileId ? isViewableInDrive(fileName) : false;
  const handleDownload = async () => {
    if (!fileId) return;
    try {
      await downloadDriveFile(fileId, fileName);
    } catch {
      toast({
        title: "Não foi possível baixar",
        description: "Esse arquivo não respondeu pelo Drive. Verifique se o link ainda existe e está liberado.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={!!fileId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        hideClose
        className="w-screen h-[100dvh] max-w-none max-h-[100dvh] gap-0 p-0 overflow-hidden bg-black border-0 rounded-none sm:rounded-none"
      >
        <DialogTitle className="sr-only">{fileName}</DialogTitle>
        <div className="relative flex flex-col h-full">
          {/* Floating toolbar — top-right, sobrepõe o conteúdo pra dar tela cheia de verdade. */}
          {fileId && (
            <div
              className="absolute z-50 right-2 sm:right-3 flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 px-1.5 py-1 shadow-lg"
              style={{ top: "calc(0.5rem + env(safe-area-inset-top))" }}
            >
              <Button
                type="button"
                size="sm"
                variant={read ? "default" : "ghost"}
                onClick={() => toggleRead(fileId)}
                className={cn(
                  "h-8 gap-1 px-2.5 rounded-full text-white hover:text-white",
                  read
                    ? "bg-[hsl(150_70%_42%)] hover:bg-[hsl(150_70%_38%)]"
                    : "hover:bg-white/15"
                )}
                title={read ? "Marcado como lido — clique pra desmarcar" : "Marcar como lido"}
                aria-pressed={read}
              >
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-semibold">
                  {read ? "Lido" : "Já li"}
                </span>
              </Button>

              {!isTrial && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1 px-2.5 rounded-full text-white hover:text-white hover:bg-white/15"
                  onClick={() => void handleDownload()}
                  title="Baixar"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-semibold">Baixar</span>
                </Button>
              )}

              {isTrial && (
                <span
                  className="h-8 inline-flex items-center gap-1 px-2.5 rounded-full text-[11px] font-semibold border border-destructive/40 bg-destructive/15 text-destructive"
                  title="Download bloqueado no teste"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bloqueado</span>
                </span>
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar leitor"
                className="h-8 w-8 inline-flex items-center justify-center rounded-full text-white hover:bg-white/15 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {fileId && isArchive && (
            <ComicArchiveReader fileId={fileId} fileName={fileName} />
          )}

          {fileId && isPdf && (
            <PdfReader fileId={fileId} fileName={fileName} />
          )}

          {fileId && !isArchive && !isPdf && viewable && (
            <div className="relative flex-1 bg-background">
              <iframe
                key={fileId}
                src={filePreviewUrl(fileId)}
                className="h-full w-full bg-background"
                allow="autoplay"
                allowFullScreen
                title={fileName}
              />
            </div>
          )}

          {fileId && !isArchive && !isPdf && !viewable && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
              <FileWarning className="w-16 h-16 text-destructive" strokeWidth={1.5} />
              <div>
                <h3 className="text-xl font-bold mb-2">
                  Formato {ext ? `.${ext}` : ""} não pode ser lido aqui
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Arquivos compactados como{" "}
                  <code className="text-foreground">.cbr</code>,{" "}
                  <code className="text-foreground">.cbz</code> ou{" "}
                  <code className="text-foreground">.rar</code> não podem ser exibidos no navegador.
                  {!isTrial && (
                    <>
                      <br />
                      Baixe a HQ e abra com um leitor como{" "}
                      <strong>YACReader</strong>, <strong>CDisplayEx</strong> ou{" "}
                      <strong>Simple Comic</strong>.
                    </>
                  )}
                </p>
              </div>
              {isTrial ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-sm font-semibold">
                  <Lock className="w-4 h-4" /> Somente quem comprou pode baixar
                </div>
              ) : (
                <Button type="button" size="lg" onClick={() => void handleDownload()}>
                  <Download className="w-4 h-4 mr-1.5" /> Baixar HQ
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
