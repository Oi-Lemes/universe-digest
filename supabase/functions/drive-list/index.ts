// Lista o conteúdo (recursivo) de uma pasta do Google Drive usando a API key
// configurada no ambiente. Usado para sincronizar a árvore quando o usuário
// adiciona novos arquivos/pastas.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization",
};

const API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY") ?? "";

type DriveItem = { id: string; name: string; mimeType: string };

async function listFolder(folderId: string): Promise<DriveItem[]> {
  const out: DriveItem[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL("https://connector-gateway.lovable.dev/google_drive/drive/v3/files");
    url.searchParams.set("q", `'${folderId}' in parents and trashed=false`);
    url.searchParams.set("fields", "nextPageToken, files(id,name,mimeType)");
    url.searchParams.set("pageSize", "1000");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const r = await fetch(url.toString(), {
      headers: {
        "X-Connection-Api-Key": API_KEY,
        "Lovable-API-Key": API_KEY,
      },
    });
    if (!r.ok) throw new Error(`Drive API ${r.status}: ${await r.text()}`);
    const j = await r.json();
    out.push(...(j.files ?? []));
    pageToken = j.nextPageToken;
  } while (pageToken);
  return out;
}

type Node = { id: string; name: string; type: "folder" | "file"; children?: Node[] };

async function walk(folderId: string, name: string, depth = 0, maxDepth = 8): Promise<Node> {
  if (depth > maxDepth) return { id: folderId, name, type: "folder", children: [] };
  const items = await listFolder(folderId);
  const children: Node[] = [];
  // Process folders sequentially-ish (Promise.all on batches of 4)
  const folders = items.filter(i => i.mimeType === "application/vnd.google-apps.folder");
  const files = items.filter(i => i.mimeType !== "application/vnd.google-apps.folder");
  for (const f of files) children.push({ id: f.id, name: f.name, type: "file" });
  for (let i = 0; i < folders.length; i += 4) {
    const batch = folders.slice(i, i + 4);
    const results = await Promise.all(batch.map(f => walk(f.id, f.name, depth + 1, maxDepth)));
    children.push(...results);
  }
  return { id: folderId, name, type: "folder", children };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const name = url.searchParams.get("name") ?? "Folder";
    if (!id) return new Response(JSON.stringify({ error: "missing id" }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
    if (!API_KEY) return new Response(JSON.stringify({ error: "missing GOOGLE_DRIVE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
    const tree = await walk(id, name);
    return new Response(JSON.stringify(tree), { headers: { ...corsHeaders, "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});
