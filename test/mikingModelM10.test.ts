/**
 * M10 Drum Room Microphones — the model (room/GEOMETRY_PROPOSAL.md §1–2):
 *
 *   • validateLesson(M10) is clean; every zone start clear of the room;
 *   • the room is the drawing default sized so "about 15 feet away in the
 *     corners" is literally true: the corner pair 4572 mm from the kit's
 *     centre in plan, 300 mm in from two walls;
 *   • the low pair 1 m in front of the kick's front head, 400 mm apart; the
 *     front condenser 1.5 m out (inside "1–2 m");
 *   • the ARRIVAL TIMES the sound page draws (20 °C, the calculator's
 *     speed): kick and snare to a close mic, to the low pair, to the corner;
 *   • each one-bounce echo (mirror image) arrives after the direct sound.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { M10_LESSON } from '../src/screens/lab/miking/lessons/m10Room/lesson.ts';
import { CK, CORNER_DIST, CORNER_INSET, CORNER_L, CORNER_R, FRONT_LDC, KIT_MIDDLE, LOW_A, LOW_B, LOW_CENTRE, ROOM, snareImages } from '../src/screens/lab/miking/lessons/m10Room/model.ts';
import { KICK_FRONT, O, S0, distMm, heightOf } from '../src/screens/lab/miking/lessons/shared/kitScene/kitSceneModel.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { checkAssembly, compileScene } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { C20 } from '../src/screens/lab/miking/engine/physics/twoMic.ts';

const near = (a: number, b: number, tol: number, msg?: string) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} ${a} vs ${b} (±${tol})`);
const ms = (mm: number) => mm / C20;
const lesson = M10_LESSON;

describe('M10 — the lesson validates', () => {
  it('validateLesson is clean', () => {
    assert.deepEqual(validateLesson(lesson, MIC_TYPES), []);
  });
  it('every zone start is clear in each variant it allows', () => {
    for (const v of lesson.model.variants.map((x) => x.id)) {
      const scene = compileScene(lesson.model, v);
      for (const z of lesson.zones) {
        if (z.requires?.variants && !z.requires.variants.includes(v)) continue;
        const t = MIC_TYPES[z.requires!.micTypeIds![0]];
        assert.equal(checkAssembly(scene, z.start, micBodyOf(t)), null, `${z.id} in ${v}`);
      }
    }
  });
});

describe('M10 — the room and the starting positions', () => {
  it('the corner pair: 15 ft (4572 mm) from the kit’s centre in plan, 300 mm from two walls', () => {
    assert.equal(CORNER_DIST, 4572);
    for (const c of [CORNER_L, CORNER_R]) {
      near(Math.hypot(c.x - CK.x, c.z - CK.z), 4572, 1e-6);
      near(ROOM.front - c.x, CORNER_INSET, 1e-9);
      assert.equal(CORNER_INSET, 300);
    }
    near(CORNER_L.z - ROOM.left, 300, 1e-9);
    near(ROOM.right - CORNER_R.z, 300, 1e-9);
    near(ROOM.front, 3996.4, 0.1);
  });
  it('the room holds the kit: walls behind and beside it, a 3 m ceiling', () => {
    assert.ok(ROOM.back < S0.x - 500);
    assert.ok(ROOM.left < S0.z - 1000 && ROOM.right > 1000);
    assert.equal(ROOM.ceilingH, 3000);
  });
  it('the low pair 1 m in front of the kick’s front head, 400 mm off the floor, 400 mm apart', () => {
    near(LOW_CENTRE.x - KICK_FRONT.x, 1000, 1e-9);
    near(heightOf(LOW_CENTRE), 400, 1e-9);
    near(distMm(LOW_A, LOW_B), 400, 1e-9);
  });
  it('the front condenser 1.5 m out, inside the 1–2 m starting band', () => {
    const d = FRONT_LDC.x - KICK_FRONT.x;
    assert.ok(d >= 1000 && d <= 2000);
  });
  it('the kit’s middle is the aim point, 0.7 m up over the kit’s centre', () => {
    near(heightOf(KIT_MIDDLE), 700, 1e-9);
    assert.equal(KIT_MIDDLE.x, CK.x);
  });
});

describe('M10 — arrival times (20 °C)', () => {
  it('the snare and the kick at the corner: about 5.0 m and 4.6 m, 14.6 and 13.5 ms', () => {
    near(distMm(S0, CORNER_R), 5012.8, 0.2);
    near(ms(distMm(S0, CORNER_R)), 14.61, 0.01);
    near(distMm(O, CORNER_R), 4645.6, 0.2);
  });
  it('the kick and the snare at the low pair: about 1.46 m and 1.89 m', () => {
    near(distMm(O, LOW_CENTRE), 1461.3, 0.2);
    near(distMm(S0, LOW_CENTRE), 1891.7, 0.2);
  });
  it('a room mic hears the kit more than 10 ms after a close mic (a few cm away)', () => {
    const close = 50;
    assert.ok(ms(distMm(S0, CORNER_R)) - ms(close) > 10);
    assert.ok(ms(distMm(S0, LOW_CENTRE)) - ms(close) > 4);
  });
  it('every one-bounce echo arrives after the direct sound, at every room mic', () => {
    const imgs = snareImages();
    assert.equal(imgs.length, 5);
    for (const mic of [CORNER_L, CORNER_R, LOW_A, LOW_B, FRONT_LDC]) {
      const direct = distMm(S0, mic);
      for (const im of imgs) assert.ok(distMm(im.p, mic) > direct, `${im.id}`);
    }
  });
  it('the floor echo is the snare mirrored in the floor; the ceiling’s in the ceiling', () => {
    const imgs = Object.fromEntries(snareImages().map((i) => [i.id, i.p]));
    near(heightOf(imgs.floor), -heightOf(S0), 1e-9);
    near(heightOf(imgs.ceiling), 2 * ROOM.ceilingH - heightOf(S0), 1e-9);
    near(imgs.back.x, 2 * ROOM.back - S0.x, 1e-9);
  });
});
