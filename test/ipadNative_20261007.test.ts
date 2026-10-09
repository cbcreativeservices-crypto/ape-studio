/**
 * GUARD — the iPad pass, NATIVE half (owner iPad report 2026-10-06: "Spectrogram
 * and SPL wheel meter both did not work at all").
 *
 * ⛔ THIS COMMIT MOVES THE iOS RUNTIME FINGERPRINT (runtimeVersion policy
 * 'fingerprint'): it ships ONLY in a new iOS build, and once merged, no OTA from
 * that branch reaches builds 33/34. Merge it when the owner orders the build.
 */
import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const read = (f: string) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');

// ── 3. Audio tools — native hardening (needs a BUILD) ───────────────────────

test('iOS capture: the core runs at the rate the mic tap delivers, and a dead input is an error, not a crash', () => {
  const s = read('modules/ape-dsp/ios/ApeDspModule.swift');
  const start = s.slice(s.indexOf('private func startCapture()'), s.indexOf('private func stopCapture('));
  assert.ok(start.length > 0);
  // The guard comes BEFORE installTap (the uncatchable exception).
  const guardAt = start.indexOf('guard format.sampleRate > 0, format.channelCount > 0 else {');
  const tapAt = start.indexOf('input.installTap(');
  assert.ok(guardAt > 0 && tapAt > guardAt, 'refuse a 0 Hz / 0 ch input before installTap');
  assert.match(start, /throw NSError\(domain: "ApeDsp", code: 2/);
  // The core is configured from the tap format, after it is read.
  assert.match(start, /sampleRate = format\.sampleRate\n\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n\s*core\.configureSampleRate\(sampleRate\)/);
  assert.ok(start.indexOf('core.configureSampleRate(sampleRate)') > start.indexOf('let format = input.inputFormat(forBus: 0)'));
  // The generator no longer re-scales a running capture to the session's rate.
  assert.match(s, /let sr = running && sampleRate > 0 \? sampleRate : \(session\.sampleRate > 0 \? session\.sampleRate : 48_000\)/);
  const gen = s.slice(s.indexOf('private func startGeneratorOutput()'), s.indexOf('private var genRenderPulls'));
  assert.ok(gen.indexOf('let sr = running && sampleRate > 0') > 0);
  assert.ok(gen.indexOf('let sr = running && sampleRate > 0') < gen.indexOf('core.configureSampleRate(sr)'));
});
