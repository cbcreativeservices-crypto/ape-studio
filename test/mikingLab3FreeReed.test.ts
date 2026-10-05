/**
 * Miking Labs — Lab 3 FREE REEDS AND THE ORGAN: A10 harmonica, A11
 * accordion, A12 acoustic pipe organ. Real relationships only (charter
 * §9.2):
 *   • the physics the pictures draw: an ideal clamped-free reed (its roots,
 *     its ratios, its still points; the held end never moves), the puff
 *     sequence's order; an open pipe sounds c/2L, a stopped one c/4L (an
 *     octave lower for the same length — the "8′ stop only 4′ long"); the
 *     nave's lengthwise resonances are c·n/2L, with pressure maxima at the
 *     end walls;
 *   • each instrument is its research's size (sourced where a source gives
 *     it, a flagged placeholder where none does);
 *   • each lesson validates; every zone's start is clear of the instrument,
 *     inside its zone and its drawn band, outside every keep-out;
 *   • the harmonica's amp IS the speaker family's combo with the speaker
 *     module's starting points, unchanged in number and reference (HM-01);
 *     the acoustic stand zone is the lesson's 15–30 cm from the harmonica,
 *     just beyond the hands; the off-breath zone lies outside the breath cone;
 *   • the accordion's bass box moves with the bellows; the bellows zone is
 *     measured beyond its FULL opening (outside the travel), and the treble
 *     and bass sides' arrival times change over the bellows cycle; the SM57
 *     starting point is ≈ 18 in from the grille's centre (AC-01);
 *   • the organ is a distributed source: its divisions reach a listening
 *     position at different times; the case-study position is ≈ 35 ft from
 *     the pipework and ≈ 8 ft up; every zone is on the floor-stand side of
 *     the aisles and exits;
 *   • the checks follow the item-writing rules; the words name nobody from
 *     the research; the lessons are registered in Lab 3, each on its own
 *     line; no file in the family loops.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { itemRules, learnerStrings, RESEARCH_NAMES } from './_mikingItemRules.ts';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = process.cwd();
const MIKING = 'src/screens/lab/miking';
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const near = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;
const IN = 25.4;

const reed = await import('../src/screens/lab/miking/lessons/shared/freereed/reedModel.ts');
const spec = await import('../src/screens/lab/miking/lessons/shared/freereed/freeReedSpec.ts');
const hm = await import('../src/screens/lab/miking/lessons/a10Harmonica/model.ts');
const hmG = await import('../src/screens/lab/miking/lessons/a10Harmonica/geometry.ts');
const { A10_LESSON } = await import('../src/screens/lab/miking/lessons/a10Harmonica/lesson.ts');
const spk = await import('../src/screens/lab/miking/lessons/spk/model.ts');
const ac = await import('../src/screens/lab/miking/lessons/a11Accordion/model.ts');
const acG = await import('../src/screens/lab/miking/lessons/a11Accordion/geometry.ts');
const { A11_LESSON } = await import('../src/screens/lab/miking/lessons/a11Accordion/lesson.ts');
const pipe = await import('../src/screens/lab/miking/lessons/shared/organ/pipeModel.ts');
const org = await import('../src/screens/lab/miking/lessons/a12Organ/model.ts');
const orgG = await import('../src/screens/lab/miking/lessons/a12Organ/geometry.ts');
const { A12_LESSON } = await import('../src/screens/lab/miking/lessons/a12Organ/lesson.ts');
const { MIC_TYPES } = await import('../src/screens/lab/miking/data/micTypes.ts');
const { validateLesson, micBodyOf } = await import('../src/screens/lab/miking/engine/model/validate.ts');
const { checkAssembly, compileScene } = await import('../src/screens/lab/miking/engine/geometry/collision.ts');
const { inZone, surfaceDistance } = await import('../src/screens/lab/miking/engine/geometry/zones.ts');
const { lessonById } = await import('../src/screens/lab/miking/data/lessons.ts');
const { LESSONS, readyLabs } = await import('../src/screens/lab/miking/data/registry.ts');
const { inPoly } = await import('../src/screens/lab/miking/lessons/shared/handGeom.ts');

type L = typeof A10_LESSON;
const UNDER_TEST: L[] = [A10_LESSON, A11_LESSON, A12_LESSON];

/** A Lab 3 research name that must never reach a learner. */
const LAB3_NAMES = /\b(Hohner|Rocket Amp|Special 20|520DX|HB52|Harp Blaster|A95U|sE Electronics|KSM ?137|MX ?18[35]|C ?416(III)?|A-CLIP|4099|4006|4011|4060|Schoeps|Neumann|Brubacher|Petruskerk|Westminster|Organ Historical Society|Giavaras|Mills)\b/;

