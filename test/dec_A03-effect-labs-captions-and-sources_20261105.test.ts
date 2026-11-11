/**
 * Audit decisions 2, 4, 20, 21 and 23 (2026-11-05): five effect-lab controls a
 * learner could not see or hear. fxLabConfigs and fxAnim cannot be imported
 * under node, so their functions are lifted out and RUN, as in
 * early_G2-fx-labs_20261105.test.ts. Decision 4's numbers re-run the engine's
 * own distortion path (Effects.hpp DistortionEffect) sample by sample.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const CFG = read('src/screens/lab/fxLabConfigs.tsx');
const ANIM = read('src/screens/lab/fxAnim.tsx');
const SCREEN = read('src/screens/lab/FxLabScreen.tsx');
const PLAY = read('src/screens/lab/foundations/FoundationsPlaygroundScreen.tsx');
const ENGINE = read('modules/ape-dsp/ios/core/Effects.hpp');
const guide = (f: string) => read(`src/screens/lab/${f}`);

const configOf = (name: string) => {
  const from = CFG.indexOf(`const ${name}: FxLabConfig = {`);
  assert.ok(from >= 0, name);
  return CFG.slice(from, CFG.indexOf('\n};\n', from));
};
/** The source of a top-level function or const, with its types removed. */
function lift(src: string, name: string): string {
  const m = src.match(new RegExp(`(?:export )?function ${name}\\([\\s\\S]*?\\n\\}\\n`));
  assert.ok(m, `${name} not found`);
  return m[0]
    .replace(/^export /, '')
    .replace(/\): (number|string|number\[\]) \{/, ') {')
    .replace(/: (number|Record<number, number>|FxSourceSpec)(?=[,)])/g, '');
}
const run = <T,>(body: string, ...args: [string, unknown][]): T =>
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function(...args.map((a) => a[0]), body)(...args.map((a) => a[1])) as T;

describe('decision 2: the gate sends the ear to PINK NOISE', () => {
  const gate = configOf('gateConfig');
  it('the CLICK caption no longer promises chatter it cannot play', () => {
    assert.doesNotMatch(gate, /stops chattering/);
    assert.match(gate, /only a 5 ms click, so RANGE, HOLD and RELEASE barely change/);
    assert.match(gate, /to hear those three, choose PINK NOISE/);
  });
  it('choosing PINK NOISE says where those three can be heard', () => {
    const body = gate.match(/captionExtra: \(_v, src\) =>\n([\s\S]*?),\n {2}sources:/)?.[1];
    assert.ok(body);
    const extra = run<(v: unknown, s: { label: string }) => string>(`return (_v, src) => ${body};`);
    assert.match(extra({}, { label: 'PINK NOISE' }), /THRESH near its level and the gate should flutter \(chatter\): hear RANGE, HOLD and RELEASE there\./);
    assert.equal(extra({}, { label: 'CLICK 90' }), '');
  });
  it('the source order stays, and the guide says the same outside TRY THIS', () => {
    assert.match(gate, /sources: \[srcClick\(90\), SRC_PINK\]/);
    // 2026-11-08 (Comp B rewrite): same fact, the guide's new words.
    assert.match(guide('gateScreenGuides.ts'), /SOURCE: CLICK 90 or PINK NOISE\. The click lasts only 5 ms, so RANGE, HOLD and RLS show on GR but you barely hear them\. To hear them, use PINK NOISE/);
  });
});

