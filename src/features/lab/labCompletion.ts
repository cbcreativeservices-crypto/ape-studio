/**
 * labCompletion — device-local lab progress + the R6c lab-credit bridge
 * (owner spec 2026-08-12, D-LAB-7 resolved: labs DO feed certificate progress).
 *
 * The server owns LAB-level completion via the `mark_lab_complete` RPC: when a
 * user finishes every lab in the `audio_fundamentals` area, the backend marks
 * the gs3081 "Audio Fundamentals Lab" topic complete, which satisfies the
 * universal certificate/program requirement. MODULE-level structure stays
 * entirely client-side (handoff §3) — this store tracks which units a user has
 * cleared per lab and, when a lab hits its target, calls the RPC (idempotent).
 *
 * Completion rule (owner 2026-08-12):
 *   • module hubs / steps / sections → every unit VIEWED,
 *   • the two genuine challenges (Signal Detective, Gain Troubleshoot) → PASS,
 *   • read-through / sandbox labs → an explicit "Mark reviewed" action.
 * The required unit set per lab lives in LAB_UNITS below (registry-driven so the
 * counts are never hard-coded). A lab whose key is absent from LAB_UNITS never
 * auto-completes yet (Foundations steps / Mic & Speaker sections land in P3).
 *
 * Persistence: single `ape:labProgress` blob. It is device-local and is wiped
 * on account switch by clearLocalAccountData() (all `ape:*` keys) — critical, so
 * one user's viewed-modules never fire credit for the next user who signs in.
 * Tiny hand-rolled external store (same pattern as amplitudeOrientation).
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { emitStudyProgress } from '../study/sync';
import { WAVE_MODULES } from '../../screens/lab/wave/modules/registry';
import { DIGITAL_MODULES } from '../../screens/lab/digital/modules/registry';
import { METER_MODULES } from '../../screens/lab/meter/modules/registry';
import { GAIN_MODULES } from '../../screens/lab/gain/modules/registry';
// Pure data (zero React/Skia) — safe for this boot-loaded store.
import { CABLE_UNITS } from '../../screens/lab/cable/data/lessons';
import { CI_LAB_UNITS } from '../../screens/lab/cableinstall/registry';

const STORAGE_KEY = 'ape:labProgress';

/** Stable lab keys for the audio_fundamentals area (match the labs-catalog seed
 *  and the `key` on each fundamentals leaf in labCatalog.ts). IMMUTABLE.
 *  af_cables added 2026-08-15 (owner ruling: 12th required fundamentals lab,
 *  full certificate credit at launch; owner runs the seed SQL —
 *  docs/APE_CABLE_LAB_SEED_2026_08_15.sql). */
export type LabKey =
  | 'af_amplitude'
  | 'af_foundations'
  | 'af_sound_playground'
  | 'af_mic_principles'
  | 'af_wave_physics'
  | 'af_speaker_coverage'
  | 'af_digital_audio'
  | 'af_visual_analysis'
  | 'af_signal_chain'
  | 'af_signal_detective'
  | 'af_gain_staging'
  | 'af_cables'
  // Cable Dressing & Installation (owner brief 2026-08-24) — queued safely
  // until the owner runs docs/APE_CABLE_INSTALL_SEED_2026_08_24.sql.
  | 'af_cable_install';

/** The explicit-review unit (read-through / sandbox labs) and the challenge-pass
 *  unit (Signal Detective) — named so the wiring and the spec can't drift. */
export const REVIEW_UNIT = 'reviewed';
export const PASS_UNIT = 'pass';

/**
 * Required unit ids per lab. A lab auto-completes once every listed unit is
 * cleared. Hub units are the module registry ids (viewed on open); the two
 * challenges use a single PASS unit marked only on an actual pass; the
 * read-through/sandbox labs use a single REVIEW unit. Foundations steps and the
 * Mic/Speaker sections are added when those screens are wired (P3) — until then
 * they simply never auto-complete.
 */
