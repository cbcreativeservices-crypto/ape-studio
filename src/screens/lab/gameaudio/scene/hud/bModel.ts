/**
 * bModel — what the four strips of hudB (output, wall, music, lines) read out
 * of the scene, as PURE functions of the model's state and clock. No React
 * Native, no Skia: node:test drives every one (test/gameAudioHudB.test.ts).
 *
 * THE TRUTH RULE (gaHudTypes.ts). Nothing here invents a number. A level, a
 * pan, a filter corner and a reverb send are the model's own computed
 * read-outs (model/gaModel: gaVoiceOut, gaInstWall); a time is the model's
 * clock (gaMusicClock, `pending.due`); a length is the length of the file
 * that plays. What this file adds is only SELECTION and GEOMETRY: which
 * voices a strip is about, and where on the strip a value falls.
 *
 * THE TRACKER. Three things a strip must show are EVENTS the state does not
 * keep: a music change that was withdrawn, a line that was cut, a line that
 * was refused. `bTrack` folds each state change into a small memo
 * (memo, prev, next → memo); bClock.ts feeds it every scene change.
 */
import type { GaMusicBoundary } from '../../engine/gaEngineProtocol.ts';
import { GA_EVENTS, GA_LINES, type GaEventId, type GaLanguage } from '../../model/gaDefs.ts';
import { gaInstWall, gaMusicClock, gaMusicWait, gaReduce, gaReverbAvailable, gaStingerWait, gaVoiceOut, listenerOf, type GaAction, type GaInstance, type GaState } from '../../model/gaModel.ts';
import { PLACES, bearing, gainDb, obstruction, zoneAt, type GaPoint } from '../../model/gaWorld.ts';
import { gaListening, type GaListeningId } from '../../pages/data/gaPlatforms.ts';
import { gaAsset, gaSound, gaSoundSeconds } from '../../sounds/gaSoundBank.ts';
import { MUSIC_BARS, MUSIC_BAR_S, MUSIC_BEATS_PER_BAR, MUSIC_BEAT_S, MUSIC_LAYERS, MUSIC_LOOP_S, type GaMusicLayer } from '../../sounds/gaSynth.ts';

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/* ══ OUTPUT (pages 13 and 3): what reaches each ear ═════════════════════════ */

export type BOutputMode = 'stereo' | 'hrtf' | 'mono';
export const bOutputMode = (s: GaState): BOutputMode => (s.mono ? 'mono' : s.pan);

/** The level window of every bar on these strips, in dB (the scene's rings
 *  use the same one, so a bar and a ring of one level share a color). */
export const B_DB_FLOOR = -36;
export const bLevel01 = (db: number): number => clamp01((db - B_DB_FLOOR) / -B_DB_FLOOR);

const SOURCE_NAME: Record<string, string> = { 'generator-1': 'GENERATOR 1', 'generator-2': 'GENERATOR 2', fountain: 'FOUNTAIN', crate: 'CRATE', door: 'DOOR', player: 'YOUR STEPS', guide: 'GUIDE', bird: 'BIRD' };

export type BEarSource = {
  key: string;
  name: string;
  /** Linear level at the output: the voice, distance, the wall, its bus, the lab LEVEL. */
  gain: number;
  db: number;
  /** The stereo pan the model sends the engine (left is negative). */
  pan: number;
  /** Degrees clockwise from straight ahead, −180 … 180. */
  bearingDeg: number;
};

export type BEars = {
  mode: BOutputMode;
  /** The sources the two bars are about, loudest first: the positioned
   *  sounds that go on sounding (loops: the fountain, a generator, the
   *  alarm). When none of those plays, every positioned sound. */
  sources: BEarSource[];
  /** Positioned one-shots sounding while a steady source holds the bars (a
   *  bird call, a footstep): drawn where they are, left out of the bars. */
  passing: BEarSource[];
  /** Linear level in each ear, all of `sources` together. */
  l: number;
  r: number;
  lDb: number;
  rDb: number;
  /** 3D: the two levels are the model's ESTIMATE of the level part only. A
   *  head-related renderer also changes timing and tone at each ear. */
  levelOnly: boolean;
};

