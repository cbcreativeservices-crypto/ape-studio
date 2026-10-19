/**
 * DJ Systems Lab — fix round 2 (audio + learning reviews 2026-10-18): the
 * measured tests behind the practice goals, pinned against the real render.
 *
 *   - Screen 6 matches gain by AVERAGE level; the peak is only a ceiling.
 *   - Patching a live cable is flagged as a HOT-PATCH (never played).
 *   - A chunked render continues its filters and meters across a join: no
 *     click, no meter dip.
 *   - Screen 8's +6 dB is a measured comparison that counts only on CUT (or
 *     both channels on THRU).
 *   - The what's-left screen lists each screen's unmet goals by name.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SR } from '../src/screens/lab/dj/engine/djDsp.ts';
import { TRACKS, barSec } from '../src/screens/lab/dj/engine/djMusic.ts';
import { carryAt, clearDeckCache, renderBooth } from '../src/screens/lab/dj/engine/djRender.ts';
import { alignPhase, setPlaying } from '../src/screens/lab/dj/model/djDeck.ts';
import { anchorAt, builtBooth, hotPatchSpeakers, trimPos, type Booth } from '../src/screens/lab/dj/model/djModel.ts';
import { AVG_BAND, PEAK_CEILING_DB, averagesMatched, busOverCh1, chanLevels, peaksMatched, twoCopiesResult } from '../src/screens/lab/dj/model/djLessons.ts';
import { pitchFor, phaseOffset, beatAt } from '../src/screens/lab/dj/model/djTime.ts';
import { trueGrid } from '../src/screens/lab/dj/engine/djMusic.ts';
import { clearGoalReports, leftLine, reportGoals, unmetGoals } from '../src/screens/lab/dj/booth/goalStore.ts';

const near = (a: number, b: number, eps: number, msg?: string) => assert.ok(Math.abs(a - b) <= eps, msg ?? `${a} ≉ ${b} (±${eps})`);
const bar17 = (id: 'nightFerry' | 'glassHarbour') => TRACKS[id].leadInSec + 16 * barSec(id);

/** Night Ferry on A and Glass Harbour on B, both at bar 17, B pre-matched to
 *  A's tempo and phase (the Screen 6 / 8 / 9 set-up). */
function pair(): Booth {
  let b = builtBooth();
  b = {
    ...b,
    decks: { A: { ...b.decks.A, track: 'nightFerry', posSec: bar17('nightFerry') }, B: { ...b.decks.B, track: 'glassHarbour', posSec: bar17('glassHarbour'), pitch: pitchFor(126, 122) } },
    ch: { 1: { ...b.ch[1], fader: 0.85 }, 2: { ...b.ch[2], fader: 0, cue: true } },
  };
  b = setPlaying(b, 0, 'A', true);
  b = setPlaying(b, 0, 'B', true);
  return alignPhase(b, 0, 'B');
}

