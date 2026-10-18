/**
 * djRender — the shared booth's SIGNAL PATH, rendered offline in JS (the house
 * audio pattern: real PCM → WAV → expo-audio, Mixing / Drum Tuning
 * precedent). Pure TypeScript; pinned by test/djRender.test.ts.
 *
 * ONE STATE DRIVES EVERYTHING: `renderBooth(booth, t0, seconds)` turns a
 * snapshot of the booth (anchored at booth time t0) into
 *   - the LISTENING feed the phone plays (the chosen perspective — crowd, booth
 *     monitors or headphones — after a conservative listen gain and the
 *     protective limiter),
 *   - every METER TAP the drawing shows, at 10 ms blocks with the stated
 *     ballistics, read BEFORE each stage's clip so an overload shows,
 *   - what clipped where, and each tap's average level.
 * The meters, the cable glow and the sound all come from this one render, so
 * a picture can never claim a route the audio does not take.
 *
 * Order of processing and tap points: see the header of model/djModel.ts and
 * docs/labs/dj/MODEL.md. The PROTECTIVE LIMITER is listener safety only —
 * it runs after every modelled stage and can never un-clip a stage.
 */
import { SR, RIAA_PLAYBACK, RIAA_RECORDING, biquadInPlace, bqState, dbToLin, filterBiquad, filterOf, isoState, isolatorInPlace, linToDb, protectiveLimitInPlace, resampleLinear, type BqState, type IsoState } from './djDsp.ts';
import { sampleBuf, trackSeconds, trackWindow, type StereoBuf, type TrackId } from './djMusic.ts';
import {
  CHANNEL_IDS,
  PHONO_GAIN_DB,
  channelRoute,
  cueBlend,
  deviceLive,
  eqDb,
  faderGain,
  filterQ,
  levelKnobGain,
  listenDb,
  phonesPlugged,
  speakerFeed,
  trimDb,
  xfGainFor,
  type Booth,
  type ChannelId,
  type DeckState,
  type SpeakerId,
} from '../model/djModel.ts';
import { rateOf } from '../model/djTime.ts';

export const METER_BLOCK_S = 0.01;
const BLOCK = Math.round(METER_BLOCK_S * SR);
/** Peak meter ballistics: instant rise, falls 20 dB in 1.5 s; the peak-hold
 *  dot holds 1.5 s, then falls at the same rate. */
export const METER_FALL_DB_PER_S = 20 / 1.5;
export const METER_HOLD_S = 1.5;
export const METER_FLOOR_DB = -60;

export type Tap = 'ch1' | 'ch2' | 'cue' | 'bus' | 'masterL' | 'masterR' | 'booth' | 'phonesL' | 'phonesR' | 'crowd';
export const TAPS: readonly Tap[] = ['ch1', 'ch2', 'cue', 'bus', 'masterL', 'masterR', 'booth', 'phonesL', 'phonesR', 'crowd'];

export type Stage = 'phono1' | 'phono2' | 'ch1' | 'ch2' | 'bus' | 'master' | 'booth' | 'phones';

export type BoothRender = {
  t0: number;
  seconds: number;
  /** What the phone plays (after listen gain + limiter). */
  playback: StereoBuf;
  /** Per tap, per 10 ms block: the displayed level in dBFS (ballistics on). */
  meter: Record<Tap, Float32Array>;
  /** Per tap, per block: the peak-hold level in dBFS. */
  hold: Record<Tap, Float32Array>;
  /** Per tap, per block: the RAW block peak in dBFS, before any clip. */
  raw: Record<Tap, Float32Array>;
  /** Clipped samples per stage over the render. */
  clipped: Record<Stage, number>;
  /** Per block: the mix bus clipped in that block (the BUS OVER light). */
  busOver: Uint8Array;
  /** Average (RMS) level per tap over the render, dBFS. */
  rmsDb: Record<Tap, number>;
  /** The deepest the listener's limiter reduced, dB (≤ 0). */
  limiterDb: number;
};

/* ── deck sources ─────────────────────────────────────────────────────── */

type DeckCache = { key: string; track: TrackId; start: number; rate: number; buf: StereoBuf };
const deckCache = new Map<string, DeckCache>();

