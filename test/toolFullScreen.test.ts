/**
 * The RTA and the Spectrogram have a FULL SCREEN, the audio tools' kind
 * (owner 2026-09-29: "Both the spectrogram and spectrum analyzer/RTA audio
 * tools need full screen versions of their display like the other audio
 * tools have").
 *
 * Pins the mechanism, not the pixels:
 *  - both screens mount the shared ToolFullScreenView and open it through the
 *    tools' fullscreen gate (useFullScreenGate), like the Waveform and SPL;
 *  - the full screen is a ROOT-LEVEL overlay, never a native Modal (a Modal
 *    beside another Modal renders behind on Android);
 *  - it forces landscape on open, restores portrait on close, and the close
 *    waits for the window to be portrait again (the ghost-flash fix);
 *  - the inline drawing steps aside while it is up — one live copy, one
 *    capture.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (rel: string) => readFileSync(new URL(`../src/screens/tools/${rel}`, import.meta.url), 'utf8');

for (const name of ['RtaScreen', 'SpectrogramScreen']) {
  test(`${name} exposes the tools' full screen`, () => {
    const src = read(`${name}.tsx`);
    assert.match(src, /<ToolFullScreenView\b/, 'mounts the shared full-screen view');
    assert.match(src, /useToolFullScreen\(navigation/, 'drives it with the shared lifecycle hook');
    assert.match(src, /fsGate\.gate\(fs\.openFs\)/, 'opens through the tools fullscreen gate');
    assert.match(src, /fs\.shown \?/, 'the inline drawing steps aside while the full screen is up');
    assert.match(src, /<FsChooser\b/, 'its choosers render at the screen root');
  });
}

test('the RTA full-screen key is the rack faceplate key (host-owned view)', () => {
  const src = read('RtaScreen.tsx');
  assert.match(src, /onEnlarge:\s*\(\)\s*=>\s*fsGate\.gate\(fs\.openFs\)/);
});

test('the shared full screen is a root overlay that rotates and restores', () => {
  const src = read('ToolFullScreen.tsx');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  assert.doesNotMatch(code, /<Modal\b/, 'never a native Modal');
  assert.match(code, /lockLandscape\(\)/, 'forces landscape on open');
  assert.match(code, /lockPortrait\(\)/, 'restores portrait on close');
  // Phones rest 'portrait'; restingOrientation() frees a tablet (Android large-screen pass 2026-09-29).
  assert.match(code, /orientation:\s*active \? 'landscape' : restingOrientation\('portrait'\)/, 'declarative route orientation');
  assert.match(code, /hardwareBackPress/, 'Android back closes it');
  assert.match(code, /accessibilityLabel="Close fullscreen"/, 'the same close key as the Waveform');
});
