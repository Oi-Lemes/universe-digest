import { buildGoogleDriveUrl, DriveReference, DriveType } from "@/lib/google-drive-link";

/** Abre uma URL externa já normalizada, sem alterar query/path. */
export function openExternalUrl(url: string, target: "_blank" | "_top" = "_blank"): boolean {
  try {
    if (target === "_blank") {
      const opened = window.open("", "_blank");
      if (opened) {
        opened.opener = null;
        opened.location.href = url;
        return true;
      }
    }

    const a = document.createElement("a");
    a.href = url;
    a.target = target;
    a.rel = "noopener noreferrer";
    // Alguns browsers só disparam a navegação se o elemento está no DOM.
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch {
    // Último recurso: sai da prévia/iframe quando possível e navega na janela atual.
    try {
      window.top?.location.assign(url);
      return true;
    } catch {
      window.location.assign(url);
      return true;
    }
  }
}

export function openGoogleDriveReference(reference: DriveReference, target: "_blank" | "_top" = "_blank"): boolean {
  const finalUrl = buildGoogleDriveUrl(reference.driveType, reference.driveId);
  console.info("[drive:open] abrindo referência normalizada", {
    item: reference,
    driveType: reference.driveType,
    driveId: reference.driveId,
    finalUrl,
  });
  return openExternalUrl(finalUrl, target);
}

/** Compatibilidade: constrói a URL oficial por tipo + id. */
export function driveFolderUrl(id: string): string {
  return buildGoogleDriveUrl("folder", id);
}

/** Compatibilidade: rota interna recebe apenas tipo/id, nunca a URL bruta. */
export function driveRedirectUrl(id: string, type: DriveType = "folder"): string {
  const params = new URLSearchParams({ id, type });
  return `/abrir-drive?${params.toString()}`;
}
