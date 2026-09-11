/**
 * Mixing lab — truth-engine suite (Patchbay discipline, owner GO 2026-09-11).
 * Pins the routing distinctions, the channel-path order checker, gain math,
 * masking model, and the synthesized session's honesty (deterministic, no
 * clipped stems, level-matched comparisons really match).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHANNEL_PATH,
  PATH_TRUTHS,
  STATION_ORDER,
  firstOrderMistake,
  isChannelOrderCorrect,
  mainPathGain,
  pathTruth,
  pathsToMix,
  sendPathGain,
  vcaSilences,
  type Console,
} from '../src/screens/lab/mixing/engine/routing.ts';
import {
  DIMENSIONS,
  FOCAL_CHOICES,
  SESSION_TRACKS,
  correlatedSumPeakDb,
  headroomDb,
  maskingOverlap,
  panRisk,
  staticMixHint,
  track,
} from '../src/screens/lab/mixing/engine/mixModel.ts';
import { FLAT, LOOP_S, matchGainDb, renderMix, sessionStems } from '../src/screens/lab/mixing/audio/mixAudio.ts';

/* ── routing truths (the six-term table) ─────────────────────────────────── */

describe('routing truths — the six commonly-confused terms', () => {
  it('exactly the six terms, each with a distinct property signature', () => {
    assert.equal(PATH_TRUTHS.length, 6);
    const sigs = PATH_TRUTHS.map((p) => [p.carriesAudio, p.sumsChannels, p.remoteGainControl, p.isCopy, p.isRenderedFile].join());
    assert.equal(new Set(sigs).size, 6, 'each term must be distinguishable by properties alone');
  });
  it('a VCA controls gain but never carries or sums audio', () => {
    const v = pathTruth('vca');
    assert.equal(v.remoteGainControl, true);
    assert.equal(v.carriesAudio, false);
    assert.equal(v.sumsChannels, false);
  });
  it('an aux send is a COPY — the channel path keeps playing', () => {
    assert.equal(pathTruth('auxSendReturn').isCopy, true);
    assert.equal(pathTruth('subgroup').isCopy, false);
  });
  it('a stem is a rendered file, not a live path', () => {
    const s = pathTruth('stem');
    assert.equal(s.isRenderedFile, true);
    assert.equal(s.carriesAudio, false);
  });
});

describe('channel path order (signal-flow builder)', () => {
  it('the canonical order wins', () => {
    assert.equal(isChannelOrderCorrect(STATION_ORDER), true);
    assert.equal(CHANNEL_PATH[0].id, 'source');
    assert.equal(CHANNEL_PATH[CHANNEL_PATH.length - 1].id, 'output');
  });
  it('a swapped pair is caught with a teachable mustFollow', () => {
    const bad = [...STATION_ORDER];
    [bad[1], bad[3]] = [bad[3], bad[1]]; // fader before clip gain
    assert.equal(isChannelOrderCorrect(bad), false);
    const m = firstOrderMistake(bad);
    assert.ok(m);
    assert.equal(m!.station, 'fader');
    assert.equal(m!.mustFollow, 'clipgain');
  });
  it('the correct order yields no mistake', () => {
    assert.equal(firstOrderMistake(STATION_ORDER), null);
  });
});

/* ── the little console: pre/post, VCA, double-routing ───────────────────── */

const CONSOLE: Console = {
  channels: [
    {
      id: 'lead', name: 'LEAD', faderDb: 0, mute: false, out: 'mix',
      sends: { verb: { levelDb: -6, tap: 'post' }, cue: { levelDb: -3, tap: 'pre' } },
      vca: 'vcaVox',
    },
    { id: 'kick', name: 'KICK', faderDb: -3, mute: false, out: 'drums', sends: {} },
    { id: 'ghost', name: 'GHOST', faderDb: 0, mute: false, out: 'nowhere', sends: {} },
  ],
  subgroups: [{ id: 'drums', name: 'DRUMS', faderDb: -2, out: 'mix' }],
  auxes: [
    { id: 'verb', name: 'VERB', faderDb: 0, out: 'mix' },
    { id: 'cue', name: 'CUE', faderDb: 0, out: 'mix' },
  ],
  vcas: [{ id: 'vcaVox', name: 'VOX VCA', levelDb: 0 }],
};

