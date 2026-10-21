/**
 * DJ Systems Lab — screens 17 and 18 after the 2026-10-19 grade:
 *
 *   - ONE POSE FOR EVERY VIEW of the arm. The top view and the side views are
 *     driven by the same pose (no auto-return on a DJ deck): in every state
 *     of the screen-17 arm (lowered / lifted, scale on / off, any weight) and
 *     the platter (turning / stopped), the stylus is on the record in BOTH
 *     views, or off it in BOTH;
 *   - the side view's record is where it really is under the arm's line (a
 *     12-inch record reaches to within ~100 mm of the pivot, not 160 mm);
 *   - the booth view's turntable is a DJ deck's true height (~160 mm);
 *   - screen 18's needle stays in the control record's groove with the
 *     platter stopped (calibration needs it there).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ARM_CLEAR_ANGLE, ARM_SIDE, armAngleAt, armPoseAngle, armSection, stylusRadius } from '../src/screens/lab/dj/geometry/armGeometry.ts';
import { GROOVE, TT } from '../src/screens/lab/dj/geometry/boothGeometry.ts';
import { VINYL_ARM_AWAY, armSidePose, freshVinyl, setVinyl, vinylArmOn, type VinylState } from '../src/screens/lab/dj/model/djVinyl.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
const RECORD_R = TT.record.d / 2;
const PLATTER_R = TT.platter.d / 2;
const total = 300;

/** Every arm state screen 17 can reach (lowered / lifted × scale × weight). */
function states(): VinylState[] {
  const out: VinylState[] = [];
  for (const base of [freshVinyl(), setVinyl()])
    for (const armUp of [false, true])
      for (const scale of [false, true])
        for (const weight of [0, 1.5, 2.3, 2.4, 4.8, 6.3, 9]) out.push({ ...base, armUp, scale: scale && !armUp, weight });
  return out;
}

describe('DJ Systems Lab — screen 17: the top and side views agree on the arm', () => {
  for (const playing of [false, true]) {
    it(`platter ${playing ? 'turning' : 'STOPPED'}: on the record in both views, or off it in both`, () => {
      for (const v of states()) {
        for (const pos of [0, total * 0.3, total * 0.7, total]) {
          const on = vinylArmOn(v);
          // the angle the TOP view draws (the page hands the same one to the side views)
          const ang = armPoseAngle(on, VINYL_ARM_AWAY, pos, total);
          const r = stylusRadius(ang);
          const side = armSidePose(v);
          const sec = armSection(ang);
          const underStylus = !!sec.record && sec.record[0] <= ARM_SIDE.L && ARM_SIDE.L <= sec.record[1];
          assert.equal(side.onRecord, on, `side view onRecord, armUp ${v.armUp}`);
          if (on) {
            // the top view: the stylus in a music groove — never back on its rest
            assert.ok(r >= GROOVE.runOut - 0.5 && r <= GROOVE.leadIn + 0.5, `top-view stylus at r ${r.toFixed(1)}`);
            // the side view: the record under the stylus, the tip on it (or on the scale's pad)
            assert.ok(underStylus, 'the side view draws the record under the stylus');
            assert.ok(side.tipAbove === 0 || (v.scale && side.tipAbove === 8));
          } else {
            // lifted clear: past the platter's rim in the top view …
            assert.ok(r > PLATTER_R + 10, `clear of the platter: r ${r.toFixed(1)}`);
            // … and no record under the stylus in the side view
            assert.ok(!underStylus, 'no record under a lifted stylus');
          }
        }
      }
    });
  }
  it('stopping the platter does not move the arm (no auto-return)', () => {
    for (const pos of [0, 120, 250]) {
      // the page's angle with the platter stopped equals the one it was riding at
      assert.equal(armPoseAngle(true, VINYL_ARM_AWAY, pos, total), armAngleAt(pos, total, true));
      assert.notEqual(armPoseAngle(true, VINYL_ARM_AWAY, pos, total), 0, 'not the rest angle');
    }
    assert.equal(armPoseAngle(false, VINYL_ARM_AWAY, 0, total), ARM_CLEAR_ANGLE);
    assert.equal(armPoseAngle(false, 'rest', 0, total), 0, 'Screen 2 keeps its deck at rest');
  });
  it('the page and the drawing take the pose from one place', () => {
    const page = read('src/screens/lab/dj/pages/p17Vinyl.tsx');
    assert.match(page, /const armOn = vinylArmOn\(v\);/);
    assert.match(page, /<ArmSide b=\{b\} v=\{v\} ang=\{armAng\}/);
    assert.match(page, /<RoomView b=\{b\} v=\{v\} ang=\{armAng\}/);
    assert.match(page, /armOn=\{armOn\} armAway=\{VINYL_ARM_AWAY\}/);
    assert.doesNotMatch(page, /armOff/);
    const art = read('src/screens/lab/dj/art/TurntableTop.tsx');
    assert.match(art, /const on = armOn \?\? spinning;/);
    assert.doesNotMatch(art, /armOff/);
    const side = read('src/screens/lab/dj/art/vinylArt.tsx');
    assert.match(side, /armSection\(swing\.value\)/);
    assert.match(side, /armPartAt\('stylus', ang\)/);
  });
});

describe('DJ Systems Lab — screen 17: the side views are to scale', () => {
  it('the record under the arm reaches to within ~100 mm of the pivot, at every groove', () => {
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      const sec = armSection(armAngleAt(f * total, total, true));
      assert.ok(sec.record && sec.platter);
      assert.ok(sec.record[0] > 55 && sec.record[0] < 100, `record's near edge ${sec.record[0].toFixed(1)} mm from the pivot`);
      // the platter's rim nearer the pivot than the record's edge; neither under the arm base (r 26)
      assert.ok(sec.platter[0] < sec.record[0] && sec.platter[0] > 40);
      // and the record runs on past the stylus (at the lead-in only ~10 mm:
      // the stylus is near the record's edge there)
      assert.ok(sec.record[1] > ARM_SIDE.L + 5);
    }
  });
  it('the booth view’s turntable is a DJ deck’s true height and the footer is a band of its own', () => {
    const src = read('src/screens/lab/dj/art/vinylArt.tsx');
    const plinth = Number(src.match(/plinth: (\d+), feet: (\d+), isoFeet: (\d+), platter: (\d+), disc: (\d+)/)![1]);
    const m = src.match(/plinth: (\d+), feet: (\d+), isoFeet: (\d+), platter: (\d+), disc: (\d+)/)!;
    const h = plinth + Number(m[2]) + Number(m[4]) + Number(m[5]);
    assert.ok(h >= 150 && h <= 170, `turntable ${h} mm tall on its own feet (a DJ deck: about 160)`);
    // the scene is clipped above the footer band, so no leg can cross a word
    assert.match(src, /clip=\{Skia\.XYWHRect\(b\.x \+ 2, b\.y \+ head - 4, b\.w - 4, b\.h - head - foot \+ 4\)\}/);
    assert.match(src, /80 Hz BUILD-UP/);
  });
});

describe('DJ Systems Lab — screen 18: the needle stays in the control record', () => {
  it('the turntable is drawn with the arm on the record, platter turning or not', () => {
    const page = read('src/screens/lab/dj/pages/p18Dvs.tsx');
    assert.match(page, /record="control" armOn \/>/);
    assert.match(page, /armPoseAngle\(true, 'rest', /);
  });
});
