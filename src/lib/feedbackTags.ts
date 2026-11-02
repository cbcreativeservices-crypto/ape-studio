/**
 * Pure builders for the feedback email's filter tag, reference code and
 * machine data line (Comp A handoff 2026-11-02: Gmail filters + a twice-daily
 * Claude sweep on info@). No React Native imports, so the unit test runs them
 * directly; `feedback.ts` supplies the device values.
 *
 * Subject: `[APE-<CODE>] <existing phrase>[ — <tag>] (ref APE-XXXXXX)`
 * Data:    `APE-DATA v1 | ref=… | kind=… | src=app | os=… | …`
 */

export type FeedbackTagKind = 'bug' | 'term' | 'definition' | 'suggestion' | 'correction' | 'question';

/** The stable code Gmail filters on. Never change one: filters depend on it. */
export const FEEDBACK_CODE: Record<FeedbackTagKind, string> = {
  bug: 'BUG',
  term: 'TERM',
  definition: 'DEF',
  suggestion: 'IDEA',
  correction: 'FIX',
  question: 'HELP',
};

/** No 0/O, 1/I/L — a ref the member may read out over the phone. */
export const REF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Matches every ref this module makes. */
export const REF_PATTERN = /^APE-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;

/** The data line is cut here so a mailto body stays well inside client limits. */
export const DATA_LINE_MAX = 1500;

/** `APE-` + 6 characters. Not a secret — only a handle to quote back. */
export function makeFeedbackRef(rand: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += REF_ALPHABET[Math.min(REF_ALPHABET.length - 1, Math.floor(rand() * REF_ALPHABET.length))];
  }
  return `APE-${s}`;
}

export function buildFeedbackSubject(kind: FeedbackTagKind, phrase: string, ref: string, tag?: string): string {
  const base = tag ? `${phrase} — ${tag}` : phrase;
  return `[APE-${FEEDBACK_CODE[kind]}] ${base} (ref ${ref})`;
}

/** A value never breaks the line or the field separator. */
function cleanValue(v: string): string {
  return v.replace(/[|\r\n]+/g, '/').trim();
}

/** Keys are lowercased with spaces → `_` (and `|`/`=` dropped). */
function cleanKey(k: string): string {
  return k.trim().toLowerCase().replace(/\s+/g, '_').replace(/[|=\r\n]/g, '');
}

export type DataField = [key: string, value: string | number | null | undefined];

/**
 * `APE-DATA v1 | k=v | …`. Empty, null and undefined fields are DROPPED (a
 * signed-out member has no `tier=`/`sid=`, never `tier=undefined`). Later
 * duplicate keys are dropped too, so a caller's context can't shadow the
 * fixed fields. Cut to DATA_LINE_MAX.
 */
export function buildDataLine(fields: DataField[]): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const [k, raw] of fields) {
    if (raw == null) continue;
    const key = cleanKey(k);
    const value = cleanValue(`${raw}`);
    if (!key || !value || seen.has(key)) continue;
    seen.add(key);
    parts.push(`${key}=${value}`);
  }
  const line = ['APE-DATA v1', ...parts].join(' | ');
  return line.length > DATA_LINE_MAX ? line.slice(0, DATA_LINE_MAX) : line;
}

/**
 * Who is sending, merged into every email's APE-DATA line without touching the
 * call sites. Student id from Settings' existing my_identity read; role from
 * the Profile employer section's existing my_verifier_kind read. The tier is
 * NOT here: it comes from the provider's leaf mirror (memberStanding
 * reportedTier) so the app-start graph gains no module. Cleared on sign-out
 * through the local-store reset registry (resetAllLocalStores), so the next
 * account never inherits it (feedback.ts registers the reset; this file stays
 * import-free so its unit test runs bare).
 */
export type FeedbackIdentity = { tier?: string; studentId?: string; role?: string };
let identity: FeedbackIdentity = {};

/** Merge into the current identity. A key passed as '' or undefined CLEARS that field. */
export function setFeedbackIdentity(next: FeedbackIdentity): void {
  const merged: FeedbackIdentity = { ...identity };
  for (const k of ['tier', 'studentId', 'role'] as const) {
    if (!(k in next)) continue;
    const v = next[k];
    if (v) merged[k] = v;
    else delete merged[k];
  }
  identity = merged;
}

export function getFeedbackIdentity(): FeedbackIdentity {
  return identity;
}

export function clearFeedbackIdentity(): void {
  identity = {};
}
