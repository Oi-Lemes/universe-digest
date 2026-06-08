// Persistência local de "já li" — armazena IDs de HQs marcadas como lidas
// pelo usuário. Tudo no localStorage; nada vai pro servidor.
import { useEffect, useState } from "react";

const KEY = "imp:read-ids:v1";
const EVT = "imp:read-status-changed";

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function save(set: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
    window.dispatchEvent(new Event(EVT));
  } catch {
    /* quota cheia, ignora */
  }
}

export function isRead(id: string): boolean {
  return load().has(id);
}

export function markRead(id: string) {
  const s = load();
  if (!s.has(id)) {
    s.add(id);
    save(s);
  }
}

export function unmarkRead(id: string) {
  const s = load();
  if (s.delete(id)) save(s);
}

export function toggleRead(id: string): boolean {
  const s = load();
  const next = !s.has(id);
  if (next) s.add(id);
  else s.delete(id);
  save(s);
  return next;
}

/** Hook reativo — atualiza quando outro componente altera o status. */
export function useReadStatus(id: string | null | undefined) {
  const [read, setRead] = useState<boolean>(() => (id ? isRead(id) : false));
  useEffect(() => {
    if (!id) return;
    setRead(isRead(id));
    const onChange = () => setRead(isRead(id));
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [id]);
  return read;
}
