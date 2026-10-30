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
import { getLabPreview } from './labPreviewStore';
import { flushSessionWork, holdSessionWork, onSessionCarrySettled, registerSessionCarry, sessionHasNoAccount, sessionIsSettledAccount, sessionWipePending } from './sessionCarry';
import { reportUnhandledSaveFailure } from '../storage/saveFailureNotice';
import { WAVE_MODULES } from '../../screens/lab/wave/modules/registry';
import { DIGITAL_MODULES } from '../../screens/lab/digital/modules/registry';
import { METER_MODULES } from '../../screens/lab/meter/modules/registry';
import { GAIN_MODULES } from '../../screens/lab/gain/modules/registry';
// Pure data (zero React/Skia) — safe for this boot-loaded store.
import { CABLE_UNITS } from '../../screens/lab/cable/data/lessons';
import { CI_LAB_UNITS } from '../../screens/lab/cableinstall/registry';
import { PATCHBAY_UNITS } from '../../screens/lab/patchbay/units';
import { CONNECTOR_SELECT_UNITS } from '../../screens/lab/connectorselect/units';
import { FOUNDATIONS_UNITS } from '../../screens/lab/foundations/units';
import { MIC_PRINCIPLES_UNITS, SPEAKER_COVERAGE_UNITS } from '../../screens/lab/micspeaker/units';
import { noteHighValueEvent } from '../review/reviewPrompt';

const STORAGE_KEY = 'ape:labProgress';

/** Stable lab keys for the audio_fundamentals area (match the labs-catalog seed
 *  and the `key` on each fundamentals leaf in labCatalog.ts). IMMUTABLE.
 *  af_cables added 2026-08-15 (owner ruling: 12th required fundamentals lab,
 *  full certificate credit at launch; its seed, docs/APE_CABLE_LAB_SEED_2026_08_15.sql,
 *  was run — the live `labs` row is dated 2026-08-18, checked 2026-10-27). */
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
  // Cable Dressing & Installation (owner brief 2026-08-24). Its seed,
  // docs/APE_CABLE_INSTALL_SEED_2026_08_24.sql, WAS RUN: the live `labs` row
  // is dated 2026-08-24 (checked 2026-10-27). Before that the completion was
  // kept unsent and retried; it is accepted now.
  | 'af_cable_install'
  // Patchbay Signal Flow & Normalling (owner ruling 2026-09-10: everything in
  // the Audio Fundamentals container is part of the fundamentals requisite).
  // Its seed, docs/APE_PATCHBAY_LAB_SEED_2026_09_10.sql, WAS RUN: live row
  // dated 2026-09-11 (checked 2026-10-27). The lab_not_found guard (unsent +
  // retried) is still what protects any key whose row is missing.
  | 'af_patchbay'
  // Audio Connectors & Cable Selection (owner brief 2026-09-11; same
  // fundamentals-container ruling). Its seed,
  // docs/APE_CONNECTOR_SELECT_SEED_2026_09_11.sql, WAS RUN: live row dated
  // 2026-09-11 (checked 2026-10-27).
  | 'af_connector_select';

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
  // Patchbay: one unit per PagedLab page, p1..p23 (STATIC for offline
  // retryUnsent; the screen dev-checks this count against its real page array).
  af_patchbay: PATCHBAY_UNITS,
  // Audio Connectors & Cable Selection: one unit per PagedLab page, p1..p16
  // (STATIC for offline retryUnsent; same dev-check in the screen).
  af_connector_select: CONNECTOR_SELECT_UNITS,
  // Foundations course steps + the Mic/Speaker sections. These three registered
  // their units ONLY at runtime (registerLabUnits on mount), which left
  // retryUnsent() — which runs at BOOT, before any lab screen mounts — with
  // nothing to check: a lab finished offline or signed-out was never retried
  // until the learner reopened it. Same React-free units.ts pattern as above;
  // the ids are unchanged (Foundations = step INDEX as a string, Mic/Speaker =
  // section key), so progress already banked on device still counts.
  af_foundations: FOUNDATIONS_UNITS,
  af_mic_principles: MIC_PRINCIPLES_UNITS,
  af_speaker_coverage: SPEAKER_COVERAGE_UNITS,
};

