/**
 * PERFORMANCE HUNT 2026-10-03 — AREA 5 (LABS B) receipts.
 *
 * Each block FAILS on HEAD 4201f49f and pins the faster structure:
 *
 *  1. Mastering LISTEN ▶: the true-peak estimate is table-driven (no
 *     Math.sin/Math.cos per sample) and BIT-IDENTICAL to the original.
 *  2. Drum Tuning ▶ STRIKE: the settled picture's clip is PRELOADED (WAV
 *     written + player loaded) before the press, silently, behind the gate's
 *     own state, never while a press is loading.
 *  3. Cymatics gallery: geometry cache is LRU and larger than a big library;
 *     artwork identity is kept for unchanged rows; one artwork read on arrival.
 *  4. Room Design TRACE: the pulse travels on a SharedValue (useAnimatedProps),
 *     not per-frame React state that re-rendered the whole plan.
 *  5. Wave Lab heat map: per-source constants prepared once per picture;
 *     every cell BIT-IDENTICAL to fieldDb(fieldAt(…)).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
/** Comments out, so a receipt is proven by code, not by its explanation. */
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

describe('1. Mastering: table-driven true peak, bit-identical', async () => {
  const eng = (await import('../src/screens/lab/mastering/masteringEngine.ts')) as Record<string, unknown>;
  const { truePeakDbEstimate } = await import('../src/screens/lab/mixing/engine/advanced.ts');

  it('measure() uses the prepared-table estimate', () => {
    const src = code(read('src/screens/lab/mastering/masteringEngine.ts'));
    assert.equal(typeof eng.truePeakDbFast, 'function', 'truePeakDbFast exported');
    assert.match(src, /const truePeakDb = truePeakDbFast\(s\);/);
    // The trig is hoisted out of the per-sample loop.
    const fast = src.slice(src.indexOf('export function truePeakDbFast'), src.indexOf('export function measure'));
    assert.doesNotMatch(fast, /Math\.(sin|cos)\(/, 'no trig per sample');
  });

  it('every result equals the original, bit for bit (edges, clipping, silence)', () => {
    const fast = eng.truePeakDbFast as (s: { l: Float32Array; r: Float32Array }) => number;
    const mk = (n: number, f: (i: number) => number, g: (i: number) => number) => {
      const l = new Float32Array(n);
      const r = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        l[i] = f(i);
        r[i] = g(i);
      }
      return { l, r };
    };
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
    const cases = [
      mk(0, () => 0, () => 0),
      mk(1, () => 0.5, () => -0.5),
      mk(5, (i) => (i % 2 ? 1 : -1), () => 0.2),
      mk(9000, (i) => Math.sin(i * 0.31), (i) => 0.9 * Math.sin(i * 0.77 + 1)),
      mk(9000, (i) => Math.max(-0.8, Math.min(0.8, 1.6 * Math.sin(i * 0.05))), () => rnd()),
      mk(4000, () => 0, () => 0),
    ];
    for (const c of cases) assert.ok(Object.is(fast(c), truePeakDbEstimate(c)), `length ${c.l.length}`);
  });

  it('is several times faster on a 2 s stereo buffer', () => {
    const n = 88200;
    const l = new Float32Array(n);
    const r = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      l[i] = Math.sin(i * 0.013) * 0.7 + Math.sin(i * 0.41) * 0.2;
      r[i] = Math.sin(i * 0.017) * 0.6;
    }
    const fast = eng.truePeakDbFast as (s: { l: Float32Array; r: Float32Array }) => number;
    const time = (fn: () => void) => {
      const t = performance.now();
      fn();
      return performance.now() - t;
    };
    fast({ l, r });
    truePeakDbEstimate({ l, r });
    const tFast = Math.min(time(() => fast({ l, r })), time(() => fast({ l, r })));
    const tOld = Math.min(time(() => truePeakDbEstimate({ l, r })), time(() => truePeakDbEstimate({ l, r })));
    assert.ok(tOld / tFast > 3, `old ${tOld.toFixed(1)} ms vs fast ${tFast.toFixed(1)} ms`);
  });
});

