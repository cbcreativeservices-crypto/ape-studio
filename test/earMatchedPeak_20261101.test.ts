/**
 * D41 J1 (owner approved 2026-11-01: "lets continue fixing what the bugs
 * discovered") — Ear Training A/B and matched-set modules no longer clip.
 *
 *   Every clip used to be RMS-normalised to −20 dBFS on its own with no peak
 *   cap, and encodeWav hard-clamps at ±1. Compressed drums reached ~4× full
 *   scale, polarity sums ~2×, reverb and comb ~1.2×. A cap on ONE clip of a
 *   pair would make the pair unequal and give the answer away, so each trial
 *   now presents its clips as one matched set (presentMatched): one shared
 *   gain, loudest peak at or under −1 dBFS. One-clip "which setting?" trials
 *   play at a FIXED per-module/level constant (derived offline from the worst
 *   peak of every answer, ≥ 1 dB margin), so the level never depends on the
 *   answer and only the played clip is rendered; presentFixed's ceiling is a
 *   turn-down-only guard that must never fire. Round 2: the delay "how long?"
 *   clip is padded for the longest time, so its length no longer tells the
 *   answer. Defects keep their own 11-01 fix (addUnder + PEAK_CEILING).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// The ear modules import their siblings without an extension (Metro style).
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { present, presentMatched, drumPattern, rngFor, PEAK_CEILING } = await import('../src/features/ear/modules/common.ts');
const { compress, pinkNoise, makeRng, rmsDb } = await import('../src/features/ear/earDsp.ts');
const { M10_COMPRESSION } = await import('../src/features/ear/modules/dynamics.ts');
const { M8_DELAY, M9_REVERB, M12_POLARITY, M13_COMB } = await import('../src/features/ear/modules/time.ts');

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const peak = (x: Float32Array) => x.reduce((m, v) => Math.max(m, Math.abs(v)), 0);

describe('presentMatched: one shared gain for a set', () => {
  it('a set already under the ceiling is exactly present() per clip', () => {
    const a = pinkNoise(1.0, makeRng(7));
    const b = pinkNoise(1.0, makeRng(8));
    const [pa, pb] = presentMatched([a, b]);
    assert.deepEqual(pa, present(a));
    assert.deepEqual(pb, present(b));
  });

  it('a hot set is turned down together: the loudest peak lands on the ceiling, the RMS match survives', () => {
    const dry = drumPattern(2, rngFor(3));
    const heavy = compress(dry, 8, -30, 5, 100);
    // The old per-clip result: the heavy render clamps at full scale.
    assert.ok(peak(present(heavy)) > 2, `old heavy peak ${peak(present(heavy)).toFixed(2)}`);
    const [d, h] = presentMatched([dry, heavy]);
    assert.ok(Math.abs(Math.max(peak(d), peak(h)) - PEAK_CEILING) < 1e-6);
    const before = rmsDb(present(dry)) - rmsDb(present(heavy));
    const after = rmsDb(d) - rmsDb(h);
    assert.ok(Math.abs(after - before) < 1e-3, `match moved ${(after - before).toFixed(4)} dB`);
  });
});

const SETS = [
  ['compression', M10_COMPRESSION],
  ['polarity', M12_POLARITY],
  ['comb', M13_COMB],
  ['reverb', M9_REVERB],
  ['delay', M8_DELAY],
] as const;

describe('A/B and matched-set ear modules never pass −1 dBFS and stay level-matched', () => {
  for (const [name, mod] of SETS) {
    it(`${name}: every level, every trial — peak ≤ −1 dBFS; clips within a trial ≤ 0.5 dB apart`, () => {
      for (let level = 1; level <= mod.levels; level++) {
        for (let k = 0; k < 20; k++) {
          const seed = 52000 + k * 7919 + level;
          const t = mod.makeTrial(level, seed);
          const bufs = t.clips.map((c) => c.buf as Float32Array);
          for (const b of bufs) assert.ok(peak(b) <= PEAK_CEILING + 1e-6, `${name} L${level} seed ${seed}: peak ${peak(b).toFixed(3)}`);
          // Polarity L1 keeps its documented level drop: the flipped sum is silence.
          const rms = bufs.map((b) => rmsDb(b)).filter((r) => r > -100);
          if (rms.length > 1) {
            const spread = Math.max(...rms) - Math.min(...rms);
            assert.ok(spread <= 0.5, `${name} L${level} seed ${seed}: clips ${spread.toFixed(2)} dB apart`);
          }
        }
      }
    });
  }

  it('one-clip trials play at a fixed level for every answer; the turn-down guard never fires', () => {
    // A per-answer cap would play compression "None" ~10 dB louder than
    // "Heavy". Every answer must land on the level's constant (fades shave a
    // hair off the RMS), and no clip may sit ON the ceiling (= the guard fired).
    const ONE: Array<[string, any, number[]]> = [
      ['compression', M10_COMPRESSION, [2, 3]],
      ['polarity', M12_POLARITY, [2, 3]],
      ['reverb', M9_REVERB, [2, 3, 4, 5]],
      ['delay', M8_DELAY, [1, 2, 3, 4]],
    ];
    for (const [name, mod, levels] of ONE) {
      for (const level of levels) {
        const by: Record<string, number[]> = {};
        let n = 0;
        for (let k = 0; n < 30 && k < 400; k++) {
          const seed = 61000 + k * 104729 + level;
          const t = mod.makeTrial(level, seed);
          if (t.clips.length !== 1) continue;
          n++;
          const b = t.clips[0].buf as Float32Array;
          assert.ok(peak(b) < PEAK_CEILING * 0.999, `${name} L${level} seed ${seed}: peak ${peak(b).toFixed(4)} — the guard fired`);
          (by[t.answers[t.correct].label] ??= []).push(rmsDb(b));
        }
        assert.ok(n >= 10, `${name} L${level}: only ${n} one-clip trials`);
        // presentFixed fades before it sets the RMS, so every clip lands on
        // its level's constant exactly.
        const all = Object.values(by).flat();
        const span = Math.max(...all) - Math.min(...all);
        const means = Object.values(by).map((v) => v.reduce((x, y) => x + y, 0) / v.length);
        const gap = Math.max(...means) - Math.min(...means);
        assert.ok(span < 0.05, `${name} L${level}: one-clip levels span ${span.toFixed(2)} dB`);
        assert.ok(gap < 0.05, `${name} L${level}: per-answer levels ${gap.toFixed(2)} dB apart`);
      }
    }
    // ~12 dB under the other drills at L1–L3, and the screen says so.
    const l1 = M10_COMPRESSION.makeTrial(1, 777);
    assert.ok(rmsDb(l1.clips[0].buf as Float32Array) < -28);
    assert.ok(M10_COMPRESSION.playbackNote.includes('Levels 1–3 play quieter so no hit ever clips.'));
  });

  it('delay "how long?": the clip is the same length whatever the answer (the lit ▶ is no tell)', () => {
    const lens = new Map<string, Set<number>>();
    for (let level = 1; level <= 4; level++) {
      for (let k = 0; k < 120; k++) {
        const t = M8_DELAY.makeTrial(level, 71000 + k * 7919 + level);
        if (t.question !== 'About how long is the delay?') continue;
        const label = t.answers[t.correct].label;
        if (!lens.has(label)) lens.set(label, new Set());
        lens.get(label)!.add((t.clips[0].buf as Float32Array).length);
      }
    }
    assert.ok(lens.size >= 4, `only ${[...lens.keys()].join(', ')} sampled`);
    const all = new Set([...lens.values()].flatMap((s) => [...s]));
    assert.equal(all.size, 1, `clip lengths by answer: ${[...lens].map(([k, v]) => `${k}=${[...v].join('/')}`).join(' · ')}`);
  });

  it('one-clip trials render only the clip they play, at a fixed per-level constant', () => {
    const T = read('src/features/ear/modules/time.ts');
    const D = read('src/features/ear/modules/dynamics.ts');
    assert.match(D, /const M10_ONE_CLIP_DB = -34\.5;/);
    assert.match(D, /const out = m10One\(setting, rng\);/);
    assert.match(T, /const presentOne = \(x: Mono, rmsTargetDb: number\): Mono => presentFixed\(x, rmsTargetDb\);/);
    assert.match(D, /return presentFixed\(setting\.apply \? setting\.apply\(dry\) : dry, M10_ONE_CLIP_DB\);/);
    assert.match(T, /presentOne\(withEcho\(src, askDelay\), ONE_CLIP_DB\.delay\)/);
    assert.match(T, /const src = pluckPattern\(rng, 0\.6 \+ LONGEST_DELAY_MS \/ 500\);/);
    // No one-clip trial renders the whole deck any more.
    assert.doesNotMatch(T, /presentMatched\((?:DELAY_CHIPS|variants|decays|deck)\.map/);
    assert.doesNotMatch(D, /presentMatched\(deck\.map/);
  });
});
