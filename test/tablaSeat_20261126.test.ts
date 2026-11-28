/**
 * M13 TABLA — THE PLAYER SITS CROSS-LEGGED, CLOSE TO THE DRUMS (owner ruling
 * 2026-11-26; the owner is a professional percussionist). Was: kneeling back
 * on the heels, both arms reaching nearly straight out. Is: the seat on the
 * floor, the torso upright with a slight forward lean, the upper arms hanging
 * near the body, the elbows bent ≈ 90–110°, the forearms sloping down to the
 * heads, the knees out to either side of and behind the drums. Pins the pose
 * facts, the side view and the view from above agreeing, no limb through a
 * drum or ring, and that the drums, the hands' wrists and the mics did not move.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const SEAT = await import('../src/screens/lab/miking/lessons/m13Tabla/tablaSeat.ts');
const TAB = await import('../src/screens/lab/miking/lessons/m13Tabla/tablaV2.ts');
const ART = await import('../src/screens/lab/miking/lessons/m13Tabla/art.tsx');
const G = await import('../src/screens/lab/miking/lessons/m13Tabla/geometry.ts');

type J = { x: number; y: number; z: number };
const DEG = 180 / Math.PI;
const r1 = (n: number) => Math.round(n * 10) / 10;
const len = (a: J, b: J) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const KNEE_R = 58; // the trouser knee's radius (floorSeat LR)
const SHIN_R = 54;

/** From above (x, z): is the point within `pad` of a drum's footprint (its body, every height) or its ring? */
function onDrumTop(x: number, z: number, pad: number): string | null {
  for (const d of G.DRUMS) {
    const ct = -d.u.y;
    for (let i = 0; i <= 24; i++) {
      const s = (d.height * i) / 24;
      const r = ART.tablaProfile(d, s);
      const cx = d.B.x + d.u.x * s;
      if (((x - cx) / (r * ct + pad)) ** 2 + ((z - d.B.z) / (r + pad)) ** 2 <= 1) return `${d.id} body`;
    }
    const rr = ART.tablaProfile(d, 0) + 30; // the cloth ring (art.tsx: the base's radius + 30)
    if (Math.hypot(x - d.B.x, z - d.B.z) <= rr + pad) return `${d.id} ring`;
  }
  return null;
}