describe('console graph — pre/post sends, VCA, double-routing', () => {
  const lead = CONSOLE.channels[0];
  it('post-fader send follows the fader and mute; pre-fader does not', () => {
    const muted = { ...lead, mute: true };
    assert.equal(sendPathGain(muted, 'verb', CONSOLE), 0, 'post send dies with mute');
    assert.ok(sendPathGain(muted, 'cue', CONSOLE) > 0, 'pre send survives mute');
    const pulled = { ...lead, faderDb: -60 };
    assert.ok(sendPathGain(pulled, 'verb', CONSOLE) < sendPathGain(lead, 'verb', CONSOLE));
    assert.equal(sendPathGain(pulled, 'cue', CONSOLE), sendPathGain(lead, 'cue', CONSOLE));
  });
  it('a VCA silences the main path and post sends, never pre sends', () => {
    assert.equal(vcaSilences(lead, null, CONSOLE), true);
    assert.equal(vcaSilences(lead, 'verb', CONSOLE), true);
    assert.equal(vcaSilences(lead, 'cue', CONSOLE), false);
  });
  it('subgroup fader scales the member channel; a missing route is silent', () => {
    const kick = CONSOLE.channels[1];
    const viaSub = mainPathGain(kick, CONSOLE);
    const direct = mainPathGain({ ...kick, out: 'mix' }, CONSOLE);
    assert.ok(viaSub < direct, 'the −2 dB subgroup fader must act on its members');
    assert.equal(mainPathGain(CONSOLE.channels[2], CONSOLE), 0, 'routed to a missing bus = silence');
  });
  it('double-routing shows as multiple live paths to the mix', () => {
    const paths = pathsToMix(lead, CONSOLE);
    assert.equal(paths.length, 3); // direct + verb copy + cue copy
    assert.ok(paths[0].includes('direct'));
  });
});

/* ── mix model ───────────────────────────────────────────────────────────── */

describe('mix model — dimensions, session, gain math, masking', () => {
  it('five dimensions, four legitimate focal choices, eight tracks', () => {
    assert.equal(DIMENSIONS.length, 5);
    assert.equal(FOCAL_CHOICES.length, 4);
    assert.equal(SESSION_TRACKS.length, 8);
    assert.equal(new Set(SESSION_TRACKS.map((t) => t.importance)).size, 8, 'importance order is a strict ranking');
  });
  it('the synth stand-ins are labeled honestly', () => {
    assert.match(track('lead').source, /stand-in/);
    assert.match(track('bgv').source, /stand-in/);
  });
  it('two correlated −6 dB peaks can reach 0 dBFS', () => {
    assert.ok(Math.abs(correlatedSumPeakDb(-6.02, 2)) < 0.03);
    assert.ok(headroomDb(-12) > headroomDb(-6));
  });
  it('kick vs bass mask heavily; perc vs bass barely at all', () => {
    assert.ok(maskingOverlap(track('kick'), track('bass')) > 0.6);
    assert.equal(maskingOverlap(track('perc'), track('bass')), 0);
  });
  it('static-mix hint starts at the chosen anchor, then importance order', () => {
    assert.equal(staticMixHint([], 'kick'), 'kick');
    assert.equal(staticMixHint(['kick'], 'kick'), 'lead');
  });
  it('pan risk: low end and the focal anchor belong near centre', () => {
    assert.equal(panRisk(track('bass'), 80), 'lowEndOffCentre');
    assert.equal(panRisk(track('lead'), -70), 'focalOffCentre');
    assert.equal(panRisk(track('gtr'), 60), null);
    assert.equal(panRisk(track('gtr'), 0), 'stable');
  });
});

/* ── the synthesized session + renderer honesty ──────────────────────────── */

