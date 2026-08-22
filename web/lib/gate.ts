/* ============================================================
 *  SITE GATE settings.
 *  ------------------------------------------------------------
 *  GATE_ENABLED = true  -> visitors must type the key to get in.
 *  GATE_ENABLED = false -> site is fully public (use this at launch).
 *
 *  Unlock key and cookie token: set GATE_UNLOCK_KEY and
 *  GATE_COOKIE_TOKEN in the host env (Vercel). Fallbacks below keep
 *  the current preview working until those are set; remove the
 *  fallbacks once env is in place.
 * ============================================================ */

export const GATE_ENABLED = true;

export const UNLOCK_KEY =
  process.env.GATE_UNLOCK_KEY ?? "audio2026";

export const GATE_COOKIE = "ape_gate";

export const GATE_TOKEN =
  process.env.GATE_COOKIE_TOKEN ?? "unlocked-ape-2026";