describe('the free reed: an ideal clamped-free bar (the sound page’s shapes)', () => {
  it('the roots solve cos x · cosh x = −1', () => {
    for (const b of reed.CANTILEVER_ROOTS) assert.ok(Math.abs(reed.cantileverResidual(b)) < 1e-6, String(b));
  });
  it('the shapes’ pitch ratios are 1, 6.27, 17.55, 34.39 — far apart, not a harmonic series', () => {
    const r = reed.REED_RATIOS;
    assert.ok(near(r[0], 1));
    assert.ok(near(r[1], 6.267, 0.001) && near(r[2], 17.547, 0.001) && near(r[3], 34.386, 0.001));
    for (const x of r.slice(1)) assert.ok(Math.abs(x - Math.round(x)) > 0.2, `${x} is not near a whole number`);
  });
  it('the held end never moves (no displacement, no slope); the free tip moves ±1', () => {
    for (let n = 0; n < 4; n++) {
      assert.ok(Math.abs(reed.reedShape(n, 0)) < 1e-9);
      assert.ok(Math.abs(reed.reedShape(n, 1e-4)) < 1e-6, 'zero slope at the rivet');
      assert.ok(near(reed.reedShape(n, 1), 1));
    }
  });
  it('shape n has n − 1 still points along the tongue (shape 2 near 0.78, shape 3 near 0.50 and 0.87)', () => {
    assert.equal(reed.reedNodes(0).length, 0);
    const n1 = reed.reedNodes(1);
    assert.equal(n1.length, 1);
    assert.ok(near(n1[0], 0.7834, 0.002));
    const n2 = reed.reedNodes(2);
    assert.equal(n2.length, 2);
    assert.ok(near(n2[0], 0.5036, 0.002) && near(n2[1], 0.8677, 0.002));
    assert.equal(reed.reedNodes(3).length, 3);
  });
  it('the puff sequence: closed at rest, open once the reed has swung clear, puffs only grow, sound at the end', () => {
    const s = reed.PUFF_STEPS;
    assert.equal(s.length, 4);
    assert.equal(s[0].open, false);
    assert.equal(reed.slotOpen(s[0].tip), false);
    for (const q of s.slice(1)) assert.equal(reed.slotOpen(q.tip), q.open);
    for (let i = 1; i < s.length; i++) assert.ok(s[i].puffs >= s[i - 1].puffs);
    assert.deepEqual(s.map((q) => q.sound), [false, false, false, true]);
    assert.ok(s[1].tip > 0 && s[2].tip < 0, 'pushed through, then sprung back past the plate');
  });
});

