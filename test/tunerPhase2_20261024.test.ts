/**
 * Tuner phase 2 (owner 2026-10-24, in the iOS 37 / Android 21 build): the
 * native engine runs pitch every ~15 ms with an FFT-based YIN, sizes its
 * window from EngineConfig.pitchMinHz, and stamps each estimate (timeSec).
 * The arithmetic is pinned by the native golden suite
 * (modules/ape-dsp/test/golden_main.cpp, "5b" and "8b"); this pins the floor
 * rule and that every bridge carries the two new fields.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { pianoRangeHint, pitchFloorFor, TRACKER_FLOOR_HZ } from '../src/features/tools/tuner/centerLock.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('floor: default 40 Hz unless the instrument needs lower AND the engine is v9+', () => {
  assert.equal(pitchFloorFor(82.41, 9), TRACKER_FLOOR_HZ); // guitar: unchanged window
  assert.equal(pitchFloorFor(null, 9), TRACKER_FLOOR_HZ); // chromatic
  assert.equal(pitchFloorFor(30.87, 8), TRACKER_FLOOR_HZ); // old binary (OTA to an older build)
  assert.equal(pitchFloorFor(30.87, 9), 27); // low B on a 5-string bass
  assert.equal(pitchFloorFor(27.5, 9), 25); // piano A0 — never under 25 Hz
});

test('the piano honesty line follows the engine floor actually in use', () => {
  assert.match(pianoRangeHint(27.5, 1) ?? '', /2nd partial/); // 40 Hz floor
  assert.equal(pianoRangeHint(27.5, 1, 25), null); // fundamental is read
});

test('every bridge carries pitchMinHz and timeSec; v9 engine; 15 ms tick', () => {
  const hub = read('modules/ape-dsp/ios/core/EngineHub.hpp');
  assert.match(hub, /constexpr uint32_t kEngineVersion = 9;/);
  assert.match(hub, /double pitchMinHz = 40\.0;/);
  assert.match(hub, /return cfg_\.pitchEnabled \? 15 : 50;/);
  const mm = read('modules/ape-dsp/ios/ApeDspCore.mm');
  assert.match(mm, /cfg\.pitchMinHz = v\.doubleValue/);
  assert.match(mm, /@"timeSec" : @\(p\.timeSec\)/);
  assert.match(mm, /milliseconds\(engine->tickIntervalMs\(\)\)/);
  const jni = read('modules/ape-dsp/android/src/main/cpp/ApeDspJni.cpp');
  assert.match(jni, /cfg\.pitchMinHz = pitchMinHz;/);
  assert.match(jni, /double v\[6\] = .*\n.*p\.timeSec\};/);
  assert.match(jni, /milliseconds\(engine->tickIntervalMs\(\)\)/);
  const kt = read('modules/ape-dsp/android/src/main/java/expo/modules/apedsp/ApeDspModule.kt');
  assert.match(kt, /bandAvgAlpha: Double, pitchMinHz: Double,/);
  assert.match(kt, /\(config\["pitchMinHz"\] as\? Number\)\?\.toDouble\(\) \?: 40\.0/);
  assert.match(kt, /"timeSec" to p\.getOrElse\(5\)/);
});

test('the tuner mode sizes the engine from the instrument and reconfigures live', () => {
  const screen = read('src/screens/tools/FrequencyCounterScreen.tsx');
  assert.match(screen, /pitchFloorFor\(lowNote, ApeDsp\.engineVersion\(\)\)/);
  assert.match(screen, /if \(configLive\) ApeDsp\.setEngineConfig\(pitchConfig\);/);
  assert.match(screen, /lowCut === TUNER_LOW_CUT_HZ\[0\] \? Math\.min\(lowCut, pitchFloor\) : lowCut/);
  const lock = read('src/screens/tools/CenterLockTuner.tsx');
  assert.match(lock, /setTunerLowNote\(lowestHz\)/);
  assert.match(lock, /pianoRangeHint\(target\.hz, view\.partial, floorHz\)/);
});