describe('decision 4: OVERSAMPLING has a source that reveals it', () => {
  const dist = configOf('distConfig');

  /** Effects.hpp DistortionEffect at 48 kHz, one channel: a −20 dBFS sine in. */
  function distort(hz: number, driveDb: number, oversample: boolean): number[] {
    const fs = 48000;
    const lp = () => {
      const w = (2 * Math.PI * fs * 0.45) / (fs * 4), c = Math.cos(w), al = Math.sin(w) / (2 * 0.707), a0 = 1 + al;
      return { b0: (1 - c) / 2 / a0, b1: (1 - c) / a0, b2: (1 - c) / 2 / a0, a1: (-2 * c) / a0, a2: (1 - al) / a0, z1: 0, z2: 0 };
    };
    const step = (b: ReturnType<typeof lp>, x: number) => {
      const y = b.b0 * x + b.z1;
      b.z1 = b.b1 * x - b.a1 * y + b.z2;
      b.z2 = b.b2 * x - b.a2 * y;
      return y;
    };
    const f1 = lp(), f2 = lp();
    const shape = (x: number) => Math.max(-1, Math.min(1, x));
    const drive = 10 ** (driveDb / 20);
    const R1 = 1 - (2 * Math.PI * 10) / fs;
    let prev = 0, dcX = 0, dc = 0;
    const out: number[] = [];
    for (let i = -24000; i < 4800; i++) {
      const x = 0.1 * Math.sin((2 * Math.PI * hz * i) / fs);
      let y = 0;
      if (oversample) for (let k = 1; k <= 4; k++) y = step(f2, step(f1, shape((prev + ((x - prev) * k) / 4) * drive)));
      else y = shape(x * drive);
      prev = x;
      const h = y - dcX + R1 * dc;
      dcX = y;
      dc = h;
      if (i >= 0) out.push(h);
    }
    return out;
  }
  /** Total level of the lines at multiples of 1 kHz that are not multiples of 5 kHz. */
  function foldedDb(sig: number[]): number {
    const N = sig.length;
    let sum = 0;
    for (let f = 1000; f <= 20000; f += 1000) {
      if (f % 5000 === 0) continue;
      let re = 0, im = 0;
      for (let i = 0; i < N; i++) {
        const a = (2 * Math.PI * f * i) / 48000;
        re += sig[i] * Math.cos(a);
        im += sig[i] * Math.sin(a);
      }
      sum += ((2 * Math.hypot(re, im)) / N) ** 2;
    }
    return 10 * Math.log10(sum + 1e-30);
  }

  it('the path re-run here is the engine’s', () => {
    assert.match(ENGINE, /up1_\[c\] = Biquad::lowpass\(fs_ \* 0\.45, 0\.707, fs_ \* 4\.0\);/);
    assert.match(ENGINE, /for \(int k = 1; k <= 4; \+\+k\)[\s\S]*?const double xi = \(x0 \+ \(x1 - x0\) \* t\) \* drive;/);
    assert.match(ENGINE, /out = s; {2}\/\/ take the last \(filtered\) sub-sample = decimation/);
  });
  it('at 5 kHz, HARD CLIP’s folded tones are about 20 dB apart, as the comments and caption say', () => {
    const at = (drive: number, os: boolean) => foldedDb(distort(5000, drive, os));
    assert.ok(Math.abs(at(24, false) - -28.8) < 1, `${at(24, false)}`);
    assert.ok(Math.abs(at(24, true) - -46.4) < 1, `${at(24, true)}`);
    assert.ok(Math.abs(at(36, false) - -14.3) < 1, `${at(36, false)}`);
    assert.ok(Math.abs(at(36, true) - -35.5) < 1, `${at(36, true)}`);
    assert.ok(at(36, true) - at(36, false) < -20);
  });
  it('the source is the generator’s own sine, between the two that were there', () => {
    assert.match(dist, /sources: \[srcSine\(220\), SRC_SINE_5K, SRC_PINK\]/);
    assert.match(CFG, /const DIST_OS_HZ = 5000;/);
    assert.match(CFG, /const SRC_SINE_5K = \{\n {2}\.\.\.srcSine\(DIST_OS_HZ\),/);
  });
  it('the caption names the source, and moves with the OS key', () => {
    const P = { oversample: 1 };
    const caption = run<(v: Record<number, number>, src: { gen: { frequency?: number } }) => string>(
      `const DIST_OS_HZ = 5000;\n${lift(CFG, 'distOsCaption')}\nreturn distOsCaption;`,
      ['P', P],
    );
    const hi = { gen: { frequency: 5000 } };
    assert.match(caption({ 1: 1 }, { gen: { frequency: 220 } }), /barely shows on this source: choose SINE 5 kHz/);
    assert.match(caption({ 1: 1 }, { gen: {} }), /choose SINE 5 kHz/);
    assert.match(caption({ 1: 1 }, hi), /^OS ON \(CLEAN\):.*try OS OFF \(ALIASING\)/);
    assert.match(caption({ 1: 0 }, hi), /^OS OFF \(ALIASING\):.*not harmonics of 5 kHz, so this should sound rougher/);
    assert.notEqual(caption({ 1: 1 }, hi), caption({ 1: 0 }, hi));
    assert.match(dist, /captionExtra: distOsCaption,/);
  });
  it('the screen prints the extra words after the source’s own', () => {
    assert.match(SCREEN, /const sourceCaption = config\.exploreCaptionBySource\?\.\[sources\[sourceIdx\]\?\.label\] \?\? config\.exploreCaption;/);
    assert.match(SCREEN, /const captionExtra = config\.captionExtra\?\.\(values, sources\[sourceIdx\]\);/);
    assert.match(SCREEN, /exploreCaption=\{captionExtra \? `\$\{sourceCaption\} \$\{captionExtra\}` : sourceCaption\}/);
  });
  it('the drawing stays the sine it says it is, and the guide stays true', () => {
    const flow = ANIM.slice(ANIM.indexOf('function DistFlow'), ANIM.indexOf('const STEREO_A'));
    assert.match(flow, /'IN = −20 dBFS sine'/);
    assert.doesNotMatch(flow, /\bsrc\b/);
    const g = guide('distortionScreenGuides.ts');
    // 2026-11-08 (Comp B rewrite): same facts, the guide's new words ("it isn’t drawn" = sound only).
    assert.match(g, /SOURCE picks SINE 220 Hz, 5 kHz or PINK NOISE\./);
    assert.match(g, /OS \(oversampling\) picks ON \(CLEAN\) or OFF \(ALIASING\): heard on SINE 5 kHz,/);
    assert.match(g, /OS \(oversampling\) picks [^.]*, not drawn\./);
    assert.match(g, /takes it\), so no TRY THIS asks the learner to SEE it/);
  });
});

