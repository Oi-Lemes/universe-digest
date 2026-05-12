import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  fileDownloadUrl,
  filePreviewUrl,
  isViewableInDrive,
  fileExt,
} from "@/lib/drive";
import { Download, FileWarning, Lock } from "lucide-react";
import { ComicArchiveReader } from "./ComicArchiveReader";
import { PdfReader } from "./PdfReader";
import { useAuth } from "@/hooks/useAuth";

// CBR/CBZ/RAR/ZIP — extracted client-side via libarchive.js (WASM).
const ARCHIVE_EXTS = new Set(["cbr", "cbz", "rar", "zip"]);

type Props = {
  fileId: string | null;
  fileName: string;
  onClose: () => void;
};

export const ComicReader = ({ fileId, fileName, onClose }: Props) => {
  const { isTrial } = useAuth();
  const ext = fileName ? fileExt(fileName) : "";
  const isArchive = !!fileId && ARCHIVE_EXTS.has(ext);
  const isPdf = !!fileId && ext === "pdf";
  const viewable = fileId ? isViewableInDrive(fileName) : false;

  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!fileId) return;
    e.preventDefault();
    const a = document.createElement("a");
    a.href = fileDownloadUrl(fileId);
    a.download = fileName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={!!fileId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden bg-card border-border">
        <DialogTitle className="sr-only">{fileName}</DialogTitle>
        <div className="flex flex-col h-full">
          <header className="flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary/40">
            <h2 className="font-semibold truncate text-sm flex-1 pr-8">{fileName}</h2>
            {fileId && !isTrial && (
              <Button asChild size="sm" variant="secondary" className="h-7 gap-1">
                <a
                  href={fileDownloadUrl(fileId)}
                  onClick={handleDownload}
                  download={fileName}
                >
                  <Download className="w-3.5 h-3.5" /> Baixar
                </a>
              </Button>
            )}
            {fileId && isTrial && (
              <span className="h-7 inline-flex items-center gap-1 px-2 rounded-md text-[11px] font-semibold border border-destructive/40 bg-destructive/10 text-destructive">
                <Lock className="w-3 h-3" /> Download bloqueado
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

          {fileId && !isArchive && !viewable && (
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
