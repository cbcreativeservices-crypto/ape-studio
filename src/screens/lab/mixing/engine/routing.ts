/**
 * Mixing lab — the ROUTING TRUTH ENGINE (owner brief 2026-09-11).
 *
 * The Patchbay discipline applied to console routing: every copy claim about
 * what a bus / subgroup / aux send / control group / VCA / stem actually DOES
 * resolves through this pure model, and test/mixingEngine.test.ts pins it.
 * The interactive signal-flow builder, the double-routing detective and the
 * pre/post-fader exercises all execute against the same graph — copy cannot
 * contradict the console.
 *
 * DAW-neutral and console-neutral: node kinds model what every mixer shares
 * (Avid's aux/pre-post definitions, Berklee's subgroup/VCA distinctions),
 * never one product's UI.
 *
 * PURE data + functions only — no React, no audio. The audio renderer
 * (audio/mixRender.ts) consumes the SAME channel model so what the learner
 * hears is what this graph says.
 */

/* ── The channel path (section 3's spine) ────────────────────────────────── */

/** One stage of the canonical channel path, in signal order. The signal-flow
 *  page renders these as stations; the drag-to-connect exercise asks the
 *  learner to rebuild the order. */
export const CHANNEL_PATH = [
  { id: 'source', name: 'SOURCE', blurb: 'The recorded clip or live input.' },
  { id: 'clipgain', name: 'CLIP GAIN', blurb: 'Level of the clip itself, before everything.' },
  { id: 'inserts', name: 'INSERTS', blurb: 'Processors in the path — the WHOLE signal passes through.' },
  { id: 'fader', name: 'FADER / PAN', blurb: 'The channel’s level and stereo position.' },
  { id: 'sends', name: 'SENDS', blurb: 'Adjustable COPIES split off to other destinations — tapped after the fader by default (the pre-fader exception comes later).' },
  { id: 'bus', name: 'BUS / SUBGROUP', blurb: 'A path carrying audio onward — alone or summed with others.' },
  { id: 'mixbus', name: 'MIX BUS', blurb: 'Where every path sums into the stereo mix.' },
  { id: 'output', name: 'OUTPUT', blurb: 'The monitored, exported result.' },
] as const;

export type StationId = (typeof CHANNEL_PATH)[number]['id'];

export const STATION_ORDER: readonly StationId[] = CHANNEL_PATH.map((s) => s.id);

/** True when `order` is the canonical signal order (the builder's win check). */
export function isChannelOrderCorrect(order: readonly StationId[]): boolean {
  return order.length === STATION_ORDER.length && order.every((s, i) => s === STATION_ORDER[i]);
}

/** For a wrong order: the FIRST station that sits too early, paired with the
 *  MOST FUNDAMENTAL station it must come after (the earliest-in-signal-order
 *  violation) — so feedback teaches the flow, not just "wrong". */
export function firstOrderMistake(order: readonly StationId[]): { station: StationId; mustFollow: StationId } | null {
  for (let i = 0; i < order.length; i++) {
    const want = STATION_ORDER.indexOf(order[i]);
    let best: StationId | null = null;
    let bestCanonical = Infinity;
    for (let j = i + 1; j < order.length; j++) {
      const later = STATION_ORDER.indexOf(order[j]);
      if (later < want && later < bestCanonical) {
        best = order[j];
        bestCanonical = later;
      }
    }
    if (best) return { station: order[i], mustFollow: best };
  }
  return null;
}

/* ── The six commonly-confused terms, as machine-checkable properties ────── */

export type PathKind = 'bus' | 'subgroup' | 'auxSendReturn' | 'controlGroup' | 'vca' | 'stem';

export interface PathTruth {
  kind: PathKind;
  name: string;
  /** Does audio itself travel THROUGH this thing? */
  carriesAudio: boolean;
  /** Does it SUM several channels' complete outputs into one path? */
  sumsChannels: boolean;
  /** Does it change assigned channels' gain WITHOUT audio passing through it? */
  remoteGainControl: boolean;
  /** Does the send keep the channel's own path playing unchanged (a copy)? */
  isCopy: boolean;
  /** Is it a rendered FILE rather than a live path at all? */
  isRenderedFile: boolean;
  /** One-line purpose, the table's copy of record. */
  purpose: string;
}

