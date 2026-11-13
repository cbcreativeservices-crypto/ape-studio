/**
 * chcMusicVoice — what pages 14 and 15 (Chapter 4, Music and voice) read out
 * of the scene, as pure functions of the model's state.
 *
 * MUSIC. The model's `music.layers` is the set the game has ASKED for, and
 * `music.applied` is the set that SOUNDS. While a request waits for its
 * boundary the two differ, so a page that drew `layers` as "playing" would
 * show a layer a bar too early. `musicRows` says, for each layer, whether it
 * is heard, at zero level, or waiting to change. `pendingShort` and
 * `pendingLine` say what is waiting (a change, a stinger, or both) and count
 * DOWN to the moment it lands, from the model's own due time.
 *
 * VOICE. Each spoken line has one take per language (GA_LINES): `lineTake`
 * gives a take's file, its text and its length; `lineTakeFact` the fact the
 * model counts when that take really started.
 */
import { GA_EVENTS, GA_LINES, type GaEventId, type GaLanguage } from '../../model/gaDefs.ts';
import { GA_LOG_KIND_WORD, type GaLogEntry, type GaLogKind, type GaState } from '../../model/gaModel.ts';
import { gaAsset, gaSoundSeconds } from '../../sounds/gaSoundBank.ts';
import { MUSIC_BAR_S, MUSIC_BARS, MUSIC_BEAT_S, MUSIC_LAYERS, MUSIC_LOOP_S, type GaMusicLayer } from '../../sounds/gaSynth.ts';
import { chcLogView } from './chcSpace.ts';

/* ── music ──────────────────────────────────────────────────────────────── */

export type ChcBoundary = GaState['options']['musicBoundary'];

/** Where a waiting change will land, as a sentence says it. */
export const CHC_BOUNDARY_LANDS: Readonly<Record<ChcBoundary, string>> = { now: 'now', beat: 'on the next beat', bar: 'on the next bar line', phrase: 'at the end of the phrase' };

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

/** The set that SOUNDS: the model's `music.applied` while a request waits,
 *  the asked-for set when nothing does. */
export function musicHeard(s: GaState): ChcLayerSet {
  return s.music.pending ? (s.music.applied ?? s.music.layers) : s.music.layers;
}

export function musicRows(s: GaState): { layer: GaMusicLayer; name: string; state: ChcLayerState; word: string }[] {
  const heard = musicHeard(s);
  return MUSIC_LAYERS.map((layer) => {
    const asked = s.music.layers[layer];
    const state: ChcLayerState = !s.music.on ? 'stopped' : asked === heard[layer] ? (asked ? 'heard' : 'zero') : asked ? 'coming' : 'going';
    // with SOUND off a layer that is on is not HEARD: say so
    const word = state === 'heard' && !s.soundOn ? CHC_LAYER_UNHEARD : CHC_LAYER_WORD[state];
    return { layer, name: layer.toUpperCase(), state, word };
  });
}

/** A layer that was at zero level now sounds: a change that ADDED a layer
 *  has LANDED (a goal is judged from this, not from the press that asked). */
export function layerLanded(before: ChcLayerSet, after: ChcLayerSet): boolean {
  return MUSIC_LAYERS.some((l) => !before[l] && after[l]);
}

const cap = (x: string): string => x.charAt(0).toUpperCase() + x.slice(1);
/** Seconds left until `due`, or null when the engine has not said yet. */
const left = (due: number | null | undefined, t: number): string | null => (due == null ? null : `${Math.max(0, due - t).toFixed(1)} s`);

/** Something is waiting for a boundary: a change, a stinger, or both. */
export const musicWaiting = (s: GaState): boolean => !!(s.music.pending || s.music.stinger);

/** The PENDING readout: the seconds left, counting down (pass `t`, the scene
 *  clock now). The change comes first; a stinger alone shows its own time. */
export function pendingShort(s: GaState, t: number = s.t): string {
  const w = s.music.pending ?? s.music.stinger;
  if (!w) return 'NONE';
  if (w.boundary === 'now') return 'NOW';
  return left(w.due, t) ?? 'WAITING';
}

