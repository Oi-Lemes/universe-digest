// Streams a Google Drive file as a CORS-enabled response so the browser can
// fetch CBR/CBZ archives and unpack them client-side with libarchive.js.
// Public endpoint — only proxies Drive file IDs, no auth state involved.

const ALLOW_ORIGIN = "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type, range",
  "Access-Control-Expose-Headers": "content-length, content-range, accept-ranges, content-type, content-disposition",
};

const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const CONNECTION_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY") ?? "";

function isValidId(id: string) {
  return /^[A-Za-z0-9_-]{10,}$/.test(id);
}

function contentDispositionName(name: string | null) {
  if (!name) return "attachment";
  const safe = name.replace(/[\r\n"\\]/g, " ").trim().slice(0, 180);
  if (!safe) return "attachment";
  return `attachment; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

function sourceUrl(id: string) {
  if (LOVABLE_KEY && CONNECTION_KEY) {
    return `https://connector-gateway.lovable.dev/google_drive/drive/v3/files/${encodeURIComponent(id)}?alt=media`;
  }
  return `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`;
}

function sourceHeaders(range: string | null): HeadersInit {
  const headers: Record<string, string> = {};
  if (range) headers.range = range;
  if (LOVABLE_KEY && CONNECTION_KEY) {
    headers["X-Connection-Api-Key"] = CONNECTION_KEY;
    headers["Lovable-API-Key"] = LOVABLE_KEY;
    headers.Authorization = `Bearer ${LOVABLE_KEY}`;
  }
  return headers;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const name = url.searchParams.get("name");
    if (!id || !isValidId(id)) {
      return new Response(JSON.stringify({ error: "missing or invalid id" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const range = req.headers.get("range");
    const upstream = await fetch(sourceUrl(id), {
      headers: sourceHeaders(range),
      redirect: "follow",
    });

    const ct = upstream.headers.get("content-type") || "";
    const respHeaders = new Headers(corsHeaders);
    if (ct) respHeaders.set("content-type", ct);
    const cl = upstream.headers.get("content-length");
    if (cl) respHeaders.set("content-length", cl);
    const cr = upstream.headers.get("content-range");
    if (cr) respHeaders.set("content-range", cr);
    const ar = upstream.headers.get("accept-ranges");
    if (ar) respHeaders.set("accept-ranges", ar);
    const cd = contentDispositionName(name);
    respHeaders.set("content-disposition", cd);
    // Force download instead of inline preview for binary blobs
    if (!ct || ct.startsWith("application/")) {
      respHeaders.set("content-type", "application/octet-stream");
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: respHeaders,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 502,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
