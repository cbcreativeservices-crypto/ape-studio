/**
 * Drum Tuning Lab — the pure engine (owner spec 2026-10-01).
 *
 *  • Mode ratios are the Bessel-zero ratios (01 = 1, 11 ≈ 1.59, 21 ≈ 2.14,
 *    02 ≈ 2.30, 31 ≈ 2.65).
 *  • Tension → pitch is monotonic; f ∝ √T / D.
 *  • A non-uniform lug map splits the degenerate modes into beating pairs;
 *    an even map does not.
 *  • Damping shortens the decay and takes the upper modes first.
 *  • The pitch bend is DOWNWARD and deeper at lower tension / harder strike.
 *  • The resonant head and its relationship change the decay.
 *  • The snare wires are gated by the strainer; the kick's front head
 *    changes the sustain; the kit interval and goal judges read sensibly.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { StrikeParams } from '../src/screens/lab/drumtuning/drumEngine.ts';

// The Cymatics chain (plateModes → materials / modalLibrary) imports without
// extensions, so resolve `.ts` the way test/cymaticsMembrane.test.ts does.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const {
  BEND_K, DRUMS, MODE_RATIOS, SYMPTOMS, beatRateHz, bendCents, coupledModes, dampingLoss, evenHead, evenness, fundamentalHz, judgeGoal, lugCents,
  dominantCents, lugTapHz, modeRatio, modeSplit, randomUnevenHead, renderStrike, renderTap, semitones, spreadCents, strikePartials, sustainT60, tensionForHz, tomInterval, upperRatio,
} = await import('../src/screens/lab/drumtuning/drumEngine.ts');

const base = (over: Partial<StrikeParams> = {}): StrikeParams => ({
  drum: 'rack',
  batter: evenHead(3000, 6),
  reso: evenHead(3000, 6),
  resoPresent: true,
  damping: 0,
  strike: 0.8,
  strikeR: 0.3,
  strikeTheta: 0,
  ...over,
});

describe('mode ratios', () => {
  it('are the clamped-membrane Bessel-zero ratios', () => {
    assert.equal(modeRatio(0, 1), 1);
    assert.ok(Math.abs(modeRatio(1, 1) - 1.594) < 0.003, `(1,1) ${modeRatio(1, 1)}`);
    assert.ok(Math.abs(modeRatio(2, 1) - 2.136) < 0.003);
    assert.ok(Math.abs(modeRatio(0, 2) - 2.296) < 0.003);
    assert.ok(Math.abs(modeRatio(3, 1) - 2.653) < 0.003);
    for (let i = 1; i < MODE_RATIOS.length; i++) assert.ok(MODE_RATIOS[i].ratio > MODE_RATIOS[i - 1].ratio, 'ascending');
  });
});

describe('tension and pitch', () => {
  it('more tension → higher pitch, monotonically, as √T', () => {
    let prev = 0;
    for (let T = 1000; T <= 6000; T += 500) {
      const f = fundamentalHz(12, T, 0.35);
      assert.ok(f > prev);
      prev = f;
    }
    const f1 = fundamentalHz(12, 2000, 0.35);
    const f4 = fundamentalHz(12, 8000, 0.35);
    assert.ok(Math.abs(f4 / f1 - 2) < 1e-9, '4× tension = 2× pitch');
  });
  it('a bigger head is lower (f ∝ 1/D) and the inverse round-trips', () => {
    assert.ok(Math.abs(fundamentalHz(12, 3000, 0.35) / fundamentalHz(24, 3000, 0.35) - 2) < 1e-9);
    const T = tensionForHz(14, 200, 0.35);
    assert.ok(Math.abs(fundamentalHz(14, T, 0.35) - 200) < 1e-6);
  });
  it('a 12" tom at 3 kN/m sits in a plausible range', () => {
    const f = fundamentalHz(12, 3000, 0.35);
    assert.ok(f > 100 && f < 300, `${f}`);
  });
});

describe('the lug map', () => {
  it('an even head has no spread, no split and no beat', () => {
    const h = evenHead(3000, 8);
    assert.equal(spreadCents(h), 0);
    assert.equal(modeSplit(h, 1), 0);
    assert.equal(beatRateHz(h, 12, 0.35), 0);
    assert.equal(evenness(h).verdict, 'even');
  });
  it('one rod a quarter turn high splits the (1,1) pair into a beating pair', () => {
    const h = evenHead(3000, 8);
    h.turns[2] = 0.25;
    assert.ok(modeSplit(h, 1) > 0.002, `split ${modeSplit(h, 1)}`);
    const beat = beatRateHz(h, 12, 0.35);
    assert.ok(beat > 0.5 && beat < 12, `beat ${beat} Hz`);
    const parts = strikePartials(base({ batter: h, drum: 'rack' }));
    const pair = parts.filter((q) => q.n === 1 && q.s === 1);
    assert.equal(pair.length, 2, 'the (1,1) mode became a pair');
    assert.ok(Math.abs(pair[0].pairHz) > 0.3);
    const even = strikePartials(base()).filter((q) => q.n === 1 && q.s === 1);
    assert.equal(even.length, 1, 'an even head keeps a single (1,1)');
    assert.equal(even[0].pairHz, 0);
  });
  it('the lug tap pitch follows the local tension; the evenness text names the odd lug', () => {
    const h = evenHead(3000, 8);
    h.turns[5] = 0.4;
    const hz = h.turns.map((_, i) => lugTapHz(h, i, 14, 0.35));
    assert.ok(hz[5] > hz[0]);
    const c = lugCents(h);
    assert.ok(c[5] > 20 && c[0] < 0);
    const e = evenness(h);
    assert.match(e.message, /lug 6/);
    assert.match(e.message, /higher/);
    const better = { ...h, turns: h.turns.map((t) => t * 0.5) };
    assert.match(evenness(better, spreadCents(h)).message, /becoming more even/);
  });
  it('a practice head is uneven and seeded', () => {
    const a = randomUnevenHead(3000, 8, 7);
    const b = randomUnevenHead(3000, 8, 7);
    assert.deepEqual(a.turns, b.turns);
    assert.ok(spreadCents(a) > 25);
    assert.notDeepEqual(randomUnevenHead(3000, 8, 8).turns, a.turns);
  });
});

describe('damping', () => {
  it('shortens the decay and takes the upper modes first', () => {
    const dry = renderStrike(base({ damping: 0 }));
    const wet = renderStrike(base({ damping: 0.7 }));
    assert.ok(sustainT60(wet.mono) < sustainT60(dry.mono) * 0.6, `${sustainT60(dry.mono)} → ${sustainT60(wet.mono)}`);
    assert.ok(dampingLoss(0.5, 4) > dampingLoss(0.5, 0), 'loss grows with mode number');
    const fb = fundamentalHz(12, 3000, 0.35);
    assert.ok(upperRatio(wet.partials, fb) < upperRatio(dry.partials, fb));
  });
});

describe('pitch bend', () => {
  it('is downward: the trace starts sharp and falls', () => {
    const r = renderStrike(base({ strike: 1, batter: evenHead(1500, 6), reso: evenHead(1500, 6) }));
    assert.ok(r.pitchTraces.length >= 1);
    for (const tr of r.pitchTraces) {
      const first = tr.pts[0].cents;
      const later = tr.pts[Math.floor(tr.pts.length * 0.6)].cents;
      assert.ok(later < first - 10, `${tr.label} glides down (${first.toFixed(0)} → ${later.toFixed(0)})`);
      for (let i = 1; i < 30; i++) assert.ok(tr.pts[i].cents <= tr.pts[i - 1].cents + 1e-6, 'monotone over the early decay');
    }
    // The dominant mode starts sharp of the batter's own (0,1).
    const d0 = dominantCents(r.pitchTraces, 0);
    const d1 = dominantCents(r.pitchTraces, 1.0);
    assert.ok(d0 > 20, `starts sharp (${d0.toFixed(1)} cents)`);
    assert.ok(d1 < d0, 'the late pitch sits below the early pitch');
  });
  it('is deeper at lower tension and with a harder strike', () => {
    assert.ok(bendCents(1, 1500) > bendCents(1, 4000));
    assert.ok(bendCents(1, 2000) > bendCents(0.4, 2000));
    assert.ok(Math.abs(bendCents(1, 2000) - 80) < 2, `≈ 80 cents at the reference (${bendCents(1, 2000)})`);
    assert.ok(BEND_K > 0);
  });
});

describe('two heads through the air', () => {
  it('the coupled pair brackets the heads and the lower mode is the long one', () => {
    const m = coupledModes(200, 200, 0.6, 3, 2);
    assert.equal(m.length, 2);
    assert.ok(m[0].hz < m[1].hz);
    assert.ok(Math.abs(m[0].hz - 200) < 1e-6, 'equal heads: the lower mode is the head pitch (no air compression)');
    assert.ok(m[1].hz > 200, 'the higher mode compresses the air');
    assert.ok(m[1].radiate > m[0].radiate, 'the monopole radiates more');
    const solo = coupledModes(200, 200, 0, 3, 2);
    assert.equal(solo.length, 1);
  });
  it('the resonant head changes the decay; the relationship changes where the energy sits', () => {
    const withReso = renderStrike(base());
    const noReso = renderStrike(base({ resoPresent: false }));
    assert.notEqual(sustainT60(withReso.mono).toFixed(2), sustainT60(noReso.mono).toFixed(2));
    const lower = coupledModes(200, 170, 0.6, 3, 2);
    const higher = coupledModes(200, 235, 0.6, 3, 2);
    // Resonant lower: the LOWER mode leans on the resonant head (long), the
    // batter-heavy mode is the upper one. Resonant higher: the reverse.
    assert.ok(Math.abs(lower[0].vr) > Math.abs(lower[0].vb));
    assert.ok(Math.abs(higher[0].vb) > Math.abs(higher[0].vr));
    assert.ok(lower[0].loss < lower[1].loss, 'the resonant-heavy mode sustains longer');
    const tLow = sustainT60(renderStrike(base({ reso: evenHead(2200, 6) })).mono);
    const tEq = sustainT60(renderStrike(base()).mono);
    const tHi = sustainT60(renderStrike(base({ reso: evenHead(4200, 6) })).mono);
    assert.ok(new Set([tLow.toFixed(2), tEq.toFixed(2), tHi.toFixed(2)]).size >= 2, `the three relationships do not all decay alike (${tLow}, ${tEq}, ${tHi})`);
  });
});

describe('snare and kick', () => {
  it('the strainer gates the wires and chokes the snare-side head', () => {
    const loose = strikePartials(base({ drum: 'snare', strainer: 0.1, batter: evenHead(4000, 10), reso: evenHead(5000, 10) }));
    const tight = strikePartials(base({ drum: 'snare', strainer: 0.9, batter: evenHead(4000, 10), reso: evenHead(5000, 10) }));
    const resoLossLoose = Math.max(...loose.filter((q) => q.head === 'coupled').map((q) => q.loss));
    const resoLossTight = Math.max(...tight.filter((q) => q.head === 'coupled').map((q) => q.loss));
    assert.ok(resoLossTight > resoLossLoose, 'a tight strainer adds loss on the snare side');
    const off = renderStrike(base({ drum: 'snare', strainer: 0, batter: evenHead(4000, 10), reso: evenHead(5000, 10) }));
    const on = renderStrike(base({ drum: 'snare', strainer: 0.4, batter: evenHead(4000, 10), reso: evenHead(5000, 10) }));
    // Wires add broadband energy: the on-render is "noisier" late in the hit.
    const hf = (x: Float32Array) => {
      let s = 0;
      for (let i = 1; i < x.length; i++) s += (x[i] - x[i - 1]) ** 2;
      return s;
    };
    assert.ok(hf(on.mono) > hf(off.mono) * 1.2, 'wires on = more high-frequency content');
  });
  it('the kick: a ported or removed front head shortens the sustain', () => {
    const open = sustainT60(renderStrike(base({ drum: 'kick', batter: evenHead(1500, 8), reso: evenHead(1500, 8), frontHead: 'open' })).mono);
    const ported = sustainT60(renderStrike(base({ drum: 'kick', batter: evenHead(1500, 8), reso: evenHead(1500, 8), frontHead: 'ported' })).mono);
    assert.ok(ported < open, `${ported} < ${open}`);
    const f = fundamentalHz(22, 1500, 0.5);
    assert.ok(f > 35 && f < 110, `a kick fundamental (${f})`);
  });
});

describe('renders', () => {
  it('a strike and a tap are peak-normalised, finite, the right length', () => {
    const r = renderStrike(base());
    assert.equal(r.mono.length, Math.round(DRUMS.rack.seconds * 48000));
    let peak = 0;
    for (const v of r.mono) {
      assert.ok(Number.isFinite(v));
      peak = Math.max(peak, Math.abs(v));
    }
    assert.ok(Math.abs(peak - 0.7) < 1e-3);
    const t = renderTap(evenHead(3000, 8), 3, 'snare');
    assert.ok(t.mono.length > 0 && t.seconds < 1);
  });
});

describe('the kit and the goals', () => {
  it('tom intervals: too close, distinct, unbalanced', () => {
    assert.equal(tomInterval(180, 170).kind, 'close');
    assert.equal(tomInterval(190, 130).kind, 'distinct');
    assert.equal(tomInterval(250, 100).kind, 'unbalanced');
    assert.equal(tomInterval(120, 140).kind, 'unbalanced');
    assert.ok(Math.abs(semitones(200, 100) - 12) < 1e-9);
  });
  it('goals read the measures: short vs open are opposites', () => {
    const shortM = { t60: 0.3, f0: 200, bendCents: 10, upper: 0.1, drum: 'rack' as const };
    const openM = { t60: 1.4, f0: 200, bendCents: 10, upper: 0.2, drum: 'rack' as const };
    assert.equal(judgeGoal('short', shortM).met, true);
    assert.equal(judgeGoal('open', shortM).met, false);
    assert.equal(judgeGoal('open', openM).met, true);
    assert.equal(judgeGoal('bend', { ...openM, bendCents: 60 }).met, true);
    assert.equal(judgeGoal('low', { ...openM, f0: 140 }).met, true);
    assert.equal(judgeGoal('low', { ...openM, f0: 250 }).met, false);
  });
  it('every symptom case offers several areas, several fixes and exactly one that clears it', () => {
    assert.equal(SYMPTOMS.length, 5);
    for (const s of SYMPTOMS) {
      assert.ok(s.areas.length >= 3, s.id);
      assert.ok(s.fixes.length >= 3, s.id);
      assert.equal(s.fixes.filter((f) => f.id === s.fix).length, 1, s.id);
    }
  });
});
