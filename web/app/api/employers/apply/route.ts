import { NextResponse } from "next/server";
import { isPublicHostname } from "../../../../lib/publicHostname";

/**
 * POST /api/employers/apply — the network half of employer verification.
 *
 * ── WHY THIS EXISTS AT ALL ─────────────────────────────────────────────────
 *
 * Two of the five auto-approval conditions are facts about the internet, and
 * Postgres cannot fetch a URL. So the browser submits, the DATABASE records the
 * application and computes every string-derived signal itself (which is why
 * those cannot be forged), and this route adds only what it had to go and look
 * up: does the domain resolve, and does the site answer.
 *
 * ── WHAT THIS ROUTE IS NOT TRUSTED WITH ────────────────────────────────────
 *
 * It does not decide anything. It forwards the applicant's own JWT to the
 * `employer-apply-finalize` Edge Function, which re-verifies that token, checks
 * the application belongs to that user, and only then uses the service role to
 * store the remote facts and ask the database for a decision.
 *
 * That indirection is deliberate: it keeps the service-role key out of this
 * Next.js server entirely. A key here would be reachable by every route in the
 * site; there it is reachable by one function that does one thing.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Vercel's default can be shorter than probe + finalize + mail. */
export const maxDuration = 30;

/**
 * ── SSRF GUARD (2026-09-19, audit) ─────────────────────────────────────────
 *
 * This route makes the SERVER fetch a URL, so whatever decides that URL is a
 * security control. It used to be `body.domain`, validated only against
 * /^[a-z0-9.-]{3,253}$/ — which accepts `localhost`, `metadata`, and bare
 * literals like `169.254.169.254` or `10.0.0.5`. Any signed-in user could
 * make our Vercel server issue an HTTPS GET to an arbitrary host and read
 * back the status and up to 200 characters of <title>, which then travelled
 * into the reviewer email. An internal probe with an exfiltration channel.
 *
 * The domain now comes from the APPLICATION, computed by employer_domain_of
 * in Postgres, which the applicant cannot forge. This guard is the second
 * line: a public hostname has a dot and a letter-initial TLD, and is never an
 * IP literal or a private range.
 */

/** Give up quickly. A slow site is a QUEUE reason, not a reason to hang. */
const PROBE_TIMEOUT_MS = 6000;

type Remote = {
  domain_resolves: boolean;
  site_reachable: boolean;
  site_status: number | null;
  site_title: string | null;
};

/**
 * Look the company up, the way a person would: open the site.
 *
 * `fetch` failing with a DNS error and `fetch` failing because the server is
 * down are different facts, and a reviewer reads them differently — "the domain
 * does not exist" is close to disqualifying, "the site did not answer today" is
 * not. Node reports the first as ENOTFOUND/EAI_AGAIN in the error cause, so the
 * two are separated rather than collapsed into one "unreachable".
 */
async function probe(domain: string): Promise<Remote> {
  const out: Remote = {
    domain_resolves: false,
    site_reachable: false,
    site_status: null,
    site_title: null,
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`https://${domain}/`, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "ProAudioTrainingAcademy-EmployerCheck/1.0" },
    });
    // It answered, so the name resolved.
    out.domain_resolves = true;
    out.site_status = res.status;
    out.site_reachable = res.ok || (res.status >= 300 && res.status < 400);
    const type = res.headers.get("content-type") ?? "";
    if (type.includes("text/html")) {
      const html = (await res.text()).slice(0, 20000);
      const m = /<title[^>]*>([\s\S]{0,200}?)<\/title>/i.exec(html);
      if (m) out.site_title = m[1].replace(/\s+/g, " ").trim().slice(0, 200);
    }
  } catch (e) {
    const code = String((e as { cause?: { code?: string } })?.cause?.code ?? "");
    // A DNS failure means the name does not exist. Anything else (refused,
    // timeout, TLS) means it exists but did not answer — a weaker signal, and
    // the reviewer should see which one it was.
    out.domain_resolves = !(code === "ENOTFOUND" || code === "EAI_AGAIN");
  } finally {
    clearTimeout(timer);
  }
  return out;
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!SUPABASE_URL) {
    return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 500 });
  }

  let body: { application_id?: string; domain?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const appId = String(body.application_id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(appId)) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // ── THE DOMAIN COMES FROM THE APPLICATION, NOT THE REQUEST ───────────────
  //
  // Read with the applicant's OWN token: employer_application_mine is RLS-
  // scoped to them, so this both fetches the server-computed domain and
  // re-proves the application is theirs before we fetch anything.
  //
  // It also fixes a second, quieter bug: the browser's domain normalisation
  // is not the same algorithm as employer_domain_of, which strips whitespace
  // globally. A trailing space from a paste ("acme.com ") passed the DATABASE
  // and created the application, then failed this route's regex — 400,
  // finalize never ran, application stranded pending with nobody told.
  if (!SUPABASE_ANON) {
    return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 500 });
  }
  const mineRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/employer_application_mine`, {
    method: "POST",
    headers: {
      Authorization: auth,
      apikey: SUPABASE_ANON,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  const mine = await mineRes.json().catch(() => null);
  const row = (Array.isArray(mine) ? mine[0] : mine) as
    | { id?: string; checks?: { site_domain?: string } }
    | null;
  if (!row || row.id !== appId) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const domain = String(row.checks?.site_domain ?? "").toLowerCase();
  if (!isPublicHostname(domain)) {
    // The application exists and is theirs; we simply will not probe this.
    // Recorded as "did not resolve" so the reviewer sees a queue reason
    // rather than the application silently going nowhere.
    const res0 = await fetch(`${SUPABASE_URL}/functions/v1/employer-apply-finalize`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        application_id: appId,
        remote: { domain_resolves: false, site_reachable: false, site_status: null, site_title: null },
      }),
    });
    const out0 = await res0.json().catch(() => ({ ok: false, error: "finalize_failed" }));
    return NextResponse.json(out0, { status: res0.ok ? 200 : res0.status });
  }

  const remote = await probe(domain);

  // Forward the USER'S token. This route never holds a service-role key.
  const res = await fetch(`${SUPABASE_URL}/functions/v1/employer-apply-finalize`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ application_id: appId, remote }),
  });

  const out = await res.json().catch(() => ({ ok: false, error: "finalize_failed" }));
  return NextResponse.json(out, { status: res.ok ? 200 : res.status });
}
