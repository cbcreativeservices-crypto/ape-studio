/**
 * PERFORMANCE HUNT — AREA 4 (LABS A), 2026-10-03.
 *
 * One receipt per fix. Every test below FAILED against the HEAD (4201f49f)
 * files — each edited file copied aside, `git show HEAD:<path>` written back,
 * this file run, the copies restored and checked with cmp.
 *
 *  1. Tube cards: a good signed URL is remembered (90 s, shared in-flight), so
 *     the neighbour warm-up and the viewer ask for the SAME URL and the
 *     prefetched image is actually the one shown; RETRY still asks afresh.
 *  2. Tube cards render through expo-image (memory + disk cache) and prefetch
 *     into that same cache.
 *  3. Tube Reference: a member's touch-down on a row starts the card's URL
 *     fetch + image download before the viewer opens.
 *  4. Signal Chain / FX labs: the 20 Hz gain-reduction poll no longer
 *     re-renders the whole lab for a move the 0.1 dB meters cannot show.
 *  5. ControlSlider: a drag frame that stays on the same step no longer calls
 *     onChange (each call rebuilt the page state); touch-down always reports.
 *  6. Lab photos (mic, connector, lab photo tiles + lightboxes): expo-image
 *     with a memory + disk cache instead of react-native Image.
 *  7. Photos a chip or bench card can reveal are prefetched when the lesson /
 *     page opens (cable lessons 3/5/6/7, recognition strips, connector bench +
 *     job matrix, all twelve mic photos).
 *  8. Mixing labs: once the stems are warm and sound is on, a page's A/B set
 *     is rendered + loaded quietly after the page settles, so ▶ plays at once
 *     instead of waiting through RENDERING. Never plays on its own.
 *  9. Advanced Mixing MEASURE THE MIX: true peak through precomputed sinc and
 *     window tables (mirrors Labs B's Mastering truePeakDbFast) — bit-identical
 *     to truePeakDbEstimate, ~12x faster in Node.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const rnImport = (s: string) => {
  const m = s.match(/import\s*\{([^}]*)\}\s*from 'react-native';/);
  return m ? m[1] : '';
};

describe('1. Tube cards: one signed URL serves the warm-up and the viewer', () => {
  const refs = src('src/screens/lab/tube/tubeRefs.ts');
  it('remembers a good URL for less than its 120 s life and shares in-flight asks', () => {
    assert.match(refs, /export function fetchTubePageCached\(/);
    assert.match(refs, /const TUBE_URL_TTL_MS = 90_000;/);
    assert.match(refs, /tubeUrlInflight\.get\(key\)/);
    // Only an 'ok' answer is remembered; a failure is never cached.
    assert.match(refs, /if \(r\.url\) tubeUrlMemo\.set\(key,[\s\S]*?else tubeUrlMemo\.delete\(key\);/);
  });
  it('the neighbour warm-up goes through the memo', () => {
    const fn = refs.slice(refs.indexOf('export async function fetchTubePageUri('));
    assert.match(fn.slice(0, 200), /await fetchTubePageCached\(stem, page\)/);
  });
  it('the viewer reads the memo, and RETRY asks the server afresh', () => {
    const s = src('src/screens/lab/tube/TubeCardScreen.tsx');
    assert.match(s, /fetchTubePageCached\(tube\.stem, page, \{ fresh \}\)/);
    assert.match(s, /const fresh = retryKey !== lastRetryRef\.current;/);
    assert.ok(!/\bfetchTubePage\(tube\.stem/.test(s), 'the viewer still bypasses the memo');
  });
});

describe('2. Tube cards: expo-image with a memory + disk cache', () => {
  const s = src('src/screens/lab/tube/TubeCardScreen.tsx');
  it('renders and prefetches through expo-image', () => {
    assert.match(s, /import \{ Image \} from 'expo-image';/);
    assert.ok(!/\bImage\b/.test(rnImport(s)), 'react-native Image is still imported');
    assert.match(s, /cachePolicy="memory-disk"/);
    assert.match(s, /Image\.prefetch\(u, 'memory-disk'\)/);
  });
});

describe('3. Tube Reference: warm the card on touch-down', () => {
  const s = src('src/screens/lab/tube/TubeReferenceScreen.tsx');
  it('a member row warms page 1 on press-in', () => {
    assert.match(s, /onPressIn=\{\(\) => warmTube\(r\)\}/);
    const fn = s.slice(s.indexOf('const warmTube'));
    assert.match(fn.slice(0, 300), /if \(gate !== 'open'\) return;/);
    assert.match(fn.slice(0, 300), /fetchTubePageUri\(r\.stem, 1\)/);
  });
});

describe('4. GR polls skip invisible moves', () => {
  it('Signal Chain keeps the same state object when nothing moved', () => {
    const s = src('src/screens/lab/SignalChainLabScreen.tsx');
    assert.match(s, /setGr\(\(prev\) => \(grMoved\(prev, g\) \? g : prev\)\)/);
    assert.ok(!/if \(g\) setGr\(g\);/.test(s));
  });
  it('FX lab bails out under 0.05 dB', () => {
    const s = src('src/screens/lab/FxLabScreen.tsx');
    assert.match(s, /setGrDb\(\(prev\) => \(Math\.abs\(prev - v\) < 0\.05 \? prev : v\)\)/);
    assert.ok(!/if \(g\) setGrDb\(g\[config\.pollGr!\]\);/.test(s));
  });
});

describe('5. ControlSlider drops same-step drag frames', () => {
  const s = src('src/screens/lab/amp/kit.tsx');
  it('dedupes moves, always reports the touch-down', () => {
    assert.match(s, /if \(!always && next === valueRef\.current\) return;/);
    assert.match(s, /onPanResponderGrant: \(e\) => setRef\.current\(e\.nativeEvent\.locationX, true\)/);
    assert.match(s, /onPanResponderMove: \(e\) => setRef\.current\(e\.nativeEvent\.locationX\),/);
  });
});

describe('6. Lab photos render through expo-image', () => {
  for (const p of [
    'src/screens/lab/micselect/micArt.tsx',
    'src/screens/lab/labPhoto.tsx',
    'src/screens/lab/cable/lessons/connectorCard.tsx',
    'src/screens/lab/connectorselect/bits.tsx',
  ]) {
    it(p, () => {
      const s = src(p);
      assert.match(s, /import \{ Image \} from 'expo-image';/);
      assert.ok(!/\bImage\b/.test(rnImport(s)), 'react-native Image is still imported');
      assert.ok(!/resizeMode=/.test(s), 'an RN resizeMode is left');
      assert.match(s, /cachePolicy="memory-disk"/);
    });
  }
});

describe('7. Photos a tap can reveal are prefetched', () => {
  it('cable: the card, the recognition strip and the lesson chip rows', () => {
    const card = src('src/screens/lab/cable/lessons/connectorCard.tsx');
    assert.match(card, /export function usePrefetchConnectorImages\(/);
    assert.match(card, /Image\.prefetch\(urls, 'memory-disk'\)/);
    assert.match(card, /usePrefetchConnectorImages\(\[rec\.id\]\);/);
    assert.match(card, /usePrefetchConnectorImages\(rec\.map\(\(r\) => r\.id\)\);/);
    assert.match(src('src/screens/lab/cable/lessons/lesson03.tsx'), /usePrefetchConnectorImages\(L03_ENTRIES\.map/);
    assert.match(src('src/screens/lab/cable/lessons/lesson05.tsx'), /usePrefetchConnectorImages\(SPEAKER_CONNECTORS\.map/);
    assert.match(src('src/screens/lab/cable/lessons/lesson06.tsx'), /usePrefetchConnectorImages\(L06_GROUPS\.flatMap/);
    assert.match(src('src/screens/lab/cable/lessons/lesson07.tsx'), /usePrefetchConnectorImages\(\[\.\.\.POWER_GROUPS\.flatMap[\s\S]*?QP_CONNECTORS/);
  });
  it('connector select: both benches and the job matrix', () => {
    assert.match(src('src/screens/lab/connectorselect/bits.tsx'), /export function usePrefetchConnectorPhotos\(/);
    const a = src('src/screens/lab/connectorselect/pagesA.tsx');
    assert.equal(a.match(/usePrefetchConnectorPhotos\(group\.ids\);/g)?.length, 2);
    assert.match(src('src/screens/lab/connectorselect/pagesB.tsx'), /usePrefetchConnectorPhotos\(JOB_MATRIX\.map/);
  });
  it('mic select: all twelve photos when the lab opens', () => {
    assert.match(src('src/screens/lab/micselect/micImages.ts'), /export function allMicImageUrls\(\)/);
    assert.match(src('src/screens/lab/micselect/micArt.tsx'), /Image\.prefetch\(allMicImageUrls\(\), 'memory-disk'\)/);
  });
});

describe('8. Mixing: quiet pre-render once the stems are warm', () => {
  const s = src('src/screens/lab/mixing/kit.tsx');
  const pre = s.slice(s.indexOf('PRE-RENDER WHILE THE LEARNER READS'));
  const eff = pre.slice(0, pre.indexOf('const renderAll = useCallback'));
  it('gated on warm stems, focus, sound on and nothing in flight', () => {
    assert.match(src('src/screens/lab/mixing/audio/mixAudio.ts'), /export function sessionStemsWarm\(\): boolean/);
    assert.match(eff, /if \(!sessionStemsWarm\(\)\) return;/);
    assert.match(eff, /!aliveRef\.current \|\| !focusedRef\.current \|\| !isAudioOutputEnabled\(\)/);
    assert.match(eff, /idsRef\.current\.length > 0 \|\| renderingSigRef\.current !== null/);
    assert.match(eff, /void renderAllRef\.current\(true\);/);
    assert.match(s, /const PRERENDER_MS = 900;/);
  });
  it('never queues a play and stays silent to the screen reader', () => {
    assert.ok(!/pendingRef\.current =/.test(eff), 'the pre-render queues a play');
    assert.match(s, /if \(!quiet\) AccessibilityInfo\.announceForAccessibility\?\.\('Rendering the mix\.'\);/);
  });
});

describe('9. Advanced Mixing MEASURE: table-driven true peak, bit-identical', async () => {
  const adv = (await import('../src/screens/lab/mixing/engine/advanced.ts')) as Record<string, unknown>;
  const ref = adv.truePeakDbEstimate as (s: { l: Float32Array; r: Float32Array }) => number;
  const fast = adv.truePeakDbFast as (s: { l: Float32Array; r: Float32Array }) => number;
  const s = src('src/screens/lab/mixing/engine/advanced.ts');

  it('MEASURE THE MIX uses the prepared-table estimate; no trig per sample', () => {
    assert.equal(typeof fast, 'function', 'truePeakDbFast exported');
    assert.match(src('src/screens/lab/mixing/pagesAdvD.tsx'), /const tp = truePeakDbFast\(m\.stereo\);/);
    const body = s.slice(s.indexOf('export function truePeakDbFast'), s.indexOf('/* ── Stems & reconstruction'));
    assert.doesNotMatch(body, /Math\.(sin|cos)\(/);
  });

  it('every result equals the reference, bit for bit (edges, clipped, silent, noisy)', () => {
    const mk = (n: number, f: (i: number) => number, g: (i: number) => number) => {
      const l = new Float32Array(n);
      const r = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        l[i] = f(i);
        r[i] = g(i);
      }
      return { l, r };
    };
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
    const cases = [
      mk(0, () => 0, () => 0), // empty
      mk(1, () => 0.5, () => -0.5), // one sample: every tap is an edge
      mk(3, (i) => (i % 2 ? 1 : -1), () => 0.2), // shorter than the kernel
      mk(9, (i) => (i % 2 ? 1 : -1), (i) => (i % 3 ? 0.9 : -0.9)), // edge-dominated alternating
      mk(9000, (i) => Math.max(-1, Math.min(1, 3 * Math.sin(i * 0.05))), (i) => (i % 7 < 3 ? 1 : -1)), // clipped
      mk(4000, () => 0, () => 0), // silent
      mk(9000, () => rnd(), () => 0.5 * rnd()), // noisy
      mk(9000, (i) => Math.sin(i * 0.31), (i) => 0.9 * Math.sin(i * 0.77 + 1)), // inter-sample peaks
    ];
    for (const c of cases) assert.ok(Object.is(fast(c), ref(c)), `length ${c.l.length}`);
  });

  it('is several times faster on a 2 s stereo buffer', () => {
    const n = 88200;
    const l = new Float32Array(n);
    const r = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      l[i] = Math.sin(i * 0.013) * 0.7 + Math.sin(i * 0.41) * 0.2;
      r[i] = Math.sin(i * 0.017) * 0.6;
    }
    const time = (fn: () => void) => {
      const t = performance.now();
      fn();
      return performance.now() - t;
    };
    fast({ l, r });
    ref({ l, r });
    const tFast = Math.min(time(() => fast({ l, r })), time(() => fast({ l, r })));
    const tOld = Math.min(time(() => ref({ l, r })), time(() => ref({ l, r })));
    console.log(`true peak 2 s stereo: reference ${tOld.toFixed(1)} ms, fast ${tFast.toFixed(1)} ms (${(tOld / tFast).toFixed(1)}x)`);
    assert.ok(tOld / tFast > 3, `old ${tOld.toFixed(1)} ms vs fast ${tFast.toFixed(1)} ms`);
  });
});
