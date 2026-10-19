/**
 * djEffects — the DJ Systems Lab's EFFECTS UNIT as a model (Stage 2, Screen
 * 13; research DJ19). Pure TypeScript, no React Native; the DSP that runs it
 * is engine/djFx.ts, and test/djStage2Fx.test.ts pins both.
 *
 * THIS LAB'S MIXER has ONE effects unit with a ROUTE switch (real mixers
 * differ — many have a beat-FX unit with a channel select AND separate send /
 * return jacks for an outboard unit; their manuals win):
 *
 *   CH1 / CH2  a channel INSERT: the whole channel goes through the effect,
 *              AFTER its fader (so pulling the fader lets an echo ring out —
 *              an "echo out"), before the crossfader. The headphone CUE stays
 *              dry (it is tapped before the fader).
 *   MASTER     an insert on the MIX BUS: everything the crowd hears goes
 *              through it (both decks), before the bus clip.
 *   SEND       a SEND / RETURN loop: each channel's SEND knob (after its
 *              fader) feeds the effect a COPY; the dry sound stays in the
 *              channel, and the RETURN level adds only the wet sound to the
 *              mix bus. RETURN TO can instead bring the return back in on
 *              CHANNEL 2 (some mixers can) — a LOOP if channel 2 also feeds
 *              the send.
 *
 * DRY / WET (the LEVEL / DEPTH knob, inserts and MASTER): dry = min(1, 2(1−w)),
 * wet = min(1, 2w) — at the centre both are at full level (the sound plus the
 * whole effect); past the centre the dry fades out. On SEND the same knob is
 * the RETURN level (wet only, linear 0 … 1): the dry never changes.
 *
 * TIME is musical: the unit takes its tempo from the deck on its channel (on
 * MASTER or SEND, from deck A — in this lab), so an echo of ½ BEAT at
 * 122 BPM repeats every 246 ms. FX OFF stops feeding the effect; what it was
 * already holding rings out (TRAILS — many units have that switch; some cut
 * the tail).
 */
import { TRACKS } from '../engine/djMusic.ts';
import { playedBpm } from './djTime.ts';
import type { Booth, ChannelId, DeckId } from './djModel.ts';

export type FxType = 'ECHO' | 'REVERB' | 'FILTER' | 'FLANGER';
export const FX_TYPES: readonly FxType[] = ['ECHO', 'REVERB', 'FILTER', 'FLANGER'];
export type FxRoute = 'CH1' | 'CH2' | 'MASTER' | 'SEND';
export const FX_ROUTES: readonly FxRoute[] = ['CH1', 'CH2', 'MASTER', 'SEND'];

export type FxState = {
  on: boolean;
  type: FxType;
  route: FxRoute;
  /** Index into the type's TIME list (FX_TIMES). */
  time: number;
  /** 0 … 1: how much of the output feeds back (ECHO repeats, FLANGER sharpness). */
  feedback: number;
  /** 0 … 1: DRY/WET on an insert or MASTER; the RETURN level on SEND. */
  wet: number;
  /** Each channel's SEND level (0 … 1, after its fader). */
  send: Record<ChannelId, number>;
  /** Where the RETURN comes back: the mix bus, or channel 2's input. */
  returnTo: 'BUS' | 'CH2';
};

export const freshFx = (): FxState => ({ on: false, type: 'ECHO', route: 'CH1', time: 1, feedback: 0.45, wet: 0.5, send: { 1: 0, 2: 0 }, returnTo: 'BUS' });

/** The TIME choices per type: beats for ECHO; beats per sweep for FILTER and
 *  FLANGER; seconds of decay (RT60) for REVERB. */
export const FX_TIMES: Record<FxType, readonly number[]> = {
  ECHO: [0.25, 0.5, 0.75, 1, 2],
  REVERB: [0.6, 1.2, 2, 3.5, 6],
  FILTER: [1, 2, 4, 8, 16],
  FLANGER: [2, 4, 8, 16, 32],
};

/** The words for a TIME choice. */
export function fxTimeWord(type: FxType, i: number): string {
  const v = FX_TIMES[type][Math.max(0, Math.min(FX_TIMES[type].length - 1, i))];
  if (type === 'REVERB') return `${v.toFixed(1)} s`;
  const beats = v === 0.25 ? '¼' : v === 0.5 ? '½' : v === 0.75 ? '¾' : String(v);
  return `${beats} ${v <= 1 ? 'BEAT' : 'BEATS'}`;
}

/** The longest echo the unit holds (s): 2 beats at 60 BPM, with margin. */
export const FX_MAX_DELAY_S = 2.1;
/** The internal feedback never quite reaches 1 (a unit that runs away on its
 *  own is broken); a LOOP outside it can. */
export const FX_FB_MAX = 0.92;

/** The deck whose tempo the effect follows. */
export function fxTempoDeck(fx: FxState): DeckId {
  return fx.route === 'CH2' ? 'B' : 'A';
}

/** The tempo the effect follows (the played BPM of that deck; 120 with no
 *  track loaded). */
export function fxBpm(b: Booth, fx: FxState): number {
  const d = b.decks[fxTempoDeck(fx)];
  return d.track ? playedBpm(TRACKS[d.track].bpm, d.pitch) : 120;
}

/** ECHO delay / FILTER or FLANGER sweep period, in seconds (REVERB: RT60). */
export function fxTimeSec(fx: FxState, bpm: number): number {
  const v = FX_TIMES[fx.type][Math.max(0, Math.min(FX_TIMES[fx.type].length - 1, fx.time))];
  if (fx.type === 'REVERB') return v;
  return (v * 60) / bpm;
}

/** The dry / wet law of the LEVEL / DEPTH knob on an insert or MASTER. */
export function dryWet(w: number): { dry: number; wet: number } {
  const x = Math.max(0, Math.min(1, w));
  return { dry: Math.min(1, 2 * (1 - x)), wet: Math.min(1, 2 * x) };
}

/** FEEDBACK does something on ECHO and FLANGER only (D75: lock it elsewhere). */
export const usesFeedback = (t: FxType): boolean => t === 'ECHO' || t === 'FLANGER';

/** The internal feedback gain the knob sets. */
export const fbGain = (fx: FxState): number => (usesFeedback(fx.type) ? Math.max(0, Math.min(FX_FB_MAX, fx.feedback * FX_FB_MAX)) : 0);

/**
 * A RETURN LOOP: the return comes back on channel 2 while channel 2 also
 * feeds the send. Its loop gain (linear) = RETURN × channel 2's trim, fader
 * and SEND (the channel's EQ is taken as flat — a simplification). Returns 0
 * when there is no loop.
 */
export function returnLoopGain(b: Booth, fx: FxState, trimGain: number, fader: number): number {
  if (!fx.on || fx.route !== 'SEND' || fx.returnTo !== 'CH2') return 0;
  return Math.max(0, fx.wet) * trimGain * fader * Math.max(0, fx.send[2]);
}

/** In a loop, the unit's output is held under this (linear, 0.25 = −12 dBFS):
 *  a real loop climbs until something clips at full scale. SAFE in the lab. */
export const LOOP_SAFE_CEILING = 0.25;
/** The listening level drops this far (dB) while a loop is building. */
export const LOOP_SAFETY_DB = -9;
