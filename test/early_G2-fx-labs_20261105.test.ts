/**
 * Early-lab audit, group G2 (2026-11-05): five effect-lab controls that did not
 * show what they promise. fxLabConfigs and fxAnim cannot be imported under node
 * (React Native, Skia), so their own functions are lifted out and RUN here, the
 * screenGuide_reverb idiom: the words and bands are checked, not just found.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const CFG = read('src/screens/lab/fxLabConfigs.tsx');
const ANIM = read('src/screens/lab/fxAnim.tsx');
const INDEX = read('modules/ape-dsp/index.ts');

/** The source of `function name(…) {…}`, with its type annotations removed. */
function lift(src: string, name: string): string {
  const m = src.match(new RegExp(`(?:export )?function ${name}\\([\\s\\S]*?\\n\\}\\n`));
  assert.ok(m, `${name} not found`);
  return m[0]
    .replace(/^export /, '')
    .replace(/v: Record<number, number>/, 'v')
    .replace(/\): (number|string) \{/, ') {')
    .replace(/:\s*number/g, '');
}

/** The real param ids, read from the engine map rather than restated. */
const num = (name: string) => Number(INDEX.match(new RegExp(`\\b${name}: (\\d+),`))?.[1]);
const P = {
  widthPct: num('widthPct'),
  pan: num('pan'),
  monoFold: num('monoFold'),
  bassMonoHz: num('bassMonoHz'),
  eqBand: (band: number, field: 'type' | 'freq' | 'q' | 'gain') => 100 + band * 10 + { type: 0, freq: 1, q: 2, gain: 3 }[field],
};
const OFF = Number(INDEX.match(/EQ_BAND_TYPES = \{\s*off: (\d+)/)?.[1]);

const configOf = (name: string) => {
  const from = CFG.indexOf(`const ${name}: FxLabConfig = {`);
  assert.ok(from >= 0, name);
  return CFG.slice(from, CFG.indexOf('\n};\n', from));
};
const run = <T,>(body: string, ...args: [string, unknown][]): T =>
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function(...args.map((a) => a[0]), body)(...args.map((a) => a[1])) as T;

describe('1. Equalizer Lab: the curve is the whole filter', () => {
  it('start switches off every band an EQ audition can leave behind', () => {
    const m = CFG.match(/const EQ_OTHER_BANDS_OFF = ([^;]+);/);
    assert.ok(m, 'the list of bands to switch off');
    assert.match(configOf('eqConfig'), /\n {2}fixed: EQ_OTHER_BANDS_OFF,/);
    const fixed = run<{ paramId: number; value: number }[]>(`return ${m[1]};`, ['P', P], ['EQ_BAND_TYPES', { off: OFF }]);

    // The engine as an audition leaves it (pushBands: six live peaks), then the
    // lab's start: `fixed`, then its own band 0 (FxLabScreen pushAllParams).
    const engine = new Map<number, number>();
    for (let b = 0; b < 6; b++) engine.set(P.eqBand(b, 'type'), 1);
    for (const f of fixed) engine.set(f.paramId, f.value);
    engine.set(P.eqBand(0, 'type'), 1);

    const live = [0, 1, 2, 3, 4, 5].filter((b) => engine.get(P.eqBand(b, 'type')) !== OFF);
    assert.deepEqual(live, [0], 'only the band the curve draws may stay live');
  });
});

describe('2 + 5. Stereo Imaging Lab: BASS-MONO and PAN are said and shown', () => {
  const body = configOf('stereoConfig').match(/heroCaption: \(v\) =>\n([\s\S]*?stereoCaptionExtras\(v\)),\n/)?.[1];
  assert.ok(body, 'the caption ends with its extras');
  const caption = run<(v: Record<number, number>) => string>(`${lift(CFG, 'stereoCaptionExtras')}\nreturn (v) => ${body};`, ['P', P]);
  const vals = (width: number, pan: number, bass: number, fold: number) => ({ [P.widthPct]: width, [P.pan]: pan, [P.bassMonoHz]: bass, [P.monoFold]: fold });

  it('off and centred, the caption is the one it always was', () => {
    assert.equal(caption(vals(100, 0, 0, 0)), 'The classic trade: width vs mono safety.');
  });
  it('BASS-MONO on tells the truth about what can change', () => {
    const c = caption(vals(100, 0, 120, 0));
    assert.match(c, /only content below 120 Hz changes/);
    assert.match(c, /nothing changes on the 440 Hz tone/);
    assert.match(c, /PINK NOISE · STEREO on headphones/);
    assert.match(c, /a phone speaker will not reproduce it/);
  });
  it('with no SIDE left, BASS-MONO does not promise a change', () => {
    for (const v of [vals(0, 0, 120, 0), vals(100, 0, 120, 1)]) {
      const c = caption(v);
      assert.match(c, /BASS-MONO changes nothing here/);
      assert.doesNotMatch(c, /headphones/);
    }
  });
  it('PAN off centre says the goniometer does not show it, both ways', () => {
    for (const pan of [-1, 1]) assert.match(caption(vals(100, pan, 0, 0)), /draws the width before the pan; the stage shows PAN/);
    assert.doesNotMatch(caption(vals(100, 0, 0, 0)), /the pan/);
  });
  it('the setting reaches the bezel and the stage', () => {
    const c = configOf('stereoConfig');
    assert.match(c, /\{ k: 'BASS', paramId: P\.bassMonoHz \}/);
    assert.match(c, /bassMonoHz: v\[P\.bassMonoHz\],/);
    assert.match(ANIM, /bassMonoHz=\{model\.bassMonoHz\}/);
    assert.match(ANIM, /const bassOn = flavor === 'width' && bassMonoHz > 0;/);
    assert.match(ANIM, /note=\{bassOn \? 'TONE 440 Hz: NO CHANGE'/);
    assert.match(ANIM, /text=\{`BASS-MONO \$\{bassMonoHz\} Hz`\}/);
  });
});

describe('3. Compression and Limiter: a steady source points at CLICK', () => {
  const noteBody = ANIM.match(/(sigKind === 1\n\s+\? mode === 'gate'[\s\S]*?BPM`);/)?.[1];
  const hit = (mode: string, sigKind: number) => {
    assert.ok(noteBody);
    return run<string>(`return ${noteBody.replace(/;$/, '')};`, ['mode', mode], ['sigKind', sigKind], ['ping', false], ['periodMs', 500]);
  };
  it('the glass note says TRY CLICK for the compressor and limiter, on both steady sources', () => {
    for (const mode of ['compressor', 'limiter']) for (const k of [1, 2]) assert.match(hit(mode, k), /TRY CLICK$/);
  });
  it('the note stays short enough to stop before the stage bar', () => {
    for (const mode of ['compressor', 'limiter']) for (const k of [1, 2]) assert.ok(hit(mode, k).length <= 17, hit(mode, k));
  });
  it('the gate keeps its own words, and a click is not told to try a click', () => {
    assert.equal(hit('gate', 1), 'STEADY TONE · −20 dBFS');
    assert.equal(hit('gate', 2), 'NOISE · PEAKS ≈ −20 dBFS');
    assert.doesNotMatch(hit('compressor', 0), /TRY CLICK/);
  });
  it('the words under the display name the transient, keyed on the real source labels', () => {
    for (const [name, control] of [['compConfig', 'ATK/REL'], ['limiterConfig', 'RLS']] as const) {
      const c = configOf(name);
      for (const label of ['SINE 440 Hz', 'PINK NOISE']) {
        const line = c.match(new RegExp(`'${label}': '([^']+)'`))?.[1];
        assert.ok(line, `${name} ${label}`);
        assert.ok(line.includes(control), line);
        assert.match(line, /transient/);
        assert.match(line, /CLICK 120/);
      }
      // `SINE ${hz} Hz` is what the screen looks the caption up by.
      assert.match(c, /sources: \[.*srcSine\(440\)/);
    }
    assert.match(CFG, /label: `SINE \$\{hz\} Hz`/);
  });
  it('the source orders stay as recorded', () => {
    assert.match(configOf('compConfig'), /sources: \[srcClick\(120\), srcSine\(440\), SRC_PINK\]/);
    assert.match(configOf('limiterConfig'), /sources: \[srcSine\(440\), srcClick\(120\), SRC_PINK\]/);
  });
});

