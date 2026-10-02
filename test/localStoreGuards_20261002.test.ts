/**
 * G1 (pattern catalog 2026-10-02, rank-1 class P1): NO NEW storage read whose
 * failure becomes an empty value that the next save writes over the real one.
 *
 * Every file under src/ that both READS a key with `AsyncStorage.getItem` and
 * WRITES storage must either
 *   • be on the shared safe store (features/storage/localStore.ts) — then it
 *     has no direct `getItem` at all and this test never sees it — or
 *   • carry one of the house idioms the catalog recognises (`readFailed`,
 *     `*Unreadable`, `tryLoad`, "stay unhydrated": `hydrating = null`, …), or
 *   • be listed in STILL_HAND_ROLLED with a one-line reason.
 *
 * The list is the second wave's worklist, grouped by folder in the 2026-10-02
 * report. It may only SHRINK: an entry whose file no longer reads+writes
 * directly (migrated, or gained an idiom) fails the ratchet until removed.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const HELPER = 'features/storage/localStore.ts';

const READ = /AsyncStorage\.getItem\(/;
const WRITE = /AsyncStorage\.(setItem|multiSet|removeItem|multiRemove|mergeItem)\(/;
const IDIOM = /readFailed|Unreadable|unreadable|tryLoad|readOk|loadFailed|readError|read failed|READ failed|hydrating = null|stay unhydrated|readBlocked/;

/** Direct reader+writers without a recognised idiom, as of 2026-10-02, each
 *  with why it is still hand-rolled. "wave 2" = migrate onto createLocalStore
 *  (or confirm the idiom) in the second sweep; the risk word says the order. */
