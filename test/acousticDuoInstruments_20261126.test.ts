/**
 * THE ACOUSTIC DUO'S INSTRUMENTS (owner 2026-11-26: "the acoustic duo needs to redo the guitars they are oddly
 * stretched"). The seated acoustic guitar and the mandolin of the E08 seatings (acoustic.duo, acoustic.trio) are
 * the guitar family's own instruments at TRUE size — C01's steel-string dreadnought and C05b's A-style mandolin —
 * drawn by an exact projection (the body's width square to its length; the old outline was sheared), with:
 *   - the sound point each mic reads (bandStage.soundHole), every seat and the lesson spots exactly where they were;
 *   - the drawn hole's center ON that sound point;
 *   - the fretting hand (ensembleHands: L + 0.55·neck) on the real neck, behind the nut.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { seatingOf } from '../src/screens/lab/miking/lessons/shared/ensemble/seating.ts';
import { GUITAR_POSE, HELD_DRAWN, heldDrawnPoint, soundHole } from '../src/screens/lab/miking/lessons/shared/ensemble/bandStage.ts';
import { fretFromNut, geomOf, IN, MANDO_A, STEEL_DREAD } from '../src/screens/lab/miking/lessons/shared/guitars/guitarSpec.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const ART = read('src/screens/lab/miking/lessons/shared/ensemble/SeatingArt.tsx');
const near = (a: number, b: number, tol: number, what: string) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b}`);

/** The sound points, seats and facings BEFORE the change (printed from the code as it stood, 2026-11-26). */
const BEFORE = [
  { seating: 'acoustic.duo', id: 'ag.1', hole: { x: -868.5579864460362, y: -565.7952682562337, z: -529.3042479154677 }, p: { x: -1112.0225647577129, y: 0, z: -625.2568865958319 }, face: 140 },
  { seating: 'acoustic.duo', id: 'mdn.1', hole: { x: 966.8707211564024, y: -868.4214814621137, z: -446.81006847996974 }, p: { x: 1112.0225647577129, y: 0, z: -625.2568865958319 }, face: 220 },
  { seating: 'acoustic.trio', id: 'ag.1', hole: { x: -868.5579864460362, y: -565.7952682562337, z: -529.3042479154677 }, p: { x: -1112.0225647577129, y: 0, z: -625.2568865958319 }, face: 140 },
] as const;

describe('the acoustic duo and trio: true instruments, nothing measured moved', () => {
  it('every sound point, seat and facing is exactly where it was', () => {
    for (const b of BEFORE) {
      const q = seatingOf(b.seating).seats.find((s) => s.id === b.id)!;
      assert.ok(q, `${b.seating} ${b.id}`);
      assert.deepEqual(q.p, b.p);
      assert.equal(q.face, b.face);
      const k = q.kind as 'aguitar' | 'mandolin';
      assert.deepEqual(soundHole(q, k), b.hole, `${b.seating} ${b.id} soundHole`);
      assert.deepEqual(q.src, b.hole, `${b.seating} ${b.id} the sound point the mics read`);
    }
  });

  it('the pose the lesson spots read (tail, angle, L) is unchanged', () => {
    assert.deepEqual({ ...GUITAR_POSE.aguitar, neck: 0 }, { tailR: 170, tailUp: 470, fwd: 230, ang: 18, L: 500, neck: 0 });
    assert.deepEqual({ ...GUITAR_POSE.mandolin, neck: 0 }, { tailR: 170, tailUp: 760, fwd: 230, ang: 32, L: 330, neck: 0 });
  });

  it('the drawn hole’s center is the sound point', () => {
    for (const b of BEFORE) {
      const q = seatingOf(b.seating).seats.find((s) => s.id === b.id)!;
      const k = q.kind as 'aguitar' | 'mandolin';
      const c = heldDrawnPoint(q, k, HELD_DRAWN[k].spec.opening.x.mm);
      for (const ax of ['x', 'y', 'z'] as const) near(c[ax], b.hole[ax], 1e-9, `${b.id} hole ${ax}`);
    }
  });
});