describe('2. Drum Tuning: the settled clip is preloaded before ▶', () => {
  const src = code(read('src/screens/lab/drumtuning/useDrumPlayback.ts'));

  it('a settled picture schedules a silent preload', () => {
    assert.match(src, /if \(!draw \|\| !rendered \|\| rendered\.key !== keyRef\.current\) return;\s*const t = setTimeout\(\(\) => preloadRef2\.current\(\), 250\);/);
    assert.match(src, /const load = useCallback\(async \(quiet = false\): Promise<boolean> => \{\s*if \(!quiet\) pressLoadsRef\.current\+\+;\s*try \{\s*return await loadBody\(quiet\);\s*\} finally \{\s*if \(!quiet\) pressLoadsRef\.current--;/);
    assert.match(src, /if \(!quiet\) \{\s*setStatus\('rendering'\);/, 'a preload never shows RENDERING');
    assert.match(src, /p: load\(true\)\.catch\(\(\) => false\)/);
  });

  it('the preload waits for the gate, the screen and any press', () => {
    const pre = src.slice(src.indexOf('const preload = useCallback'), src.indexOf('const preloadRef2'));
    assert.match(pre, /if \(!aliveRef\.current \|\| !focusedRef\.current \|\| hiddenRef\.current\) return;/);
    assert.match(pre, /if \(pressLoadsRef\.current > 0\) return;/);
    assert.match(pre, /if \(!isAudioOutputEnabled\(\) \|\| getLabPreview\(\)\.active\) return;/);
    assert.doesNotMatch(pre, /\.play\(/, 'a preload never plays');
  });

  it('▶ reuses a preload in flight and the fence stays', () => {
    assert.match(src, /if \(!quiet && inflight && inflight\.key === keyRef\.current\) await inflight\.p/);
    assert.match(src, /const fenced = await startFenced\(\{\s*start: load,/);
  });
});

describe('3. Cymatics gallery thumbnails', () => {
  const src = code(read('src/screens/lab/cymatics/GalleryScreen.tsx'));

  it('the geometry cache is least-recently-used and holds a large library', () => {
    const m = /export const GEOM_CACHE_MAX = (\d+);/.exec(src);
    assert.ok(m && Number(m[1]) >= 200, 'cap ≥ 200');
    assert.match(src, /if \(g\) \{\s*geomCache\.delete\(key\);\s*geomCache\.set\(key, g\);\s*return g;\s*\}/);
  });

  it('an unchanged artwork keeps its object (the memoised thumbnail does not redraw)', () => {
    assert.match(src, /if \(old && \(old === a \|\| JSON\.stringify\(old\) === JSON\.stringify\(a\)\)\) next\[a\.patternId\] = old;/);
    assert.match(src, /return same \? prev : next;/);
  });

  it('artwork is read once on arrival (the focus effect), not twice', () => {
    assert.doesNotMatch(src, /useEffect\(\(\) => \{\s*void loadArt\(\);\s*\}, \[loadArt\]\);/);
    assert.match(src, /useFocusEffect\(\s*useCallback\(\(\) => \{\s*void reload\(\);\s*void loadArt\(\);/);
  });
});

describe('4. Room Design TRACE runs on a SharedValue', () => {
  const ex = code(read('src/screens/lab/roomdesign/modules/modExplore.tsx'));
  const plan = code(read('src/screens/lab/roomdesign/RoomPlanView.tsx'));

  it('no React state per frame', () => {
    const step = ex.slice(ex.indexOf('const step = () =>'), ex.indexOf('step();'));
    assert.doesNotMatch(step, /setTraceState/, 'the frame loop never sets React state');
    assert.match(step, /traceProgress\.value = p;/);
    assert.match(ex, /\{ index: tracedIndex, progress: traceProgress \}/);
  });

  it('the plan moves the pulse with animated props', () => {
    assert.match(plan, /export type Trace = \{ index: number; progress: SharedValue<number> \} \| null;/);
    assert.match(plan, /const ACircle = Animated\.createAnimatedComponent\(Circle\);/);
    assert.match(plan, /<ACircle animatedProps=\{dot\}/);
  });
});

describe('5. Wave Lab heat map: prepared field, bit-identical', async () => {
  const W = await import('../src/screens/lab/wave/waveEngine.ts');

  it('vizWave builds the heat from the prepared field', () => {
    const viz = code(read('src/screens/lab/wave/vizWave.tsx'));
    assert.match(viz, /const field = prepareField\(scene, freq, images\);/);
    assert.match(viz, /const db = fieldDbPrepared\(field, mx, my\);/);
  });

  it('every cell equals fieldDb(fieldAt(…)) bit for bit (speakers, points, subs, muted, polarity, openings)', () => {
    const src = (id: string, x: number, y: number, kind: string, extra: object = {}) =>
      ({ id, x, y, freq: 500, levelDb: -3, delayMs: 0.3, polarity: 1, kind, aimDeg: 20, coverageDeg: 90, ...extra }) as never;
    const scenes = [
      { w: 8, h: 6, boundary: ['concrete', 'drywall', 'carpet', 'open'], sources: [src('a', 3, 1, 'speaker'), src('b', 5, 1, 'point', { polarity: -1, delayMs: 1.7 }), src('c', 4, 2, 'sub', { muted: true })], listener: { x: 4, y: 4 }, tempC: 23 },
      { w: 12, h: 9, boundary: ['foam', 'glass', 'wood', 'audience'], sources: [src('a', 2, 8, 'speaker', { aimDeg: 170, coverageDeg: 40 }), src('b', 10, 1, 'speaker', { aimDeg: -60 })], listener: { x: 6, y: 4 }, tempC: 5 },
    ] as never[];
    for (const scene of scenes as { w: number; h: number; sources: unknown[] }[]) {
      for (const freq of [63, 500, 4000]) {
        const images = scene.sources.map((s) => W.imageSources(scene as never, s as never, freq, 2));
        const prep = W.prepareField(scene as never, freq, images);
        for (let r = 0; r < 23; r++) {
          for (let c = 0; c < 29; c++) {
            const x = ((c + 0.5) / 29) * scene.w;
            const y = ((r + 0.5) / 23) * scene.h;
            assert.ok(Object.is(W.fieldDbPrepared(prep, x, y), W.fieldDb(W.fieldAt(scene as never, x, y, freq, images))), `${freq} Hz @ ${x},${y}`);
          }
        }
      }
    }
  });
});
