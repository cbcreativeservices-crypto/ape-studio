/**
 * Miking Labs ENGINE — physics (blueprint §11, mikingPhysics;
 * docs/labs/miking/SOURCES_SHARED.md). Real relationships only:
 *
 *   • each first-order pattern: A + B = 1, on-axis = 1, the null where
 *     A + B·cos θ = 0 (cardioid 180°, supercardioid 125.26°, hypercardioid
 *     109.47°, figure-8 90°), REE and DI from the energy integral;
 *   • the supercardioid really is the max front-to-back member;
 *   • c is the CALCULATOR's speedOfSoundAir(20); 1 m of path = 2.914 ms;
 *   • notches from a KNOWN path difference (343.21 mm → 1 ms → 500 Hz,
 *     1.5 kHz … same polarity; 0, 1 kHz, 2 kHz … inverted);
 *   • the ideal sum is a true null at those frequencies and 0 dB between;
 *   • far-field parity with the calculator's STEREOMIC first mono comb null;
 *   • inverse distance −6.02 dB per doubling; 3:1 → −9.54 dB.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const polar = await import('../src/screens/lab/miking/engine/physics/polar.ts');
const two = await import('../src/screens/lab/miking/engine/physics/twoMic.ts');
const lv = await import('../src/screens/lab/miking/engine/physics/levels.ts');
const { speedOfSoundAir } = await import('../src/screens/lab/calc/calcUnits.ts');
const { WORKSPACES_MICS_RF } = await import('../src/screens/lab/calc/workspaces/micsRf.ts');

const near = (a: number, b: number, tol: number, msg?: string) => assert.ok(Math.abs(a - b) <= tol, msg ?? `${a} ≉ ${b} (±${tol})`);
const PATTERNS = ['omni', 'cardioid', 'supercardioid', 'hypercardioid', 'figure8'] as const;

/** Numerical energy integral over the sphere: ∫ g(θ)² dΩ / 4π. */
function reeNumeric(p: (typeof PATTERNS)[number], from = 0, to = Math.PI): number {
  const N = 20000;
  let s = 0;
  for (let i = 0; i < N; i++) {
    const th = from + ((i + 0.5) / N) * (to - from);
    const g = polar.gain(p, (th * 180) / Math.PI);
    s += g * g * Math.sin(th) * ((to - from) / N);
  }
  return s / 2;
}

describe('ideal first-order patterns (SOURCES_SHARED §3)', () => {
  it('A + B = 1 and the on-axis pickup is 1 for every pattern', () => {
    for (const p of PATTERNS) {
      const c = polar.PATTERN_COEFFS[p];
      near(c.a + c.b, 1, 1e-12);
      near(polar.gain(p, 0), 1, 1e-12);
    }
  });
  it('the nulls are where A + B·cos θ = 0', () => {
    assert.deepEqual(polar.nullAngles('omni'), []);
    near(polar.nullAngles('cardioid')[0], 180, 0.05);
    near(polar.nullAngles('supercardioid')[0], 125.26, 0.05);
    near(polar.nullAngles('hypercardioid')[0], 109.47, 0.05);
    near(polar.nullAngles('figure8')[0], 90, 0.05);
    for (const p of PATTERNS) for (const n of polar.nullAngles(p)) near(polar.gain(p, n), 0, 1e-9);
  });
  it('the cardioid rejects most directly behind; the supercardioid has a REAR LOBE (lesson L68)', () => {
    near(polar.gain('cardioid', 180), 0, 1e-12);
    assert.ok(Math.abs(polar.gain('supercardioid', 180)) > 0.2, 'super picks up directly behind');
    near(polar.gainDb('supercardioid', 180), -11.44, 0.01);
    near(polar.gainDb('hypercardioid', 180), -6.02, 0.01);
    assert.ok(polar.gain('supercardioid', 180) < 0, 'the rear lobe is inverted');
  });
  it('REE and DI match the energy integral', () => {
    const table = { omni: [1, 0], cardioid: [1 / 3, 4.77], supercardioid: [0.268, 5.72], hypercardioid: [0.25, 6.02], figure8: [1 / 3, 4.77] } as const;
    for (const p of PATTERNS) {
      near(polar.ree(p), reeNumeric(p), 1e-6, `${p} REE`);
      near(polar.ree(p), table[p][0], 0.0005, `${p} REE table`);
      near(polar.di(p), table[p][1], 0.01, `${p} DI`);
    }
  });
  it('the supercardioid maximises front-to-back energy (neighbours do worse)', () => {
    const fbr = (a: number) => {
      const b = 1 - a;
      return (a * a + a * b + (b * b) / 3) / (a * a - a * b + (b * b) / 3);
    };
    const a0 = polar.PATTERN_COEFFS.supercardioid.a;
    assert.ok(fbr(a0) > fbr(a0 - 0.01) && fbr(a0) > fbr(a0 + 0.01));
    assert.ok(fbr(a0) > fbr(0.375), 'beats the 5:3 mix (126.9° null)');
  });
  it('the boundary / unstated patterns are not modelled (no lobe is drawn)', () => {
    assert.equal(polar.isModelled('halfCardioid'), false);
    assert.equal(polar.isModelled('unstated'), false);
    assert.equal(polar.isModelled('cardioid'), true);
  });
});

