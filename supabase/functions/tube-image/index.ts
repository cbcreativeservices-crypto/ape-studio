// Supabase Edge Function: tube-image
// ---------------------------------------------------------------------------
// Entitlement-gated signed-URL issuer for the SECURED Tube Reference (M5 / DB-5).
//
// The paid tube card images live in a PRIVATE bucket (no public read). This
// function is the only way the website obtains them: it verifies the caller's
// Supabase session AND an active `academy` entitlement server-side, then mints a
// short-lived signed URL for exactly one requested card page. The service-role
// key never leaves the server. A non-member (or signed-out caller) gets 403/401
// and never touches the bucket.
//
// Request:  POST { "stem": "01-12AX7", "page": 1 }  (Authorization: Bearer <jwt>)
// Response: 200 { "url": "https://…signed…" }  |  401 | 403 | 400
//
// Deploy:   supabase functions deploy tube-image --project-ref yjgolswjggmlpeowvtxr
// Env used (auto-provided to Edge Functions): SUPABASE_URL, SUPABASE_ANON_KEY,
//           SUPABASE_SERVICE_ROLE_KEY. Plus PRIVATE_TUBE_BUCKET (set as a secret;
//           defaults to 'tube-diagrams-secure').
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*", // tighten to the site origin in production
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = Deno.env.get("PRIVATE_TUBE_BUCKET") ?? "tube-diagrams-secure";
const SIGNED_TTL_SECONDS = 120;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  let stem = "";
  let page = 0;
  try {
    const body = await req.json();
    stem = String(body.stem ?? "");
    page = Number(body.page ?? 0);
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  // Defense-in-depth: strict shape, no path traversal.
  if (!/^[0-9]{2}-[A-Za-z0-9-]+$/.test(stem) || (page !== 1 && page !== 2)) {
    return json({ error: "bad_request" }, 400);
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // 1) Verify the caller's session with a user-scoped client.
  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);

  // 2) Require an active, non-expired academy entitlement (RLS scopes this
  //    select to the caller via ent_self_read).
  const { data: ents } = await userClient
    .from("entitlements")
    .select("status, expires_at")
    .eq("product", "academy");
  const acad = (ents ?? [])[0] as { status?: string; expires_at?: string | null } | undefined;
  const entitled =
    !!acad &&
    acad.status === "active" &&
    (!acad.expires_at || new Date(acad.expires_at).getTime() > Date.now());
  if (!entitled) return json({ error: "forbidden" }, 403);

  // 3) Validate the stem against the catalog (only real tubes).
  const { data: tube } = await userClient
    .from("tubes")
    .select("stem")
    .eq("stem", stem)
    .maybeSingle();
  if (!tube) return json({ error: "not_found" }, 404);

  // 4) Mint a short-lived signed URL with the service role (private bucket).
  const admin = createClient(url, service);
  const path = `${stem}-p${page}.png`;
  const { data: signed, error: signErr } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_TTL_SECONDS);
  if (signErr || !signed?.signedUrl) return json({ error: "unavailable" }, 502);

  return json({ url: signed.signedUrl });
});
