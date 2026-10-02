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
 *  • The snare wires are gated by the strainer AND the stroke; a tight
 *    strainer chokes the whole drum; the kick's front head changes the
 *    sustain (removed < ported < open); the kit interval and goal judges
 *    read sensibly.
 *  • LEVEL (audio review, critical): the stroke is heard as level — a light
 *    tap renders ≥ 6 dB under a full hit; a lug tap is quieter than a
 *    stroke; nothing exceeds the −3 dBFS reference peak.
 *  • The relationship's "bend" is the amplitude-weighted pitch centre,
 *    clamped — never a mode-switch jump of several semitones.
 *  • Symptom cases: several areas, several fixes, at least one that clears
 *    (excessive ring accepts a gel pad), the causes are among the areas.
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
  BEND_K, BEND_MAX_CENTS, DRUMS, MODE_RATIOS, PITCH_CLAMP, RENDER_PEAK, SYMPTOMS, TURN_NPM, beatRateHz, bendCents, coupledModes, dampingLoss, evenHead, evenness, fundamentalHz, judgeGoal, lugCents,
  lugTapHz, lugTensions, meanTension, modeRatio, modeSplit, randomUnevenHead, renderStrike, renderTap, semitones, spreadCents, strikeGain, strikePartials, sustainT60, tensionForHz, tomInterval, turnsForCents, upperRatio, weightedCents,
} = await import('../src/screens/lab/drumtuning/drumEngine.ts');

