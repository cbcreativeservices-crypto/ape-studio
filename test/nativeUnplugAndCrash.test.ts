/**
 * Next-build native fixes (2026-09-30):
 *  1. Headphones unplugged / BT dropped while a voice plays → every voice is
 *     stopped NATIVELY and 'onOutputLost' tells JS, which mutes the app.
 *  2. iPad mic-stop crash (Sentry APE-STUDIO-T): js-stop runs on the main
 *     queue and never touches inputNode without an input route.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const swift = readFileSync('modules/ape-dsp/ios/ApeDspModule.swift', 'utf8');
const kt = readFileSync('modules/ape-dsp/android/src/main/java/expo/modules/apedsp/ApeDspModule.kt', 'utf8');

test('iOS: unplug stops voices then emits onOutputLost', () => {
  assert.match(swift, /Events\("onOutputLost"\)/);
  assert.match(swift, /== \.oldDeviceUnavailable,\s*self\.core\.anyOutputRunning\(\)/);
  assert.match(swift, /self\.core\.genStop\(\)\s*self\.core\.binStop\(\)\s*self\.core\.modStop\(\)[\s\S]{0,200}self\.sendEvent\("onOutputLost"/);
});

test('iOS: js-stop on main; no inputNode access without an input route', () => {
  assert.match(swift, /self\.stopCapture\(reason: "js-stop"\)\s*\}\.runOnQueue\(\.main\)/);
  // Superseded 2026-10-08 (native-ios-fixes): the stop path no longer touches
  // inputNode AT ALL — the route check still raced a vanishing route / a reset
  // session. test/nativeStopCapture_20261008.test.ts pins the stronger rule.
  const stop = swift.slice(swift.indexOf('private func stopCapture(reason: String) {'), swift.indexOf('private var stopping = false'));
  assert.ok(stop.length > 0);
  assert.doesNotMatch(stop.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, ''), /inputNode/);
});

test('Android: removal of a private output stops voices then emits', () => {
  assert.match(kt, /Events\("onOutputLost"\)/);
  assert.match(kt, /it\.isSink && PRIVATE_OUTPUTS\.contains\(it\.type\)/);
  assert.match(kt, /nativeGenStop\(handle\)\s*nativeBinStop\(handle\)\s*nativeModStop\(handle\)\s*sendEvent\("onOutputLost"/);
  assert.equal((kt.match(/companion object/g) ?? []).length, 1);
});

test('JS: the gate mutes on onOutputLost', () => {
  assert.match(readFileSync('src/features/audio/AudioOutputGate.tsx', 'utf8'), /useEffect\(\(\) => onOutputLost\(\(\) => panicMuteAudio\(\)\), \[\]\);/);
  assert.match(readFileSync('modules/ape-dsp/index.ts', 'utf8'), /export function onOutputLost\(cb: \(\) => void\): \(\) => void/);
});
