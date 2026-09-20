// supabase/functions/employer-confirm-email
// ---------------------------------------------------------------------------
// Step 2 of an employer application: the applicant enters the code that was
// mailed to their WORK address. Possession of that mailbox is the only signal
// in the whole application an impostor cannot supply, so this is the step the
// verified-employer badge actually rests on.
//
// The confirmation and the decision both happen inside
// employer_confirm_work_email (SECURITY DEFINER, applicant-callable, proves
// ownership itself and then calls employer_decide as the owner). This
// function exists for ONE further reason: the outcome email. SQL cannot reach
// Resend, and the owner needs exactly one message per application, at the
// point the outcome is known.
//
// Called with the APPLICANT'S OWN JWT. No service role is used to decide
// anything — it is used only to send the notification afterwards.
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_URL = "https://api.resend.com/emails";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * The subject line is the deliverable.
 *
 * Owner: all mail lands in ONE inbox (info@…) and Gmail filters are the only
 * sorting mechanism available. Gmail filters reliably on SUBJECT — custom
 * headers are not dependable — so these tags LEAD and must never move:
 *
 *   [APE-EMPLOYER][REVIEW]   needs a human
 *   [APE-EMPLOYER][AUTO-OK]  already approved, for the record
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

  let body: { application_id?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }
  const appId = String(body.application_id ?? "");
  const code = String(body.code ?? "").replace(/\D/g, "");
  if (!/^[0-9a-f-]{36}$/i.test(appId) || code.length !== 6) {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  // The confirmation runs AS THE APPLICANT. The function proves the
  // application is theirs; we deliberately do not use the service role for
  // this, so a bug here cannot confirm somebody else's application.
  const asUser = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await asUser.rpc("employer_confirm_work_email", {
    p_id: appId,
    p_code: code,
  });

  if (error) {
    // The RPC's messages are already written for a human ("that code is not
    // right", "that code has expired — request a new one", "too many attempts
    // — request a new code"), so pass them through rather than flattening
    // every failure into one unhelpful string.
    return json({ ok: false, error: error.message }, 400);
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | { outcome?: string; reasons?: string[] }
    | null;
  const outcome = row?.outcome ?? "pending";
  const reasons = row?.reasons ?? [];

  // Already-confirmed is not an error and not news — do not re-notify.
  if (outcome === "already_confirmed") return json({ ok: true, outcome, reasons: [] });

  // ── tell the owner. A failure here must NEVER fail the confirmation. ─────
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const to = Deno.env.get("ADMIN_NOTIFY_EMAIL") ?? "";
  const from = Deno.env.get("EMAIL_FROM") ??
    "AP&E Pro Audio Training <notifications@proaudiotrainingacademy.com>";

  if (resendKey && to) {
    try {
      const admin = createClient(url, service);
      const { data: rows } = await admin.rpc("employer_application_for_finalize", {
        p_id: appId,
        p_auth_id: (await asUser.auth.getUser()).data.user?.id ?? "",
      });
      const a = ((Array.isArray(rows) ? rows[0] : rows) ?? {}) as Record<string, unknown>;
      const checks = (a.checks ?? {}) as Record<string, unknown>;
      const remote = (checks.remote ?? {}) as Record<string, unknown>;
      const domain = String(checks.site_domain ?? "");
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
          ${line("Work email CONFIRMED", "yes — code entered")}
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
          }</ul><p>Approve or reject it from the admin list.</p>`
          : `<p style="margin-top:16px;color:#1c7a4a;">Every check passed, including possession of the work mailbox, so this was approved automatically. Nothing to do — this is for the record, and the badge can be revoked at any time.</p>`
      }
      </div>`;

      await fetch(RESEND_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [to],
          subject: subjectFor(outcome, String(a.company_name ?? ""), domain, appId),
          html,
          headers: { "X-APE-Category": outcome === "approved" ? "employer-auto" : "employer-review" },
        }),
      });
    } catch (e) {
      console.error("[employer-confirm-email] notify failed:", (e as Error).message);
    }
  } else {
    console.warn("[employer-confirm-email] no RESEND_API_KEY or ADMIN_NOTIFY_EMAIL — owner NOT told");
  }

  return json({ ok: true, outcome, reasons });
});
