// supabase/functions/employer-confirm-email
// ---------------------------------------------------------------------------
// Check a six-digit code against an employer application and, if it matches,
// mark the work email confirmed and let the database re-decide.
//
// ⛔ NOT DEPLOYED YET (written 2026-09-20). See `_NOT_DEPLOYED.md`.
//
// ── WHY THIS FILE DID NOT EXIST ────────────────────────────────────────────
//
// `EmployerApplyForm.tsx` has been invoking `employer-confirm-email` since the
// verification work landed. There was no such function. `supabase/functions/`
// held six directories and this was not one of them, so step two of the flow
// returned a transport error for every applicant — which the form rendered as
// "That did not work. Check the code and try again," a message that sent
// people back to re-enter a code that had never been sent in the first place.
//
// ── WHY SO THIN ────────────────────────────────────────────────────────────
//
// `employer_confirm_work_email(p_id, p_code)` is SECURITY DEFINER and granted
// to `authenticated`, so it already runs as the caller, already proves
// ownership, already compares the hash, already handles expiry and attempt
// limits, and already writes the human-readable failure text. Re-implementing
// any of that here would be a second, drifting copy of a decision the database
// owns.
//
// So this function exists for exactly one reason: the browser client cannot
// call the RPC with the applicant's JWT through `functions.invoke`, which is
// the call the form makes. It verifies the caller, forwards, and returns what
// the database said.
//
// ⛔ NO SERVICE ROLE HERE, ON PURPOSE. The RPC is granted to `authenticated`
//    and enforces ownership itself. Reaching for the service role would
//    replace a check the database is already doing correctly with a check this
//    file would have to do — and get right — by hand.
import { createClient } from "jsr:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  if (!url || !anon) return json({ ok: false, error: "misconfigured" }, 500);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ ok: false, error: "unauthorized" }, 401);

  let body: { application_id?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }
  const appId = String(body.application_id ?? "");
  const code = String(body.code ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(appId)) return json({ ok: false, error: "bad_request" }, 400);
  // Shape only. Whether it is the RIGHT code, whether it has expired, and how
  // many attempts are left are all the database's to answer.
  if (!/^[0-9]{6}$/.test(code)) return json({ ok: false, error: "That code should be six digits." }, 400);

  const asUser = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data: auth } = await asUser.auth.getUser();
  if (!auth.user?.id) return json({ ok: false, error: "unauthorized" }, 401);

  const { data, error } = await asUser.rpc("employer_confirm_work_email", {
    p_id: appId,
    p_code: code,
  });
  if (error) {
    // The RPC writes its refusals for a human ("that code is not right",
    // "that code has expired — request a new one"). Pass them straight
    // through; flattening them into one line is what made this screen
    // unhelpful in the first place.
    return json({ ok: false, error: error.message || "That did not work. Check the code and try again." }, 400);
  }

  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  if (row && row.ok === false) return json({ ok: false, error: String(row.error ?? "not_confirmed") }, 400);

  return json({ ok: true, outcome: String(row?.outcome ?? "confirmed") });
});
