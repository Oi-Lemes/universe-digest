import { useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const DRIVE_URL = "https://drive.google.com/drive/folders/11SVA323KWtChNn9SdhfqhhkewLlsy683";

export const DriveAccessButton = ({ icon }: { icon: ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="sm" className="gap-1.5" title="Acessar Google Drive" onClick={() => setOpen(true)}>
        {icon}
        <span className="hidden md:inline">Drive</span>
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">{icon} Antes de abrir o Drive</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Os arquivos disponíveis no Google Drive são do <strong>acervo antigo</strong>. As atualizações
                  recentes, feitas de 15 em 15 dias, ficam em pastas separadas vinculadas ao app, para evitar má-fé
                  de clientes mal-intencionados.
                </p>
                <p className="font-semibold text-destructive">
                  Ao clicar para entrar no Drive, o reembolso não estará mais disponível.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <Button asChild>
              <a href={DRIVE_URL} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
                Entendi, entrar no Drive
              </a>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
