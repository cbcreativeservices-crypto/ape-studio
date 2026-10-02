/**
 * Labs group B — "toddler + cat" bug pass 3 of 3, 2026-09-30 (day). Source
 * guards pin the SHAPE of each fix (the reasoning sits in the comment beside
 * it in the source).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ── a copy restored AS A GUEST is never written back over real progress ─────

test('Ear: a ladder handed out while blocked is never saved, even once unblocked', () => {
  const s = read('src/features/ear/earProgress.ts');
  assert.match(s, /const blockedLoads = new WeakSet<EarProgressState>\(\);/);
  // 2026-10-01: the blocked ladder is also tagged with the sign-in hand-off
  // epoch (it is HELD for the account, never written here).
  assert.match(s, /if \(saveBlocked\) \{\n\s*const s: EarProgressState = \{ \.\.\.EMPTY, modules: \{\} \};\n\s*blockedLoads\.add\(s\);\n\s*guestLoads\.set\(s, sessionCarryEpoch\(\)\);\n\s*return s;/);
  assert.match(s, /if \(saveBlocked \|\| blockedLoads\.has\(s\)\) return;/);
});

test('Tuning: progress restored as a guest never overwrites completed chapters', () => {
  const t = read('src/screens/lab/tuning/TuningLabScreen.tsx');
  assert.match(t, /loadedAsGuestRef\.current = guestRef\.current;/);
  assert.match(t, /if \(!guestRef\.current && !loadedAsGuestRef\.current\) void saveTuningProgress\(next\);/);
});

test('Sound Systems modes: pages restored while no-save never overwrite completed pages', () => {
  const s = read('src/screens/lab/soundsystems/SsPagedLab.tsx');
  assert.match(s, /loadedNoSaveRef\.current = noSaveRef\.current;/);
  assert.match(s, /if \(!noSaveRef\.current && !loadedNoSaveRef\.current\) void savePagedProgress\(labId, next\);/);
});

// ── a superseded start never disarms the newer start's effect chain ─────────

test('Signal Chain + Fx labs: a late-failing superseded start leaves the newer chain armed', () => {
  for (const f of ['src/screens/lab/SignalChainLabScreen.tsx', 'src/screens/lab/FxLabScreen.tsx']) {
    const s = read(f);
    assert.match(s, /if \(gen === genRef\.current \|\| !wantRef\.current\) ApeDsp\.fxReset\(\);/, f);
    assert.doesNotMatch(s, /setGenError\(AUDIO_UNAVAILABLE_MESSAGE\);\n\s*ApeDsp\.fxReset\(\);/, f);
  }
});

// ── guests restore nothing: every restore waits for the tier ────────────────

test('Tuning, Sound Systems, Cable, Cable Install, Mic Selection restores wait for `resolved`', () => {
  const tuning = read('src/screens/lab/tuning/TuningLabScreen.tsx');
  const tLoad = tuning.slice(tuning.indexOf('const navigatedRef = useRef(false);'), tuning.indexOf('const persist = useCallback'));
  // Owner ruling 2026-10-01: the restore also re-runs when the guest state
  // changes (sign-in carries the guest session; sign-out drops the copy).
  assert.match(tLoad, /if \(!resolved\) return;[\s\S]*loadTuningProgress\(\)[\s\S]*\}, \[resolved, guest\]\);/);
  assert.match(tLoad, /if \(!navigatedRef\.current\) setChapter\(/);
  assert.match(tuning, /player\.stop\(\); \/\/ leaving a chapter stops its audio\n\s*navigatedRef\.current = true;/);

  const ss = read('src/screens/lab/soundsystems/SsPagedLab.tsx');
  assert.match(ss, /if \(!resolved\) return;\n\s*let alive = true;\n\s*void loadPagedProgress\(labId\)/);
  // Full run 2 (2026-10-01): the restore also re-runs when the guest state
  // changes, as kit/PagedLab's does (test/labsAFullRun2_20261001.test.ts).
  assert.match(ss, /\}, \[labId, pagesWithCheck\.length, resolved(, isGuest)?\]\);/);

  const cable = read('src/screens/lab/cable/CableLabScreen.tsx');
  assert.match(cable, /if \(!resolved\) return;\n\s*void AsyncStorage\.getItem\(STEP_KEY\)/);
  const mic = read('src/screens/lab/micselect/MicSelectLabScreen.tsx');
  assert.match(mic, /if \(!resolved\) return;\n\s*void AsyncStorage\.getItem\(STEP_KEY\)/);
  const ci = read('src/screens/lab/cableinstall/CableInstallLabScreen.tsx');
  assert.match(ci, /if \(!resolved \|\| noAccountRef\.current\) return;/);
});

test('Amp and Ear training: progress is read only once the tier is known', () => {
  for (const f of [
    'src/screens/lab/amp/AmpLabHomeScreen.tsx',
    'src/screens/lab/amp/AmpModuleScreen.tsx',
    'src/screens/lab/amp/modules/mod8Apply.tsx',
    'src/screens/lab/eartraining/EarTrainingLabScreen.tsx',
    'src/screens/lab/eartraining/EarModuleScreen.tsx',
  ]) {
    const s = read(f);
    assert.match(s, /const \{ resolved \} = useEntitlement\(\);/, f);
    assert.match(s, /if \(!resolved\) return;/, f);
  }
});

test('Mixing: a guest is never shown the stored focal point / priorities', () => {
  const s = read('src/screens/lab/mixing/kit.tsx');
  assert.match(s, /return \[guestRef\.current \? focalSession : focalCurrent, set\];/);
  assert.match(s, /return \[guestRef\.current \? \(prioritiesSession \?\? \[\]\) : prioritiesCurrent, toggle\];/);
  // an account wipe forgets the session copies too
  const reset = s.slice(s.indexOf('export function resetMixingCommitments'), s.indexOf('export function useFocalChoice'));
  assert.match(reset, /focalSession = null;/);
  assert.match(reset, /prioritiesSession = null;/);
});