describe('4. Delay Lab: DAMP is said in dB', () => {
  const phrase = run<(hz: number, fb: number) => string>(`${lift(CFG, 'onePoleLossDb')}\n${lift(CFG, 'delayDampPhrase')}\nreturn delayDampPhrase;`);
  const loss = run<(fc: number, f: number) => number>(`${lift(CFG, 'onePoleLossDb')}\nreturn onePoleLossDb;`);
  const gain = run<(fc: number, f: number) => number>(`${lift(ANIM, 'onePoleGain')}\nreturn onePoleGain;`);

  it('the number is the one the hero draws from', () => {
    for (const fc of [2000, 6000, 20000]) for (const f of [1000, 6000]) {
      assert.ok(Math.abs(loss(fc, f) + 20 * Math.log10(gain(fc, f))) < 1e-9, `${fc}/${f}`);
    }
  });
  it('DARK 2k and TAPE 6k state the real loss, and higher frequencies do lose more', () => {
    assert.match(phrase(2000, 0.5), /loses 1\.0 dB at 1 kHz/);
    assert.match(phrase(6000, 0.5), /loses 0\.1 dB at 1 kHz/);
    assert.match(phrase(2000, 0.5), /higher frequencies lose more, so it is easier to hear on PINK/);
    assert.ok(loss(2000, 8000) > loss(2000, 1000));
  });
  it('says nothing when damping is off, and is honest with no feedback', () => {
    assert.equal(phrase(20000, 0.5), '');
    assert.match(phrase(2000, 0), /needs FEEDBACK/);
  });
  it('rides the hero caption, and fxAnim stays out of the config file at runtime', () => {
    assert.match(configOf('delayConfig'), /delayDampPhrase\(v\[P\.dampHz\], v\[P\.delayFeedback\]\)/);
    assert.match(CFG, /import type \{ DynSignal, FxSrc \} from '\.\/fxAnim';/);
    assert.doesNotMatch(CFG, /^import \{[^}]*\} from '\.\/fxAnim';/m);
  });
});
