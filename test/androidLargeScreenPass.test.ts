/**
 * GUARD — the Android large-screen pass (owner 2026-09-29: "begin larger
 * screens for android if they need any thought like we've given to the iPads
 * for apple").
 *
 * What Android adds on top of the iPad pass:
 *   • FOLDABLES change class under a running app (folded ≈ 373 × 800 is a
 *     phone, unfolded ≈ 673 × 841 is a tablet), so nothing may decide
 *     "tablet" once at module scope;
 *   • SPLIT SCREEN and DESKTOP / CHROMEBOOK WINDOWS make the window smaller
 *     than the screen — layout follows the window, never the screen;
 *   • the PORTRAIT LOCK letterboxes an Android 12L–15 tablet held sideways and
 *     is ignored by Android 16 on any display ≥ 600 dp, so tablets are not
 *     locked at all (phones still are);
 *   • users raise the system FONT SIZE, so a readout that estimates its own
 *     width must scale the estimate by fontScale.
 *
 * ✅ PHONES: every assertion below either checks a branch a phone never takes
 * or checks that the phone numbers are exactly the pre-pass numbers.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { isTabletWindow } from '../src/theme/tablet.ts';
import { cardDimsFor, phoneCardDims } from '../src/screens/courses/cardDims.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
/** Code with comments stripped, so a guard cannot be satisfied by a comment. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

test('the tablet rule at Android sizes — tablets, foldables, split screen, windows', () => {
  const tablet: Array<[number, number, string]> = [
    [800, 1280, '10" tablet upright'],
    [1280, 800, '10" tablet sideways (Galaxy Tab S-class)'],
    [1200, 1920, '12" tablet upright'],
    [1920, 1200, '12" tablet sideways'],
    [673, 841, 'foldable, unfolded'],
    [841, 673, 'foldable, unfolded, sideways'],
    [640, 800, 'half of a sideways 10" tablet in split screen'],
    [800, 630, 'top half of an upright 10" tablet in split screen'],
  ];
  const phone: Array<[number, number, string]> = [
    [360, 800, 'Android phone'],
    [412, 915, 'large Android phone'],
    [373, 800, 'foldable, folded (cover screen)'],
    [390, 844, 'iPhone'],
    [411, 400, 'phone split screen, one half'],
    [400, 700, 'small desktop / Chromebook window'],
    [1024, 500, 'short, wide desktop window'],
  ];
  for (const [w, h, what] of tablet) assert.equal(isTabletWindow(w, h), true, `${what} ${w}×${h}`);
  for (const [w, h, what] of phone) assert.equal(isTabletWindow(w, h), false, `${what} ${w}×${h}`);
});

/** The pre-pass phone card, verbatim: sized from the physical screen. */
function oldPhoneCard(sw: number, sh: number) {
  const w = Math.min(Math.round(Math.min(sw, sh) * 0.7 * 0.93), 280);
  const h = Math.max(260, Math.min(409, Math.max(sw, sh) - 394));
  return { w, h };
}

test('Home deck: every phone, full screen, gets exactly the pre-pass card', () => {
  for (const [sw, sh] of [[360, 800], [390, 844], [412, 915], [375, 667], [430, 932], [393, 852]]) {
    const old = oldPhoneCard(sw, sh);
    // Window == screen (iOS; Android edge-to-edge) and window a nav bar short
    // of the screen (an Android build that reports the window without it).
    for (const winH of [sh, sh - 48]) {
      const d = cardDimsFor(sw, winH, sw, sh);
      assert.deepEqual({ w: d.w, h: d.h }, old, `${sw}×${sh} screen, ${sw}×${winH} window`);
    }
  }
});

test('Home deck: a foldable follows fold and unfold', () => {
  const unfolded = cardDimsFor(673, 841, 673, 841);
  assert.ok(unfolded.w > 280, `unfolded gets the grown tablet card (w=${unfolded.w})`);
  assert.ok(unfolded.h + 394 <= 841, 'and it still fits under the deck chrome');
  const folded = cardDimsFor(373, 800, 373, 800);
  assert.deepEqual({ w: folded.w, h: folded.h }, oldPhoneCard(373, 800), 'folded = the phone card');
});

test('Home deck: a window smaller than the screen sizes from the WINDOW', () => {
  // 400 × 700 desktop window on a 1366 × 768 Chromebook: was a 280 × 409 card
  // (tablet branch off the screen) with only 306 pt of room.
  const win = cardDimsFor(400, 700, 1366, 768);
  assert.ok(win.h <= 700 - 394, `card fits the window (h=${win.h})`);
  assert.equal(win.w, oldPhoneCard(400, 700).w);
  // A screen reported as 0 × 0 (seen in the web preview) never yields a 0-wide card.
  const zero = phoneCardDims(390, 844, 0, 0);
  assert.deepEqual({ w: zero.w, h: zero.h }, oldPhoneCard(390, 844));
  // A tablet in full screen is unchanged by the pass (the iPad-pass rule:
  // never smaller than the phone card).
  const tab = cardDimsFor(1280, 800, 1280, 800);
  assert.deepEqual({ w: tab.w, h: tab.h }, { w: 280, h: 409 });
});