/** WHAT REACHES EACH EAR from the POSITIONED sounds, for the chosen output:
 *  the model's own per-voice read-out (gaVoiceOut: the engine's pan law in
 *  STEREO, the fold in MONO, an estimate of the level part in 3D), added as
 *  unrelated sounds add.
 *
 *  Why not the whole mix (gaOutputLR)? A bed or the music has no position:
 *  it is the SAME in both ears, so it adds nothing that turning changes, but
 *  it is as loud as the fountain and fills both bars alike (whole mix, page
 *  13 opened, SCENE on: the two sides differ by at most 3 dB as YOU turn;
 *  the fountain alone, by 18 dB). What is left out is exactly that equal
 *  part (the test holds it). These bars show what DIRECTION does, and the
 *  strip names the source they belong to.
 *
 *  Why the steady sources? A bird call a few meters away is louder than the
 *  fountain for less than a second: in the bars it would be a jump the
 *  learner did not cause. It is still drawn, where it is. */
export function bEars(s: GaState, t: number = s.t): BEars {
  const L = listenerOf(s);
  type Acc = { src: BEarSource; power: number; pl: number; pr: number; loop: boolean };
  const by = new Map<string, Acc>();
  for (const i of s.inst) {
    const def = GA_EVENTS[i.event];
    if (!def.spatial || !i.pos) continue;
    let power = 0;
    let pl = 0;
    let pr = 0;
    let pan = 0;
    for (const v of s.voices) {
      if (v.inst !== i.id) continue;
      const o = gaVoiceOut(s, v, t);
      if (!(o.gain > 0)) continue;
      pl += o.l * o.l;
      pr += o.r * o.r;
      power += o.gain * o.gain;
      pan = o.pan;
    }
    if (!(power > 0)) continue;
    const key = `${i.event === 'alarm' ? 'alarm' : i.owner}:${Math.round(i.pos.x * 10)}:${Math.round(i.pos.y * 10)}`;
    const was = by.get(key);
    const total = power + (was?.power ?? 0);
    by.set(key, {
      power: total,
      pl: pl + (was?.pl ?? 0),
      pr: pr + (was?.pr ?? 0),
      loop: i.loop || !!was?.loop,
      src: { key, name: i.event === 'alarm' ? 'ALARM' : (SOURCE_NAME[i.owner] ?? i.owner.toUpperCase()), gain: Math.sqrt(total), db: gainDb(Math.sqrt(total)), pan, bearingDeg: bearing(L, i.pos) },
    });
  }
  const all = [...by.values()].sort((a, b) => b.power - a.power);
  const steady = all.filter((x) => x.loop);
  const held = steady.length ? steady : all;
  const l = Math.sqrt(held.reduce((n, x) => n + x.pl, 0));
  const r = Math.sqrt(held.reduce((n, x) => n + x.pr, 0));
  return { mode: bOutputMode(s), sources: held.map((x) => x.src), passing: all.filter((x) => !held.includes(x)).map((x) => x.src), l, r, lDb: gainDb(l), rDb: gainDb(r), levelOnly: s.pan === 'hrtf' && !s.mono };
}

/** Scene time at which every level ramp the model is running has ended:
 *  the lab LEVEL, a bus fader or the duck, the beds' crossfade. A strip that
 *  draws levels follows them until then (the model's own ramps, not a
 *  drawing's). -Infinity when nothing ramps. */
export function bRampsUntil(s: GaState): number {
  let end = -Infinity;
  const take = (r: { at: number; ramp: number } | null | undefined) => {
    if (r && r.ramp > 0) end = Math.max(end, r.at + r.ramp);
  };
  take(s.masterRamp);
  for (const r of Object.values(s.busRamp ?? {})) take(r);
  take(s.bedFade);
  return end;
}

/** A level for a readout: "−12.4 dB", or SILENT below the window. */
export function bDbWord(db: number): string {
  if (!(db > B_DB_FLOOR - 24)) return 'SILENT';
  return `${db < -0.05 ? '−' : ''}${Math.abs(db).toFixed(1)} dB`;
}

/** Which quarter a source is in, for the strip's own word. */
export function bSideWord(deg: number): 'AHEAD' | 'BEHIND' | 'LEFT' | 'RIGHT' {
  const a = Math.abs(deg);
  if (a <= 45) return 'AHEAD';
  if (a >= 135) return 'BEHIND';
  return deg > 0 ? 'RIGHT' : 'LEFT';
}