describe('M13 tabla: the player sits cross-legged, close to the drums (owner 2026-11-26)', () => {
  const side = ART.tablaPose('side');
  const fs = TAB.tablaSide();
  const ft = TAB.tablaTop();

  it('the seat is ON the floor (hip joint ≈ 11 cm up, the seat of the trousers at the floor) — no longer kneeling high', () => {
    assert.ok(side.hipR.v >= -125 && side.hipR.v <= -95, `hip at ${side.hipR.v}`);
    const seatLow = Math.max(...fs.plan.seat.map((p) => p.v));
    assert.ok(seatLow > -15 && seatLow < 15, `the seat's lowest point ${r1(seatLow)} (floor 0)`);
  });

  it('the torso upright with a slight forward lean (4–12°)', () => {
    const hip = { u: (side.hipR.u + side.hipL.u) / 2, v: (side.hipR.v + side.hipL.v) / 2 };
    const lean = Math.atan2(side.neck.u - hip.u, hip.v - side.neck.v) * DEG;
    assert.ok(lean > 4 && lean < 12, `lean ${r1(lean)}°`);
  });

  it('the arms: true lengths, the elbows bent 88–112°, the upper arms hanging near the body, the forearms sloping DOWN to the heads', () => {
    for (const [S, E, W, name] of [
      [SEAT.SHOULDER_R, SEAT.ELBOW_R, SEAT.WRIST_R, 'right'],
      [SEAT.SHOULDER_L, SEAT.ELBOW_L, SEAT.WRIST_L, 'left'],
    ] as const) {
      assert.ok(Math.abs(len(S, E) - SEAT.UPPER_ARM) < 1 && Math.abs(len(E, W) - SEAT.FOREARM) < 1, `${name}: the arm's own lengths`);
      const bend = SEAT.elbowDeg(S, E, W);
      assert.ok(bend >= 88 && bend <= 112, `${name} elbow ${r1(bend)}°`);
      // the upper arm hangs: from the side, within 30° of straight down; from the front, out ≤ 30°
      const fwd = Math.atan2(E.x - S.x, E.y - S.y) * DEG;
      const out = Math.asin(Math.abs(E.z - S.z) / len(S, E)) * DEG;
      assert.ok(fwd >= 0 && fwd <= 30, `${name} upper arm ${r1(fwd)}° forward of vertical`);
      assert.ok(out <= 30, `${name} upper arm ${r1(out)}° out from the body`);
      // the forearm slopes down from the elbow to the wrist
      const slope = Math.atan2(W.y - E.y, W.x - E.x) * DEG;
      assert.ok(slope >= 4 && slope <= 25, `${name} forearm slope ${r1(slope)}° down`);
      console.log(`  ${name}: elbow ${r1(bend)}°, upper arm ${r1(fwd)}° forward / ${r1(out)}° out, forearm ${r1(slope)}° down`);
    }
    // the side view draws exactly these elbows
    assert.deepEqual([side.elbowR.u, side.elbowR.v], [SEAT.ELBOW_R.x, SEAT.ELBOW_R.y]);
    assert.deepEqual([side.elbowL.u, side.elbowL.v], [SEAT.ELBOW_L.x, SEAT.ELBOW_L.y]);
  });

  it('the player moved toward the drums (the shoulders ≥ 8 cm closer than the old seat at x = −572)', () => {
    assert.ok(side.shoulderR.u - -572 >= 80, `shoulder now ${r1(side.shoulderR.u)}`);
    console.log(`  shoulders moved ${r1(side.shoulderR.u + 572)} mm toward the drums; hips ${r1(side.hipR.u + 600)} mm; hip lowered ${r1(170 + side.hipR.v)} mm`);
  });

  it('the hands keep their drawing and their contact: the wrists exactly where they were, the same authored hands', () => {
    assert.deepEqual([side.handR.wrist.u, side.handR.wrist.v, side.handL.wrist.u, side.handL.wrist.v], [-145, -441, -182, -464]);
    assert.deepEqual([side.handR.dir, side.handL.dir], [0.262, 0.175]);
    assert.equal(fs.plan.arms.near.placed!.art.view, 'restFlat');
    assert.equal(fs.plan.arms.far.placed!.art.view, 'restFlatThumb');
    assert.ok(Math.hypot(fs.plan.arms.near.placed!.wrist.u - -145, fs.plan.arms.near.placed!.wrist.v - -441) < 0.5);
    assert.equal(ft.plan.arms.near.placed!.art.view, 'restTop');
    assert.equal(ft.plan.arms.far.placed!.art.view, 'restTop');
  });

  it('the side view and the view from above agree (shoulders, elbows, hips, knees)', () => {
    const near = ft.plan.arms.near;
    const far = ft.plan.arms.far;
    assert.ok(Math.abs(near.elbow.u - SEAT.ELBOW_R.x) < 0.5 && Math.abs(near.elbow.v - SEAT.ELBOW_R.z) < 0.5, `top right elbow ${r1(near.elbow.u)}, ${r1(near.elbow.v)}`);
    assert.ok(Math.abs(far.elbow.u - SEAT.ELBOW_L.x) < 0.5 && Math.abs(far.elbow.v - SEAT.ELBOW_L.z) < 0.5, `top left elbow ${r1(far.elbow.u)}, ${r1(far.elbow.v)}`);
    const top = ART.tablaPose('top');
    // (the top pose is authored round the neck and turned a quarter: x = neck + fwd, z = right)
    const xz = (p: { u: number; v: number }) => ({ x: top.neck.u + (p.v - top.neck.v), z: top.neck.u - p.u });
    for (const [a, b] of [[top.shoulderR, SEAT.SHOULDER_R], [top.shoulderL, SEAT.SHOULDER_L], [top.kneeR, SEAT.KNEE_R], [top.kneeL, SEAT.KNEE_L]] as const) {
      const q = xz(a);
      assert.ok(Math.abs(q.x - b.x) < 0.5 && Math.abs(q.z - b.z) < 0.5, `top ${r1(q.x)},${r1(q.z)} vs ${r1(b.x)},${r1(b.z)}`);
    }
    assert.deepEqual(ft.thighAxes.map(([h, k]) => [r1(h.u), r1(k.u), r1(k.v)]), [
      [r1((side.hipR.u + side.hipL.u) / 2), SEAT.KNEE_R.x, SEAT.KNEE_R.z],
      [r1((side.hipR.u + side.hipL.u) / 2), SEAT.KNEE_L.x, SEAT.KNEE_L.z],
    ]);
    assert.deepEqual([fs.plan.legs.near.knee.u, fs.plan.legs.far.knee.u], [SEAT.KNEE_R.x, SEAT.KNEE_L.x]);
    assert.equal(Math.abs(top.neck.u - side.neck.u) < 0.5, true, 'the neck at the same x in both views');
  });

  it('from above: the knees, shins and feet clear both drums and their rings (knees out to the sides and behind)', () => {
    for (const k of [SEAT.KNEE_R, SEAT.KNEE_L]) {
      assert.equal(onDrumTop(k.x, k.z, KNEE_R), null, `knee at ${k.x},${k.z}`);
      assert.ok(Math.abs(k.z) > 250, 'out to the side');
    }
    for (const [a, b] of ft.shinAxes) {
      for (let i = 0; i <= 20; i++) {
        const p = { u: a.u + ((b.u - a.u) * i) / 20, v: a.v + ((b.v - a.v) * i) / 20 };
        assert.equal(onDrumTop(p.u, p.v, SHIN_R), null, `shin at ${r1(p.u)},${r1(p.v)}`);
      }
    }
    for (const f of ft.feet) for (const p of f.outline) assert.equal(onDrumTop(p.u, p.v, 0), null, `foot at ${r1(p.u)},${r1(p.v)}`);
  });

  it('from the side: no limb through a drum, its ring or the floor', () => {
    const hit = (u: number, v: number) => ART.tablaHitTest('side', 'pair', u, v, 0);
    // the near forearm (its axis and its lower edge) and the near upper arm
    for (const [a, b] of [[side.elbowR, side.handR.wrist], [side.shoulderR, side.elbowR]] as const) {
      for (let i = 0; i <= 20; i++) {
        const p = { u: a.u + ((b.u - a.u) * i) / 20, v: a.v + ((b.v - a.v) * i) / 20 };
        assert.equal(hit(p.u, p.v), null, `arm at ${r1(p.u)},${r1(p.v)}`);
        assert.equal(hit(p.u, p.v + 40), null, `arm's lower edge at ${r1(p.u)},${r1(p.v + 40)}`);
      }
    }
    // the knees (with their cloth) and the feet: in front of nothing, behind the rings
    for (const k of [fs.plan.legs.near.knee, fs.plan.legs.far.knee]) {
      for (let a = 0; a < 16; a++) {
        const u = k.u + KNEE_R * Math.cos((a / 16) * 2 * Math.PI);
        const v = k.v + KNEE_R * Math.sin((a / 16) * 2 * Math.PI);
        assert.equal(hit(u, v), null, `knee edge at ${r1(u)},${r1(v)}`);
        assert.ok(v <= 2, 'not through the floor');
      }
    }
    const ringBack = Math.min(...G.DRUMS.map((d) => d.B.x - ART.tablaProfile(d, 0) - 30));
    assert.ok(fs.plan.legs.near.knee.u + KNEE_R <= ringBack, `knee front ${fs.plan.legs.near.knee.u + KNEE_R} vs ring ${r1(ringBack)}`);
    for (const p of [...fs.sole.outline, ...fs.heel.outline]) {
      assert.equal(hit(p.u, p.v), null, `foot at ${r1(p.u)},${r1(p.v)}`);
      assert.ok(p.v <= 2, 'not through the floor');
    }
  });

  it('nothing the lesson measures moved: the drums, their rings, the mics, the labels', () => {
    const d3 = (v: J) => [r1(v.x), r1(v.y), r1(v.z)];
    assert.deepEqual(G.DRUMS.map((d) => [d.id, ...d3(d.B), ...d3(d.H), r1(d.tiltDeg), r1(d.headR), r1(d.maxR)]), [
      ['dayan', -40, -60, 150, 40.5, -360.5, 150, 15, 72.5, 101.6],
      ['bayan', -40, -60, -170, 19.5, -397.7, -170, 10, 115, 128.6],
    ]);
    assert.deepEqual(d3(G.MID), [30, -379.1, -10]);
    assert.deepEqual(G.TABLA_ZONES.map((z) => [z.id, ...d3(z.start!.p)]), MIC_STARTS);
    assert.deepEqual(ART.tablaLabels('side').map((l) => [l.id, r1(l.u), r1(l.v)]), [
      ['dayan', 153, -330.5],
      ['bayan', 184.5, -437.7],
      ['rings', 120, -16],
      ['player', -560, -1130],
    ]);
    assert.deepEqual(ART.tablaLabels('top').map((l) => [l.id, r1(l.u), r1(l.v)]), [
      ['dayan', 40.5, 301.6],
      ['bayan', 19.5, -338.6],
      ['player', -270, 12],
    ]);
    // the envelopes the mic is stopped by (geometry.ts) are untouched
    assert.deepEqual(G.TABLA_MODEL.envelopes!.map((e) => e.id), ['env.handR', 'env.handL', 'env.body', 'env.legs']);
  });

  it('one set of joints: art.tsx reads tablaSeat.ts for both views; the same cast member', () => {
    const src = read('src/screens/lab/miking/lessons/m13Tabla/art.tsx');
    assert.match(src, /import \* as SEAT from '\.\/tablaSeat\.ts';/);
    assert.match(read('src/screens/lab/miking/lessons/m13Tabla/tablaV2.ts'), /castFor\('player\.tabla'\)/);
  });
});

/** The mics' starting points (geometry.ts, unchanged by the seat; geometry.ts reads no player joint). */
const MIC_STARTS: unknown[] = [
  ['ta.dayan.close', 107, -434.9, 120],
  ['ta.bayan.close', 79.3, -477.5, -140],
  ['ta.dayan.B', 159.9, -535.6, 130],
  ['ta.bayan.B', 123.2, -582.5, -150],
  ['ta.A', 287.2, -685.5, -10],
  ['ta.C', 562.5, -751.9, -10],
  ['ta.D', 981.7, -822.9, -10],
];
