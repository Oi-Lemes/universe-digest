import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { prewarmOnlineCoverCache } from "./lib/online-cover";
import { prewarmExtractedCovers } from "./lib/cover-extract";

// Pré-aquece os caches persistentes (IndexedDB → memória) para que, ao reabrir
// a aba/app, capas e ícones apareçam instantaneamente sem refetch.
prewarmOnlineCoverCache();
prewarmExtractedCovers();

// Registra Service Worker para cache offline-first de imagens e assets.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* falha silenciosa — app funciona sem SW */
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
