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
 * CONTINUITY (audio review 2026-10-18 #29). The booth is rendered in chunks
 * (3 s, then 8 s). Each render hands back its END STATE (`carry`): every
 * channel's isolator, filter and phono-stage filter memories, the turntable's
 * cartridge curve, the listener limiter's gain and every meter's level and
 * hold. The next CONTIGUOUS chunk starts from it, so a resonant filter, an EQ
 * cut or a phono stage never clicks or thumps at a join, and the meters never
 * dip. A re-render that starts INSIDE an earlier chunk (a control changed)
 * carries the meters from that moment (`carryAt`) and starts the filters
 * fresh, because the sound itself restarts there.
 *
 * Order of processing and tap points: see the header of model/djModel.ts and
 * docs/labs/dj/MODEL.md. The PROTECTIVE LIMITER is listener safety only —
 * it runs after every modelled stage and can never un-clip a stage.
 */
import { SR, RIAA_PLAYBACK, RIAA_RECORDING, biquadInPlace, bqState, dbToLin, filterBiquad, filterOf, isoState, isolatorInPlace, linToDb, protectiveLimitInPlace, resampleLinear, type BqState, type IsoState, type LimiterState } from './djDsp.ts';
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
// Stage 2 (Screens 13–18): effects, key lock, stems, laptop USB, vinyl setup,
// DVS — one hook at fixed points; null (and the Stage 1 path) when unused.
import { s2CarryAt, stage2Of, type S2Carry, type S2Report } from './djStage2.ts';

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
  /** The state at the end of this render, for the next contiguous chunk. */
  carry: RenderCarry;
  /** Stage 2's readings for this chunk (null when the booth used none). */
  s2?: S2Report | null;
};