/** What the strip says under the bars, by output: [left half, right half]. */
export function bOutputWords(e: BEars): [string, string] {
  const mode = e.mode === 'mono' ? 'MONO' : e.mode === 'hrtf' ? 'HEADPHONE 3D' : 'STEREO PAN';
  if (!e.sources.length) return [mode, 'NO POSITIONED SOUND IS PLAYING'];
  const who = e.sources.length === 1 ? e.sources[0].name : `${e.sources.length} SOURCES`;
  if (e.mode === 'mono') return [`${who} IN MONO`, 'BOTH EARS GET THE SAME'];
  if (e.mode === 'hrtf') return [`${who} IN 3D: ${bSideWord(e.sources[0].bearingDeg)}`, 'ESTIMATED: LEVEL IS NOT ALL'];
  return [`${who} IN STEREO PAN`, 'AHEAD AND BEHIND LOOK THE SAME'];
}

/** The strip in words (its accessibility label). */
export function bOutputSummary(e: BEars): string {
  const mode = e.mode === 'mono' ? 'mono' : e.mode === 'hrtf' ? 'headphone 3D' : 'stereo pan';
  if (!e.sources.length) return `What reaches each ear. Output: ${mode}. No positioned sound is playing.`;
  const src = e.sources[0];
  const name = e.sources.length === 1 ? `the ${src.name.toLowerCase()}` : `${e.sources.length} positioned sources`;
  const where = e.mode === 'mono' ? 'direction is not carried' : e.mode === 'hrtf' ? `it is ${bSideWord(src.bearingDeg).toLowerCase()}` : `pan ${Math.round(Math.abs(src.pan) * 100)} percent ${src.pan < -0.005 ? 'left' : src.pan > 0.005 ? 'right' : 'center'}`;
  const note = e.mode === 'mono' ? 'Both ears get the same signal.' : e.mode === 'hrtf' ? 'These two levels are an estimate of the level part only: headphone 3D also changes timing and tone at each ear.' : 'A source ahead and one behind give the same two levels.';
  return `What reaches each ear from ${name}, computed. Output: ${mode}; ${where}. Left ear ${bDbWord(e.lDb)}, right ear ${bDbWord(e.rDb)}. ${note}`;
}

/* ── page 3: what a listening setup can carry ───────────────────────────── */

export type BListening = {
  id: GaListeningId;
  /** The picture: where the loudspeakers are, seen from above. */
  picture: 'phone' | 'phones' | 'tv' | 'bar' | 'headset';
  title: string;
  /** Two short lines. Every claim is a sentence of pages/data/gaPlatforms
   *  (GA_LISTENING) in fewer words; no number is added. */
  lines: readonly [string, string];
};

export const B_LISTENING: Readonly<Record<GaListeningId, BListening>> = {
  speaker: { id: 'speaker', picture: 'phone', title: 'PHONE SPEAKER', lines: ['LEFT AND RIGHT ARE HARD TO TELL APART', 'LOW NOTES ARE WEAK'] },
  headphones: { id: 'headphones', picture: 'phones', title: 'HEADPHONES', lines: ['LEFT AND RIGHT ARE FULLY SEPARATE', 'QUIET DETAILS ARE EASY TO HEAR'] },
  tv: { id: 'tv', picture: 'tv', title: 'TV SPEAKERS', lines: ['SMALL SPEAKERS, HEARD ACROSS A ROOM', 'THE ROOM HAS ITS OWN NOISE'] },
  soundbar: { id: 'soundbar', picture: 'bar', title: 'SOUNDBAR', lines: ['ONE LONG SPEAKER UNIT UNDER THE TV', 'WIDENING DIFFERS BY PRODUCT'] },
  headset: { id: 'headset', picture: 'headset', title: 'HEADSET', lines: ['HEADPHONES WITH A MICROPHONE', 'VOICE CHAT AND GAME IN THE SAME EARS'] },
};

/** The setup a page named in `arg`, or null (no arg = page 13's strip; an
 *  unknown word = "nothing chosen yet"). */
export function bListening(arg: string | undefined): BListening | null {
  if (!arg || !(arg in B_LISTENING)) return null;
  const b = B_LISTENING[arg as GaListeningId];
  // the title is the data file's own name for the setup (the dock says the same)
  return { ...b, title: gaListening(b.id)?.label ?? b.title };
}