/** A deck's line output for `n` samples from its anchored position:
 *  resampled for the tempo fader, wrapped inside an active loop, silent past
 *  the end of the track. Reuses the previous render when only the mixer
 *  changed (same track, tempo and no loop: the new window is a slice). */
export function deckSignal(slot: string, d: DeckState, n: number): StereoBuf {
  const out = { l: new Float32Array(n), r: new Float32Array(n) };
  if (!d.track || !d.playing) return out;
  const rate = rateOf(d.pitch);
  const track = d.track;
  const prev = deckCache.get(slot);
  if (!d.loop && prev && prev.track === track && Math.abs(prev.rate - rate) < 1e-12) {
    const off = Math.round(((d.posSec - prev.start) / rate) * SR);
    const have = prev.buf.l.length;
    if (off >= 0 && off < have) {
      const fromCache = Math.min(n, have - off);
      out.l.set(prev.buf.l.subarray(off, off + fromCache));
      out.r.set(prev.buf.r.subarray(off, off + fromCache));
      if (fromCache < n) {
        // Extend: the continuation starts exactly where the cached run ends.
        const more = deckRun(track, prev.start + (have / SR) * rate, rate, null, n - fromCache);
        out.l.set(more.l, fromCache);
        out.r.set(more.r, fromCache);
      }
      deckCache.set(slot, { key: slot, track, start: d.posSec, rate, buf: { l: out.l.slice(), r: out.r.slice() } });
      return out;
    }
  }
  const run = deckRun(track, d.posSec, rate, d.loop, n);
  out.l.set(run.l);
  out.r.set(run.r);
  if (!d.loop) deckCache.set(slot, { key: slot, track, start: d.posSec, rate, buf: { l: out.l.slice(), r: out.r.slice() } });
  else deckCache.delete(slot);
  return out;
}

/** `n` output samples of `track` from track time `t`, at `rate`, through an
 *  optional loop. */
function deckRun(track: TrackId, t0: number, rate: number, loop: DeckState['loop'], n: number): StereoBuf {
  const out = { l: new Float32Array(n), r: new Float32Array(n) };
  const endSec = trackSeconds(track) - 1;
  let t = t0;
  let o = 0;
  let first = true;
  const FADE = 96;
  while (o < n) {
    const inLoop = !!loop && t >= loop.startSec - 1e-9 && t < loop.startSec + loop.lengthSec;
    const segEnd = inLoop ? loop!.startSec + loop!.lengthSec : endSec;
    if (t >= endSec && !inLoop) break;
    const segOut = Math.min(n - o, Math.max(1, Math.round(((segEnd - t) / rate) * SR)));
    const need = Math.ceil(segOut * rate) + 2;
    const w = trackWindow(track, t, need).mix;
    const l = rate === 1 ? w.l.subarray(0, segOut) : resampleLinear(w.l, rate, segOut);
    const r = rate === 1 ? w.r.subarray(0, segOut) : resampleLinear(w.r, rate, segOut);
    out.l.set(l, o);
    out.r.set(r, o);
    // A loop wrap is a splice: a 2 ms fade either side keeps it click-free.
    if (!first) for (let i = 0; i < FADE && i < segOut; i++) {
      out.l[o + i] *= i / FADE;
      out.r[o + i] *= i / FADE;
    }
    if (inLoop && o + segOut < n) for (let i = 0; i < FADE && i < segOut; i++) {
      out.l[o + segOut - 1 - i] *= i / FADE;
      out.r[o + segOut - 1 - i] *= i / FADE;
    }
    o += segOut;
    t += (segOut / SR) * rate;
    if (inLoop && t >= segEnd - 1e-9) t = loop!.startSec;
    first = false;
  }
  return out;
}

export function clearDeckCache(): void {
  deckCache.clear();
}

/** The turntable's output: a RAW cartridge signal (RIAA recording curve,
 *  −36 dB) with its preamp switched to PHONO, a line signal with it on LINE. */
