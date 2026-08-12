// Edge function: gera capa de mangá/manhwa via Lovable AI quando nenhuma
// fonte online retorna match. Persiste em Storage (generated-covers) para
// reutilizar entre sessões e usuários — sempre a mesma capa por título.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "generated-covers";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const rawTitle = typeof body?.title === "string" ? body.title.trim() : "";
    const kind = body?.kind;
    // Strict validation: titles must be short, plain text — guards against
    // attackers spamming the endpoint with thousands of varied prompts to
    // drain AI credits.
    if (
      rawTitle.length < 2 ||
      rawTitle.length > 80 ||
      !/^[\p{L}\p{N}\s\-:.,!'’&()]+$/u.test(rawTitle)
    ) {
      return new Response(JSON.stringify({ error: "invalid title" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const title = rawTitle;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const slug = slugify(title);
    const path = `${slug}.png`;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

    // Já existe? Reusa.
    const head = await fetch(publicUrl, { method: "HEAD" });
    if (head.ok) {
      return new Response(JSON.stringify({ url: publicUrl, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const style =
      kind === "manhwa"
        ? "vertical webtoon-style cover, vibrant colors, dramatic lighting, korean manhwa illustration"
        : "japanese manga cover, ink and screentones, dynamic composition";

    const prompt = `Cover art for the title "${title}". ${style}. Portrait 2:3 aspect ratio, clean background, no text, no logos, no watermark, no letters, high detail, professional book cover.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      // Return 200 with fallback flag so SDK doesn't throw and frontend can fallback gracefully.
      return new Response(
        JSON.stringify({ error: "ai_unavailable", aiStatus: aiRes.status, fallback: true, url: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await aiRes.json();
    const msg = data?.choices?.[0]?.message;
    // O gateway pode devolver a imagem em formatos diferentes — tenta todos.
    const imgDataUrl: string | undefined =
      msg?.images?.[0]?.image_url?.url ??
      msg?.images?.[0]?.url ??
      (Array.isArray(msg?.content)
        ? msg.content.find((c: any) => c?.image_url?.url || c?.type === "image_url")?.image_url?.url
        : undefined) ??
      data?.data?.[0]?.b64_json?.replace(/^/, "data:image/png;base64,");

    if (!imgDataUrl?.startsWith("data:image")) {
      console.error("no image in AI response", JSON.stringify(data).slice(0, 500));
      // 200 + fallback pro frontend seguir sem quebrar a tela.
      return new Response(
        JSON.stringify({ error: "no_image", fallback: true, url: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const base64 = imgDataUrl.split(",")[1];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (upErr) {
      console.error("upload error", upErr);
      return new Response(JSON.stringify({ error: "upload failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: publicUrl, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cover-generate error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
