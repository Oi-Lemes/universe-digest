import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { filePreviewUrl } from "@/lib/drive";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type Props = {
  fileId: string | null;
  fileName: string;
  onClose: () => void;
};

export const ComicReader = ({ fileId, fileName, onClose }: Props) => {
  return (
    <Dialog open={!!fileId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden bg-card border-border">
        <VisuallyHidden>
          <DialogTitle>{fileName}</DialogTitle>
        </VisuallyHidden>
        <div className="flex flex-col h-full">
          <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/40">
            <h2 className="font-semibold truncate text-sm">{fileName}</h2>
          </header>
          {fileId && (
            <iframe
              key={fileId}
              src={filePreviewUrl(fileId)}
              className="flex-1 w-full bg-background"
              allow="autoplay"
              allowFullScreen
              title={fileName}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
