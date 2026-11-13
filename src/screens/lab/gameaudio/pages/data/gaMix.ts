/**
 * gaMix — what page 16 ("The game mix") needs to talk about the buses in
 * plain words. Pure TypeScript (test/gameAudioChD.test.ts).
 *
 * ONE NAME FOR EACH BUS. A bus is called what the model's log calls it
 * (model/gaDefs `GA_BUS_NAME`: AMBIENCE, EFFECTS, DIALOGUE, MUSIC, INTERFACE,
 * CHAT) on every control, readout and card, so nothing has to be translated.
 * The duck's amounts are read from the model's own table, so the lesson text
 * can never drift from what the reducer does.
 */
import type { GaBus } from '../../engine/gaEngineProtocol.ts';
import { GA_BUS_NAME, GA_DUCK_DB } from '../../model/gaDefs.ts';
import { busGain, type GaState } from '../../model/gaModel.ts';

export type MixBus = {
  id: GaBus;
  /** The bus's name: the word on a control, and the word the log prints. */
  label: string;
  /** The short form for a narrow meter (the tool-window stage). */
  code: string;
  /** The label of this bus's readout under the picture: the name itself
   *  where it fits a readout (seven letters); otherwise its first letters,
   *  or UI for the interface bus (the chooser says so). */
  readout: string;
  /** What feeds this bus in the lab's scene. */
  carries: string;
};

export const MIX_BUSES: readonly MixBus[] = [
  { id: 'ambience', label: GA_BUS_NAME.ambience, code: 'AMB', readout: 'AMB', carries: 'Room tone, the courtyard wind and the fountain feed this bus.' },
  { id: 'sfx', label: GA_BUS_NAME.sfx, code: 'SFX', readout: 'EFFECTS', carries: 'The generator, the door, footsteps, impacts and the alarm feed this bus.' },
  { id: 'dialogue', label: GA_BUS_NAME.dialogue, code: 'DIAL', readout: 'DIAL', carries: 'The guide’s spoken lines feed this bus. A line here is what starts the duck.' },
  { id: 'music', label: GA_BUS_NAME.music, code: 'MUSIC', readout: 'MUSIC', carries: 'The music layers feed this bus.' },
  { id: 'ui', label: GA_BUS_NAME.ui, code: 'UI', readout: 'UI', carries: 'Short cues for menus and messages feed this bus. Its readout is labeled UI, for user interface.' },
  { id: 'chat', label: GA_BUS_NAME.chat, code: 'CHAT', readout: 'CHAT', carries: 'A stand-in voice for other players talking feeds this bus. It is not ducked here.' },
];

export const mixBus = (id: GaBus): MixBus => MIX_BUSES.find((b) => b.id === id) ?? MIX_BUSES[0];

/* ── the bus fader's lane ───────────────────────────────────────────────── */

export const BUS_DB_MIN = -24;
export const BUS_DB_MAX = 6;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Lane position 0…1 → whole decibels (a whole step per log line). */
export const laneToDb = (v: number): number => Math.round(BUS_DB_MIN + clamp01(v) * (BUS_DB_MAX - BUS_DB_MIN));
export const dbToLane = (db: number): number => clamp01((db - BUS_DB_MIN) / (BUS_DB_MAX - BUS_DB_MIN));
/** 0 dB: the fader changes nothing. */
export const BUS_LANE_HOME = dbToLane(0);

/** "+3 dB", "0 dB", "−10 dB" (a true minus sign). */
export function fmtDb(db: number, unit = true): string {
  const r = Math.round(db);
  const n = r > 0 ? `+${r}` : r < 0 ? `−${Math.abs(r)}` : '0';
  return unit ? `${n} dB` : n;
}

/* ── what one bus is doing right now ────────────────────────────────────── */

export type BusNow = {
  /** Nothing passes: it is muted, or another bus is soloed. */
  silent: boolean;
  /** Why it is silent, in a word short enough for a readout: MUTED, or
   *  SILENT when another bus is soloed. */
  why: 'MUTED' | 'SILENT' | null;
  /** Its level now in dB: the fader plus the duck (0 when silent). */
  db: number;
  /** The duck is holding this bus down right now. */
  ducked: boolean;
};

export function busNow(s: GaState, bus: GaBus): BusNow {
  const g = busGain(s, bus);
  if (g <= 0) return { silent: true, why: s.bus[bus].mute ? 'MUTED' : 'SILENT', db: 0, ducked: false };
  const ducked = s.options.duck && s.duckOwners > 0 && GA_DUCK_DB[bus] != null;
  return { silent: false, why: null, db: Math.round(20 * Math.log10(g)), ducked };
}

/** The readout's value for a bus: a level, or the word for why it is silent. */
export const busNowWord = (s: GaState, bus: GaBus): string => {
  const n = busNow(s, bus);
  return n.silent ? (n.why as string) : fmtDb(n.db);
};

/** The same, as a sentence for a screen reader. */
export const busNowSpoken = (s: GaState, bus: GaBus): string => {
  const n = busNow(s, bus);
  const name = `the ${mixBus(bus).label.toLowerCase()} bus`;
  if (n.silent) return n.why === 'MUTED' ? `${name} is muted` : `${name} is silent, because another bus is soloed`;
  return `${name} is at ${fmtDb(n.db)} now${n.ducked ? ', turned down by the duck' : ''}`;
};

/* ── the signal path card ───────────────────────────────────────────────── */

/** Two paths, kept apart: AUDIO is the sound itself; CONTROL is what the
 *  game sends to tell that path what to do: the four kinds of game
 *  information of page 8 (trigger, switch, parameter, state). */
export const SIGNAL_PATH = {
  audio: ['sound', 'its bus', 'master', 'output'],
  controlFrom: 'game',
  control: ['trigger', 'switch', 'parameter', 'state'],
} as const;

/** Both rows of the card in one spoken sentence each. */
export const signalPathSpoken = (): string =>
  `Signal path. Audio: ${SIGNAL_PATH.audio.join(', then ')}. Control: the ${SIGNAL_PATH.controlFrom} sends a ${SIGNAL_PATH.control.slice(0, -1).join(', a ')} or a ${SIGNAL_PATH.control[SIGNAL_PATH.control.length - 1]}. Control tells the audio path what to do and carries no audio.`;

/** The duck's amounts as a phrase, from the model's table:
 *  "music by 10 dB, ambience by 8 dB and effects by 5 dB". */
export function duckWords(): string {
  const parts = (['music', 'ambience', 'sfx'] as const)
    .filter((b) => GA_DUCK_DB[b] != null)
    .map((b) => `${mixBus(b).label.toLowerCase()} by ${Math.abs(GA_DUCK_DB[b] as number)} dB`);
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/** A dialogue line is speaking on the dialogue bus (the duck's own test). */
export const lineSpeaking = (s: GaState): boolean => s.duckOwners > 0;