export const LAB_UNITS: Partial<Record<LabKey, readonly string[]>> = {
  af_wave_physics: WAVE_MODULES.map((m) => m.id),
  af_digital_audio: DIGITAL_MODULES.map((m) => m.id),
  af_visual_analysis: METER_MODULES.map((m) => m.id),
  af_gain_staging: GAIN_MODULES.map((m) => m.id),
  af_signal_detective: [PASS_UNIT],
  af_amplitude: [REVIEW_UNIT],
  af_sound_playground: [REVIEW_UNIT],
  af_signal_chain: [REVIEW_UNIT],
  // Registry-derived (data/lessons.ts): lesson checks + tester + challenges +
  // per-question critical-safety units + final. STATIC entry (not only
  // registerLabUnits) so boot-time retryUnsent covers a finished-offline lab.
  af_cables: CABLE_UNITS,
  // Cable Dressing & Installation: 13 stage units + inspection pass + final
  // knowledge check (registry-derived; STATIC for offline retryUnsent).
  af_cable_install: CI_LAB_UNITS,
};

// ── in-memory state (mirrors persisted blob) ────────────────────────────────
let cleared: Record<string, Set<string>> = {};
let sent = new Set<string>(); // labs whose mark_lab_complete already succeeded
let afComplete = false; // last server-reported audio_fundamentals_complete
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

type PersistShape = { units?: Record<string, string[]>; sent?: string[]; af?: boolean };

function persist() {
  const units: Record<string, string[]> = {};
  for (const [k, set] of Object.entries(cleared)) if (set.size) units[k] = [...set];
  const blob: PersistShape = { units, sent: [...sent], af: afComplete };
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
}

function hydrate(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (!hydrating) {
    hydrating = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw != null) {
          const blob = JSON.parse(raw) as PersistShape;
          cleared = {};
          for (const [k, arr] of Object.entries(blob.units ?? {})) cleared[k] = new Set(arr);
          sent = new Set(blob.sent ?? []);
          afComplete = blob.af ?? false;
        }
      } catch {
        // corrupt/absent → keep defaults (nothing cleared)
      }
      hydrated = true;
      emit();
      // Flush any lab completed while signed-out or offline last run.
      void retryUnsent();
    })();
  }
  return hydrating;
}

// Warm at boot so lab screens read progress synchronously.
void hydrate();

// Labs whose unit set is screen-local (Foundations steps, Mic/Speaker sections)
// register it at runtime — so this boot-loaded store never imports those heavy
// Skia screens just to know their unit ids.
const dynamicUnits: Record<string, readonly string[]> = {};

/** Declare a lab's required unit set from its screen (call on mount). Also
 *  re-checks completion in case the persisted units already satisfy it (e.g. a
 *  lab finished offline/signed-out last run, now re-opened while authed). */
export function registerLabUnits(labKey: LabKey, unitIds: readonly string[]): void {
  dynamicUnits[labKey] = unitIds;
  void hydrate().then(() => {
    if (isLabComplete(labKey) && !sent.has(labKey)) void fireComplete(labKey);
  });
}

function unitsFor(labKey: string): readonly string[] | undefined {
  return dynamicUnits[labKey] ?? LAB_UNITS[labKey as LabKey];
}

/** Whether every required unit for a lab has been cleared locally. */
export function isLabComplete(labKey: string): boolean {
  const req = unitsFor(labKey);
  if (!req || req.length === 0) return false;
  const c = cleared[labKey];
  return !!c && req.every((u) => c.has(u));
}

/** {cleared, total} for an optional lab-progress meter. total 0 = untracked. */
export function labProgress(labKey: string): { cleared: number; total: number } {
  const req = unitsFor(labKey);
  const total = req?.length ?? 0;
  const c = cleared[labKey];
  const done = req && c ? req.filter((u) => c.has(u)).length : 0;
  return { cleared: done, total };
}

/** Last server-reported audio_fundamentals_complete (for "credit earned" UI). */
export function audioFundamentalsComplete(): boolean {
  return afComplete;
}

/** Stable "is this lab done" for display — server-confirmed (sent) OR locally
 *  complete. `sent` persists across launches, so a lab whose credit already
 *  landed still reads done even before its screen re-registers its units. */
