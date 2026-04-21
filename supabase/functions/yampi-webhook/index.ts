// Yampi webhook handler — grants/revokes access based on order events.
// Configure in Yampi → Webhooks. Set the secret token below in env YAMPI_WEBHOOK_TOKEN.
// This function uses verify_jwt = false (default for Lovable Cloud functions).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-yampi-hmac-sha256, x-webhook-token",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const YAMPI_WEBHOOK_TOKEN = Deno.env.get("YAMPI_WEBHOOK_TOKEN");

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type GrantStatus = "active" | "refunded" | "chargeback" | "manual_revoked";

function pickEmail(payload: any): string | null {
  // Yampi payload variants: resource.customer.email | data.customer.email | customer.email
  const email =
    payload?.resource?.customer?.email ??
    payload?.data?.customer?.email ??
    payload?.customer?.email ??
    payload?.resource?.email ??
    payload?.email;
  return typeof email === "string" ? email.trim().toLowerCase() : null;
}

function pickOrderId(payload: any): string | null {
  const id =
    payload?.resource?.id ??
    payload?.data?.id ??
    payload?.id ??
    payload?.resource?.number ??
    payload?.data?.number;
  return id != null ? String(id) : null;
}

function pickEvent(payload: any, headers: Headers): string {
  return (
    headers.get("x-yampi-event") ??
    payload?.event ??
    payload?.type ??
    payload?.event_name ??
    ""
  ).toLowerCase();
}

function pickStatus(payload: any): string {
  return (
    payload?.resource?.status?.alias ??
    payload?.resource?.status?.name ??
    payload?.data?.status?.alias ??
    payload?.data?.status?.name ??
    payload?.status?.alias ??
    payload?.status?.name ??
    payload?.status ??
    ""
  )
    .toString()
    .toLowerCase();
}

function decideStatus(event: string, status: string): GrantStatus | null {
  const blob = `${event} ${status}`;
  if (blob.includes("chargeback")) return "chargeback";
  if (blob.includes("refund") || blob.includes("reembols") || blob.includes("estorn"))
    return "refunded";
  if (blob.includes("cancel")) return "refunded";
  if (
    blob.includes("paid") ||
    blob.includes("approved") ||
    blob.includes("aprovad") ||
    blob.includes("pag") ||
    blob.includes("authorized") ||
    blob.includes("complete")
  )
    return "active";
  return null;
}

// === Offer detection by amount paid ===
// Basic (R$ 5,99) does NOT grant access. Top (R$ 16,90) and Popup (R$ 10) do.
const ACCESS_MIN_AMOUNT = 10.0;

function pickAmount(payload: any): number | null {
  const raw =
    payload?.resource?.totals?.total ??
    payload?.resource?.total ??
    payload?.resource?.value_total ??
    payload?.data?.totals?.total ??
    payload?.data?.total ??
    payload?.data?.value_total ??
    payload?.totals?.total ??
    payload?.total ??
    payload?.value_total ??
    payload?.amount;
  if (raw == null) return null;
  const n = typeof raw === "string" ? parseFloat(raw.replace(",", ".")) : Number(raw);
  return Number.isFinite(n) ? n : null;
}

function pickProductName(payload: any): string | null {
  const items =
    payload?.resource?.items?.data ??
    payload?.resource?.items ??
    payload?.data?.items?.data ??
    payload?.data?.items ??
    payload?.items;
  if (Array.isArray(items) && items.length) {
    const first = items[0];
    const name =
      first?.sku?.data?.title ??
      first?.sku?.title ??
      first?.product?.data?.name ??
      first?.product?.name ??
      first?.name ??
      first?.title;
    if (typeof name === "string") return name;
  }
  return null;
}

function classifyPlan(amount: number | null): {
  plan: "top" | "popup" | "basic_blocked" | "unknown";
  grants: boolean;
} {
  if (amount == null) return { plan: "unknown", grants: false };
  if (amount < ACCESS_MIN_AMOUNT) return { plan: "basic_blocked", grants: false };
  if (amount >= 15) return { plan: "top", grants: true };
  return { plan: "popup", grants: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Optional shared-token check (Yampi lets you append ?token=... to webhook URL)
    if (YAMPI_WEBHOOK_TOKEN) {
      const url = new URL(req.url);
      const provided =
        url.searchParams.get("token") ??
        req.headers.get("x-webhook-token") ??
        "";
      if (provided !== YAMPI_WEBHOOK_TOKEN) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload = await req.json().catch(() => ({}));
    const email = pickEmail(payload);
    const orderId = pickOrderId(payload);
    const event = pickEvent(payload, req.headers);
    const status = pickStatus(payload);
    const decision = decideStatus(event, status);
    const amount = pickAmount(payload);
    const productName = pickProductName(payload);
    const { plan, grants } = classifyPlan(amount);

    console.log("Yampi webhook", {
      event,
      status,
      email,
      orderId,
      decision,
      amount,
      productName,
      plan,
      grants,
    });

    if (!email || !decision) {
      return new Response(
        JSON.stringify({ ok: true, ignored: true, event, status }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (decision === "active") {
      if (!grants) {
        // Basic offer (R$ 5,99) — record the order but DO NOT grant access.
        // Don't overwrite an existing active grant from a previous Top purchase.
        const { data: existing } = await admin
          .from("access_grants")
          .select("status")
          .eq("email", email)
          .maybeSingle();

        if (existing?.status === "active") {
          console.log("Skipping basic order — user already has active access", { email });
        } else {
          const { error } = await admin.from("access_grants").upsert(
            {
              email,
              status: "manual_revoked",
              order_id: orderId,
              source: "yampi",
              plan,
              amount,
              product_name: productName,
              revoked_at: new Date().toISOString(),
            },
            { onConflict: "email" }
          );
          if (error) throw error;
        }
      } else {
        const { error } = await admin.from("access_grants").upsert(
          {
            email,
            status: "active",
            order_id: orderId,
            source: "yampi",
            plan,
            amount,
            product_name: productName,
            granted_at: new Date().toISOString(),
            revoked_at: null,
          },
          { onConflict: "email" }
        );
        if (error) throw error;
      }
    } else {
      // Refund / chargeback / cancel — always revoke.
      const { error } = await admin.from("access_grants").upsert(
        {
          email,
          status: decision,
          order_id: orderId,
          source: "yampi",
          plan,
          amount,
          product_name: productName,
          revoked_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ ok: true, email, status: decision, plan, amount, granted: grants }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("yampi-webhook error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
