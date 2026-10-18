/**
 * DJ Systems Lab — the original practice music (src/screens/lab/dj/engine/
 * djMusic.ts): deterministic, real phrase structure, the stated tempos and
 * levels, stems that sum to the mix, and the SHIPPED analysis
 * (djTrackData.ts) equal to a fresh one — the waveform the decks draw is the
 * real audio's min/max, never a drawing.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SECTIONS,
  STEM_IDS,
  TRACKS,
  TRACK_BARS,
  TRACK_IDS,
  analyseTrack,
  barEvents,
  barSec,
  overviewOf,
  quantiseOverview,
  rawPeakOf,
  releaseTracks,
  sampleBuf,
  SAMPLE_IDS,
  trackWindow,
} from '../src/screens/lab/dj/engine/djMusic.ts';
import { TRACK_DATA } from '../src/screens/lab/dj/engine/djTrackData.ts';
import { SR, peakOf, rmsOf } from '../src/screens/lab/dj/engine/djDsp.ts';

const db = (x: number) => 20 * Math.log10(x);

describe('the tracks', () => {
  it('three original tracks at the stated tempos, 64 bars in 8-bar phrases', () => {
    assert.deepEqual(TRACK_IDS.map((t) => TRACKS[t].bpm), [122, 126, 100]);
    assert.equal(TRACK_BARS, 64);
    for (const s of SECTIONS) assert.equal(s.startBar % 8, 0, `${s.name} starts on a phrase`);
    assert.equal(SECTIONS.reduce((n, s) => n + s.bars, 0), 64);
  });
  it('the arrangement is real: no kick in the breakdown, bass enters at bar 9, the hook only in the drop', () => {
    for (const id of TRACK_IDS) {
      const has = (bar: number, stem: string, clip?: string) => barEvents(id, bar).some((e) => e.stem === stem && (!clip || e.clip === clip));
      assert.equal(has(34, 'drums', 'kick'), false, `${id} breakdown has no kick`);
      assert.equal(has(2, 'bass'), false, `${id} intro bar 3 has no bass`);
      assert.equal(has(8, 'bass'), true, `${id} bass enters at bar 9`);
      assert.equal(has(20, 'lead'), false, `${id} main has no hook`);
      assert.equal(has(44, 'lead'), true, `${id} drop has the hook`);
    }
  });
  it('is deterministic', () => {
    const a = trackWindow('nightFerry', 40, 4800).mix.l.slice();
    releaseTracks();
    const b = trackWindow('nightFerry', 40, 4800).mix.l;
    for (let i = 0; i < a.length; i += 97) assert.equal(a[i], b[i]);
  });
  it('the stems sum to the mix (quiet track: a linear master)', () => {
    const w = trackWindow('nightFerry', TRACKS.nightFerry.leadInSec + 44 * barSec('nightFerry'), 9600, true);
    let err = 0;
    for (let i = 0; i < 9600; i += 7) {
      const s = STEM_IDS.reduce((acc, id) => acc + w.stems![id].l[i], 0);
      err = Math.max(err, Math.abs(s - w.mix.l[i]));
    }
    assert.ok(err < 1e-5, `stem sum error ${err}`);
  });
  it('the kick lands on the TRUE grid: beat 1 of bar 17 is a transient', () => {
    const id = 'glassHarbour';
    const t = TRACKS[id].leadInSec + 16 * barSec(id);
    const before = trackWindow(id, t - 0.03, Math.round(0.025 * SR)).mix.l;
    const after = trackWindow(id, t + 0.002, Math.round(0.025 * SR)).mix.l;
    assert.ok(rmsOf(after) > rmsOf(before) * 1.5, `${rmsOf(after)} vs ${rmsOf(before)}`);
  });
  it('levels: a quiet master (−6 dBFS peak) and a loud one (−0.3 dBFS, ≥ 8 dB louder on average)', async () => {
    for (const id of TRACK_IDS) {
      const o = await analyseTrack(id);
      let pk = 0;
      for (const v of o.peak) pk = Math.max(pk, v);
      assert.ok(Math.abs(db(pk) - TRACKS[id].peakDb) < 0.05, `${id} peak ${db(pk)}`);
    }
    const at = (id: 'nightFerry' | 'glassHarbour') => rmsOf(trackWindow(id, TRACKS[id].leadInSec + 20 * barSec(id), Math.round(4 * SR)).mix.l);
    assert.ok(db(at('glassHarbour')) - db(at('nightFerry')) >= 8);
  });
  it('the sampler pads peak at −9 dBFS', () => {
    for (const s of SAMPLE_IDS) {
      const b = sampleBuf(s);
      assert.ok(Math.abs(db(Math.max(peakOf(b.l), peakOf(b.r))) + 9) < 0.01, s);
    }
  });
});

describe('the shipped analysis (djTrackData.ts) is a fresh analysis', () => {
  it('raw peak and quantised overview match exactly — regenerate with `node scripts/djTrackData.mjs`', async () => {
    releaseTracks();
    for (const id of TRACK_IDS) {
      const stored = TRACK_DATA[id];
      assert.ok(stored, `${id} has shipped data`);
      const fresh = quantiseOverview(await analyseTrack(id));
      assert.ok(Math.abs(rawPeakOf(id)! - stored.rawPeak) <= stored.rawPeak * 1e-9, `${id} raw peak`);
      assert.equal(fresh.cols, stored.cols);
      assert.equal(fresh.hi, stored.hi, `${id} overview hi is stale`);
      assert.equal(fresh.lo, stored.lo, `${id} overview lo is stale`);
      assert.equal(fresh.peak, stored.peak, `${id} overview peak is stale`);
    }
    releaseTracks();
    assert.ok(overviewOf('slowOrbit'), 'the stored overview decodes');
  });
});
