/* ============================================================
 *  SITE GATE settings.
 *  ------------------------------------------------------------
 *  GATE_ENABLED = true  -> visitors must type the key to get in.
 *  GATE_ENABLED = false -> site is fully public (use this at launch).
 *
 *  Set GATE_UNLOCK_KEY and GATE_COOKIE_TOKEN in the host env (Vercel).
 *
 *  SECURITY (vibe-security 2026-09-04): there are NO public fallback values
 *  here. A password or cookie token baked into the repo is readable by anyone
 *  with the source, and a fixed cookie token can be forged to skip the password
 *  entirely. So if the env vars are unset the gate FAILS CLOSED — it uses an
 *  unguessable per-process value, which leaves the site locked (the password
 *  won't validate) until you set the env vars, or set GATE_ENABLED = false to
 *  go fully public.
 * ============================================================ */

export const GATE_ENABLED = true;

// Fail closed: no repo-visible key/token. If the env secret is missing, use a
// random per-process value so nobody can guess the key or forge the cookie.
const failClosed = (): string => `unset-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;

export const UNLOCK_KEY = process.env.GATE_UNLOCK_KEY || failClosed();

export const GATE_COOKIE = "ape_gate";

export const GATE_TOKEN = process.env.GATE_COOKIE_TOKEN || failClosed();

if (GATE_ENABLED && (!process.env.GATE_UNLOCK_KEY || !process.env.GATE_COOKIE_TOKEN)) {
  // Surfaces in the build/runtime logs so a missing secret can't fail silently.
  console.warn(
    "[gate] GATE_UNLOCK_KEY / GATE_COOKIE_TOKEN not set — the gate is failing closed (site locked). " +
      "Set both in the host env, or set GATE_ENABLED = false to make the site public.",
  );
}