/* ══ WALL (page 12): the filter, the level change, the reverb ══════════════ */

/** The model's wall filter is a second-order low-pass (12 dB per octave).
 *  Magnitude in dB at `f` for corner `fc`: H(s) = 1 / (s² + s/Q + 1), with
 *  Q = 1/√2 (no peak: −3 dB exactly at the corner). */
export const B_WALL_Q = Math.SQRT1_2;
export function bLowpassDb(f: number, fc: number, q: number = B_WALL_Q): number {
  const x = f / fc;
  return -10 * Math.log10((1 - x * x) ** 2 + (x / q) ** 2);
}

/** The frequency axis of the curve: 50 Hz … 16 kHz, logarithmic. */
export const B_F0 = 50;
export const B_F1 = 16000;
export const B_F_TICKS = [100, 1000, 10000] as const;
export const bFreqX = (f: number): number => Math.log(f / B_F0) / Math.log(B_F1 / B_F0);
export const bFreqAt = (x01: number): number => B_F0 * Math.pow(B_F1 / B_F0, x01);
/** The curve's vertical window, in dB. */
export const B_CURVE_TOP_DB = 3;
export const B_CURVE_BOTTOM_DB = -45;
export const bCurveYRaw = (db: number): number => (B_CURVE_TOP_DB - db) / (B_CURVE_TOP_DB - B_CURVE_BOTTOM_DB);
export const bCurveY = (db: number): number => clamp01(bCurveYRaw(db));

export type BWallSource = 'generator-1' | 'fountain';
const WALL_SOURCE: Record<BWallSource, { name: string; event: GaEventId; owner: string; at: GaPoint; start: GaAction }> = {
  'generator-1': { name: 'GENERATOR 1', event: 'generator', owner: 'generator-1', at: PLACES.generator, start: { type: 'machine', id: 'generator-1', on: true } },
  fountain: { name: 'FOUNTAIN', event: 'fountain', owner: 'fountain', at: PLACES.fountain, start: { type: 'scene', on: true } },
};
export const bWallSource = (arg: string | undefined): BWallSource => (arg === 'fountain' ? 'fountain' : 'generator-1');

export type BTreatment = {
  name: string;
  /** The source is sounding (a voice the model plays). */
  playing: boolean;
  /** It has an instance, but no voice of it is played (out of range, stolen). */
  virtual: boolean;
  /** The closed door is between the listener and the source. */
  obstructed: boolean;
  /** The wall's level change, in dB (0 = none). */
  wallDb: number;
  /** The low-pass corner the model sets, in Hz (20 000 = wide open). */
  lowpassHz: number;
  /** The setting: sounds made in the workshop feed the reverb. */
  reverbOn: boolean;
  /** This device could not load the room reverb at all. */
  reverbMissing: boolean;
  /** The reverb send of this source, linear 0 … 1 (0 = dry). */
  send: number;
  sendDb: number;
  listenerInside: boolean;
};

const instsOf = (s: GaState, id: BWallSource): GaInstance[] => s.inst.filter((i) => i.event === WALL_SOURCE[id].event && i.owner === WALL_SOURCE[id].owner);

/** The treatment the model applies to a source right now. When the source is
 *  not playing it is the treatment it WOULD get: the model is asked what
 *  starting it now would do (a trial run of the reducer, thrown away), so no
 *  number of the model's is kept here a second time. */