describe('Screen 6 — match by AVERAGE level, the peak is a ceiling (audio #1)', () => {
  clearDeckCache();
  const trims = (b: Booth, d1: number, d2: number): Booth => ({ ...b, ch: { 1: { ...b.ch[1], trim: trimPos(d1) }, 2: { ...b.ch[2], trim: trimPos(d2) } } });
  const base = renderBooth(pair(), 0, 8);
  const a0 = chanLevels(base, 1);
  const b0 = chanLevels(base, 2);
  it('the loud master is far louder on average than the quiet one at the same trim', () => {
    assert.ok(a0.avg != null && b0.avg != null);
    assert.ok(b0.avg! - a0.avg! > 8, `averages ${a0.avg} / ${b0.avg}`);
  });
  it('trims set so the PEAKS match still leave deck B several dB louder on average — not matched', () => {
    const r = renderBooth(trims(pair(), 0, a0.peak! - b0.peak!), 0, 8);
    const a = chanLevels(r, 1);
    const b = chanLevels(r, 2);
    assert.ok(peaksMatched(a, b), `peaks ${a.peak} / ${b.peak}`);
    assert.ok(b.avg! - a.avg! > 4, `averages still ${b.avg! - a.avg!} dB apart`);
    assert.equal(averagesMatched(a, b), false);
  });
  it('trims set by the AVERAGES match, inside the band, with every peak under the ceiling', () => {
    const target = -18;
    const r = renderBooth(trims(pair(), target - a0.avg!, target - b0.avg!), 0, 8);
    const a = chanLevels(r, 1);
    const b = chanLevels(r, 2);
    assert.ok(averagesMatched(a, b), `averages ${a.avg} / ${b.avg}, peaks ${a.peak} / ${b.peak}`);
    assert.ok(a.avg! >= AVG_BAND.lo && b.avg! <= AVG_BAND.hi);
    assert.ok(a.peak! < PEAK_CEILING_DB && b.peak! < PEAK_CEILING_DB);
    // and the peaks are NOT equal: the quiet master keeps its bigger crest
    assert.ok(a.peak! - b.peak! > 3, `peaks ${a.peak} / ${b.peak}`);
  });
  it('a peak over the ceiling fails even with matched averages', () => {
    const r = renderBooth(trims(pair(), -15 - a0.avg! + 1.6, -15 - b0.avg! + 1.6), 0, 8);
    assert.equal(averagesMatched(chanLevels(r, 1), chanLevels(r, 2)), false);
  });
  it('the pair is pre-matched: same played tempo and the beats in phase (audio #2)', () => {
    const b = pair();
    const playedA = 122 * (1 + b.decks.A.pitch / 100);
    const playedB = 126 * (1 + b.decks.B.pitch / 100);
    near(playedA, playedB, 1e-9);
    const off = phaseOffset(beatAt(trueGrid('glassHarbour'), b.decks.B.posSec), beatAt(trueGrid('nightFerry'), b.decks.A.posSec));
    near(off, 0, 1e-6);
  });
});

describe('HOT-PATCH: moving a live audio cable is flagged (audio #3)', () => {
  const live = (): Booth => {
    const b = builtBooth();
    return { ...b, ch: { ...b.ch, 1: { ...b.ch[1], fader: 0.8 } } };
  };
  it('a MASTER cable moved out of a live PA into a live booth monitor hits both', () => {
    assert.deepEqual(hotPatchSpeakers(live(), 'mst.xlrL', 'boothL.in').sort(), ['boothL', 'paL']);
  });
  it('…but not with the MASTER down, the speakers off, or the mixer off', () => {
    const b = live();
    assert.deepEqual(hotPatchSpeakers({ ...b, mixer: { ...b.mixer, master: 0 } }, 'mst.xlrL', 'boothL.in'), []);
    const off = { ...b, power: { ...b.power, paL: false, paR: false, boothL: false, boothR: false } };
    assert.deepEqual(hotPatchSpeakers(off, 'mst.xlrL', 'boothL.in'), []);
    assert.deepEqual(hotPatchSpeakers({ ...b, power: { ...b.power, mixer: false } }, 'mst.xlrL', 'boothL.in'), []);
  });
  it('a source plug pulled from a channel that is up reaches every live speaker', () => {
    assert.deepEqual(hotPatchSpeakers(live(), 'A.rcaR', null).sort(), ['boothL', 'boothR', 'paL', 'paR']);
  });
  it('…but not with that channel fader down, or on a jack the channel is not listening to', () => {
    const b = live();
    assert.deepEqual(hotPatchSpeakers({ ...b, ch: { ...b.ch, 1: { ...b.ch[1], fader: 0 } } }, 'A.rcaR', null), []);
    assert.deepEqual(hotPatchSpeakers(b, 'tt.rcaL', 'ch1.phono.L'), [], 'the selector is on LINE');
    assert.deepEqual(hotPatchSpeakers(b, 'A.rcaR', 'ch1.line.R'), [], 'no change is no patch');
  });
});

