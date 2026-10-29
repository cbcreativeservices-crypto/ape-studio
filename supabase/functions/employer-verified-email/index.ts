// supabase/functions/employer-verified-email
// ---------------------------------------------------------------------------
// "You're verified: what to do next" to the APPLICANT (must-do D23, owner
// 2026-10-28). Automatic and manual approvals both end in the same write —
// employer_applications.status becomes 'approved' — so ONE database trigger
// (Comp A: AFTER UPDATE OF status, pg_net, service-role JWT from Vault) calls
// this with { "application_id": "<uuid>" }. employer-confirm-email keeps
// mailing only the owner, so an applicant never gets two copies.
//
// Once only: employer_claim_verified_email(uuid) (service_role only) returns
// the row AND stamps checks.verified_email_sent_at in one statement, and
// returns nothing if the application is not approved or was already mailed.
// If the send then fails, employer_release_verified_email(uuid) clears the
// stamp so a later re-approval can try again. The service role cannot read
// employer_applications directly here (see employer-apply-finalize), hence RPCs.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { buildEmail } from "./email.ts";

const RESEND_URL = "https://api.resend.com/emails";
const SUBJECT = "You're verified on Pro Audio Training Academy: next steps";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// Same check as community-push: the trigger sends the legacy service-role JWT
// from Vault; verify_jwt has already checked its signature, so its role claim
// is safe to accept.
function isServiceRoleJwt(auth: string): boolean {
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const part = token.split(".")[1];
  if (!part) return false;
  try {
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)));
    return claims?.role === "service_role" && claims?.ref === "yjgolswjggmlpeowvtxr";
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !service) return json({ ok: false, error: "misconfigured" }, 500);
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${service}` && !isServiceRoleJwt(auth)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  let body: { application_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }
  const appId = String(body.application_id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(appId)) return json({ ok: false, error: "bad_request" }, 400);

  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  if (!resendKey) {
    // Nothing is claimed, so a later re-approval can still send it.
    console.error("[employer-verified-email] no RESEND_API_KEY — applicant NOT told");
    return json({ ok: false, error: "mail_unavailable" }, 503);
  }

  const db = createClient(url, service, { auth: { persistSession: false } });
  const { data, error } = await db.rpc("employer_claim_verified_email", { p_id: appId });
  if (error) return json({ ok: false, error: "claim_failed" }, 500);
  const row = (Array.isArray(data) ? data[0] : data) as
    | { work_email?: string; company_name?: string; kind?: string }
    | null;
  // Not approved, unknown id, or already mailed: nothing to do, not an error.
  if (!row?.work_email) return json({ ok: true, sent: false });

  const from = Deno.env.get("EMPLOYER_MAIL_FROM") ?? Deno.env.get("EMAIL_FROM") ??
    "Pro Audio Training Academy <notifications@proaudiotrainingacademy.com>";
  const replyTo = Deno.env.get("EMAIL_REPLY_TO") ?? "";
  const { html, text } = buildEmail(String(row.kind ?? "employer"), String(row.company_name ?? ""));

  try {
    const r = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [row.work_email],
        subject: SUBJECT,
        html,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
        headers: { "X-APE-Category": "employer-verified" },
      }),
    });
    if (!r.ok) throw new Error(`resend ${r.status}: ${await r.text()}`);
  } catch (e) {
    console.error("[employer-verified-email] send failed:", (e as Error).message);
    await db.rpc("employer_release_verified_email", { p_id: appId });
    return json({ ok: false, error: "mail_failed" }, 502);
  }

  return json({ ok: true, sent: true });
});
