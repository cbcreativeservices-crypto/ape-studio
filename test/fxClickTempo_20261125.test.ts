/**
 * CLICK TEMPO in the effect labs (owner 2026-11-25, must-do D85, word for
 * word: "On many visuals like the compression labs and others, the playback
 * speed of the click BPM cannot be adjusted so a user cannot slow it down and
 * see it slower. it can be too fast going by to understand clearly. Add a way
 * to change BPM in the lab screens that show the waveform going by (Gate,
 * etc.)"). The same day, his words: "the whole point is to slow the picture
 * down so the user can see it slower. the tempo of the sound should match. the
 * sound can be the same sample, just the midi note on event of it changes
 * tempo. the visual should slow down by the same amount of speed even though
 * the length of each sample (not being changed) will be the same no matter
 * what tempo.. but the user can see it going by slower".
 *
 *   1. the pure helper (src/screens/lab/fxClickTempo.ts): ranges, period,
 *      steps, words, the window in beats, the rulers;
 *   1b. the click anchor (third pass): ONE wall-clock anchor that predicts a
 *      replica of the generator's timer through any run of tempo writes, and
 *      a drawing mapping that survives remounts, lost focus and stalls;
 *   2. every CLICK lab opens at its own preset and its own range;
 *   3. ratchets: the SOURCE key is the tempo fader whenever a CLICK is chosen;
 *      the sound, the drawings and the captions read the LIVE source; the
 *      windows scale with the tempo; the drawn hit starts with the heard click;
 *   4. the Delay caption follows the live tempo (90 and 120 BPM);
 *   5. the extremes of each lab's range, from the drawings' own numbers, and
 *      the Gate's top tempo re-run on the drawing's gate model.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import ts from 'typescript';

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped (a comment can never satisfy a match). */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const T = await import('../src/screens/lab/fxClickTempo.ts');
const { laneStepValue } = await import('../src/screens/lab/rack/laneStep.ts');

const CFG = code('src/screens/lab/fxLabConfigs.tsx');
const SCREEN = code('src/screens/lab/FxLabScreen.tsx');
const ANIM = code('src/screens/lab/fxAnim.tsx');
const block = (name: string) => {
  const start = CFG.indexOf(`const ${name}: FxLabConfig = {`);
  assert.ok(start >= 0, `${name} not found`);
  return CFG.slice(start, CFG.indexOf('\n};\n', start));
};
const flow = (from: string, to: string) => ANIM.slice(ANIM.indexOf(from), ANIM.indexOf(to));
const ECHO = flow('function EchoFlow(', 'const REV_WIN_MS');
const REV = flow('function ReverbFlow(', 'function SpectrumFlow(');
const DYN = flow('function DynamicsFlow(', 'const DIST_TAB_N');

