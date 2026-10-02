/**
 * Bug pass 2 of 3, 2026-09-30 — Labs group A ("toddler + cat"). Source-reading
 * pins for the second pass's fixes, so each one cannot quietly regress:
 *
 *   • Lab display text ≥ 9 pt (owner hard rule) in the Digital chain / DAC
 *     views and the Gain chain columns — and the labels that would have
 *     collided at 9 pt moved apart instead of overlapping.
 *   • The two EQ mic modules pass onRetry, so the error card has TRY AGAIN and
 *     the iOS return-from-Settings retry works.
 *   • A double-tap on ▶ (or a second chip while a start is in flight) no longer
 *     leaves silence under a lit ■: a superseded start only genStop()s when a
 *     stop() came after it (course voice, Playground, EQ audition), and the
 *     Cymatics drive keeps one start in flight.
 *   • EQ audition: a source chip tapped while ▶ is starting is the one heard.
 *   • Start Here: one outward screen per tap; no FREE/MEMBERS tags before the
 *     tier is known; one quiz answer per question.
 *   • DragSlider releases the host scroll lock if it unmounts mid-drag.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(p, 'utf8');

test('lab display text is never under 9 pt in the carried-over views', () => {
  const small = /fontSize: ?(?:[0-7](?:\.\d+)?|8(?:\.\d+)?)\s*[,}]/;
  for (const p of [
    'src/screens/lab/digital/vizChain.tsx',
    'src/screens/lab/digital/vizDac.tsx',
    'src/screens/lab/gain/gainViz.tsx',
  ]) {
    const lines = read(p).split('\n').filter((l) => small.test(l));
    assert.deepEqual(lines, [], p);
  }
});

test('labels that would collide at 9 pt were moved apart, not overlapped', () => {
  const chain = read('src/screens/lab/digital/vizChain.tsx');
  // HOLD WINDOWS / LEVEL RUNGS lean away from each other.
  assert.match(chain, /left: xray\.shCx - 46, width: 80/);
  assert.match(chain, /left: xray\.qCx - 34, width: 80/);
  // "analog rail" sits at the right end of the rail, clear of "0 dBFS".
  assert.match(chain, /right: w - plotR \+ 4, top: top - 1, fontFamily: fonts\.mono, fontSize: 9, color: withAlpha\(RED, 0\.55\)/);
  const dac = read('src/screens/lab/digital/vizDac.tsx');
  assert.match(dac, /\{ right: 10, top: h - 13 \}\]\}>VALUE ERROR/);
  const gain = read('src/screens/lab/gain/gainViz.tsx');
  // Pass 3: 44, not pass 2's 64 — 64 let "QUIET SOURCE" run into the next
  // column's label on a 7-column chain at 360 wide.
  assert.match(gain, /vRegionUnder: \{ width: 44, textAlign: 'center' \}/);
});

test('the EQ mic modules pass onRetry to the engine gate', () => {
  for (const p of ['src/screens/lab/eq/modules/SeeingFrequency.tsx', 'src/screens/lab/eq/modules/LiveSpectrumEq.tsx']) {
    assert.match(read(p), /<EngineGate state=\{state\} lastError=\{lastError\} onRetry=\{onStart\} \/>/, p);
  }
});

test('a superseded start silences the generator only after a stop()', () => {
  const unconditional = /if \(gen !== genRef\.current \|\| !isAudioOutputEnabled\(\)\) \{\s*\n\s*void ApeDsp\.genStop\(\);/;
  for (const p of [
    'src/screens/lab/foundations/FoundationsCourseScreen.tsx',
    'src/screens/lab/foundations/FoundationsPlaygroundScreen.tsx',
    'src/screens/lab/eq/modules/eqAudition.tsx',
  ]) {
    const src = read(p);
    assert.doesNotMatch(src, unconditional, p);
    assert.match(src, /stopGenRef\.current = \+\+genRef\.current;/, p);
    // Pass 3 tightened pass 2's `stopGen > gen` to "the stop is still the
    // latest act" — see bugPassLabsGroupA20260930c.test.ts. Since the start
    // fence (startFenced, 2026-10-02) the gate and the epoch are the helper's;
    // the site's `stop` declines ONLY for 'superseded' while a stop() is not
    // the latest act.
    assert.match(src, /why === 'superseded' && stopGenRef\.current !== genRef\.current(\) return;| \? undefined : ApeDsp\.genStop\(\))/, p);
    assert.doesNotMatch(src, /stop: \(\) => ApeDsp\.genStop\(\)/, `${p}: a superseded start must not stop unconditionally`);
  }
  // The course voice has three starts (sine, additive, stereo) — all guarded.
  const course = read('src/screens/lab/foundations/FoundationsCourseScreen.tsx');
  assert.equal(course.match(/why === 'superseded' && stopGenRef\.current !== genRef\.current \? undefined : ApeDsp\.genStop\(\)/g)?.length, 3);
});

test('the Cymatics drive: a double-tap on ▶ leaves the newer start sounding', () => {
  // Pass 2 pinned a one-start-in-flight lock here; pass 3 replaced it with the
  // stop-generation rule (the lock swallowed ▶ after ■, and every ▶ while the
  // output popup was up).
  const src = read('src/screens/lab/cymatics/useDriveTone.ts');
  assert.doesNotMatch(src, /startingRef/);
  assert.match(src, /stopGenRef\.current = \+\+genRef\.current;/);
});

test('EQ audition plays the chip picked last, even mid-start', () => {
  const src = read('src/screens/lab/eq/modules/eqAudition.tsx');
  assert.match(src, /const src = srcOf\(sourceRef\.current\);/);
  assert.match(src, /if \(sourceRef\.current !== src\.key\) ApeDsp\.genSet\(/);
  assert.match(src, /onPress=\{\(\) => \{\s*\n\s*sourceRef\.current = s\.key;\s*\n\s*setSource\(s\.key\);/);
});

test('Start Here opens one outward screen per tap', () => {
  const src = read('src/screens/startHere/StartHereScreen.tsx');
  assert.match(src, /const claimOpen = \(\) =>/);
  for (const k of ['openRoute: \\(route, params\\) => \\{', 'openTerms: \\(\\) => \\{', 'openSafety: \\(\\) => \\{', 'const openGlossary = \\(\\) => \\{']) {
    assert.match(src, new RegExp(`${k}\\s*\\n\\s*if \\(!claimOpen\\(\\)\\) return;`), k);
  }
});

test('Start Here: no access tags before the tier is known; one quiz answer per question', () => {
  assert.match(read('src/screens/startHere/NextSteps.tsx'), /const a = isMember \|\| !resolved \? '' : accessTag\(s\.access\);/);
  const terms = read('src/screens/startHere/StartHereTermsScreen.tsx');
  assert.match(terms, /if \(picked != null \|\| answeredRef\.current === i\) return;\s*\n\s*answeredRef\.current = i;/);
  assert.match(terms, /answeredRef\.current = -1; setSeed\(seed \+ 7919\)/);
});

test('DragSlider releases the scroll lock when it unmounts mid-drag', () => {
  const src = read('src/screens/lab/foundations/bits.tsx');
  assert.match(src, /draggingRef\.current = v;/);
  assert.match(src, /if \(!draggingRef\.current\) return;\s*\n\s*draggingRef\.current = false;\s*\n\s*lockRef\.current\.ctx\?\.\(false\);/);
});
