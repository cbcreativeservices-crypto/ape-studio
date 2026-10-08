/**
 * Miking Lab 6, group 5 — SYSTEMS, PRODUCTS AND SENSORS (F14, F15, F16) and
 * the shared pieces group 5 built (lessons/shared/measure/: venue.ts,
 * systems.ts, claimLadder.ts, exclusion.ts, arrays.ts, chainsSystems.ts).
 * Real relationships, not the implementation run twice:
 *
 *   • every lesson validates; its starts sit inside their zones, clear of
 *     every part; its starting setups are the roles its proposal names;
 *   • F14: seat receivers at 1.2 m seated / 1.7 m standing (MEYER-MAPP);
 *     the axis and off-axis points share one radius; the near-field point
 *     never touches the cone; a tap before the processor adds its latency;
 *     a delay finder takes the strongest arrival — with a second source on,
 *     not the first; a window of T resolves about 1 ÷ T; aligning the fill
 *     at one seat leaves a gap at the next;
 *   • F15: every position is outside the exclusion zone and the airflow, at
 *     the same radius; the keep-out solids stop a mic inside them;
 *   • F16: the baseline Δt is the ensemble family's dtLR (one function); the
 *     mirror source gives the same Δt; λ/2 through the calculator's speed of
 *     sound; the probe reads cos θ; the air/water references differ by 26 dB
 *     and nothing teaches subtracting them;
 *   • the chain and ladder data validate, and the safety refusals are exact.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { itemRules } from './_mikingItemRules.ts';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { MIC_TYPES } = R(await import('../src/screens/lab/miking/data/micTypes.ts'));
const { LESSONS } = R(await import('../src/screens/lab/miking/data/registry.ts'));
const { validateLesson } = R(await import('../src/screens/lab/miking/engine/model/validate.ts'));
const { startingSetups } = R(await import('../src/screens/lab/miking/engine/setups.ts'));
const { compileScene, checkAssembly } = R(await import('../src/screens/lab/miking/engine/geometry/collision.ts'));
const { micBodyOf } = R(await import('../src/screens/lab/miking/engine/model/validate.ts'));
const { lineDistance, surfaceDistance } = R(await import('../src/screens/lab/miking/engine/geometry/zones.ts'));
const chainModel = R(await import('../src/screens/lab/miking/engine/chain/chainModel.ts'));
const chains = R(await import('../src/screens/lab/miking/lessons/shared/measure/chainsSystems.ts'));
const venue = R(await import('../src/screens/lab/miking/lessons/shared/measure/venue.ts'));
const systems = R(await import('../src/screens/lab/miking/lessons/shared/measure/systems.ts'));
const tools = R(await import('../src/screens/lab/miking/lessons/shared/measure/SystemTools.tsx'));
const { C20 } = R(await import('../src/screens/lab/miking/engine/physics/twoMic.ts'));
const spec = R(await import('../src/screens/lab/miking/lessons/shared/measure/measureSpec.ts'));
const f14geo = R(await import('../src/screens/lab/miking/lessons/f14SystemMeasurement/geometry.ts'));
const f14model = R(await import('../src/screens/lab/miking/lessons/f14SystemMeasurement/model.ts'));

const exclusion = R(await import('../src/screens/lab/miking/lessons/shared/measure/exclusion.ts'));
const ladderModel = R(await import('../src/screens/lab/miking/lessons/shared/measure/claimLadder.ts'));
const cycle = R(await import('../src/screens/lab/miking/lessons/shared/measure/cycle.ts'));
const { leqOf } = R(await import('../src/screens/lab/miking/lessons/shared/measure/calcBridge.ts'));
const f15geo = R(await import('../src/screens/lab/miking/lessons/f15Machinery/geometry.ts'));
const f15ladder = R(await import('../src/screens/lab/miking/lessons/f15Machinery/ladder.ts'));
const keepOut = R(await import('../src/screens/lab/miking/lessons/f15Machinery/KeepOutStep.tsx'));

const arrays = R(await import('../src/screens/lab/miking/lessons/shared/measure/arrays.ts'));
const { dtLR } = R(await import('../src/screens/lab/miking/lessons/shared/ensemble/stereoArray.ts'));
const { speedOfSoundAir } = R(await import('../src/screens/lab/calc/calcUnits.ts'));
const f16geo = R(await import('../src/screens/lab/miking/lessons/f16ScientificArrays/geometry.ts'));
const f16model = R(await import('../src/screens/lab/miking/lessons/f16ScientificArrays/model.ts'));
const f16ladder = R(await import('../src/screens/lab/miking/lessons/f16ScientificArrays/ladder.ts'));

const IDS = ['F14', 'F15', 'F16'] as const;
const dist = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

describe('Lab 6 group 5: the lessons are served and valid', () => {
  for (const id of IDS) {
    it(`${id}: registered under the field lab, ready, and validateLesson finds nothing`, () => {
      const meta = LESSONS.find((l: { id: string }) => l.id === id);
      assert.ok(meta && meta.labId === 'field' && meta.status === 'ready', id);
      const lesson = lessonById(id);
      assert.ok(lesson, id);
      assert.deepEqual(validateLesson(lesson, MIC_TYPES), []);
    });
    it(`${id}: the quick check is six items, at least one critical, all from the foundations`, () => {
      const l = lessonById(id)!;
      assert.equal(l.diagnostic.length, 6);
      assert.ok(l.diagnostic.some((d: { critical?: boolean }) => d.critical));
      for (const d of l.diagnostic) assert.ok(['instrument', 'sound', 'setting', 'meet', 'setups'].includes(d.covers), d.id);
    });
    it(`${id}: the items follow the writing rules (no length cue, no absolute distractors, a why for each)`, () => {
      itemRules(lessonById(id)!);
    });
  }
});

describe('F14: the bench, the venue and the studio', () => {
  const L = lessonById('F14')!;
  const z = (id: string) => L.zones.find((q: { id: string }) => q.id === id)!;
  it('seat receivers sit at a seated ear height (1.2 m), the standing one at 1.7 m (MEYER-MAPP)', () => {
    for (const q of L.zones.filter((q: { id: string }) => /^(vn|st)\./.test(q.id))) {
      const h = lineDistance(L.model.lines, 'floor', q.start);
      const want = q.id === 'vn.stand' ? spec.LISTENER_HEIGHT.standing.mm : spec.LISTENER_HEIGHT.seated.mm;
      assert.ok(Math.abs(h - want) < 1, `${q.id}: ${h}`);
    }
  });
  it('the axis and the off-axis point share one radius; the angle between them is 30°', () => {
    const a = z('ls.axis').start.p;
    const o = z('ls.off').start.p;
    assert.ok(Math.abs(dist(a, f14geo.REF14) - dist(o, f14geo.REF14)) < 1);
    const ang = (Math.acos(((a.x - f14geo.REF14.x) * (o.x - f14geo.REF14.x) + (a.z - f14geo.REF14.z) * (o.z - f14geo.REF14.z)) / (dist(a, f14geo.REF14) * dist(o, f14geo.REF14))) * 180) / Math.PI;
    assert.ok(Math.abs(ang - 30) < 0.01, `${ang}`);
  });
  it('the near-field point is in front of the woofer, clear of the cabinet, never touching the cone', () => {
    const n = z('ls.near').start;
    const d = surfaceDistance(L.model.surfaces, 'woofer', n);
    assert.ok(d >= 20 && d <= 45, `${d}`);
    const scene = compileScene(L.model, 'bench');
    assert.equal(checkAssembly(scene, n, micBodyOf(MIC_TYPES.measQuarter)), null);
    // A mic pushed onto the baffle is stopped.
    assert.ok(checkAssembly(scene, { ...n, p: { ...n.p, x: 5 } }, micBodyOf(MIC_TYPES.measQuarter)));
  });
  it('the setups: bench axis + off axis; venue mid, front + rear, the overlap as CLOSE · LIVE; studio listening + beside it', () => {
    const bench = startingSetups(L, 'bench', MIC_TYPES);
    assert.equal(bench[0].mics[0].zoneId, 'ls.axis');
    assert.deepEqual(bench.find((s: { role: string }) => s.role === 'pair').mics.map((m: { zoneId: string }) => m.zoneId), ['ls.axis', 'ls.off']);
    assert.ok(!bench.some((s: { role: string }) => s.role === 'close'), 'the near-field point is not a stage mic');
    assert.ok(bench.some((s: { role: string; mics: { zoneId: string }[] }) => s.role === 'more' && s.mics[0].zoneId === 'ls.near'));
    const ven = startingSetups(L, 'venue', MIC_TYPES);
    assert.equal(ven[0].mics[0].zoneId, 'vn.mid');
    assert.deepEqual(ven.find((s: { role: string }) => s.role === 'pair').mics.map((m: { zoneId: string }) => m.zoneId), ['vn.front', 'vn.rear']);
    assert.equal(ven.find((s: { role: string }) => s.role === 'close').mics[0].zoneId, 'vn.overlap');
    const st = startingSetups(L, 'studio', MIC_TYPES);
    assert.equal(st[0].mics[0].zoneId, 'st.listen');
    assert.deepEqual(st.find((s: { role: string }) => s.role === 'pair').mics.map((m: { zoneId: string }) => m.zoneId), ['st.listen', 'st.near']);
  });
  it('the studio listening position is an equilateral triangle with the monitors', () => {
    const lp = f14geo.LISTEN;
    assert.ok(Math.abs(dist(lp, f14geo.MON_L) - dist(f14geo.MON_L, f14geo.MON_R)) < 1);
    assert.ok(Math.abs(dist(lp, f14geo.MON_R) - dist(f14geo.MON_L, f14geo.MON_R)) < 1);
  });
  it('every venue seat start is on the audience floor, in front of the stage, clear of the walls', () => {
    for (const q of L.zones.filter((q: { id: string }) => q.id.startsWith('vn.'))) {
      assert.ok(q.start.p.x > 0 && q.start.p.x < venue.VENUE.room.rear - 200, q.id);
      assert.ok(Math.abs(q.start.p.z) < venue.VENUE.room.half - 200, q.id);
    }
    assert.ok(f14model.F14_START.stand.x >= venue.VENUE.standing.x0 && f14model.F14_START.stand.x <= venue.VENUE.standing.x1);
  });
});

describe('the system physics (F14; systems.ts, venue.ts)', () => {
  it('a tap before the processor adds its latency; after it, the acoustic path alone (the calculator’s c)', () => {
    const mm = 5000;
    assert.ok(Math.abs(systems.referenceDelay('post', mm) - mm / C20) < 1e-9);
    assert.ok(Math.abs(systems.referenceDelay('pre', mm) - systems.referenceDelay('post', mm) - systems.EXAMPLE_DSP_MS) < 1e-9);
  });
  it('a delay finder takes the strongest arrival; with the main left on, that is not the fill’s first arrival', () => {
    const alone = systems.pickArrival(tools.timingArrivals('alone', 'post'));
    assert.equal(alone.trap, false);
    assert.equal(alone.first.id, 'fill');
    const both = systems.pickArrival(tools.timingArrivals('both', 'post'));
    assert.equal(both.trap, true);
    assert.equal(both.finder.id, 'main');
    assert.equal(both.first.id, 'fill');
    assert.ok(both.first.ms < both.finder.ms, 'the nearer fill arrives first');
  });
  it('a window of T resolves about 1 ÷ T; a short one keeps the floor bounce out, a long one lets every reflection in', () => {
    assert.equal(systems.windowResolutionHz(5), 200);
    assert.ok(Number.isNaN(systems.windowResolutionHz(0)));
    const arr = tools.benchArrivals();
    const direct = arr[0];
    assert.equal(direct.id, 'direct');
    assert.ok(Math.abs(direct.ms - 2000 / C20) < 1e-9);
    // The floor bounce: the source's image 1.2 m below the floor, the mic 1.2 m above it.
    assert.ok(Math.abs(arr[1].ms - Math.hypot(2000, 2400) / C20) < 1e-9);
    assert.equal(systems.inWindow(arr, direct.ms, 3).length, 1);
    assert.equal(systems.inWindow(arr, direct.ms, 50).length, arr.length);
  });
  it('the overlap: aligned at one seat, a gap again at the next; the first dip is 1 ÷ (2Δt)', () => {
    const a = venue.seatPoint(venue.VENUE.rows[1], -900);
    const b = venue.seatPoint(venue.VENUE.rows[2], -2700);
    const d = venue.alignAt(a);
    assert.ok(d > 0, 'the fill is nearer: it is delayed to meet the main');
    assert.ok(Math.abs(venue.overlapAt(a, d).dtMs) < 1e-9);
    assert.equal(venue.overlapAt(a, d).firstNotchHz, null);
    const off = venue.overlapAt(b, d);
    assert.ok(Math.abs(off.dtMs) > 0.1, `${off.dtMs}`);
    assert.ok(Math.abs(off.firstNotchHz! - 1000 / (2 * Math.abs(off.dtMs))) < 1e-6);
  });
});

describe('F15: the guarded fan, its keep-outs and its positions', () => {
  const L = lessonById('F15')!;
  const E = f15geo.EXCL;
  it('every starting point is outside the exclusion zone and the airflow', () => {
    for (const q of L.zones) assert.equal(exclusion.exclusionHit(E, q.start.p), null, q.id);
  });
  it('A, B and C sit on one radius (1 m) at a seated ear height (1.2 m); the detail mic is outside the zone', () => {
    for (const id of ['mp.A', 'mp.B', 'mp.C']) {
      const q = L.zones.find((z: { id: string }) => z.id === id)!;
      assert.ok(Math.abs(surfaceDistance(L.model.surfaces, 'centre', q.start) - 1000) < 1, id);
      assert.ok(Math.abs(lineDistance(L.model.lines, 'floor', q.start) - spec.LISTENER_HEIGHT.seated.mm) < 1, id);
    }
    const d = L.zones.find((z: { id: string }) => z.id === 'mp.detail')!.start.p;
    assert.ok(Math.hypot(d.x - E.hub.x, d.z - E.hub.z) > exclusion.zoneRadius(E));
  });
  it('the zone is the guard’s reach plus 0.3 m; the airflow cone widens at 15° a side', () => {
    assert.equal(exclusion.zoneRadius(E), Math.max(E.guardR, E.back, E.front) + 300);
    assert.ok(Math.abs(exclusion.flowRadius(E, 1000) - (E.guardR + 1000 * Math.tan((15 * Math.PI) / 180))) < 1e-9);
    // On the airflow's axis, 1 m out: in the air. Beside it: clear. Next to the guard: in the zone.
    assert.equal(exclusion.exclusionHit(E, { x: 1000, y: E.hub.y, z: 0 }), 'airflow');
    assert.equal(exclusion.exclusionHit(E, { x: 1000, y: E.hub.y, z: 900 }), null);
    assert.equal(exclusion.exclusionHit(E, { x: 0, y: E.hub.y, z: 300 }), 'zone');
  });
  it('the engine stops a mic in the zone and in the airflow (the keep-outs are solids)', () => {
    const scene = compileScene(L.model, 'fan');
    const body = micBodyOf(MIC_TYPES.measFF);
    const pose = (p: { x: number; y: number; z: number }) => ({ p, az: 180, el: 0 });
    assert.ok(checkAssembly(scene, pose({ x: 1000, y: E.hub.y, z: 0 }), body));
    assert.ok(checkAssembly(scene, pose({ x: 300, y: -500, z: 250 }), body));
  });
  it('the keep-out page’s probe: inside, in the air, clear — as the model says', () => {
    assert.equal(exclusion.exclusionHit(E, keepOut.probeAt(400, 20)), 'zone');
    assert.equal(exclusion.exclusionHit(E, keepOut.probeAt(1200, 0)), 'airflow');
    assert.equal(exclusion.exclusionHit(E, keepOut.probeAt(1000, 45)), null);
  });
  it('the setups: A alone; A and B; the detail mic as CLOSE · LIVE; the far perspective as FARTHER BACK; C another start', () => {
    const s = startingSetups(L, 'fan', MIC_TYPES);
    assert.equal(s[0].mics[0].zoneId, 'mp.A');
    assert.deepEqual(s.find((x: { role: string }) => x.role === 'pair').mics.map((m: { zoneId: string }) => m.zoneId), ['mp.A', 'mp.B']);
    assert.equal(s.find((x: { role: string }) => x.role === 'close').mics[0].zoneId, 'mp.detail');
    assert.equal(s.find((x: { role: string }) => x.role === 'distant').mics[0].zoneId, 'mp.far');
    assert.ok(s.some((x: { role: string; mics: { zoneId: string }[] }) => x.role === 'more' && x.mics[0].zoneId === 'mp.C'));
  });
});

describe('the cycle strip and the claim ladder (F15)', () => {
  const lv = cycle.makeCycle();
  it('deterministic, one cycle at the strip rate; the steady run sits above the background', () => {
    assert.deepEqual(cycle.makeCycle().slice(0, 40), lv.slice(0, 40));
    assert.equal(lv.length, cycle.CYCLE.seconds * cycle.CYCLE_HZ);
    const at = (t: number) => lv[Math.round(t * cycle.CYCLE_HZ)];
    assert.ok(at(30) > at(2) + 10);
  });
  it('a short sample can miss every rattle; the whole cycle catches them all and spans every phase', () => {
    assert.equal(cycle.sampleOf(14, 5).rattles, 0);
    const whole = cycle.sampleOf(0, cycle.CYCLE.seconds);
    assert.equal(whole.rattles, cycle.CYCLE.rattles.length);
    assert.equal(whole.whole, true);
    assert.deepEqual([...whole.phases].sort(), ['off', 'start', 'steady', 'stop']);
  });
  it('the sample’s energy average goes through the SPL calculator (energy, never the mean of the dB)', () => {
    const slice = lv.slice(0, cycle.CYCLE.seconds * cycle.CYCLE_HZ);
    const e = 10 * Math.log10(slice.reduce((a: number, x: number) => a + 10 ** (x / 10), 0) / slice.length);
    const leq = leqOf(slice, 1 / cycle.CYCLE_HZ);
    assert.ok(leq !== null && Math.abs(leq - e) < 1e-6, `${leq} vs ${e}`);
  });
  it('the ladder’s data validate; each setup supports the claims at or below its rung, and the dose claim needs another method', () => {
    const Ld = f15ladder.F15_LADDER;
    assert.deepEqual(ladderModel.validateLadder(Ld), []);
    assert.equal(ladderModel.supports(Ld, 'fixed', 'blade'), true);
    assert.equal(ladderModel.supports(Ld, 'fixed', 'spl'), false);
    assert.equal(ladderModel.supports(Ld, 'survey', 'bright'), true);
    for (const s of Ld.setups) assert.equal(ladderModel.supports(Ld, s.id, 'dose'), false, s.id);
    const right = Object.fromEntries(Ld.claims.map((c: { id: string }) => [c.id, ladderModel.supports(Ld, 'meter', c.id) ? 'yes' : 'no']));
    assert.equal(ladderModel.gradeLadder(Ld, 'meter', right).done, true);
  });
  it('the vibration channel by hand on a running device is refused, as a safety refusal', () => {
    const C = chains.PRODUCT_CHAIN;
    for (const b of C.briefs) assert.ok(chainModel.checkChain(C, b, { air: 'meas', vib: 'hand', gain: 'fixed', claim: 'relative' }).refused.some((r: { safety?: boolean }) => r.safety));
  });
});

describe('F16: the baseline, the mirror, λ/2, the probe and the units', () => {
  const L = lessonById('F16')!;
  const caps = arrays.baselinePair(f16geo.BASE.b);
  it('the elements start on the baseline axis at their logged coordinates, 1.2 m above the floor', () => {
    for (const q of L.zones.filter((z: { id: string }) => z.id !== 'ar.back')) assert.ok(lineDistance(L.model.lines, 'baseline', q.start) < 1, q.id);
    for (const q of L.zones) assert.ok(Math.abs(lineDistance(L.model.lines, 'floor', q.start) - 1200) < 1, q.id);
    assert.equal(dist(L.zones.find((z: { id: string }) => z.id === 'ar.L')!.start.p, L.zones.find((z: { id: string }) => z.id === 'ar.R')!.start.p), f16geo.BASE.b);
  });
  it('the baseline’s Δt is the ensemble family’s dtLR, path ÷ the calculator’s c', () => {
    const S = f16geo.SIDE_PT;
    const want = (dist(caps[1].p, S) - dist(caps[0].p, S)) / speedOfSoundAir(20);
    assert.ok(Math.abs(arrays.baselineDt(caps, S) - want) < 1e-9);
    assert.equal(arrays.baselineDt(caps, S), dtLR(caps, S));
    assert.equal(arrays.firstHeard(caps, f16geo.CENTRE_PT), 'both');
    assert.equal(arrays.firstHeard(caps, S), 'R');
  });
  it('the front/back mirror: the side point and its mirror behind give the same Δt; a third element off the line tells them apart', () => {
    const S = f16geo.SIDE_PT;
    const M = arrays.mirrorOf(S);
    assert.ok(Math.abs(arrays.baselineDt(caps, S) - arrays.baselineDt(caps, M)) < 1e-12);
    const B = f16model.F16_START.back;
    assert.ok(dist(S, B) > dist(S, caps[1].p), 'from in front, the element behind hears it after R');
    assert.ok(dist(M, B) < dist(M, caps[1].p), 'from behind, it hears it before R');
  });
  it('a wider baseline gives a larger time difference for the same source', () => {
    const wide = arrays.baselinePair(f16geo.BASE.wide);
    assert.ok(Math.abs(arrays.baselineDt(wide, f16geo.SIDE_PT)) > Math.abs(arrays.baselineDt(caps, f16geo.SIDE_PT)));
  });
  it('λ/2: f_max = c ÷ 2d through the calculator; 60 mm keeps clear to about 2.9 kHz', () => {
    assert.ok(Math.abs(arrays.lambdaHalf(60) - speedOfSoundAir(20) / 0.12) < 1e-9);
    assert.ok(Math.abs(arrays.lambdaHalf(60) - 2860) < 5);
    assert.ok(Math.abs(arrays.spacingFor(arrays.lambdaHalf(37)) - 37) < 1e-9);
    assert.ok(Number.isNaN(arrays.lambdaHalf(0)));
  });
  it('the probe reads cos θ: full along the normal, about zero across it, negative against it', () => {
    assert.equal(arrays.axialShare(0), 1);
    assert.equal(arrays.axialShare(90), 0);
    assert.ok(Math.abs(arrays.axialShare(180) + 1) < 1e-12);
    assert.deepEqual([...arrays.SPACERS_MM], [12, 25, 50]);
  });
  it('the units: the references are 26 dB apart and equal intensities about 61.5 dB — and nothing teaches subtracting 26 dB', () => {
    assert.ok(Math.abs(arrays.WATER_AIR.refGapDb - 26.02) < 0.01);
    assert.equal(arrays.WATER_AIR.equalIntensityDb, 61.5);
    const items = [...L.scenarios, ...L.symptoms, ...L.diagnostic];
    for (const it2 of items) assert.doesNotMatch(it2.correct, /subtract/i, it2.id);
  });
  it('Nyquist: a band is kept only below half the sample rate', () => {
    assert.equal(arrays.nyquistOk(48000, 24000), false);
    assert.equal(arrays.nyquistOk(192000, 60000), true);
  });
  it('the setups: element L; the baseline L + R; the wider pair and the third element as other starts', () => {
    const s = startingSetups(L, 'room', MIC_TYPES);
    assert.equal(s[0].mics[0].zoneId, 'ar.L');
    assert.deepEqual(s.find((x: { role: string }) => x.role === 'pair').mics.map((m: { zoneId: string }) => m.zoneId), ['ar.L', 'ar.R']);
    assert.ok(!s.some((x: { role: string }) => x.role === 'close' || x.role === 'distant'));
    assert.ok(s.some((x: { role: string; mics: { zoneId: string }[] }) => x.role === 'more' && x.mics.length === 2 && x.mics[0].zoneId === 'ar.L2'));
    assert.ok(s.some((x: { role: string; mics: { zoneId: string }[] }) => x.role === 'more' && x.mics[0].zoneId === 'ar.back'));
  });
  it('the ladder’s data validate; one baseline supports an order, not a direction; a hot spot as a fault is off the ladder', () => {
    const Ld = f16ladder.F16_LADDER;
    assert.deepEqual(ladderModel.validateLadder(Ld), []);
    assert.equal(ladderModel.supports(Ld, 'pair', 'first'), true);
    assert.equal(ladderModel.supports(Ld, 'pair', 'angle'), false);
    assert.equal(ladderModel.supports(Ld, 'two', 'first'), false);
    for (const s of Ld.setups) assert.equal(ladderModel.supports(Ld, s.id, 'fault'), false, s.id);
  });
  it('the array chain: two recorders and auto-alignment do not suit an arrival order', () => {
    const C = chains.ARRAY_CHAIN;
    const b = C.briefs.find((x: { id: string }) => x.id === 'order');
    assert.equal(chainModel.checkChain(C, b, { elements: 'matched', clock: 'one', geometry: 'logged', processing: 'raw' }).pass, true);
    assert.equal(chainModel.checkChain(C, b, { elements: 'matched', clock: 'two', geometry: 'logged', processing: 'raw' }).pass, false);
    assert.equal(chainModel.checkChain(C, b, { elements: 'matched', clock: 'one', geometry: 'logged', processing: 'aligned' }).pass, false);
  });
});

describe('the chains of group 5 (chainsSystems.ts)', () => {
  for (const name of ['SYSTEM_CHAIN', 'PRODUCT_CHAIN', 'ARRAY_CHAIN'] as const) {
    it(`${name}: every rule and brief names real parts; every brief can pass`, () => {
      assert.deepEqual(chainModel.validateChain(chains[name]), []);
    });
  }
  it('the measurement mic routed to the PA is refused in every brief, as a safety refusal', () => {
    const C = chains.SYSTEM_CHAIN;
    for (const b of C.briefs) {
      const c = chainModel.checkChain(C, b, { reference: 'pre', mic: 'meas', route: 'console', processing: 'fixed' });
      assert.ok(c.refused.some((r: { safety?: boolean; reason: string }) => r.safety && /never returns to the live PA/.test(r.reason)));
    }
  });
  it('the tap answers the question: pre for the whole path, post for what the processor works with', () => {
    const C = chains.SYSTEM_CHAIN;
    const whole = C.briefs.find((b: { id: string }) => b.id === 'whole');
    const speaker = C.briefs.find((b: { id: string }) => b.id === 'speaker');
    const base = { mic: 'meas', route: 'analyzer', processing: 'fixed' };
    assert.equal(chainModel.checkChain(C, whole, { ...base, reference: 'pre' }).pass, true);
    assert.equal(chainModel.checkChain(C, whole, { ...base, reference: 'post' }).pass, false);
    assert.equal(chainModel.checkChain(C, speaker, { ...base, reference: 'post' }).pass, true);
    assert.equal(chainModel.checkChain(C, speaker, { ...base, reference: 'none' }).pass, false);
  });
});