export function bTreatment(s: GaState, id: BWallSource = 'generator-1'): BTreatment {
  const src = WALL_SOURCE[id];
  const L = listenerOf(s);
  const mine = (st: GaState) => {
    const insts = instsOf(st, id);
    const voices = st.voices.filter((v) => insts.some((i) => i.id === v.inst));
    return { insts, voices, outs: voices.filter((v) => v.state !== 'virtual').map((v) => gaVoiceOut(st, v, Infinity)) };
  };
  const now = mine(s);
  const playing = now.outs.length > 0;
  let seen = now;
  let at = s;
  if (!playing && !now.voices.length) {
    try {
      at = gaReduce(s, src.start).state;
      seen = mine(at);
    } catch {
      seen = now;
    }
  }
  // the wall: the model's rule for this very instance, or (no instance to
  // ask about) its exported rule for the place
  const ob = seen.insts.length ? gaInstWall(at, seen.insts[0]) : obstruction(L, src.at, s.doorOpen);
  const lowpassHz = seen.outs.length ? Math.min(...seen.outs.map((o) => o.lowpassHz)) : ob.lowpassHz;
  const send = seen.outs.length ? Math.max(0, ...seen.outs.map((o) => o.rev)) : 0;
  return {
    name: src.name,
    playing,
    virtual: !playing && now.voices.length > 0,
    obstructed: ob.obstructed,
    wallDb: ob.gain >= 1 ? 0 : gainDb(ob.gain),
    lowpassHz,
    reverbOn: s.options.reverb,
    reverbMissing: !gaReverbAvailable(s),
    send,
    sendDb: send > 0 ? gainDb(send) : -120,
    listenerInside: zoneAt(L) === 'room',
  };
}

/** The whole treatment as one response, in dB at `f`: the wall's level change
 *  and its low-pass together. Flat at 0 dB when nothing is in the way. */
export const bTreatmentDb = (t: Pick<BTreatment, 'wallDb' | 'lowpassHz'>, f: number): number => t.wallDb + bLowpassDb(f, t.lowpassHz);

export const bHzWord = (hz: number): string => (hz >= 1000 ? `${+(hz / 1000).toFixed(hz % 1000 ? 1 : 0)} kHz` : `${Math.round(hz)} Hz`);

/** What the reverb window says in place of a send, when nothing is sent. */
export function bReverbWord(t: BTreatment): string | null {
  if (t.reverbMissing) return 'REVERB NOT AVAILABLE';
  if (!t.reverbOn) return 'DRY: NOTHING SENT';
  if (t.virtual) return 'NOT PLAYED NOW';
  return t.send > 0 ? null : 'NOT IN THE ROOM';
}

export function bWallSummary(t: BTreatment): string {
  const name = t.name.toLowerCase();
  const state = t.playing ? `the ${name} is playing` : t.virtual ? `the ${name} is tracked but not played, so this is what it would get` : `the ${name} is not playing, so this is what it would get`;
  const wall = t.obstructed ? `Through the closed door: ${Math.abs(Math.round(t.wallDb))} dB lower, and a low-pass filter at ${bHzWord(t.lowpassHz)}, 12 dB per octave.` : 'Nothing is in the way: no level change and no filter.';
  const none = bReverbWord(t);
  const rev = none ? `Room reverb: ${none.toLowerCase()}.` : `Room reverb: sent ${Math.abs(Math.round(t.sendDb))} dB below the direct sound, heard from ${t.listenerInside ? 'inside' : 'outside'}. The tail drawn is the room’s impulse response, ${bIrSeconds().toFixed(1)} seconds long.`;
  return `The wall’s treatment: ${state}. ${wall} ${rev}`;
}

/* ── the reverb tail: the real impulse ──────────────────────────────────── */

export type BEnvelope = { min: Float32Array; max: Float32Array; peak: number; seconds: number };
const irCache = new Map<number, BEnvelope>();

/** The room impulse (`ir_room`) as a DAW draws a file: the lowest and the
 *  highest sample of each column, both channels, over its whole length. */
export function bIrEnvelope(cols: number): BEnvelope {
  const n = Math.max(1, Math.round(cols));
  const hit = irCache.get(n);
  if (hit) return hit;
  const snd = gaSound('ir_room');
  const min = new Float32Array(n);
  const max = new Float32Array(n);
  let peak = 0;
  const len = snd ? snd.ch[0].length : 0;
  if (snd && len) {
    for (let c = 0; c < n; c++) {
      const a = Math.floor((c * len) / n);
      const b = Math.max(a + 1, Math.floor(((c + 1) * len) / n));
      let lo = Infinity;
      let hi = -Infinity;
      for (const ch of snd.ch) {
        for (let i = a; i < b && i < ch.length; i++) {
          const x = ch[i];
          if (x < lo) lo = x;
          if (x > hi) hi = x;
        }
      }
      min[c] = lo === Infinity ? 0 : lo;
      max[c] = hi === -Infinity ? 0 : hi;
      peak = Math.max(peak, Math.abs(min[c]), Math.abs(max[c]));
    }
  }
  const env = { min, max, peak, seconds: snd && len ? len / snd.sr : 0 };
  irCache.set(n, env);
  return env;
}
export const bIrSeconds = (): number => {
  const snd = gaSound('ir_room');
  return snd ? snd.ch[0].length / snd.sr : 0;
};

