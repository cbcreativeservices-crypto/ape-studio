/**
 * Labs group A — toddler + cat bug hunt, 2026-09-30. Source guards for the
 * fixes, each pinned to the scenario it came from.
 */
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';

const read = (p: string) => readFileSync(p, 'utf8');

it('WaveformView: the audio is synthesised per signal/width, never per fader step', () => {
  const src = read('src/screens/lab/meter/vizMeters.tsx');
  // renderOverview lives in the memo keyed on signal/overview/width…
  assert.match(src, /renderOverview\(p\.signal\)[\s\S]*?\}, \[p\.signal, overview, w\]\);/);
  // …and the gain-dependent memo depends on that result, not on p.signal.
  assert.match(src, /\}, \[R, gain, dc, inv, showClip, w, h, ts\]\);/);
});

it('Start Here: START OVER stops the tone (it lands on a page with no PLAY)', () => {
  const src = read('src/screens/startHere/StartHereScreen.tsx');
  assert.match(src, /const doReset = \(\) => \{\s*(\/\/[^\n]*\n\s*)*tone\.stop\(\);/);
});

it('Foundations: the top NEXT/FINISH honours the nav lock', () => {
  const src = read('src/screens/lab/foundations/FoundationsCourseScreen.tsx');
  const top = src.slice(src.indexOf('accessibilityLabel="Previous module"'));
  const handler = top.slice(0, top.indexOf("'Next module'"));
  assert.match(handler, /if \(navLocked\(\)\) return;/);
});

it('module hosts: a double-tap on NEXT cannot skip the last module', () => {
  for (const f of [
    'src/screens/lab/wave/WaveModuleScreen.tsx',
    'src/screens/lab/eq/EqModuleScreen.tsx',
    'src/screens/lab/digital/DigitalModuleScreen.tsx',
    'src/screens/lab/gain/GainModuleScreen.tsx',
    'src/screens/lab/cymatics/CymaticsModuleScreen.tsx',
  ]) {
    const src = read(f);
    assert.match(src, /if \(Date\.now\(\) - nextTapAt\.current < 400\) return;/, f);
    assert.match(src, /onPress=\{onNext\}/, f);
    assert.doesNotMatch(src, /onPress=\{\(\) => \(idx >= last \? setEnding\(true\)/, f);
  }
});

it('Cymatics export: a double-tap cannot stack two share/print jobs', () => {
  const src = read('src/screens/lab/cymatics/ExportPanel.tsx');
  assert.match(src, /if \(busyRef\.current\) return;\s*busyRef\.current = true;/);
});

it('Meter lab accuracy note does not claim the (synthetic) displays use the mic', () => {
  for (const f of ['src/screens/lab/meter/MeterModuleScreen.tsx', 'src/screens/lab/meter/MeterLabHomeScreen.tsx']) {
    assert.doesNotMatch(read(f), /These meters run on your phone’s UNCALIBRATED microphone/, f);
  }
});
