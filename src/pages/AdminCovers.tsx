import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { loadDriveTree, DriveNode, isArchive } from "@/lib/drive";
import { extractCover } from "@/lib/cover-extract";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ENDPOINT = `${SUPABASE_URL}/functions/v1/upload-cover`;
const CONCURRENCY = 3;

// Extensões que conseguimos extrair capa (CBR/CBZ/RAR/ZIP via libarchive,
// e PDF via pdf.js). Cobre Marvel, DC, independentes, mangás e manhwas.
const EXTRACTABLE_RE = /\.(cbr|cbz|rar|zip|pdf)$/i;

type Target = { id: string; name: string; publisher: string };

function collectTargets(tree: { children: DriveNode[] }): Target[] {
  const targets: Text[] extends never ? Target[] : Target[] = [];
  const walk = (node: DriveNode, publisher: string) => {
    if (node.type === "file") {
      if (EXTRACTABLE_RE.test(node.name)) {
        targets.push({ id: node.id, name: node.name, publisher });
      }
      return;
    }
    node.children?.forEach((c) => walk(c, publisher));
  };
  // Cada pasta de topo é uma "editora" (Marvel, DC, Mangás, Manhwas, etc.).
  for (const top of tree.children) {
    if (top.type !== "folder") continue;
    top.children?.forEach((c) => walk(c, top.name));
  }
  return targets;
}

function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.replace(/^data:[^;]+;base64,/, "");
}

const AdminCovers = () => {
  const [token, setToken] = useState<string>(() => localStorage.getItem("admin_cover_token") ?? "");
  const [targets, setTargets] = useState<Target[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [failed, setFailed] = useState(0);
  const [currentLog, setCurrentLog] = useState<string[]>([]);
  const abortRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const tree = await loadDriveTree();
        setTargets(collectTargets(tree));
        const { data } = await supabase
          .from("comic_cover_index")
          .select("file_id")
          .eq("status", "ok");
        setDone(new Set((data ?? []).map((r) => r.file_id)));
      } catch (e) {
        toast.error("Erro ao carregar lista");
        console.error(e);
      }
    })();
  }, []);

  const pending = useMemo(() => targets.filter((t) => !done.has(t.id)), [targets, done]);
  const total = pending.length;
  const pct = total === 0 ? 100 : Math.round((processed / total) * 100);

  const log = (msg: string) =>
    setCurrentLog((l) => [msg, ...l].slice(0, 50));

  const start = async () => {
    if (!token) {
      toast.error("Informe o token");
      return;
    }
    localStorage.setItem("admin_cover_token", token);
    setRunning(true);
    abortRef.current = false;
    setProcessed(0);
    setFailed(0);

    const queue = [...pending];
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length && !abortRef.current) {
        const t = queue.shift();
        if (!t) break;
        try {
          const dataUrl = await extractCover(t.id, t.name);
          if (!dataUrl) {
            log(`⚠️  ${t.name} — sem imagem`);
            setFailed((f) => f + 1);
            setProcessed((p) => p + 1);
            continue;
          }
          const res = await fetch(ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-token": token,
            },
            body: JSON.stringify({
              file_id: t.id,
              publisher: t.publisher,
              image_base64: dataUrlToBase64(dataUrl),
            }),
          });
          if (!res.ok) {
            const err = await res.text();
            log(`❌ ${t.name} — ${res.status} ${err.slice(0, 80)}`);
            setFailed((f) => f + 1);
          } else {
            log(`✓ ${t.name}`);
            setDone((d) => new Set(d).add(t.id));
          }
        } catch (e) {
          log(`❌ ${t.name} — ${(e as Error).message}`);
          setFailed((f) => f + 1);
        } finally {
          setProcessed((p) => p + 1);
        }
      }
    });
    await Promise.all(workers);
    setRunning(false);
    toast.success("Concluído");
  };

  const stop = () => {
    abortRef.current = true;
  };

  const counts = useMemo(() => {
    const byPub: Record<string, { total: number; done: number }> = {};
    for (const t of targets) {
      byPub[t.publisher] ??= { total: 0, done: 0 };
      byPub[t.publisher].total++;
      if (done.has(t.id)) byPub[t.publisher].done++;
    }
    return byPub;
  }, [targets, done]);

  return (
    <main className="min-h-dvh bg-background text-foreground p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Extrair Capas — Marvel & DC</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Roda a extração da 1ª página de cada CBR/CBZ e salva no bucket público.
        Pode parar e retomar a qualquer momento — pula o que já foi feito.
      </p>

      <div className="mb-6 space-y-3">
        <label className="block text-sm font-medium">Token de administrador</label>
        <Input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ADMIN_COVER_TOKEN"
          disabled={running}
        />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
        {Object.entries(counts).map(([pub, c]) => (
          <div key={pub} className="rounded border border-border p-3">
            <div className="font-semibold">{pub}</div>
            <div className="text-muted-foreground">
              {c.done} / {c.total} ({Math.round((c.done / c.total) * 100) || 0}%)
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Pendentes: {total - processed} / {total}</span>
          <span>Falhas: {failed}</span>
        </div>
        <Progress value={pct} />
      </div>

      <div className="flex gap-2 mb-6">
        {!running ? (
          <Button onClick={start} disabled={total === 0}>
            {total === 0 ? "Tudo extraído" : `Extrair ${total} capas`}
          </Button>
        ) : (
          <Button onClick={stop} variant="destructive">Parar</Button>
        )}
      </div>

      <div className="rounded border border-border bg-card p-3 text-xs font-mono max-h-80 overflow-auto">
        {currentLog.length === 0 ? (
          <div className="text-muted-foreground">Log aparecerá aqui…</div>
        ) : (
          currentLog.map((l, i) => <div key={i}>{l}</div>)
        )}
      </div>
    </main>
  );
};

export default AdminCovers;