const STILL_HAND_ROLLED: Record<string, string> = {
  // ── features/account ──────────────────────────────────────────────────
  'features/account/accountLocalSync.ts':
    'the ape:localUserId identity marker: read BEFORE the wipe, written AFTER; a failed read reads as "no marker" on purpose (a change of identity wipes); it is the wipe queue itself',
  'features/account/deviceIdentity.ts':
    'the install id (KEEP) — wave 2 HIGH: confirm a failed read cannot mint a NEW id over the stored one (single-device login would see a new device)',
  // ── features/assess / quiz / study (graded work) ──────────────────────
  'features/assess/attemptDraft.ts': 'the in-progress exam answer draft (ape:attemptDraft:<id>) — wave 2 HIGH: graded work',
  'features/quiz/api.ts': 'quiz-side storage — wave 2 HIGH: graded work',
  'features/study/localProgress.ts': 'the local progress mirror (ape:localMethod:*), wipe-fenced by a count — wave 2 HIGH: study credit',
  'features/study/scenarioQueue.ts': 'the offline scenario queue — wave 2 HIGH: graded work that replays',
  'features/study/paceStore.ts': 'per-method pace settings and session tallies, generation-fenced — wave 2 MEDIUM',
  'features/study/lastStudyLocation.ts':
    'one value replaced whole on every write (never merged): a failed read shows "nothing recorded" and the next write is a deliberate replacement, so there is no copy to write over — wave 2 LOW',
  // ── features/audio (safety records) ───────────────────────────────────
  'features/audio/exposureMonitor.ts': 'the hearing-exposure dose/sessions — wave 2 HIGH: a safety record',
  'features/audio/soundSafetyAck.ts': 'the hearing-damage warning acceptance — wave 2 HIGH: a safety gate (failing closed = re-ask is the safe side)',
  // ── features/lab / soundsystems (lab records) ─────────────────────────
  'features/soundsystems/progress.ts': 'the Sound Systems Lab record (faults, capstones), epoch-fenced — wave 2 HIGH: lab progress',
  'features/lab/calcUsage.ts': 'the offline calculator meter (KEEP) — wave 2 HIGH: a failed read must not read as "0 used" (free calculations)',
  'features/lab/amplitudeOrientation.ts': 'a device-level first-use flag (kept by the wipe) — wave 2 LOW',
  // ── features/celebration / curriculum / dashboard / directory ─────────
  'features/celebration/celebrationSeen.ts': 'the already-celebrated set, generation-fenced — wave 2 MEDIUM',
  'features/curriculum/academyStats.ts': 'a cache of academy-wide totals — reference data, wave 2 LOW',
  'features/dashboard/api.ts': 'the dashboard cache — wave 2 LOW',
  'features/directory/legacyMigration.ts': 'a one-time migration marker — wave 2 LOW',
  // ── features/settings / permissions / profile / glossary / startHere (device preferences) ──
  'features/settings/store.ts': 'the local settings record (haptics, mic release, reminders) — wave 2 MEDIUM: a failed read then a save writes defaults over it',
  'features/settings/lowLight.ts': 'Low-Light Production Mode: a failed read defaulting to OFF is the product-safe direction (nothing is silenced by accident) — wave 2 LOW',
  'features/permissions/permissionStore.ts': 'per-capability consent "ask mode": a failed read defaulting to ASK is the safe direction — wave 2 LOW',
  'features/profile/bigPicturePref.ts': 'a display preference (KEEP) — wave 2 LOW',
  'features/glossary/autoOfflinePref.ts': 'a device preference (KEEP) — wave 2 LOW',
  'features/startHere/firstOpen.ts': 'the device first-open flag (KEEP) — wave 2 LOW',
  'features/review/reviewPrompt.ts': 'the store-review cooldown, per install — wave 2 LOW',
  'features/notifications/localSchedule.ts': 'the device notification schedule, rebuilt from server prefs on every change — wave 2 LOW',
  'features/intro/ScreenIntroOverlay.tsx': 'intro "seen" flags (device-level, kept by the wipe) — wave 2 LOW',
  'features/intro/TopicWelcomeSheet.tsx': 'intro "seen" flags (device-level, kept by the wipe) — wave 2 LOW',
  'components/StudyFsOverlay.tsx': 'the fullscreen-guide "seen" flag (…FsGuide, kept by the wipe) — wave 2 LOW',
  // ── features/tools (measurements, hardware) ───────────────────────────
  'features/tools/measure/calibrationStore.ts': 'microphone calibration (KEEP, hardware) — wave 2 MEDIUM: a failed read then a save writes a default over the real calibration',
  'features/tools/measure/deviceProfile.ts': 'the device profile — wave 2 MEDIUM',
  'features/tools/measure/measurementsBackend.ts': 'the AsyncStorage→SQLite measurement migration — wave 2 MEDIUM',
  // ── lib ───────────────────────────────────────────────────────────────
  'lib/authStorage.native.ts': 'the Supabase auth session adapter: supabase-js owns its semantics; it must stay a plain adapter, never a store',
  // ── screens (lab progress kept in the screen) ─────────────────────────
  'screens/lab/drumtuning/drumProgress.ts':
    'hand-fixed in the Drum toddler passes under other wording ("from one failed read", a read that answers empty-vs-failed) — wave 2: migrate or add the idiom word',
  'screens/lab/cable/CableLabScreen.tsx': 'lab progress kept in the screen — wave 2 HIGH (screens/lab folder)',
  'screens/lab/cymatics/ExperimentWell.tsx': 'experiment ticks kept in the screen — wave 2 HIGH (screens/lab folder)',
  'screens/lab/foundations/FoundationsCourseScreen.tsx': 'course step progress kept in the screen — wave 2 HIGH (screens/lab folder)',
  'screens/lab/micselect/MicSelectLabScreen.tsx': 'lab progress kept in the screen — wave 2 HIGH (screens/lab folder)',
  'screens/lab/mixing/kit.tsx': 'the Mixing labs commitments — wave 2 HIGH (screens/lab folder)',
  'screens/lab/rack/RackUnit.tsx': 'the "hide the display" reading preference (KEEP) — wave 2 LOW',
  'screens/study/FlashcardsScreen.tsx': 'study state kept in the screen — wave 2 MEDIUM',
  'screens/awards/AwardsScreen.tsx': 'awards-screen storage — wave 2 MEDIUM',
  'screens/dashboard/DashboardScreen.tsx': 'dashboard storage — wave 2 MEDIUM',
  'screens/auth/AuthScreen.tsx': 'the web-preview auto-guest latch and sign-in flags — wave 2 LOW',
  'screens/tools/CenterLockTuner.tsx': 'a tuner preference — wave 2 LOW',
};

