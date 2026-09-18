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

/* ------------------------------------------------------------------
 *  TEMPORARY UNLOCK WINDOW
 *  ------------------------------------------------------------------
 *  An absolute UTC instant. While now < this, the gate stands aside and
 *  the site is public; after it, the gate is back with NO second deploy.
 *
 *  Why a clock and not "flip the flag off, flip it back on later":
 *  GATE_ENABLED is a constant in the repo, so turning it back on needs a
 *  second commit + build. If that second one is forgotten, delayed, or
 *  fails, the pre-launch site stays public indefinitely and nothing says
 *  so. An expiry cannot forget. The unsafe state is the one with the
 *  short life, which is the right way round.
 *
 *  Set to "" (empty) when there is no window — that is the normal state.
 * ------------------------------------------------------------------ */
const UNLOCK_UNTIL = "";

/**
 * Is the gate standing guard for THIS request?
 *
 * Called per request, never read into a module constant: middleware modules
 * are evaluated once per cold start and then reused, so a constant would
 * freeze whatever the answer was at boot and a warm instance would keep
 * serving the site wide open long after the window shut.
 */
export function gateActive(): boolean {
  if (!GATE_ENABLED) return false;
  if (!UNLOCK_UNTIL) return true;
  const until = Date.parse(UNLOCK_UNTIL);
  // An unparseable date must not open the door.
  if (!Number.isFinite(until)) return true;
  return Date.now() >= until;
}

// Fail closed: no repo-visible key/token. If the env secret is missing, use a
// random per-process value so nobody can guess the key or forge the cookie.
const failClosed = (): string => `unset-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;

/**
 * Read a gate secret from the env, tolerating the one paste mistake that is
 * almost guaranteed to happen: a trailing newline or space.
 *
 * Why this is not fussiness (2026-09-11): these values are pasted by hand into
 * the Vercel dashboard, and selecting a line in a text editor very often takes
 * the line break with it. The unlock route already trims what the VISITOR
 * types, so an env value carrying "\n" can never equal a submitted key — the
 * correct password is rejected, with no error anywhere, and the symptom is
 * indistinguishable from a missing variable. Trim on the way in and the whole
 * failure mode disappears.
 */
const readSecret = (raw: string | undefined): string | undefined => {
  const v = raw?.trim();
  return v ? v : undefined;
};

const envUnlockKey = readSecret(process.env.GATE_UNLOCK_KEY);
const envCookieToken = readSecret(process.env.GATE_COOKIE_TOKEN);

export const UNLOCK_KEY = envUnlockKey || failClosed();

export const GATE_COOKIE = "ape_gate";

export const GATE_TOKEN = envCookieToken || failClosed();

if (GATE_ENABLED && (!envUnlockKey || !envCookieToken)) {
  // Surfaces in the build/runtime logs so a missing secret can't fail silently.
  console.warn(
    "[gate] GATE_UNLOCK_KEY / GATE_COOKIE_TOKEN not set — the gate is failing closed (site locked). " +
      "Set both in the host env, or set GATE_ENABLED = false to make the site public.",
  );
}

// The two secrets do different jobs and must never hold the same string: the
// cookie token is what the gate ACCEPTS INSTEAD of the password, so if the two
// are equal then anyone who learns the password can also forge the cookie.
// This also catches the values being pasted into each other's variable, which
// is easy to do because the dashboard re-sorts its rows after every save.
if (GATE_ENABLED && envUnlockKey && envCookieToken && envUnlockKey === envCookieToken) {
  console.warn(
    "[gate] GATE_UNLOCK_KEY and GATE_COOKIE_TOKEN hold the SAME value. " +
      "They must differ — the cookie token bypasses the password entirely.",
  );
}