describe('the proportions drawn are the family’s own (true size)', () => {
  it('the guitar is C01’s steel-string dreadnought', () => {
    assert.equal(HELD_DRAWN.aguitar.spec, STEEL_DREAD);
    const g = geomOf(STEEL_DREAD);
    near(g.edge - g.tail, 20 * IN, 0.01, 'body length 20 in (508 mm)');
    near(g.lowerH * 2, 16 * IN, 0.01, 'lower bout 16 in');
    near(g.waistH * 2, 11.0625 * IN, 0.01, 'waist 11-1/16 in');
    near(g.upperH * 2, 292, 0.01, 'upper bout');
    near(g.depth, 4.625 * IN, 0.01, 'depth 4-5/8 in');
    near(g.L, 25.5 * IN, 0.01, 'scale 25-1/2 in');
    near(g.edge, g.L - fretFromNut(g.L, 14), 0.01, 'the 14th fret at the body');
    near(g.L - g.edge, 359.2, 0.1, 'neck, body to nut');
    near(g.hole.r * 2, 100, 0.01, 'round hole');
    const overall = g.edge - g.tail + (g.L - g.edge) + STEEL_DREAD.neck.headLen.mm;
    assert.ok(overall > 1000 && overall < 1080, `overall ${overall}`);
    // the body against the neck: a real dreadnought, never a small body on a long neck
    assert.ok((g.edge - g.tail) / (g.L - g.edge) > 1.35, 'body longer than the neck by a third');
    assert.ok(g.lowerH * 2 / (g.edge - g.tail) > 0.75, 'lower bout about 0.8 of the body length');
  });

  it('the mandolin is C05b’s A-style mandolin', () => {
    assert.equal(HELD_DRAWN.mandolin.spec, MANDO_A);
    const g = geomOf(MANDO_A);
    near(g.edge - g.tail, 350, 0.01, 'body length');
    near(g.lowerH * 2, 260, 0.01, 'width 26 cm');
    near(g.L, 350, 0.01, 'scale');
    near(g.L - g.edge, 160, 0.01, 'neck, body to nut');
    assert.equal(MANDO_A.outline, 'teardrop');
    assert.equal(MANDO_A.opening.kind, 'oval');
    const overall = g.edge - g.tail + (g.L - g.edge) + MANDO_A.neck.headLen.mm;
    assert.ok(overall > 640 && overall < 700, `overall ${overall}`);
    assert.ok((g.edge - g.tail) / (g.L - g.edge) > 2, 'the body twice the neck');
  });

  it('the fretting hand sits on the real neck, behind the nut (L + neck = the drawn nut)', () => {
    // ensembleHands: the hand's centre at L + 0.55·neck, its fingers ±1.5 frets of 28 mm (guitar) / 20 mm (mandolin)
    for (const [k, sp] of [['aguitar', 28], ['mandolin', 20]] as const) {
      const G = GUITAR_POSE[k];
      const g = geomOf(HELD_DRAWN[k].spec);
      const nut = HELD_DRAWN[k].off + g.L;
      const edge = HELD_DRAWN[k].off + g.edge;
      near(G.L + G.neck, nut, 0.5, `${k} L + neck is the drawn nut`);
      const o = G.L + 0.55 * G.neck;
      assert.ok(o + 1.5 * sp < nut - 10, `${k}: the first finger behind the nut`);
      assert.ok(o - 1.5 * sp > edge, `${k}: the last finger on the neck, short of the body`);
    }
  });
});

describe('SeatingArt draws them from the family, by an exact projection', () => {
  it('the face and edge drawings are GuitarFace and GuitarEdge, on HELD_DRAWN', () => {
    assert.match(ART, /import \{ GuitarEdge, GuitarFace \} from '\.\.\/guitars\/GuitarArt';/);
    assert.match(ART, /<GuitarFace sc=\{sc\} \/>/);
    assert.match(ART, /<GuitarEdge sc=\{sc\} \/>/);
    assert.match(ART, /const spec = HELD_DRAWN\[k\]\.spec;/);
  });
  it('the width runs square to the length (the old outline was sheared)', () => {
    assert.match(ART, /x: \{ r: ar, up: au, f: 0 \}, y: \{ r: -au, up: ar, f: 0 \}/);
    for (const k of ['aguitar', 'mandolin'] as const) {
      const an = (GUITAR_POSE[k].ang * Math.PI) / 180;
      const x = [-Math.cos(an), Math.sin(an)];
      const y = [-Math.sin(an), -Math.cos(an)];
      near(x[0] * y[0] + x[1] * y[1], 0, 1e-12, `${k} square`);
    }
  });
  it('the plan and both elevations take the held kinds before BandArt (whose drawing goes to a scratch batch)', () => {
    assert.equal((ART.match(/if \(isHeldAcoustic\(k\)\) \{/g) ?? []).length, 2);
    assert.match(ART, /heldArt\(k, heldMapPlan\(k\), 'edge', key\)/);
    assert.match(ART, /heldArt\(k, heldMapElev\(k, o, g, rightU, fwdU\), mode, key\)/);
    assert.match(ART, /bandPlanInstrument\(newBatch\(\), s,/);
    assert.match(ART, /bandElevInstrument\(newBatch\(\), s, view,/);
  });
});
