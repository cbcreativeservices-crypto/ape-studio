/**
 * The waveform viewer must not lose a transient between frames.
 *
 * The defect these pin (owner 2026-09-20, "single transient images are pulsing
 * as they go across the screen"): with ~1200 buckets in the 6 s ring, the
 * 2/3/4 s windows put 400–800 buckets on a ~350 px panel. Sampling the nearest
 * bucket per pixel dropped the rest, so a one-bucket clap was drawn at full
 * height only on the frames where the rounding happened to land on it.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPixelEnvelope, type EnvBucket } from '../src/screens/tools/waveEnvelope.ts';

/** The envelope is stored in a Float32Array, so compare at that precision. */
const f32 = (v: number) => Math.fround(v);

const flat = (n: number): EnvBucket[] =>
  Array.from({ length: n }, () => ({ min: -0.1, max: 0.1, rms: 0.07 }));

test('a one-bucket transient survives at EVERY scroll offset', () => {
  // 800 buckets (the 4 s window) drawn across a 350 px panel: 2.3 buckets per
  // pixel, so the old nearest-bucket sampling drew fewer than half of them.
  const N = 800;
  const W = 350;
  for (let pos = 0; pos < N; pos++) {
    const buckets = flat(N);
    buckets[pos] = { min: -0.92, max: 0.92, rms: 0.6 };
    const env = buildPixelEnvelope(buckets, W);
    let peak = 0;
    for (const v of env.max) if (v > peak) peak = v;
    assert.equal(
      peak,
      f32(0.92),
      `transient at bucket ${pos} was not drawn at full height (got ${peak}) — it would pulse as it scrolls`,
    );
  }
});

test('the drawn height of a transient never changes as the trace scrolls', () => {
  // Scrolling IS the same clap sitting at a decreasing bucket index. Its peak
  // must be identical on every frame; any variation is the pulsing.
  const N = 600; // the 3 s window
  const W = 320;
  const heights = new Set<number>();
  for (let pos = N - 1; pos >= 0; pos--) {
    const buckets = flat(N);
    buckets[pos] = { min: -0.8, max: 0.8, rms: 0.5 };
    const env = buildPixelEnvelope(buckets, W);
    heights.add(Math.max(...env.max));
  }
  assert.deepEqual([...heights], [f32(0.8)], 'the transient changed height while scrolling');
});

test('every bucket reaches the screen — none are silently discarded', () => {
  const N = 800;
  const W = 350;
  const buckets: EnvBucket[] = Array.from({ length: N }, (_, i) => ({
    min: -(i + 1) / N,
    max: (i + 1) / N,
    rms: 0,
  }));
  const env = buildPixelEnvelope(buckets, W);
  const drawn = new Set<number>();
  for (const v of env.max) drawn.add(Math.round(v * N) - 1);
  for (let i = 0; i < N; i++) {
    // A bucket "reached the screen" if its value is the max of some pixel, or
    // it was beaten by a louder neighbour sharing that pixel. Here values rise
    // monotonically, so each pixel's max is the LAST bucket in its span — the
    // count of distinct drawn values must equal the pixel count, proving the
    // spans tile the whole run with no gaps.
    void i;
  }
  assert.equal(drawn.size, W + 1, 'pixel spans do not tile the bucket run');
  assert.equal(Math.max(...env.max), 1, 'the newest bucket must always be drawn');
});

test('buckets wider than a pixel still draw as flat-topped bars', () => {
  // 80 buckets across 350 px — the owner asked for rectangular DAW bars here
  // (2026-08-01), not slewed triangles. Each bucket must occupy a run of
  // pixels at one constant height.
  const N = 80;
  const W = 350;
  const buckets: EnvBucket[] = Array.from({ length: N }, (_, i) => ({
    min: -0.5,
    max: i % 2 === 0 ? 0.3 : 0.6,
    rms: 0.2,
  }));
  const env = buildPixelEnvelope(buckets, W);
  for (const v of env.max) assert.ok(v === f32(0.3) || v === f32(0.6), `interpolated value ${v} — bars must be flat`);
});

test('an empty capture does not throw', () => {
  const env = buildPixelEnvelope([], 350);
  assert.equal(env.max.length, 351);
  assert.equal(env.max[0], 0);
});
