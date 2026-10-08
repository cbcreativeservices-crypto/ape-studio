/**
 * Miking Labs ENGINE — geometry (blueprint §11, mikingGeometry). Every
 * assertion checks a REAL relationship, never the implementation re-run:
 *
 *   • aim convention: az 0 / el 0 points at the batter head (−x); +el is UP
 *     (−y in a y-down frame); +az swings to the player's right (+z).
 *   • one 3-D point projects to the SAME screen x in the side and top views;
 *     side y depends only on model y, top y only on model z.
 *   • a finger delta round-trips through unprojectDelta at every zoom step.
 *   • SDF signs, inside and outside, for every Shape3.
 *   • collision: a mic body through the resonant head OUTSIDE the port
 *     collides; THROUGH the port it does not; with an intact head every
 *     stand-mounted inside pose collides (the boom cannot get out).
 *   • the sliding move never tunnels through a 5 mm wall.
 *   • readouts: distance is the plane distance from the BATTER-HEAD plane;
 *     off-axis is 0° aimed along −normal.
 *
 * The fixture is a plain 22 × 18 in drum built here, so these tests do not
 * depend on the M01 lesson data (mikingModelM01.test.ts covers that).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { DocumentedZone, InstrumentModel, MicBody, MicPose, Shape3 } from '../src/screens/lab/miking/engine/model/types.ts';
import { aimVec, angleBetween, DEG } from '../src/screens/lab/miking/engine/geometry/vec.ts';
import { fitPair, fitXform, project, unprojectDelta, zoomAbout } from '../src/screens/lab/miking/engine/geometry/frame.ts';
import { sdf } from '../src/screens/lab/miking/engine/geometry/sdf.ts';
import { checkAssembly, compileScene, constrainMove, isInside } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { deriveReadouts } from '../src/screens/lab/miking/engine/geometry/readouts.ts';
import { inZone } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { fmtAngle, fmtLen, round5 } from '../src/screens/lab/miking/engine/model/units.ts';
import { zoomSteps } from '../src/screens/lab/rack/stageFitMath.ts';

const R = 279.4;
const L = 457.2;
const T = 7;
const PORT = { c: { x: L, y: 90, z: 110 }, r: 63.5 };
const ill = { kind: 'illustrative', reason: 'test fixture' } as const;

function drum(): InstrumentModel {
  return {
    id: 'fixture',
    name: 'test drum',
    parts: [
      { id: 'shell', label: 'shell', short: 'shell', role: '', prov: ill, solid: { kind: 'tube', c: { x: 0, y: 0, z: 0 }, rIn: R - T, rOut: R, x0: 0, x1: L } },
      { id: 'batter', label: 'batter head', short: 'batter', role: '', prov: ill, solid: { kind: 'slab', c: { x: 0, y: 0, z: 0 }, r: R, x0: -0.5, x1: 0.5 }, clearance: { mm: 10, prov: ill } },
      { id: 'reso.ported', label: 'resonant head', short: 'reso', role: '', prov: ill, variants: ['ported'], solid: { kind: 'slab', c: { x: L, y: 0, z: 0 }, r: R, x0: L - 0.5, x1: L + 0.5, hole: PORT }, clearance: { mm: 10, prov: ill } },
      { id: 'reso.intact', label: 'resonant head', short: 'reso', role: '', prov: ill, variants: ['intact'], solid: { kind: 'slab', c: { x: L, y: 0, z: 0 }, r: R, x0: L - 0.5, x1: L + 0.5 }, clearance: { mm: 10, prov: ill } },
    ],
    regions: [],
    surfaces: [
      { id: 'batter', partId: 'batter', label: 'the batter head', point: { x: 0, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 } },
      { id: 'reso', partId: 'reso.ported', label: 'the resonant head', point: { x: L, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 } },
    ],
    lines: [{ id: 'beater', label: 'the beater line', point: { x: 0, y: -38.1, z: 0 }, dir: { x: 1, y: 0, z: 0 } }],
    envelopes: [],
    variants: [
      { id: 'ported', label: 'ported', blurb: '' },
      { id: 'intact', label: 'intact', blurb: '' },
    ],
    defaultVariant: 'ported',
    views: { side: { u0: -450, u1: 950, v0: -420, v1: 320 }, top: { u0: -450, u1: 950, v0: -420, v1: 420 } },
    yFloor: { mm: 295, prov: { kind: 'unknown', needed: 'floor' }, placeholder: true },
    interior: { x0: 0, x1: L, rIn: R - T, c: { x: 0, y: 0, z: 0 } },
    ports: { ported: PORT, intact: null },
  };
}

const E902: MicBody = { length: 128.5, radius: 30, mount: 'stand' };
const pose = (x: number, y: number, z: number, az = 0, el = 0): MicPose => ({ p: { x, y, z }, az, el });
const near = (a: number, b: number, tol: number, msg?: string) => assert.ok(Math.abs(a - b) <= tol, msg ?? `${a} ≉ ${b} (±${tol})`);

describe('aim convention (blueprint §4.3)', () => {
  it('az 0 / el 0 points along −x, toward the batter head', () => {
    const a = aimVec(0, 0);
    near(a.x, -1, 1e-12);
    near(a.y, 0, 1e-12);
    near(a.z, 0, 1e-12);
  });
  it('+el tilts the front UP, which is −y because +y is down', () => {
    const a = aimVec(0, 90);
    near(a.y, -1, 1e-12);
    assert.ok(aimVec(0, 20).y < 0);
  });
  it('+az swings the front to the player’s right (+z)', () => {
    near(aimVec(90, 0).z, 1, 1e-12);
    assert.ok(aimVec(30, 0).z > 0);
  });
  it('aimVec is a unit vector for any angles', () => {
    for (const [az, el] of [[0, 0], [37, -12], [-80, 65], [180, 0], [12.5, 89]]) {
      const a = aimVec(az, el);
      near(Math.hypot(a.x, a.y, a.z), 1, 1e-12);
    }
  });
  it('the angle to −normal of the batter head is the tilt from straight-on', () => {
    for (const el of [0, 10, 25, 60]) near(angleBetween(aimVec(0, el), { x: -1, y: 0, z: 0 }), el, 1e-9);
    // az and el together: cos θ = cos az · cos el.
    near(angleBetween(aimVec(30, 40), { x: -1, y: 0, z: 0 }), Math.acos(Math.cos(30 * DEG) * Math.cos(40 * DEG)) / DEG, 1e-9);
  });
});

describe('one model, two views (blueprint §4.2)', () => {
  const m = drum();
  const pair = fitPair(m.views.side!, m.views.top!, 390, 240, 260, 8);
  const pts = [{ x: 0, y: 0, z: 0 }, { x: L, y: -R, z: R }, { x: 123.4, y: 55, z: -201 }, { x: -300, y: 290, z: 0 }];
  it('the same 3-D point lands at the same screen x in both views', () => {
    for (const p of pts) near(project(pair.side, p).sx, project(pair.top, p).sx, 1e-9);
  });
  it('side y reads model y only; top y reads model z only', () => {
    const a = { x: 10, y: 40, z: 70 };
    const b = { ...a, z: -300 };
    const c = { ...a, y: -200 };
    near(project(pair.side, a).sy, project(pair.side, b).sy, 1e-9, 'moving in z must not move the side view');
    near(project(pair.top, a).sy, project(pair.top, c).sy, 1e-9, 'moving in y must not move the top view');
    assert.ok(project(pair.side, c).sy < project(pair.side, a).sy, 'up (−y) is up the screen');
  });
  it('a finger delta round-trips at every zoom step (Δpx ↔ Δpx / s mm)', () => {
    const base = fitXform('side', m.views.side!, 370, 240, 6);
    const steps = zoomSteps(1.9).map((s) => s.factor);
    assert.ok(steps.length >= 5, 'the steps include FIT');
    for (const k of steps) {
      const xf = zoomAbout(base, k, 185, 120);
      const p = { x: 40, y: -12, z: 0 };
      const d = unprojectDelta(xf, 33, -17);
      const q = { x: p.x + d.x, y: p.y + d.y, z: p.z + d.z };
      near(project(xf, q).sx - project(xf, p).sx, 33, 1e-9);
      near(project(xf, q).sy - project(xf, p).sy, -17, 1e-9);
      near(d.z, 0, 0, 'the side view never edits z');
    }
  });
  it('a pinch about a screen point keeps that point fixed', () => {
    const xf = fitXform('top', m.views.top!, 370, 250, 6);
    const p = { x: 200, y: 0, z: 50 };
    const before = project(xf, p);
    const after = project(zoomAbout(xf, 2.5, before.sx, before.sy), p);
    near(after.sx, before.sx, 1e-9);
    near(after.sy, before.sy, 1e-9);
  });
});

describe('signed distance: negative inside, positive outside', () => {
  const cases: { shape: Shape3; inside: { x: number; y: number; z: number }; outside: { x: number; y: number; z: number }; name: string }[] = [
    { name: 'tube wall', shape: { kind: 'tube', c: { x: 0, y: 0, z: 0 }, rIn: 100, rOut: 110, x0: 0, x1: 200 }, inside: { x: 50, y: 105, z: 0 }, outside: { x: 50, y: 50, z: 0 } },
    { name: 'slab', shape: { kind: 'slab', c: { x: 0, y: 0, z: 0 }, r: 100, x0: -1, x1: 1 }, inside: { x: 0, y: 30, z: 30 }, outside: { x: 5, y: 0, z: 0 } },
    { name: 'slab hole', shape: { kind: 'slab', c: { x: 0, y: 0, z: 0 }, r: 100, x0: -1, x1: 1, hole: { c: { x: 0, y: 50, z: 0 }, r: 20 } }, inside: { x: 0, y: -50, z: 0 }, outside: { x: 0, y: 50, z: 0 } },
    { name: 'box', shape: { kind: 'box', min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 20, z: 30 } }, inside: { x: 5, y: 10, z: 15 }, outside: { x: 11, y: 10, z: 15 } },
    { name: 'capsule', shape: { kind: 'capsule', a: { x: 0, y: 0, z: 0 }, b: { x: 100, y: 0, z: 0 }, r: 10 }, inside: { x: 50, y: 5, z: 0 }, outside: { x: 50, y: 15, z: 0 } },
    { name: 'sweep', shape: { kind: 'sweep', pivot: { x: 0, y: 0, z: 0 }, r0: 90, r1: 110, a0: -Math.PI / 2, a1: 0, halfW: 20 }, inside: { x: 0, y: -100, z: 0 }, outside: { x: 0, y: 100, z: 0 } },
    { name: 'floor', shape: { kind: 'floor', y: 300 }, inside: { x: 0, y: 310, z: 0 }, outside: { x: 0, y: 290, z: 0 } },
  ];
  for (const c of cases) {
    it(c.name, () => {
      assert.ok(sdf(c.shape, c.inside) < 0, `${c.name}: inside point reads ${sdf(c.shape, c.inside)}`);
      assert.ok(sdf(c.shape, c.outside) > 0, `${c.name}: outside point reads ${sdf(c.shape, c.outside)}`);
    });
  }
  it('the distance is metric: 15 mm off a capsule of radius 10 reads 5', () => {
    near(sdf({ kind: 'capsule', a: { x: 0, y: 0, z: 0 }, b: { x: 100, y: 0, z: 0 }, r: 10 }, { x: 50, y: 15, z: 0 }), 5, 1e-9);
  });
});

describe('collision (blueprint §4.4)', () => {
  const m = drum();
  const ported = compileScene(m, 'ported');
  const intact = compileScene(m, 'intact');
  it('a body straddling the resonant head THROUGH the port is clear', () => {
    // Front 40 mm inside the head, centred on the port, aimed at the batter head.
    const p = pose(L - 40, PORT.c.y, PORT.c.z);
    assert.equal(checkAssembly(ported, p, E902), null);
  });
  it('the same body straddling the head OUTSIDE the port collides with the head', () => {
    const p = pose(L - 40, -120, -100);
    const hit = checkAssembly(ported, p, E902);
    assert.ok(hit, 'expected a collision');
    assert.equal(hit.partId, 'reso.ported');
  });
  it('an inside stand mic is reachable through the port …', () => {
    assert.equal(checkAssembly(ported, pose(250, -38.1, 0), E902), null, 'boom routed out through the port');
  });
  it('… and impossible with an intact head, anywhere inside (the boom cannot get out)', () => {
    for (let x = 30; x < L - 30; x += 40) {
      for (const [y, z] of [[0, 0], [-100, 50], [150, -120], [-38.1, 0]]) {
        assert.ok(checkAssembly(intact, pose(x, y, z), E902), `inside pose (${x}, ${y}, ${z}) was clear with an intact head`);
      }
    }
  });
  it('the batter head keeps its clearance: 5 mm away collides, 50 mm is clear', () => {
    assert.ok(checkAssembly(ported, pose(5, -38.1, 0), E902));
    assert.equal(checkAssembly(ported, pose(50, -38.1, 0), E902), null);
  });
  it('isInside is between the heads and inside the shell', () => {
    assert.ok(isInside(ported, { x: 100, y: 0, z: 0 }));
    assert.ok(!isInside(ported, { x: L + 10, y: 0, z: 0 }));
    assert.ok(!isInside(ported, { x: 100, y: R, z: 0 }));
  });
  it('the sliding move never tunnels through a 5 mm wall, however far the finger jumps', () => {
    const wall = { ...ported, solids: [{ partId: 'wall', label: 'wall', shape: { kind: 'box', min: { x: 500, y: -1000, z: -1000 }, max: { x: 505, y: 1000, z: 1000 } } as Shape3, clearance: 0 }] };
    const tiny: MicBody = { length: 20, radius: 3, mount: 'surface' };
    const bounds = { min: { x: -2000, y: -2000, z: -2000 }, max: { x: 2000, y: 2000, z: 2000 } };
    for (const jump of [6, 20, 120, 900]) {
      const r = constrainMove(wall, tiny, pose(480, 0, 0), pose(480 + jump, 0, 0), bounds);
      assert.ok(r.pose.p.x < 500, `jump ${jump}: crossed the wall to x = ${r.pose.p.x}`);
      if (jump >= 20) assert.equal(r.blocked?.partId, 'wall');
    }
  });
  it('a blocked move SLIDES along the obstacle (the free axis still moves)', () => {
    const bounds = { min: { x: -2000, y: -2000, z: -2000 }, max: { x: 2000, y: 2000, z: 2000 } };
    // Pushing into the batter head diagonally: x stops, z keeps moving.
    const r = constrainMove(ported, E902, pose(60, -38.1, 0), pose(-40, -38.1, 80), bounds);
    assert.ok(r.pose.p.x > 10, 'never through the head');
    assert.ok(r.pose.p.z > 60, `z should slide on (got ${r.pose.p.z})`);
  });
});

describe('readouts are measured from the model (blueprint §4.5)', () => {
  const m = drum();
  const scene = compileScene(m, 'ported');
  const zone: DocumentedZone = {
    id: 'near',
    label: 'near',
    band: '5 to 7.5 cm',
    kind: 'sourced',
    src: 'S-B52-UG',
    quote: 'q',
    refSurface: 'batter',
    side: 'inside',
    distance: { min: 50, max: 75 },
    radial: { line: 'beater', min: 10, max: 80, prov: ill },
    start: pose(60, -38.1, 40),
    tendency: 'more attack is one tendency',
    checks: [],
  };
  const ctx = { scene, surfaces: m.surfaces, lines: m.lines, zones: [zone], variant: 'ported', micTypeId: 'x', body: E902 };
  it('distance is the distance from the BATTER-HEAD plane, whatever y and z are', () => {
    for (const [x, y, z] of [[60, 0, 0], [60, -150, 120], [212.5, 30, -40]]) {
      const r = deriveReadouts(ctx, pose(x, y, z), 'batter', 'beater');
      near(r.distance, x, 1e-9);
    }
    // From the resonant head: signed outward.
    near(deriveReadouts(ctx, pose(500, 0, 0), 'reso', 'beater').distance, 500 - L, 1e-9);
  });
  it('off-axis is 0° when aimed along −normal and the tilt otherwise', () => {
    near(deriveReadouts(ctx, pose(60, -38.1, 40), 'batter', 'beater').offAxis, 0, 1e-9);
    near(deriveReadouts(ctx, pose(60, -38.1, 40, 0, 15), 'batter', 'beater').offAxis, 15, 1e-9);
  });
  it('radial is the distance from the beater line', () => {
    near(deriveReadouts(ctx, pose(60, -38.1 + 30, 40), 'batter', 'beater').radial, 50, 1e-9);
  });
  it('band edges are inclusive (5.0 and 7.5 cm), just outside is out', () => {
    const zc = { scene, surfaces: m.surfaces, lines: m.lines, variant: 'ported', micTypeId: 'x', mount: 'stand' };
    assert.ok(inZone(zone, zc, pose(50, -38.1, 40)));
    assert.ok(inZone(zone, zc, pose(75, -38.1, 40)));
    assert.ok(!inZone(zone, zc, pose(49, -38.1, 40)));
    assert.ok(!inZone(zone, zc, pose(76, -38.1, 40)));
    assert.ok(!inZone(zone, zc, pose(60, -38.1, 0)), 'ON the beater line is not "slightly off-center"');
  });
  it('a blocked pose is never "in a zone"', () => {
    const r = deriveReadouts(ctx, pose(60, -38.1, 40), 'batter', 'beater');
    assert.equal(r.zoneId, 'near');
    assert.equal(r.blocked, null);
  });
});

describe('display rounding (rulings §16.5, §16.11)', () => {
  it('≈ 5 mm and ≈ 5°, dual units from the SAME rounded value', () => {
    assert.equal(round5(62), 60);
    assert.equal(round5(63), 65);
    assert.equal(fmtLen(62), '≈ 6 cm (2.4 in)');
    assert.equal(fmtLen(65), '≈ 6.5 cm (2.6 in)');
    // Owner decision X1 (2026-10-08): a metre and more rounds on the scaled tier.
    assert.equal(fmtLen(1240), '≈ 1.25 m (49 in)');
    assert.equal(fmtAngle(12), '≈ 10°');
    assert.equal(fmtAngle(13), '≈ 15°');
  });
});