const rmsDb = (x: Float32Array): number => {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  return 20 * Math.log10(Math.sqrt(s / x.length));
};
const peakOf = (x: Float32Array): number => {
  let m = 0;
  for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i]));
  return m;
};
/** Broadband "noisiness": the wires add high-frequency energy. */
const hf = (x: Float32Array): number => {
  let s = 0;
  for (let i = 1; i < x.length; i++) s += (x[i] - x[i - 1]) ** 2;
  return s;
};

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
  it('the lug tap pitch follows the local tension; the evenness text names the rod, the direction AND an amount', () => {
    const h = evenHead(3000, 8);
    h.turns[5] = 0.4;
    const hz = h.turns.map((_, i) => lugTapHz(h, i, 14, 0.35));
    assert.ok(hz[5] > hz[0]);
    const c = lugCents(h);
    assert.ok(c[5] > 20 && c[0] < 0);
    const e = evenness(h);
    assert.match(e.message, /rod 6/);
    assert.match(e.message, /higher/);
    assert.match(e.message, /loosen it .*turn/, 'the direction and a rough amount');
    const better = { ...h, turns: h.turns.map((t) => t * 0.5) };
    assert.match(evenness(better, spreadCents(h)).message, /becoming more even/);
    // Two rods out: both named, both moves.
    const two = evenHead(3000, 8);
    two.turns[2] = 0.3;
    two.turns[6] = -0.3;
    const m = evenness(two).message;
    assert.match(m, /Rod 3 is the highest/);
    assert.match(m, /Rod 7 is the lowest/);
    assert.match(m, /loosen it about/);
    assert.match(m, /tighten it about/);
    // The BRIEF form (the independent pass) names no rod — the ear has to.
    const brief = evenness(two, undefined, 'brief').message;
    assert.doesNotMatch(brief, /[Rr]od \d/);
    assert.match(brief, /Tap round the head/);
    assert.equal(evenness(two).high.lug, 2);
    assert.equal(evenness(two).low.lug, 6);
  });
  it('a rod turn adds a FIXED tension step, so a quarter turn moves a loose head more (in cents) than a tight one; turnsForCents inverts the map', () => {
    const loose = evenHead(1200, 8);
    const tight = evenHead(4000, 8);
    loose.turns[0] = 0.25;
    tight.turns[0] = 0.25;
    assert.ok(Math.abs(lugTensions(loose)[0] - 1200 - TURN_NPM / 4) < 1e-9);
    assert.ok(lugCents(loose)[0] > lugCents(tight)[0] * 2, `${lugCents(loose)[0]} vs ${lugCents(tight)[0]}`);
    const h = evenHead(2400, 8);
    h.turns[3] = 0.2;
    const c = lugCents(h)[3];
    // Moving rod 4 by −turnsForCents(c) (about) brings it back to the mean.
    const back = { ...h, turns: h.turns.map((t, i) => (i === 3 ? t - turnsForCents(c, meanTension(h)) : t)) };
    // A rough amount: moving one rod also moves the mean a little, so a few
    // cents remain — the next tap-and-turn takes them.
    assert.ok(Math.abs(lugCents(back)[3]) < 8 && Math.abs(lugCents(back)[3]) < Math.abs(c) / 4, `${lugCents(back)[3]} cents left of ${c}`);
  });
  it('a 6-lug head cannot show a (2,1) split of its own (lug-ring Nyquist); 8 lugs can', () => {
    const six = { tension: 3000, turns: [0.3, 0, 0, 0, 0, 0] };
    assert.equal(modeSplit(six, 2), 0);
    assert.ok(modeSplit(six, 1) > 0);
    const eight = { tension: 3000, turns: [0.3, 0, 0, 0, 0, 0, 0, 0] };
    assert.ok(modeSplit(eight, 2) > 0);
    assert.equal(modeSplit(eight, 3), 0);
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
    // The weighted pitch centre starts sharp of the batter's own (0,1) and ends lower.
    const d0 = weightedCents(r.pitchTraces, 0);
    const d1 = weightedCents(r.pitchTraces, 1.0);
    assert.ok(d0 > 20, `starts sharp (${d0.toFixed(1)} cents)`);
    assert.ok(d1 < d0, 'the late pitch sits below the early pitch');
  });
  it('is deeper at lower tension and with a harder strike, and never deeper than the cap', () => {
    assert.ok(bendCents(1, 1500) > bendCents(1, 4000));
    assert.ok(bendCents(1, 2000) > bendCents(0.4, 2000));
    assert.ok(Math.abs(bendCents(1, 2000) - 80) < 2, `≈ 80 cents at the reference (${bendCents(1, 2000)})`);
    assert.ok(BEND_K > 0);
    const floorAt80 = bendCents(1, tensionForHz(16, 80, 0.35));
    assert.ok(floorAt80 <= BEND_MAX_CENTS + 1e-6, `a loose floor tom bends ${floorAt80}, cap ${BEND_MAX_CENTS}`);
    assert.ok(bendCents(1, 300) <= BEND_MAX_CENTS + 1e-6);
  });
  it('the relationship "bend" is an amplitude-weighted centre, clamped — never a three-semitone mode jump', () => {
    const bat = { tension: tensionForHz(12, 190, 0.35), turns: new Array(6).fill(0) };
    const res = (hz: number) => ({ tension: tensionForHz(12, hz, 0.25), turns: new Array(6).fill(0) });
    for (const st of [3, 0, -3, -6]) {
      const r = renderStrike(base({ batter: bat, reso: res(190 * 2 ** (st / 12)), strike: 0.85 }));
      const early = weightedCents(r.pitchTraces, 0.05);
      const late = weightedCents(r.pitchTraces, 0.9);
      assert.ok(Math.abs(late) <= PITCH_CLAMP && Math.abs(early) <= PITCH_CLAMP, `clamped at ±${PITCH_CLAMP} (${st} st: ${early} → ${late})`);
    }
    // Where the late sound sits follows the resonant head: above with it high, below with it low.
    const hi = weightedCents(renderStrike(base({ batter: bat, reso: res(190 * 2 ** (3 / 12)), strike: 0.85 })).pitchTraces, 0.9);
    const lo = weightedCents(renderStrike(base({ batter: bat, reso: res(190 * 2 ** (-3 / 12)), strike: 0.85 })).pitchTraces, 0.9);
    assert.ok(hi > 0 && lo < 0, `late sound: reso high ${hi}, reso low ${lo}`);
  });
});

