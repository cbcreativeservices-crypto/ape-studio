// supabase/functions/employer-apply-finalize
// ---------------------------------------------------------------------------
// Finish an employer application: record the network checks, let the database
// decide, and email the owner with a subject Gmail can filter on.
//
// ── WHY AN EDGE FUNCTION AND NOT A NEXT ROUTE ──────────────────────────────
//
// It needs the service role (employer_decide is service-role only) AND the
// Resend key. Edge Functions get SUPABASE_SERVICE_ROLE_KEY injected and already
// hold RESEND_API_KEY for on-weekly-concept. Doing it in the website would mean
// putting both secrets into the web env, and a service-role key sitting in a
// Next.js server is a far larger blast radius than one function doing one job.
//
// ── AUTHORISATION ──────────────────────────────────────────────────────────
//
// Called with the APPLICANT'S OWN JWT. That token is verified, and the
// application is confirmed to belong to them, BEFORE the service role is used
// for anything. The service role is the tool here, never the authority.
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_URL = "https://api.resend.com/emails";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

type Remote = {
  domain_resolves: boolean;
  site_reachable: boolean;
  site_status: number | null;
  site_title: string | null;
  checked_at: string;
};

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * The subject line is the deliverable here.
 *
 * Owner: "send it to email with a traceable heading so gmail can filter and
 * process for me into buckets." Gmail filters reliably on SUBJECT — custom
 * headers are not dependable — so the tags lead and must never move:
 *
 *   [APE-EMPLOYER][REVIEW]   needs you
 *   [APE-EMPLOYER][AUTO-OK]  already approved, for the record
 *
 * Gmail filter:  subject:"[APE-EMPLOYER][REVIEW]"  → its own label; the AUTO-OK
 * bucket can skip the inbox entirely.
 *
 * The short id at the end makes one application findable by search months
 * later, and it is the same id the admin list shows.
 */