export function isLabDone(labKey: string): boolean {
  return sent.has(labKey) || isLabComplete(labKey);
}

/** Reactive per-lab done flag (catalog checkmarks). Accepts any lab key. */
export function useLabDone(labKey: string): boolean {
  const [v, setV] = useState(() => isLabDone(labKey));
  useEffect(() => {
    const l = () => setV(isLabDone(labKey));
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
  }, [labKey]);
  return v;
}

/** Reactive cleared-unit set for a lab — hub homes tick the modules a user
 *  has already viewed/passed (design+learning pass 2026-08-31: both the
 *  Digital and Meter reviews independently flagged "11 rows, zero memory of
 *  which you've seen"). Returns a fresh Set per change so React re-renders. */
export function useLabClearedUnits(labKey: string): ReadonlySet<string> {
  const read = () => new Set(cleared[labKey] ?? []);
  const [v, setV] = useState<ReadonlySet<string>>(read);
  useEffect(() => {
    const l = () => setV(read());
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labKey]);
  return v;
}

/** Reactive "Audio Fundamentals credit earned" flag (Dashboard banner). */
export function useAudioFundamentalsComplete(): boolean {
  const [v, setV] = useState(afComplete);
  useEffect(() => {
    const l = () => setV(afComplete);
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return v;
}

async function fireComplete(labKey: string): Promise<void> {
  if (sent.has(labKey)) return;
  try {
    const { data, error } = await supabase.rpc('mark_lab_complete', { p_lab_key: labKey });
    if (error) {
      // user_not_found (not signed in) or lab_not_found (seed missing/typo):
      // leave UNSENT so it retries on the next markUnit / next app boot / login.
      console.warn('[lab-complete] rpc rejected', labKey, error.message);
      return;
    }
    sent.add(labKey);
    const af = (data as { audio_fundamentals_complete?: boolean } | null)?.audio_fundamentals_complete;
    if (typeof af === 'boolean') afComplete = af;
    persist();
    emit();
    // gs3081 topic may now be complete server-side → nudge the Dashboard to refetch.
    emitStudyProgress();
  } catch {
    // network error — stay unsent, retry next time.
  }
}

/** Retry mark_lab_complete for every lab that is locally complete but unsent. */
async function retryUnsent(): Promise<void> {
  for (const labKey of Object.keys(LAB_UNITS)) {
    if (isLabComplete(labKey) && !sent.has(labKey)) await fireComplete(labKey);
  }
}

/**
 * Record that the user cleared one unit of a lab (a module viewed, a section
 * seen, a challenge passed, or the explicit review). Idempotent per unit; fires
 * mark_lab_complete the first time the lab reaches its target.
 */
export function markLabUnit(labKey: LabKey, unitId: string): void {
  void hydrate().then(() => {
    const set = cleared[labKey] ?? new Set<string>();
    if (set.has(unitId)) return; // already recorded — no-op
    set.add(unitId);
    cleared[labKey] = set;
    persist();
    emit();
    if (isLabComplete(labKey)) void fireComplete(labKey);
  });
}

/** Explicit "Mark reviewed" for the read-through / sandbox labs. */
export function markLabReviewed(labKey: LabKey): void {
  markLabUnit(labKey, REVIEW_UNIT);
}

/** Reset in-memory caches on account switch (called by resetAllLocalStores();
 *  the persisted `ape:labProgress` key is removed by clearLocalAccountData). */
export function resetLocal(): void {
  cleared = {};
  sent = new Set<string>();
  afComplete = false;
  emit();
}

/** Live lab progress for a screen: {complete, cleared, total}. */
export function useLabCompletion(labKey: LabKey): { complete: boolean; cleared: number; total: number } {
  const read = () => {
    const { cleared: c, total } = labProgress(labKey);
    return { complete: isLabComplete(labKey), cleared: c, total };
  };
  const [snap, setSnap] = useState(read);
  useEffect(() => {
    const l = () => setSnap(read());
    listeners.add(l);
    void hydrate().then(l);
    return () => {
      listeners.delete(l);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labKey]);
  return snap;
}