describe('level: the stroke is heard', () => {
  it('a light tap renders ≥ 6 dB under a full hit; nothing exceeds the reference peak', () => {
    const soft = renderStrike(base({ strike: 0.2 }));
    const full = renderStrike(base({ strike: 1 }));
    assert.ok(rmsDb(full.mono) - rmsDb(soft.mono) >= 6, `${rmsDb(full.mono) - rmsDb(soft.mono)} dB between a tap and a hit`);
    assert.ok(Math.abs(peakOf(full.mono) - RENDER_PEAK) < 1e-3, 'a full hit sits at the reference peak');
    for (const s of [0.2, 0.5, 0.8, 1]) assert.ok(peakOf(renderStrike(base({ strike: s })).mono) <= RENDER_PEAK + 1e-6);
    assert.ok(strikeGain(0.2) < strikeGain(1));
    // The kick too — click included — stays under the ceiling and is not quieter than a tom.
    const kick = renderStrike(base({ drum: 'kick', batter: evenHead(1500, 8), reso: evenHead(1400, 8), frontHead: 'ported', strike: 0.9 }));
    assert.ok(peakOf(kick.mono) <= RENDER_PEAK + 1e-6);
    assert.ok(rmsDb(kick.mono) > rmsDb(renderStrike(base({ strike: 0.9 })).mono) - 2, 'the kick body is not pushed down by its click');
  });
  it('a lug tap is quieter than a stroke', () => {
    const t = renderTap(evenHead(3000, 6), 0, 'rack');
    const s = renderStrike(base({ strike: 0.8 }));
    assert.ok(rmsDb(t.mono) < rmsDb(s.mono), `tap ${rmsDb(t.mono)} vs strike ${rmsDb(s.mono)} dB`);
    assert.ok(peakOf(t.mono) < peakOf(s.mono));
  });
  it('the three relationships stay loudness-matched (a comparison of timbre, not level)', () => {
    const bat = { tension: tensionForHz(12, 190, 0.35), turns: new Array(6).fill(0) };
    const res = (hz: number) => ({ tension: tensionForHz(12, hz, 0.25), turns: new Array(6).fill(0) });
    const levels = [3, 0, -3].map((st) => rmsDb(renderStrike(base({ batter: bat, reso: res(190 * 2 ** (st / 12)), strike: 0.85 })).mono));
    assert.ok(Math.max(...levels) - Math.min(...levels) < 2.5, `relationships within 2.5 dB (${levels.map((l) => l.toFixed(1))})`);
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
  it('an uneven RESONANT head adds its own beating pair to the strike; an even one does not', () => {
    const unevenReso = randomUnevenHead(2900, 8, 0x5555, 0.6);
    const withPair = strikePartials(base({ drum: 'floor', batter: evenHead(2400, 8), reso: unevenReso }));
    const pair = withPair.filter((q) => q.head === 'reso');
    assert.equal(pair.length, 2, 'the resonant (1,1) became a pair');
    assert.ok(Math.abs(pair[0].pairHz) > 0.3);
    assert.ok(pair[0].amp < withPair.find((q) => q.head === 'batter' && q.n === 1)!.amp, 'weaker than the batter\'s own (1,1)');
    const even = strikePartials(base({ drum: 'floor', batter: evenHead(2400, 8), reso: evenHead(2900, 8) }));
    assert.equal(even.filter((q) => q.head === 'reso').length, 0);
    const a = renderStrike(base({ drum: 'floor', batter: evenHead(2400, 8), reso: unevenReso }));
    const b = renderStrike(base({ drum: 'floor', batter: evenHead(2400, 8), reso: evenHead(2900, 8) }));
    let diff = 0;
    for (let i = 0; i < a.mono.length; i += 97) diff += Math.abs(a.mono[i] - b.mono[i]);
    assert.ok(diff > 1, 'the strike sounds different when the resonant head is uneven');
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
    assert.ok(hf(on.mono) > hf(off.mono) * 1.2, 'wires on = more high-frequency content');
  });
  it('wire sensitivity depends on the STROKE: a ghost note against a tight strainer never wakes the wires, a hard hit does', () => {
    const sn = (strike: number, strainer: number) => renderStrike(base({ drum: 'snare', strainer, strike, batter: evenHead(4000, 10), reso: evenHead(5000, 10) }));
    const ghostOn = hf(sn(0.2, 0.8).mono) / hf(sn(0.2, 0).mono);
    const hardOn = hf(sn(1, 0.8).mono) / hf(sn(1, 0).mono);
    assert.ok(ghostOn < 1.1, `ghost note, tight strainer: wires silent (${ghostOn.toFixed(2)})`);
    assert.ok(hardOn > 1.4, `hard hit, tight strainer: wires open (${hardOn.toFixed(2)})`);
    const ghostLoose = hf(sn(0.2, 0.3).mono) / hf(sn(0.2, 0).mono);
    assert.ok(ghostLoose >= ghostOn, 'a looser strainer is at least as sensitive to a ghost note');
  });
  it('a tight strainer CHOKES the whole drum: T60 at 1.0 ≤ 0.7 × T60 at 0.4', () => {
    const t = (strainer: number) => sustainT60(renderStrike(base({ drum: 'snare', strainer, strike: 0.8, batter: evenHead(4000, 10), reso: evenHead(5000, 10) })).mono);
    assert.ok(t(1) <= 0.7 * t(0.4), `${t(1)} vs ${t(0.4)}`);
  });
  it('the kick: removed < ported < open for sustain — no front head is the SHORTEST note', () => {
    const k = (frontHead: 'open' | 'ported' | 'removed') => sustainT60(renderStrike(base({ drum: 'kick', batter: evenHead(1500, 8), reso: evenHead(1500, 8), frontHead, resoPresent: frontHead !== 'removed', strike: 0.9 })).mono);
    const open = k('open');
    const ported = k('ported');
    const removed = k('removed');
    assert.ok(ported < open, `${ported} < ${open}`);
    assert.ok(removed < ported, `removed ${removed} < ported ${ported}`);
    const f = fundamentalHz(22, 1500, 0.5);
    assert.ok(f > 35 && f < 110, `a kick fundamental (${f})`);
  });
});

describe('renders', () => {
  it('a strike and a tap are finite, the right length, under the reference peak', () => {
    const r = renderStrike(base({ strike: 1 }));
    assert.equal(r.mono.length, Math.round(DRUMS.rack.seconds * 48000));
    let peak = 0;
    for (const v of r.mono) {
      assert.ok(Number.isFinite(v));
      peak = Math.max(peak, Math.abs(v));
    }
    assert.ok(Math.abs(peak - RENDER_PEAK) < 1e-3);
    const t = renderTap(evenHead(3000, 8), 3, 'snare');
    assert.ok(t.mono.length > 0 && t.seconds < 1);
    assert.ok(peakOf(t.mono) < RENDER_PEAK);
  });
});

describe('the kit and the goals', () => {
  it('tom intervals: too close, distinct (up to 9 st between neighbours), unbalanced; the floor tom band tops out where a 16" lives', () => {
    assert.equal(tomInterval(140, 125).kind, 'close');
    assert.equal(tomInterval(190, 130).kind, 'distinct');
    assert.equal(tomInterval(200, 120).kind, 'distinct', 'a fifth-plus between a 12 and a 16 is still one kit');
    assert.equal(tomInterval(250, 100).kind, 'unbalanced', 'wider than 9 st');
    assert.equal(tomInterval(120, 140).kind, 'unbalanced', 'upside down');
    assert.equal(tomInterval(140, 160).kind, 'unbalanced', 'the Chapter 6 starting kit is outside DISTINCT');
    assert.match(tomInterval(190, 130).message, /neighbouring toms/);
    assert.deepEqual(DRUMS.floor.usefulHz, [75, 130]);
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
  it('every symptom case offers several areas, several fixes, AT LEAST one that clears it, and names its cause among the areas', () => {
    assert.equal(SYMPTOMS.length, 5);
    for (const s of SYMPTOMS) {
      assert.ok(s.areas.length >= 3, s.id);
      assert.ok(s.fixes.length >= 3, s.id);
      assert.ok(s.clears.length >= 1, s.id);
      for (const c of s.clears) assert.ok(s.fixes.some((f) => f.id === c), `${s.id}: ${c} is an offered fix`);
      assert.ok(s.cause.length >= 1, s.id);
      for (const a of s.cause) assert.ok(s.areas.includes(a), `${s.id}: cause "${a}" is one of the areas`);
      assert.ok(s.strike > 0 && s.strike <= 1);
      // No distractor models damage: nothing asks for a full turn on every rod.
      for (const f of s.fixes) assert.doesNotMatch(f.label, /full turn/i, `${s.id}/${f.id}`);
    }
    const ring = SYMPTOMS.find((s) => s.id === 'ring')!;
    assert.ok(ring.clears.includes('damp') && ring.clears.includes('reso'), 'excessive ring: a gel pad AND the resonant head are both legitimate fixes');
    assert.equal(SYMPTOMS.find((s) => s.id === 'snare')!.strike, 0.4, 'the snare case is struck softly');
    assert.ok(SYMPTOMS.find((s) => s.id === 'warble')!.tapsNeeded >= 3, 'the warble case wants lug taps before a hypothesis');
  });
});
