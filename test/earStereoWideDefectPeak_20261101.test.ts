/**
 * D41 #25/#27 and #26 (owner approved 2026-11-01) — receipts.
 *
 *   #25/#27 Stereo Recognition "Wide" used to be anti-correlated (corr −0.6
 *   to −0.9, side louder than mid), so its goniometer leaned toward the
 *   out-of-phase shape and its corr read like a phase warning. Wide is now a
 *   broad cloud that stays POSITIVE (corr +0.2…+0.5, mid ≥ side) on every
 *   level that plays it, including both clips of the level-4 "Which clip is
 *   wider?" pairs, where the wider clip must still be clearly wider.
 *
 *   #26 Defects: present() raised a lone click (1–3 samples in 1.6 s of
 *   silence) to −20 dBFS RMS, which put its peak at up to 28× full scale;
 *   encodeWav clamps that. Defects now ask present() for a −1 dBFS peak
 *   ceiling. Every other caller of present() passes no ceiling and gets
 *   exactly the samples it got before.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
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

const { M6_STEREO } = await import('../src/features/ear/modules/spatial.ts');
const { M5_DEFECTS } = await import('../src/features/ear/modules/defects.ts');
const { present, PEAK_CEILING } = await import('../src/features/ear/modules/common.ts');
const { normalizeRms, fadeEdges, pinkNoise, makeRng, rmsDb, SR } = await import('../src/features/ear/earDsp.ts');

type St = { l: Float32Array; r: Float32Array };
const measure = (b: St) => {
  let lr = 0, ll = 0, rr = 0, em = 0, es = 0;
  for (let i = 0; i < b.l.length; i++) {
    const l = b.l[i], r = b.r[i];
    lr += l * r; ll += l * l; rr += r * r;
    em += ((l + r) / 2) ** 2; es += ((l - r) / 2) ** 2;
  }
  return { corr: lr / Math.sqrt(ll * rr), sideDb: 10 * Math.log10(es / em) };
};
const label = (t: { answers: { label: string }[]; correct: number }) => t.answers[t.correct].label;
const peak = (x: Float32Array) => x.reduce((m, v) => Math.max(m, Math.abs(v)), 0);

describe('Stereo Recognition: Wide is wide but positively correlated', () => {
  it('levels 2 and 3: every Wide trial reads corr +0.2…+0.5 with mid ≥ side', () => {
    let wides = 0;
    for (const level of [2, 3]) {
      for (let seed = 1; seed <= 300; seed++) {
        const t = M6_STEREO.makeTrial(level, seed * 7919);
        if (label(t) !== 'Wide') continue;
        wides++;
        const { corr, sideDb } = measure(t.clips[0].buf as St);
        assert.ok(corr >= 0.2 && corr <= 0.5, `L${level} seed ${seed}: Wide corr ${corr.toFixed(3)}`);
        assert.ok(sideDb <= 0, `L${level} seed ${seed}: side ${sideDb.toFixed(2)} dB over mid`);
        assert.ok(sideDb > -6, `L${level} seed ${seed}: side ${sideDb.toFixed(2)} dB is not wide`);
      }
    }
    assert.ok(wides >= 40, `only ${wides} Wide trials sampled`);
  });

  it('level 3: Wide and Out of phase sit far apart on the correlation scale; Narrow stays ≥ 0.8', () => {
    const seen: Record<string, number[]> = {};
    for (let seed = 1; seed <= 200; seed++) {
      const t = M6_STEREO.makeTrial(3, seed * 104729);
      (seen[label(t)] ??= []).push(measure(t.clips[0].buf as St).corr);
    }
    for (const c of seen['Out of phase']) assert.ok(c <= -0.99);
    for (const c of seen['Wide']) assert.ok(c >= 0.2);
    for (const c of seen['Narrow']) assert.ok(c >= 0.8, `Narrow corr ${c.toFixed(3)}`);
  });

  it('level 4: the wider clip is clearly wider, and both clips stay positive', () => {
    let widerA = 0, widerB = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const t = M6_STEREO.makeTrial(4, seed * 31337);
      assert.equal(t.question, 'Which clip is wider?');
      const w = measure(t.clips[t.correct].buf as St);
      const n = measure(t.clips[1 - t.correct].buf as St);
      if (t.correct === 0) widerA++; else widerB++;
      assert.ok(w.sideDb - n.sideDb >= 3.5, `seed ${seed}: only ${(w.sideDb - n.sideDb).toFixed(2)} dB more side`);
      assert.ok(w.sideDb <= 0, `seed ${seed}: wider clip has side over mid`);
      assert.ok(w.corr >= 0.2 && w.corr <= 0.5, `seed ${seed}: wider corr ${w.corr.toFixed(3)}`);
      assert.ok(n.corr > 0 && n.corr - w.corr >= 0.2, `seed ${seed}: narrower corr ${n.corr.toFixed(3)} vs ${w.corr.toFixed(3)}`);
    }
    assert.ok(widerA > 50 && widerB > 50, `answer side is not balanced (${widerA}/${widerB})`);
  });
});

describe('Defects: no sample ever passes full scale', () => {
  it('every trial at levels 1–4 peaks at or under −1 dBFS', () => {
    const hit = new Set<string>();
    for (let level = 1; level <= 4; level++) {
      for (let seed = 1; seed <= 60; seed++) {
        const t = M5_DEFECTS.makeTrial(level, seed * 7919 + level);
        const p = peak(t.clips[0].buf as Float32Array);
        hit.add(label(t));
        assert.ok(p <= PEAK_CEILING + 1e-6, `L${level} seed ${seed} ${label(t)}: peak ${p.toFixed(2)}`);
      }
    }
    for (const want of ['Click', 'Crackle', 'Pop']) assert.ok(hit.has(want), `${want} never sampled`);
  });

  it('levels 3–4: every trial, Click and Crackle included, plays at −20 dBFS RMS (±1 dB) — the ceiling never turns the bed down', () => {
    // A ceiling on the whole mix once played L3 Click trials at −35…−40 dBFS:
    // "the quiet one is the click". addUnder() caps the defect's own gain instead.
    const hit = new Set<string>();
    for (const level of [3, 4]) {
      for (let seed = 1; seed <= 150; seed++) {
        const t = M5_DEFECTS.makeTrial(level, seed * 104729 + level);
        const b = t.clips[0].buf as Float32Array;
        hit.add(label(t));
        const r = rmsDb(b);
        assert.ok(Math.abs(r + 20) <= 1, `L${level} seed ${seed} ${label(t)}: ${r.toFixed(2)} dBFS RMS`);
        assert.ok(peak(b) <= PEAK_CEILING + 1e-6, `L${level} seed ${seed} ${label(t)}: peak ${peak(b).toFixed(2)}`);
      }
    }
    for (const want of ['Click', 'Crackle', 'Pop']) assert.ok(hit.has(want), `${want} never sampled at L3–L4`);
  });

  it('a lone click is raised only until its peak meets the ceiling', () => {
    const x = new Float32Array(Math.round(1.6 * SR));
    x[30000] = 0.9;
    const out = present(x, -20, 8, PEAK_CEILING);
    assert.ok(Math.abs(peak(out) - PEAK_CEILING) < 1e-6);
  });

  it('present() is unchanged for every caller that passes no ceiling, and for clips already under it', () => {
    const src = pinkNoise(1.0, makeRng(42));
    const before = fadeEdges(normalizeRms(Float32Array.from(src), -20), 8);
    assert.deepEqual(present(Float32Array.from(src)), before);
    assert.ok(peak(before) < PEAK_CEILING);
    assert.deepEqual(present(Float32Array.from(src), -20, 8, PEAK_CEILING), before);
    // A hot click with no ceiling is still the old RMS-only result (the
    // other modules keep their RMS loudness match).
    const hot = new Float32Array(Math.round(1.6 * SR));
    hot[30000] = 0.9;
    assert.ok(peak(present(hot)) > 20);
  });
});
