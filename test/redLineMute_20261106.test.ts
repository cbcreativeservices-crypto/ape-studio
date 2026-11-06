/**
 * Owner 2026-11-06: tapped the red line expecting a mute, and nothing happened,
 * because the popup promised "tap the red AUDIO OUTPUT row" on screens that do
 * not have one. "Yes, make it tappable."
 * Also the /get link preview (Comp A brief, same day).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const frame = read('src/features/audio/AudioBorderFrame.tsx');
const gate = read('src/features/audio/AudioOutputGate.tsx');

test('a tap on the red line is the full panic mute, not a flag flip', () => {
  assert.match(frame, /onPress=\{\(\) => panicMuteAudio\(\)\}/);
  assert.doesNotMatch(frame, /disableAudioOutput/);
  assert.match(frame, /accessibilityLabel="Mute audio"/);
});

test('the target stops just past the line, so the header below keeps its taps', () => {
  assert.match(frame, /Math\.max\(insets\.top \+ THICK \+ PAST_LINE, MIN_TARGET\)/);
  assert.match(frame, /const PAST_LINE = 4;/);
  assert.match(frame, /const MIN_TARGET = 12;/);
});

test('the line itself still takes no touches, and only shows while sound is on', () => {
  assert.match(frame, /<View pointerEvents="none" style=\{\[styles\.bar/);
  assert.match(frame, /if \(!on\) return null;/);
});

test('the popup names what works on every screen', () => {
  assert.match(gate, /tap the red line at the top of the screen/);
  assert.doesNotMatch(gate, /tap the red AUDIO OUTPUT row/);
});

test('/get and the site default carry the 1200 by 630 preview', () => {
  const get = read('web/app/get/layout.tsx');
  const root = read('web/app/layout.tsx');
  for (const t of [get, root]) {
    assert.match(t, /url: "\/og\/og-home\.png", width: 1200, height: 630/);
    assert.match(t, /summary_large_image/);
  }
  assert.ok(existsSync(new URL('../web/public/og/og-home.png', import.meta.url)));
});