// ── in-memory state (mirrors persisted blob) ────────────────────────────────
let cleared: Record<string, Set<string>> = {};
let sent = new Set<string>(); // labs whose mark_lab_complete already succeeded
let afComplete = false; // last server-reported audio_fundamentals_complete
let hydrated = false;
let hydrating: Promise<void> | null = null;
/** Bumped by resetLocal (the account wipe): a device read or a
 *  mark_lab_complete answer that was out when the wipe ran belongs to the
 *  departing account and lands nowhere (evening pass 1, 2026-10-02). */
let completionGen = 0;
/** A unit (or a `sent`) was recorded while the read had failed, so persist()
 *  wrote nothing: the next successful read writes it (evening pass 2). */
let unsaved = false;
/** The last device read THREW (owner 2026-10-03, "do 2"): until a read
 *  succeeds, the cleared units in memory are this session's only — not the
 *  learner's record — and the hubs say so instead of showing no ticks. Only
 *  a successful read (or the account wipe) clears it. Read-only state. */
let lastReadFailed = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

type PersistShape = { units?: Record<string, string[]>; sent?: string[]; af?: boolean };

function persist() {
  // ⛔ NEVER OVER A COPY THAT COULD NOT BE READ (full run 2, 2026-10-01): a
  // failed device read used to leave this store "hydrated" and empty, and the
  // next unit's write replaced every unit banked before it.
  if (!hydrated) {
    unsaved = true;
    return;
  }
  unsaved = false;
  const units: Record<string, string[]> = {};
  for (const [k, set] of Object.entries(cleared)) if (set.size) units[k] = [...set];
  const blob: PersistShape = { units, sent: [...sent], af: afComplete };
  // A unit the device refused is told to the learner (owner 2026-10-03: "if
  // it fails the user needs to know") — never the departing account's write.
  const gen = completionGen;
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(blob)).catch(() => {
    if (gen === completionGen) reportUnhandledSaveFailure();
  });
}