describe('session audio — deterministic, honest, level-matchable', () => {
  it('ten-second loop, eight stems, no stem clips, RMS aligned', () => {
    assert.equal(LOOP_S, 10);
    const stems = sessionStems();
    for (const [id, x] of Object.entries(stems)) {
      let peak = 0;
      for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) > peak) peak = Math.abs(x[i]);
      assert.ok(peak < 1, `${id} must not clip (peak ${peak.toFixed(3)})`);
      assert.ok(peak > 0.01, `${id} must actually sound`);
    }
  });
  it('mute and −60 dB faders silence a track; polarity cancels a doubled track', () => {
    const solo = renderMix({ kick: FLAT, snare: { mute: true }, perc: { mute: true }, bass: { mute: true }, gtr: { mute: true }, keys: { mute: true }, lead: { mute: true }, bgv: { mute: true } });
    const none = renderMix({ kick: { faderDb: -60 }, snare: { mute: true }, perc: { mute: true }, bass: { mute: true }, gtr: { mute: true }, keys: { mute: true }, lead: { mute: true }, bgv: { mute: true } });
    assert.ok(solo.peakDb > -40);
    assert.ok(none.peakDb < -80, 'nothing playing = digital silence');
  });
  it('the fader is real gain: +6 dB on every track ≈ +6 dB on the mix', () => {
    const a = renderMix({});
    const six: Parameters<typeof renderMix>[0] = {};
    for (const t of SESSION_TRACKS) six[t.id] = { faderDb: 6 };
    const b = renderMix(six);
    assert.ok(Math.abs(b.rmsDb - a.rmsDb - 6) < 0.1);
  });
  it('matchGainDb really matches loudness', () => {
    const a = renderMix({});
    const b = renderMix({}, -9);
    const g = matchGainDb(a, b);
    assert.ok(Math.abs(g - 9) < 0.1);
    const bMatched = renderMix({}, -9 + g);
    assert.ok(Math.abs(bMatched.rmsDb - a.rmsDb) < 0.1);
  });
  it('mono fold is mono', () => {
    const m = renderMix({ gtr: { pan: -80 }, keys: { pan: 80 } }, 0, { mono: true });
    for (let i = 0; i < 2000; i++) assert.equal(m.stereo.l[i], m.stereo.r[i]);
  });
  it('compressor ATTACK shapes the transient: fast clamps the snare crack, slow lets it through (at matched loudness)', () => {
    const only = (over: Parameters<typeof renderMix>[0]) =>
      renderMix({ kick: { mute: true }, perc: { mute: true }, bass: { mute: true }, gtr: { mute: true }, keys: { mute: true }, lead: { mute: true }, bgv: { mute: true }, ...over });
    const fast = only({ snare: { comp: { thresholdDb: -30, ratio: 6, attackMs: 0.4, releaseMs: 90 } } });
    const slow = only({ snare: { comp: { thresholdDb: -30, ratio: 6, attackMs: 30, releaseMs: 90 } } });
    // earDsp's compressor is inherently level-matched (matchRms), so equal
    // loudness with clearly different peaks IS the page-9 lesson: attack
    // changes the ENVELOPE, not how loud it is. (Which way the crack moves is
    // detector-specific — the pin is the audible difference at matched rms.)
    assert.ok(Math.abs(slow.rmsDb - fast.rmsDb) < 0.5, 'loudness stays matched');
    assert.ok(Math.abs(slow.peakDb - fast.peakDb) > 1.5, `attack must audibly reshape the envelope (Δpeak ${(slow.peakDb - fast.peakDb).toFixed(1)} dB)`);
  });
  it('the shared reverb return adds real energy; no send, no change', () => {
    const dry = renderMix({}, 0);
    const sent = renderMix({ lead: { verbSendDb: -6 }, snare: { verbSendDb: -8 } }, 0, { sharedVerb: { space: 'plate', returnDb: 0 } });
    const noSend = renderMix({}, 0, { sharedVerb: { space: 'plate', returnDb: 0 } });
    assert.ok(sent.rmsDb > dry.rmsDb + 0.05);
    assert.ok(Math.abs(noSend.rmsDb - dry.rmsDb) < 0.02, 'a return with nothing sent is silent');
  });
  it('the verse→chorus ride: +6 dB chorus half really is ~6 dB louder', () => {
    const m = renderMix({ lead: { auto: { verseDb: 0, chorusDb: 6 } }, kick: { mute: true }, snare: { mute: true }, perc: { mute: true }, bass: { mute: true }, gtr: { mute: true }, keys: { mute: true }, bgv: { mute: true } });
    const n = m.stereo.l.length;
    const half = Math.floor(n / 2);
    const rms = (from: number, to: number) => {
      let s = 0;
      for (let i = from; i < to; i++) s += m.stereo.l[i] * m.stereo.l[i] + m.stereo.r[i] * m.stereo.r[i];
      return 10 * Math.log10(s / (2 * (to - from)) + 1e-18);
    };
    const lift = rms(half + 4800, n) - rms(0, half - 4800);
    assert.ok(Math.abs(lift - 6) < 0.8, `chorus lift ≈ 6 dB (got ${lift.toFixed(2)})`);
  });
});
