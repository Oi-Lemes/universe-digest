/**
 * Abre uma URL externa de forma confiável em qualquer ambiente:
 * - Navegador desktop / mobile
 * - PWA standalone (iOS/Android) onde `window.open` costuma falhar
 * - Webview embarcado (alguns bloqueiam window.open com noopener)
 *
 * Usa um link real, disparado dentro do clique do usuário. O alvo pode ser
 * `_blank` (nova aba) ou `_top` (sair de iframe/prévia e navegar a janela atual).
 */
export function openExternalUrl(url: string, target: "_blank" | "_top" = "_blank"): void {
  try {
    const a = document.createElement("a");
    a.href = url;
    a.target = target;
    a.rel = "noopener noreferrer";
    // Alguns browsers só disparam a navegação se o elemento está no DOM.
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    // Último recurso: sai da prévia/iframe quando possível e navega na janela atual.
    try {
      window.top?.location.assign(url);
    } catch {
      window.location.assign(url);
    }
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

/**
 * URL interna que abre primeiro uma página do próprio app e só então redireciona
 * para o Google Drive. Isso evita o bloqueio que alguns navegadores fazem
 * quando o Drive é aberto direto de iframe, webview, preview ou PWA.
 */
export function driveRedirectUrl(id: string): string {
  return `/abrir-drive?id=${encodeURIComponent(id)}`;
}
