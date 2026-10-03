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
import { reportUnhandledSaveFailure } from '../storage/saveFailureNotice';

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
let loading: Promise<SoundSafetyRecord | null> | null = null;
/**
 * THE LAST READ OF THE RECORD THREW (pattern catalog 2026-10-02, P1; wave 2).
 *
 * A read that failed is NOT "this person never accepted". The store stays
 * unloaded (`loaded` false) so the next `loadSoundSafetyAck()` reads again;
 * until a read succeeds, `isAcknowledged()` answers false.
 *
 * THE SAFE DIRECTION, CHOSEN ON PURPOSE: a failed read RE-ASKS. Showing the
 * warning to someone who already accepted it costs one tap; skipping it for
 * someone who never did costs their hearing and leaves no record. The one
 * write this module makes is a whole new acceptance, made by the person
 * holding the phone after reading the CURRENT text — writing it over a copy
 * that could not be read loses nothing it does not supersede (a version bump
 * replaces the record the same way). Nothing is ever written FROM the empty
 * placeholder a failed read leaves behind.
 */
let readFailed = false;
/**
 * Bumped by `resetSoundSafetyAck()` (the account wipe). A read or a write
 * that started under the departing person lands nowhere: a load in flight
 * across the wipe used to put the previous person's acceptance back in
 * `cached`, and the next person got sound with no warning and no record of
 * their own — the unsafe direction.
 */
let generation = 0;

/** The one place that decides whether the warning still needs showing. */
export function isAcknowledged(): boolean {
  return cached != null && cached.version >= SOUND_SAFETY_VERSION;
}

/** The stored record, for Help / Settings to display back to the user. */
export function acknowledgment(): SoundSafetyRecord | null {
  return cached;
}

/** True while the stored record could not be read (the warning is shown
 *  again until it can — see `readFailed`). */
export function isSoundSafetyAckUnreadable(): boolean {
  return readFailed;
}

function isRecord(v: unknown): v is SoundSafetyRecord {
  // A record without the fields that make it a record is not one.
  const r = v as SoundSafetyRecord | null;
  return r != null && typeof r === 'object' && typeof r.version === 'number' && typeof r.acceptedAt === 'string';
}

/**
 * Read the record once at app start. Corruption-safe in the house idiom
 * (patternStore / projectStore): a row that will not parse is MOVED to a
 * `:damaged` key rather than deleted, so nothing that might have been evidence
 * is destroyed by a parse error. A read that THROWS is different: nothing is
 * moved or written, and the next call reads again (see `readFailed`).
 */
export function loadSoundSafetyAck(): Promise<SoundSafetyRecord | null> {
  if (loaded) return Promise.resolve(cached);
  if (loading) return loading;
  const gen = generation;
  const p = (async (): Promise<SoundSafetyRecord | null> => {
    let raw: string | null;
    try {
      raw = await AsyncStorage.getItem(KEY);
    } catch {
      if (gen !== generation) return null;
      // READ failed: storage unavailable. Stay unloaded — the warning shows
      // again (the safe direction) and the next load reads again.
      readFailed = true;
      loading = null;
      return null;
    }
    if (gen !== generation) return null;
    let record: SoundSafetyRecord | null = null;
    if (raw) {
      let parsed: unknown = null;
      let ok = false;
      try {
        parsed = JSON.parse(raw);
        ok = isRecord(parsed);
      } catch {
        ok = false;
      }
      if (ok) {
        record = parsed as SoundSafetyRecord;
      } else {
        // Park it, then drop the original — only once it is parked, so a
        // failed park never destroys the only copy.
        try {
          await AsyncStorage.setItem(DAMAGED_KEY, raw);
          if (gen === generation) await AsyncStorage.removeItem(KEY);
        } catch {
          // best-effort: the original stays where it was
        }
      }
    }
    if (gen !== generation) return null;
    readFailed = false;
    loading = null;
    // An acceptance recorded while this read was out is newer than anything
    // the read found — never replace it with the older copy.
    if (!loaded) {
      cached = record;
      loaded = true;
    }
    return cached;
  })();
  loading = p;
  return p;
}

/**
 * Record an acceptance.
 *
 * Returns false if it could not be persisted — and the CALLER MUST NOT enable
 * sound on a false. An acknowledgment that was not recorded did not happen, and
 * silently proceeding would leave sound enabled with no evidence anyone agreed
 * to anything. Also false when the account changed while it was being written:
 * that acceptance was the departing person's, and the next one is asked.
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
  const gen = generation;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    // The gate then closes with audio off and says nothing of why: the
    // learner pressed ACCEPT, so the refusal is told (owner 2026-10-03).
    if (gen === generation) reportUnhandledSaveFailure();
    return false;
  }
  if (gen !== generation) {
    // The wipe ran while this was being written. Its sweep may already be
    // past, so the departing person's acceptance would sit on disk for the
    // next one — take it back (best-effort; at worst the next person is
    // asked again, which is the safe direction).
    await AsyncStorage.removeItem(KEY).catch(() => {});
    return false;
  }
  cached = record;
  loaded = true;
  readFailed = false;
  return true;
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
 *
 * It also bumps the generation (2026-10-02), so a read or write still in
 * flight from A cannot land after it.
 */
export function resetSoundSafetyAck(): void {
  generation++;
  cached = null;
  loaded = false;
  loading = null;
  readFailed = false;
}

/** Test seam, kept as the name the existing tests import. */
export const __resetSoundSafetyAckForTests = resetSoundSafetyAck;
