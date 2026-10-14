/**
 * Toddler pass — Area 4, Audio Fundamentals labs (2026-10-13).
 *
 * The bottom-inset class: on Android's three-button bar (a ~48 pt solid
 * bottom inset under edge-to-edge) every lab READING scroll that ended on a
 * key — the in-flow NEXT / FINISH, MARK AS REVIEWED, UNDERSTOOD — CONTINUE,
 * the understanding check, GUIDED LESSON — padded a fixed 28–40 pt, so its
 * last key sat under the bar. The Rack Unit well, PagedLab and LabEndScreen
 * (with `bottomInset`) already pad the inset; the hand-rolled reading
 * scrolls did not. Source guards (the node runner cannot mount these views).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../src/screens/lab/${p}`, import.meta.url), 'utf8');

/** Every `<ScrollView … contentContainerStyle={…}>` opening tag in a file. */
function scrollTags(src: string): string[] {
  return src.match(/<ScrollView\b[^>]*?contentContainerStyle=\{[^\n]*/g) ?? [];
}

const FILES = [
  'micspeaker/MicPrinciplesLabScreen.tsx',
  'micspeaker/SpeakerCoverageLabScreen.tsx',
  'wave/WaveLabHomeScreen.tsx',
  'wave/WaveModuleScreen.tsx',
  'digital/DigitalLabHomeScreen.tsx',
  'digital/DigitalModuleScreen.tsx',
  'meter/MeterLabHomeScreen.tsx',
  'meter/MeterModuleScreen.tsx',
  'gain/GainLabHomeScreen.tsx',
  'roomdesign/RoomDesignLabScreen.tsx',
  'cable/CableLabScreen.tsx',
  'cableinstall/CableInstallLabScreen.tsx',
  'amplitude/AmplitudeOrientation.tsx',
  'LabShell.tsx',
];

describe('fundamentals labs: reading scrolls clear the Android button bar', () => {
  for (const f of FILES) {
    it(`${f}: every reading ScrollView pads insets.bottom`, () => {
      const tags = scrollTags(read(f));
      assert.ok(tags.length > 0, `no ScrollView found in ${f}`);
      for (const t of tags) assert.match(t, /insets\.bottom|scrollPad/, `${f}: ${t.trim()}`);
    });
  }

  it('GainModuleScreen: the multi-line reading ScrollView pads insets.bottom', () => {
    const src = read('gain/GainModuleScreen.tsx');
    assert.match(src, /contentContainerStyle=\{\[styles\.scroll, readingColumn, \{ paddingBottom: 30 \+ insets\.bottom \}\]\}/);
  });

  it('LabShell: scrollPad carries the inset', () => {
    assert.match(read('LabShell.tsx'), /const scrollPad = \{ paddingBottom: 28 \+ insets\.bottom \}/);
  });

  it("RoomDesign: the what's-left screen pads the inset like every other lab's", () => {
    const src = read('roomdesign/RoomDesignLabScreen.tsx');
    const end = src.slice(src.indexOf('<LabEndScreen'), src.indexOf('/>', src.indexOf('<LabEndScreen')));
    assert.match(end, /\bbottomInset\b/);
  });
});