/* ══ MUSIC (pages 14 and 22): time ═════════════════════════════════════════ */

export const B_BEAT_S = MUSIC_BEAT_S;
export const B_BAR_S = MUSIC_BAR_S;
export const B_PHRASE_S = MUSIC_LOOP_S;
export const B_BARS = MUSIC_BARS;
export const B_BEATS = MUSIC_BARS * MUSIC_BEATS_PER_BAR;

const mod = (a: number, n: number): number => ((a % n) + n) % n;

/** The play line, 0 … < 1 across the strip: the model's music clock
 *  (gaMusicClock) at scene time `tNow`. Music stopped → 0. */
export const bPlay01 = (s: GaState, tNow: number): number => gaMusicClock(s, tNow).phase;
/** The same, held on the beat it is in (reduced motion: one step per beat). */
export const bBeatStep01 = (p01: number): number => Math.floor(p01 * B_BEATS + 1e-9) / B_BEATS;

export const bUnitS = (b: GaMusicBoundary): number => (b === 'beat' ? B_BEAT_S : b === 'bar' ? B_BAR_S : b === 'phrase' ? B_PHRASE_S : 0);

/** Scene time at which a layer change asked for at `tAsk` lands: the
 *  model's own rule (gaMusicWait: the first boundary of that kind at least
 *  GA_MUSIC_MARGIN_S away, as the engine does; the request itself for NOW).
 *  Used only where the model has not stamped the time itself (`pending.due`)
 *  and for the hollow marker of a change not yet asked for. */
export function bLandAt(s: GaState, tAsk: number, b: GaMusicBoundary): number {
  return tAsk + gaMusicWait({ ...s, t: tAsk }, b);
}
/** Where on the strip a scene time is: 0 < x ≤ 1 (the phrase end is the
 *  right edge, never the left one: it is the line the play line is still
 *  travelling to). */
export function bLand01(t0: number, landAt: number): number {
  const p = mod(landAt - t0, B_PHRASE_S) / B_PHRASE_S;
  return p < 1e-6 || p > 1 - 1e-6 ? 1 : p;
}

/** The change that waits: the boundary it lands on, as scene time. The model
 *  keeps it (`pending.due`); for the moment before the engine has answered
 *  it is the next boundary from now. */
export function bChange(s: GaState, tNow: number): { boundary: GaMusicBoundary; landAt: number; rides: boolean } | null {
  const p = s.music.on ? s.music.pending : null;
  if (!p) return null;
  return { boundary: p.boundary, landAt: p.due ?? bLandAt(s, tNow, p.boundary), rides: p.boundary === 'now' };
}

/** Where a change asked for NOW would land (the hollow marker). */
export const bGhostAt = (s: GaState, tNow: number): number => bLandAt(s, tNow, s.options.musicBoundary);

export type BLayerSet = Record<GaMusicLayer, boolean>;
/** The layers that SOUND (the model's `applied`), not the set asked for. */
export const bApplied = (s: GaState): BLayerSet => s.music.applied ?? s.music.layers;

export type BLane = { layer: GaMusicLayer; name: string; sounding: boolean; waiting: 'in' | 'out' | null };

/** One lane per layer: whether it SOUNDS now, and whether it waits to come
 *  in or to go out. */
export function bLanes(s: GaState): BLane[] {
  const applied = bApplied(s);
  return MUSIC_LAYERS.map((layer) => {
    const sounding = s.music.on && applied[layer];
    const asked = s.music.layers[layer];
    const waiting = s.music.on && s.music.pending && asked !== applied[layer] ? (asked ? 'in' : 'out') : null;
    return { layer, name: layer.toUpperCase(), sounding, waiting };
  });
}

export type BStinger = { key: string; landAt: number; sounding: boolean };
/** Stingers on the strip: one that waits for its line (its HIT lands there),
 *  and any that has begun (an instance of the stinger event), on the line it
 *  began at. */
