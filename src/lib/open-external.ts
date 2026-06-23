/**
 * Abre uma URL externa de forma confiável em qualquer ambiente:
 * - Navegador desktop / mobile
 * - PWA standalone (iOS/Android) onde `window.open` costuma falhar
 * - Webview embarcado (alguns bloqueiam window.open com noopener)
 *
 * Usa um <a target="_blank"> sintético, com fallback para location.href
 * caso o clique seja bloqueado.
 */
export function openExternalUrl(url: string): void {
  try {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    // Alguns browsers só disparam a navegação se o elemento está no DOM.
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    // Último recurso: navega na própria janela.
    window.location.href = url;
  }
}

/**
 * Constrói a URL canônica de uma pasta do Google Drive. `usp=sharing`
 * garante que o link funcione em browser, no app do Drive (Android/iOS)
 * e em PWAs sem cair em rotas internas que retornam 404.
 */
export function driveFolderUrl(id: string): string {
  return `https://drive.google.com/drive/folders/${encodeURIComponent(id)}?usp=sharing`;
}
