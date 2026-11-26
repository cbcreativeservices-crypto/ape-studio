/**
 * THE ACOUSTIC DUO'S INSTRUMENTS (owner 2026-11-26: "the acoustic duo needs to redo the guitars they are oddly
 * stretched"; then "Yes, move them"). The seated acoustic guitar and the mandolin of the E08 seatings (acoustic.duo,
 * acoustic.trio) are the guitar family's own instruments at TRUE size — C01's steel-string dreadnought and C05b's
 * A-style mandolin — drawn by an exact projection (the body's width square to its length; the old outline was
 * sheared), with:
 *   - every seat and facing where it was; the drawn hole's center ON the sound point (bandStage.soundHole);
 *   - the guitar RAISED onto the seated figure's right thigh (its sound point moved, old → new pinned below), the
 *     mandolin's sound point unchanged;
 *   - the E08 guitar mic aimed at the drawn guitar's TRUE 12th fret, the mandolin mic where the drawn neck meets the
 *     body, each at its lesson distance (22.5 cm, 35 cm);
 *   - the fretting hand (ensembleHands: L + 0.55·neck) on the real neck, behind the nut.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { seatingOf } from '../src/screens/lab/miking/lessons/shared/ensemble/seating.ts';
import { GUITAR_POSE, HELD_DRAWN, heldDrawnPoint, soundHole } from '../src/screens/lab/miking/lessons/shared/ensemble/bandStage.ts';
import { SHOULDER } from '../src/screens/lab/miking/lessons/shared/ensemble/ensembleHands.ts';
import { fretFromNut, fretX, geomOf, IN, MANDO_A, STEEL_DREAD } from '../src/screens/lab/miking/lessons/shared/guitars/guitarSpec.ts';
import { BASS_MIC, E08_NUMBERS, FIDDLE_MIC, GUITAR_MIC, MANDOLIN_MIC } from '../src/screens/lab/miking/lessons/e08AcousticGroup/geometry.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const ART = read('src/screens/lab/miking/lessons/shared/ensemble/SeatingArt.tsx');
const near = (a: number, b: number, tol: number, what: string) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b}`);
type V = { x: number; y: number; z: number };
const nearV = (a: V, b: V, tol: number, what: string) => (['x', 'y', 'z'] as const).forEach((ax) => near(a[ax], b[ax], tol, `${what} ${ax}`));
const dist = (a: V, b: V) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

const SEAT_AG = { p: { x: -1112.0225647577129, y: 0, z: -625.2568865958319 }, face: 140 } as const;
const SEAT_MD = { p: { x: 1112.0225647577129, y: 0, z: -625.2568865958319 }, face: 220 } as const;
/** The guitar's sound point: OLD (hanging through the thigh, 566 mm up) → NEW (resting on it, 846 mm up). */
const AG_HOLE = {
  old: { x: -868.5579864460362, y: -565.7952682562337, z: -529.3042479154677 },
  new: { x: -994.1892751175486, y: -845.7952682562337, z: -423.88707992687523 },
} as const;
/** The mandolin's sound point: unchanged. */
const MD_HOLE = { x: 966.8707211564024, y: -868.4214814621137, z: -446.81006847996974 } as const;
/** E08's spots: OLD → NEW (the point each mic aims at, and the mic). */
const SPOTS = {
  guitar: {
    own: { old: { x: -686.4200965960373, y: -643.0495168499706, z: -682.1360841120099 }, new: { x: -893.0298910948592, y: -888.7022779251952, z: -508.7698817504348 } },
    mic: { old: { x: -543.3929888577615, y: -676.4261187592756, z: -511.68301462656063 }, new: { x: -750.0027833565833, y: -922.0788798345002, z: -338.3168122649855 } },
  },
  mandolin: {
    own: { old: { x: 1048.335894613808, y: -934.8733571969576, z: -378.45267147806754 }, new: { x: 1018.8421236810631, y: -910.8150226007701, z: -403.20088378976095 } },
    mic: { old: { x: 827.7291065925457, y: -1003.5140044953221, z: -115.54373930305877 }, new: { x: 798.2353356598007, y: -979.4556698991346, z: -140.29195161475218 } },
  },
} as const;