describe('chunk joins: filters and meters continue (audio #29)', () => {
  /** A playing deck through an EQ cut and a resonant low-pass: the case that
   *  clicked at every join when each chunk restarted its filters. */
  function coloured(): Booth {
    let b = builtBooth();
    b = { ...b, decks: { ...b.decks, A: { ...b.decks.A, posSec: bar17('nightFerry') } } };
    b = setPlaying(b, 0, 'A', true);
    return { ...b, listen: 0.35, ch: { ...b.ch, 1: { ...b.ch[1], fader: 1, eq: { hi: 0.5, mid: 0.3, lo: 0.2 }, filter: -0.55 } }, mixer: { ...b.mixer, resonance: 1 } };
  }
  clearDeckCache();
  const whole = renderBooth(coloured(), 0, 6);
  clearDeckCache();
  const first = renderBooth(coloured(), 0, 3);
  const at3 = anchorAt(coloured(), 3);
  const joined = renderBooth(at3, 3, 3, carryAt(first, 3));
  const fresh = renderBooth(at3, 3, 3);
  const half = Math.round(3 * SR);
  const diff = (r: typeof joined, n: number) => {
    let d = 0;
    for (let i = 0; i < n; i++) d = Math.max(d, Math.abs(r.playback.l[i] - whole.playback.l[half + i]), Math.abs(r.playback.r[i] - whole.playback.r[half + i]));
    return d;
  };
  it('the second chunk sounds exactly like the same seconds of one long render', () => {
    const d = diff(joined, Math.round(0.2 * SR));
    assert.ok(d < 1e-4, `join error ${d}`);
  });
  it('restarting the filters at the join (the old way) is a clear transient', () => {
    const dj = diff(joined, Math.round(0.05 * SR));
    const df = diff(fresh, Math.round(0.05 * SR));
    assert.ok(df > 1e-3 && df > 20 * dj, `fresh ${df} vs carried ${dj}`);
  });
  it('the meters run on through the join: no dip', () => {
    const b0 = Math.round(3 / 0.01);
    for (const tap of ['ch1', 'bus', 'masterL', 'crowd'] as const) {
      for (let k = 0; k < 200; k++) {
        near(joined.meter[tap][k], whole.meter[tap][b0 + k], 0.01, `${tap} meter block ${k}`);
        near(joined.hold[tap][k], whole.hold[tap][b0 + k], 0.01, `${tap} hold block ${k}`);
      }
    }
    // without the carry the display falls to the floor and climbs back
    assert.ok(fresh.hold.ch1[0] < whole.hold.ch1[b0] - 0.5, 'the old dip');
  });
  it('a re-render inside a chunk takes the meters from that moment', () => {
    const c = carryAt(whole, 2.5)!;
    assert.equal(c.dsp, null, 'the sound restarts there, so the filters start fresh');
    near(c.meters.ch1.m, whole.meter.ch1[250], 1e-9);
    assert.equal(carryAt(whole, 9), null, 'nothing to carry outside the render');
  });
});