export const PATH_TRUTHS: readonly PathTruth[] = [
  {
    kind: 'bus',
    name: 'Bus',
    carriesAudio: true,
    sumsChannels: false,
    remoteGainControl: false,
    isCopy: false,
    isRenderedFile: false,
    purpose: 'A signal path that carries audio between destinations.',
  },
  {
    kind: 'subgroup',
    name: 'Subgroup',
    carriesAudio: true,
    sumsChannels: true,
    remoteGainControl: false,
    isCopy: false,
    isRenderedFile: false,
    purpose: 'Sums several channels’ complete outputs for shared control or processing.',
  },
  {
    kind: 'auxSendReturn',
    name: 'Aux send / return',
    carriesAudio: true,
    sumsChannels: true,
    remoteGainControl: false,
    isCopy: true,
    isRenderedFile: false,
    purpose: 'Sends an adjustable COPY of signals to effects, monitors, or parallel processing.',
  },
  {
    kind: 'controlGroup',
    name: 'Control group',
    carriesAudio: false,
    sumsChannels: false,
    remoteGainControl: false,
    isCopy: false,
    isRenderedFile: false,
    purpose: 'Links selected channel CONTROLS without routing their audio together.',
  },
  {
    kind: 'vca',
    name: 'VCA / DCA',
    carriesAudio: false,
    sumsChannels: false,
    remoteGainControl: true,
    isCopy: false,
    isRenderedFile: false,
    purpose: 'Controls the GAIN of assigned channels — no audio sums through the controller.',
  },
  {
    kind: 'stem',
    name: 'Stem',
    carriesAudio: false,
    sumsChannels: false,
    remoteGainControl: false,
    isCopy: false,
    isRenderedFile: true,
    purpose: 'A rendered submix delivered as an audio FILE — not another name for a bus.',
  },
] as const;

export function pathTruth(kind: PathKind): PathTruth {
  return PATH_TRUTHS.find((p) => p.kind === kind)!;
}

/* ── A tiny console graph for the routing exercises ──────────────────────── */

export type SendTap = 'pre' | 'post';

export interface Channel {
  id: string;
  name: string;
  faderDb: number;
  mute: boolean;
  /** Destination: 'mix' or a subgroup id. Exactly one — the double-routing
   *  detective is about breaking this rule via an extra path. */
  out: 'mix' | string;
  /** Adjustable copies: aux id → { levelDb, tap }. */
  sends: Record<string, { levelDb: number; tap: SendTap }>;
  /** VCA assignment (gain control only, no audio). */
  vca?: string;
}

export interface Subgroup {
  id: string;
  name: string;
  faderDb: number;
  out: 'mix';
}

export interface AuxReturn {
  id: string;
  name: string;
  faderDb: number;
  out: 'mix';
}

export interface Vca {
  id: string;
  name: string;
  levelDb: number;
}

export interface Console {
  channels: Channel[];
  subgroups: Subgroup[];
  auxes: AuxReturn[];
  vcas: Vca[];
}

const db2lin = (db: number) => Math.pow(10, db / 20);

/** The EFFECTIVE gain a channel contributes to the mix bus via its MAIN path
 *  (fader × VCA × subgroup fader; 0 when muted). The audio-truth behind the
 *  VCA-vs-subgroup comparison: a VCA changes this number, audio still flows
 *  through the channel's own route. */
export function mainPathGain(c: Channel, console_: Console): number {
  if (c.mute) return 0;
  let g = db2lin(c.faderDb);
  if (c.vca) {
    const v = console_.vcas.find((x) => x.id === c.vca);
    if (v) g *= db2lin(v.levelDb);
  }
  if (c.out !== 'mix') {
    const sg = console_.subgroups.find((s) => s.id === c.out);
    if (!sg) return 0; // routed nowhere — the classic silent channel
    g *= db2lin(sg.faderDb);
  }
  return g;
}

/** The gain a channel contributes to one AUX RETURN's input. Pre-fader sends
 *  ignore the fader (and mute follows the console convention: pre-fader keeps
 *  feeding the send). Post-fader sends follow fader, mute AND the VCA. */
export function sendPathGain(c: Channel, auxId: string, console_: Console): number {
  const s = c.sends[auxId];
  if (!s) return 0;
  const sendLin = db2lin(s.levelDb);
  if (s.tap === 'pre') return sendLin;
  if (c.mute) return 0;
  let g = db2lin(c.faderDb) * sendLin;
  if (c.vca) {
    const v = console_.vcas.find((x) => x.id === c.vca);
    if (v) g *= db2lin(v.levelDb);
  }
  return g;
}

/** Every distinct path by which a channel's audio reaches the mix bus.
 *  Length > 1 with a full-level copy = the accidental double-routing the
 *  detective exercise diagnoses. */
export function pathsToMix(c: Channel, console_: Console): string[] {
  const out: string[] = [];
  if (mainPathGain(c, console_) > 0) out.push(c.out === 'mix' ? 'direct to mix' : `through subgroup ${c.out}`);
  for (const auxId of Object.keys(c.sends)) {
    if (sendPathGain(c, auxId, console_) > 0) out.push(`copy via send to ${auxId}`);
  }
  return out;
}

/** Would pulling this VCA to −∞ silence the channel? TRUE for its main path
 *  and post-fader sends, FALSE for pre-fader sends — the exercise that
 *  separates "controls gain" from "carries audio". */
export function vcaSilences(c: Channel, auxId: string | null, console_: Console): boolean {
  if (!c.vca) return false;
  if (auxId == null) return true; // main path always follows the VCA
  const s = c.sends[auxId];
  if (!s) return false;
  return s.tap === 'post';
}