describe('A10 harmonica: the instrument, the player and the harp amp', () => {
  it('a 10-hole, 20-reed, 102 mm harmonica (sourced); its height and depth are flagged drawing defaults', () => {
    assert.equal(spec.HARMONICA.length.mm, 102);
    assert.equal(spec.HARMONICA.length.prov.kind, 'sourced');
    assert.equal(spec.HARMONICA.holes.mm, 10);
    assert.equal(spec.HARMONICA.reeds.mm, 2 * spec.HARMONICA.holes.mm, 'two reeds per hole');
    assert.ok(spec.HARMONICA.height.placeholder && spec.HARMONICA.depth.placeholder);
  });
  it('the harp mic is the research’s omni bullet (Ø 63 × 82.6 mm), offered on the mic page but on no stand zone', () => {
    const b = MIC_TYPES.harpBullet;
    assert.equal(b.patterns[0].id, 'omni');
    assert.equal(b.body.radius.mm * 2, 63);
    assert.equal(b.body.length.mm, 82.6);
    assert.ok(A10_LESSON.micTypeIds.includes('harpBullet'));
    for (const z of A10_LESSON.zones) assert.ok(!(z.requires?.micTypeIds ?? []).includes('harpBullet'), z.id);
  });
  it('the amp is the speaker family’s combo in its own frame C; the player stands in front of it, off its axis', () => {
    assert.equal(hm.FLOOR_Y, hm.AMP.floorY);
    assert.ok(hm.H0.x > hm.AMP.box.x1 + 800, 'in front of the amp');
    const off = (Math.atan2(Math.abs(hm.H0.z), hm.H0.x) * 180) / Math.PI;
    assert.ok(off > 20 && off < 60, `the amp points ${off.toFixed(0)}° away from the cupped mic`);
    assert.ok(near(hm.FLOOR_Y - hm.H0.y, spec.HARMONICA.mouthH.mm), 'the mouth at its drawing-default height above the shared floor');
  });
  it('the amp’s starting points are the speaker module’s, unchanged in number and reference (HM-01)', () => {
    const amp = A10_LESSON.zones.filter((z) => z.id.startsWith('hm.amp.'));
    assert.ok(amp.length >= 4);
    for (const z of amp) {
      const src = spk.SPK_FRONT_ZONES.find((q) => q.id === `cab.${z.id.slice(7)}`)!;
      assert.ok(src, z.id);
      assert.deepEqual(z.distance, src.distance, z.id);
      assert.equal(z.refSurface, 'grille');
      assert.deepEqual(z.start, src.start, z.id);
      assert.equal(z.requires?.variant, 'amp');
    }
    const b = amp.find((z) => z.id === 'hm.amp.boundary')!;
    assert.ok(near(b.distance.min, IN) && near(b.distance.max, 2 * IN), '1–2 in, not "2–5 cm"');
  });
  it('the acoustic stand zone: 15–30 cm from the harmonica, just beyond the hands, at mouth height', () => {
    const z = A10_LESSON.zones.find((q) => q.id === 'hm.stand')!;
    assert.deepEqual([z.distance.min, z.distance.max], [150, 300]);
    const hands = A10_LESSON.model.envelopes.find((e) => e.id === 'env.hands')!.shape;
    assert.equal(hands.kind, 'capsule');
    if (hands.kind === 'capsule') assert.ok(hands.a.x - hm.H0.x + hands.r < z.distance.min, 'the hands end before the zone begins');
    assert.ok(Math.abs(z.start.p.y - hm.H0.y) <= 150);
  });
  it('the off-breath zone lies outside the drawn breath cone, still aimed at the harmonica', () => {
    const z = A10_LESSON.zones.find((q) => q.id === 'hm.off')!;
    assert.ok(z.cone && z.cone.min >= hm.BREATH.half);
    const d = { x: z.start.p.x - hm.H0.x, y: z.start.p.y - hm.H0.y, z: z.start.p.z - hm.H0.z };
    const ang = (Math.acos(d.x / Math.hypot(d.x, d.y, d.z)) * 180) / Math.PI;
    assert.ok(ang > hm.BREATH.half, `${ang.toFixed(1)}° off the breath line`);
  });
  it('each path is framed on its own part of the stage (the acoustic view never shows the amp’s speaker)', () => {
    const ac = A10_LESSON.model.viewsByVariant!.acoustic!;
    assert.ok(ac.side!.u0 > hm.AMP.box.x1 + 200);
    const amp = A10_LESSON.model.viewsByVariant!.amp!;
    assert.ok(amp.side!.u1 < hm.H0.x - 200);
  });
  it('the live monitors: the wedge sits behind a stand mic that faces the harmonica; the amp does not', () => {
    const w = hmG.A10_WEDGES.find((q) => q.id === 'wedge')!;
    const z = A10_LESSON.zones.find((q) => q.id === 'hm.stand')!;
    assert.ok(w.p.x > z.start.p.x && near(w.p.z, z.start.p.z, 1));
    const a = hmG.A10_WEDGES.find((q) => q.id === 'amp')!;
    assert.equal(a.glyph, 'none');
  });
});

