// Streams a Google Drive file as a CORS-enabled response so the browser can
// fetch CBR/CBZ archives and PDFs and process them client-side.
//
// Uses the Lovable connector gateway (authenticated Google Drive API v3) which
// has a per-project quota (millions/day) instead of the strict per-file public
// download quota that triggers the "Quota exceeded / Too many users" HTML
// interstitial on drive.usercontent.google.com. If the gateway call fails for
// any reason, falls back to the public endpoint as a best effort.

const ALLOW_ORIGIN = "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, range",
  "Access-Control-Expose-Headers":
    "content-length, content-range, accept-ranges, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_drive/drive/v3";

function isValidId(id: string) {
  return /^[A-Za-z0-9_-]{10,}$/.test(id);
}

async function fetchViaGateway(
  id: string,
  range: string | null,
): Promise<Response | null> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const driveKey = Deno.env.get("GOOGLE_DRIVE_API_KEY");
  if (!lovableKey || !driveKey) return null;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": driveKey,
  };
  if (range) headers["range"] = range;

  const res = await fetch(
    `${GATEWAY_URL}/files/${encodeURIComponent(id)}?alt=media&supportsAllDrives=true`,
    { headers },
  );
  return res;
}

async function fetchViaPublic(
  id: string,
  range: string | null,
): Promise<Response> {
  const driveUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;
  const headers: HeadersInit = {};
  if (range) headers["range"] = range;
  return fetch(driveUrl, { headers, redirect: "follow" });
}

function passthrough(upstream: Response): Response {
  const respHeaders = new Headers(corsHeaders);
  const ct = upstream.headers.get("content-type");
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

    const range = req.headers.get("range");

    // 1) Try authenticated Drive API via the Lovable connector gateway.
    let upstream: Response | null = null;
    try {
      upstream = await fetchViaGateway(id, range);
    } catch (_e) {
      upstream = null;
    }

    // 2) If the gateway is unavailable or returns a non-2xx that isn't a
    //    success, fall back to the public endpoint as a best effort.
    if (!upstream || (!upstream.ok && upstream.status !== 206)) {
      // Drain the failed upstream body to free the connection.
      try {
        upstream && (await upstream.body?.cancel());
      } catch (_e) {
        /* ignore */
      }
      const fallback = await fetchViaPublic(id, range);
      const ct = fallback.headers.get("content-type") || "";
      if (ct.includes("text/html")) {
        const body = await fallback.text();
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
      return passthrough(fallback);
    }

    return passthrough(upstream);
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 502,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
