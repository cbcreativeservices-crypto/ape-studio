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
  // (wave 2, 2026-10-02: deviceIdentity / attemptDraft / quiz api /
  //  localProgress / scenarioQueue / paceStore / lastStudyLocation are done —
  //  scenarioQueue, paceStore and lastStudyLocation moved onto the safe store,
  //  the rest carry the failed-read rule in place; receipts in
  //  localStoreWave2Study_20261002.)
  // (wave 2, 2026-10-02: exposureMonitor and soundSafetyAck are done — the
  //  exposure settings moved onto the safe store, the day record and the
  //  acknowledgment carry the failed-read rule and a generation fence in
  //  place; receipts in localStoreWave2Audio_20261002.)
  // ── features/lab / soundsystems (lab records) ─────────────────────────
  // (wave 2, 2026-10-02: soundsystems/progress, the screens/lab step stores
  //  (Cable / Foundations / Mic Selection), the Cymatics experiment ticks and
  //  the Mixing priorities moved onto the safe store; calcUsage,
  //  amplitudeOrientation, drumProgress, the Mixing focal point and RackUnit
  //  carry the failed-read rule in place; receipts in
  //  localStoreWave2Labs_20261002.)
  // (wave 2, 2026-10-02: the celebration / curriculum / dashboard api /
  //  directory / settings / lowLight / permissions / profile / glossary /
  //  startHere / review / notifications / intro / StudyFsOverlay entries are
  //  done — celebrationSeen moved onto the safe store, the rest carry the
  //  failed-read rule in place; receipts in localStoreWave2Prefs_20261002.)
  // (wave 2, 2026-10-02: calibrationStore and the crowdsource queue in
  //  deviceProfile moved onto the safe store; deviceProfile's consent flag
  //  and the web measurementsBackend carry the failed-read rule in place;
  //  receipts in localStoreWave2Audio_20261002.)
  // ── lib ───────────────────────────────────────────────────────────────
  'lib/authStorage.native.ts': 'the Supabase auth session adapter: supabase-js owns its semantics; it must stay a plain adapter, never a store',
  // ── screens (lab progress kept in the screen) ─────────────────────────
  // (wave 2, 2026-10-02: the Flashcards / Awards / Dashboard / Auth screen
  //  entries are done — each carries the failed-read rule in place; receipts
  //  in localStoreWave2Study_20261002.)
  // (wave 2, 2026-10-02: CenterLockTuner's remembered presets moved onto the
  //  safe store; receipts in localStoreWave2Audio_20261002.)
};

/** Files migrated onto the shared safe store on 2026-10-02 — a ratchet
 *  against a quiet return to a hand-rolled read. */
const ON_SAFE_STORE = [
  'features/celebration/celebrationSeen.ts',
  'features/dashboard/deckOrderStore.ts',
  'features/enrollment/enrolledBundlesStore.ts',
  'features/enrollment/enrollmentStore.ts',
  'features/flags/flaggedStore.ts',
  'features/soundsystems/progress.ts',
  'features/study/lastStudyLocation.ts',
  'features/study/paceStore.ts',
  'features/study/scenarioExempt.ts',
  'features/study/scenarioQueue.ts',
  'features/study/termsExempt.ts',
  'features/tools/measure/calibrationStore.ts',
  'screens/lab/cable/CableLabScreen.tsx',
  'screens/lab/cymatics/ExperimentWell.tsx',
  'screens/lab/foundations/FoundationsCourseScreen.tsx',
  'screens/lab/micselect/MicSelectLabScreen.tsx',
  'screens/tools/CenterLockTuner.tsx',
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