describe('two microphones (SOURCES_SHARED §1–2)', () => {
  it('c is the calculator’s, at 20 °C (never a copied constant)', () => {
    assert.equal(two.C20, speedOfSoundAir(20));
    near(two.C20, 343.21, 0.01);
  });
  it('1 m of path difference is 2.914 ms', () => {
    near(two.deltaTms(1000), 2.914, 0.0005);
  });
  it('path difference is the difference of the straight-line distances, signed', () => {
    const S = { x: 0, y: 0, z: 0 };
    near(two.pathDiffMm(S, { x: 100, y: 0, z: 0 }, { x: 0, y: 300, z: 400 }), 400, 1e-9);
    assert.ok(two.pathDiffMm(S, { x: 500, y: 0, z: 0 }, { x: 100, y: 0, z: 0 }) < 0, 'B earlier → negative');
  });
  it('a known path difference gives the textbook notches, both polarities', () => {
    const d = two.C20; // mm of path that takes exactly 1 ms
    const dt = two.deltaTms(d);
    near(dt, 1, 1e-12);
    const same = two.notchesHz(dt, 1, 5000);
    assert.deepEqual(same.map((f) => Math.round(f)), [500, 1500, 2500, 3500, 4500]);
    const inv = two.notchesHz(dt, -1, 5000);
    assert.deepEqual(inv.map((f) => Math.round(f)), [0, 1000, 2000, 3000, 4000, 5000]);
    assert.equal(inv[0], 0, 'inverted polarity starts with the low-frequency loss (n = 0)');
  });
  it('polarity moves the notches; it never changes Δt (lesson L72)', () => {
    const dt = two.deltaTms(150);
    assert.notDeepEqual(two.notchesHz(dt, 1), two.notchesHz(dt, -1));
    near(two.deltaTms(150), dt, 0);
  });
  it('equal paths → no notches at all', () => {
    assert.deepEqual(two.notchesHz(0, 1), []);
    assert.deepEqual(two.notchesHz(0, -1), []);
  });
  it('the ideal sum: a true null at each notch for equal gains, 0 dB between', () => {
    const dt = 1;
    for (const f of [500, 1500, 2500]) near(two.combDb(f, dt, 1, 1, 1), two.COMB_FLOOR_DB, 0);
    near(two.combDb(1000, dt, 1, 1, 1), 0, 1e-9);
    for (const f of [1000, 2000]) near(two.combDb(f, dt, 1, 1, -1), two.COMB_FLOOR_DB, 0);
    near(two.combDb(500, dt, 1, 1, -1), 0, 1e-9);
  });
  it('unequal gains make shallower notches (depth formula)', () => {
    near(two.notchDepthDb(1, 1), two.COMB_FLOOR_DB, 0);
    near(two.notchDepthDb(1, 1 / 3), 20 * Math.log10(0.5), 1e-9);
    near(two.combDb(500, 1, 1, 1 / 3, 1), 20 * Math.log10((1 - 1 / 3) / (1 + 1 / 3)), 1e-9);
  });
  it('far-field parity with the calculator: first notch = STEREOMIC FIRST MONO COMB NULL', () => {
    const stereo = WORKSPACES_MICS_RF.find((w: { id: string }) => w.id === 'stereomic');
    const fn = stereo.functions.find((f: { key: string }) => f.key === 'pathDelay');
    for (const [spacingM, angle] of [[0.4, 30], [0.17, 55], [1.2, 12]]) {
      const res = fn.compute({ spacing: spacingM, angle, temp: 20 });
      const calcNull = res.find((r: { label: string }) => r.label === 'FIRST MONO COMB NULL').value;
      const pathMm = spacingM * 1000 * Math.sin((angle * Math.PI) / 180);
      near(two.notchesHz(two.deltaTms(pathMm), 1)[0], calcNull, 0.01);
    }
  });
});

describe('level and spacing (SOURCES_SHARED §4)', () => {
  it('doubling the distance: −6.02 dB (ideal point source, far field)', () => {
    near(lv.levelDiffDb(100, 200), -6.02, 0.005);
    near(lv.levelDiffDb(300, 150), 6.02, 0.005);
  });
  it('3:1 → −9.54 dB, and the ratio uses the LARGER mic-to-source distance', () => {
    near(lv.THREE_TO_ONE_DB, -9.54, 0.005);
    assert.equal(lv.threeToOneRatio(600, 100, 200), 3);
    assert.ok(lv.threeToOneRatio(500, 100, 200) < 3);
  });
});
