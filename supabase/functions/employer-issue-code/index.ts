// supabase/functions/employer-issue-code
// ---------------------------------------------------------------------------
// Mint a six-digit code, store its hash, and mail it to the WORK address on an
// employer application.
//
// ⛔ NOT DEPLOYED YET (written 2026-09-20). See `_DEPLOY_NOTES.md` beside this
//    file. The calling code is written to fail SAFE: if this function is not
//    deployed, the invoke fails, no `sent_to` comes back, and the apply form
//    falls through to "your application was saved, a person will review it" —
//    which is true. Nothing claims a code was sent unless one was.
//
// ── WHY THIS EXISTS ────────────────────────────────────────────────────────
//
// The database half of work-email verification was built on 2026-09-19
// (`employer_issue_email_code`, `employer_confirm_work_email`, and the
// `employer_decide` rule that queues anything with an unconfirmed address).
// Nothing ever called it. The apply flow probed the domain, emailed the ADMIN,
// and returned `{ ok: true }` — which the form read as "code sent" and told
// the applicant so, in bold, with their address in it. No mail was ever sent,
// there was no exit from that screen, and every application landed permanently
// flagged WORK EMAIL NOT CONFIRMED, which also blocked auto-approval.
//
// The badge this protects means "this person holds a mailbox at this company".
// It used to be a string comparison, and the owner's standing rule is that it
// must require actual possession — so the code has to really be sent, and
// really be checked.
//
// ── WHY AN EDGE FUNCTION ───────────────────────────────────────────────────
//
// `employer_issue_email_code` is service_role only, and mailing needs
// RESEND_API_KEY. Both are already injected here; neither belongs in the Next
// server. Same reasoning as employer-apply-finalize, which this mirrors.
//
// ── AUTHORISATION ──────────────────────────────────────────────────────────
//
// Called with the APPLICANT'S OWN JWT, verified first. Ownership is proved by
// `employer_application_for_finalize`, whose WHERE folds in the auth_id — a
// row comes back only if the application belongs to this caller. The service
// role is the tool, never the authority.
//
// ⛔ THE ADDRESS COMES FROM THE ROW, NEVER FROM THE REQUEST BODY. If the caller
//    could name the destination, the whole check would be theatre: an impostor
//    would simply send the code to themselves.
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_URL = "https://api.resend.com/emails";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Six digits from the CSPRNG, not Math.random.
 *
 * A code that gates a verification badge is a credential for as long as it
 * lives. `crypto.getRandomValues` is available in Deno Deploy and costs
 * nothing here; the modulo bias across 2^32 into 900000 is negligible and the
 * value is single-use and short-lived regardless.
 */
function sixDigits(): string {
  const b = new Uint32Array(1);
  crypto.getRandomValues(b);
  return String(100000 + (b[0] % 900000));
}

/** Show the applicant enough to recognise the address, not the whole of it. */
function maskEmail(addr: string): string {
  const [user, host] = addr.split("@");
  if (!host) return addr;
  const head = user.slice(0, 2);
  return `${head}${"•".repeat(Math.max(1, user.length - 2))}@${host}`;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!url || !anon || !service) return json({ ok: false, error: "misconfigured" }, 500);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ ok: false, error: "unauthorized" }, 401);

  let body: { application_id?: string };
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

  // 2 · is this application theirs, and what address did they claim?
  const { data: appRows, error: readErr } = await admin.rpc("employer_application_for_finalize", {
    p_id: appId,
    p_auth_id: authUid,
  });
  if (readErr) return json({ ok: false, error: "lookup_failed" }, 500);
  const appRow = (Array.isArray(appRows) ? appRows[0] : appRows) as Record<string, unknown> | null;
  // Not-found and not-yours are deliberately the same answer — anything else
  // is an id oracle. Same rule as employer-apply-finalize.
  if (!appRow) return json({ ok: false, error: "not_found" }, 404);

  const workEmail = String(appRow.work_email ?? "").trim();
  if (!workEmail || !workEmail.includes("@")) return json({ ok: false, error: "no_work_email" }, 400);

  // 3 · mail FIRST, record second.
  //
  // ⛔ ORDER MATTERS AND THIS ORDER IS DELIBERATE. Recording first and then
  //    failing to send would invalidate the code the applicant is holding from
  //    a previous attempt while giving them no new one — the worst of both.
  //    Sending first can at worst deliver a code that was never stored, and
  //    the applicant simply requests another. A code that does not work is
  //    recoverable; a code that silently replaced a working one is not.
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMPLOYER_MAIL_FROM") ?? Deno.env.get("MAIL_FROM");
  if (!resendKey || !from) return json({ ok: false, error: "mail_unavailable" }, 503);

  const code = sixDigits();
  const company = esc(appRow.company_name);

  const mail = await fetch(RESEND_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [workEmail],
      subject: `Your Pro Audio Training Academy confirmation code: ${code}`,
      html:
        `<p>Someone applied for an employer account for <strong>${company}</strong> and gave this address as their work email.</p>` +
        `<p style="font-size:28px;letter-spacing:6px;font-weight:700;margin:24px 0">${code}</p>` +
        `<p>Enter it on the application page to confirm you hold this mailbox. It expires shortly.</p>` +
        `<p style="color:#666">If this was not you, ignore this message — nothing is approved without this code.</p>`,
    }),
  }).catch(() => null);

  if (!mail || !mail.ok) return json({ ok: false, error: "mail_failed" }, 502);

  // 4 · now store it (hashed by the SQL function, which owns that decision)
  const { error: issueErr } = await admin.rpc("employer_issue_email_code", {
    p_id: appId,
    p_code: code,
    p_sent_to: workEmail,
  });
  if (issueErr) return json({ ok: false, error: "issue_failed" }, 500);

  // The masked address is what the form echoes back. Returning the full
  // address would be handing it to whoever is holding the session, which is
  // not necessarily the mailbox owner — that is the whole point of the check.
  return json({ ok: true, sent_to: maskEmail(workEmail) });
});
