/**
 * classicWave — the wavetable must be indistinguishable from the sum of sines.
 *
 * classicWave was rewritten 2026-09-11 from a direct additive double loop into
 * a phase wavetable, because the direct form cost (partials × samples) sine
 * calls and the mixing labs were paying ~7 s of blocked JS to synthesize their
 * eight stems. Speed is not what these tests are for. They exist because the
 * ear lab's whole claim is that its stimuli are PROVABLE — "+6 dB @ 250 Hz is
 * really +6 dB @ 250 Hz" — and an optimisation that quietly changed the
 * waveform would make that claim false while every screen still said it.
 *
 * So the reference below is not the old code. It is the literal mathematical
 * definition of each waveform, written out here so the test does not depend on
 * the implementation it is checking, and the bound is stated against the
 * resolution the audio is actually DELIVERED at: every clip leaves this module
 * through encodeWav as 16-bit PCM, whose quantisation floor is about −96 dBFS.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { classicWave, normalizePeak, SR } from '../src/features/ear/earDsp.ts';

type Kind = 'square' | 'saw' | 'triangle';

/** The definition: amplitude of the k-th partial, from first principles. */
function amp(kind: Kind, k: number): number {
  if (kind === 'square') return k % 2 === 1 ? 1 / k : 0; // odd only, 1/k
  if (kind === 'saw') return (k % 2 === 0 ? -1 : 1) / k; // all, 1/k, alternating
  return k % 2 === 1 ? (((k - 1) / 2) % 2 === 0 ? 1 : -1) / (k * k) : 0; // odd, 1/k²
}

/** Σ amp(k)·sin(ωki) over every partial below Nyquist. Slow and exact. */
function reference(kind: Kind, freq: number, seconds: number): Float32Array {
  const n = Math.round(seconds * SR);
  const out = new Float32Array(n);
  const maxK = Math.floor(SR / 2 / freq);
  const w = (2 * Math.PI * freq) / SR;
  for (let k = 1; k <= maxK; k++) {
    const a = amp(kind, k);
    if (a === 0) continue;
    for (let i = 0; i < n; i++) out[i] += a * Math.sin(w * k * i);
  }
  return normalizePeak(out, 0.9);
}

/** Residual between two renders, as a level in dBFS. */
function residualDb(a: Float32Array, b: Float32Array): number {
  assert.equal(a.length, b.length, 'renders must be the same length');
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return 10 * Math.log10(sum / a.length + 1e-30);
}

/** The floor of the format every clip is delivered in (encodeWav: 16-bit PCM). */
const SIXTEEN_BIT_FLOOR_DB = -96;

describe('classicWave — the wavetable renders the same waveform as the sum of sines', () => {
  // Long enough to take the TABLE path (a clip shorter than one table takes
  // the exact path instead, which is covered separately below).
  const CASES: [Kind, number][] = [
    ['saw', 65.41], // the mixing labs' bass root: 366 partials, the worst case
    ['saw', 130.81],
    ['saw', 440],
    ['square', 110],
    ['square', 523.25],
    ['triangle', 220],
  ];

  for (const [kind, freq] of CASES) {
    it(`${kind} at ${freq} Hz stays below the 16-bit floor`, () => {
      const db = residualDb(classicWave(kind, freq, 1), reference(kind, freq, 1));
      assert.ok(
        db < SIXTEEN_BIT_FLOOR_DB - 15,
        `residual ${db.toFixed(1)} dBFS must sit well under the ${SIXTEEN_BIT_FLOOR_DB} dBFS ` +
          'quantisation floor of the 16-bit PCM the clip ships as — otherwise the ' +
          'interpolation is audible in the delivered file',
      );
    });
  }

  it('the worst case across the set is 20 dB or more below the delivered floor', () => {
    let worst = -Infinity;
    for (const [kind, freq] of CASES) {
      worst = Math.max(worst, residualDb(classicWave(kind, freq, 1), reference(kind, freq, 1)));
    }
    assert.ok(
      worst < SIXTEEN_BIT_FLOOR_DB - 20,
      `worst residual ${worst.toFixed(1)} dBFS — the margin over the 16-bit floor has eroded; ` +
        'WAVE_TABLE_OVERSAMPLE is the knob, and its docblock carries the measurements',
    );
  });
});