describe('the acoustic duo and trio: the seats stay, the guitar rests on the lap', () => {
  it('every seat and facing is where it was; the guitar’s sound point moved old → new, the mandolin’s did not', () => {
    for (const id of ['acoustic.duo', 'acoustic.trio'] as const) {
      const ag = seatingOf(id).seats.find((s) => s.id === 'ag.1')!;
      assert.deepEqual(ag.p, SEAT_AG.p);
      assert.equal(ag.face, SEAT_AG.face);
      nearV(soundHole(ag, 'aguitar'), AG_HOLE.new, 1e-6, `${id} guitar sound point`);
      nearV(ag.src!, AG_HOLE.new, 1e-6, `${id} the guitar sound point the mics read`);
    }
    const md = seatingOf('acoustic.duo').seats.find((s) => s.id === 'mdn.1')!;
    assert.deepEqual(md.p, SEAT_MD.p);
    assert.equal(md.face, SEAT_MD.face);
    assert.deepEqual(soundHole(md, 'mandolin'), MD_HOLE);
    // the move: 280 mm up, 164 mm to the player's right, the depth ahead unchanged
    near(-AG_HOLE.new.y - -AG_HOLE.old.y, 280, 1e-6, 'raised');
  });

  it('the guitar pose: raised and moved right only (the angle, the depth ahead, L unchanged); the mandolin’s unchanged', () => {
    assert.deepEqual({ ...GUITAR_POSE.aguitar, neck: 0 }, { tailR: 334, tailUp: 750, fwd: 230, ang: 18, L: 500, neck: 0 });
    assert.deepEqual({ ...GUITAR_POSE.mandolin, neck: 0 }, { tailR: 170, tailUp: 760, fwd: 230, ang: 32, L: 330, neck: 0 });
  });

  it('the drawn hole’s center is the sound point', () => {
    const ag = seatingOf('acoustic.duo').seats.find((s) => s.id === 'ag.1')!;
    const md = seatingOf('acoustic.duo').seats.find((s) => s.id === 'mdn.1')!;
    nearV(heldDrawnPoint(ag, 'aguitar', STEEL_DREAD.opening.x.mm), AG_HOLE.new, 1e-9, 'guitar hole');
    nearV(heldDrawnPoint(md, 'mandolin', MANDO_A.opening.x.mm), MD_HOLE, 1e-9, 'mandolin hole');
  });

  it('the guitar rests ON the seated figure’s right thigh, never through it, its top edge below the shoulders', () => {
    // the seated figure (SeatingArt seatSkeleton): the hip joints 45 + 495 mm under the neck base (1010 + 45), the
    // knees 30 mm lower and 420 ahead, the thigh's radius 84 at the hip → 74 at 55 % (figureV2 sidePlan THIGH_R0)
    assert.match(ART, /const hipY = n\.y - \(seated \? 495 : 505\);/);
    assert.match(ART, /hipL: v3l\(-100, hipY, pelvis\.z\),/);
    assert.match(ART, /const knee = \(sx: number\) => \(seated \? v3l\(sx \* kneeW, hipY - 30, 420\)/);
    assert.doesNotMatch(ART, /lowLap/);
    const hipY = SHOULDER.seated + 45 - 495;
    assert.equal(hipY, 560);
    const G = GUITAR_POSE.aguitar;
    const g = geomOf(STEEL_DREAD);
    const off = HELD_DRAWN.aguitar.off;
    const an = (G.ang * Math.PI) / 180;
    let gapMin = Infinity;
    let topRim = -Infinity;
    // the rim (the treble side under, the bass side over) at every depth of the body, against the right thigh there
    for (let zi = 0; zi <= 8; zi++) {
      const z = G.fwd - g.depth + (g.depth * zi) / 8;
      const t = (z + 30) / 450;
      const xc = 100 + 18 * t;
      const yc = hipY - 30 * t;
      const R = 84 - (10 * Math.min(t, 0.55)) / 0.55;
      for (let i = 0; i <= 400; i++) {
        const x = g.tail + ((g.edge - g.tail) * i) / 400;
        const s = x + off;
        const r = G.tailR - Math.cos(an) * s - Math.sin(an) * g.halfW(x, 'treble');
        const up = G.tailUp + Math.sin(an) * s - Math.cos(an) * g.halfW(x, 'treble');
        if (Math.abs(r - xc) < R) gapMin = Math.min(gapMin, up - (yc + Math.sqrt(R * R - (r - xc) ** 2)));
        topRim = Math.max(topRim, G.tailUp + Math.sin(an) * s + Math.cos(an) * g.halfW(x, 'bass'));
      }
    }
    assert.ok(gapMin >= 0 && gapMin < 3, `the rim rests on the thigh (closest ${gapMin.toFixed(1)} mm)`);
    assert.ok(topRim < SHOULDER.seated, `the upper edge ${topRim.toFixed(0)} mm, under the ${SHOULDER.seated} mm shoulders`);
  });
});

describe('E08’s spots follow the drawn instruments at their lesson distances', () => {
  const ag = seatingOf('acoustic.duo').seats.find((s) => s.id === 'ag.1')!;
  const md = seatingOf('acoustic.duo').seats.find((s) => s.id === 'mdn.1')!;
  it('the guitar mic: aimed at the TRUE 12th fret (half the 25-1/2 in scale from the saddle), 22.5 cm out', () => {
    near(fretX(STEEL_DREAD.scale.mm, 12), 323.85, 1e-9, '12th fret from the saddle');
    nearV(GUITAR_MIC.own, heldDrawnPoint(ag, 'aguitar', 323.85), 1e-9, 'aim');
    nearV(GUITAR_MIC.own, SPOTS.guitar.own.new, 1e-6, 'aim (pinned new)');
    nearV(GUITAR_MIC.p, SPOTS.guitar.mic.new, 1e-6, 'mic (pinned new)');
    near(dist(GUITAR_MIC.p, GUITAR_MIC.own), E08_NUMBERS.guitarD, 1e-6, 'distance');
    // (the old aim, L + 60 on the old pose, lay 111 mm up the drawn neck — about its 7th fret)
    assert.notDeepEqual(SPOTS.guitar.own.old, SPOTS.guitar.own.new);
  });
  it('the mandolin mic: aimed where the drawn neck meets the body, 35 cm out', () => {
    nearV(MANDOLIN_MIC.own, heldDrawnPoint(md, 'mandolin', geomOf(MANDO_A).edge), 1e-9, 'aim');
    nearV(MANDOLIN_MIC.own, SPOTS.mandolin.own.new, 1e-6, 'aim (pinned new)');
    nearV(MANDOLIN_MIC.p, SPOTS.mandolin.mic.new, 1e-6, 'mic (pinned new)');
    near(dist(MANDOLIN_MIC.p, MANDOLIN_MIC.own), E08_NUMBERS.mandolinD, 1e-6, 'distance');
    near(dist(SPOTS.mandolin.own.old, SPOTS.mandolin.own.new), 45.4, 0.1, 'moved down the neck to the joint');
  });
});

import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { compileScene, checkAssembly } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
describe('E08: the guitar mic’s stand stands clear of the guitarist’s wedge', () => {
  it('the lesson validates; the booms run level 900 mm (a 700 mm boom dropped the stand onto the wedge)', () => {
    const L = lessonById('E08')!;
    assert.deepEqual(validateLesson(L, MIC_TYPES), []);
    const m = L.model;
    assert.deepEqual(m.mountRule, { boom: 'level', fallback: { x: 0, y: 0, z: 1 }, length: 900 });
    const z = L.zones.find((q) => q.id === 'ac.ag')!;
    const body = micBodyOf(MIC_TYPES.sdcCard);
    for (const v of ['duo', 'trio']) {
      assert.equal(checkAssembly(compileScene(m, v), z.start, body), null, `${v}: clear at 900`);
      const old = checkAssembly(compileScene({ ...m, mountRule: { ...m.mountRule!, length: 700 } }, v), z.start, body);
      assert.equal(old?.partId, `${v}:gear.mon.ag`, `${v}: the old 700 mm boom met the wedge`);
    }
    // the mic head itself is where the owner approved it
    nearV(z.start.p, SPOTS.guitar.mic.new, 1e-6, 'the guitar mic head');
  });
});

describe('E08’s two-spot setups after the move', () => {
  it('duo: the guitar and mandolin mics stay over 3 × the larger mic-to-source distance apart (1464 → 1562 mm ≥ 1050)', () => {
    const d = dist(GUITAR_MIC.p, MANDOLIN_MIC.p);
    near(d, 1562, 1, 'guitar to mandolin mic');
    assert.ok(d >= 3 * Math.max(E08_NUMBERS.guitarD, E08_NUMBERS.mandolinD));
  });
  it('trio: the guitar mic moved away from the fiddle mic (744 → 818 mm) and the bass mic (1461 → 1629 mm)', () => {
    near(dist(GUITAR_MIC.p, FIDDLE_MIC.p), 818, 1, 'guitar to fiddle mic');
    near(dist(SPOTS.guitar.mic.old, FIDDLE_MIC.p), 744, 1, 'was');
    near(dist(GUITAR_MIC.p, BASS_MIC.p), 1629, 1, 'guitar to bass mic');
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
    // ensembleHands: the hand's center at L + 0.55·neck, its fingers ±1.5 frets of 28 mm (guitar) / 20 mm (mandolin)
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