describe('Screen 8 — two copies add +6 dB, measured, on CUT only (audio #19, learning p08 #1)', () => {
  /** The same track on both decks, aligned, CH1 → A, CH2 → B, crossfader in the middle. */
  function copies(curve: 'CUT' | 'DIP' | 'BLEND', thru = false): Booth {
    let b = builtBooth();
    b = { ...b, decks: { ...b.decks, A: { ...b.decks.A, posSec: bar17('nightFerry') } } };
    b = setPlaying(b, 0, 'A', true);
    b = { ...b, decks: { A: b.decks.A, B: { ...b.decks.A } } };
    const xf = thru ? 'THRU' : null;
    return { ...b, ch: { 1: { ...b.ch[1], fader: 0.85, xf: xf ?? 'A' }, 2: { ...b.ch[2], fader: 0.85, xf: xf ?? 'B' } }, mixer: { ...b.mixer, xfCurve: curve, xf: 0.5 } };
  }
  const measure = (b: Booth) => {
    clearDeckCache();
    const one = renderBooth({ ...b, ch: { ...b.ch, 2: { ...b.ch[2], fader: 0 } } }, 0, 2);
    clearDeckCache();
    const two = renderBooth(b, 0, 2);
    return twoCopiesResult(b, busOverCh1(one), two);
  };
  it('CUT in the middle: +6.02 dB over one copy, and it counts', () => {
    const r = measure(copies('CUT'));
    near(r.delta!, 6.0206, 0.02);
    assert.equal(r.met, true);
  });
  it('both channels on THRU count too', () => {
    assert.equal(measure(copies('BLEND', true)).met, true);
  });
  it('DIP or BLEND in the middle do NOT count — each side is turned down there', () => {
    for (const c of ['DIP', 'BLEND'] as const) {
      const r = measure(copies(c));
      near(r.delta!, 6.0206, 0.02, `${c}: the copies still add`);
      assert.equal(r.met, false, `${c} must not tick`);
    }
  });
  it('no reading before the one-copy step', () => {
    clearDeckCache();
    const b = copies('CUT');
    assert.equal(twoCopiesResult(b, null, renderBooth(b, 0, 1)).met, false);
  });
});

describe('the what’s-left screen names each screen’s unmet goals (learning X5)', () => {
  const labels = ['Start deck A', 'Stop everything', 'Pass the check'];
  it('an unopened screen lists every goal; an opened one only what is still unmet', () => {
    clearGoalReports();
    assert.equal(leftLine('WELCOME', labels), 'Left: Start deck A · Stop everything · Pass the check');
    reportGoals('WELCOME', labels, [true, false, true]);
    assert.equal(leftLine('WELCOME', labels), 'Left: Stop everything');
    assert.deepEqual(unmetGoals(labels, [false, true, false]), ['Start deck A', 'Pass the check']);
    clearGoalReports();
  });
  it('the lab wires it: every screen reports under its own name and the shell reads it', () => {
    const ROOT = join(import.meta.dirname, '..');
    const dir = join(ROOT, 'src/screens/lab/dj/pages');
    const shorts: string[] = [];
    for (const f of readdirSync(dir).filter((n) => /^p\d\d/.test(n))) {
      const s = readFileSync(join(dir, f), 'utf8');
      const short = s.match(/: PageDef = \{[^}]*short: '([A-Z]+)'/)?.[1];
      assert.ok(short, `${f} has a short name`);
      assert.match(s, new RegExp(`useVisitGoals\\(ctx, goals, '${short}'\\)`), `${f} reports its goals as ${short}`);
      assert.match(s, /export const GOALS_[A-Z]+ = \[/, `${f} declares its goal labels`);
      shorts.push(short!);
    }
    // Stage 1 (12) + Stage 2b (19–24); 13–18 arrive from branch dj-lab — counted generically
    assert.ok(shorts.length >= 18, `${shorts.length} screens`);
    assert.equal(new Set(shorts).size, shorts.length, 'every screen has its own short name');
    // every goal chip shows exactly once: the practice chips end where the
    // check-yourself chips begin
    for (const f of readdirSync(dir).filter((n) => /^p\d\d/.test(n))) {
      const s = readFileSync(join(dir, f), 'utf8');
      const cuts = [...s.matchAll(/<GoalChips goals=\{goals\.slice\((\d+)(?:, (\d+))?\)\}/g)];
      assert.equal(cuts.length, 2, `${f} has two goal rows`);
      assert.equal(cuts[0][1], '0', `${f} first row starts at 0`);
      assert.equal(cuts[0][2], cuts[1][1], `${f}: the second row starts where the first ends`);
      assert.equal(cuts[1][2], undefined, `${f}: the second row runs to the end`);
    }
    const shell = readFileSync(join(ROOT, 'src/screens/lab/dj/DJSystemsLabScreen.tsx'), 'utf8');
    assert.match(shell, /pageDetail=\{/);
    assert.match(shell, /leftLine\(/);
  });
});
