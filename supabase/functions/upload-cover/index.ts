import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const token = req.headers.get("x-admin-token");
    const expected = Deno.env.get("ADMIN_COVER_TOKEN");
    if (!expected || token !== expected) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { file_id, publisher, image_base64 } = body ?? {};
    if (
      typeof file_id !== "string" || !file_id ||
      typeof publisher !== "string" || !publisher ||
      typeof image_base64 !== "string" || !image_base64
    ) {
      return new Response(JSON.stringify({ error: "invalid_payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Decode base64 → bytes
    const clean = image_base64.replace(/^data:[^;]+;base64,/, "");
    const bin = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));

    const path = `${file_id}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("comic-covers")
      .upload(path, bin, { contentType: "image/jpeg", upsert: true });
    if (upErr) throw upErr;

    const { error: dbErr } = await supabase
      .from("comic_cover_index")
      .upsert({
        file_id,
        publisher,
        bucket_path: path,
        status: "ok",
        extracted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    if (dbErr) throw dbErr;

    return new Response(JSON.stringify({ ok: true, path }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[upload-cover]", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
