/**
 * I11b WURLITZER — THE SEAT (owner ruling 2026-11-26; the owner is a pianist):
 * the bench and the seated player moved 100 mm toward the keys so the upper
 * arms hang near the body and the elbows bend about a right angle; the seat
 * 490 up (10 up from 480, inside a typical bench's 480–500: a hanging upper
 * arm sets the elbow ≈ 300 below the shoulder, and at 480 or lower the elbows
 * fell below the 720 key tops). Nothing else moves: the instrument, its legs, the pedal,
 * the speakers, the mics' starting points, the keep-outs, the labels; each
 * hand keeps the drawing it had (hands parked).
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const WP = await import('../src/screens/lab/miking/lessons/shared/keys/wurliPlayerV2.tsx');
const WPL = await import('../src/screens/lab/miking/lessons/shared/keys/wurliPlayer.ts');
const WM = await import('../src/screens/lab/miking/lessons/shared/keys/wurliModel.ts');
const PP = await import('../src/screens/lab/miking/lessons/shared/piano/pianistPlanV2.ts');

type V = { x: number; y: number; z: number };
type Arm = { shoulder: V; elbow: V; cuffEnd: V; sk: { frame: { o: V }; fingers: { joints: V[] }[]; thumb: { joints: V[] } }; pads: V[] };
const src = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const deg = (r: number) => (r * 180) / Math.PI;
const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const len = (a: V) => Math.hypot(a.x, a.y, a.z);
const angle = (a: V, b: V) => deg(Math.acos((a.x * b.x + a.y * b.y + a.z * b.z) / (len(a) * len(b))));

describe('I11b Wurlitzer: the seat 100 mm nearer the keys (owner ruling 2026-11-26)', () => {
  it('the bench and the body moved 100 mm toward the keys; the seat stays at a real bench height', () => {
    assert.equal(WPL.WURLI_SEAT_CLOSER, 100);
    assert.equal(WPL.WURLI_SEAT_Y, -490, 'the seat 490 above the floor (a typical bench, 480–500)');
    assert.ok(-WPL.WURLI_SEAT_Y >= 480 && -WPL.WURLI_SEAT_Y <= 500, 'a real bench height');
    assert.deepEqual([WPL.WURLI_BENCH.x0, WPL.WURLI_BENCH.x1], [370, 700]);
    const S = WPL.WURLI_PLAYER_SIDE;
    assert.deepEqual(S.hipR, { u: 527, v: -575 }, 'the hip 527 behind the key fronts (was 627), 85 above the seat');
    assert.ok(S.hipR.u > WPL.WURLI_BENCH.x0 + 100 && S.hipR.u < WPL.WURLI_BENCH.x1, 'the hip over the bench');
    assert.deepEqual(S.neck, { u: 441, v: -1062 });
    // the crown inside the side view's frame
    assert.ok(S.head.c.v - S.head.r * 1.09 > WM.WURLI_VIEWS.side.v0 - 3, 'the crown inside the frame');
    // the pedal foot where the pedal is; the knees clear of the case's underside (640 up) and in front of its legs
    assert.deepEqual(S.footR, { u: 255, v: -56 });
    assert.ok(S.footR.u > WM.PLAYER.pedal.x0 && S.footR.u < WM.PLAYER.pedal.x1, 'the near foot on the pedal');
    for (const k of [S.kneeR, S.kneeL]) {
      assert.ok(-k.v + 75 < -WM.W.caseBottomY, `the knee (${-k.v} up) clear under the case (${-WM.W.caseBottomY})`);
      assert.ok(k.u - 75 > WM.W.legX[0], 'the knee in front of the instrument’s legs');
    }
    // the near shin keeps its length down to the pedal (449.7 mm before the move)
    assert.ok(Math.abs(Math.hypot(S.footR.u - S.kneeR.u, S.footR.v - S.kneeR.v) - 449.7) < 1);
  });

  it('the arms: upper arms near the body, the elbows about a right angle at the key tops', () => {
    const A = WP.wurliArms() as unknown as { R: Arm; L: Arm };
    for (const a of [A.R, A.L]) {
      const up = sub(a.shoulder, a.elbow);
      const fore = sub(a.sk.frame.o, a.elbow);
      const fromVert = deg(Math.atan2(Math.hypot(up.x, up.z), -up.y));
      assert.ok(fromVert < 18, `the upper arm ${fromVert.toFixed(0)}° off vertical (was ≈ 25°)`);
      const el = angle(up, fore);      assert.ok(el >= 88 && el <= 110, `the elbow at ${el.toFixed(0)}°`);
      const overKeys = WM.W.keyTopY - a.elbow.y;
      assert.ok(overKeys > -12 && overKeys < 45, `the elbow ${overKeys.toFixed(0)} mm from the key tops`);
      assert.ok(a.elbow.y - a.sk.frame.o.y < 60, 'the forearm level (as the C11 pianist’s test asks)');
      assert.ok(a.shoulder.x - a.elbow.x < 90, 'the elbow no longer reaching ahead of the shoulder');
    }
  });

  it('each hand keeps the drawing and the key contact it had (hands parked)', () => {
    const A = WP.wurliArms() as unknown as { R: Arm; L: Arm };
    for (const side of ['R', 'L'] as const) {
      const was = WP.HAND_FIT_SHOULDER[side];
      const z = side === 'R' ? -188 : 188;
      const old = PP.keysArm({ keyFront: WM.W.keyFrontX, keyTop: WM.W.keyTopY, facing: -1, side, shoulder: { x: was.u, y: was.v, z } }) as unknown as Arm;
      assert.deepEqual(A[side].sk, old.sk, `${side}: the same hand`);
      assert.deepEqual(A[side].pads, old.pads, `${side}: the same pads on the same keys`);
    }
  });

  it('the instrument, the pedal, the speakers, the mics and the keep-outs did not move', () => {
    assert.deepEqual({ ...WM.W, n: undefined, up: undefined }, { ...WM.W, n: undefined, up: undefined, keyTopY: -720, keyFrontX: 0, caseBackX: -482, caseBottomY: -640, caseTopY: -870, faceFootX: -150, faceFootY: -725, legX: [-40, -442], legZ: 470, halfW: 510, spkZ: 260 });
    assert.deepEqual(WM.PLAYER.pedal, { x0: 160, x1: 300, z0: 50, z1: 150, h: 60 });
    assert.deepEqual(WM.PLAYER.hip, { x: 610, y: -520 }, 'the torso keep-out where it was');
    assert.ok(Math.abs(WM.C_BASS.x - -176.388) < 0.01 && Math.abs(WM.C_BASS.y - -797.5) < 0.01 && WM.C_BASS.z === -260, 'the bass-side speaker');
    const close = WM.wurliZones().find((z: { id: string }) => z.id === 'wur.close') as { start: { p: V; az: number; el: number } };
    assert.ok(Math.abs(close.start.p.x - -148.18) < 0.05 && Math.abs(close.start.p.y - -807.76) < 0.05, 'the worked start where it was');
  });

  it('the art draws the bench from the seat constants; the PLAYER label keeps its place beside the head', () => {
    const art = src('../src/screens/lab/miking/lessons/shared/keys/KeysArt.tsx');
    assert.match(art, /rr\(bench, B\.x0, WURLI_SEAT_Y, B\.x1, WURLI_SEAT_Y \+ 30, 6\)/);
    assert.match(art, /rr\(make\(\), WURLI_BENCH\.x0, -WURLI_BENCH\.halfZ, WURLI_BENCH\.x1, WURLI_BENCH\.halfZ, 14\)/);
    // (the label is placed relative to the head, as it always was: 330 in front of it)
    assert.match(art, /u: WURLI_PLAYER_SIDE\.head\.c\.u - 330, v: WURLI_PLAYER_SIDE\.head\.c\.v \+ 10/);
  });
});