function turntableSignal(b: Booth, n: number): StereoBuf {
  const s = deckSignal('TT', { ...b.tt, playing: b.tt.playing && deviceLive(b, 'turntable') }, n);
  if (b.ttPreamp === 'PHONO') {
    const g = dbToLin(-PHONO_GAIN_DB);
    biquadInPlace(s.l, RIAA_RECORDING, bqState());
    biquadInPlace(s.r, RIAA_RECORDING, bqState());
    for (let i = 0; i < n; i++) {
      s.l[i] *= g;
      s.r[i] *= g;
    }
  }
  return s;
}

/* ── the mixer ────────────────────────────────────────────────────────── */

type ChanDsp = { iso: [IsoState, IsoState]; filt: [BqState, BqState]; riaa: [BqState, BqState] };
const chanDsp = (): ChanDsp => ({ iso: [isoState(), isoState()], filt: [bqState(), bqState()], riaa: [bqState(), bqState()] });

function blockPeaks(x: Float32Array, y: Float32Array | null, n: number): Float32Array {
  const blocks = Math.ceil(n / BLOCK);
  const out = new Float32Array(blocks);
  for (let k = 0; k < blocks; k++) {
    let p = 0;
    const e = Math.min(n, (k + 1) * BLOCK);
    for (let i = k * BLOCK; i < e; i++) {
      const a = x[i] < 0 ? -x[i] : x[i];
      if (a > p) p = a;
      if (y) {
        const c = y[i] < 0 ? -y[i] : y[i];
        if (c > p) p = c;
      }
    }
    out[k] = p;
  }
  return out;
}

function clipStereo(l: Float32Array, r: Float32Array): number {
  let c = 0;
  for (let i = 0; i < l.length; i++) {
    if (l[i] > 1) { l[i] = 1; c++; } else if (l[i] < -1) { l[i] = -1; c++; }
    if (r[i] > 1) { r[i] = 1; c++; } else if (r[i] < -1) { r[i] = -1; c++; }
  }
  return c;
}

const rmsDbOf = (l: Float32Array, r: Float32Array | null): number => {
  let s = 0;
  for (let i = 0; i < l.length; i++) s += l[i] * l[i] + (r ? r[i] * r[i] : 0);
  return linToDb(Math.sqrt(s / Math.max(1, l.length * (r ? 2 : 1))));
};

/** Displayed meter + hold from raw block peaks (dBFS). */
export function ballistics(rawLin: Float32Array, startDb = METER_FLOOR_DB, startHold = METER_FLOOR_DB): { meter: Float32Array; hold: Float32Array; raw: Float32Array } {
  const n = rawLin.length;
  const meter = new Float32Array(n);
  const hold = new Float32Array(n);
  const raw = new Float32Array(n);
  const fall = METER_FALL_DB_PER_S * METER_BLOCK_S;
  const holdBlocks = Math.round(METER_HOLD_S / METER_BLOCK_S);
  let m = startDb;
  let h = startHold;
  let hAge = 0;
  for (let k = 0; k < n; k++) {
    const db = Math.max(METER_FLOOR_DB, linToDb(rawLin[k]));
    raw[k] = db;
    m = db >= m ? db : Math.max(db, m - fall);
    if (db >= h) {
      h = db;
      hAge = 0;
    } else if (++hAge > holdBlocks) h = Math.max(m, h - fall);
    meter[k] = m;
    hold[k] = h;
  }
  return { meter, hold, raw };
}

/**
 * Render the booth for `seconds` from booth time `t0` (the booth must be
 * anchored at t0 — deck positions are read as they are).
 */
