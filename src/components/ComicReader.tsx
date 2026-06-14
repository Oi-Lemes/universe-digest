import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  fileDownloadUrl,
  filePreviewUrl,
  isViewableInDrive,
  fileExt,
} from "@/lib/drive";
import { Check, Download, FileWarning, Loader2, Lock } from "lucide-react";
import { ComicArchiveReader } from "./ComicArchiveReader";
import { PdfReader } from "./PdfReader";
import { useAuth } from "@/hooks/useAuth";
import { toggleRead, useReadStatus } from "@/lib/read-status";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

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
  const downloadHref = fileId ? fileDownloadUrl(fileId, fileName) : "#";

  const handleDownload = (_e: React.MouseEvent<HTMLAnchorElement>) => {
    // Não previne default: deixa o navegador navegar pra URL, que vem com
    // Content-Disposition: attachment, e salva nativo em Downloads/Arquivos.
    if (!fileId) return;
    toast.success("Download iniciado", { description: fileName });
  };

  return (
    <Dialog open={!!fileId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-6xl w-[100vw] sm:w-auto h-[100dvh] sm:h-[90vh] max-h-[100dvh] p-0 overflow-hidden bg-card border-border rounded-none sm:rounded-lg">
        <DialogTitle className="sr-only">{fileName}</DialogTitle>
        <div className="flex flex-col h-full">
          <header className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 pr-12 border-b border-border bg-secondary/40 min-w-0">
            <h2 className="font-semibold truncate text-xs sm:text-sm flex-1 min-w-0">{fileName}</h2>
            {fileId && (
              <Button
                type="button"
                size="sm"
                variant={read ? "default" : "secondary"}
                onClick={() => toggleRead(fileId)}
                className={cn(
                  "h-7 gap-1 shrink-0 px-2",
                  read && "bg-[hsl(150_70%_42%)] hover:bg-[hsl(150_70%_38%)] text-white"
                )}
                title={read ? "Marcado como lido — clique pra desmarcar" : "Marcar como lido"}
                aria-pressed={read}
              >
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{read ? "Lido" : "Já li"}</span>
              </Button>
            )}
            {fileId && !isTrial && (
              <Button asChild size="sm" variant="secondary" className="h-7 gap-1 shrink-0 px-2" disabled={downloading}>
                <a
                  href={fileDownloadUrl(fileId)}
                  onClick={handleDownload}
                  download={fileName}
                  aria-disabled={downloading}
                >
                  {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{downloading ? "Baixando…" : "Baixar"}</span>
                </a>
              </Button>
            )}
            {fileId && isTrial && (
              <span className="h-7 inline-flex items-center gap-1 px-2 rounded-md text-[11px] font-semibold border border-destructive/40 bg-destructive/10 text-destructive shrink-0">
                <Lock className="w-3 h-3" />
                <span className="hidden sm:inline">Download bloqueado</span>
              </span>
            )}
          </header>


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
                <Button asChild size="lg">
                  <a
                    href={fileDownloadUrl(fileId)}
                    onClick={handleDownload}
                    download={fileName}
                  >
                    <Download className="w-4 h-4 mr-1.5" /> Baixar HQ
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
