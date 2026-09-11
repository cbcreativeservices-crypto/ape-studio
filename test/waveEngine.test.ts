/**
 * Wave Physics Lab — waveEngine tests (untested-math QA night 2026-09-11).
 *
 * The Room Builder is the model behind all 15 modules, so its acoustics are
 * checked against textbook closed forms: the speed of sound vs temperature,
 * inverse-square, the image-source construct, the Rayleigh mode equation,
 * Sabine, and Maekawa — plus the reference numbers the lab's copy quotes.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MATERIALS, MATERIAL_SHORT, MATERIAL_BLURBS, alphaAt,
  speedOfSound, imageSources, directivityGain, fieldAt, fieldDb,
  arrivalsAt, responseAt, modeFrequency, modePressure, sabineRT,
  maekawaAttenuationDb, refractedRayHeight, arrayPositions,
  type MaterialKey, type WaveScene, type WaveSource,
} from '../src/screens/lab/wave/waveEngine.ts';

const near = (a: number, b: number, tol = 1e-6) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b} (tol ${tol})`);

const MATS = Object.keys(MATERIALS) as MaterialKey[];
const BANDS = [125, 250, 500, 1000, 2000, 4000];

const src = (over: Partial<WaveSource> = {}): WaveSource => ({
  id: 's', x: 2, y: 3, freq: 1000, levelDb: 0, delayMs: 0,
  polarity: 1, kind: 'point', ...over,
});
const room = (over: Partial<WaveScene> = {}): WaveScene => ({
  w: 10, h: 8, boundary: ['concrete', 'concrete', 'concrete', 'concrete'],
  sources: [src()], listener: { x: 5, y: 4 }, tempC: 20, ...over,
});

describe('speedOfSound — the constant every other number depends on', () => {
  it('is 331.3 m/s at 0 °C, by definition of the formula', () =>
    near(speedOfSound(0), 331.3, 1e-9));
  it('is 343.2 m/s at 20 °C — the value the whole app quotes', () =>
    near(speedOfSound(20), 343.215, 1e-3));
  it('gives a 1 kHz wavelength of 0.343 m at 20 °C', () =>
    near(speedOfSound(20) / 1000, 0.3432, 1e-4));
  it('gives a 20 Hz wavelength of ~17 m and a 20 kHz one of ~1.7 cm', () => {
    near(speedOfSound(20) / 20, 17.16, 0.01);
    near(speedOfSound(20) / 20000, 0.01716, 1e-5);
  });
  it('rises with temperature, and reaches zero at absolute zero', () => {
    assert.ok(speedOfSound(30) > speedOfSound(20));
    assert.ok(speedOfSound(20) > speedOfSound(10));
    near(speedOfSound(-273.15), 0, 1e-9);
  });
  it('the familiar "+0.6 m/s per °C" rule holds near room temperature', () =>
    near(speedOfSound(21) - speedOfSound(20), 0.6, 0.02));
});

describe('alphaAt — absorption tables and interpolation', () => {
  it('every material has 6 octave-band values, all physical (0..1)', () => {
    for (const m of MATS) {
      assert.equal(MATERIALS[m].alpha.length, 6, m);
      for (const a of MATERIALS[m].alpha) assert.ok(a >= 0 && a <= 1, `${m}: ${a}`);
      assert.ok(MATERIALS[m].scatter >= 0 && MATERIALS[m].scatter <= 1, m);
      assert.ok(MATERIAL_SHORT[m].length <= 5 && MATERIAL_SHORT[m].length > 0, m);
      assert.ok(MATERIAL_BLURBS[m].length > 20, m);
    }
  });
  it('returns the table value exactly at each band centre', () => {
    for (const m of MATS) {
      BANDS.forEach((f, i) => assert.equal(alphaAt(m, f), MATERIALS[m].alpha[i], `${m} @ ${f}`));
    }
  });
  it('clamps outside 125 Hz … 4 kHz rather than extrapolating into nonsense', () => {
    for (const m of MATS) {
      assert.equal(alphaAt(m, 10), MATERIALS[m].alpha[0], m);
      assert.equal(alphaAt(m, 20000), MATERIALS[m].alpha[5], m);
    }
  });
  it('interpolates on a LOG frequency axis — the geometric mean is the midpoint', () => {
    for (const m of MATS) {
      near(alphaAt(m, Math.sqrt(500 * 1000)),
        (MATERIALS[m].alpha[2] + MATERIALS[m].alpha[3]) / 2, 1e-9);
    }
  });
  it('never leaves 0..1 anywhere in the audible band', () => {
    for (const m of MATS) {
      for (let f = 20; f <= 20000; f *= 1.05) {
        const a = alphaAt(m, f);
        assert.ok(a >= 0 && a <= 1 && Number.isFinite(a), `${m} @ ${f}: ${a}`);
      }
    }
  });
  it('an OPENING absorbs everything — that is what "no wall at all" means', () => {
    for (let f = 20; f <= 20000; f *= 1.3) assert.equal(alphaAt('open', f), 1);
  });
  it('the tables match the blurbs: foam is weak low and strong high, the reverse of drywall', () => {
    assert.ok(alphaAt('foam', 4000) > 0.9 && alphaAt('foam', 125) < 0.2);
    assert.ok(alphaAt('drywall', 125) > alphaAt('drywall', 1000)); // "absorbs some LOWS"
    assert.ok(alphaAt('carpet', 1000) > 5 * alphaAt('carpet', 125)); // "useless for bass"
    assert.ok(alphaAt('fiberglass', 500) > alphaAt('foam', 500));    // "the serious absorber"
    for (const f of BANDS) assert.ok(alphaAt('concrete', f) <= 0.03); // "reflects almost everything"
  });
});

describe('imageSources — the mirror construct', () => {
  it('the real source is always first, at gain 1, with no bounces', () => {
    const [first] = imageSources(room(), src(), 1000, 2);
    assert.deepEqual(first.bounces, []);
    assert.equal(first.gain, 1);
    assert.equal(first.x, 2);
    assert.equal(first.y, 3);
  });
  it('first-order images mirror across each of the four walls', () => {
    const im = imageSources(room(), src({ x: 2, y: 3 }), 1000, 1);
    const by = (b: number) => im.find((i) => i.bounces.length === 1 && i.bounces[0] === b)!;
    assert.deepEqual([by(0).x, by(0).y], [2, -3]);   // top    (y = 0)
    assert.deepEqual([by(1).x, by(1).y], [18, 3]);   // right  (x = w)
    assert.deepEqual([by(2).x, by(2).y], [2, 13]);   // bottom (y = h)
    assert.deepEqual([by(3).x, by(3).y], [-2, 3]);   // left   (x = 0)
  });
  it('an image lies exactly as far BEHIND its wall as the source is in front', () => {
    const s = src({ x: 2, y: 3 });
    const im = imageSources(room(), s, 1000, 1);
    near(Math.abs(im.find((i) => i.bounces[0] === 3)!.x - 0), Math.abs(s.x - 0), 1e-12);
    near(Math.abs(im.find((i) => i.bounces[0] === 1)!.x - 10), Math.abs(s.x - 10), 1e-12);
  });
  it('counts 1 + 4 + 12 = 17 sources to second order, never re-bouncing the same wall', () => {
    const im = imageSources(room(), src(), 1000, 2);
    assert.equal(im.length, 17);
    for (const i of im) {
      if (i.bounces.length === 2) assert.notEqual(i.bounces[0], i.bounces[1]);
    }
    assert.equal(imageSources(room(), src(), 1000, 1).length, 5);
  });
  it('each bounce costs √(1−α) — the PRESSURE reflection factor, not the energy one', () => {
    const im = imageSources(room(), src(), 1000, 2);
    const a = alphaAt('concrete', 1000);
    for (const i of im) near(i.gain, Math.pow(Math.sqrt(1 - a), i.bounces.length), 1e-12);
  });
  it('a perfectly absorbing wall returns nothing at all', () => {
    const sc = room({ boundary: ['open', 'open', 'open', 'open'] });
    for (const i of imageSources(sc, src(), 1000, 2)) {
      assert.equal(i.gain, i.bounces.length === 0 ? 1 : 0);
    }
  });
  it('softer walls always reflect less than harder ones', () => {
    const hard = imageSources(room(), src(), 1000, 1)[1].gain;
    const soft = imageSources(room({ boundary: ['foam', 'foam', 'foam', 'foam'] }), src(), 1000, 1)[1].gain;
    assert.ok(soft < hard);
  });
});

describe('fieldAt / fieldDb — inverse-square and superposition', () => {
  const free = room({
    w: 2000, h: 2000, boundary: ['open', 'open', 'open', 'open'],
    sources: [src({ x: 1000, y: 1000 })], listener: { x: 0, y: 0 },
  });
  const imgs = () => free.sources.map((s) => imageSources(free, s, 100, 0));

  it('free field: 0 dB at 1 m, and −6.02 dB for every doubling of distance', () => {
    const at = (d: number) => fieldDb(fieldAt(free, 1000 + d, 1000, 100, imgs()));
    near(at(1), 0, 1e-9);
    near(at(2) - at(1), -6.0206, 1e-3);
    near(at(4) - at(2), -6.0206, 1e-3);
    near(at(10) - at(1), -20, 1e-3);
  });
  it('a muted source contributes nothing', () => {
    const sc = { ...free, sources: [src({ x: 1000, y: 1000, muted: true })] };
    const im = sc.sources.map((s) => imageSources(sc, s, 100, 0));
    assert.equal(fieldDb(fieldAt(sc, 1001, 1000, 100, im)), -120);
  });
  it('+6 dB of source level is +6 dB in the field', () => {
    const hot = { ...free, sources: [src({ x: 1000, y: 1000, levelDb: 6 })] };
    const im = hot.sources.map((s) => imageSources(hot, s, 100, 0));
    near(fieldDb(fieldAt(hot, 1001, 1000, 100, im))
      - fieldDb(fieldAt(free, 1001, 1000, 100, imgs())), 6, 1e-9);
  });
  it('two coincident in-phase sources sum to +6 dB; opposite polarity cancels', () => {
    const two = (pol: 1 | -1) => {
      const sc = {
        ...free,
        sources: [src({ id: 'a', x: 1000, y: 1000 }), src({ id: 'b', x: 1000, y: 1000, polarity: pol })],
      };
      return fieldDb(fieldAt(sc, 1001, 1000, 100, sc.sources.map((s) => imageSources(sc, s, 100, 0))));
    };
    near(two(1), 6.0206, 1e-3);
    assert.equal(two(-1), -120); // total cancellation floors the display
  });
  it('is never NaN or +Infinity, even standing on top of the source', () => {
    for (const [x, y] of [[1000, 1000], [1000.001, 1000], [0, 0]]) {
      assert.ok(Number.isFinite(fieldDb(fieldAt(free, x, y, 100, imgs()))));
    }
  });
  it('a delay of one period is a full wavelength of extra path — the field repeats', () => {
    const f = 100;
    const withDelay = { ...free, sources: [src({ x: 1000, y: 1000, delayMs: 1000 / f })] };
    const im = withDelay.sources.map((s) => imageSources(withDelay, s, f, 0));
    near(fieldDb(fieldAt(withDelay, 1003, 1000, f, im)),
      fieldDb(fieldAt(free, 1003, 1000, f, imgs())), 1e-9);
  });
  it('responseAt agrees with fieldDb over the same images', () => {
    const sc = room();
    near(responseAt(sc, 6, 5, 500, 1),
      fieldDb(fieldAt(sc, 6, 5, 500, sc.sources.map((s) => imageSources(sc, s, 500, 1)))), 1e-12);
  });
});

describe('arrivalsAt — the echo timeline', () => {
  const sc = room({ sources: [src({ x: 2, y: 3 })] });
  const c = speedOfSound(20);

  it('the DIRECT sound is first, and its time is exactly path / c', () => {
    const a = arrivalsAt(sc, 8, 5, 1000, 2);
    assert.deepEqual(a[0].bounces, []);
    near(a[0].pathLen, Math.hypot(6, 2), 1e-12);
    near(a[0].t, Math.hypot(6, 2) / c, 1e-12);
  });
  it('arrivals come out sorted in time, and every reflection is later than the direct', () => {
    const a = arrivalsAt(sc, 8, 5, 1000, 2);
    for (let i = 1; i < a.length; i++) assert.ok(a[i].t >= a[i - 1].t);
    for (const x of a.slice(1)) assert.ok(x.t > a[0].t);
  });
  it('every reflection is QUIETER than the direct sound (longer path + absorption)', () => {
    for (const x of arrivalsAt(sc, 8, 5, 1000, 2).slice(1)) {
      assert.ok(x.levelDb < arrivalsAt(sc, 8, 5, 1000, 2)[0].levelDb);
    }
  });
  it('level follows 20·log10(gain / r) off the source level', () => {
    const a = arrivalsAt(sc, 8, 5, 1000, 1)[0];
    near(a.levelDb, 20 * Math.log10(1 / Math.hypot(6, 2)), 1e-12);
  });
  it('the sound travels ~343 m in a second: 3.44 m of extra path ≈ 10 ms later', () => {
    const a = arrivalsAt(sc, 8, 5, 1000, 1);
    for (const x of a.slice(1)) {
      near((x.t - a[0].t) * 1000, ((x.pathLen - a[0].pathLen) / c) * 1000, 1e-9);
    }
  });
  it('an OPENING produces no arrival at all — no phantom tick at the floor (B-104)', () => {
    const open = room({ boundary: ['open', 'open', 'open', 'open'], sources: [src()] });
    assert.equal(arrivalsAt(open, 8, 5, 1000, 2).length, 1);
    for (const a of arrivalsAt(open, 8, 5, 1000, 2)) assert.ok(Number.isFinite(a.levelDb));
  });
  it('a muted source contributes no arrivals', () => {
    assert.equal(arrivalsAt(room({ sources: [src({ muted: true })] }), 8, 5, 1000, 2).length, 0);
  });
  it('an electronic delay shifts every arrival from that source by exactly that much', () => {
    const d = arrivalsAt(room({ sources: [src({ delayMs: 12 })] }), 8, 5, 1000, 1);
    const n = arrivalsAt(sc, 8, 5, 1000, 1);
    d.forEach((x, i) => near(x.t - n[i].t, 0.012, 1e-12));
  });
});

describe('modeFrequency / modePressure — the Rayleigh mode equation', () => {
  const sc = room();
  const c = speedOfSound(20);

  it('an axial mode is c / 2L — the room\'s longest dimension is its lowest mode', () => {
    near(modeFrequency(sc, 1, 0), c / (2 * 10), 1e-9);
    near(modeFrequency(sc, 0, 1), c / (2 * 8), 1e-9);
    assert.ok(modeFrequency(sc, 1, 0) < modeFrequency(sc, 0, 1));
  });
  it('a tangential mode is the Pythagorean combination', () =>
    near(modeFrequency(sc, 1, 1), (c / 2) * Math.hypot(1 / 10, 1 / 8), 1e-9));
  it('mode n is n times the first mode in the same axis (a harmonic ladder)', () => {
    for (const n of [2, 3, 5]) near(modeFrequency(sc, n, 0), n * modeFrequency(sc, 1, 0), 1e-9);
  });
  it('a room half the size has modes twice as high', () =>
    near(modeFrequency(room({ w: 5, h: 4 }), 1, 0) / modeFrequency(sc, 1, 0), 2, 1e-9));
  it('the (0,0) "mode" is 0 Hz — there is no such standing wave', () =>
    assert.equal(modeFrequency(sc, 0, 0), 0));
  it('pressure maxima sit at the walls and the null is dead centre (the 1,0 mode)', () => {
    near(modePressure(sc, 1, 0, 0, 4), 1, 1e-12);
    near(modePressure(sc, 1, 0, 10, 4), -1, 1e-12);
    near(modePressure(sc, 1, 0, 5, 4), 0, 1e-12);
  });
  it('the 2,0 mode has TWO nulls, at a quarter and three quarters of the length', () => {
    near(modePressure(sc, 2, 0, 2.5, 4), 0, 1e-12);
    near(modePressure(sc, 2, 0, 7.5, 4), 0, 1e-12);
    near(Math.abs(modePressure(sc, 2, 0, 5, 4)), 1, 1e-12);
  });
  it('pressure never leaves ±1', () => {
    for (let x = 0; x <= 10; x += 0.37) {
      for (let y = 0; y <= 8; y += 0.41) {
        assert.ok(Math.abs(modePressure(sc, 3, 2, x, y)) <= 1 + 1e-12);
      }
    }
  });
});

describe('sabineRT', () => {
  it('matches 0.161·V/A by hand for a bare concrete box', () => {
    const sc = room();
    const V = 10 * 8 * 3;
    const A = 10 * 8 * 2 * 0.1 + 2 * (10 * 3) * alphaAt('concrete', 1000) + 2 * (8 * 3) * alphaAt('concrete', 1000);
    near(sabineRT(sc, 1000), (0.161 * V) / A, 1e-9);
  });
  it('more absorption always means a shorter decay', () => {
    const rt = (m: MaterialKey) => sabineRT(room({ boundary: [m, m, m, m] }), 1000);
    assert.ok(rt('concrete') > rt('wood'));
    assert.ok(rt('wood') > rt('curtain'));
    assert.ok(rt('curtain') > rt('fiberglass'));
    assert.ok(rt('fiberglass') > rt('open'));
  });
  it('a bigger room rings longer at the same treatment', () => {
    assert.ok(sabineRT(room({ w: 40, h: 30 }), 1000) > sabineRT(room({ w: 5, h: 4 }), 1000));
  });
  it('carpet barely touches the bass but dries out the top (the "still booms" lesson)', () => {
    const sc = room({ boundary: ['carpet', 'carpet', 'carpet', 'carpet'] });
    assert.ok(sabineRT(sc, 125) > 2 * sabineRT(sc, 1000));
  });
  it('stays finite and positive for every material at every band, capped at 9.9 s', () => {
    for (const m of MATS) {
      for (let f = 20; f <= 20000; f *= 1.4) {
        const rt = sabineRT(room({ boundary: [m, m, m, m] }), f);
        assert.ok(Number.isFinite(rt) && rt > 0 && rt <= 9.9, `${m} @ ${f}: ${rt}`);
      }
    }
  });
});

describe('maekawaAttenuationDb — knife-edge diffraction', () => {
  const c20 = speedOfSound(20);
  it('with no path difference the barrier still gives 10·log10(3) ≈ 4.8 dB', () =>
    near(maekawaAttenuationDb(5, 5, 1000, 20), 10 * Math.log10(3), 1e-9));
  it('follows 10·log10(3 + 20N) with N = 2δ/λ', () => {
    for (const delta of [0.05, 0.1, 0.5, 1, 3]) {
      const N = (2 * delta) / (c20 / 1000);
      near(maekawaAttenuationDb(delta, 0, 1000, 20), 10 * Math.log10(3 + 20 * N), 1e-9);
    }
  });
  it('higher frequencies are shaded MORE — the reason a barrier kills highs first', () => {
    let prev = 0;
    for (const f of [125, 250, 500, 1000, 2000, 4000]) {
      const v = maekawaAttenuationDb(0.3, 0, f, 20);
      assert.ok(v > prev, `${f} Hz not better shaded than the octave below`);
      prev = v;
    }
  });
  it('a longer detour over the barrier attenuates more', () => {
    assert.ok(maekawaAttenuationDb(2, 0, 1000, 20) > maekawaAttenuationDb(0.2, 0, 1000, 20));
  });
  it('deep in the bright zone (N < −0.2) there is no shading at all', () =>
    assert.equal(maekawaAttenuationDb(0, 5, 1000, 20), 0));
  it('is finite and non-negative everywhere it speaks', () => {
    for (const d of [-1, -0.01, 0, 0.5, 10]) {
      for (const f of [31.5, 1000, 16000]) {
        const v = maekawaAttenuationDb(d, 0, f, 20);
        assert.ok(Number.isFinite(v) && v >= 0, `${d} @ ${f}: ${v}`);
      }
    }
  });
});

describe('refractedRayHeight — a linear sound-speed gradient', () => {
  it('no gradient means a straight horizontal ray', () => {
    for (const x of [0, 50, 1000]) assert.equal(refractedRayHeight(10, x, 0, 20), 10);
  });
  it('a POSITIVE gradient (an inversion) bends the ray DOWN — why sound carries at night', () => {
    assert.ok(refractedRayHeight(10, 100, 0.1, 20) < 10);
  });
  it('a negative gradient (a hot day) bends it UP into a shadow zone', () => {
    assert.ok(refractedRayHeight(10, 100, -0.1, 20) > 10);
  });
  it('drop follows x²/(2R) with R = c / grad', () => {
    const R = speedOfSound(20) / 0.1;
    near(refractedRayHeight(10, 100, 0.1, 20), 10 - (100 * 100) / (2 * R), 1e-9);
  });
  it('curvature is quadratic: twice the distance is four times the drop', () => {
    const d1 = 10 - refractedRayHeight(10, 100, 0.1, 20);
    const d2 = 10 - refractedRayHeight(10, 200, 0.1, 20);
    near(d2 / d1, 4, 1e-9);
  });
  it('the ray starts at its launch height', () => assert.equal(refractedRayHeight(7, 0, 0.1, 20), 7));
});

describe('directivityGain', () => {
  const spk = src({ kind: 'speaker', aimDeg: 0, coverageDeg: 90, x: 0, y: 0 });
  it('omnidirectional sources are omnidirectional — 1 in every direction', () => {
    for (const kind of ['point', 'sub'] as const) {
      for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, -1]]) {
        assert.equal(directivityGain(src({ kind }), dx, dy, 1000), 1);
      }
    }
  });
  it('a speaker is full-strength on axis and inside its nominal wedge', () => {
    near(directivityGain(spk, 0, 1, 1000), 1, 1e-9);
    near(directivityGain(spk, Math.tan(Math.PI / 8), 1, 1000), 1, 1e-9); // 22.5° = wedge edge
  });
  it('behind the box it floors at 0.25 = exactly −12 dB, as documented', () => {
    near(20 * Math.log10(directivityGain(spk, 0, -1, 1000)), -12.0412, 1e-3);
  });
  it('never rises above 1 or falls below the −12 dB floor, at any angle or frequency', () => {
    for (const f of [60, 250, 1000, 8000, 20000]) {
      for (let a = 0; a < 2 * Math.PI; a += 0.05) {
        const g = directivityGain(spk, Math.sin(a), Math.cos(a), f);
        assert.ok(g >= 0.25 - 1e-12 && g <= 1 + 1e-12, `${f} Hz @ ${a}: ${g}`);
      }
    }
  });
  it('coverage narrows with frequency — the module-9 lesson', () => {
    const off = [Math.sin(Math.PI / 3), Math.cos(Math.PI / 3)] as const; // 60° off axis
    assert.ok(directivityGain(spk, off[0], off[1], 8000) < directivityGain(spk, off[0], off[1], 125));
  });
  it('a wider nominal pattern covers more at the same angle', () => {
    const off = [Math.sin(Math.PI / 3), Math.cos(Math.PI / 3)] as const;
    assert.ok(directivityGain(src({ kind: 'speaker', coverageDeg: 120 }), off[0], off[1], 1000)
      >= directivityGain(src({ kind: 'speaker', coverageDeg: 60 }), off[0], off[1], 1000));
  });
  it('aiming the box moves the coverage with it', () => {
    const aimed = src({ kind: 'speaker', aimDeg: 90, coverageDeg: 90 });
    near(directivityGain(aimed, 1, 0, 1000), 1, 1e-9); // now full-strength to +x
    assert.ok(directivityGain(aimed, -1, 0, 1000) < 1);
  });
});

describe('arrayPositions', () => {
  it('returns one box per element, hung from the given point', () => {
    const a = arrayPositions(3, 10, 4, 0.5, 5);
    assert.equal(a.length, 4);
    assert.deepEqual([a[0].x, a[0].y, a[0].aimDeg], [3, 10, 0]);
    assert.ok(a.every((b) => b.x === 3));
  });
  it('each box aims splayDeg further down than the one above it', () => {
    const a = arrayPositions(0, 10, 5, 0.5, 4);
    a.forEach((b, i) => assert.equal(b.aimDeg, i * 4));
  });
  it('boxes hang in order, each below the last', () => {
    const a = arrayPositions(0, 10, 6, 0.5, 6);
    for (let i = 1; i < a.length; i++) assert.ok(a[i].y > a[i - 1].y);
  });
  it('a straight (0° splay) array is a plain vertical stack of box heights', () => {
    const a = arrayPositions(0, 0, 4, 0.5, 0);
    a.forEach((b, i) => near(b.y, i * 0.5, 1e-12));
  });
  it('splaying the array shortens its vertical extent (the boxes fan out)', () => {
    const straight = arrayPositions(0, 0, 8, 0.5, 0);
    const splayed = arrayPositions(0, 0, 8, 0.5, 6);
    assert.ok(splayed.at(-1)!.y < straight.at(-1)!.y);
  });
  it('an empty array is empty, not a crash', () => assert.deepEqual(arrayPositions(0, 0, 0, 0.5, 5), []));
});
