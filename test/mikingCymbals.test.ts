/**
 * The SHARED CYMBAL FAMILY (lessons/shared/cymbals) — the invariants every
 * kit lesson leans on:
 *
 *   • the sizes are the kit plan's sourced pack (14 / 16 / 18 / 20 in) and
 *     every other number is a drawing default (placeholder), never sourced;
 *   • the frame: n is a unit normal, e1 and e2 lie in the edge plane;
 *   • the profile: highest at the bell, zero at the edge, monotone outward;
 *     the bell / bow / edge areas tile the radius;
 *   • the swing is the crash and ride clearance; the hi-hat pair's is its
 *     opening (it does not swing);
 *   • BOOM_FEET are the same numbers as KitPlan.tsx's PLAN_HARDWARE.booms
 *     (read from the file, so the setting page's plan and the scenes agree);
 *   • the stands reach the floor and their joints sit under their cymbals;
 *   • the vibration shapes are the Cymatics Lab's centre-held disc: n ≥ 1,
 *     ascending, the first is (2,0); the still diameters are evenly spaced.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
  BOOM_FEET,
  CYMBAL_DRAWING_DEFAULTS,
  CYMBAL_HARDWARE,
  CYMBAL_SPECS,
  CYMBAL_SWING,
  HIHAT_HARDWARE,
  KIT_PLACED_CYMBALS,
  boomStandPoints,
  cymbalAnchors,
  cymbalAreas,
  cymbalFrame,
  cymbalPoint,
  cymbalSolid,
  cymbalSolids,
  hihatStandPoints,
  surfaceHeight,
} from '../src/screens/lab/miking/lessons/shared/cymbals/cymbalSpec.ts';
import { KIT_FLOOR_Y } from '../src/screens/lab/miking/lessons/shared/kitPlanModel.ts';

// The Cymatics model's own modules import without extensions (Metro style):
// resolve them for the node runner, as the cymatics tests do.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { CYMBAL_SHAPES, cymbalStillDiameters, cymbalStrikeShare, edgeToBow } = await import('../src/screens/lab/miking/lessons/shared/cymbals/cymbalModes.ts');

const IN = 25.4;
const IDS = ['hihat', 'crash1', 'crash2', 'ride'] as const;
const dot = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => a.x * b.x + a.y * b.y + a.z * b.z;

describe('the cymbal family — sizes and provenance', () => {
  it('the sizes are the sourced pack: 14 in hi-hats, 16 and 18 in crashes, 20 in ride', () => {
    assert.equal(CYMBAL_SPECS.hihat.d.mm, 14 * IN);
    assert.equal(CYMBAL_SPECS.crash1.d.mm, 16 * IN);
    assert.equal(CYMBAL_SPECS.crash2.d.mm, 18 * IN);
    assert.equal(CYMBAL_SPECS.ride.d.mm, 20 * IN);
    for (const id of IDS) assert.equal(CYMBAL_SPECS[id].d.prov.kind, 'sourced', id);
  });
  it('every other number is a drawing default, never presented as sourced', () => {
    for (const id of IDS) {
      const s = CYMBAL_SPECS[id];
      for (const d of [s.rise, s.bellD, s.edgeFrac, s.drawT]) assert.equal(d.placeholder, true, id);
    }
    for (const d of Object.values(CYMBAL_HARDWARE)) assert.equal(d.placeholder, true);
    assert.equal(CYMBAL_SWING.placeholder, true);
    assert.equal(CYMBAL_SWING.mm, 60);
    assert.ok(CYMBAL_DRAWING_DEFAULTS.length >= 5);
  });
  it('the open hi-hat gap is the trial reading (12.7 mm); closed is 0', () => {
    assert.equal(HIHAT_HARDWARE.openGap.mm, 12.7);
    assert.equal(HIHAT_HARDWARE.openGap.prov.kind, 'trial');
    assert.equal(HIHAT_HARDWARE.closedGap.mm, 0);
  });
});

describe('the cymbal family — frame, profile, areas', () => {
  it('each frame is orthonormal and the normal faces up', () => {
    for (const id of IDS) {
      const f = cymbalFrame(KIT_PLACED_CYMBALS[id]);
      for (const v of [f.n, f.e1, f.e2]) assert.ok(Math.abs(Math.hypot(v.x, v.y, v.z) - 1) < 1e-9, id);
      assert.ok(Math.abs(dot(f.n, f.e1)) < 1e-9 && Math.abs(dot(f.n, f.e2)) < 1e-9 && Math.abs(dot(f.e1, f.e2)) < 1e-9, id);
      assert.ok(f.n.y < 0, `${id}: the top face looks up (−y)`);
      const rim = cymbalPoint(f, f.R, 90, 0);
      assert.ok(Math.abs(Math.hypot(rim.x - f.c.x, rim.y - f.c.y, rim.z - f.c.z) - f.R) < 1e-9);
    }
  });
  it('the top surface is highest at the bell, zero at the edge and falls outward', () => {
    for (const id of IDS) {
      const s = CYMBAL_SPECS[id];
      const R = s.d.mm / 2;
      assert.ok(Math.abs(surfaceHeight(s, 0) - s.rise.mm) < 1e-9, id);
      assert.ok(Math.abs(surfaceHeight(s, R)) < 1e-9, id);
      let prev = Infinity;
      for (let i = 0; i <= 50; i++) {
        const h = surfaceHeight(s, (i / 50) * R);
        assert.ok(h <= prev + 1e-9, `${id} r=${i}`);
        prev = h;
      }
    }
  });
  it('bell, bow and edge tile the radius in order', () => {
    for (const id of IDS) {
      const a = cymbalAreas(CYMBAL_SPECS[id]);
      assert.equal(a.bell[0], 0);
      assert.equal(a.bell[1], a.bow[0]);
      assert.equal(a.bow[1], a.edge[0]);
      assert.equal(a.edge[1], CYMBAL_SPECS[id].d.mm / 2);
      assert.ok(a.bell[1] < a.bow[1] && a.bow[1] < a.edge[1]);
    }
  });
  it('the anchors sit on the plate: the bell above the bow, the edge on the drummer’s side', () => {
    for (const id of IDS) {
      const k = cymbalAnchors(id);
      assert.ok(k.bell.y < k.bow.y, id);
      assert.ok(k.edge.x < k.centre.x, `${id}: the stick plays the near (drummer’s) side`);
    }
  });
});

describe('the cymbal family — keep-outs and stands', () => {
  it('a crash or ride keeps the swing as its clearance; the hi-hat pair its opening', () => {
    for (const id of ['crash1', 'crash2', 'ride'] as const) assert.equal(cymbalSolid(KIT_PLACED_CYMBALS[id]).clearance, CYMBAL_SWING.mm);
    assert.equal(cymbalSolid(KIT_PLACED_CYMBALS.hihat).clearance, HIHAT_HARDWARE.openGap.mm);
    assert.equal(KIT_PLACED_CYMBALS.hihat.pair, true);
  });
  it('BOOM_FEET are the kit plan’s PLAN_HARDWARE.booms (read from KitPlan.tsx)', () => {
    const src = readFileSync(join(process.cwd(), 'src/screens/lab/miking/lessons/shared/KitPlan.tsx'), 'utf8');
    const line = src.split('\n').find((l) => /^\s*booms:/.test(l));
    assert.ok(line, 'PLAN_HARDWARE.booms is on one line');
    for (const id of ['crash1', 'crash2', 'ride'] as const) {
      const m = line!.match(new RegExp(`${id}: \\{ u: (-?\\d+(?:\\.\\d+)?), v: (-?\\d+(?:\\.\\d+)?) \\}`));
      assert.ok(m, id);
      assert.deepEqual({ u: Number(m![1]), v: Number(m![2]) }, BOOM_FEET[id], id);
    }
  });
  it('each boom stand stands on the floor, its joint below its cymbal, its boom reaching the tilter', () => {
    for (const id of ['crash1', 'crash2', 'ride'] as const) {
      const s = boomStandPoints(id);
      assert.equal(s.foot.y, KIT_FLOOR_Y);
      assert.ok(s.joint.y < s.foot.y && s.joint.y > KIT_PLACED_CYMBALS[id].c.y, `${id}: the joint sits between the floor and the cymbal`);
      assert.ok(Math.hypot(s.tilter.x - KIT_PLACED_CYMBALS[id].c.x, s.tilter.z - KIT_PLACED_CYMBALS[id].c.z) < 30, `${id}: the tilter is under the centre`);
    }
    const h = hihatStandPoints();
    assert.equal(h.foot.y, KIT_FLOOR_Y);
    assert.ok(h.rodTop.y < KIT_PLACED_CYMBALS.hihat.c.y, 'the pull rod rises through the pair');
  });
  it('every solid has a label a learner can read, and ids are unique', () => {
    const s = cymbalSolids();
    assert.equal(new Set(s.map((x) => x.id)).size, s.length);
    for (const x of s) assert.match(x.label, /^[a-z0-9 -]+$/i, x.id);
  });
});

describe('the cymbal family — vibration shapes (the Cymatics Lab’s disc)', () => {
  it('only centre-still shapes (n ≥ 1), ascending; the first is (2,0)', () => {
    assert.equal(CYMBAL_SHAPES.length, 6);
    assert.equal(CYMBAL_SHAPES[0].label, '(2,0)');
    assert.equal(CYMBAL_SHAPES[0].ratio, 1);
    for (let i = 0; i < CYMBAL_SHAPES.length; i++) {
      assert.ok(CYMBAL_SHAPES[i].n >= 1);
      if (i) assert.ok(CYMBAL_SHAPES[i].ratio > CYMBAL_SHAPES[i - 1].ratio);
    }
  });
  it('the still diameters are evenly spaced, n of them', () => {
    for (const sh of CYMBAL_SHAPES) {
      const d = cymbalStillDiameters(sh);
      assert.equal(d.length, sh.n);
      for (let k = 1; k < d.length; k++) assert.ok(Math.abs(d[k] - d[k - 1] - Math.PI / sh.n) < 1e-9);
    }
  });
  it('the (n,0) shapes move the edge more than the bow; a strike there drives them hardest', () => {
    for (const sh of CYMBAL_SHAPES.filter((q) => q.s === 0)) {
      assert.ok(edgeToBow(sh) > 1, sh.label);
      assert.ok(cymbalStrikeShare(sh, 0.97) > cymbalStrikeShare(sh, 0.2), sh.label);
    }
  });
});
