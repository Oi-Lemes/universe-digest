import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { prewarmOnlineCoverCache } from "./lib/online-cover";
import { prewarmExtractedCovers } from "./lib/cover-extract";

// Pré-aquece os caches persistentes (IndexedDB → memória) para que, ao reabrir
// a aba/app, capas e ícones apareçam instantaneamente sem refetch.
prewarmOnlineCoverCache();
prewarmExtractedCovers();

// Remove o Service Worker antigo. Ele cacheava requisições do drive.google.com
// como imagem e alguns navegadores bloqueavam a navegação externa para o Drive.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .getRegistrations()
      .then(async (registrations) => {
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }

        if (navigator.serviceWorker.controller && !sessionStorage.getItem("iq_sw_removed_v2")) {
          sessionStorage.setItem("iq_sw_removed_v2", "1");
          window.location.reload();
        }
      })
      .catch(() => {
        /* falha silenciosa — app funciona sem SW */
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