describe('classicWave — clips too short to amortise a table take the exact path', () => {
  // The threshold is genuinely short (about 0.17 s for a 200 Hz note, 40 ms for
  // a high one), so this is a correctness fallback for tiny buffers rather than
  // the path the lab's own stimuli take. 0.02 s is below it at every frequency
  // used here.
  for (const kind of ['saw', 'square', 'triangle'] as const) {
    it(`a 20 ms ${kind} is bit-identical to the sum of sines`, () => {
      const a = classicWave(kind, 440, 0.02);
      const b = reference(kind, 440, 0.02);
      assert.equal(a.length, b.length);
      for (let i = 0; i < a.length; i++) {
        assert.equal(a[i], b[i], `sample ${i} differs — the short path must be the exact sum`);
      }
    });
  }
});

describe('classicWave — the parameters the labs actually ask for', () => {
  // Not invented cases: the ear lab's Noise & Waveform ID draws f0 from
  // 200–800 Hz at 0.8 s or 1.2 s (features/ear/modules/tone.ts), and the mixing
  // labs' bass root is C2 at 65.41 Hz. All of them take the table path.
  const REAL: [Kind, number, number][] = [
    ['square', 200, 0.8],
    ['saw', 200, 1.2],
    ['triangle', 800, 0.8],
    ['saw', 800, 1.2],
    ['saw', 65.41, 0.9],
  ];
  for (const [kind, freq, secs] of REAL) {
    it(`${kind} ${freq} Hz × ${secs}s renders below the delivered floor`, () => {
      const db = residualDb(classicWave(kind, freq, secs), reference(kind, freq, secs));
      assert.ok(
        db < SIXTEEN_BIT_FLOOR_DB - 15,
        `residual ${db.toFixed(1)} dBFS is not far enough under ${SIXTEEN_BIT_FLOOR_DB} dBFS`,
      );
    });
  }
});

describe('classicWave — the guarantees the lab states on screen', () => {
  it('is deterministic: the same request renders the same samples', () => {
    const a = classicWave('saw', 65.41, 1);
    const b = classicWave('saw', 65.41, 1);
    for (let i = 0; i < a.length; i++) assert.equal(a[i], b[i], `sample ${i} is not reproducible`);
  });

  it('a fundamental above Nyquist is silence, not an aliased tone', () => {
    const out = classicWave('saw', 30_000, 0.5);
    assert.equal(out.length, Math.round(0.5 * SR));
    for (let i = 0; i < out.length; i++) assert.equal(out[i], 0, `sample ${i} must be silent`);
  });

  it('peak-normalises to 0.9, so nothing clips on the way to 16-bit', () => {
    for (const [kind, freq] of [['saw', 65.41], ['square', 110], ['triangle', 220]] as const) {
      let peak = 0;
      const out = classicWave(kind, freq, 1);
      for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
      assert.ok(Math.abs(peak - 0.9) < 1e-3, `${kind} @ ${freq} peaked at ${peak.toFixed(4)}`);
    }
  });

  it('a zero-length request is an empty buffer, not a crash', () => {
    assert.equal(classicWave('saw', 440, 0).length, 0);
  });

  it('rendering one clip cannot change the next — no state leaks between calls', () => {
    // The sine table is shared and GROWS across calls. A low note allocates a
    // big one; the next note must read it correctly at its own resolution.
    const first = classicWave('saw', 440, 1);
    classicWave('saw', 30, 1); // forces a much larger shared table
    const second = classicWave('saw', 440, 1);
    for (let i = 0; i < first.length; i++) {
      assert.equal(first[i], second[i], `sample ${i} changed after a lower note was rendered`);
    }
  });
});
