/**
 * FULL SCREEN "READ" step (owner 2026-10-19, option A): a drawing whose
 * printed words are too small at 3× reports the zoom at which its smallest
 * printed word reaches 9 pt, and the shared full screen offers READ there.
 * Opt-in: a drawing that reports nothing keeps the zoom row exactly as before.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { READ_MAX, ZOOM_FACTORS, zoomSteps } from '../src/screens/lab/rack/stageFitMath.ts';
import { PRINTED_MIN_MM, READ_SAFETY, readZoomFor } from '../src/screens/lab/dj/art/djZoom.ts';

const lab = join(import.meta.dirname, '..', 'src', 'screens', 'lab');
const src = (p: string) => readFileSync(join(lab, p), 'utf8');
const keys = (s: { key: string }[]) => s.map((x) => x.key).join(' ');

describe('the zoom row (shared rack)', () => {
  it('a drawing that reports no READ gets the row exactly as before', () => {
    assert.equal(keys(zoomSteps(1)), '1 1.5 2 3');
    assert.equal(keys(zoomSteps(2.4)), '1 1.5 2 fit 3');
    assert.equal(keys(zoomSteps(1, null, true)), '1 1.5 2 3', 'narrow alone changes nothing');
    assert.deepEqual([...ZOOM_FACTORS], [1, 1.5, 2, 3]);
  });
  it('READ comes last, at the reported factor', () => {
    const s = zoomSteps(1, 7.06);
    assert.equal(keys(s), '1 1.5 2 3 read');
    assert.equal(s[s.length - 1].factor, 7.06);
    assert.equal(s[s.length - 1].label, 'READ');
  });
  it('READ is offered only past the top step (3× or FIT), and never past READ_MAX', () => {
    assert.equal(keys(zoomSteps(1, 3.1)), '1 1.5 2 3', 'barely past 3×: not worth a key');
    assert.equal(keys(zoomSteps(4, 3.6)), '1 1.5 2 3 fit', 'FIT already reads the words');
    assert.equal(zoomSteps(1, 40).at(-1)!.factor, READ_MAX);
  });
  it('on a narrow phone a row with READ drops 1.5× so every key fits', () => {
    assert.equal(keys(zoomSteps(2.4, 7, true)), '1 2 fit 3 read');
    assert.equal(keys(zoomSteps(2.4, 7, false)), '1 1.5 2 fit 3 read');
  });
  it('the full screen wires it: an optional report, cleared on close, compact keys only with READ', () => {
    const fs = src('rack/StageFullScreen.tsx');
    assert.match(src('rack/stageAspect.ts'), /readAt\?: \(factor: number \| null\) => void;/);
    assert.match(fs, /zoomSteps\(fit, read, width < READ_ROW_NARROW_W\)/);
    assert.match(fs, /if \(!visible\) setRead\(null\);/);
    assert.match(fs, /const compactKeys = landscape \|\| steps\.some\(\(s\) => s\.key === 'read'\);/);
    assert.match(fs, /'Zoom in until the printed words can be read'/);
  });
});

describe('READ in the DJ lab (screens 1 and 4)', () => {
  it('the factor brings the smallest printed word to 9 pt, with a small margin', () => {
    // screen 1, phone upright: the 970 mm booth at about 0.39 pt per mm at 1×
    const f = readZoomFor(PRINTED_MIN_MM, 0.39)!;
    assert.ok(Math.abs(PRINTED_MIN_MM * 0.39 * f - 9 * READ_SAFETY) < 1e-9);
    assert.ok(f > 6.5 && f < 7.5, `about 7× (${f.toFixed(2)})`);
    assert.equal(readZoomFor(0, 1), null);
    assert.equal(readZoomFor(3.4, 0), null);
  });
  it('the Scene reports only in full screen at 1×; past 3× its callouts stop growing', () => {
    const scene = src('dj/art/Scene.tsx');
    assert.match(scene, /readMm === undefined \|\| !inFull \|\| dz\.z !== 1 \? undefined/);
    assert.match(scene, /report\?\.readAt\?\.\(readF\)/);
    assert.match(scene, /Math\.min\(dz\.z, READ_WORDS_CAP\)/);
    assert.match(scene, /export const READ_WORDS_CAP = 3;/);
  });
  it('screens 1 and 4 ask for it; screen 4’s CABLE view withdraws it', () => {
    assert.match(src('dj/pages/p01Welcome.tsx'), /readMm: PRINTED_MIN_MM,/);
    assert.match(src('dj/art/BoothStage.tsx'), /readMm=\{useFull \? undefined : spec\.readMm\}/);
    assert.match(src('dj/pages/p04Build.tsx'), /readMm=\{cable \? null : PRINTED_MIN_MM\}/);
  });
  it('no other screen asks for it (opt-in)', () => {
    for (const n of ['02Gear', '03Connect', '05Play', '06Gain', '07Cue', '17Vinyl', '20Pa']) {
      const f = readFileSync(join(lab, 'dj', 'pages', `p${n}.tsx`), 'utf8');
      assert.doesNotMatch(f, /readMm/, `p${n}`);
    }
  });
});

describe('Screen 17: a gap between the labels and the plinth', () => {
  it('the plinth is a label obstacle grown by 6 pt at every zoom', () => {
    const p17 = src('dj/pages/p17Vinyl.tsx');
    assert.match(p17, /export const PLINTH_GAP_PT = 6;/);
    assert.match(p17, /const g = PLINTH_GAP_PT \/ Math\.max\(1e-6, s\);/);
    assert.match(p17, /obstaclesAt=\{plinthGap\}/);
  });
});
