// supabase/functions/employer-apply-finalize
// ---------------------------------------------------------------------------
// Step 1 of an employer application: record the network checks, then SEND A
// CONFIRMATION CODE to the work email. It no longer decides anything and no
// longer emails the owner — both of those moved to employer-confirm-email,
// because an application nobody has proved possession of is not yet news.
//
// Called with the APPLICANT'S OWN JWT, which is verified before the service
// role is used for anything. The service role is the tool, never the authority.
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

/** Six digits from the CSPRNG. Not Math.random — this is a credential. */
function makeCode(): string {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(a[0] % 1000000).padStart(6, "0");
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

  // 2 · is this application theirs? One RPC: service_role has SELECT on 5 of
  // 129 tables here and neither employer_applications nor users is one, so
  // direct .from() reads fail before RLS is ever consulted. The RPC folds the
  // ownership test into its WHERE so the join cannot be got wrong.
  const { data: appRows, error: readErr } = await admin.rpc("employer_application_for_finalize", {
    p_id: appId,
    p_auth_id: authUid,
  });
  if (readErr) return json({ ok: false, error: "lookup_failed" }, 500);
  const appRow = (Array.isArray(appRows) ? appRows[0] : appRows) as Record<string, unknown> | null;
  // not-found and not-yours are the same answer: otherwise this is an id oracle.
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

  // 4 · prove they hold the work mailbox.
  //
  // This is the only signal in the whole application an impostor cannot
  // supply: the company name is free text, the website is a domain they need
  // not own, and email_matches_site is a string comparison. So nothing is
  // decided here — employer_decide now refuses to auto-approve without
  // checks.work_email_confirmed_at, which only employer_confirm_work_email
  // can set.
  const workEmail = String(appRow.work_email ?? "");
  if (!workEmail) return json({ ok: false, error: "no_work_email" }, 400);

  const code = makeCode();
  const { error: issueErr } = await admin.rpc("employer_issue_email_code", {
    p_id: appId,
    p_code: code,
    p_sent_to: workEmail,
  });
  if (issueErr) return json({ ok: false, error: "code_failed" }, 500);

  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  // Sender (Comp A 2026-10-28): EMPLOYER_MAIL_FROM is the secret that is set;
  // EMAIL_FROM is not. The old fallback said "AP&E" (owner flagged it).
  const from = Deno.env.get("EMPLOYER_MAIL_FROM") ?? Deno.env.get("EMAIL_FROM") ??
    "Pro Audio Training Academy <notifications@proaudiotrainingacademy.com>";

  if (!resendKey) {
    // Say so rather than claiming it was sent — the applicant would wait for
    // an email that was never going to arrive.
    console.error("[employer-apply-finalize] no RESEND_API_KEY — confirmation code NOT sent");
    return json({ ok: false, error: "mail_unavailable" }, 503);
  }

  const company = esc(appRow.company_name);
  const html = `<div style="font:15px/1.6 -apple-system,Segoe UI,Arial,sans-serif;color:#111;">
    <p>Someone — we hope you — applied for a verified employer account for
       <b>${company}</b> on Pro Audio Training Academy, using this address.</p>
    <p>Your confirmation code is:</p>
    <p style="font:700 30px/1.2 -apple-system,Segoe UI,Arial,sans-serif;letter-spacing:6px;margin:18px 0;">${code}</p>
    <p>It expires in 30 minutes. Enter it on the application page to finish.</p>
    <p style="color:#667;">If this was not you, ignore this email — nothing happens without the code,
       and no employer account is created.</p>
  </div>`;

  try {
    const r = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [workEmail],
        subject: `Your Pro Audio Training Academy employer confirmation code: ${code}`,
        html,
      }),
    });
    if (!r.ok) {
      console.error("[employer-apply-finalize] resend rejected:", r.status, await r.text());
      return json({ ok: false, error: "mail_failed" }, 502);
    }
  } catch (e) {
    console.error("[employer-apply-finalize] send threw:", (e as Error).message);
    return json({ ok: false, error: "mail_failed" }, 502);
  }

  // The address is echoed back so the page can say WHERE it went — a typo in
  // the work email is otherwise indistinguishable from a slow mail server.
  return json({ ok: true, status: "code_sent", sent_to: workEmail });
});