/** Files migrated onto the shared safe store on 2026-10-02 — a ratchet
 *  against a quiet return to a hand-rolled read. */
const ON_SAFE_STORE = [
  'features/dashboard/deckOrderStore.ts',
  'features/enrollment/enrolledBundlesStore.ts',
  'features/enrollment/enrollmentStore.ts',
  'features/flags/flaggedStore.ts',
  'features/study/scenarioExempt.ts',
  'features/study/termsExempt.ts',
];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

describe('G1: no failed storage read may become an empty value that the next save writes over', () => {
  const files = walk(SRC).map((p) => ({ rel: relative(SRC, p).split(sep).join('/'), s: readFileSync(p, 'utf8') }));
  const direct = files.filter(({ rel, s }) => rel !== HELPER && READ.test(s) && WRITE.test(s));

  it('the scan actually found the hand-rolled stores', () => {
    assert.ok(direct.length > 30, `expected many direct reader+writers, got ${direct.length}`);
    assert.ok(direct.some((f) => f.rel === 'features/lab/labCompletion.ts'), 'labCompletion should be in the scanned set');
  });

  it('every direct reader+writer carries a failed-read idiom, or is listed with a reason', () => {
    const open = direct.filter(({ rel, s }) => !IDIOM.test(s) && !STILL_HAND_ROLLED[rel]).map((f) => f.rel);
    assert.deepEqual(
      open,
      [],
      'these read AND write storage with no failed-read rule — a read that throws becomes "empty", and the next save writes that over the real data.\n' +
        'Put the key on createLocalStore (src/features/storage/localStore.ts), or add the file to STILL_HAND_ROLLED with a reason:\n  ' +
        open.join('\n  '),
    );
  });

  it('the list only shrinks: every entry still reads+writes directly, with no idiom, and carries a reason', () => {
    for (const [rel, why] of Object.entries(STILL_HAND_ROLLED)) {
      assert.ok(why.length > 20, `${rel} needs a real reason`);
      const f = direct.find((d) => d.rel === rel);
      assert.ok(f, `${rel} no longer reads+writes storage directly — remove it from STILL_HAND_ROLLED`);
      assert.ok(!IDIOM.test(f.s), `${rel} now carries a failed-read idiom — remove it from STILL_HAND_ROLLED`);
    }
  });

  it('the migrated stores stay on the shared safe store (no direct write came back)', () => {
    for (const rel of ON_SAFE_STORE) {
      const f = files.find((d) => d.rel === rel);
      assert.ok(f, `${rel} is missing`);
      assert.match(f.s, /from '[^']*storage\/localStore'/, `${rel} left the shared safe store`);
      assert.doesNotMatch(f.s, WRITE, `${rel} writes storage directly again`);
      // flaggedStore keeps ONE direct read: listBookmarkContexts, a read-only
      // scan of ape:bm:* that writes nothing (a key it cannot read is skipped).
      if (rel !== 'features/flags/flaggedStore.ts') assert.doesNotMatch(f.s, READ, `${rel} reads storage directly again`);
    }
  });

  it('the helper itself keeps the rules (read failure stays unhydrated; damaged is set aside; writes are fenced)', () => {
    const s = files.find((d) => d.rel === HELPER)?.s ?? '';
    assert.match(s, /unreadable = true;\s*hydrating = null;/, 'a failed read must leave the store unhydrated');
    assert.match(s, /`\$\{key\}:damaged`/, 'a damaged blob must be set aside');
    assert.match(s, /if \(gen !== generation\) return false;/, 'a write must be generation-fenced');
    assert.match(s, /registerLocalStoreReset\(reset\);/, 'every store must self-register its reset');
  });
});
