/**
 * OVERNIGHT 2026-10-24, pass 1 - area "tools". Receipts; each failed on a7a9b4aa.
 *
 *  1. Tuner phase 2 (3d9a5d59) leaked its low-note pitch window on iOS. The
 *     Android bridge defaults a missing `pitchMinHz` to 40 Hz, but the iOS
 *     bridge MERGES (`cfg = _engine->config()` then only the keys present), so
 *     after the piano / 5-string-bass tuner asked for 25-27 Hz, every later
 *     config without the key - the tools-hub tuner mini (hubPreviewEngine),
 *     the Multimeter - kept the long low-note window (the latency the commit
 *     says only those instruments should pay). The shared JS bridge now sends
 *     the documented default, so both platforms behave the same.
 *  2. Multimeter snapshot TAG LOCATION (expo-location live since 175f1ff5):
 *     a fix that fails (Location services off, no fix indoors) came back null
 *     and the screen did NOTHING - no tag, no word. Now it says so.
 *  3. ...and getCurrentPositionAsync is unbounded: a fix that never settles
 *     held the press latch forever (TAG LOCATION / RE-TAG dead for the screen).
 *     getFix is bounded and a timeout reads as a failed fix.
 *  4. ...and a slow fix from a sheet the user cancelled landed on the NEXT
 *     snapshot's fresh sheet (the screen's own rule: a prior fix would mis-tag).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('1. setEngineConfig always sends pitchMinHz (iOS merges a missing key; Android defaults it to 40)', () => {
  const idx = read('modules/ape-dsp/index.ts');
  const body = idx.slice(idx.indexOf('  setEngineConfig(cfg: EngineConfig): void {'), idx.indexOf('  getMeterFrame(): MeterFrame | null {'));
  assert.ok(body.length > 0);
  assert.match(body, /pitchMinHz: DEFAULT_PITCH_MIN_HZ, \.\.\.cfg/, 'the default goes first so a caller value wins');
  assert.match(idx, /const DEFAULT_PITCH_MIN_HZ = 40;/);
  // The native facts this rests on (read-only):
  const kt = read('modules/ape-dsp/android/src/main/java/expo/modules/apedsp/ApeDspModule.kt');
  assert.match(kt, /\(config\["pitchMinHz"\] as\? Number\)\?\.toDouble\(\) \?: 40\.0/);
  const mm = read('modules/ape-dsp/ios/ApeDspCore.mm');
  assert.match(mm, /apedsp::EngineConfig cfg = _engine->config\(\);/);
  // The callers that omit it (they must not inherit the tuner's floor):
  assert.doesNotMatch(read('src/screens/tools/hubPreviewEngine.ts'), /pitchMinHz/);
});

test('2. a failed location fix is told in words, not silently dropped', () => {
  const mm = read('src/screens/tools/MultiMeterScreen.tsx');
  const fn = mm.slice(mm.indexOf('const tagLocationNow = useCallback('), mm.indexOf('const onAddPhoto = useLatchedPress'));
  assert.match(fn, /if \(fix\) \{[\s\S]*setGeo\(fix\);[\s\S]*\} else setLocationFailed\(true\);/);
  assert.match(mm, /\{locationAvailable && locationFailed && !geo && \(/);
  // A fresh sheet clears it like the other capture notes.
  assert.match(mm, /setLocationBlocked\(false\);\n\s*setLocationFailed\(false\);/);
});

test('3. getFix is bounded: a fix that never settles reads as null and frees the latch', () => {
  const loc = read('src/features/tools/capture/location.ts');
  const fn = loc.slice(loc.indexOf('export async function getFix()'));
  assert.match(fn, /Promise\.race\(\[/);
  assert.match(fn, /setTimeout\(\(\) => resolve\(null\), FIX_TIMEOUT_MS\)/);
  assert.match(fn, /finally \{\n\s*if \(timer\) clearTimeout\(timer\);/);
  assert.match(loc, /const FIX_TIMEOUT_MS = \d+;/);
});

test('4. a fix from a closed sheet never tags the next snapshot', () => {
  const mm = read('src/screens/tools/MultiMeterScreen.tsx');
  const fn = mm.slice(mm.indexOf('const tagLocationNow = useCallback('), mm.indexOf('const onAddPhoto = useLatchedPress'));
  assert.match(fn, /const sheet = sheetGenRef\.current;/);
  assert.match(fn, /if \(sheet !== sheetGenRef\.current\) return;/);
  assert.match(mm, /sheetGenRef\.current\+\+;\n\s*setPhotoUri\(null\);\n\s*setGeo\(null\);/);
});

/*
 *  5. Advanced Tuner (CenterLock) popups - the piano HOW TO TUNE guide (new
 *     f8ea7625) and the instrument picker - had no Android BACK of their own:
 *     the Frequency Counter's handler closed the WHOLE full screen from under
 *     the popup. BACK now closes the popup first (useBackWhileFocused, the
 *     newer listener, runs before the screen's).
 */
test('5. Android BACK closes a CenterLock popup before the full screen', () => {
  const cl = read('src/screens/tools/CenterLockTuner.tsx');
  assert.match(cl, /import \{ useBackWhileFocused \} from '\.\.\/\.\.\/lib\/useBackWhileFocused';/);
  assert.match(cl, /useBackWhileFocused\(pianoGuideOpen \|\| pickerOpen, popupBack\);/);
  const cb = cl.slice(cl.indexOf('const popupBack = useCallback('));
  assert.match(cb.slice(0, 300), /if \(pianoGuideOpen\) setPianoGuideOpen\(false\);\n\s*else setPickerOpen\(false\);\n\s*return true;/);
});
