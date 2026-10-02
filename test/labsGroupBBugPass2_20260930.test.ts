/**
 * Labs group B — "toddler + cat" bug pass 2 of 3, 2026-09-30 (day). Source
 * guards pin the SHAPE of each fix (the reasoning sits in the comment beside
 * it in the source).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ── HOUSE GUEST RULE: nothing restored, nothing written ─────────────────────

test('Amp: a guest\'s progress is neither restored nor written (ape:amp:v1)', () => {
  const s = read('src/features/amp/ampProgress.ts');
  assert.match(s, /export function setAmpSaveBlocked\(blocked: boolean\): void \{\n\s*saveBlocked = blocked;/);
  const load = s.slice(s.indexOf('export async function loadAmpProgress'), s.indexOf('export async function saveAmpProgress'));
  const l = load.indexOf('if (saveBlocked) return { modules: {} };');
  assert.ok(l >= 0 && l < load.indexOf('AsyncStorage.getItem'));
  const save = s.slice(s.indexOf('export async function saveAmpProgress'), s.indexOf('let writeQueue'));
  const w = save.indexOf('if (saveBlocked) return;');
  assert.ok(w >= 0 && w < save.indexOf('AsyncStorage.setItem'));
  for (const f of ['src/screens/lab/amp/AmpLabHomeScreen.tsx', 'src/screens/lab/amp/AmpModuleScreen.tsx']) {
    assert.match(read(f), /setAmpSaveBlocked\(useLabEndGuest\(\)\);/, f);
  }
});

test('Ear training: a guest\'s ladder is neither restored nor written (ape:ear:v1)', () => {
  const s = read('src/features/ear/earProgress.ts');
  assert.match(s, /export function setEarSaveBlocked\(blocked: boolean\): void \{\n\s*saveBlocked = blocked;/);
  const load = s.slice(s.indexOf('export async function loadEarProgress'), s.indexOf('export async function saveEarProgress'));
  // pass 3 shape: the blocked (empty) state is also remembered as never-saveable
  const l = load.indexOf('if (saveBlocked) {');
  assert.ok(l >= 0 && l < load.indexOf('AsyncStorage.getItem'));
  const save = s.slice(s.indexOf('export async function saveEarProgress'), s.indexOf('/** Pure: apply one scored trial'));
  const w = save.indexOf('if (saveBlocked || blockedLoads.has(s)) return;');
  assert.ok(w >= 0 && w < save.indexOf('AsyncStorage.setItem'));
  for (const f of ['src/screens/lab/eartraining/EarTrainingLabScreen.tsx', 'src/screens/lab/eartraining/EarModuleScreen.tsx']) {
    assert.match(read(f), /setEarSaveBlocked\(useLabEndGuest\(\)\);/, f);
  }
});

test('Mixing: a guest\'s focal point and priorities are never written', () => {
  const s = read('src/screens/lab/mixing/kit.tsx');
  assert.match(s, /if \(!guestRef\.current\) void AsyncStorage\.setItem\(FOCAL_KEY/);
  assert.match(s, /if \(!guestRef\.current\) void AsyncStorage\.setItem\(PRIORITIES_KEY/);
  assert.equal((s.match(/guestRef\.current = useLabEndGuest\(\);/g) ?? []).length, 2);
});

test('Mic Selection: a cold-start guest\'s first lesson is not persisted before the tier lands', () => {
  const s = read('src/screens/lab/micselect/MicSelectLabScreen.tsx');
  assert.match(s, /if \(!resolved\) return;\n\s*markLabVisit\('micselect', STEPS\[step\]\.key, \{ persist: !noAccountRef\.current \}\);\n\s*\}, \[step, resolved, entitlement\]\);/);
});

test('Sound Systems hub never tells a guest that their work is saved', () => {
  const s = read('src/screens/lab/soundsystems/SoundSystemsLabScreen.tsx');
  assert.match(s, /const guest = useLabEndGuest\(\);/);
  // Owner ruling 2026-10-01: a members-only preview is told it earns
  // nothing; a signed-out guest that signing in before closing keeps it.
  assert.match(s, /\{guest\n\s*\? inPreview\n\s*\? 'This is a members-only preview, so nothing here is saved or credited\.[^']*'\n\s*: 'You are not signed in, so nothing here is saved yet/);
});

// ── double taps: a second tap never leaves the lab or pops a second screen ──

test('Cable lab: a doubled NEXT stays on lesson 12 (the kit lock); only the header ‹ leaves', () => {
  // WP5 (2026-10-01): the shared strip's one 400 ms tap lock replaces the
  // local guard, lesson 12 is the end state (NEXT's slot empty), and the
  // host no longer calls goBack() itself — LabHeader's ‹ leaves, once.
  const s = read('src/screens/lab/cable/CableLabScreen.tsx');
  assert.match(s, /from '\.\.\/kit\/LabNavBar'/);
  assert.match(s, /useLabNav\(\{/);
  assert.match(s, /const ending = step === last;/);
  assert.doesNotMatch(s, /lastNavAtRef|leavingRef|navigation\.goBack|useNavigation/);
});

test('Cable Install: a doubled RETURN TO TRAINING leaves once', () => {
  const s = read('src/screens/lab/cableinstall/CableInstallLabScreen.tsx');
  assert.match(s, /onReturn=\{\(\) => \{\n\s*if \(leavingRef\.current\) return;\n\s*leavingRef\.current = true;\n\s*navigation\.goBack\(\);/);
});

test('Sound Systems mode: NEXT → FINISH double tap stays; FINISH opens the end screen; DONE leaves once', () => {
  // 2026-09-30: the shared strip (kit/LabNavBar). The hook's one 400 ms tap
  // lock covers NEXT / FINISH, so the host keeps no lock of its own; FINISH
  // opens LabEndScreen in place (never goBack), and the end screen's DONE
  // leaves once through its own 700 ms window.
  const s = read('src/screens/lab/soundsystems/SsPagedLab.tsx');
  assert.match(s, /from '\.\.\/kit\/LabNavBar'/);
  assert.doesNotMatch(s, /lastNavAtRef|leavingRef/);
  assert.match(s, /const finish = useCallback\(\(\) => setEnding\(true\), \[\]\);/);
  assert.match(s, /onDone=\{\(\) => navigation\.goBack\(\)\}/);
  assert.equal((s.match(/navigation\.goBack\(\)/g) ?? []).length, 1);
});

// ── display and audio agree: a control moved during the native start ───────

test('Harmonics: an F0 picked during the start retunes the plain fundamental once it resolves', () => {
  const s = read('src/screens/lab/HarmonicsView.tsx');
  assert.match(s, /const sentF0 = f0Ref\.current;/);
  assert.match(s, /if \(!params && f0Ref\.current !== sentF0\) \{/);
});

test('Harmonograph: a ratio / detune moved during the start is followed (retune or quiet); RESET cancels a start in flight', () => {
  const s = read('src/screens/lab/HarmonographLabScreen.tsx');
  assert.match(s, /latestRef\.current = \{ n1, n2, detune \};/);
  const start = s.slice(s.indexOf('const soundInterval = useCallback'), s.indexOf('const startInterval = useCallback'));
  assert.match(start, /if \(!lm \|\| latest\.detune !== 0\) \{\n\s*wantRef\.current = false;\n\s*void ApeDsp\.genStop\(\);/);
  assert.match(start, /if \(lm\.n1 !== m\.n1 \|\| lm\.n2 !== m\.n2\) ApeDsp\.genSet\(intervalGenParams\(lm\.n1, lm\.n2\)\);/);
  assert.match(s, /if \(running \|\| wantRef\.current\) stopInterval\(\);/);
});

test('Bass: a note picked while the recording loads is plucked; the model fallback is retuned', () => {
  const s = read('src/screens/lab/BassLabScreen.tsx');
  assert.match(s, /latestRef\.current = \{ sampleKey, genParams, startNote \};/);
  assert.match(s, /if \(latestRef\.current\.sampleKey !== sampleKey\) void latestRef\.current\.startNote\(\);/);
  assert.match(s, /if \(latestRef\.current\.genParams !== genParams\) ApeDsp\.genSet\(latestRef\.current\.genParams\(\)\);/);
});

// ── carry-over: EngineGate recovery + ≥ 9 pt ────────────────────────────────

test('Harmonics LIVE: the EngineGate card gets the LIVE start as its TRY AGAIN', () => {
  assert.match(read('src/screens/lab/HarmonicsView.tsx'), /<EngineGate state=\{state\} lastError=\{lastError\} onRetry=\{\(\) => void onLiveStart\(\)\} \/>/);
});

test('Ear training See-it plots: axis labels ≥ 9 pt (fixed-height Svg, fit scale ≤ 1)', () => {
  assert.match(read('src/screens/lab/eartraining/SeeItView.tsx'), /const AXIS_PX = 9;/);
});
