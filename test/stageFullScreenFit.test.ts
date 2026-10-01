/**
 * The shared FULL SCREEN frame uses the space (owner 2026-10-01: "change the
 * shared full-screen frame so every lab uses the space better").
 *
 * The maths is pure (rack/stageFitMath.ts) and pinned here with the real
 * numbers of a 390×844 phone, portrait and sideways:
 *  - 1× is the whole drawing, never smaller than the glass (textScale ≥ 1 for
 *    a shaped drawing — the 9 pt floor holds sideways);
 *  - FIT fills the body's other side and exists only when it gains;
 *  - the opening is still 1×; a wide drawing in portrait is sent sideways;
 *  - sideways the readouts and badge fold into the bar and the hint goes.
 * Then the view is checked for wiring these in, as behaviour.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  FIT_CROPS_PAST_HALF,
  FIT_MIN_GAIN,
  anchorOffset,
  baseSize,
  compaction,
  factorOf,
  fitFactor,
  isLandscape,
  textScaleFor,
  wantsRotate,
  zoomSteps,
} from '../src/screens/lab/rack/stageFitMath.ts';

const read = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');

// RackUnit: glassW = 390 − 2×10 faceplate − 2 border = 368 (portrait), 822 sideways.
const PORTRAIT = { fitW: 390 - 16, fitH: 520 }; // body after bar, readouts, hint, badge, dock
const SIDEWAYS = { fitW: 844 - 16, fitH: 190 }; // body after the folded bar and the dock

describe('1× — the whole drawing, its text never under glass size', () => {
  test('a wide FX drawing in portrait is the glass again (ts ≈ 1), uncropped', () => {
    const b = baseSize({ ...PORTRAIT, shape: { aspect: 368 / 158, pad: 0 } });
    assert.equal(Math.round(b.w), 374);
    assert.equal(Math.round(b.h), 161);
    assert.ok(textScaleFor(b.w, 368) >= 1, 'textScale ≥ 1');
    assert.ok(Math.abs(b.w / b.h - 368 / 158) < 1e-9, 'aspect kept — never distorted');
  });

  test('sideways a height-limited drawing comes out narrower than its glass — the text scale is floored at 1', () => {
    // The Mic/Tube GlassShape rule sideways: sideways glass width over the portrait glass height.
    const shape = { aspect: 822 / 198, pad: 0 };
    const b = baseSize({ ...SIDEWAYS, shape });
    assert.ok(b.w < 822, `contain-fit is narrower than the glass (${b.w.toFixed(0)})`);
    assert.ok(b.w / 822 < 1, 'the raw ratio would shrink the labels');
    assert.equal(textScaleFor(b.w, 822), 1, 'floored: labels stay at glass size');
    assert.ok(b.h <= SIDEWAYS.fitH + 1e-9, 'and the whole drawing still fits — nothing to pan at 1×');
  });

  test("the Amp's tall rig sideways: the raw ratio was 0.3 — floored to 1, the panel titles stay legible", () => {
    const b = baseSize({ ...SIDEWAYS, shape: { aspect: 1.2, pad: 6 } });
    assert.ok(b.w / 822 < 0.35, `raw ratio ${(b.w / 822).toFixed(2)}`);
    assert.equal(textScaleFor(b.w, 822), 1);
    assert.equal(textScaleFor(b.w * 3, 822), 1, 'even 3× of a tiny 1× stays at glass size, never under');
    assert.ok(textScaleFor(1122, 368) > 3, 'portrait 3× still grows the labels');
    assert.equal(textScaleFor(500, 0), 1, 'unknown glass = 1');
  });

  test('a drawing without a shape takes the whole body', () => {
    const b = baseSize({ ...PORTRAIT, shape: null });
    assert.deepEqual(b, { w: PORTRAIT.fitW, h: PORTRAIT.fitH });
  });

  test('StageFit padding is kept inside the box', () => {
    const b = baseSize({ ...PORTRAIT, shape: { aspect: 2, pad: 6 } });
    assert.equal(b.w, PORTRAIT.fitW);
    assert.equal(b.h, (PORTRAIT.fitW - 12) / 2 + 12);
  });
});

describe('FIT — fills the other side, only when it gains', () => {
  test('the wide FX strip in portrait: FIT fills the height (≈3.2×) and is past the half-crop line', () => {
    const b = baseSize({ ...PORTRAIT, shape: { aspect: 368 / 158, pad: 0 } });
    const fit = fitFactor({ baseW: b.w, baseH: b.h, ...PORTRAIT });
    assert.ok(fit > 3 && fit < 3.4, `FIT ≈ 3.2 (${fit.toFixed(2)})`);
    assert.ok(fit > FIT_CROPS_PAST_HALF);
    assert.ok(zoomSteps(fit).some((s) => s.key === 'fit'), 'a FIT key is offered');
  });

  test("the Amp's tall three-panel rig sideways: FIT fills the width", () => {
    const aspect = 1.2;
    const b = baseSize({ ...SIDEWAYS, shape: { aspect, pad: 6 } });
    assert.ok(b.h <= SIDEWAYS.fitH + 1e-9, '1× fits the short body');
    const fit = fitFactor({ baseW: b.w, baseH: b.h, ...SIDEWAYS });
    assert.ok(fit > 3, `the rig can fill the width (${fit.toFixed(2)}×)`);
    assert.equal(Math.round(b.w * fit), SIDEWAYS.fitW);
  });

  test('the square Binaural stage in portrait: FIT ≈ 1.4× — the key appears above the gain floor', () => {
    const b = baseSize({ ...PORTRAIT, shape: { aspect: 1, pad: 0 } });
    const fit = fitFactor({ baseW: b.w, baseH: b.h, ...PORTRAIT });
    assert.ok(Math.abs(fit - PORTRAIT.fitH / PORTRAIT.fitW) < 1e-9);
    assert.ok(fit > FIT_MIN_GAIN);
    const keys = zoomSteps(fit).map((s) => s.key);
    assert.deepEqual(keys, ['1', 'fit', '1.5', '2', '3'], 'FIT sits among the steps by its factor');
  });

  test('no FIT when 1× already fills both sides, or when the gain is under the floor', () => {
    assert.equal(fitFactor({ baseW: 374, baseH: 520, fitW: 374, fitH: 520 }), 1);
    assert.deepEqual(zoomSteps(1).map((s) => s.key), ['1', '1.5', '2', '3']);
    assert.ok(!zoomSteps(1.1).some((s) => s.key === 'fit'), 'under the gain floor: no key');
    assert.ok(zoomSteps(FIT_MIN_GAIN + 0.01).some((s) => s.key === 'fit'));
  });

  test('a FIT key whose step is gone (rotation) reads as 1×', () => {
    assert.equal(factorOf(zoomSteps(1), 'fit'), 1);
    assert.equal(factorOf(zoomSteps(1.4), 'fit'), 1.4);
    assert.equal(factorOf(zoomSteps(1.4), '2'), 2);
  });
});

describe('the frame around the drawing', () => {
  test('a wide strip in portrait asks for sideways; a square or a sideways view does not', () => {
    assert.equal(wantsRotate({ landscape: false, baseH: 161, fitH: 520, fit: 3.2 }), true);
    assert.equal(wantsRotate({ landscape: false, baseH: 374, fitH: 520, fit: 1.4 }), false);
    assert.equal(wantsRotate({ landscape: true, baseH: 98, fitH: 190, fit: 1.9 }), false);
  });

  test('sideways folds readouts + badge into the bar and drops the hint; portrait keeps the rows', () => {
    assert.deepEqual(compaction(true), { readoutsInBar: true, badgeInFoot: true, hint: false });
    assert.deepEqual(compaction(false), { readoutsInBar: false, badgeInFoot: false, hint: true });
    assert.equal(isLandscape(844, 390), true);
    assert.equal(isLandscape(390, 844), false);
  });

  test('zoom anchoring: the touched spot lands mid-view, clamped to the content', () => {
    assert.equal(anchorOffset(1122, 374, 0.5), 374); // centre of a 3× drawing
    assert.equal(anchorOffset(1122, 374, 0), 0);
    assert.equal(anchorOffset(1122, 374, 1), 748);
    assert.equal(anchorOffset(300, 374, 0.5), 0, 'nothing to pan');
  });
});

describe('StageFullScreen wires the rules in', () => {
  const src = read('src/screens/lab/rack/StageFullScreen.tsx');

  test('sizes from the pure maths', () => {
    assert.match(src, /baseSize\(\{ fitW, fitH, shape: effShape \}\)/);
    assert.match(src, /const steps = zoomSteps\(fit\)/);
    assert.match(src, /const zoom = factorOf\(steps, stepKey\)/);
  });

  test('every opening is still 1×', () => {
    // Reset on every visibility change (open AND close, 2026-10-01).
    assert.match(src, /useEffect\(\(\) => \{\s*setStepKey\('1'\);\s*\}, \[visible\]\);/);
  });

  test('a FIT key is a radio step with its own label', () => {
    assert.match(src, /s\.key === 'fit' \? 'Zoom to fit the screen'/);
  });

  test('pan follows overflow, not only the step', () => {
    assert.match(src, /const panX = w > bodyW;/);
    assert.match(src, /const panY = h > bodyH \|\| overlayLift > 0;/);
    assert.match(src, /scrollEnabled=\{panY\}/);
    assert.match(src, /scrollEnabled=\{panX\}/);
  });

  test('sideways: the readouts ride in the bar, the badge on one line in the foot row; the hint row is gone', () => {
    assert.match(src, /fold\.readoutsInBar && readouts \? <View style=\{styles\.barReadouts\}>\{readouts\}<\/View>/);
    assert.match(src, /fold\.badgeInFoot && badge \?/);
    assert.match(src, /\{fold\.hint \? \(/);
    assert.match(src, /badgeInFoot: \{[^}]*fontSize: 9\.5/, 'the foot badge keeps the 9 pt floor');
    assert.match(src, /minimumFontScale=\{0\.95\}/, '…and shrinks no further than 9.0 pt to stay whole');
    // The zoom row keeps its width beside the flexible readout cells.
    assert.match(src, /zoomsTight: \{ flexGrow: 0, flexShrink: 0, flexBasis: 'auto'/);
  });

  test('the dock folds to a handle on a tap, never while a tray holds it up', () => {
    assert.match(src, /const dockUp = !dockFolded \|\| overlayLift > 0;/);
    assert.match(src, /\{controls && dockUp \? \(/);
    assert.match(src, /\{controls && overlayLift <= 0 \? \(\s*<Pressable\s+onPress=\{toggleDock\}/);
  });

  test('a wide drawing in portrait is sent sideways, in the hint', () => {
    assert.match(src, /const rotate = wantsRotate\(\{ landscape, baseH, fitH, fit \}\)/);
    assert.match(src, /turn the \$\{[^}]+\} sideways to see it big, or tap FIT/);
  });

  test('the text scale is rendered ÷ glass width floored at 1, and the glass width is published for GlassShape', () => {
    assert.match(src, /const textScale = textScaleFor\(w, glassW \?\? 0\)/);
    assert.match(src, /<StageGlassWidth\.Provider value=\{glassW \?\? 0\}>/);
    const gs = read('src/screens/lab/glassShape.tsx');
    assert.match(gs, /const glassWTold = useContext\(StageGlassWidth\);/);
    assert.match(gs, /const glassWNow = glassWTold > 0 \? glassWTold : w \/ ts;/, 'GlassShape no longer divides a floored scale');
  });
});
