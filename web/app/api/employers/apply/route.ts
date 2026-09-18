import { NextResponse } from "next/server";

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
  const domain = String(body.domain ?? "").toLowerCase();
  if (!/^[0-9a-f-]{36}$/i.test(appId) || !/^[a-z0-9.-]{3,253}$/.test(domain)) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
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