export function bStingers(s: GaState, tNow: number): BStinger[] {
  if (!s.music.on) return [];
  const out: BStinger[] = s.inst.filter((i) => i.event === 'stinger').map((i) => ({ key: i.id, landAt: i.born, sounding: true }));
  const w = s.music.stinger;
  if (w) out.push({ key: w.req, landAt: w.due ?? tNow + gaStingerWait({ ...s, t: tNow }, w.boundary), sounding: false });
  return out;
}

export const B_BOUNDARY_WORD: Record<GaMusicBoundary, string> = { now: 'NOW', beat: 'NEXT BEAT', bar: 'NEXT BAR', phrase: 'NEXT PHRASE' };

/* ══ LINES (page 15): one line at a time, one file per language ════════════ */

export type BLineId = keyof typeof GA_LINES;
export const B_LINE_IDS = Object.keys(GA_LINES) as BLineId[];
const LINE_NAME: Record<BLineId, string> = { vo_greeting: 'GREETING', vo_warning: 'WARNING' };
const LANG_WORD: Record<GaLanguage, string> = { en: 'ENGLISH', es: 'SPANISH' };

export type BLineRow = {
  id: BLineId;
  name: string;
  priority: number;
  /** The take this row shows: the one speaking, else the one the next press
   *  would play (the chosen language). */
  asset: string;
  lang: GaLanguage;
  langWord: string;
  file: string;
  /** The take's real length, in seconds. */
  seconds: number;
  /** Scene time the line began, when it speaks now. */
  born: number | null;
};

export const bTakeSeconds = (asset: string): number => gaSoundSeconds(asset);
const langOf = (id: BLineId, asset: string): GaLanguage => (GA_LINES[id].es.asset === asset ? 'es' : 'en');

export function bLineRows(s: GaState): BLineRow[] {
  return B_LINE_IDS.map((id) => {
    const inst = s.inst.find((i) => i.event === id);
    const voice = inst ? s.voices.find((v) => v.inst === inst.id) : undefined;
    const asset = voice?.asset ?? GA_LINES[id][s.options.language].asset;
    const lang = langOf(id, asset);
    return { id, name: LINE_NAME[id], priority: GA_EVENTS[id].priority, asset, lang, langWord: LANG_WORD[lang], file: gaAsset(asset)?.file ?? asset, seconds: bTakeSeconds(asset), born: inst ? inst.born : null };
  });
}

/** How much of a take has played, 0 … 1. */
export const bFill01 = (born: number, seconds: number, tNow: number): number => (seconds > 0 ? clamp01((tNow - born) / seconds) : 0);

/** The time axis of the lines strip: whole seconds, long enough for the
 *  longest take of any line in any language. */
export function bLinesAxisS(): number {
  let longest = 0;
  for (const id of B_LINE_IDS) for (const lang of ['en', 'es'] as const) longest = Math.max(longest, bTakeSeconds(GA_LINES[id][lang].asset));
  return Math.max(1, Math.ceil(longest + 0.25));
}

/* ══ THE TRACKER: events a strip must show ═════════════════════════════════ */

export type BWithdrawn = { landAt: number; at: number };
export type BCut = { id: BLineId; asset: string; frac: number; seconds: number; at: number };
export type BRefusal = { id: BLineId; at: number; why: 'refused' | 'ignored' };

export type BMemo = {
  /** A music change that was withdrawn by a newer one: where it would have
   *  landed, and when it was withdrawn. */
  withdrawn: BWithdrawn | null;
  cut: BCut | null;
  refusal: BRefusal | null;
};

export const bTrackInit = (_s?: GaState): BMemo => ({ withdrawn: null, cut: null, refusal: null });

/** How long a mark of something that is over stays on a strip, in seconds. */
export const B_WITHDRAWN_SHOW_S = B_BAR_S;
export const B_CUT_SHOW_S = 6;
export const B_REFUSAL_SHOW_S = 2.4;

const fact = (s: GaState, k: string): number => s.facts[k] ?? 0;