describe('decision 20: RATIO and THRESH show on the compressor’s CLICK', () => {
  // The constants and functions fxAnim runs, lifted and run together.
  const tools = run<{
    peak: (thr: number, ratio: number, atk: number, rel: number, period: number) => number;
    step: (env: number, u: number, span: number, period: number, aA: number, aR: number, rel: number) => number[];
    gr: (env: number, thr: number, ratio: number) => number;
  }>(
    [
      'const DYN_PEAK_DB = -20, PING_MS = 5, PING_DT = 1000 / 48000, PING_N = 240;',
      'const PING_PEAK = Math.pow(10, DYN_PEAK_DB / 20);',
      lift(ANIM, 'dynPingAbs'),
      lift(ANIM, 'dynPingStep'),
      lift(ANIM, 'dynGrDb'),
      lift(ANIM, 'dynPingGrPeakDb'),
      'return { peak: dynPingGrPeakDb, step: dynPingStep, gr: dynGrDb };',
    ].join('\n'),
  );
  const start = (ratio = 4, thr = -40) => tools.peak(thr, ratio, 5, 120, 500);

  it('CLICK stays the first source', () => {
    assert.match(configOf('compConfig'), /sources: \[srcClick\(120\), srcSine\(440\), SRC_PINK\]/);
  });
  it('the opening setting reads the kick the meter measures', () => {
    assert.ok(Math.abs(start() - 5.5) < 0.05, `${start()}`);
  });
  it('RATIO and THRESH each change the depth by more than a pixel of the strip', () => {
    const pxPerDb = Number(ANIM.match(/const GR_TRACE_H = (\d+);/)?.[1]) / Number(ANIM.match(/const GR_TRACE_MAX_DB = (\d+);/)?.[1]);
    const depths = [2, 4, 8, 20].map((r) => start(r));
    for (let i = 1; i < depths.length; i++) assert.ok((depths[i] - depths[i - 1]) * pxPerDb > 0.5, `${depths}`);
    assert.ok((depths[3] - depths[0]) * pxPerDb > 3, `${depths}`);
    assert.ok((start(4, -50) - start(4, -40)) * pxPerDb > 5);
  });
  it('a click under the threshold hangs nothing', () => {
    assert.equal(start(4, -30), 0);
    assert.equal(tools.peak(-40, 4, 25, 120, 500), 0);
  });
  it('the deepest kick the fader reaches at the opening ATTACK fits the scale', () => {
    assert.ok(tools.peak(-50, 20, 5, 120, 500) <= Number(ANIM.match(/const GR_TRACE_MAX_DB = (\d+);/)?.[1]));
  });
  it('the strip walks the same train as the readout', () => {
    const aA = 1 - Math.exp(-(1000 / 48000) / 5), aR = 1 - Math.exp(-(1000 / 48000) / 120);
    let env = 0, u = 0, top = 0;
    for (let k = 0; k < 400; k++) {
      const r = tools.step(env, u, 5.7, 500, aA, aR, 120);
      env = r[0];
      u = (u + 5.7) % 500;
      if (k > 200) top = Math.max(top, tools.gr(r[1], -40, 4));
    }
    assert.ok(Math.abs(top - start()) < 0.05, `${top}`);
  });
  it('it is drawn on the compressor’s click alone, with a readout that fits', () => {
    const flow = ANIM.slice(ANIM.indexOf('function DynamicsFlow'), ANIM.indexOf('function distCycle'));
    assert.match(flow, /\{ping \? <Path path=\{grPath\} color=\{AMBER\} opacity=\{0\.45\} \/> : null\}/);
    assert.match(flow, /if \(!ping\) return p;/);
    assert.match(flow, /\{\.\.\.fitValue\(10 \* ts\)\}/);
    assert.match(flow, /`GR PEAK \$\{grPeakDb\.toFixed\(1\)\} dB`/);
    assert.match(guide('compressionScreenGuides.ts'), /the amber strip under OUT is the drawing’s GR: THRESH and RATIO change how deep it hangs/);
    assert.match(configOf('compConfig'), /RATIO and THRESH change how deep it hangs/);
  });
});

