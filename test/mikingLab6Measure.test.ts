/**
 * Miking Lab 6, group 4 — the MEASUREMENT CORE (F11, F12, F13) and the
 * shared measurement family (lessons/shared/measure/, engine/chain/,
 * lessons/shared/field/sceneFrame.ts). Real relationships, not the
 * implementation run twice:
 *
 *   • every lesson validates; its zones' starts sit inside their zones,
 *     clear of every part (validateLesson), and its starting setups are the
 *     roles its geometry proposal names;
 *   • the chain rack's data: every refusal and brief names real parts, every
 *     brief can pass, and the power-path refusals are the ones F11 teaches;
 *   • the decay reader: T20 / T30 / EDT recover a straight decay's T60, and
 *     a short range is refused at 35 / 45 dB (RA-T, CONFIRMED);
 *   • the level history: LAeq through the SPL calculator is the energy
 *     average (never the mean of the dB), L10 ≥ L50 ≥ L90, LAFmax ≥ L10;
 *   • background subtraction is an energy subtraction and refuses inside
 *     the method's limit (default 3 dB);
 *   • the calibrator: 94 dB is 1.0024 Pa through the shared reference; the
 *     drift and seat stories end where the lesson says;
 *   • the reflection off a person: farther = later and weaker, at the
 *     calculator's speed of sound.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { MIC_TYPES } = R(await import('../src/screens/lab/miking/data/micTypes.ts'));
const { LESSONS } = R(await import('../src/screens/lab/miking/data/registry.ts'));
const { validateLesson } = R(await import('../src/screens/lab/miking/engine/model/validate.ts'));
const { startingSetups } = R(await import('../src/screens/lab/miking/engine/setups.ts'));
const chainModel = R(await import('../src/screens/lab/miking/engine/chain/chainModel.ts'));
const chains = R(await import('../src/screens/lab/miking/lessons/shared/measure/chains.ts'));
const decay = R(await import('../src/screens/lab/miking/lessons/shared/measure/decay.ts'));
const hist = R(await import('../src/screens/lab/miking/lessons/shared/measure/levelHistory.ts'));
const bg = R(await import('../src/screens/lab/miking/lessons/shared/measure/background.ts'));
const cal = R(await import('../src/screens/lab/miking/lessons/shared/measure/calibrator.ts'));
const label = R(await import('../src/screens/lab/miking/lessons/shared/measure/resultLabel.ts'));
const spec = R(await import('../src/screens/lab/miking/lessons/shared/measure/measureSpec.ts'));
const keep = R(await import('../src/screens/lab/miking/lessons/shared/measure/KeepAway.tsx'));
const field = R(await import('../src/screens/lab/miking/lessons/shared/measure/FieldScene.tsx'));
const parts = R(await import('../src/screens/lab/miking/lessons/shared/measure/partArt.tsx'));
const frame = R(await import('../src/screens/lab/miking/lessons/shared/field/sceneFrame.ts'));
const { C20 } = R(await import('../src/screens/lab/miking/engine/physics/twoMic.ts'));
const { P_REF_PA, speedOfSoundAir } = R(await import('../src/screens/lab/calc/calcUnits.ts'));
const f11geo = R(await import('../src/screens/lab/miking/lessons/f11MeasurementMics/geometry.ts'));
const f12geo = R(await import('../src/screens/lab/miking/lessons/f12SoundLevel/geometry.ts'));
const f13geo = R(await import('../src/screens/lab/miking/lessons/f13RoomAcoustics/geometry.ts'));
const sampling = R(await import('../src/screens/lab/miking/lessons/shared/measure/sampling.ts'));
const { lineDistance, surfaceDistance } = R(await import('../src/screens/lab/miking/engine/geometry/zones.ts'));

describe('F12: the site, the method’s height and the facade positions (FHWA-FG, OSHA-ELEC)', () => {
  const L = lessonById('F12')!;
  const z = (id: string) => L.zones.find((q: { id: string }) => q.id === id)!;
  it('every receiver starts 1.5 m (5 ft) above the ground', () => {
    for (const q of L.zones) assert.ok(Math.abs(lineDistance(L.model.lines, 'ground', q.start) - 1500) < 1, q.id);
  });
  it('receiver B starts 2 m (6.6 ft) out from the facade midpoint; the wall position close but not touching', () => {
    assert.ok(Math.abs(surfaceDistance(L.model.surfaces, 'facade', z('sl.facade').start) - 2000) < 1);
    assert.equal(z('sl.facade').start.p.z, f12geo.FACADE_MID_Z);
    const d = surfaceDistance(L.model.surfaces, 'facade', z('sl.wall').start);
    assert.ok(d > 0 && d < 300, `${d}`);
  });
  it('no receiver is in the road, and every one is more than 3 m (10 ft) from the power line', () => {
    for (const q of L.zones) {
      assert.ok(q.start.p.x < f12geo.ROAD.x0, q.id);
      const dLine = Math.hypot(q.start.p.x - f12geo.POWER.x, q.start.p.y + f12geo.POWER.h);
      assert.ok(dLine > f12geo.POWER.keep, `${q.id}: ${dLine}`);
    }
    assert.equal(f12geo.POWER.keep, 3000);
  });
  it('the setups: receiver A alone, then A and B on one clock; the wall position is another start', () => {
    const s = startingSetups(L, 'site', MIC_TYPES);
    assert.equal(s[0].mics[0].zoneId, 'sl.open');
    assert.deepEqual(s.find((x: { role: string }) => x.role === 'pair').mics.map((m: { zoneId: string }) => m.zoneId), ['sl.open', 'sl.facade']);
    assert.ok(s.some((x: { role: string; mics: { zoneId: string }[] }) => x.role === 'more' && x.mics[0].zoneId === 'sl.wall'));
  });
});

describe('F13: the room, seated receivers and the receiver set (MEYER-MAPP)', () => {
  const L = lessonById('F13')!;
  it('every receiver starts at a seated ear height, 1.2 m above the floor', () => {
    for (const q of L.zones) assert.ok(Math.abs(lineDistance(L.model.lines, 'floor', q.start) - f13geo.EAR) < 1, q.id);
  });
  it('room-only seats are measured from the omni source, the PA seats from the PA', () => {
    for (const q of L.zones) assert.equal(q.refSurface, q.requires.variant === 'pa' ? 'pa' : 'src', q.id);
  });
  it('each variant has a one-mic setup and a two-seat pair (only the receiver moves)', () => {
    for (const v of ['room', 'pa']) {
      const s = startingSetups(L, v, MIC_TYPES);
      assert.equal(s[0].role, 'one', v);
      const pair = s.find((x: { role: string }) => x.role === 'pair');
      assert.ok(pair, v);
      assert.notDeepEqual(pair.mics[0].pose.p, pair.mics[1].pose.p);
    }
  });
  it('a receiver set: one centre reading fails; near + far + a side seat passes; a corner is flagged', () => {
    assert.equal(sampling.judgeSampling(['centre']).ok, false);
    assert.equal(sampling.judgeSampling(['mid', 'rear', 'side']).ok, true);
    assert.equal(sampling.judgeSampling(['mid', 'rear', 'side', 'corner']).ok, false);
    assert.equal(sampling.judgeSampling(['front', 'mid']).ok, false);
  });
});

const IDS = ['F11', 'F12', 'F13'] as const;

describe('Lab 6 group 4: the lessons are served and valid', () => {
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
  }
});

describe('F11: the bench, its starting points and its setups', () => {
  const L = lessonById('F11')!;
  it('the operator stands outside the keep-away ring of every starting point', () => {
    for (const z of L.zones) {
      const d = Math.hypot(z.start.p.x - f11geo.F11_OP.x, z.start.p.z - f11geo.F11_OP.z);
      assert.ok(d >= spec.MEAS_DIMS.keepAway.mm, `${z.id}: ${d.toFixed(0)} mm`);
    }
  });
  it('the setups are the proposal’s: one mic on the axis, two channels, the random-incidence mic out in the room', () => {
    const s = startingSetups(L, 'bench', MIC_TYPES);
    assert.equal(s[0].role, 'one');
    assert.equal(s[0].mics[0].zoneId, 'mm.axis');
    const pair = s.find((x: { role: string }) => x.role === 'pair');
    assert.deepEqual(pair.mics.map((m: { zoneId: string }) => m.zoneId), ['mm.axis', 'mm.off']);
    assert.equal(s.find((x: { role: string }) => x.role === 'distant')?.mics[0].zoneId, 'mm.room');
    assert.ok(!s.some((x: { role: string }) => x.role === 'close'), 'no live venue setup on a bench');
  });
  it('the logged distance is a drawing default, never sourced', () => {
    const z = L.zones.find((q: { id: string }) => q.id === 'mm.axis')!;
    assert.equal(z.bandProv.kind, 'illustrative');
    assert.equal(spec.MEAS_DIMS.keepAway.placeholder, true);
  });
});

describe('the chain rack: data and refusals', () => {
  for (const name of ['MEAS_CHAIN', 'FIELD_MATCH', 'METER_CHAIN', 'ROOM_CHAIN'] as const) {
    it(`${name}: every rule and brief names real parts; every brief can pass`, () => {
      assert.deepEqual(chainModel.validateChain(chains[name]), []);
    });
  }
  const C = chains.MEAS_CHAIN;
  const abs = C.briefs.find((b: { id: string }) => b.id === 'absolute');
  const run = (p: Record<string, string>) => chainModel.checkChain(C, abs, p);
  it('the power path follows the capsule: the four wrong joins are refused, the right ones pass', () => {
    const base = { input: 'analyzer', record: 'own' };
    for (const [capsule, power] of [['prepol', 'polsupply'], ['extpol', 'ccp'], ['extpol', 'phantom'], ['prepol', 'phantom'], ['extpol', 'approved']]) {
      assert.ok(run({ ...base, capsule, power }).refused.length > 0, `${capsule}+${power}`);
    }
    for (const [capsule, power] of [['prepol', 'ccp'], ['prepol', 'approved'], ['extpol', 'polsupply']]) {
      assert.equal(run({ ...base, capsule, power }).pass, true, `${capsule}+${power}`);
    }
  });
  it('phantom refusals carry the exact pinout safety line', () => {
    for (const r of C.rules.filter((q: { all: string[][] }) => q.all.some(([, p]) => p === 'phantom'))) assert.match(r.reason, /Do not experiment with pinouts or apply power to an unverified sensor\./);
  });
  it('an absolute level refuses a recorder’s dBFS and a copied sensitivity; a relative comparison does not need the record', () => {
    assert.equal(run({ capsule: 'prepol', power: 'ccp', input: 'recorder', record: 'own' }).pass, false);
    assert.equal(run({ capsule: 'prepol', power: 'ccp', input: 'analyzer', record: 'copied' }).pass, false);
    const rel = C.briefs.find((b: { id: string }) => b.id === 'relative');
    assert.equal(chainModel.checkChain(C, rel, { capsule: 'prepol', power: 'ccp', input: 'recorder', record: 'none' }).pass, true);
  });
  it('a refused part is not also listed as a misfit', () => {
    const c = run({ capsule: 'extpol', power: 'phantom', input: 'analyzer', record: 'own' });
    assert.equal(c.misfits.some((m: { part: string }) => m.part === 'phantom'), false);
  });
  it('the room chain refuses a firearm-like source in every brief', () => {
    for (const b of chains.ROOM_CHAIN.briefs) assert.ok(chainModel.checkChain(chains.ROOM_CHAIN, b, { signal: 'blank', source: 'omni', mic: 'meas', processing: 'off' }).refused.some((r: { safety?: boolean }) => r.safety));
  });
  it('a fast maximum is never relabelled a peak', () => {
    const imp = chains.METER_CHAIN.briefs.find((b: { id: string }) => b.id === 'impulse');
    assert.ok(chainModel.checkChain(chains.METER_CHAIN, imp, { instrument: 'slm', weighting: 'C', time: 'F', report: 'lcpeak' }).refused.length);
    assert.equal(chainModel.checkChain(chains.METER_CHAIN, imp, { instrument: 'slm', weighting: 'C', time: 'peak', report: 'lcpeak' }).pass, true);
  });
});

describe('the decay reader (F13; RA-T)', () => {
  const straight = { early: 1.2, late: 1.2, earlyShare: 0.5, floorDb: -80 };
  const s = decay.sampleDecay(straight, 3);
  for (const m of ['EDT', 'T20', 'T30'] as const) {
    it(`${m} recovers a straight 1.2 s decay`, () => {
      const f = decay.fitDecay(s, straight.floorDb, m);
      assert.ok(f.ok, m);
      assert.ok(Math.abs(f.seconds - 1.2) < 0.03, `${f.seconds}`);
    });
  }
  it('the range rule: T30 needs 45 dB, T20 35 dB (the end 10 dB above the floor)', () => {
    assert.equal(decay.rangeNeeded('T30'), 45);
    assert.equal(decay.rangeNeeded('T20'), 35);
    assert.equal(decay.fitDecay(s, -40, 'T30').ok, false);
    assert.equal(decay.fitDecay(s, -40, 'T20').ok, true);
    assert.equal(decay.fitDecay(s, -30, 'T20').ok, false);
  });
  it('a two-slope decay: EDT shorter than T30 when the early part falls faster', () => {
    const m = { early: 0.8, late: 1.6, earlyShare: 0.7, floorDb: -70 };
    const ss = decay.sampleDecay(m, 4);
    const edt = decay.fitDecay(ss, m.floorDb, 'EDT');
    const t30 = decay.fitDecay(ss, m.floorDb, 'T30');
    assert.ok(edt.ok && t30.ok && edt.seconds < t30.seconds);
  });
  it('the made-up bands tell the story: the 125 Hz band has range for T20 only', () => {
    const b = decay.EXAMPLE_BANDS[0];
    const ss = decay.sampleDecay(b.model, 5);
    assert.equal(decay.fitDecay(ss, b.model.floorDb, 'T30').ok, false);
    assert.equal(decay.fitDecay(ss, b.model.floorDb, 'T20').ok, true);
  });
});

describe('the level history (F12) through the SPL calculator', () => {
  const lv = hist.makeHistory(hist.EXAMPLE_RUNS.A);
  it('deterministic: the same run every time', () => {
    assert.deepEqual(hist.makeHistory(hist.EXAMPLE_RUNS.A).slice(0, 50), lv.slice(0, 50));
    assert.equal(lv.length, 600 * hist.SAMPLES_PER_S);
  });
  it('LAeq is the energy average (calculator parity), above the mean of the dB', () => {
    const d = hist.describe(lv);
    const energy = 10 * Math.log10(lv.reduce((a: number, x: number) => a + 10 ** (x / 10), 0) / lv.length);
    assert.ok(d.laeq !== null && Math.abs(d.laeq - energy) < 1e-6, `${d.laeq} vs ${energy}`);
    assert.ok(d.laeq > d.meanOfDb + 1, 'the loud pass-bys pull the energy average above the mean of the dB');
  });
  it('L10 ≥ L50 ≥ L90 and LAFmax ≥ L10', () => {
    const d = hist.describe(lv);
    assert.ok(d.lafmax >= d.l10 && d.l10 >= d.l50 && d.l50 >= d.l90);
  });
});

describe('background subtraction (F12; D-6B-8)', () => {
  it('an energy subtraction, never Lt − Lb', () => {
    const r = bg.subtractBackground(60, 50);
    assert.ok(r.ok);
    assert.ok(Math.abs(r.source - 10 * Math.log10(10 ** 6 - 10 ** 5)) < 1e-9);
    assert.notEqual(Math.round(r.source), 10);
  });
  it('refused inside the method’s limit (default 3 dB), and when the background is not below', () => {
    assert.equal(bg.DEFAULT_LIMIT_DB, 3);
    assert.equal(bg.subtractBackground(55, 53).ok, false);
    assert.equal(bg.subtractBackground(50, 52).ok, false);
    assert.equal(bg.subtractBackground(55, 52).ok, true);
  });
});

describe('the field calibrator (F11; NTI-CAL)', () => {
  it('94 dB is about 1 Pa through the shared reference (1.0024 Pa)', () => {
    assert.ok(Math.abs(cal.pascalsOf(94) - 1.0024) < 1e-4);
    assert.ok(Math.abs(cal.pascalsOf(94) - P_REF_PA * 10 ** (94 / 20)) < 1e-12);
    assert.deepEqual([...spec.CALIBRATOR.levels], [94, 114]);
  });
  it('the stories end where the lesson says', () => {
    const by = (id: string) => cal.CAL_SCENARIOS.find((s: { id: string }) => s.id === id)!;
    assert.equal(cal.runCheck(by('good'), 'seated').pass, true);
    assert.equal(cal.runCheck(by('good'), 'loose').pass, false);
    assert.equal(cal.runCheck(by('quarter'), 'noAdapter').pre.stable, false);
    const d = cal.runCheck(by('drift'), 'seated');
    assert.equal(d.pass, false);
    assert.ok(d.drift !== null && Math.abs(d.drift - 1.2) < 1e-9);
  });
  it('the label: calibrated only with every link; a failed check is marked for investigation', () => {
    const all = { chainKnown: true, sensitivityOwn: true, preCheck: true, postCheck: true, methodNamed: true };
    assert.equal(label.resultLabel(all).kind, 'calibrated');
    for (const k of ['chainKnown', 'sensitivityOwn', 'methodNamed'] as const) assert.equal(label.resultLabel({ ...all, [k]: false }).kind, 'relative', k);
    assert.equal(label.resultLabel({ ...all, postCheck: null }).kind, 'relative');
    assert.equal(label.resultLabel({ ...all, postCheck: false }).kind, 'investigate');
  });
});

describe('the reflection off a person, and the field at the capsule', () => {
  const S = { x: 0, y: 0, z: 0 };
  const M = { x: 1000, y: 0, z: 0 };
  it('farther = later and weaker; the delay is the extra path at the calculator’s speed of sound', () => {
    const near = keep.bodyReflection(S, M, { x: 1350, y: 0, z: 350 });
    const far = keep.bodyReflection(S, M, { x: 2400, y: 0, z: 1400 });
    assert.ok(far.ms > near.ms && far.belowDb < near.belowDb);
    assert.ok(Math.abs(near.ms - near.extra / C20) < 1e-9);
  });
  it('the wavelength drawn is c / f (≈ 34 mm at 10 kHz, ≈ 34 cm at 1 kHz)', () => {
    assert.ok(Math.abs(field.wavelengthMm(10000) - speedOfSoundAir(20) / 10) < 1e-9);
    assert.ok(field.wavelengthMm(1000) > 340 && field.wavelengthMm(1000) < 346);
  });
  it('the weighting curves are the defining formulas (A: 0 dB at 1 kHz, about −19 dB at 100 Hz)', () => {
    assert.ok(Math.abs(parts.weightingDb('A', 1000)) < 0.05);
    assert.ok(Math.abs(parts.weightingDb('A', 100) + 19.1) < 0.2);
    assert.ok(Math.abs(parts.weightingDb('C', 1000)) < 0.05);
    assert.equal(parts.weightingDb('Z', 63), 0);
  });
  it('scene frame F: lengths round to the scale of the number', () => {
    assert.equal(frame.fmtMetres(450), '45 cm');
    assert.equal(frame.fmtMetres(1500), '1.5 m');
    assert.equal(frame.fmtMetres(12400), '12 m');
    assert.equal(frame.fmtMetres(-1), '—');
    assert.equal(frame.fmtMetres(3000, true), '3.0 m (9.8 ft)');
  });
});