/** One meter's ballistic state: displayed level, hold level, blocks held. */
export type MeterState = { m: number; h: number; age: number };
type ChanDsp = { iso: [IsoState, IsoState]; filt: [BqState, BqState]; riaa: [BqState, BqState] };
export type StreamDsp = { ch: Record<ChannelId, ChanDsp>; tt: [BqState, BqState]; lim: LimiterState };
export type RenderCarry = {
  /** Booth time the state belongs to (where the next render must start). */
  t1: number;
  /** The signal path's filter memories — null when only the meters carry. */
  dsp: StreamDsp | null;
  meters: Record<Tap, MeterState>;
  /** Stage 2's state (the effect's tail, the turntable's acoustic loop). */
  s2?: S2Carry | null;
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
function turntableSignal(b: Booth, n: number, st: [BqState, BqState]): StereoBuf {
  const s = deckSignal('TT', { ...b.tt, playing: b.tt.playing && deviceLive(b, 'turntable') }, n);
  if (b.ttPreamp === 'PHONO') {
    const g = dbToLin(-PHONO_GAIN_DB);
    biquadInPlace(s.l, RIAA_RECORDING, st[0]);
    biquadInPlace(s.r, RIAA_RECORDING, st[1]);
    for (let i = 0; i < n; i++) {
      s.l[i] *= g;
      s.r[i] *= g;
    }
  }
  return s;
}

/* ── the mixer ────────────────────────────────────────────────────────── */

const chanDsp = (): ChanDsp => ({ iso: [isoState(), isoState()], filt: [bqState(), bqState()], riaa: [bqState(), bqState()] });
const freshDsp = (): StreamDsp => ({ ch: { 1: chanDsp(), 2: chanDsp() }, tt: [bqState(), bqState()], lim: { g: 1 } });
const cloneBq = (q: BqState): BqState => ({ ...q });
const cloneChan = (c: ChanDsp): ChanDsp => ({
  iso: [{ s: c.iso[0].s.map(cloneBq) }, { s: c.iso[1].s.map(cloneBq) }],
  filt: [cloneBq(c.filt[0]), cloneBq(c.filt[1])],
  riaa: [cloneBq(c.riaa[0]), cloneBq(c.riaa[1])],
});
const cloneDsp = (d: StreamDsp): StreamDsp => ({ ch: { 1: cloneChan(d.ch[1]), 2: cloneChan(d.ch[2]) }, tt: [cloneBq(d.tt[0]), cloneBq(d.tt[1])], lim: { g: d.lim.g } });
const FLOOR_STATE: MeterState = { m: METER_FLOOR_DB, h: METER_FLOOR_DB, age: 0 };
/** A join this close (s) counts as contiguous. */
const JOIN_TOL_S = 0.002;

/** The state to start a render at booth time `t` from an earlier render `r`:
 *  its full end state when `t` is where `r` ends (a contiguous chunk), the
 *  meters at that moment when `t` falls inside `r` (a re-render after a
 *  change), nothing otherwise. Pure. */
export function carryAt(r: BoothRender | null, t: number): RenderCarry | null {
  if (!r) return null;
  if (Math.abs(r.carry.t1 - t) <= JOIN_TOL_S) return r.carry;
  const k = Math.floor((t - r.t0) / METER_BLOCK_S);
  if (k < 0 || k >= r.meter.ch1.length) return null;
  const meters = {} as Record<Tap, MeterState>;
  for (const tap of TAPS) meters[tap] = { m: r.meter[tap][k], h: r.hold[tap][k], age: 0 };
  // an effect keeps ringing from exactly this moment (replayed from the chunk's own input)
  const s2 = r.carry.s2 ? s2CarryAt(r.s2 ?? undefined, r.carry.s2, Math.round((t - r.t0) * SR)) : null;
  return { t1: t, dsp: null, meters, s2 };
}

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
export function ballistics(rawLin: Float32Array, start: MeterState = FLOOR_STATE): { meter: Float32Array; hold: Float32Array; raw: Float32Array; end: MeterState } {
  const n = rawLin.length;
  const meter = new Float32Array(n);
  const hold = new Float32Array(n);
  const raw = new Float32Array(n);
  const fall = METER_FALL_DB_PER_S * METER_BLOCK_S;
  const holdBlocks = Math.round(METER_HOLD_S / METER_BLOCK_S);
  let m = start.m;
  let h = start.h;
  let hAge = start.age;
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
  return { meter, hold, raw, end: { m, h, age: hAge } };
}

/** ADDITIVE (Stage 2b, the event rig — engine/djEventRender.ts):
 *  `inject` gives a channel a source that is not a player's RCA cable (a
 *  laptop on the channel's USB input, a drum machine in its LINE inputs):
 *  when it returns a buffer, that buffer is the channel's input (line level)
 *  and goes through trim, EQ, filter, meter, cue and fader like any other;
 *  `keep` hands back the mix bus (after its clip) and the cue bus, so the
 *  event layer can build its outputs from them. Omitted = exactly as before. */
export type RenderOpts = {
  inject?: Partial<Record<ChannelId, (input: Booth['ch'][ChannelId]['input'], n: number) => StereoBuf | null>>;
  keep?: boolean;
};

/** The buses `keep` hands back. */
export type KeptStages = { busL: Float32Array; busR: Float32Array; cueL: Float32Array; cueR: Float32Array };

/**
 * Render the booth for `seconds` from booth time `t0` (the booth must be
 * anchored at t0 — deck positions are read as they are). `from` is the state
 * to continue (see `carryAt`); without it every filter and meter starts at
 * rest.
 */
export function renderBooth(b: Booth, t0: number, seconds: number, from?: RenderCarry | null, opts?: RenderOpts): BoothRender & { kept?: KeptStages } {
  const n = Math.max(1, Math.round(seconds * SR));
  const joined = !!from && Math.abs(from.t1 - t0) <= JOIN_TOL_S;
  const dspAll: StreamDsp = joined && from!.dsp ? cloneDsp(from!.dsp) : freshDsp();
  const s2 = stage2Of(b, t0, n, from?.s2, joined);
  // Sources: the two players (+ any sampler pads on their software) and the turntable.
  const dA = { ...b.decks.A, playing: b.decks.A.playing && deviceLive(b, 'playerA') };
  const dB = { ...b.decks.B, playing: b.decks.B.playing && deviceLive(b, 'playerB') };
  const src: Record<'A' | 'B' | 'TT', StereoBuf> = {
    A: s2?.deck('A', dA, n) ?? deckSignal('A', dA, n),
    B: s2?.deck('B', dB, n) ?? deckSignal('B', dB, n),
    TT: turntableSignal(b, n, dspAll.tt),
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
  s2?.sources(src);

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
    const s2In = s2 ? s2.channelInput(ch, l, r, src) : false;
    // a source the event rig plugs in (a laptop on USB, a drum machine on LINE)
    const injected = deviceLive(b, 'mixer') ? opts?.inject?.[ch]?.(c.input, n) : null;
    if (injected) {
      l.set(injected.l);
      r.set(injected.r);
    }
    const dsp = dspAll.ch[ch];
    if (route.jackClass === 'phono' && !s2In) {
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
    if (s2) {
      // after the fader: a channel insert effect and the FX send (Stage 2)
      const p = s2.channelPost(ch, l, r, faderGain(c.fader));
      const xg = xfGainFor(c.xf, b.mixer.xf, b.mixer.xfCurve);
      if (xg > 0) {
        for (let i = 0; i < n; i++) {
          busL[i] += p.l[i] * xg;
          busR[i] += p.r[i] * xg;
        }
      }
      continue;
    }
    const g = faderGain(c.fader) * xfGainFor(c.xf, b.mixer.xf, b.mixer.xfCurve);
    if (g > 0) {
      for (let i = 0; i < n; i++) {
        busL[i] += l[i] * g;
        busR[i] += r[i] * g;
      }
    }
  }
  s2?.bus(busL, busR);

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
  const lg = dbToLin(listenDb(b.listen) + (s2 ? s2.safetyDb() : 0));
  const playL = new Float32Array(n);
  const playR = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    playL[i] = (fl ? fl[i] : 0) * lg;
    playR[i] = (fr ? fr[i] : 0) * lg;
  }
  const limiterDb = protectiveLimitInPlace(playL, playR, undefined, dspAll.lim);

  const meter = {} as Record<Tap, Float32Array>;
  const hold = {} as Record<Tap, Float32Array>;
  const raw = {} as Record<Tap, Float32Array>;
  const ends = {} as Record<Tap, MeterState>;
  for (const tap of TAPS) {
    const bl = ballistics(peaks[tap] ?? new Float32Array(Math.ceil(n / BLOCK)), joined ? from!.meters[tap] : undefined);
    meter[tap] = bl.meter;
    hold[tap] = bl.hold;
    raw[tap] = bl.raw;
    ends[tap] = bl.end;
  }
  const s2out = s2 ? s2.end() : null;
  const carry: RenderCarry = { t1: t0 + n / SR, dsp: dspAll, meters: ends, s2: s2out?.carry ?? null };
  const out = { t0, seconds: n / SR, playback: { l: playL, r: playR }, meter, hold, raw, clipped, busOver, rmsDb: rms as Record<Tap, number>, limiterDb, carry, s2: s2out?.report ?? null };
  return opts?.keep ? { ...out, kept: { busL, busR, cueL, cueR } } : out;
}

/** The channel a tap belongs to, for the drawing. */
export const chTap = (ch: ChannelId): Tap => (ch === 1 ? 'ch1' : 'ch2');