describe('A11 accordion: two sides, one of them moving', () => {
  it('a full-size piano accordion: 41 keys and 120 buttons (sourced); its sizes are flagged drawing defaults', () => {
    assert.equal(spec.ACCORDION.keys.mm, 41);
    assert.equal(spec.ACCORDION.buttons.mm, 120);
    assert.equal(spec.ACCORDION.keys.prov.kind, 'sourced');
    for (const k of ['trebleH', 'bassW', 'bellowsMax', 'fanMax'] as const) assert.ok(spec.ACCORDION[k].placeholder, k);
  });
  it('the treble side is fixed; the bass side moves out with the bellows, the bottom more than the top', () => {
    const t = A11_LESSON.model.parts.find((p) => p.id === 'ac.treble')!;
    assert.equal(t.variants, undefined);
    const z = ['in', 'mid', 'out'].map((v) => ac.bassBox(v));
    assert.ok(z[0].box.z0 > z[1].box.z0 && z[1].box.z0 > z[2].box.z0, 'farther out at each stage');
    assert.ok(near(z[0].deg, 0) && z[2].deg > z[1].deg && z[2].deg <= spec.ACCORDION.fanMax.mm + 0.01);
    assert.ok(near(ac.TREBLE.z0 - z[2].ib.z, spec.ACCORDION.bellowsMax.mm), 'the full opening at the bottom');
    assert.ok(near(ac.TREBLE.z0 - z[0].ib.z, spec.ACCORDION.bellowsClosed.mm));
  });
  it('the bellows keep-out holds the bass side at every stage of the cycle (and the left hand beyond it)', () => {
    const env = A11_LESSON.model.envelopes.find((e) => e.id === 'env.bellows')!.shape;
    assert.equal(env.kind, 'box');
    if (env.kind !== 'box') return;
    for (const v of ['in', 'mid', 'out']) {
      const b = ac.bassBox(v).box;
      assert.ok(env.min.z <= b.z0 - ac.HAND_MARGIN + 1e-6 && env.max.z >= b.z1, v);
      assert.ok(env.min.y <= b.y0 && env.max.y >= b.y1, v);
    }
  });
  it('the bellows-side zone is 4–6 in from the bass side at its FULL opening, so its start is outside the travel (AC-02)', () => {
    const z = A11_LESSON.zones.find((q) => q.id === 'ac.bass')!;
    assert.ok(near(z.distance.min, 4 * IN) && near(z.distance.max, 6 * IN));
    const s = A11_LESSON.model.surfaces.find((q) => q.id === 'bass')!;
    assert.ok(near(s.point.z, ac.BASS_FULL));
    assert.ok(z.start.p.z < ac.BASS_FULL - ac.HAND_MARGIN, 'beyond the hand on the fully open side');
  });
  it('the dynamic’s starting point is about 18 in from the grille’s centre (AC-01), the one-mic view 1–2 ft in front', () => {
    const g = A11_LESSON.zones.find((q) => q.id === 'ac.grille')!;
    assert.ok(g.distance.min < 18 * IN && g.distance.max > 18 * IN);
    assert.ok(Math.abs((g.distance.min + g.distance.max) / 2 - 18 * IN) < 5);
    assert.equal(A11_LESSON.model.surfaces.find((q) => q.id === 'grille')!.target, true);
    const one = A11_LESSON.zones.find((q) => q.id === 'ac.one')!;
    assert.ok(near(one.distance.min, 12 * IN) && near(one.distance.max, 24 * IN));
    const t = A11_LESSON.zones.find((q) => q.id === 'ac.treble')!;
    assert.ok(t.distance.min < 12 * IN && t.distance.max > 12 * IN);
  });
  it('the two sides reach a treble mic and a bass mic with a delay that changes over the bellows cycle', () => {
    const A = A11_LESSON.zones.find((q) => q.id === 'ac.treble')!.start.p;
    const B = A11_LESSON.zones.find((q) => q.id === 'ac.bass')!.start.p;
    const d = (p: { x: number; y: number; z: number }, q: { x: number; y: number; z: number }) => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
    const dts = ['in', 'mid', 'out'].map((v) => {
      const o = acG.bassOutletsAt(v);
      return (d(o, B) - d(o, A)) / 343.2;
    });
    assert.ok(Math.abs(dts[0] - dts[2]) > 0.5, `Δt moves by ${(Math.abs(dts[0] - dts[2])).toFixed(2)} ms over the cycle`);
    const regions = A11_LESSON.model.regions.filter((r) => r.id.startsWith('r.bass.'));
    assert.equal(regions.length, 3);
    for (const r of regions) assert.equal(r.variants?.length, 1);
  });
});