/** Lift plain functions out of a source file and run them (types stripped). */
function lift<R>(file: string, names: string[], prelude: string, ret: string): R {
  const src = read(file);
  const parts = names.map((n) => {
    const m = src.match(new RegExp(`function ${n}\\([\\s\\S]*?\\n\\}\\n`));
    assert.ok(m, `${n} not found in ${file}`);
    return m[0];
  });
  const js = ts.transpileModule(`${prelude}\n${parts.join('\n')}\nreturn ${ret};`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function(js)() as R;
}

// ── which labs have a CLICK, at what tempo, over what range ─────────────────────
const CLICK_LABS: Record<string, { config: string; preset: number; range: [number, number]; base: number }> = {
  delay: { config: 'delayConfig', preset: 120, range: [60, 240], base: 3250 },
  reverb: { config: 'reverbConfig', preset: 60, range: [30, 120], base: 1500 },
  compression: { config: 'compConfig', preset: 120, range: [60, 240], base: 900 },
  gate: { config: 'gateConfig', preset: 90, range: [45, 105], base: 900 },
  limiter: { config: 'limiterConfig', preset: 120, range: [60, 240], base: 900 },
};
const NO_CLICK_LABS: Record<string, string> = {
  eq: 'eqConfig',
  chorus: 'chorusConfig',
  flanger: 'flangerConfig',
  phaser: 'phaserConfig',
  distortion: 'distConfig',
  phase: 'phaseConfig',
  stereo: 'stereoConfig',
};
/** The tempo a config's `sources:` line gives its CLICK, or null. */
function presetOf(cfg: string): number | null {
  const line = cfg.match(/\n\s*sources: \[([^\n]*)\],/)?.[1] ?? '';
  const m = line.match(/srcClick\((\w+)\)/);
  if (!m) return null;
  if (/^\d+$/.test(m[1])) return Number(m[1]);
  const c = CFG.match(new RegExp(`const ${m[1]} = (\\d+);`));
  assert.ok(c, `${m[1]} is not a number constant`);
  return Number(c[1]);
}
/** A config's clickTempoMax cap, or undefined. */
const capOf = (cfg: string) => {
  const m = cfg.match(/clickTempoMax: \{\s*bpm: (\d+),/);
  return m ? Number(m[1]) : undefined;
};

describe('1. the helper', () => {
  it('30–240 BPM, whole BPM; nonsense → the generator default 120', () => {
    assert.equal(T.CLICK_TEMPO_MIN, 30);
    assert.equal(T.CLICK_TEMPO_MAX, 240);
    assert.equal(T.clampClickBpm(29), 30);
    assert.equal(T.clampClickBpm(241), 240);
    assert.equal(T.clampClickBpm(44.6), 45);
    assert.equal(T.clampClickBpm(Number.NaN), 120);
    assert.equal(T.clampClickBpm(undefined), 120);
    assert.equal(T.clampClickBpm(200, { min: 45, max: 105 }), 105);
    const gen = read('modules/ape-dsp/ios/core/Generator.hpp');
    assert.match(gen, /void setClickBpm\(double bpm\) \{ clickBpm_\.store\(bpm < 20 \? 20 : \(bpm > 300 \? 300 : bpm\)\); \}/);
  });
  it('a lab range is half to twice its opening tempo, inside 30–240, under any cap', () => {
    assert.deepEqual(T.clickTempoRange(120), { min: 60, max: 240 });
    assert.deepEqual(T.clickTempoRange(60), { min: 30, max: 120 });
    assert.deepEqual(T.clickTempoRange(90), { min: 45, max: 180 });
    assert.deepEqual(T.clickTempoRange(90, 105), { min: 45, max: 105 });
    assert.equal(T.CLICK_WINDOW_SCALE_MAX, 2);
  });
  it('period = 60,000 ÷ BPM at 30, 60, 120 and 240', () => {
    assert.equal(T.clickPeriodMs(30), 2000);
    assert.equal(T.clickPeriodMs(60), 1000);
    assert.equal(T.clickPeriodMs(120), 500);
    assert.equal(T.clickPeriodMs(240), 250);
  });
  it('lane position ↔ tempo round-trips for every whole BPM of every lab range', () => {
    for (const { range } of Object.values(CLICK_LABS)) {
      const r = { min: range[0], max: range[1] };
      for (let b = r.min; b <= r.max; b++) assert.equal(T.clickTempoFromPos(T.clickTempoPos(b, r), r), b);
      assert.equal(T.clickTempoPos(r.min, r), 0);
      assert.equal(T.clickTempoPos(r.max, r), 1);
    }
  });
  it('the house − / + key moves exactly one BPM (rack laneStep with steps = max − min)', () => {
    for (const { range } of Object.values(CLICK_LABS)) {
      const r = { min: range[0], max: range[1] };
      const steps = T.clickTempoSteps(r);
      assert.equal(steps, r.max - r.min);
      for (let b = r.min; b < r.max; b += 7) {
        assert.equal(T.clickTempoFromPos(laneStepValue(T.clickTempoPos(b, r), 1, undefined, steps), r), b + 1);
        if (b > r.min) assert.equal(T.clickTempoFromPos(laneStepValue(T.clickTempoPos(b, r), -1, undefined, steps), r), b - 1);
      }
    }
  });
  it('the words: key "TEMPO 45" (settable, seen without opening anything), lane "CLICK TEMPO 45 BPM", tray "CLICK 45"', () => {
    assert.equal(T.clickTempoShort(45), 'TEMPO 45');
    assert.equal(T.clickTempoReadout(45), 'CLICK TEMPO 45 BPM');
    assert.equal(T.clickTempoLabel(45), 'CLICK 45');
  });
  it('the tray blurb says "fader", the range, that the picture keeps step, and the Gate’s reason', () => {
    const b = T.clickTempoBlurb({ min: 60, max: 240 });
    assert.equal(
      b,
      'Close this tray with ✕ and drag the fader to set its tempo, 60 to 240 BPM. Slowing the tempo also slows how fast the picture moves, so the picture keeps step with what you hear.',
    );
    assert.doesNotMatch(b, /\blane\b/);
    assert.match(T.clickTempoBlurb({ min: 45, max: 105 }, 'WHY.'), /45 to 105 BPM\. [\s\S]* WHY\.$/);
  });
  it('the source as it plays: untouched at the preset; relabelled, retimed and carrying its opening tempo otherwise', () => {
    const src = { label: 'CLICK 90', short: '90 BPM', gen: { mode: 3, clickBpm: 90 }, blurb: 'b' };
    assert.equal(T.liveClickSource(src, 90, undefined), src);
    assert.equal(T.liveClickSource(src, 90, 90), src);
    assert.equal(T.liveClickSource(src, undefined, 45), src, 'not a CLICK: never touched');
    assert.deepEqual(T.liveClickSource(src, 90, 45), { label: 'CLICK 45', short: '45 BPM', gen: { mode: 3, clickBpm: 45 }, blurb: 'b', clickOpenBpm: 90 });
    assert.equal(src.gen.clickBpm, 90, 'the preset spec is never mutated');
  });
  it('the window is a fixed number of BEATS: base × opening ÷ live; identity at the opening tempo', () => {
    assert.equal(T.clickWindowScale(undefined, 120), 1);
    assert.equal(T.clickWindowScale(120, 120), 1);
    assert.equal(T.clickWindowMs(900, 120, 60), 1800);
    assert.equal(T.clickWindowMs(900, 120, 240), 450);
    assert.equal(T.clickWindowMs(3250, 120, 60), 6500);
    assert.equal(T.clickWindowMs(1500, 60, 30), 3000);
    // The travel speed scales by live ÷ opening — the owner's "same amount of speed".
    for (const [open, live] of [[120, 60], [120, 240], [90, 45], [60, 30]]) {
      const pxPerMsAtOpen = 1 / T.clickWindowMs(900, open, open);
      const pxPerMs = 1 / T.clickWindowMs(900, open, live);
      assert.ok(Math.abs(pxPerMs / pxPerMsAtOpen - live / open) < 1e-12);
    }
    // …and the glass holds as many hits at every tempo: window ÷ period is constant.
    for (const { preset, range, base } of Object.values(CLICK_LABS)) {
      const n0 = base / T.clickPeriodMs(preset);
      for (let b = range[0]; b <= range[1]; b++) assert.ok(Math.abs(T.clickWindowMs(base, preset, b) / T.clickPeriodMs(b) - n0) < 1e-9);
    }
  });
  it('rulers say the real time: the opening ruler is unchanged; half and double tempo re-step it', () => {
    // Delay: named every 1 s at the opening tempo.
    assert.equal(T.rulerStepMs(1000, 1), 1000);
    assert.equal(T.rulerStepMs(1000, 2), 2000); // half tempo: 6.5 s window, "2 s", "4 s", "6 s"
    assert.equal(T.rulerStepMs(1000, 0.5), 500); // double tempo: 1.625 s window, "0.5 s", "1 s", "1.5 s"
    // Reverb: named every 0.5 s at the opening tempo.
    assert.equal(T.rulerStepMs(500, 1), 500);
    assert.equal(T.rulerStepMs(500, 2), 1000);
    assert.equal(T.rulerStepMs(500, 0.5), 250);
    assert.equal(T.fmtSeconds(250), '0.25 s');
    assert.equal(T.fmtSeconds(500), '0.5 s');
    assert.equal(T.fmtSeconds(1000), '1 s');
    assert.equal(T.fmtSeconds(1500), '1.5 s');
    // The dynamics strip has no ruler: it names its span once the tempo moves it.
    assert.equal(T.outSpanLabel(T.clickWindowMs(900, 120, 60)), 'OUT = 1.8 s');
    assert.equal(T.outSpanLabel(T.clickWindowMs(900, 120, 240)), 'OUT = 450 ms');
  });
  it('a non-CLICK drawing’s tempo rebase keeps its newest hit in place', () => {
    assert.deepEqual(T.rebaseHitGrid([500, 0], 2000, 60250), [2000, 60000]);
    assert.deepEqual(T.rebaseHitGrid([0, 0], 500, 1000), [500, 0], 'a bad grid restarts at 0');
  });
});

/* ── THE CLICK ANCHOR (third pass, 2026-11-25): what you see is what you hear ──
 * A replica of the generator's click timer (Generator.hpp:525-527) is the
 * ground truth for when clicks are heard; the anchor must predict it, and
 * every drawing must map the anchor onto the wall clock. */
const GEN = read('modules/ape-dsp/ios/core/Generator.hpp');
/** The heard click onsets (ms) of the native timer, started at 0, with tempo
 *  writes [{ atMs, periodMs }] applied at their sample. */
function nativeClickOnsets(periodMs: number, writes: { atMs: number; periodMs: number }[], untilMs: number): number[] {
  const fs = 48000;
  const dt = 1000 / fs;
  let interval = periodMs;
  let timer = 0;
  const out = [0];
  let w = 0;
  const sorted = [...writes].sort((a, b) => a.atMs - b.atMs);
  for (let n = 1; n * dt <= untilMs; n++) {
    const t = n * dt;
    while (w < sorted.length && sorted[w].atMs <= t) interval = sorted[w++].periodMs;
    timer += dt;
    let wrapped = false;
    if (timer >= interval) {
      timer -= interval;
      wrapped = true;
    }
    // A ping sounds when the timer lands under 5 ms (Generator.hpp `if (t < 0.005)`):
    // its onset is t − timer. (A wrap that lands later is the timer re-phasing
    // after a faster tempo: no click is heard then.)
    if (wrapped && timer < 5) out.push(t - timer);
  }
  return out;
}
/** The anchor's hits in [from, to). */
const anchorHits = (a: { t0: number; periodMs: number }, from: number, to: number) => {
  const out: number[] = [];
  for (let h = T.nextHitMs(a, from - 1e-9) - a.periodMs; h < to; h += a.periodMs) if (h >= from - 1e-6) out.push(h);
  return out;
};
const near = (xs: number[], x: number, tol: number) => xs.some((y) => Math.abs(y - x) <= tol);

describe('1b. the click anchor: the heard train, in wall-clock time', () => {
  it('the replica is the generator: timer keeps elapsed time, only the interval changes', () => {
    assert.match(GEN, /const double interval = 60\.0 \/ clickBpm_\.load\(\);\s*clickTimer_ \+= 1\.0 \/ fs;\s*if \(clickTimer_ >= interval\) clickTimer_ -= interval;/);
    assert.match(GEN, /void applyTrigger\(GenMode m\) \{[\s\S]{0,120}clickTimer_ = 0\.0;/);
    assert.match(GEN, /void setMode\(GenMode m\) \{\s*mode_\.store\(static_cast<int>\(m\)\);\s*retrigger_\.store\(true\);/);
  });
  it('item 2 · the 120 → 60 example: rebased AT the write it matches the sound; at effect time it was 500 ms off', () => {
    const a0 = T.anchorAtStart(500, 0);
    const a1 = T.anchorAfterTempoWrite(a0, 1000, 9760);
    assert.deepEqual(a1, { t0: 9500, periodMs: 1000 });
    const heard = nativeClickOnsets(500, [{ atMs: 9760, periodMs: 1000 }], 12000);
    assert.ok(near(heard, 10500, 0.05) && near(heard, 11500, 0.05));
    assert.ok(near(heard, T.nextHitMs(a1, 9760), 0.05));
    // the old effect-time rebase (the effect ran at 10 010): next drawn hit 11 000, 500 ms off the sound
    const old = T.rebaseHitGrid([500, 0], 1000, 10010);
    assert.deepEqual(old, [1000, 10000]);
    assert.ok(!near(heard, old[1] + old[0], 100));
  });
  it('item 2 · any run of tempo writes (speeding past the elapsed time too): every heard click is a drawn hit within 1 ms', () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let trial = 0; trial < 20; trial++) {
      const writes: { atMs: number; periodMs: number }[] = [];
      let tw = 300;
      for (let i = 0; i < 6; i++) {
        tw += 200 + rnd() * 2500;
        writes.push({ atMs: tw, periodMs: T.clickPeriodMs(30 + Math.floor(rnd() * 211)) });
      }
      const until = tw + 4000;
      const P0 = T.clickPeriodMs(30 + Math.floor(rnd() * 211));
      const heard = nativeClickOnsets(P0, writes, until);
      // the anchor, moved at each write exactly as setClickTempo moves it
      let a = T.anchorAtStart(P0, 0);
      const segments: { a: { t0: number; periodMs: number }; from: number; to: number }[] = [];
      let from = 0;
      for (const wr of writes) {
        segments.push({ a, from, to: wr.atMs });
        a = T.anchorAfterTempoWrite(a, wr.periodMs, wr.atMs);
        from = wr.atMs;
      }
      segments.push({ a, from, to: until - 1 });
      // every drawn hit (each anchor from its write on) is a heard click …
      for (const s of segments) {
        for (const h of anchorHits(s.a, s.from + 0.05, s.to)) assert.ok(near(heard, h, 1), `trial ${trial}: drawn ${h.toFixed(2)} not heard`);
      }
      // … and every heard click is a drawn hit (a click that starts just
      // before a write and lands on the new train counts on either side)
      const drawn = segments.flatMap((s) => anchorHits(s.a, s.from - 6, s.to + 1));
      for (const h of heard) if (h < until - 1) assert.ok(near(drawn, h, 1), `trial ${trial}: heard ${h.toFixed(2)} not drawn`);
    }
  });
  // The drawings' own mapping, lifted from fxAnim (a worklet that reads the wall clock).
  const hitNowMs = lift<(phase: number, g: number[]) => number>('src/screens/lab/fxAnim.tsx', ['hitNowMs'], 'const PI2 = Math.PI * 2;', 'hitNowMs');
  /** The newest drawn hit at the moment of the call, for a drawing whose clock phase is `phase`. */
  const drawnLastHit = (g: number[], phase: number) => {
    const wall = performance.now();
    const s = hitNowMs(phase, g); // signal time on the grid
    return { wall, hit: wall - (((s % g[0]) + g[0]) % g[0]) };
  };
  it('item 1 · a fresh hero (FULL SCREEN, zoom, OPEN DISPLAY) at any mount time draws the heard train from its first frame', () => {
    const a = T.anchorAtStart(T.clickPeriodMs(45), performance.now() - 61234.5); // the click started a minute ago
    const g = [a.periodMs, a.t0, 1]; // useHitGrid's FIRST value for an anchored hero
    for (const clockMsSinceMount of [0, 16.7, 1234.5, 99999]) {
      const { wall, hit } = drawnLastHit(g, (clockMsSinceMount / 1000) * Math.PI * 2);
      assert.ok(Math.abs(hit - T.lastHitMs(a, wall)) < 1, `mounted ${clockMsSinceMount} ms ago`);
    }
    assert.match(ANIM, /const grid = useSharedValue<number\[\]>\(anchor \? \[anchor\.periodMs, anchor\.t0, 1\] : \[periodMs, 0, 0\]\);/);
    assert.doesNotMatch(ANIM, /playToken|startHitGrid/);
  });
  it('item 4 · a 5 s stall or a lost focus: the next drawn hit is still anchor + n·P within 1 ms (never counted from frame time)', () => {
    // The click started 8 s ago: 3 s of normal frames, then a 5 s stall (or 5 s
    // unfocused). The phase clock caps a frame at 64 ms (foundations/viz.tsx) and
    // stops while unfocused, so it reads 3 064 ms; the wall clock reads 8 000.
    const P = T.clickPeriodMs(110);
    const a = T.anchorAtStart(P, performance.now() - 8000);
    const phaseAfterStall = ((3000 + 64) / 1000) * Math.PI * 2;
    const { wall, hit } = drawnLastHit([a.periodMs, a.t0, 1], phaseAfterStall);
    const next = hit + P;
    assert.ok(Math.abs(next - T.nextHitMs(a, wall)) < 1);
    const n = Math.round((next - a.t0) / a.periodMs);
    assert.ok(Math.abs(next - (a.t0 + n * a.periodMs)) < 1, 'the next drawn hit is anchor + n·P');
    // Counted from the drawing's frame time (the old way: a clock grid synced at
    // the start), the same moment draws its hits 4 936 ms of lost time off the beat.
    const old = drawnLastHit([P, 0, 0], phaseAfterStall);
    const off = Math.abs(old.hit - T.lastHitMs(a, old.wall));
    assert.ok(Math.min(off, P - off) > 1, `old way off by ${off.toFixed(1)} ms`);
  });
});

describe('2. the labs: which have a CLICK; each opens at its own tempo and range', () => {
  for (const [lab, { config, preset, range }] of Object.entries(CLICK_LABS)) {
    it(`${lab}: CLICK at ${preset} BPM, range ${range[0]}–${range[1]}; untouched until the tempo moves`, () => {
      const cfg = block(config);
      assert.equal(presetOf(cfg), preset);
      assert.deepEqual(T.clickTempoRange(preset, capOf(cfg)), { min: range[0], max: range[1] });
      const src = { label: `CLICK ${preset}`, short: `${preset} BPM`, gen: { mode: 3, clickBpm: preset } };
      assert.equal(T.liveClickSource(src, preset, undefined), src);
      const r = { min: range[0], max: range[1] };
      assert.equal(T.clickTempoFromPos(T.clickTempoPos(preset, r), r), preset, 'home (double-tap) lands on the preset');
    });
  }
  for (const [lab, config] of Object.entries(NO_CLICK_LABS)) {
    it(`${lab}: no CLICK source, so no tempo control (none added)`, () => {
      const cfg = block(config);
      assert.equal(presetOf(cfg), null);
      assert.doesNotMatch(cfg, /srcClick\(|GEN_MODES\.click|clickTempoMax/);
    });
  }
  it('every CLICK in the effect labs names its tempo (so the fader always has a home)', () => {
    assert.match(CFG, /const srcClick = \(bpm: number\) => \(\{ label: `CLICK \$\{bpm\}`, short: `\$\{bpm\} BPM`, gen: \{ mode: GEN_MODES\.click, clickBpm: bpm \}/);
    assert.equal((CFG.match(/mode: GEN_MODES\.click/g) ?? []).length, 1, 'only srcClick builds a CLICK');
    assert.equal((CFG.match(/clickTempoMax:/g) ?? []).length, 1, 'only the Gate caps its range');
  });
});

describe('3. ratchets: one source of truth, the house fader, the window in beats', () => {
  it('the screen builds the LIVE sources once, from the presets and the student’s tempo', () => {
    assert.match(SCREEN, /const sources = useMemo\(\s*\(\) => presetSources\.map\(\(s, i\) => liveClickSource\(s, clickPresetOf\(s\), clickTempo\[i\]\)\),/);
    assert.match(SCREEN, /function clickPresetOf\(src: FxSourceSpec \| undefined\): number \| undefined \{\s*return src\?\.gen\.mode === GEN_MODES\.click \? clampClickBpm\(src\.gen\.clickBpm\) : undefined;/);
  });
  it('a CLICK makes the SOURCE key the house chooser-fader over the lab’s range: steps, home, the sticky tray', () => {
    const k = SCREEN.slice(SCREEN.indexOf('const clickPreset = clickPresetOf(presetSources[sourceIdx]);'), SCREEN.indexOf('const faderParam ='));
    assert.match(k, /if \(clickPreset != null\) \{/);
    assert.match(k, /const range = clickTempoRange\(clickPreset, config\.clickTempoMax\?\.bpm\);/);
    assert.match(k, /kind: 'fader',\s*id: 'src',\s*label: 'SOURCE',/);
    assert.match(k, /value: clickTempoPos\(bpm, range\),/);
    assert.match(k, /onChange: \(pos\) => setClickTempo\(clickTempoFromPos\(pos, range\)\),/);
    assert.match(k, /format: \(pos\) => clickTempoReadout\(clickTempoFromPos\(pos, range\)\),/);
    assert.match(k, /formatShort: \(pos\) => clickTempoShort\(clickTempoFromPos\(pos, range\)\),/);
    assert.match(k, /home: clickTempoPos\(clickPreset, range\),/);
    assert.match(k, /steps: clickTempoSteps\(range\),/);
    assert.match(k, /chooser: \{\s*title: 'SOURCE',\s*options: sourceOptions,\s*selectedId: String\(sourceIdx\),\s*onSelect: \(id\) => pickSource\(Number\(id\)\),\s*sticky: true,/);
    assert.match(k, /\} else \{\s*dockParams\.push\(\{\s*kind: 'options',\s*id: 'src',\s*label: 'SOURCE',\s*valueLabel: sources\[sourceIdx\]\.short \?\? sources\[sourceIdx\]\.label,/);
    assert.match(code('src/screens/lab/rack/RackUnit.tsx'), /if \(chooserTray\) setBoundId\(chooserTray\.id\);/);
    // The CLICK option's blurb ends with the lab's own tempo sentence.
    assert.match(SCREEN, /clickTempoBlurb\(clickTempoRange\(preset, config\.clickTempoMax\?\.bpm\), config\.clickTempoMax\?\.why\)/);
  });
  it('the sound: live through genSet (no restart) inside the lab’s range; stop restores the lab’s tempo, set at once', () => {
    const set = SCREEN.slice(SCREEN.indexOf('const setClickTempo = (bpm: number) => {'), SCREEN.indexOf('const paramById'));
    assert.match(set, /const b = clampClickBpm\(bpm, clickTempoRange\(preset, config\.clickTempoMax\?\.bpm\)\);/);
    assert.match(set, /clickHomeRef\.current = b !== preset \? preset : null;/);
    assert.match(set, /if \(running\) \{\s*ApeDsp\.genSet\(\{ clickBpm: b \}\);/);
    assert.doesNotMatch(set, /genStart|genStop|fxReset/);
    assert.equal((SCREEN.match(/ApeDsp\.genSet\(genParamsFor\(sources\[/g) ?? []).length, 3);
    assert.match(SCREEN, /const liveNow = sourcesRef\.current\[latest\.sourceIdx\];\s*if \(liveNow !== sources\[latest\.sourceIdx\]\) \{\s*ApeDsp\.genSet\(genParamsFor\(liveNow\)\);\s*retriggered = true;/);
    const stop = SCREEN.slice(SCREEN.indexOf('const stop = useCallback(() => {'), SCREEN.indexOf('useStopWhenSilenced(running, stop);'));
    assert.match(stop, /if \(clickHomeRef\.current != null\) ApeDsp\.genSet\(\{ clickBpm: clickHomeRef\.current \}\);/);
    assert.match(SCREEN, /const \[clickTempo, setClickTempoState\] = useState<Record<number, number>>\(\{\}\);/);
    assert.doesNotMatch(SCREEN, /AsyncStorage|createLocalStore|SecureStore/);
  });
  it('ONE anchor in FxLabScreen: set when the click starts (▶, choosing it while playing), moved AT every tempo write', () => {
    assert.match(SCREEN, /const \[clickAnchor, setClickAnchor\] = useState<ClickAnchor>\(\(\) => anchorAtStart\(clickPeriodMs\(labClickBpm\), performance\.now\(\)\)\);/);
    // ▶: the time the native start was asked for (a click plays at once), or after the 10 ms dip if re-armed
    assert.match(SCREEN, /if \(fenced\.status !== 'started'\) return;\s*const startedAt = performance\.now\(\);/);
    assert.match(SCREEN, /start: \(\) => ApeDsp\.genStart\(\),/); // the fence's pinned shape stays
    assert.match(SCREEN, /setClickAnchor\(retriggered \? anchorAtStart\(P, performance\.now\(\), GEN_RETRIGGER_DIP_MS\) : anchorAtStart\(P, startedAt\)\);/);
    // the tempo write: the anchor moves from the time of the write, recorded before the genSet
    const set = SCREEN.slice(SCREEN.indexOf('const setClickTempo = (bpm: number) => {'), SCREEN.indexOf('const paramById'));
    assert.match(set, /const writeMs = performance\.now\(\);\s*setClickAnchor\(\(a\) => anchorAfterTempoWrite\(a, clickPeriodMs\(b\), writeMs\)\);\s*if \(running\) \{\s*ApeDsp\.genSet\(\{ clickBpm: b \}\);/);
    // a drag's many writes compare with the last WRITTEN tempo, not a stale render
    assert.match(set, /const was = writtenTempoRef\.current\[sourceIdx\] \?\? clampClickBpm\(sources\[sourceIdx\]\.gen\.clickBpm\);/);
    // the hero gets it; no per-mount token
    assert.match(SCREEN, /<AnimHero model=\{config\.anim!\(values, sources\[sourceIdx\]\)\} active=\{focused\} grDb=\{running \? grDb : 0\} clickAnchor=\{labClickIdx >= 0 \? clickAnchor : undefined\} \/>/);
    assert.doesNotMatch(SCREEN, /playToken/);
  });
  it('item 3 · re-tapping the chosen source sends nothing (a mode write would restart the click); a new CLICK re-anchors after the dip', () => {
    const pick = SCREEN.slice(SCREEN.indexOf('const pickSource = (i: number) => {'), SCREEN.indexOf('const setClickTempo'));
    assert.ok(pick.indexOf('if (i === sourceIdx) return;') >= 0 && pick.indexOf('if (i === sourceIdx) return;') < pick.indexOf('ApeDsp.genSet('));
    assert.match(pick, /setClickAnchor\(anchorAtStart\(clickPeriodMs\(sources\[i\]\.gen\.clickBpm\), performance\.now\(\), GEN_RETRIGGER_DIP_MS\)\);/);
    assert.equal(T.GEN_RETRIGGER_DIP_MS, 10);
    assert.match(GEN, /const uint32_t n = static_cast<uint32_t>\(fs \* 0\.010\);  \/\/ 10 ms/);
    // Every other generator write with a mode happens before ▶'s anchor is set (start) or is this one.
    assert.equal((SCREEN.match(/ApeDsp\.genSet\(genParamsFor\(/g) ?? []).length, 4);
  });
  it('every CLICK drawing is anchored, and every worklet reads its "now" from the wall clock for a CLICK', () => {
    assert.match(ECHO, /const grid = useHitGrid\(clock, periodMs, src\.kind === 'click' \? clickAnchor : undefined\);/);
    assert.match(REV, /const grid = useHitGrid\(clock, P, src\.kind === 'click' \? clickAnchor : undefined\);/);
    assert.match(DYN, /const grid = useHitGrid\(clock, periodMs, signal\?\.kind === 'hits' \? clickAnchor : undefined\);/);
    assert.match(ANIM, /return \(g\[2\] === 1 \? performance\.now\(\) : c\) - g\[1\];/);
    assert.equal((ECHO.match(/hitNowMs\(clock\.value, (g|grid\.value)\)/g) ?? []).length, 4);
    assert.equal((REV.match(/hitNowMs\(clock\.value, (g|grid\.value)\)/g) ?? []).length, 6);
    assert.equal((DYN.match(/hitNowMs\(clock\.value, g\)/g) ?? []).length, 4);
    assert.doesNotMatch(ANIM, /\(clock\.value \/ PI2\) \* 1000 - (g|grid\.value)\[1\]/);
    assert.match(ANIM, /<FlowBody model=\{model\} w=\{glassUnitsW\} active=\{active\} grDb=\{grDb\} clickAnchor=\{clickAnchor\} \/>/);
    assert.equal((ANIM.match(/clickAnchor=\{clickAnchor\}/g) ?? []).length, 4);
  });
  it('every drawing, readout and caption is fed the live source', () => {
    assert.match(SCREEN, /staticHero=\{AnimHero \? null : config\.Hero\(values, sources\[sourceIdx\]\)\}/);
    assert.match(SCREEN, /const captionCtx = \{ source: sources\[sourceIdx\], clickBpm: labClickBpm \};/);
    assert.equal((SCREEN.match(/config\.heroCaption!\(values, captionCtx\)/g) ?? []).length, 2);
  });
  it('the configs hand the drawings the live period AND the window scale, through the helper', () => {
    assert.match(CFG, /return \{ kind: 'hits', periodMs: clickPeriodMs\(g\.clickBpm\), windowScale: clickWindowScale\(src\?\.clickOpenBpm, g\.clickBpm\),/);
    assert.match(CFG, /return \{ kind: 'click', periodMs: clickPeriodMs\(g\.clickBpm\), windowScale: clickWindowScale\(src\?\.clickOpenBpm, g\.clickBpm\) \};/);
    assert.doesNotMatch(CFG, /60000 \/ \(g\.clickBpm/);
    assert.doesNotMatch(CFG, /periodMs: \d/);
  });
  it('no drawing keeps a preset period or a fixed window: the delay, reverb and dynamics flows scale both', () => {
    for (const [name, f] of [['EchoFlow', ECHO], ['ReverbFlow', REV], ['DynamicsFlow', DYN]] as const) {
      assert.match(f, /(src|signal)\??\.kind === '(click|hits)' \? Math\.max\(100, (src|signal)\.periodMs\)/, `${name}: period not from the model`);
      assert.match(f, /const winScale = (src|signal)\??\.kind === '(click|hits)' \? \((src|signal)\.windowScale \?\? 1\) : 1;/, `${name}: no window scale`);
      assert.doesNotMatch(f, /60000 \/ 1[0-9]0\b|periodMs: \d/, `${name}: a hard-coded click period`);
      assert.doesNotMatch(f, /const now = \(clock\.value \/ PI2\) \* 1000;/, `${name}: a worklet ignores the grid origin`);
    }
    assert.match(ECHO, /const msPerPx = \(ECHO_SPAN_MS \* winScale\) \/ \(w - stageX - 12\);/);
    assert.match(ECHO, /return \(echoSpacingFrac\(timeMs\) \/ winScale\) \* outSpan;/);
    assert.match(REV, /const msPerPx = \(REV_WIN_MS \* winScale\) \/ \(outX1 - outX0\);/);
    assert.match(DYN, /const msPerPx = \(DYN_WINDOW_MS \* winScale\) \/ Math\.max\(1, outX1 - outX0\);/);
    // the rulers step with the scale; the dynamics strip names its span once it moves
    assert.match(ECHO, /const labelMs = rulerStepMs\(1000, winScale\);\s*const tickMs = labelMs \/ 4;/);
    // Reverb: names 0.5 or 1 s, ticks always 100 ms (so the lessons' "one 100 ms tick" is a tick at every tempo)
    assert.match(REV, /const labelMs = Math\.max\(500, rulerStepMs\(500, winScale\)\);\s*const tickMs = 100;/);
    assert.match(REV, /marks\.push\(\{ x, s: fmtSeconds\(ms\) \}\)/);
    assert.match(DYN, /\{winScale !== 1 \? <GlassText x=\{outX1 - 2\} y=\{24\} align="right" w=\{90\} text=\{outSpanLabel\(DYN_WINDOW_MS \* winScale\)\} \/> : null\}/);
    assert.match(DYN, /`5 ms CLICK · \$\{Math\.round\(60000 \/ periodMs\)\} BPM`/);
  });
});

describe('4. the Delay caption follows the live tempo', () => {
  const phrase = lift<(t: number, b?: number) => string>('src/screens/lab/fxLabConfigs.tsx', ['delayTempoPhrase'], 'const DELAY_BPM = 120;', 'delayTempoPhrase');
  it('the heroCaption hands the CLICK’s live tempo in', () => {
    assert.match(block('delayConfig'), /heroCaption: \(v, ctx\) =>[\s\S]*?: delayTempoPhrase\(v\[P\.timeMs\], ctx\?\.clickBpm\)\) \+/);
  });
  it('at 120 BPM (the opening tempo) the words are exactly as before', () => {
    assert.equal(phrase(250, 120), '250 ms = an eighth note at the CLICK’s 120 BPM: the first repeat lands halfway between two clicks.');
    assert.equal(phrase(250), phrase(250, 120));
    assert.equal(phrase(375, 120), '375 ms = a dotted eighth at the CLICK’s 120 BPM, a classic delay rhythm.');
    assert.equal(phrase(500, 120), 'That spacing = a quarter-note at 120 BPM, the CLICK’s tempo: each repeat lands on the next click.');
    assert.equal(phrase(300, 120), 'That spacing = a quarter-note at 200 BPM — match the delay to the song\'s tempo and repeats land ON the beat.');
  });
  it('at 90 BPM: the eighth is 333 ms, the dotted eighth 500 ms, and 250 ms is no longer an eighth', () => {
    assert.equal(phrase(333, 90), '333 ms = an eighth note at the CLICK’s 90 BPM: the first repeat lands halfway between two clicks. That spacing = a quarter-note at 180 BPM.');
    assert.equal(phrase(500, 90), '500 ms = a dotted eighth at the CLICK’s 90 BPM, a classic delay rhythm. That spacing = a quarter-note at 120 BPM.');
    assert.equal(phrase(250, 90), 'That spacing = a quarter-note at 240 BPM — match the delay to the song\'s tempo and repeats land ON the beat.');
  });
  it('LEARN’s "TIME 500 ms names a quarter-note at 120 BPM" holds at every tempo the lab allows', () => {
    for (let b = 60; b <= 240; b++) assert.match(phrase(500, b), /a quarter-note at 120 BPM/, `at ${b} BPM`);
  });
  it('"each repeat lands on the next click" only when TIME is the live beat', () => {
    for (let b = 60; b <= 240; b++) {
      for (const t of [250, 300, 400, 500]) assert.equal(/lands on the next click/.test(phrase(t, b)), Math.round(60000 / t) === b, `${t} ms at ${b} BPM`);
    }
  });
});

describe('5. the extremes of each lab’s range', () => {
  const num = (src: string, name: string) => {
    const m = src.match(new RegExp(`const ${name} = ([\\d.]+);`));
    assert.ok(m, `${name} not found`);
    return Number(m[1]);
  };
  it('the base windows the table below uses are the drawings’ own', () => {
    assert.equal(num(ANIM, 'DYN_WINDOW_MS'), 900);
    assert.equal(num(ANIM, 'REV_WIN_MS'), 1500);
    assert.equal(num(code('src/features/lab/sliderMaps.ts'), 'ECHO_SPAN_MS'), 3250);
  });
  it('min / opening / max: the window span and the hits it holds (the same at every tempo)', (t) => {
    for (const [lab, { preset, range, base }] of Object.entries(CLICK_LABS)) {
      const row = [range[0], preset, range[1]].map((b) => {
        const span = T.clickWindowMs(base, preset, b);
        return `${b} BPM: OUT ${T.fmtSpan(span)}, a hit crosses OUT in ${T.fmtSpan(span)}, ${(span / T.clickPeriodMs(b)).toFixed(2)} periods on OUT`;
      });
      t.diagnostic(`${lab}: ${row.join(' | ')}`);
      assert.ok(T.clickWindowMs(base, preset, range[0]) <= 2 * base + 1e-9 && T.clickWindowMs(base, preset, range[1]) >= base / 2 - 1e-9);
    }
  });
  it('reverb: the sweep re-triggers on EVERY click at every tempo of its range (window = 1.5 beats); bursts every 4th', () => {
    const sweep = lift<(sk: number, P: number) => number>('src/screens/lab/fxAnim.tsx', ['revSweepMs'], 'const REV_WIN_MS = 1500;', 'revSweepMs');
    for (let b = 30; b <= 120; b++) assert.equal(sweep(0, T.clickPeriodMs(b)), T.clickPeriodMs(b));
    assert.equal(sweep(0, 1000), 1000, 'CLICK 60: 1 s, as before');
    assert.equal(sweep(1, 250), 1000);
    assert.equal(sweep(2, 250), 1500);
  });
  it('compressor GR PEAK (the settled kick) stays finite and sensible from 60 to 240 BPM', (t) => {
    const peak = lift<(thr: number, ratio: number, atk: number, rel: number, P: number) => number>(
      'src/screens/lab/fxAnim.tsx',
      ['dynPingAbs', 'dynPingStep', 'dynGrDb', 'dynPingGrPeakDb'],
      'const PING_MS = 5; const PING_DT = 1000 / 48000; const PING_N = 240; const PING_PEAK = Math.pow(10, -20 / 20);',
      'dynPingGrPeakDb',
    );
    const at = (bpm: number, rel: number) => peak(-40, 4, 5, rel, T.clickPeriodMs(bpm));
    for (const rel of [30, 120, 500]) {
      const v = [60, 120, 240].map((b) => at(b, rel));
      t.diagnostic(`THRESH −40, 4:1, ATTACK 5 ms, RELEASE ${rel} ms → GR PEAK at 60/120/240 BPM: ${v.map((x) => x.toFixed(2)).join(' / ')} dB`);
      for (const x of v) assert.ok(Number.isFinite(x) && x >= 0 && x < 20);
      for (let i = 1; i < v.length; i++) assert.ok(v[i] >= v[i - 1] - 1e-9);
    }
  });
  it('the Gate stops at 105 BPM: up to there the DRAWN gate closes to within 1 dB of RANGE, as the engine does', (t) => {
    // The drawing's gate, as fxAnim DynamicsFlow outPath runs it (drum-hit model, peak detector, hold, close).
    assert.match(DYN, /if \(env > thrLin\) \{\s*holdLeft = holdV;\s*gG \+= aAtk \* \(1 - gG\);/);
    assert.match(DYN, /gG \+= aRel \* \(floorG - gG\);/);
    assert.match(block('gateConfig'), /attackMs: 1,/);
    const dbPerMs = 20 / (Math.LN10 * num(ANIM, 'DYN_DECAY_MS'));
    assert.ok(Math.abs(dbPerMs - 0.0965) < 0.001);
    const minGainDb = (bpm: number, range: number, dt: number, hold = 10) => {
      const P = 60000 / bpm;
      const peakLin = 0.1, floorLin = 10 ** (-52 / 20), floorG = 10 ** (range / 20), thrLin = 10 ** (-50 / 20);
      const aA = 1 - Math.exp(-dt / 1), aR = 1 - Math.exp(-dt / 20);
      let env = 0, gG = floorG, holdLeft = 0, tb = 0, min = 1;
      const N = Math.ceil((P * 12) / dt);
      for (let k = 0; k < N; k++) {
        const xd = peakLin * Math.exp(-tb / 90);
        const x = xd > floorLin ? xd : floorLin;
        env += (x > env ? aA : aR) * (x - env);
        if (env > thrLin) {
          holdLeft = hold;
          gG += aA * (1 - gG);
        } else if (holdLeft > 0) holdLeft -= dt;
        else gG += aR * (floorG - gG);
        if (k > N / 2 && gG < min) min = gG;
        tb += dt;
        if (tb >= P) tb -= P;
      }
      return 20 * Math.log10(min);
    };
    const cap = capOf(block('gateConfig'));
    assert.equal(cap, 105);
    for (const range of [-20, -40, -70]) {
      for (const dt of [1, 1.25]) {
        let top = 0;
        for (let b = 45; b <= 240; b++) if (minGainDb(b, range, dt) <= range + 1) top = b;
        t.diagnostic(`RANGE ${range} dB, step ${dt} ms: the drawn gate closes to within 1 dB up to ${top} BPM; at 180 BPM it reaches ${minGainDb(180, range, dt).toFixed(1)} dB`);
        assert.ok(top >= cap!, `RANGE ${range}: closes only to ${top} BPM`);
        for (let b = 45; b <= cap!; b++) assert.ok(minGainDb(b, range, dt) <= range + 1, `RANGE ${range} at ${b} BPM`);
      }
    }
    // HOLD 100 ms (third pass, item 7): within 1 dB up to 105 at −40 and only ~94 at −70,
    // where 105 BPM draws the floor at about −58 dB — far under 1 px on OUT (the tail is −52 dBFS).
    const top = (range: number) => {
      let b0 = 0;
      for (let b = 45; b <= 240; b++) if (minGainDb(b, range, 1.1, 100) <= range + 1) b0 = b;
      return b0;
    };
    const h = { m20: top(-20), m40: top(-40), m70: top(-70), at105: minGainDb(105, -70, 1.1, 100) };
    t.diagnostic(`HOLD 100 ms: within 1 dB up to ${h.m20} (−20) / ${h.m40} (−40) / ${h.m70} (−70) BPM; RANGE −70 at 105 BPM: ${h.at105.toFixed(1)} dB`);
    assert.ok(h.m40 >= 104 && h.m40 <= 106 && h.m70 >= 92 && h.m70 <= 96 && h.at105 < -55 && h.at105 > -61);
    // linear height of OUT between hits at that gain: the −52 dBFS tail × gain, on a panel whose edge is −14 dBFS
    const halfPx = 118 / 2 - 5;
    assert.ok(halfPx * 10 ** ((-52 + h.at105 - -14) / 20) < 0.01, 'far under 1 px');
    // the words say only what holds: "can keep", not "would keep"
    assert.match(block('gateConfig'), /why: 'The fader stops at 105 BPM: faster, the drawing’s longer drum hit can keep its gate open between hits while the real gate closes\.'/);
  });
});

describe('6. words that name ruler marks or the key (third pass, items 5 and 6)', () => {
  const CONTENT = read('src/features/lab/guidedLessons/content.ts');
  const RG = read('src/screens/lab/reverbScreenGuides.ts');
  const HELP = read('src/features/lab/guidedLessons/sourceHelp.ts');
  it('the reverb steps name the time, not a mark that a tempo can take away', () => {
    assert.match(CONTENT, /notice: "At 0\.40 s the wash sinks to the bottom by about 0\.5 s\. At 6\.0 s it falls only a little before the next click, and the tails pile up\."/);
    assert.match(CONTENT, /notice: "The wash nearly reaches the bottom within about 1 s, while DESIGNED RESPONSE stays put\."/);
    assert.match(RG, /the wash nearly reaches the bottom within about 1 s\. DESIGNED RESPONSE stays put/);
    assert.doesNotMatch(CONTENT + RG, /by the 1 s mark/);
  });
  it('the SOURCE key help says a CLICK shows its tempo', () => {
    assert.match(HELP, /notice: "The key shows the source you picked \(for CLICK, its tempo\), and THE AUDIO PATH/);
  });
});