/** What is waiting, in a sentence for each thing, with the time left. */
export function pendingLine(s: GaState, t: number = s.t): string {
  const out: string[] = [];
  const p = s.music.pending;
  if (p) {
    // (a request for the layers already sounding is never queued: the model
    // withdraws the waiting one and logs "… that is what plays now, so
    // nothing is queued", GA2 B-14)
    const what = cap(p.what);
    if (p.boundary === 'now') out.push(`${what}: being applied now.`);
    else {
      const k = left(p.due, t);
      out.push(`${what}: lands ${CHC_BOUNDARY_LANDS[p.boundary]}${k ? ` in ${k}` : ''}.`);
    }
  }
  const st = s.music.stinger;
  if (st) {
    if (st.boundary === 'now') out.push('STINGER: plays now.');
    else {
      const k = left(st.due, t);
      out.push(`STINGER: its hit lands ${CHC_BOUNDARY_LANDS[st.boundary]}${k ? ` in ${k}` : ''}.`);
    }
  }
  return out.length ? out.join(' ') : 'Nothing is waiting.';
}

/** Page 14's log: the music's own lines, the MOOD state, the CHANGE AT
 *  setting, a NOTE (a second stinger is ignored), and ■ STOP. */
export const P14_LOG: readonly GaLogKind[] = ['music', 'state', 'mix', 'note'];
export const p14Log = (s: GaState): GaState => chcLogView(s, (l) => P14_LOG.includes(l.kind));

/* ── voice ──────────────────────────────────────────────────────────────── */

/** The dialogue line speaking now (one at a time), or null. */
export function speakingNow(s: GaState): { event: GaEventId; label: string; priority: number } | null {
  const i = s.inst.find((x) => GA_EVENTS[x.event].bus === 'dialogue');
  if (!i) return null;
  const d = GA_EVENTS[i.event];
  return { event: i.event, label: d.label, priority: d.priority };
}

export type ChcLine = keyof typeof GA_LINES;
export const CHC_LINES: readonly { id: ChcLine; name: string; priority: number }[] = [
  { id: 'vo_greeting', name: 'GREETING', priority: GA_EVENTS.vo_greeting.priority },
  { id: 'vo_warning', name: 'WARNING', priority: GA_EVENTS.vo_warning.priority },
];

/** One line's take for one language: its file, its text, and how long the
 *  file plays (seconds, from the sound itself). */
export function lineTake(line: ChcLine, lang: GaLanguage): { asset: string; file: string; text: string; seconds: number } {
  const t = GA_LINES[line][lang];
  return { asset: t.asset, file: gaAsset(t.asset)?.file ?? t.asset, text: t.text, seconds: gaSoundSeconds(t.asset) };
}

/** The fact the model counts when a line really started in a language. */
export const lineTakeFact = (line: ChcLine, lang: GaLanguage): string => `take:${line}::${GA_LINES[line][lang].asset}`;

/** The log lines that belong to speech. */
export const CHC_SPEECH_LOG: readonly GaLogKind[] = ['trigger', 'start', 'stop', 'refused', 'note', 'failed'];
const isLanguageLine = (l: GaLogEntry): boolean => l.kind === 'mix' && l.text.startsWith('SETTING language');

/** Page 15's log: the speech lines and the LANGUAGE setting. The duck's own
 *  MIX lines belong to page 16 and are left out, so the INTERRUPTED and
 *  REFUSED lines are not pushed out of sight. */
export const p15Log = (s: GaState): GaState => chcLogView(s, (l) => CHC_SPEECH_LOG.includes(l.kind) || isLanguageLine(l));

/** What the dialogue system did last, for the LINES tray (which covers the
 *  log): the newest line that says a line of speech started, stopped or was
 *  refused, as the log prints it. */
export function lastSpeech(s: GaState): string | null {
  for (let k = s.log.length - 1; k >= 0; k--) {
    const l = s.log[k];
    if (l.kind === 'refused' || l.kind === 'failed' || ((l.kind === 'start' || l.kind === 'stop') && l.bus === 'dialogue')) return `${GA_LOG_KIND_WORD[l.kind]} · ${l.text}`;
  }
  return null;
}

/** SAID ONCE, ON PAGE 15 ONLY (audit 2, L-11). Every real tool calls making
 *  language versions "localization", and a learner must meet the word. This
 *  app's glossary keeps that word for hearing where a sound is, so the note
 *  says both, and no other learner text in the lab uses it for languages. */
export const CHC_LANGUAGE_VERSIONS_NOTE = 'Making language versions of a game is called localization. In this app’s glossary that word means something else: hearing where a sound comes from.';