function subjectFor(outcome: string, company: string, domain: string, id: string): string {
  const tag = outcome === "approved" ? "AUTO-OK" : "REVIEW";
  return `[APE-EMPLOYER][${tag}] ${company} · ${domain} · APP-${id.slice(0, 8)}`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!url || !anon || !service) return json({ ok: false, error: "misconfigured" }, 500);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ ok: false, error: "unauthorized" }, 401);

  let body: { application_id?: string; remote?: Partial<Remote> };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }
  const appId = String(body.application_id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(appId)) return json({ ok: false, error: "bad_request" }, 400);

  // 1 · who is calling
  const asUser = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data: auth } = await asUser.auth.getUser();
  const authUid = auth.user?.id;
  if (!authUid) return json({ ok: false, error: "unauthorized" }, 401);

  const admin = createClient(url, service);

  // 2 · is this application theirs?
  //
  // ── ONE RPC, NOT TWO TABLE READS (2026-09-19) ───────────────────────────
  // This used to .from("employer_applications") and .from("users") directly.
  // service_role has SELECT on 5 of 129 tables in this project and neither of
  // those is one of them, so BOTH reads failed, this returned 500
  // lookup_failed, and the two RPCs below were never reached — while the
  // application row already existed and the form had told the applicant
  // "Application received".
  //
  // The RPC is SECURITY DEFINER, granted to service_role only, and folds the
  // ownership test into its WHERE: a row comes back only if it belongs to
  // this auth_id, so the join cannot be got wrong here.
  const { data: appRows, error: readErr } = await admin.rpc("employer_application_for_finalize", {
    p_id: appId,
    p_auth_id: authUid,
  });
  if (readErr) return json({ ok: false, error: "lookup_failed" }, 500);
  const appRow = (Array.isArray(appRows) ? appRows[0] : appRows) as Record<string, unknown> | null;
  // Not found and not-yours are deliberately the same answer: telling a caller
  // that an application id EXISTS but is not theirs is an id oracle.
  if (!appRow) return json({ ok: false, error: "not_found" }, 404);

  // 3 · record what the web app found on the network, under its own key
  const remote: Remote = {
    domain_resolves: body.remote?.domain_resolves === true,
    site_reachable: body.remote?.site_reachable === true,
    site_status: typeof body.remote?.site_status === "number" ? body.remote.site_status : null,
    site_title: body.remote?.site_title ? String(body.remote.site_title).slice(0, 200) : null,
    checked_at: new Date().toISOString(),
  };
  await admin.rpc("employer_apply_remote_checks", { p_id: appId, p_remote: remote });

  // 4 · the database decides. Auto-approve only what verifies itself.
  const { data: decided, error: decideErr } = await admin.rpc("employer_decide", { p_id: appId });
  if (decideErr) return json({ ok: false, error: "decide_failed" }, 500);
  const row = (Array.isArray(decided) ? decided[0] : decided) as
    | { outcome?: string; reasons?: string[] }
    | null;
  const outcome = row?.outcome ?? "pending";
  const reasons = row?.reasons ?? [];

  // 5 · tell the owner.
  //
  // A failure HERE must not fail the application. The applicant did their part,
  // and a lost email is recoverable from the admin list — a lost application is
  // not. So this is wrapped and never changes the response.
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const to = Deno.env.get("ADMIN_NOTIFY_EMAIL") ?? "";
  const from = Deno.env.get("EMAIL_FROM") ??
    "AP&E Pro Audio Training <notifications@proaudiotrainingacademy.com>";

  if (resendKey && to) {
    const a = appRow as Record<string, unknown>;
    const checks = (a.checks ?? {}) as Record<string, unknown>;
    const domain = String(checks.site_domain ?? "");
    const subject = subjectFor(outcome, String(a.company_name ?? ""), domain, appId);
    const line = (k: string, v: unknown) =>
      `<tr><td style="padding:3px 14px 3px 0;color:#667;">${esc(k)}</td><td style="padding:3px 0;"><b>${esc(v)}</b></td></tr>`;

    const html = `<div style="font:14px/1.55 -apple-system,Segoe UI,Arial,sans-serif;color:#111;">
      <p style="font:700 12px/1.4 Arial;letter-spacing:1.5px;color:#a67c00;margin:0 0 6px;">
        ${outcome === "approved" ? "AUTO-APPROVED" : "NEEDS YOUR REVIEW"}
      </p>
      <h2 style="margin:0 0 14px;">${esc(a.company_name)}</h2>
      <table style="border-collapse:collapse;">
        ${line("Website", a.company_website)}
        ${line("Work email", a.work_email)}
        ${line("Role", a.role_title)}
        ${line("Hiring for", a.hiring_for ?? "—")}
        ${line("Email at company domain", checks.email_matches_site ? "yes" : "NO")}
        ${line("Consumer mailbox", checks.free_mail ? "YES" : "no")}
        ${line("Domain resolves", remote.domain_resolves ? "yes" : "NO")}
        ${line("Site answers", remote.site_reachable ? `yes (${remote.site_status})` : "NO")}
        ${line("Application", `APP-${appId.slice(0, 8)}`)}
      </table>
      ${
      reasons.length
        ? `<p style="margin-top:16px;"><b>Queued because:</b></p><ul>${
          reasons.map((r) => `<li>${esc(r)}</li>`).join("")
        }</ul>`
        : `<p style="margin-top:16px;color:#1c7a4a;">Every check passed, so this was approved automatically. Nothing to do — this is for the record, and the badge can be revoked at any time.</p>`
    }
    </div>`;

    try {
      await fetch(RESEND_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
          // Not relied on for filtering — Gmail is unreliable with custom
          // headers — but useful in other clients and when grepping an export.
          headers: { "X-APE-Category": outcome === "approved" ? "employer-auto" : "employer-review" },
        }),
      });
    } catch (e) {
      console.error("[employer-apply-finalize] notify failed:", (e as Error).message);
    }
  } else {
    console.warn("[employer-apply-finalize] no RESEND_API_KEY or ADMIN_NOTIFY_EMAIL — no email sent");
  }

  return json({ ok: true, outcome, reasons });
});