function hydrate(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (!hydrating) {
    const gen = completionGen;
    hydrating = (async () => {
      let raw: string | null;
      try {
        raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (gen !== completionGen) return;
      } catch {
        if (gen !== completionGen) return;
        // The READ failed (not "nothing stored"): stay unhydrated — persist()
        // writes nothing — and read again on the next call (full run 2,
        // 2026-10-01). Units recorded meanwhile live in memory and are merged
        // with what the next read finds.
        lastReadFailed = true;
        hydrating = null;
        emit();
        return;
      }
      try {
        if (raw != null) {
          const blob = JSON.parse(raw) as PersistShape;
          // Merged, never replaced: memory is empty on a first read, and on a
          // read retried after a failure it holds this session's units.
          for (const [k, arr] of Object.entries(blob.units ?? {})) cleared[k] = new Set([...arr, ...(cleared[k] ?? [])]);
          sent = new Set([...(blob.sent ?? []), ...sent]);
          afComplete = afComplete || (blob.af ?? false);
        }
      } catch {
        // corrupt → keep defaults (nothing cleared)
      }
      hydrated = true;
      lastReadFailed = false;
      // Units (and a server `sent`) shown while the read had failed were never
      // written; they are now, merged with what was stored — or a unit the
      // screen showed as cleared was gone on the next launch.
      if (unsaved) persist();
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

/**
 * TRAINING CREDIT (owner 2026-10-13: "tie the labs into the certificates").
 * Every key in trainingLabKeys (tr_ / mk_ / mxb_ / mxa_ / ear_) rides THIS
 * store: one unit, TRAINING_DONE_UNIT, recorded when the lab's own store says
 * it is complete (the completion rule lives with each source — see
 * trainingCompletion.ts). Same blob, same sent/unsent queue, same preview
 * rule, guest carry and account wipe as the af_* labs — one reporting path.
 */
export const TRAINING_DONE_UNIT = 'done';

/**
 * The SHAPE of a training key (tr_ / mk_ / mxb_ / mxa_ / ear_). Shape only, on
 * purpose: this store is in the app-START graph (clearLocalAccountData), and
 * importing trainingLabKeys here would grow it (test/perfStartTrim). The exact
 * lists are enforced where keys are made — trainingSignal refuses anything
 * trainingLabKeys.isTrainingKey does not know, and the backfill only builds
 * keys from those lists. test/trainingCompletion_20261013 pins that every
 * real key matches this shape and that no af_* key or labId does.
 */
const TRAINING_KEY_SHAPE = /^(?:tr|mk|mxb|mxa|ear)_[A-Za-z0-9_]+$/;
export function isTrainingKeyShape(key: string): boolean {
  return TRAINING_KEY_SHAPE.test(key);
}
const isTrainingKey = isTrainingKeyShape;
const TRAINING_UNITS: readonly string[] = [TRAINING_DONE_UNIT];

function unitsFor(labKey: string): readonly string[] | undefined {
  return dynamicUnits[labKey] ?? LAB_UNITS[labKey as LabKey] ?? (isTrainingKey(labKey) ? TRAINING_UNITS : undefined);
}

/** Keys the server's `labs` table can hold: the af_* fundamentals and the
 *  training keys. Units banked under any other id (a PagedLab/LabShell
 *  `labId` whose understanding check was passed — 'sound-systems-learn',
 *  'envelope', …) are device-local records only; sending them could only
 *  ever answer lab_not_found, forever. Their credit reaches the server as the
 *  lab's tr_ key (trainingKeyForCheck). */
function isServerLabKey(labKey: string): boolean {
  return Object.prototype.hasOwnProperty.call(LAB_UNITS, labKey) || isTrainingKey(labKey);
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
    // `live`: a hydrate that lands after this effect was replaced (a new key)
    // or unmounted must not write the OLD key's value (pattern hunt P2/P11,
    // 2026-10-02 — newest wins).
    let live = true;
    void hydrate().then(() => {
      if (live) l();
    });
    return () => {
      live = false;
      listeners.delete(l);
    };
  }, [labKey]);
  return v;
}

/** `prev` when `next` holds exactly the same units (pure; exported for the
 *  perf receipt). A fresh Set is still returned on any real change. */
export function keepIfSameSet(prev: ReadonlySet<string>, next: ReadonlySet<string>): ReadonlySet<string> {
  if (prev.size !== next.size) return next;
  for (const u of next) if (!prev.has(u)) return next;
  return prev;
}

/** Reactive cleared-unit set for a lab — hub homes tick the modules a user
 *  has already viewed/passed (design+learning pass 2026-08-31: both the
 *  Digital and Meter reviews independently flagged "11 rows, zero memory of
 *  which you've seen"). Returns a fresh Set per change so React re-renders. */
export function useLabClearedUnits(labKey: string): ReadonlySet<string> {
  const read = () => new Set(cleared[labKey] ?? []);
  const [v, setV] = useState<ReadonlySet<string>>(read);
  useEffect(() => {
    // Same units ⇒ the SAME Set, so React skips the render (perf hunt
    // 2026-10-03): the mount-time hydrate and every unit banked in ANY lab
    // re-rendered every mounted lab screen and hub — the whole page tree —
    // with an identical copy.
    const l = () => setV((prev) => keepIfSameSet(prev, read()));
    listeners.add(l);
    // `live`: a hydrate that lands after this effect was replaced (a new key)
    // or unmounted must not write the OLD key's value (pattern hunt P2/P11,
    // 2026-10-02 — newest wins).
    let live = true;
    void hydrate().then(() => {
      if (live) l();
    });
    return () => {
      live = false;
      listeners.delete(l);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labKey]);
  return v;
}

/** Reactive: which of `keys` are done (isLabDone) — a lab whose credit is one
 *  KEY PER PAGE (the Mixing labs' mxb_/mxa_ keys) reads its banked pages with
 *  this, so START OVER (PRACTICE) never shows banked credit as missing.
 *  Unchanged ⇒ the same Set (no re-render). Pass a stable `keys` array. */
export function useLabKeysDone(keys: readonly string[]): ReadonlySet<string> {
  const read = () => new Set(keys.filter(isLabDone));
  const [v, setV] = useState<ReadonlySet<string>>(read);
  useEffect(() => {
    const l = () => setV((prev) => keepIfSameSet(prev, read()));
    listeners.add(l);
    let live = true;
    void hydrate().then(() => {
      if (live) l();
    });
    return () => {
      live = false;
      listeners.delete(l);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys]);
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

/** One mark_lab_complete per key in flight (toddler pass 2026-10-13): the
 *  unit's own fire, the hydrate retry, the settle retry and the backfill's
 *  retry all run within moments of a sign-in, and each saw the key "not sent
 *  yet" while the first call was still out — the same key went 2–4 times
 *  (×212 keys for a learner with everything done). Keyed by the account
 *  generation, so a call left over from a departing account never stands in
 *  for the next account's own. */
const inFlight = new Map<string, Promise<void>>();
function fireComplete(labKey: string): Promise<void> {
  if (sent.has(labKey)) return Promise.resolve();
  const id = `${completionGen}:${labKey}`;
  const running = inFlight.get(id);
  if (running) return running;
  const p = fireCompleteOnce(labKey).finally(() => {
    inFlight.delete(id);
  });
  inFlight.set(id, p);
  return p;
}

async function fireCompleteOnce(labKey: string): Promise<void> {
  if (sent.has(labKey)) return;
  // NOT WHILE A NEW IDENTITY'S WIPE IS PENDING (guest wave, 2026-10-04; owner
  // "not if they sign out or close app first"). Between a sign-in and its
  // device wipe, the units in memory are the device's previous occupant's —
  // a guest who closed the app before signing in (their units were stored,
  // and the boot read loaded them), or work done after a sign-out. Sent in
  // that window, mark_lab_complete credited THEM to the account just signed
  // into. It waits: `onSessionCarrySettled` retries, and a same-session
  // guest's units are replayed by the ledger after the wipe and sent then.
  if (sessionWipePending()) return;
  const gen = completionGen;
  // Only keys the server can hold (see isServerLabKey).
  if (!isServerLabKey(labKey)) return;
  // TRAINING CREDIT: GUESTS NEVER SEND (owner 2026-10-13). A KNOWN no-account
  // session's call could only answer user_not_found; the unit stays unsent,
  // the guest carry replays it into the account signed into in this session,
  // and `onSessionCarrySettled` sends it then. An UNKNOWN session (the
  // launch's first auth answer still out) is not a guest (D57). The af_* labs
  // keep their existing behaviour.
  if (isTrainingKey(labKey) && sessionHasNoAccount()) return;
  try {
    const { data, error } = await supabase.rpc('mark_lab_complete', { p_lab_key: labKey });
    // The account changed while the call was out: that answer was about the
    // departing account. Marking it sent here would put it in the NEXT
    // account's record, whose own completion would then never be sent.
    if (gen !== completionGen) return;
    if (error) {
      // user_not_found (not signed in) or lab_not_found (seed missing/typo —
      // or a training key whose `labs` row the backend has not added YET:
      // the app can ship before the rows land): leave UNSENT so it retries on
      // the next markUnit / next app boot / login. Never dropped.
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

/** Retry mark_lab_complete for every lab that is locally complete but unsent:
 *  the af_* labs AND every training key recorded on this device (owner
 *  2026-10-13 — not only LAB_UNITS). */
async function retryUnsent(): Promise<void> {
  const keys = [...Object.keys(LAB_UNITS), ...Object.keys(cleared).filter(isTrainingKey)];
  for (const labKey of keys) {
    if (isLabComplete(labKey) && !sent.has(labKey)) await fireComplete(labKey);
  }
}

/** Tests / the backfill / sign-out: send whatever is complete and unsent now. */
export function retryUnsentLabCredit(): Promise<void> {
  return hydrate().then(retryUnsent);
}

/**
 * How many labs are complete on this device but NOT yet credited on the
 * server (offline at the finish, or a training key whose server row has not
 * landed). Sign-out counts these (audit 2026-10-24): the SIGNED_OUT wipe
 * deletes `ape:labProgress`, so after Log out nothing is left to send and the
 * certificate credit is gone — the dialog must not call the progress safe.
 */
export function unsentLabCreditCount(): number {
  const keys = [...Object.keys(LAB_UNITS), ...Object.keys(cleared).filter(isTrainingKey)];
  return keys.filter((k) => isServerLabKey(k) && isLabComplete(k) && !sent.has(k)).length;
}

// A completion held back while an identity's wipe was pending (fireComplete)
// is sent once the device is that identity's own again — e.g. a member's
// boot retry that ran in the moment between their session answer and its
// (no-op) device sync. After a real switch the wipe has emptied memory, so
// nothing of the previous occupant is left to send.
onSessionCarrySettled(() => {
  void retryUnsent();
});

/**
 * Record that the user cleared one unit of a lab (a module viewed, a section
 * seen, a challenge passed, or the explicit review). Idempotent per unit; fires
 * mark_lab_complete the first time the lab reaches its target.
 */
export function markLabUnit(labKey: LabKey, unitId: string): void {
  // PREVIEW EARNS NOTHING (owner ruling 2026-09-01). A non-member who opens a
  // members-only lab gets the real screen behind a preview scrim — but viewing
  // it must not bank completion units, or a free account could walk a preview
  // to full completion and fire the certificate-credit RPC. `getLabPreview()`
  // is a synchronous read and is only ever active for a non-member previewing
  // a locked lab, so members and free users in FREE labs are untouched.
  if (getLabPreview().active) return;
  // A GUEST'S CREDIT REACHES THE ACCOUNT (owner ruling 2026-10-01). A guest's
  // units are recorded here like anyone's, but signing in wipes this device's
  // `ape:*` keys and this store's memory, so they were lost. The units marked
  // in a guest session are held by the shared ledger and replayed into the
  // first account signed into in the same session (after its wipe).
  holdSessionWork<HeldUnits>(CARRY_KEY, (prev) => withHeldUnit(prev, labKey, unitId), { guestOnly: true });
  void recordUnit(labKey, unitId);
}

type HeldUnits = Record<string, string[]>;
const CARRY_KEY = 'labCompletion';

/** Pure: `prev` plus one unit (a fresh object — the ledger keeps versions). */
export function withHeldUnit(prev: HeldUnits | undefined, labKey: string, unitId: string): HeldUnits {
  const list = prev?.[labKey] ?? [];
  return list.includes(unitId) ? { ...prev } : { ...prev, [labKey]: [...list, unitId] };
}

// The ledger's writer: every held unit, recorded under the signed-in account
// (the preview check is NOT re-applied — what was held was earned outside one,
// and a preview open at hand-off time must not refuse it).
registerSessionCarry<HeldUnits>(CARRY_KEY, async (held) => {
  for (const [labKey, units] of Object.entries(held)) {
    for (const u of units) await recordUnit(labKey, u);
  }
  return true;
});

function recordUnit(labKey: string, unitId: string, gen: number = completionGen, quiet = false): Promise<void> {
  // The account it was earned under (shared hunt 12, 2026-10-04): a unit
  // whose device read was still out when the account wipe ran belongs to the
  // departing account. Recorded after the wipe it landed in the NEXT
  // account's units — and a lab it completed fired mark_lab_complete for
  // them. A guest's units are held by the ledger and replayed after the wipe
  // (under the new generation), so nothing they earned is lost.
  // `gen` is passed by the backfill: the generation its SCAN started under.
  if (gen !== completionGen) return Promise.resolve();
  return hydrate().then(() => {
    if (gen !== completionGen) return;
    const set = cleared[labKey] ?? new Set<string>();
    if (set.has(unitId)) return; // already recorded — no-op
    set.add(unitId);
    cleared[labKey] = set;
    persist();
    emit();
    if (isLabComplete(labKey)) {
      void fireComplete(labKey);
      // Store-review eligibility (launch readiness, 2026-09-06): a completed
      // lab is one of the genuine successes that may lead to a prompt. One
      // Mixing PAGE is not a finished lab. Nor is a backfill at sign-in
      // (`quiet`): old work credited in one burst is no success moment, and
      // up to 212 concurrent calls raced the review store's read-modify-write.
      if (!quiet && !/^mx[ab]_/.test(labKey)) void noteHighValueEvent('lab_completed');
    }
  });
}

/**
 * A training lab / Miking lesson / Mixing page / Ear module is complete on
 * this device (the sink of trainingSignal.reportTrainingComplete). The same
 * rules as markLabUnit: a members-only PREVIEW earns nothing; a guest's
 * completion is held for the sign-in hand-off and never sent while they are a
 * guest. A key that is not a training key is ignored. Idempotent.
 */
export function markTrainingDone(key: string): void {
  if (!isTrainingKey(key)) return;
  markLabUnit(key as LabKey, TRAINING_DONE_UNIT);
}

/**
 * The BACKFILL's entry (trainingCompletion.ts): a completion read from a lab
 * store the signed-in account already holds — earned before this update, so
 * outside any preview (the stores refuse preview writes themselves) and not a
 * guest's (the backfill runs only for a settled account). Recorded and sent;
 * nothing to hold. Resolves once recorded (or found already recorded).
 */
export function recordTrainingDone(key: string, gen: number = completionGen): Promise<void> {
  if (!isTrainingKey(key)) return Promise.resolve();
  return recordUnit(key, TRAINING_DONE_UNIT, gen, true);
}

/** The account generation (bumped by the account wipe). The backfill reads
 *  it before its scan: keys read from the departing account's stores are
 *  never recorded for the account signed into while the scan ran. */
export function labCompletionGeneration(): number {
  return completionGen;
}

/** Whether a unit is banked for a lab id (read after `hydrateLabCompletion`) —
 *  the backfill reads passed understanding checks this way. */
export function hasLabUnit(labKey: string, unitId: string): boolean {
  return !!cleared[labKey]?.has(unitId);
}

/** Load the stored units (resolves on a failed read too — see
 *  isLabCompletionUnreadable). */
export function hydrateLabCompletion(): Promise<void> {
  return hydrate();
}

/** Whether mark_lab_complete has succeeded for this key on this device. */
export function isLabCreditSent(labKey: string): boolean {
  return sent.has(labKey);
}

// Every completion source reports through trainingSignal, which loads this
// store on its first report and uses markTrainingDone as its sink (so the lab
// stores never import this module, and this module imports neither).
// the lab stores never import this module); this store is its sink.

/**
 * THE BACKFILL TRIGGER (owner 2026-10-13: learners who finished labs before
 * this update get the credit). Each time a SIGNED-IN account's device is
 * settled — the launch's first auth answer, and every sign-in — after the
 * hand-off has written any guest work carried into it, every lab store is
 * scanned and whatever is already complete is recorded and sent
 * (trainingCompletion.backfillTrainingCompletion). Never for a guest; never
 * while a wipe is pending. The scan pulls in every lab store and content list,
 * so it is required LAZILY — it is not in the app-start graph.
 */
onSessionCarrySettled(() => {
  void Promise.resolve()
    // Joins the settle's own flush of held guest work (called right after
    // the listeners) rather than starting another pass.
    .then(() => flushSessionWork())
    .then(() => {
      if (!sessionIsSettledAccount() || typeof require !== 'function') return;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const m = require('./trainingCompletion') as typeof import('./trainingCompletion');
      return m.backfillTrainingCompletion();
    })
    .catch(() => {
      // a failed scan runs again on the next launch / sign-in
    });
});

/**
 * THE SERVER'S LAB RECORD COMES BACK (must-do D32, owner 2026-10-30). This
 * store only knew labs credited from THIS device, so on a new phone or after
 * a reinstall My Progress → LABS and every catalog tick lost them until each
 * lab was reopened. Each time a signed-in account's device is settled, the
 * learner's own `student_lab_progress` rows are read (RLS slp_read_own; the
 * `labs` key comes through the lab_id foreign key) and every key the server
 * holds is marked `sent`: credited, so isLabDone reads it and it is never
 * re-sent. Only `sent` is added, never units, so a lab's own screen still
 * starts as a fresh practice run. A failed read changes nothing and runs again
 * on the next launch / sign-in.
 */
async function pullServerLabCredit(): Promise<void> {
  if (!sessionIsSettledAccount()) return;
  const gen = completionGen;
  await hydrate();
  if (gen !== completionGen) return;
  try {
    const { data, error } = await supabase.from('student_lab_progress').select('labs(key)');
    // The account changed while the read was out: those rows are the departing account's.
    if (gen !== completionGen || error || !Array.isArray(data)) return;
    let added = false;
    for (const row of data as { labs?: { key?: unknown } | { key?: unknown }[] | null }[]) {
      const lab = Array.isArray(row.labs) ? row.labs[0] : row.labs;
      const key = lab?.key;
      if (typeof key === 'string' && isServerLabKey(key) && !sent.has(key)) {
        sent.add(key);
        added = true;
      }
    }
    if (added) {
      persist();
      emit();
    }
  } catch {
    // network error: read again on the next launch / sign-in
  }
}

onSessionCarrySettled(() => {
  void pullServerLabCredit();
});

/** Explicit "Mark reviewed" for the read-through / sandbox labs. */
export function markLabReviewed(labKey: LabKey): void {
  markLabUnit(labKey, REVIEW_UNIT);
}

/** Reset in-memory caches on account switch (called by resetAllLocalStores();
 *  the persisted `ape:labProgress` key is removed by clearLocalAccountData). */
export function resetLocal(): void {
  completionGen++;
  // A read that was out lands nowhere; the next caller reads the swept key.
  hydrating = null;
  unsaved = false;
  lastReadFailed = false;
  cleared = {};
  sent = new Set<string>();
  afComplete = false;
  emit();
}

/** True while the stored lab units could NOT BE READ (owner 2026-10-03, "do
 *  2"): what the hubs show is this session's units on an empty copy. */
export function isLabCompletionUnreadable(): boolean {
  return !hydrated && lastReadFailed;
}

/** Reactive form of isLabCompletionUnreadable for the lab hubs. Mounting it
 *  reads again (hydrate retries after a failure), so leaving a lab and coming
 *  back is the retry the note promises. */
export function useLabCompletionUnreadable(): boolean {
  const [v, setV] = useState(isLabCompletionUnreadable);
  useEffect(() => {
    const l = () => setV(isLabCompletionUnreadable());
    listeners.add(l);
    // Not keyed (no key to go stale), but the same unmount guard; hydrate
    // never rejects — a failed read resolves with the flag set.
    let live = true;
    void hydrate().finally(() => {
      if (live) l();
    });
    return () => {
      live = false;
      listeners.delete(l);
    };
  }, []);
  return v;
}

/** Live lab progress for a screen: {complete, cleared, total}. */
export function useLabCompletion(labKey: LabKey): { complete: boolean; cleared: number; total: number } {
  const read = () => {
    const { cleared: c, total } = labProgress(labKey);
    return { complete: isLabComplete(labKey), cleared: c, total };
  };
  const [snap, setSnap] = useState(read);
  useEffect(() => {
    // Unchanged progress keeps the same object, so React skips the render
    // (perf hunt 2026-10-03 — see useLabClearedUnits).
    const l = () =>
      setSnap((prev) => {
        const next = read();
        return prev.complete === next.complete && prev.cleared === next.cleared && prev.total === next.total ? prev : next;
      });
    listeners.add(l);
    // `live`: the same newest-wins rule as useLabDone (pattern hunt P2/P11,
    // 2026-10-02).
    let live = true;
    void hydrate().then(() => {
      if (live) l();
    });
    return () => {
      live = false;
      listeners.delete(l);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labKey]);
  return snap;
}