describe('decision 21: chorus VOICE DELAY points at PINK NOISE', () => {
  it('the caption and the guide say so, and only as far as is known', () => {
    assert.match(configOf('chorusConfig'), /Compare VOICE DELAY on PINK NOISE: on a sine, each setting should sound the same\./);
    assert.match(guide('chorusScreenGuides.ts'), /Compare DELAY on PINK NOISE: on a sine, each setting should sound the same\./);
    assert.match(configOf('chorusConfig'), /sources: \[srcSine\(440\), SRC_PINK\]/);
  });
});

describe('decision 23: the Foundations Playground shares the Equalizer’s fix', () => {
  it('bands 1 to 5 go off before band 0 is written, from the one list', () => {
    assert.match(CFG, /export const EQ_OTHER_BANDS_OFF = \[1, 2, 3, 4, 5\]/);
    assert.match(PLAY, /import \{ EQ_OTHER_BANDS_OFF \} from '\.\.\/fxLabConfigs';/);
    const body = PLAY.match(/if \(eqCut > 0\) \{\n([\s\S]*?)\n {4}\} else \{/)?.[1] ?? '';
    const writes: string[] = [];
    const FX = { eq: 'eq' };
    const FX_PARAM = { enabled: 'on', eqBand: (b: number, f: string) => `${b}.${f}` };
    const ApeDsp = { fxSet: (_n: string, id: string) => writes.push(id) };
    const list = [1, 2, 3, 4, 5].map((b) => ({ paramId: `${b}.type`, value: 0 }));
    run(body, ['EQ_OTHER_BANDS_OFF', list], ['ApeDsp', ApeDsp], ['FX', FX], ['FX_PARAM', FX_PARAM], ['EQ_BAND_TYPES', { lowPass: 5 }], ['eqCut', 800], ['eqQ', 1]);
    assert.deepEqual(writes.slice(0, 6), ['1.type', '2.type', '3.type', '4.type', '5.type', '0.type']);
    assert.equal(writes.at(-1), 'on');
  });
  it('the route stays lazy, so the start graph does not grow', () => {
    assert.match(read('src/navigation/RootNavigator.tsx'), /FoundationsPlayground: lazyScreen\(\(\) => orient\(require\('\.\.\/screens\/lab\/foundations\/FoundationsPlaygroundScreen'\)/);
  });
});