describe('A12 pipe organ: pipes, a distributed source and the room', () => {
  it('pitch: A4 = 440, the low C of a 32′, 16′ and 8′ stop is 16.35, 32.70, 65.41 Hz', () => {
    assert.ok(near(pipe.cHz(4), 261.63, 0.01));
    assert.ok(near(pipe.stopLowC(32), 16.352, 0.001) && near(pipe.stopLowC(16), 32.703, 0.001) && near(pipe.stopLowC(8), 65.406, 0.001));
  });
  it('a stopped pipe sounds an octave below an open pipe of the same length; half its length matches it (the "8′ stop only 4′ long")', () => {
    const L = 2.4;
    assert.ok(near(pipe.pipePitchHz(L, false) / pipe.pipePitchHz(L, true), 2));
    assert.ok(near(pipe.pipePitchHz(L / 2, true), pipe.pipePitchHz(L, false)));
    assert.ok(near(pipe.pipeLengthM(pipe.stopLowC(8), true) * 2, pipe.pipeLengthM(pipe.stopLowC(8), false)));
  });
  it('an open pipe has every harmonic, a stopped one only the odd; pressure is still at an open end and strongest at a cap', () => {
    assert.deepEqual(pipe.pipeHarmonics(false, 4), [1, 2, 3, 4]);
    assert.deepEqual(pipe.pipeHarmonics(true, 4), [1, 3, 5, 7]);
    for (const k of [1, 2, 3]) {
      assert.ok(pipe.pipePressure(0, k, false) < 1e-9 && pipe.pipePressure(1, k, false) < 1e-9);
      assert.ok(pipe.pipePressure(0, k, true) < 1e-9 && near(pipe.pipePressure(1, k, true), 1));
    }
  });
  it('the nave’s lengthwise resonances: f = n·c/2L, strongest at the end walls, still lines every L/n', () => {
    const m = pipe.naveMode(pipe.stopLowC(16), 30);
    assert.ok(near(m.hz, (m.n * pipe.C_AIR) / 60));
    assert.ok(Math.abs(m.hz - pipe.stopLowC(16)) <= pipe.C_AIR / 120 + 1e-9, 'the nearest one');
    assert.ok(near(pipe.navePressure(0, m.n, 30), 1) && near(pipe.navePressure(30, m.n, 30), 1));
    assert.ok(pipe.navePressure(m.spacingM / 2, m.n, 30) < 1e-9);
  });
  it('the case study is placed where the research put it: the fourth pew ≈ 35 ft from the pipework, ≈ 8 ft up, midway', () => {
    const fourth = org.pewXs()[3];
    assert.ok(Math.abs(fourth - 35 * 304.8) < 100, `${fourth}`);
    assert.ok(near(-org.STUDY.y, 8 * 304.8, 0.1) && org.STUDY.z === 0);
    const z = A12_LESSON.zones.find((q) => q.id === 'org.listen')!;
    assert.ok(z.distance.min < org.STUDY.x && z.distance.max > org.STUDY.x);
  });
  it('a distributed source: from the case study the divisions arrive several milliseconds apart; close to the Great, far more', () => {
    const ms = (p: { x: number; y: number; z: number }) => (['great', 'swell', 'pedal', 'positive'] as const).map((d) => { const q = org.divisionPoint(d); return pipe.arrivalMs(Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z)); });
    const spread = (a: number[]) => Math.max(...a) - Math.min(...a);
    const at = spread(ms(org.STUDY));
    const near6 = spread(ms(A12_LESSON.zones.find((q) => q.id === 'org.div')!.start.p));
    assert.ok(at > 1 && near6 > at, `${at.toFixed(1)} ms at the pew, ${near6.toFixed(1)} ms at the spot`);
  });
  it('the aisles, passages and exits are keep-outs; every starting point is a floor stand in a clear place', () => {
    const ids = A12_LESSON.model.envelopes.map((e) => e.id);
    for (const id of ['env.aisleL', 'env.aisleR', 'env.sideL', 'env.sideR']) assert.ok(ids.includes(id), id);
    for (const z of A12_LESSON.zones) {
      assert.ok(z.start.p.y < 0 && z.start.p.y > -4500, `${z.id}: a floor stand’s height`);
      assert.ok(Math.abs(z.start.p.z) < org.ORGAN.aisleZ0.mm, `${z.id}: in the middle block`);
    }
  });
  it('the PA exists only in a service; the right-hand PA sits behind and above the division spot', () => {
    const pa = A12_LESSON.model.parts.filter((p) => p.id.startsWith('org.pa'));
    assert.equal(pa.length, 2);
    for (const p of pa) assert.deepEqual(p.variants, ['service']);
    const w = orgG.A12_WEDGES.find((q) => q.id === 'paR')!;
    assert.ok(w.p.x > A12_LESSON.zones.find((q) => q.id === 'org.div')!.start.p.x);
  });
});

