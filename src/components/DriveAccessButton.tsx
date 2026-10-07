import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DRIVE_URL = "https://drive.google.com/drive/folders/11SVA323KWtChNn9SdhfqhhkewLlsy683";

export const DriveAccessButton = ({ icon }: { icon: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5"
        title="Acessar Google Drive"
        onClick={() => {
          setAgreed(false);
          setOpen(true);
        }}
      >
        {icon}
        <span className="hidden md:inline">Drive</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{icon} Acesso ao Drive dos arquivos</DialogTitle>
            <DialogDescription>
              {agreed
                ? "Clique no link abaixo para abrir a pasta. Se pedir acesso, solicite com o e-mail usado na compra."
                : "Atenção: o acesso ao Drive é liberado apenas para quem comprou. Ao abrir, você poderá precisar solicitar acesso com o mesmo e-mail da compra e aguardar a liberação."}
            </DialogDescription>
          </DialogHeader>
          {agreed ? (
            <div className="flex flex-col gap-3">
              <a
                href={DRIVE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm font-medium text-primary underline"
              >
                {DRIVE_URL}
              </a>
              <Button asChild>
                <a href={DRIVE_URL} target="_blank" rel="noopener noreferrer">
                  Abrir Google Drive
                </a>
              </Button>
            </div>
          ) : (
            <Button onClick={() => setAgreed(true)}>Entendi, continuar</Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
