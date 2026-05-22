// Streams a Google Drive file as a CORS-enabled response so the browser can
// fetch CBR/CBZ archives and unpack them client-side with libarchive.js.
// Public endpoint — only proxies Drive file IDs, no auth state involved.

const ALLOW_ORIGIN = "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, range",
  "Access-Control-Expose-Headers": "content-length, content-range, accept-ranges, content-type",
};

function isValidId(id: string) {
  return /^[A-Za-z0-9_-]{10,}$/.test(id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id || !isValidId(id)) {
      return new Response(JSON.stringify({ error: "missing or invalid id" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const driveUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;

    const headers: HeadersInit = {};
    const range = req.headers.get("range");
    if (range) headers["range"] = range;

    const upstream = await fetch(driveUrl, { headers, redirect: "follow" });

    // Google Drive returns an HTML interstitial (not the file) when the per-file
    // download quota is exceeded or a confirm step is required. Detect it and
    // surface a clean 429 so the UI can show a friendly message instead of
    // trying to parse an HTML page as a PDF/CBR.
    const ct = upstream.headers.get("content-type") || "";
    if (ct.includes("text/html")) {
      const body = await upstream.text();
      const lower = body.toLowerCase();
      const isQuota =
        lower.includes("quota exceeded") || lower.includes("too many users");
      return new Response(
        JSON.stringify({
          error: isQuota ? "drive_quota_exceeded" : "drive_unavailable",
          message: isQuota
            ? "O Google Drive bloqueou este arquivo temporariamente por excesso de downloads. Tente de novo em algumas horas."
            : "O Google Drive não entregou o arquivo (resposta inesperada). Tente de novo mais tarde.",
        }),
        {
          status: isQuota ? 429 : 502,
          headers: { ...corsHeaders, "content-type": "application/json" },
        },
      );
    }

    const respHeaders = new Headers(corsHeaders);
    if (ct) respHeaders.set("content-type", ct);
    const cl = upstream.headers.get("content-length");
    if (cl) respHeaders.set("content-length", cl);
    const cr = upstream.headers.get("content-range");
    if (cr) respHeaders.set("content-range", cr);
    const ar = upstream.headers.get("accept-ranges");
    if (ar) respHeaders.set("accept-ranges", ar);
    respHeaders.set("cache-control", "public, max-age=3600");

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