describe('Lab 3 lessons: valid, clear and inside their zones', () => {
  for (const lesson of UNDER_TEST) {
    it(`${lesson.id}: validates`, () => assert.deepEqual(validateLesson(lesson, MIC_TYPES), []));
    it(`${lesson.id}: every zone’s start is clear, inside its zone and inside its drawn band, in every variant it allows`, () => {
      for (const z of lesson.zones) {
        const types = z.requires?.micTypeIds ?? lesson.micTypeIds;
        const t = MIC_TYPES[types[0]];
        const variants = z.requires?.variant ? [z.requires.variant] : z.requires?.variants ?? lesson.model.variants.map((v) => v.id);
        for (const v of variants) {
          const scene = compileScene(lesson.model, v);
          assert.equal(checkAssembly(scene, z.start, micBodyOf(t)), null, `${z.id} collides in ${v}`);
          assert.ok(inZone(z, { scene, surfaces: lesson.model.surfaces, lines: lesson.model.lines, variant: v, micTypeId: t.id, mount: t.mount }, z.start), `${z.id} start not in zone (${v})`);
        }
        // A ring round a speaker's axis (the amp's zones, the speaker module's
        // own drawing) is cut by each view's plane: its start sits off it.
        if (z.radial && (z.radial.min ?? 0) > 0) continue;
        for (const view of ['side', 'top'] as const) {
          const polys = z.draw?.[view];
          if (!polys) continue;
          const u = z.start.p.x;
          const w = view === 'side' ? z.start.p.y : z.start.p.z;
          assert.ok(polys.some((q) => inPoly(q.poly, u, w)), `${z.id} start outside its ${view} drawing`);
        }
      }
    });
    it(`${lesson.id}: no keep-out contains a zone’s start`, () => {
      for (const z of lesson.zones) {
        const types = z.requires?.micTypeIds ?? lesson.micTypeIds;
        const v = z.requires?.variant ?? lesson.model.defaultVariant;
        const scene = compileScene(lesson.model, v);
        const hit = checkAssembly(scene, z.start, { length: 1, radius: 1, mount: 'surface' });
        assert.equal(hit, null, `${z.id} (${types[0]})`);
      }
    });
    it(`${lesson.id}: the checks follow the item-writing rules`, () => itemRules(lesson));
    it(`${lesson.id}: no research name reaches the learner`, () => {
      for (const s of learnerStrings(lesson)) {
        assert.doesNotMatch(s, RESEARCH_NAMES, s.slice(0, 80));
        assert.doesNotMatch(s, LAB3_NAMES, s.slice(0, 80));
      }
    });
    it(`${lesson.id}: the quick check has 6 foundation items, at least one critical`, () => {
      assert.equal(lesson.diagnostic.length, 6);
      assert.ok(lesson.diagnostic.some((d) => d.critical));
      for (const d of lesson.diagnostic) assert.ok(['instrument', 'sound', 'setting'].includes(d.covers), d.id);
    });
  }
});

describe('Lab 3 registration and the family files', () => {
  it('Lab 3 is listed (it has ready lessons) with its own blurb; each lesson has its own registry line', () => {
    assert.ok(readyLabs().some((l: { id: string }) => l.id === 'winds'));
    const reg = read(`${MIKING}/data/registry.ts`);
    for (const l of UNDER_TEST) {
      assert.equal(LESSONS.find((m: { id: string }) => m.id === l.id)?.labId, 'winds');
      assert.ok(lessonById(l.id), l.id);
      assert.equal(reg.split('\n').filter((line) => line.includes(`id: '${l.id}'`)).length, 1);
    }
    assert.match(reg, /id: 'winds'[^\n]*blurb: '[^']{40,}'/);
  });
  it('nothing in the free-reed or organ files loops (D8)', () => {
    const dirs = [`${MIKING}/lessons/shared/freereed`, `${MIKING}/lessons/shared/organ`, `${MIKING}/lessons/a10Harmonica`, `${MIKING}/lessons/a11Accordion`, `${MIKING}/lessons/a12Organ`];
    for (const d of dirs) {
      if (!existsSync(join(ROOT, d))) continue;
      for (const f of readdirSync(join(ROOT, d))) {
        const s = read(`${d}/${f}`).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
        assert.doesNotMatch(s, /withRepeat|useFrameCallback|setInterval/, `${d}/${f}`);
      }
    }
  });
  it('the organ links to the speaker module for the electronic organ and its rotary speaker', () => {
    assert.match(read(`${MIKING}/lessons/a12Organ/pages.tsx`), /<SpkLink text=/);
  });
  it('the harmonica links to the speaker module (no copy of it)', () => {
    const s = read(`${MIKING}/lessons/a10Harmonica/pages.tsx`);
    assert.match(s, /<SpkLink \/>/);
    assert.match(read(`${MIKING}/lessons/a10Harmonica/geometry.ts`), /SPK_FRONT_ZONES/);
  });
});

void surfaceDistance;