/** Fold one state change into the memo. Pure: (memo, prev, next) → memo. */
export function bTrack(m: BMemo, prev: GaState, next: GaState): BMemo {
  // the scene was closed or the clock restarted: nothing carries over
  if (next.t < prev.t) return bTrackInit(next);
  let out = m;
  const set = (patch: Partial<BMemo>) => {
    out = { ...out, ...patch };
  };

  /* music: a waiting change replaced by a newer one */
  if (!next.music.on || !prev.music.on) {
    if (out.withdrawn) set({ withdrawn: null });
  } else if (fact(next, 'musicWithdrawn') > fact(prev, 'musicWithdrawn') && prev.music.pending) {
    const was = prev.music.pending;
    set({ withdrawn: { landAt: was.due ?? bLandAt(prev, next.t, was.boundary), at: next.t } });
  }

  /* lines */
  if (fact(next, 'interrupted') > fact(prev, 'interrupted')) {
    const was = bLineRows(prev).find((r) => r.born != null && !next.inst.some((i) => i.event === r.id && i.born === r.born));
    if (was && was.born != null) set({ cut: { id: was.id, asset: was.asset, seconds: was.seconds, frac: bFill01(was.born, was.seconds, next.t), at: next.t } });
  }
  const refused = fact(next, 'lineRefused') > fact(prev, 'lineRefused');
  const ignored = fact(next, 'ignoredRetrigger') > fact(prev, 'ignoredRetrigger');
  if (refused || ignored) {
    const id = B_LINE_IDS.find((l) => fact(next, `post:${l}`) > fact(prev, `post:${l}`));
    if (id) set({ refusal: { id, at: next.t, why: refused ? 'refused' : 'ignored' } });
  }
  // a line that starts again clears its own old marks
  for (const id of B_LINE_IDS) {
    if (fact(next, `inst:${id}`) > fact(prev, `inst:${id}`)) {
      if (out.cut?.id === id) set({ cut: null });
      if (out.refusal?.id === id) set({ refusal: null });
    }
  }
  return out;
}

export function bMusicSummary(s: GaState, tNow: number): string {
  if (!s.music.on) return 'The music’s four bars: sixteen beats, one lane for each layer. The music is stopped.';
  const c = gaMusicClock(s, tNow);
  const lanes = bLanes(s)
    .map((l) => `${l.name.toLowerCase()} ${l.sounding ? 'sounds' : 'is at zero level'}${l.waiting === 'in' ? ' and waits to come in' : l.waiting === 'out' ? ' and waits to go out' : ''}`)
    .join('; ');
  const change = bChange(s, tNow);
  const wait = change
    ? ` A change waits for ${change.boundary === 'now' ? 'no boundary' : `the ${B_BOUNDARY_WORD[change.boundary].toLowerCase()}`}: ${Math.max(0, change.landAt - tNow).toFixed(1)} seconds to go.`
    : ` Nothing is waiting. A change asked for now would land ${s.options.musicBoundary === 'now' ? 'immediately' : `on the ${B_BOUNDARY_WORD[s.options.musicBoundary].toLowerCase()}`}.`;
  const sting = bStingers(s, tNow);
  const st = sting.length ? ` A stinger ${sting[0].sounding ? 'is sounding' : 'waits for its line'}.` : '';
  return `The music’s four bars, with a play line from the music’s clock: bar ${c.bar + 1}, beat ${c.beat + 1}. ${lanes}.${wait}${st}`;
}

export function bLinesSummary(s: GaState, m: BMemo, tNow: number): string {
  const rows = bLineRows(s);
  const parts = rows.map((r) => {
    const cut = m.cut && m.cut.id === r.id && tNow - m.cut.at < B_CUT_SHOW_S ? ` It was interrupted at ${(m.cut.frac * m.cut.seconds).toFixed(1)} seconds.` : '';
    const ref = m.refusal && m.refusal.id === r.id && tNow - m.refusal.at < B_REFUSAL_SHOW_S ? (m.refusal.why === 'refused' ? ' A request for it was refused: a more important line is speaking.' : ' A request for it was ignored: it is already speaking.') : '';
    const state = r.born != null ? `speaking, ${Math.min(r.seconds, Math.max(0, tNow - r.born)).toFixed(1)} of ${r.seconds.toFixed(1)} seconds` : `not speaking; its ${r.langWord.toLowerCase()} file is ${r.seconds.toFixed(1)} seconds long`;
    return `${r.name.toLowerCase()}, priority ${r.priority}: ${state}.${cut}${ref}`;
  });
  return `The guide’s two lines, each as a bar as long as its file. ${parts.join(' ')}`;
}
