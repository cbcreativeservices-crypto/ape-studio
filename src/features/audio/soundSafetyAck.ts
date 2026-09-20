/**
 * soundSafetyAck — the first-use Sound Safety acknowledgment, and its record.
 *
 * Owner 2026-09-17. The app already refuses to make a sound until the user
 * deliberately enables output (audioOutputStore + AudioOutputGate's 5-second
 * hold), and that gate is per-session. THIS is different and sits in front of
 * it: a once-ever, versioned acknowledgment that the user has read what this
 * app can do to their hearing and their equipment.
 *
 * ── WHY IT PERSISTS WHEN THE OUTPUT GATE DELIBERATELY DOES NOT ───────────────
 *
 * `audioOutputStore` is session-only ON PURPOSE — every launch starts silent,
 * and that is a safety property worth keeping. This store is the opposite:
 * it is a RECORD, not a setting. It answers "did this person read the warning,
 * when, and which words did they agree to" — a question that must survive
 * relaunches, because re-showing a legal acknowledgment every session is how
 * people learn to tap through it without reading.
 *
 * ── WHAT IS RECORDED, AND WHY EACH FIELD ─────────────────────────────────────
 *
 * Not a boolean. A boolean cannot answer the only questions that matter after
 * an incident: what did it say, and had it changed since? So:
 *   • `version`   — bump it and every user sees the warning again (see below);
 *   • `text`      — the EXACT wording accepted, stored verbatim, because the
 *                   wording is the thing agreed to and this file will be edited;
 *   • `acceptedAt`— ISO timestamp;
 *   • `appVersion`— which build was running;
 *   • `userId`    — who, where a real account exists.
 *
 * ── WHERE IT IS STORED, AND THE GAP THAT LEAVES ──────────────────────────────
 *
 * Device-local (AsyncStorage) for now, which is the honest limit of what ccode
 * can ship alone: a server-side record needs a table, and a table is a backend
 * change. THIS IS A KNOWN GAP and it matters — a device-local record is lost on
 * reinstall, which is exactly when someone would want to produce it. The
 * intended destination is a server row keyed by user id; see
 * docs/APE_SOUND_SAFETY_GATE.md.
 *
 * NOTE this is a deliberate exception to the app's "contact email stays
 * device-local by decision" rule (store-privacy decisions, 2026-09-17). That
 * rule is about not COLLECTING personal data the app does not need. This is an
 * evidence artifact about a hearing-damage warning, which is a different
 * purpose and needs to outlive the device.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Bump this WHENEVER THE WARNING'S MEANING CHANGES and every user is shown it
 * again. Do not bump for a typo; do bump for anything that changes what is
 * being agreed to.
 *
 * v1 — 2026-09-17, first issue.
 */
// v2 (2026-09-20): the shake-to-mute and exposure-check-in clauses both
// stated a protection that can degrade silently — see soundSafetyText.ts.
export const SOUND_SAFETY_VERSION = 2;

const KEY = 'ape:soundSafety:v1';
/** Where a record that could not be written is parked, rather than lost. */
const DAMAGED_KEY = `${KEY}:damaged`;

export type SoundSafetyRecord = {
  version: number;
  /** ISO 8601, device clock. */
  acceptedAt: string;
  /** The exact words accepted, verbatim. */
  text: string;
  appVersion: string | null;
  userId: string | null;
};

/** In-memory mirror so a guard can read this synchronously, like the gate does. */
let cached: SoundSafetyRecord | null = null;
let loaded = false;

/** The one place that decides whether the warning still needs showing. */
export function isAcknowledged(): boolean {
  return cached != null && cached.version >= SOUND_SAFETY_VERSION;
}

/** The stored record, for Help / Settings to display back to the user. */
export function acknowledgment(): SoundSafetyRecord | null {
  return cached;
}

/**
 * Read the record once at app start. Corruption-safe in the house idiom
 * (patternStore / projectStore): a row that will not parse is MOVED to a
 * `:damaged` key rather than deleted, so nothing that might have been evidence
 * is destroyed by a parse error.
 */
export async function loadSoundSafetyAck(): Promise<SoundSafetyRecord | null> {
  if (loaded) return cached;
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as SoundSafetyRecord;
      // A record without the fields that make it a record is not one.
      if (typeof parsed?.version === 'number' && typeof parsed?.acceptedAt === 'string') {
        cached = parsed;
        return cached;
      }
      await AsyncStorage.setItem(DAMAGED_KEY, raw);
      await AsyncStorage.removeItem(KEY);
    } catch {
      await AsyncStorage.setItem(DAMAGED_KEY, raw);
      await AsyncStorage.removeItem(KEY);
    }
  } catch {
    // Storage unavailable. Returning null means the warning shows again, which
    // is the safe direction to fail in.
  }
  return null;
}

/**
 * Record an acceptance.
 *
 * Returns false if it could not be persisted — and the CALLER MUST NOT enable
 * sound on a false. An acknowledgment that was not recorded did not happen, and
 * silently proceeding would leave sound enabled with no evidence anyone agreed
 * to anything.
 */
export async function recordSoundSafetyAck(input: {
  text: string;
  appVersion: string | null;
  userId: string | null;
}): Promise<boolean> {
  const record: SoundSafetyRecord = {
    version: SOUND_SAFETY_VERSION,
    acceptedAt: new Date().toISOString(),
    text: input.text,
    appVersion: input.appVersion,
    userId: input.userId,
  };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(record));
    cached = record;
    loaded = true;
    return true;
  } catch {
    return false;
  }
}

/**
 * Drop the in-memory record. Called by `resetAllLocalStores()` on every account
 * change, and by the tests.
 *
 * WHY THIS IS NOT MERELY TIDY (2026-09-17, bug-hunt pass 2). The account wipe
 * deletes the stored key, but `cached` is a module-level variable that survives
 * it, and `isAcknowledged()` reads `cached` and nothing else. So after user A
 * signed out, user B - or a guest - turned on audio and the hearing-damage
 * warning did not appear, because the app still believed A's acceptance.
 *
 * It is worse than a skipped dialog. This module exists to produce an evidence
 * record of exactly what text a person accepted before sound was allowed, and
 * no record was written for B at all - so the one person who actually used the
 * app has no acceptance on file.
 */
export function resetSoundSafetyAck(): void {
  cached = null;
  loaded = false;
}

/** Test seam, kept as the name the existing tests import. */
export const __resetSoundSafetyAckForTests = resetSoundSafetyAck;
