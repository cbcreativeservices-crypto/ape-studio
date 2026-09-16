// lab-audio — returns a short-lived SIGNED URL for a converted lab-audio asset,
// gated per-asset by access_tier (public | free | academy). Mirrors tube-image.
// verify_jwt = false so 'public' assets work without a token; free/academy validate
// the caller's JWT inside. Service-role key never leaves the function.
//
// Client contract:
//   POST { lab_key, asset_key }  (+ Authorization: Bearer <user JWT> for free/academy)
//   200 -> { url, ext, duration_ms, samplerate, channels, access_tier }
//   401 sign_in_required | 403 academy_required | 404 not_found

import { createClient } from "jsr:@supabase/supabase-js@2";

const BUCKET = "lab-audio";
const TTL = 120; // seconds

const CORS = {
  "Access-Control-Allow-Origin": "*", // TIGHTEN to the site origin before launch
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: { lab_key?: string; asset_key?: string };
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const lab_key = (body.lab_key ?? "").toString();
  const asset_key = (body.asset_key ?? "").toString();
  if (!lab_key || !asset_key) return json({ error: "lab_key_and_asset_key_required" }, 400);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // published asset row for this (lab_key, asset_key)
  const { data: asset, error: aErr } = await admin
    .from("lab_audio_assets")
    .select("path, ext, duration_ms, samplerate, channels, access_tier")
    .eq("lab_key", lab_key).eq("asset_key", asset_key).eq("published", true)
    .maybeSingle();
  if (aErr) return json({ error: "lookup_failed", detail: aErr.message }, 500);
  if (!asset) return json({ error: "not_found" }, 404);

  // per-tier gate
  if (asset.access_tier !== "public") {
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = token ? await admin.auth.getUser(token) : { data: { user: null } };
    const user = u?.user ?? null;
    if (!user) return json({ error: "sign_in_required" }, 401);

    if (asset.access_tier === "academy") {
      const { data: ent } = await admin
        .from("entitlements")
        .select("id")
        .eq("user_id", user.id).eq("product", "academy").eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(1).maybeSingle();
      if (!ent) return json({ error: "academy_required" }, 403);
    }
  }

  const { data: signed, error: sErr } = await admin.storage.from(BUCKET).createSignedUrl(asset.path, TTL);
  if (sErr || !signed) return json({ error: "sign_failed", detail: sErr?.message }, 500);

  return json({
    url: signed.signedUrl,
    ext: asset.ext,
    duration_ms: asset.duration_ms,
    samplerate: asset.samplerate,
    channels: asset.channels,
    access_tier: asset.access_tier,
  });
});