export function renderBooth(b: Booth, t0: number, seconds: number): BoothRender {
  const n = Math.max(1, Math.round(seconds * SR));
  // Sources: the two players (+ any sampler pads on their software) and the turntable.
  const src: Record<'A' | 'B' | 'TT', StereoBuf> = {
    A: deckSignal('A', { ...b.decks.A, playing: b.decks.A.playing && deviceLive(b, 'playerA') }, n),
    B: deckSignal('B', { ...b.decks.B, playing: b.decks.B.playing && deviceLive(b, 'playerB') }, n),
    TT: turntableSignal(b, n),
  };
  const host = b.sampler.on;
  if (deviceLive(b, host === 'A' ? 'playerA' : 'playerB')) {
    for (const hit of b.sampler.hits) {
      const buf = sampleBuf(hit.id);
      const at = Math.round((hit.at - t0) * SR);
      for (let i = Math.max(0, -at); i < buf.l.length && at + i < n; i++) {
        src[host].l[at + i] += buf.l[i];
        src[host].r[at + i] += buf.r[i];
      }
    }
  }

  const clipped: Record<Stage, number> = { phono1: 0, phono2: 0, ch1: 0, ch2: 0, bus: 0, master: 0, booth: 0, phones: 0 };
  const busL = new Float32Array(n);
  const busR = new Float32Array(n);
  const cueL = new Float32Array(n);
  const cueR = new Float32Array(n);
  const peaks: Partial<Record<Tap, Float32Array>> = {};
  const rms: Partial<Record<Tap, number>> = {};
  const res = filterQ(b.mixer.resonance);

  for (const ch of CHANNEL_IDS) {
    const c = b.ch[ch];
    const route = channelRoute(b, ch);
    const l = new Float32Array(n);
    const r = new Float32Array(n);
    if (route.L) l.set(src[route.L.source][route.L.side === 'L' ? 'l' : 'r']);
    if (route.R) r.set(src[route.R.source][route.R.side === 'L' ? 'l' : 'r']);
    const dsp = chanDsp();
    if (route.jackClass === 'phono') {
      // The PHONO stage: +36 dB with the RIAA playback curve, then its own clip.
      const g = dbToLin(PHONO_GAIN_DB);
      for (let i = 0; i < n; i++) {
        l[i] *= g;
        r[i] *= g;
      }
      biquadInPlace(l, RIAA_PLAYBACK, dsp.riaa[0]);
      biquadInPlace(r, RIAA_PLAYBACK, dsp.riaa[1]);
      clipped[ch === 1 ? 'phono1' : 'phono2'] += clipStereo(l, r);
    }
    const tg = dbToLin(trimDb(c.trim));
    const iso = { lo: dbToLin(eqDb(c.eq.lo)), mid: dbToLin(eqDb(c.eq.mid)), hi: dbToLin(eqDb(c.eq.hi)) };
    const fb = filterBiquad(filterOf(c.filter, res));
    for (let i = 0; i < n; i++) {
      l[i] *= tg;
      r[i] *= tg;
    }
    isolatorInPlace(l, iso, dsp.iso[0]);
    isolatorInPlace(r, iso, dsp.iso[1]);
    if (fb) {
      biquadInPlace(l, fb, dsp.filt[0]);
      biquadInPlace(r, fb, dsp.filt[1]);
    }
    // CHANNEL METER tap = the CUE tap: post-EQ/filter, pre-fader, read before the clip.
    const tap: Tap = ch === 1 ? 'ch1' : 'ch2';
    peaks[tap] = blockPeaks(l, r, n);
    clipped[tap] += clipStereo(l, r);
    rms[tap] = rmsDbOf(l, r);
    if (c.cue) {
      for (let i = 0; i < n; i++) {
        cueL[i] += l[i];
        cueR[i] += r[i];
      }
    }
    const g = faderGain(c.fader) * xfGainFor(c.xf, b.mixer.xf, b.mixer.xfCurve);
    if (g > 0) {
      for (let i = 0; i < n; i++) {
        busL[i] += l[i] * g;
        busR[i] += r[i] * g;
      }
    }
  }

  // The MIX BUS: its own full scale, its own clip.
  peaks.bus = blockPeaks(busL, busR, n);
  const busOver = new Uint8Array(peaks.bus.length);
  for (let k = 0; k < busOver.length; k++) busOver[k] = peaks.bus[k] > 1 ? 1 : 0;
  clipped.bus = clipStereo(busL, busR);
  rms.bus = rmsDbOf(busL, busR);
  peaks.cue = blockPeaks(cueL, cueR, n);
  rms.cue = rmsDbOf(cueL, cueR);

  // MASTER, after the bus clip — lowering it now cannot undo the bus clip.
  const mg = deviceLive(b, 'mixer') ? levelKnobGain(b.mixer.master) : 0;
  const mL = new Float32Array(n);
  const mR = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    mL[i] = busL[i] * mg;
    mR[i] = busR[i] * mg;
  }
  peaks.masterL = blockPeaks(mL, null, n);
  peaks.masterR = blockPeaks(mR, null, n);
  clipped.master = clipStereo(mL, mR);
  rms.masterL = rmsDbOf(mL, null);
  rms.masterR = rmsDbOf(mR, null);

  const bg = deviceLive(b, 'mixer') ? levelKnobGain(b.mixer.booth) : 0;
  const bL = new Float32Array(n);
  const bR = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    bL[i] = busL[i] * bg;
    bR[i] = busR[i] * bg;
  }
  peaks.booth = blockPeaks(bL, bR, n);
  clipped.booth = clipStereo(bL, bR);
  rms.booth = rmsDbOf(bL, bR);

  // PHONES: cue/master blend (the master side is the bus, before the MASTER
  // knob), or SPLIT — cue in the left ear, master in the right, each mono.
  const pg = deviceLive(b, 'mixer') ? levelKnobGain(b.mixer.phones) : 0;
  const pL = new Float32Array(n);
  const pR = new Float32Array(n);
  if (b.mixer.splitCue) {
    for (let i = 0; i < n; i++) {
      pL[i] = ((cueL[i] + cueR[i]) / 2) * pg;
      pR[i] = ((busL[i] + busR[i]) / 2) * pg;
    }
  } else {
    const k = cueBlend(b.mixer.cueMix);
    for (let i = 0; i < n; i++) {
      pL[i] = (cueL[i] * k.cue + busL[i] * k.master) * pg;
      pR[i] = (cueR[i] * k.cue + busR[i] * k.master) * pg;
    }
  }
  peaks.phonesL = blockPeaks(pL, null, n);
  peaks.phonesR = blockPeaks(pR, null, n);
  clipped.phones = clipStereo(pL, pR);
  rms.phonesL = rmsDbOf(pL, null);
  rms.phonesR = rmsDbOf(pR, null);

  // The speakers hear whatever output is plugged into them.
  const outs = { MASTER: { L: mL, R: mR }, BOOTH: { L: bL, R: bR } } as const;
  const spk = (s: SpeakerId): Float32Array | null => {
    const f = speakerFeed(b, s);
    return f ? outs[f.out][f.side] : null;
  };
  const crowdL = spk('paL');
  const crowdR = spk('paR');
  const z = new Float32Array(n);
  peaks.crowd = blockPeaks(crowdL ?? z, crowdR ?? z, n);
  rms.crowd = rmsDbOf(crowdL ?? z, crowdR ?? z);

  // THE LISTENING PERSPECTIVE (one phone output: we switch what it carries).
  let fl: Float32Array | null = null;
  let fr: Float32Array | null = null;
  if (b.perspective === 'CROWD') {
    fl = crowdL;
    fr = crowdR;
  } else if (b.perspective === 'BOOTH') {
    fl = spk('boothL');
    fr = spk('boothR');
  } else if (phonesPlugged(b)) {
    fl = pL;
    fr = pR;
  }
  const lg = dbToLin(listenDb(b.listen));
  const playL = new Float32Array(n);
  const playR = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    playL[i] = (fl ? fl[i] : 0) * lg;
    playR[i] = (fr ? fr[i] : 0) * lg;
  }
  const limiterDb = protectiveLimitInPlace(playL, playR);

  const meter = {} as Record<Tap, Float32Array>;
  const hold = {} as Record<Tap, Float32Array>;
  const raw = {} as Record<Tap, Float32Array>;
  for (const tap of TAPS) {
    const bl = ballistics(peaks[tap] ?? new Float32Array(Math.ceil(n / BLOCK)));
    meter[tap] = bl.meter;
    hold[tap] = bl.hold;
    raw[tap] = bl.raw;
  }
  return { t0, seconds: n / SR, playback: { l: playL, r: playR }, meter, hold, raw, clipped, busOver, rmsDb: rms as Record<Tap, number>, limiterDb };
}

/** The channel a tap belongs to, for the drawing. */
export const chTap = (ch: ChannelId): Tap => (ch === 1 ? 'ch1' : 'ch2');