test('Home deck: the card size is read LIVE, not from module scope', () => {
  const src = code('src/screens/courses/CourseSelectionScreen.tsx');
  assert.doesNotMatch(src, /IS_TABLET/, 'no boot-time tablet flag');
  assert.match(src, /function useCardDims\(\)[\s\S]{0,200}useWindowDimensions\(\)[\s\S]{0,200}Dimensions\.get\('screen'\)/);
  assert.match(src, /cardDimsFor\(width, height, screen\.width, screen\.height\)/);
});

test('no NEW module-scope Dimensions read decides layout', () => {
  // A top-level `Dimensions.get(...)` is evaluated once, at app boot, in
  // whatever shape the app started — wrong after a fold, a split or a resize.
  // Two known, bounded exceptions:
  //   • CourseSelectionScreen — stylesheet fallback only; every card site
  //     spreads the live `useCardDims()` over it;
  //   • Rt60Demo — a 268–304 pt demo drawing; only the narrowest phones differ.
  const allowed = new Set(['src/screens/courses/CourseSelectionScreen.tsx', 'src/components/tooldemos/Rt60Demo.tsx']);
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(new URL(`../${dir}`, import.meta.url))) {
      const p = `${dir}/${f}`;
      if (statSync(new URL(`../${p}`, import.meta.url)).isDirectory()) walk(p);
      else if (/\.tsx?$/.test(f) && !allowed.has(p) && /^(?:export )?const \w+ = Dimensions\.get\(/m.test(code(p))) offenders.push(p);
    }
  };
  walk('src');
  assert.deepEqual(offenders, []);
});

test('orientation: phones stay portrait, tablets are never locked', () => {
  const nav = code('src/navigation/navOrientation.ts');
  assert.match(nav, /NAV_PORTRAIT = \{ orientation: 'portrait_up' \}/, 'the phone default is unchanged');
  assert.match(nav, /NAV_FREE = \{ orientation: 'default' \}/);
  assert.match(nav, /return tablet \? NAV_FREE : NAV_PORTRAIT;/);
  assert.match(nav, /return isTabletDisplay\(\) \? 'default' : phone;/);
  const safe = code('src/lib/screenOrientationSafe.ts');
  assert.match(safe, /if \(isTabletDisplay\(\)\) \{\s*so\.unlockAsync\(\)/, 'lockPortrait unlocks on a tablet');
  assert.match(safe, /so\.lockAsync\(so\.OrientationLock\.PORTRAIT_UP\)/, 'and still locks a phone');
  const useTab = code('src/theme/useIsTablet.ts');
  assert.match(useTab, /Dimensions\.get\('screen'\)[\s\S]*isTabletWindow\(s\.width, s\.height\)/, 'device class = the live display, same 600 rule');
  // Every full screen that returned to 'portrait' now returns to the resting orientation.
  for (const f of ['SplMeterScreen', 'WaveformScreen', 'ToolFullScreen', 'FrequencyCounterScreen']) {
    const src = code(`src/screens/tools/${f}.tsx`);
    assert.doesNotMatch(src, /orientation: 'portrait(_up)?'/, `${f} never hard-codes portrait`);
    assert.match(src, /restingOrientation\('portrait(_up)?'\)/, f);
  }
  // A foldable that changes class re-applies the rule at the root.
  const app = code('App.tsx');
  assert.match(app, /Dimensions\.addEventListener\('change'[\s\S]{0,200}if \(now === tablet\) return;/);
});

test('bezel readouts size their crop test at the user\'s font size', () => {
  const src = code('src/screens/lab/rack/BezelReadouts.tsx');
  assert.match(src, /const \{ fontScale \} = useWindowDimensions\(\);/);
  assert.match(src, /s\.length \* V_CH \* \(fontScale \|\| 1\) <= avail/);
});

test('landscape notice: tablets get tablet words, phones keep their sentence', () => {
  const src = read('src/components/LandscapeRequiredNotice.tsx');
  assert.match(src, /'TURN YOUR PHONE SIDEWAYS'/);
  assert.match(src, /your phone&apos;s rotation lock is on — switch it\s+off and try again\./);
  assert.match(src, /tablet \? 'TURN YOUR TABLET SIDEWAYS'/);
});
