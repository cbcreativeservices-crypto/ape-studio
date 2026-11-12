/**
 * chcMusicVoice — what pages 14 and 15 (Chapter 4, Music and voice) read out
 * of the scene, as pure functions of the model's state.
 *
 * MUSIC. The model's `music.layers` is the set the game has ASKED for. While
 * a request waits for its boundary that is not yet what plays, so a page that
 * drew `layers` as "playing" would show a layer a bar too early. `musicRows`
 * takes the set that was last applied (the page remembers it) and says, for
 * each layer, whether it is heard, at zero level, or waiting to change.
 *
 * VOICE. Each spoken line has one take per language (GA_LINES): `lineTake`
 * gives a take's file and text, `lineTakeFact` the fact the model counts
 * when that take really started.
 */
import { GA_EVENTS, GA_LINES, type GaEventId, type GaLanguage } from '../../model/gaDefs.ts';
import type { GaState } from '../../model/gaModel.ts';
import { gaAsset } from '../../sounds/gaSoundBank.ts';
import { MUSIC_BAR_S, MUSIC_BARS, MUSIC_BEAT_S, MUSIC_LAYERS, MUSIC_LOOP_S, type GaMusicLayer } from '../../sounds/gaSynth.ts';

/* ── music ──────────────────────────────────────────────────────────────── */

export type ChcBoundary = GaState['options']['musicBoundary'];

/** The boundary as the log names it ("the next bar"). */
export const CHC_BOUNDARY_NOUN: Readonly<Record<ChcBoundary, string>> = { now: 'no boundary', beat: 'the next beat', bar: 'the next bar', phrase: 'the next phrase' };

/** The longest a request can wait for each boundary, in seconds. */
export const CHC_BOUNDARY_S: Readonly<Record<ChcBoundary, number>> = { now: 0, beat: MUSIC_BEAT_S, bar: MUSIC_BAR_S, phrase: MUSIC_LOOP_S };
export const CHC_MUSIC_BARS = MUSIC_BARS;

/** A layer that is on while SOUND is off. */
export const CHC_LAYER_UNHEARD = 'ON, NOT HEARD';

export type ChcLayerSet = Readonly<Record<GaMusicLayer, boolean>>;
export type ChcLayerState = 'stopped' | 'heard' | 'zero' | 'coming' | 'going';
export const CHC_LAYER_WORD: Readonly<Record<ChcLayerState, string>> = {
  stopped: 'NOT PLAYING',
  heard: 'HEARD',
  zero: 'ZERO LEVEL',
  coming: 'WAITING TO COME IN',
  going: 'WAITING TO GO OUT',
};

/** The set that is PLAYING: the asked-for set when nothing waits, else the
 *  set the page last saw applied. */
export function musicHeard(s: GaState, lastApplied: ChcLayerSet | null): ChcLayerSet {
  return s.music.pending && lastApplied ? lastApplied : s.music.layers;
}

export function musicRows(s: GaState, lastApplied: ChcLayerSet | null): { layer: GaMusicLayer; name: string; state: ChcLayerState; word: string }[] {
  const heard = musicHeard(s, lastApplied);
  return MUSIC_LAYERS.map((layer) => {
    const asked = s.music.layers[layer];
    const state: ChcLayerState = !s.music.on ? 'stopped' : asked === heard[layer] ? (asked ? 'heard' : 'zero') : asked ? 'coming' : 'going';
    // with SOUND off a layer that is on is not HEARD: say so
    const word = state === 'heard' && !s.soundOn ? CHC_LAYER_UNHEARD : CHC_LAYER_WORD[state];
    return { layer, name: layer.toUpperCase(), state, word };
  });
}

/** The PENDING readout: short. */
export function pendingShort(s: GaState): string {
  const p = s.music.pending;
  if (!p) return 'NONE';
  return p.inS != null ? `${p.inS.toFixed(1)} s` : 'WAITING';
}

/** The waiting change in a sentence (`inS` is how long it had to wait when
 *  the engine answered, not a countdown). */
export function pendingLine(s: GaState): string {
  const p = s.music.pending;
  if (!p) return 'Nothing is waiting.';
  if (p.boundary === 'now') return `${p.what}: being applied now.`;
  const wait = p.inS != null ? ` It had ${p.inS.toFixed(1)} s to wait when you asked.` : '';
  return `${p.what}: waiting for ${CHC_BOUNDARY_NOUN[p.boundary]}.${wait}`;
}

/* ── voice ──────────────────────────────────────────────────────────────── */

/** The dialogue line speaking now (one at a time), or null. */
export function speakingNow(s: GaState): { event: GaEventId; label: string; priority: number } | null {
  const i = s.inst.find((x) => GA_EVENTS[x.event].bus === 'dialogue');
  if (!i) return null;
  const d = GA_EVENTS[i.event];
  return { event: i.event, label: d.label, priority: d.priority };
}

export type ChcLine = keyof typeof GA_LINES;
export const CHC_LINES: readonly { id: ChcLine; name: string }[] = [
  { id: 'vo_greeting', name: 'GREETING' },
  { id: 'vo_warning', name: 'WARNING' },
];

/** One line's take for one language: its file, its text. */
export function lineTake(line: ChcLine, lang: GaLanguage): { asset: string; file: string; text: string } {
  const t = GA_LINES[line][lang];
  return { asset: t.asset, file: gaAsset(t.asset)?.file ?? t.asset, text: t.text };
}

/** The fact the model counts when a line really started in a language. */
export const lineTakeFact = (line: ChcLine, lang: GaLanguage): string => `take:${line}::${GA_LINES[line][lang].asset}`;
