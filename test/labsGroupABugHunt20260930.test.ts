/**
 * Labs group A — toddler + cat bug hunt, 2026-09-30. Source guards for the
 * fixes, each pinned to the scenario it came from.
 */
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';
import { createTapLock } from '../src/screens/lab/kit/labNav.ts';

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

it('Foundations: the top NEXT/FINISH honours ONE nav lock (the shared strip’s)', () => {
  // The top row is kit/LabNavBar (2026-09-30); its NEXT / FINISH go through
  // useLabNav, whose single createTapLock(400) covers every strip tap. No
  // second, local NEXT remains to escape it.
  const src = read('src/screens/lab/foundations/FoundationsCourseScreen.tsx');
  assert.match(src, /<LabNavBar nav=\{nav\} \/>/);
  assert.doesNotMatch(src, /accessibilityLabel="Previous module"/);
  assert.doesNotMatch(src, /'FINISH ›'/);
  const hook = read('src/screens/lab/kit/useLabNav.ts');
  assert.match(hook, /const lock = useRef\(createTapLock\(400\)\)\.current;/);
  assert.match(hook, /const next = useCallback\(\(\) => \{\s*\n\s*if \(lock\(\)\) return;/);
});

it('module hosts: a double-tap on NEXT cannot skip the last module', () => {
  // Behaviour: the shared strip's one tap lock (kit/labNav createTapLock)
  // swallows the second tap of a double-tap inside 400 ms — so the second
  // tap, which would land after the re-render where NEXT is already FINISH,
  // never fires.
  let t = 1_000;
  const locked = createTapLock(400, () => t);
  assert.equal(locked(), false, 'first tap moves');
  t += 120;
  assert.equal(locked(), true, 'the double-tap\'s second tap is ignored');
  t += 400;
  assert.equal(locked(), false, 'a real next tap moves');
  // Wiring (WP1, 2026-09-30): the hosts route NEXT through useLabNav and keep
  // no private lock or handler of their own.
  for (const f of [
    'src/screens/lab/wave/WaveModuleScreen.tsx',
    'src/screens/lab/eq/EqModuleScreen.tsx',
    'src/screens/lab/digital/DigitalModuleScreen.tsx',
    'src/screens/lab/gain/GainModuleScreen.tsx',
    'src/screens/lab/cymatics/CymaticsModuleScreen.tsx',
  ]) {
    const src = read(f);
    assert.match(src, /from '\.\.\/kit\/LabNavBar'/, `${f} uses LabNavBar`);
    assert.match(src, /const nav = useLabNav\(\{/, f);
    assert.doesNotMatch(src, /nextTapAt|onPress=\{onNext\}/, f);
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
