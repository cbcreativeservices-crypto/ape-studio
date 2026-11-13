/**
 * gaModel — the Game Audio lab's GAME: one state, one pure reducer. No React
 * Native, no audio; node:test drives it directly (test/gameAudioModel.test.ts).
 *
 *   gaReduce(state, action)  →  { state, cmds }
 *
 * `cmds` are the engine commands the change calls for (engine/gaEngineProtocol);
 * the conductor sends them and feeds the engine's answers back in as actions.
 * Everything the lessons teach lives HERE, where it can be proven:
 *
 *   event → instance → voices   posting an event makes an INSTANCE owned by
 *                               an object; each layer that plays is a VOICE
 *   triggers, switches,         a foot contact is a trigger; the surface is a
 *   parameters, states          switch (per character); SPEED is a parameter
 *                               kept on ONE machine, and that machine's
 *                               instance follows it; CALM / ALERT is a state
 *                               for the whole game
 *   variation                   seeded choice among takes, no immediate
 *                               repeat when there are two or more, small
 *                               level and pitch differences
 *   distance, direction, wall   model/gaWorld
 *   zones                       the bed follows the LISTENER's zone with one
 *                               crossfade per crossing; the courtyard bed
 *                               scatters bird calls as spot one-shots
 *   the mix                     category buses; mute, solo; dialogue DUCKS
 *                               chosen buses while any line speaks (an
 *                               owner count, so overlapping lines hold it)
 *   the budget                  a voice limit with a stated rule (below)
 *   music                       layers asked for on a boundary; the latest
 *                               request wins and a withdrawn one never plays;
 *                               a stinger that has begun is an instance
 *   two players                 an action is SENT, arrives a moment later,
 *                               and the same action delivered twice plays once
 *
 * THE VOICE RULE (deterministic, shown to the learner). At the limit a new
 * voice may take the place of the LEAST important voice sounding, the oldest
 * of those if several tie, provided that voice is not protected and is no
 * more important than the new one. If there is no such voice the NEW voice
 * is refused. Either way the count never passes the limit.
 *   A stolen ONE-SHOT is stopped. A stolen LOOP goes VIRTUAL: it is tracked,
 *   silent, marked `stolen`, and it comes back when a voice is free. A new
 *   LOOP that is refused a voice starts the same way. The budget never
 *   switches a machine or the scene OFF (audit 2, A2).
 *   This scene's count is a simplification the pages state: the music's
 *   layers and its stinger are not counted, and a loop at zero level is.
 *
 * SOUND OFF IS NOT A FAILURE. With sound off every request still makes its
 * instance and its log line, marked "not heard"; goals are judged from this
 * state, so a learner who cannot hear is never blocked. A sound the engine
 * REFUSED is a different line, with the engine's reason.
 *
 * THE LOG. A line's KIND is printed by the screen in its own column (GAME,
 * START, STOP …: GA_LOG_KIND_WORD). The TEXT never begins with that word
 * again, names buses and objects as the controls do (GA_BUS_NAME,
 * GA_OWNER_NAME), and uses a colon or a period, never a dash.
 */
import type { GaBus, GaCmd, GaEvt, GaMusicBoundary, GaPanMode } from '../engine/gaEngineProtocol.ts';
import { GA_BUSES } from '../engine/gaEngineProtocol.ts';
import { GA_HRTF_TRIM } from '../engine/gaEngineSource.ts';
import { gaAsset, gaSoundSeconds } from '../sounds/gaSoundBank.ts';
import { MUSIC_BARS, MUSIC_BEATS_PER_BAR, MUSIC_BPM, MUSIC_LAYERS, MUSIC_STINGER_S, type GaMusicLayer, type GaSurface } from '../sounds/gaSynth.ts';
import {
  GA_BED_FADE_S,
  GA_BIRD_ASSETS,
  GA_BIRD_MAX_S,
  GA_BIRD_MIN_S,
  GA_BURST_SPREAD_S,
  GA_BUS_NAME,
  GA_DOOR_CLOSE_ASSET,
  GA_DUCK_ATTACK_S,
  GA_DUCK_DB,
  GA_DUCK_RELEASE_S,
  GA_EVENTS,
  GA_LINES,
  GA_MUSIC_MARGIN_S,
  GA_MUSIC_START_AHEAD_S,
  GA_NET_DELAY_S,
  GA_NET_KEEP_S,
  GA_STINGER_ASSET,
  GA_STINGER_GAIN,
  GA_STINGER_LEAD_S,
  gaOwnerName,
  type GaEventDef,
  type GaEventId,
  type GaLanguage,
  type GaLayer,
} from './gaDefs.ts';
import {
  CLEAR,
  GA_PAN_WIDTH,
  PLACES,
  START,
  WALL_X,
  WORLD_H,
  WORLD_W,
  attenuationGain,
  hrtfDirection,
  obstruction,
  panGains,
  stereoPan,
  surfaceAt,
  walkResult,
  zoneAt,
  type GaListener,
  type GaObstruction,
  type GaPoint,
  type GaZone,
} from './gaWorld.ts';

/* ── state ──────────────────────────────────────────────────────────────── */

export type GaCharId = 'player' | 'guide';
export type GaChar = GaPoint & { id: GaCharId; facing: number };
export type GaMachine = GaPoint & { id: string; on: boolean; speed: number };

export type GaVoice = {
  v: string;
  inst: string;
  asset: string;
  layer: string;
  bus: GaBus;
  priority: number;
  protected: boolean;
  born: number;
  loop: boolean;
  /** Linear gain from the layer and its variation (before distance). */
  base: number;
  rate: number;
  /** requested = asked of the engine, no answer yet; playing = the engine
   *  confirmed it (or sound is off and it plays unheard); virtual = a loop
   *  out of range or without a voice, tracked but not played. */
  state: 'requested' | 'playing' | 'virtual';
  delayS: number;
  /** SEAM (audit 2): a LOOP whose voice the budget took (or that the budget
   *  refused a voice when it started). It is virtual (tracked, silent) and
   *  comes back when a voice is free. */
  stolen?: boolean;
  /** A LOOP that asked for a voice and was REFUSED one (at its start, or
   *  coming back into range): it WAITS, tracked and silent, and plays when a
   *  voice is free. Not stolen: nothing was taken from it (check N10). */
  waiting?: boolean;
  /** The budget slot this voice holds while it sounds (0 = the first). It
   *  keeps its slot for as long as it sounds, so a display does not shuffle;
   *  a virtual voice holds none. */
  slot?: number;
  /** A music stinger: the MUSIC system plays it (the engine knows it by its
   *  request id, which is this voice's `v`), so no voice command is ever
   *  sent for it, and it is outside the voice count and the budget. */
  music?: boolean;
};

/** SEAM (audit 2): a network action on its way. It is SENT at `sent` and
 *  takes effect at `due` (scene seconds; GA_NET_DELAY_S apart). Kept a few
 *  seconds after it lands so the display can show what became of it.
 *  Added to the seam: `again` = this id had been sent before (a REPEAT of an
 *  action; every action travels for the same time, so the earlier one has
 *  always landed first); `door`, set when it lands = what a NEW door action
 *  did to the door. */
export type GaNetFlight = { n: number; id: string; what: string; to: 'me' | 'them' | 'world'; sent: number; due: number; result: 'pending' | 'played' | 'ignored' | 'other'; again?: boolean; door?: 'opened' | 'closed' };

/** SEAM (audit 2): one take a container chose, newest last (the last 8).
 *  `take` counts from 1, as the log prints it ("take 2 of 4"). `group` is
 *  event/layer, with the surface for a footstep ("footstep/step/stone").
 *  `pitchCents` and `gainDb` are the variation this voice was really given
 *  (0 and 0 when variation is off or the event has none). */
export type GaTake = { n: number; t: number; owner: string; group: string; take: number; of: number; pitchCents: number; gainDb: number };

export type GaInstance = {
  id: string;
  event: GaEventId;
  owner: string;
  pos: GaPoint | null;
  loop: boolean;
  born: number;
  /** The take each layer chose, for the inspector. */
  chose: string[];
  /** Its natural end is not logged (a BURST impact, a bird call): a dozen
   *  "ended (it finished)" lines would push the lines that teach out of the
   *  log. Every other end of it is still logged. */
  quiet?: boolean;
  /** The SPEED of the machine that owned it, kept when that machine was
   *  removed and its loop left playing (the orphan fault): the orphan goes
   *  on at that speed (check N7). */
  speed?: number;
};

export type GaLogKind = 'trigger' | 'start' | 'stop' | 'value' | 'state' | 'refused' | 'failed' | 'mix' | 'music' | 'net' | 'note';
/** The word the screen prints for each kind, in its own column. A log TEXT
 *  never begins with its own kind's word (a test holds that). */
export const GA_LOG_KIND_WORD: Readonly<Record<GaLogKind, string>> = {
  trigger: 'GAME',
  start: 'START',
  stop: 'STOP',
  value: 'VALUE',
  state: 'STATE',
  refused: 'REFUSED',
  failed: 'FAULT',
  mix: 'MIX',
  music: 'MUSIC',
  net: 'NETWORK',
  note: 'NOTE',
};
export type GaLogEntry = {
  n: number;
  /** Logical seconds since the scene started. */
  t: number;
  kind: GaLogKind;
  text: string;
  owner?: string;
  inst?: string;
  bus?: GaBus;
  /** A run of the same kind of change (one SPEED drag, bird calls) is ONE
   *  line that is updated; this is how many changes it stands for. */
  count?: number;
};

export type GaOptions = {
  /** Use every take (off = always the first take: the machine-gun effect). */
  variation: boolean;
  avoidRepeat: boolean;
  doorRattle: boolean;
  debris: boolean;
  /** A visual signal stands in for the alarm (an accessible equivalent). */
  visualCue: boolean;
  /** Sources in the room feed the room reverb. */
  reverb: boolean;
  /** Play the courtyard wind that was cut with no loop preparation. */
  rawYardLoop: boolean;
  /** Ignore a network action whose id was already handled. */
  dedupe: boolean;
  duck: boolean;
  language: GaLanguage;
  musicBoundary: GaMusicBoundary;
};

/** Planted faults (lessons 6 and 19). Each is ONE wrong setting. */
export type GaFaults = {
  /** The door event points at a file the build does not contain. */
  missingDoor: boolean;
  /** Dialogue was routed to the effects bus: it no longer ducks anything. */
  voWrongBus: boolean;
  /** The surface switch was set for everyone instead of per character. */
  globalSurface: boolean;
  /** Removing a machine forgets to stop its loop. */
  orphanLoop: boolean;
  /** The bed is started again on every position update inside the zone. */
  bedPileUp: boolean;
};

export type GaBusState = { db: number; mute: boolean; solo: boolean };

export type GaState = {
  soundOn: boolean;
  t: number;
  /** Scene time at which the page on screen opened (a log row can print
   *  `t − tPage`: time since this page opened). */
  tPage: number;
  seq: number;
  seed: number;
  chars: Record<GaCharId, GaChar>;
  doorOpen: boolean;
  machines: GaMachine[];
  /** Whose ears: the player's, or a camera high over the middle. */
  listenerMode: 'player' | 'camera';
  mood: 'calm' | 'alert';
  options: GaOptions;
  faults: GaFaults;
  pan: Exclude<GaPanMode, 'none'>;
  mono: boolean;
  master: number;
  /** 0 = no limit. */
  voiceLimit: number;
  bus: Record<GaBus, GaBusState>;
  /** How many dialogue lines are speaking (the duck's owner count). */
  duckOwners: number;
  inst: GaInstance[];
  voices: GaVoice[];
  /** Per group: the last take chosen and the sequence position. */
  sel: Record<string, { last: number; at: number }>;
  music: {
    on: boolean;
    /** Scene time the music started (the bar lines are counted from it).
     *  Re-set when sound comes back (the engine restarts the music) and
     *  nudged onto the engine's own clock each time it reports a boundary. */
    t0: number;
    /** The layers ASKED for (what the layer keys show). */
    layers: Record<GaMusicLayer, boolean>;
    /** The layers SOUNDING now: `layers` as of the last change that landed.
     *  While a change waits, `layers` is ahead of this. */
    applied: Record<GaMusicLayer, boolean>;
    /** A layer change waiting for its boundary. `inS` = seconds it had to
     *  wait when it was asked (or when the engine answered); `due` = the
     *  scene time it lands, for a countdown drawn from the clock. `cause`:
     *  the MOOD state, or a layer key. */
    pending: { req: string; what: string; boundary: GaMusicBoundary; inS: number | null; due?: number | null; cause?: 'mood' | 'layer' } | null;
    /** A stinger waiting for its boundary (one at a time). When it begins it
     *  becomes an instance of the `stinger` event on the music bus. */
    stinger: { req: string; boundary: GaMusicBoundary; inS: number | null; due: number | null } | null;
  };
  /** Network action ids this machine knows. An id is recorded when its
   *  action is SENT (GA_NET_DELAY_S before it is handled), so the next NEW
   *  action never gets an id that is still on its way, and "was this id
   *  sent before?" can be answered at the press. */
  netSeen: string[];
  /** SEAM (audit 2): actions on their way and just landed (the net strip). */
  netFlights?: GaNetFlight[];
  /** SEAM (audit 2): the last takes chosen (the takes strip). */
  recentTakes?: GaTake[];
  /** False once the engine has said this device cannot load the room
   *  reverb. The reverb send is then 0 whatever ROOM is set to, and the page
   *  must say so (audit 2, F1). */
  reverbAvailable: boolean;
  /** Scene time of the next courtyard bird call (null = no courtyard bed). */
  birdAt?: number | null;
  /** Its own random stream, so the birds never disturb the take sequence. */
  birdSeed?: number;
  /** The beds' last crossfade: when it began, toward which zone, how long
   *  (so a display can draw it from the clock). */
  bedFade?: { at: number; to: GaZone; ramp: number; from?: { room: number; yard: number } } | null;
  /** What the engine was last told for each bus (and the duck inside it):
   *  a straight ramp from `from` to `to` starting `at`, `ramp` long, as the
   *  engine's own ramps run. The meters read it, so they move through the
   *  duck's attack and release exactly as the sound does (check N6). */
  busRamp?: Partial<Record<GaBus, GaRamp & { duckFrom: number; duckTo: number }>>;
  /** The same for the lab LEVEL. */
  masterRamp?: GaRamp;
  /** Scene time minus the engine's audio clock, from the engine's latest
   *  answer that carried its clock (a voice's `started`, a `clock`). Turns
   *  the engine's `music started` time into scene time (check N5). */
  audioOffset?: number | null;
  /** The line on screen (dialogue always carries its text). */
  caption: { event: GaEventId; text: string } | null;
  log: GaLogEntry[];
  logN: number;
  /** Counts of things that really happened — what goals are judged from. */
  facts: Record<string, number>;
};

/** A straight ramp, as the engine runs one (linear in gain). */
export type GaRamp = { from: number; to: number; at: number; ramp: number };
const rampAt = (r: GaRamp, t: number): number => (r.ramp > 0 && t < r.at + r.ramp ? r.from + (r.to - r.from) * clamp01((t - r.at) / r.ramp) : r.to);

export const GA_LOG_MAX = 120;
/** How many chosen takes `recentTakes` keeps. */
export const GA_TAKES_MAX = 8;

export const GA_DEFAULT_OPTIONS: GaOptions = {
  variation: true,
  avoidRepeat: true,
  doorRattle: true,
  debris: true,
  visualCue: false,
  reverb: true,
  rawYardLoop: false,
  dedupe: true,
  duck: true,
  language: 'en',
  musicBoundary: 'bar',
};
export const GA_NO_FAULTS: GaFaults = { missingDoor: false, voWrongBus: false, globalSurface: false, orphanLoop: false, bedPileUp: false };

export function gaInitial(seed = 20261112): GaState {
  const bus = {} as Record<GaBus, GaBusState>;
  for (const b of GA_BUSES) bus[b] = { db: 0, mute: false, solo: false };
  return {
    soundOn: false,
    t: 0,
    tPage: 0,
    seq: 0,
    seed,
    chars: {
      player: { id: 'player', x: START.player.x, y: START.player.y, facing: START.player.facing },
      guide: { id: 'guide', x: START.guide.x, y: START.guide.y, facing: START.guide.facing },
    },
    doorOpen: false,
    machines: [{ id: 'generator-1', x: PLACES.generator.x, y: PLACES.generator.y, on: false, speed: 0.4 }],
    listenerMode: 'player',
    mood: 'calm',
    options: { ...GA_DEFAULT_OPTIONS },
    faults: { ...GA_NO_FAULTS },
    pan: 'stereo',
    mono: false,
    master: 0.7,
    voiceLimit: 16,
    bus,
    duckOwners: 0,
    inst: [],
    voices: [],
    sel: {},
    music: { on: false, t0: 0, layers: { calm: true, pulse: false, drive: false }, applied: { calm: true, pulse: false, drive: false }, pending: null, stinger: null },
    netSeen: [],
    netFlights: [],
    recentTakes: [],
    reverbAvailable: true,
    birdAt: null,
    birdSeed: (seed ^ 0x5bd1e995) | 0,
    bedFade: null,
    busRamp: Object.fromEntries(GA_BUSES.map((b) => [b, { from: 1, to: 1, at: 0, ramp: 0, duckFrom: 1, duckTo: 1 }])) as GaState['busRamp'],
    masterRamp: { from: 0.7, to: 0.7, at: 0, ramp: 0 },
    audioOffset: null,
    caption: null,
    log: [],
    logN: 0,
    facts: {},
  };
}

/* ── actions ────────────────────────────────────────────────────────────── */

export type GaAction =
  | { type: 'sound'; on: boolean }
  | { type: 'step'; who: GaCharId; dx?: number; dy?: number }
  | { type: 'move'; who: GaCharId; x: number; y: number }
  | { type: 'face'; who: GaCharId; facing: number }
  | { type: 'listener'; mode: GaState['listenerMode'] }
  | { type: 'door' }
  | { type: 'post'; event: GaEventId; owner?: string }
  | { type: 'machine'; id: string; on: boolean }
  | { type: 'speed'; id: string; value: number }
  | { type: 'addMachine' }
  | { type: 'removeMachine'; id: string }
  | { type: 'scene'; on: boolean }
  | { type: 'alarm'; on: boolean }
  | { type: 'mood'; mood: GaState['mood'] }
  | { type: 'musicStart' }
  | { type: 'musicStop' }
  | { type: 'musicLayer'; layer: GaMusicLayer; on: boolean }
  | { type: 'stinger' }
  | { type: 'bus'; bus: GaBus; db?: number; mute?: boolean; solo?: boolean }
  | { type: 'master'; value: number }
  | { type: 'mono'; on: boolean }
  | { type: 'pan'; mode: GaState['pan'] }
  | { type: 'voiceLimit'; limit: number }
  | { type: 'burst'; count: number }
  /** `quiet`: no SETTING line in the log (a planted fault must not name itself). */
  | { type: 'option'; patch: Partial<GaOptions>; quiet?: boolean }
  | { type: 'fault'; patch: Partial<GaFaults> }
  /** A network action is SENT. It takes effect GA_NET_DELAY_S later: the
   *  next action (or `tick`) at or after that time lands it. */
  | { type: 'net'; id: string; what: 'door' | 'alert'; to: 'world' | 'me' | 'them' }
  /** A page opened: put the SETTINGS back to the standard setup (see the
   *  reducer). What is playing, where people stand and the door stay. */
  | { type: 'enterPage' }
  | { type: 'engine'; evt: GaEvt }
  | { type: 'expire'; v: string }
  /** ■ STOP, or SOUND switched off. `why: 'app'` = the APP stopped every
   *  sound (the learner left the app: the app-wide safety stop), not the
   *  learner (bug test 2026-11-13, B-S3-01). */
  | { type: 'stopAll'; why?: 'app' }
  | { type: 'clearLog' }
  | { type: 'reset' }
  /** The clock moved. Anything due by now happens (a network action lands,
   *  a bird calls). */
  | { type: 'tick'; t: number };

/** A setting's name and value as the log prints them. */
const OPTION_WORD: Record<keyof GaOptions, string> = {
  variation: 'variation (use every take)',
  avoidRepeat: 'avoid repeat',
  doorRattle: 'door rattle layer',
  debris: 'debris layer',
  visualCue: 'visual cue for the alarm',
  reverb: 'workshop reverb',
  rawYardLoop: 'courtyard wind file',
  dedupe: 'network ID check',
  duck: 'ducking under dialogue',
  language: 'language',
  musicBoundary: 'music changes land',
};
const BOUNDARY_NEXT: Record<GaMusicBoundary, string> = { now: 'immediately', beat: 'on the next beat', bar: 'on the next bar', phrase: 'at the end of the phrase' };
/** Where a change that waited DID land. */
const BOUNDARY_LANDED: Record<GaMusicBoundary, string> = { now: 'immediately', beat: 'exactly on the beat', bar: 'exactly on the bar line', phrase: 'exactly at the end of the phrase' };
function optionValueWord(k: keyof GaOptions, v: GaOptions[keyof GaOptions]): string {
  if (k === 'rawYardLoop') return v ? 'RAW CUT' : 'PREPARED LOOP';
  if (k === 'musicBoundary') return BOUNDARY_NEXT[v as GaMusicBoundary];
  return v === true ? 'ON' : v === false ? 'OFF' : v === 'en' ? 'English' : v === 'es' ? 'Spanish' : String(v);
}

/* ── helpers ────────────────────────────────────────────────────────────── */

const lin = (db: number) => Math.pow(10, db / 20);
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const round = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** `holdDuck`: a line is being replaced by another — recount the duck's
 *  owners once, after the swap, so the mix does not bounce up in between. */
type Ctx = { s: GaState; cmds: GaCmd[]; holdDuck: boolean };

function clone(s: GaState): GaState {
  return {
    ...s,
    chars: { player: { ...s.chars.player }, guide: { ...s.chars.guide } },
    machines: s.machines.map((m) => ({ ...m })),
    options: { ...s.options },
    faults: { ...s.faults },
    bus: Object.fromEntries(GA_BUSES.map((b) => [b, { ...s.bus[b] }])) as Record<GaBus, GaBusState>,
    inst: s.inst.map((i) => ({ ...i, chose: [...i.chose] })),
    voices: s.voices.map((v) => ({ ...v })),
    sel: { ...s.sel },
    music: {
      ...s.music,
      layers: { ...s.music.layers },
      applied: { ...(s.music.applied ?? s.music.layers) },
      pending: s.music.pending ? { ...s.music.pending } : null,
      stinger: s.music.stinger ? { ...s.music.stinger } : null,
    },
    netSeen: [...s.netSeen],
    netFlights: (s.netFlights ?? []).map((f) => ({ ...f })),
    recentTakes: [...(s.recentTakes ?? [])],
    bedFade: s.bedFade ? { ...s.bedFade } : null,
    busRamp: s.busRamp ? { ...s.busRamp } : undefined,
    log: [...s.log],
    facts: { ...s.facts },
  };
}

/** mulberry32, stepped from the state's own seed (deterministic per run). */
function rand(c: Ctx): number {
  let t = (c.s.seed = (c.s.seed + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const nextId = (c: Ctx, p: string) => `${p}${++c.s.seq}`;
const fact = (c: Ctx, k: string, by = 1) => {
  c.s.facts[k] = (c.s.facts[k] ?? 0) + by;
};
function log(c: Ctx, kind: GaLogKind, text: string, more: Partial<GaLogEntry> = {}): void {
  c.s.log.push({ n: ++c.s.logN, t: round(c.s.t, 2), kind, text, ...more });
  if (c.s.log.length > GA_LOG_MAX) c.s.log.splice(0, c.s.log.length - GA_LOG_MAX);
}
/** The log line when the APP stops every sound (the learner left the app). */
export const GA_APP_STOP_TEXT = 'ALL SOUND, by the app: you left the app (or the app muted itself for safety). Every instance is stopped and every waiting change is withdrawn';
/** The same thing said twice running is said once. */
function logOnce(c: Ctx, kind: GaLogKind, text: string, more: Partial<GaLogEntry> = {}): void {
  const last = c.s.log[c.s.log.length - 1];
  if (last && last.kind === kind && last.text === text) return;
  log(c, kind, text, more);
}

/** The overhead camera listens from the point it looks at, the middle of
 *  the scene, facing up the picture. Its HEIGHT shrinks every left/right
 *  angle (the reason an overhead view pans less); DISTANCE is still measured
 *  along the ground from that point, as many overhead games do, so sources
 *  do not all fall out of range just because the camera is high. */
export const GA_CAMERA_HEIGHT = 6;
export function listenerOf(s: GaState): GaListener {
  if (s.listenerMode === 'camera') return { x: WORLD_W / 2, y: WORLD_H / 2, facing: 0, height: GA_CAMERA_HEIGHT };
  const p = s.chars.player;
  return { x: p.x, y: p.y, facing: p.facing, height: 0 };
}

/** The surface a character's footstep uses. With the planted fault the
 *  switch was set GLOBALLY, so everyone gets the player's surface. */
export function surfaceOf(s: GaState, who: GaCharId): GaSurface {
  return surfaceAt(s.faults.globalSurface ? s.chars.player : s.chars[who]);
}

const defOf = (s: GaState, id: GaEventId): GaEventDef => GA_EVENTS[id];
/** The bus an event is routed to — the planted routing fault applies here. */
export function busOf(s: GaState, id: GaEventId): GaBus {
  const d = GA_EVENTS[id];
  return s.faults.voWrongBus && d.bus === 'dialogue' ? 'sfx' : d.bus;
}

/** The dialogue duck on one bus right now, in dB (0 or a negative number). */
const duckDbOf = (s: GaState, b: GaBus): number => (s.options.duck && s.duckOwners > 0 ? (GA_DUCK_DB[b] ?? 0) : 0);
/** Why a bus is silent, if it is: its own MUTE, or another bus's SOLO. */
function silencedBy(s: GaState, b: GaBus): 'mute' | 'solo' | null {
  if (s.bus[b].mute) return 'mute';
  return GA_BUSES.some((x) => s.bus[x].solo) && !s.bus[b].solo ? 'solo' : null;
}

/** What one bus is at right now, linear: its fader, mute and solo, and the
 *  dialogue duck. */
export function busGain(s: GaState, b: GaBus): number {
  if (silencedBy(s, b)) return 0;
  return lin(s.bus[b].db + duckDbOf(s, b));
}

type Placed = { gain: number; pan: number; pos: [number, number, number]; lowpass: number; rev: number; inRange: boolean };

/** The wall treatment the model gives a positioned sound of this event.
 *  THE DOOR ITSELF IS NEVER TREATED: it stands IN the wall, so its own
 *  sound is as clear from the courtyard as from the workshop, opening or
 *  closing (audit 2, F13). */
function wallFor(s: GaState, event: GaEventId, pos: GaPoint): GaObstruction {
  if (event === 'door_open') return CLEAR;
  return obstruction(listenerOf(s), pos, s.doorOpen);
}
/** The wall treatment of one instance, as the model applies it (the scene
 *  draws "muffled" from this, so the picture agrees with the sound). */
export function gaInstWall(s: GaState, i: GaInstance): GaObstruction {
  return i.pos && GA_EVENTS[i.event].spatial ? wallFor(s, i.event, i.pos) : CLEAR;
}

/** Where a voice sits for the listener, and how loud. */
function place(s: GaState, def: GaEventDef, pos: GaPoint | null, base: number): Placed {
  if (!def.spatial || !pos || !def.atten) return { gain: base, pan: 0, pos: [0, 0, -1], lowpass: 20000, rev: 0, inRange: true };
  const L = listenerOf(s);
  const a = attenuationGain(gaListenDistance(L, pos), def.atten);
  const ob = wallFor(s, def.id, pos);
  const room = s.options.reverb && s.reverbAvailable !== false && zoneAt(pos) === 'room' ? (zoneAt(L) === 'room' ? 0.28 : 0.12) : 0;
  return { gain: base * a * ob.gain, pan: stereoPan(L, pos), pos: hrtfDirection(L, pos), lowpass: ob.lowpassHz, rev: room, inRange: a > 0 };
}

/** How far a source is from the listener for LEVEL: along the ground. */
export const gaListenDistance = (L: GaListener, pos: GaPoint): number => Math.hypot(pos.x - L.x, pos.y - L.y);

const instOf = (s: GaState, id: string) => s.inst.find((i) => i.id === id);
const voicesOf = (s: GaState, inst: string) => s.voices.filter((v) => v.inst === inst);
/** The voices that hold a place in the budget: sounding, and not the
 *  music's own (decision 5: this scene leaves the music out of the count). */
const sounding = (s: GaState) => s.voices.filter((v) => v.state !== 'virtual' && !v.music);

/** Give a voice that starts to sound the lowest free slot of the budget. */
function seat(s: GaState, v: GaVoice): void {
  if (v.music) return;
  const taken = new Set<number>();
  for (const x of s.voices) if (x !== v && x.state !== 'virtual' && !x.music && x.slot != null) taken.add(x.slot);
  let k = 0;
  while (taken.has(k)) k++;
  v.slot = k;
}

/** The speed of the machine that owns an instance; an orphan keeps the speed
 *  its machine had when it was removed (0.4 if it never had one). */
function speedOf(s: GaState, i: GaInstance): number {
  return s.machines.find((m) => m.id === i.owner)?.speed ?? i.speed ?? 0.4;
}
function layerOf(def: GaEventDef, id: string): GaLayer | undefined {
  return def.layers.find((l) => l.id === id);
}
function speedShape(layer: GaLayer | undefined, speed: number): { gain: number; rate: number } {
  const g = layer?.speedGain ? layer.speedGain[0] + (layer.speedGain[1] - layer.speedGain[0]) * speed : 1;
  const r = layer?.speedRate ? layer.speedRate[0] + (layer.speedRate[1] - layer.speedRate[0]) * speed : 1;
  return { gain: g, rate: r };
}

/** How loud one voice is BEFORE distance and walls: its own level, its
 *  layer's speed shape, and its bus (fader, mute, solo, duck). The scene
 *  draws its rings from this, so the picture shows the mix as well as the
 *  distance. 0 = the mix has silenced it. */
export function gaVoiceLevel(s: GaState, v: GaVoice): number {
  const i = instOf(s, v.inst);
  if (!i) return 0;
  return v.base * speedShape(layerOf(GA_EVENTS[i.event], v.layer), speedOf(s, i)).gain * busGain(s, v.bus);
}

function sendStart(c: Ctx, v: GaVoice, def: GaEventDef, inst: GaInstance): void {
  if (v.music) return;
  if (v.slot == null) seat(c.s, v);
  const sh = speedShape(layerOf(def, v.layer), speedOf(c.s, inst));
  const p = place(c.s, def, inst.pos, v.base * sh.gain);
  if (!c.s.soundOn) {
    v.state = 'playing';
    return;
  }
  c.cmds.push({
    t: 'start',
    v: v.v,
    buf: v.asset,
    bus: v.bus,
    gain: p.gain,
    mode: def.spatial ? c.s.pan : 'none',
    pan: p.pan,
    pos: p.pos,
    rate: v.rate * sh.rate,
    loop: v.loop,
    delay: v.delayS || undefined,
    fadeIn: v.loop ? 0.08 : undefined,
    lowpass: p.lowpass,
    rev: p.rev,
  });
}

function dropVoice(c: Ctx, v: GaVoice, fade: number | null): void {
  c.s.voices = c.s.voices.filter((x) => x !== v);
  if (fade != null && c.s.soundOn && v.state !== 'virtual' && !v.music) c.cmds.push({ t: 'stop', v: v.v, fade });
}

/** `silent`: the line that told of the end was already written (a theft). */
function endInstanceIfEmpty(c: Ctx, id: string, why: string, silent = false): void {
  if (voicesOf(c.s, id).length) return;
  const i = instOf(c.s, id);
  if (!i) return;
  c.s.inst = c.s.inst.filter((x) => x !== i);
  const def = defOf(c.s, i.event);
  if (!silent && !(i.quiet && why === 'it finished')) log(c, 'stop', `${def.label} ${i.id} ended (${why})`, { inst: i.id, owner: i.owner, bus: busOf(c.s, i.event) });
  if (c.s.caption?.event === i.event) c.s.caption = null;
  if (def.bus === 'dialogue' && !c.holdDuck) setDuckOwners(c);
}

function stopInstance(c: Ctx, i: GaInstance, fade: number, why: string, silent = false): void {
  for (const v of voicesOf(c.s, i.id)) dropVoice(c, v, fade);
  endInstanceIfEmpty(c, i.id, why, silent);
}

/** Recount the speaking dialogue lines and move the ducked buses if the
 *  count crossed zero. A line counts when its VOICE is on the dialogue bus:
 *  a line that started on the wrong bus never ducks, even if the routing is
 *  corrected while it still speaks (walk audit W2-27). */
function setDuckOwners(c: Ctx): void {
  const n = c.s.inst.filter((i) => GA_EVENTS[i.event].bus === 'dialogue' && voicesOf(c.s, i.id).some((v) => v.bus === 'dialogue')).length;
  const was = c.s.duckOwners;
  c.s.duckOwners = n;
  if ((was > 0) === (n > 0)) return;
  if (c.s.options.duck) log(c, 'mix', n > 0 ? 'DUCK on: a line is speaking. Music, ambience and effects turn down' : 'DUCK off: the last line ended. The mix comes back', { bus: 'dialogue' });
  if (n > 0 && c.s.options.duck) fact(c, 'duck');
  syncBuses(c, n > 0 ? GA_DUCK_ATTACK_S : GA_DUCK_RELEASE_S);
}

/** Every bus to where its fader, MUTE, SOLO and the duck put it, over
 *  `ramp`. What the engine is told is RECORDED (busRamp) even with sound
 *  off, so the meters move as the sound does, or would. */
function syncBuses(c: Ctx, ramp = 0.05): void {
  const s = c.s;
  const rec = { ...(s.busRamp ?? {}) };
  for (const b of GA_BUSES) {
    const to = busGain(s, b);
    const duckTo = lin(duckDbOf(s, b));
    const r = rec[b];
    const now = r ? rampAt(r, s.t) : to;
    const duckNow = r ? rampAt({ from: r.duckFrom, to: r.duckTo, at: r.at, ramp: r.ramp }, s.t) : duckTo;
    // the engine restarts its ramp from where it is: record that, unless
    // nothing moves at all
    const settled = !r || !(r.ramp > 0) || s.t >= r.at + r.ramp;
    if (!(settled && Math.abs(now - to) < 1e-12 && Math.abs(duckNow - duckTo) < 1e-12)) rec[b] = { from: now, to, at: s.t, ramp, duckFrom: duckNow, duckTo };
  }
  s.busRamp = rec;
  if (!s.soundOn) return;
  for (const b of GA_BUSES) c.cmds.push({ t: 'bus', bus: b, gain: busGain(s, b), ramp });
}
/** The lab LEVEL to `s.master`, over `ramp` (recorded as the buses are). */
function syncMaster(c: Ctx, ramp: number): void {
  const s = c.s;
  const r = s.masterRamp;
  const now = r ? rampAt(r, s.t) : s.master;
  if (!r || Math.abs(now - s.master) > 1e-12 || (r.ramp > 0 && s.t < r.at + r.ramp)) s.masterRamp = { from: now, to: s.master, at: s.t, ramp };
  if (s.soundOn) c.cmds.push({ t: 'master', gain: s.master, ramp });
}

/** Choose a take for a group. Never the same twice running when there are
 *  two or more takes and avoid-repeat is on; a one-take group still plays. */
function choose(c: Ctx, key: string, n: number, mode: GaLayer['select']): number {
  if (n <= 1 || mode === 'fixed' || !c.s.options.variation) return 0;
  const g = c.s.sel[key] ?? { last: -1, at: 0 };
  let i: number;
  if (mode === 'sequence') {
    i = g.at % n;
  } else {
    i = Math.floor(rand(c) * n);
    if (c.s.options.avoidRepeat && i === g.last) i = (i + 1 + Math.floor(rand(c) * (n - 1))) % n;
  }
  c.s.sel[key] = { last: i, at: g.at + 1 };
  return i;
}

/** A voice by the name a learner would give it: the event's label, with the
 *  layer when the event plays several ("Generator · fan"). */
const voiceName = (def: GaEventDef, layer: string): string => (def.layers.length > 1 ? `${def.label} · ${layer}` : def.label);

/** The budget takes one voice (THE VOICE RULE). A one-shot is stopped; a
 *  LOOP goes virtual, marked stolen, and waits for a free voice. */
function takeVoice(c: Ctx, victim: GaVoice, lead: string, tail: string, counted: 'stolen' | 'shed'): void {
  const vi = instOf(c.s, victim.inst);
  const name = vi ? voiceName(GA_EVENTS[vi.event], victim.layer) : 'a sound';
  // `stolen` counts thefts by a NEW voice (what lesson 17's readout shows);
  // a voice given up because the budget was lowered is counted apart
  fact(c, counted);
  if (victim.loop) {
    if (c.s.soundOn) c.cmds.push({ t: 'stop', v: victim.v, fade: 0.02 });
    victim.state = 'virtual';
    victim.stolen = true;
    victim.slot = undefined;
    fact(c, 'loopMadeVirtual');
    log(c, 'stop', `${lead} ${name} (${victim.inst})${tail}. It is a loop: VIRTUAL until a voice is free`, { inst: victim.inst, owner: vi?.owner, bus: victim.bus });
    return;
  }
  log(c, 'stop', `${lead} ${name} (${victim.inst})${tail}. It is a one-shot: it stops`, { inst: victim.inst, owner: vi?.owner, bus: victim.bus });
  dropVoice(c, victim, 0.02);
  endInstanceIfEmpty(c, victim.inst, 'its voice was stolen', true);
}

/** Find room for one more voice, by THE VOICE RULE. `inst`: the instance
 *  that asks. Its own voices are never taken: a later layer of an event
 *  must not steal an earlier layer of the same event (check N1). */
function allocate(c: Ctx, priority: number, label: string, inst?: string, layerLabel?: string): boolean {
  const limit = c.s.voiceLimit;
  const live = sounding(c.s);
  if (!limit || live.length < limit) return true;
  const open = live.filter((v) => v.inst !== inst && !v.protected && v.priority <= priority);
  if (!open.length) {
    const own = inst != null && live.some((v) => v.inst === inst);
    const by = own
      ? live.every((v) => v.inst === inst)
        ? "this event's own other layers"
        : "this event's own other layers and sounds that are more important or protected"
      : limit === 1
        ? 'a sound that is more important or protected'
        : 'sounds that are more important or protected';
    // refused because of its own other layers: name the layer that was refused
    log(c, 'refused', `${own && layerLabel ? layerLabel : label} REFUSED: ${limit === 1 ? 'the one voice is' : `all ${limit} voices are`} in use by ${by}`);
    fact(c, 'refused');
    return false;
  }
  open.sort((a, b) => a.priority - b.priority || a.born - b.born);
  takeVoice(c, open[0], 'Voice STOLEN from', `, the least important and oldest voice, to play ${label}`, 'stolen');
  return true;
}

/** A voice is free again: stolen loops come back, the most important first. */
function reclaim(c: Ctx): void {
  const s = c.s;
  const waiting = s.voices.filter((v) => (v.stolen || v.waiting) && v.state === 'virtual');
  if (!waiting.length) return;
  waiting.sort((a, b) => b.priority - a.priority || a.born - b.born);
  for (const v of waiting) {
    if (s.voiceLimit && sounding(s).length >= s.voiceLimit) break;
    const i = instOf(s, v.inst);
    if (!i) continue;
    const def = GA_EVENTS[i.event];
    const was = v.waiting ? 'WAITING' : 'VIRTUAL';
    v.stolen = false;
    v.waiting = false;
    // out of range by now: it is simply a virtual loop, and comes back by distance
    if (!place(s, def, i.pos, 1).inRange) continue;
    v.state = 'requested';
    v.v = nextId(c, 'v');
    fact(c, 'stolenBack');
    log(c, 'state', was === 'WAITING' ? `${voiceName(def, v.layer)} (${i.id}) has a voice now: no longer WAITING` : `${voiceName(def, v.layer)} (${i.id}) has a voice again: no longer VIRTUAL`, { inst: i.id, owner: i.owner, bus: v.bus });
    sendStart(c, v, def, i);
    if (i.event === 'bed_room' || i.event === 'bed_yard') syncBeds(c, 0.02);
  }
}

type PostOpts = {
  assetOverride?: string;
  surface?: GaSurface;
  /** Seconds to hold every layer back (BURST spreads its impacts). */
  delayS?: number;
  /** Do not log this instance's natural end. */
  quiet?: boolean;
  /** A spot sound the audio side scatters by itself (a bird): no EVENT line
   *  from the game, one START line that a run of them shares. */
  ambient?: boolean;
};

/** POST AN EVENT. The game calls this; everything else is the audio side. */
function post(c: Ctx, event: GaEventId, owner: string, pos: GaPoint | null, opts: PostOpts = {}): GaInstance | null {
  const def = defOf(c.s, event);
  const bus = busOf(c.s, event);
  const who = gaOwnerName(owner);
  if (!opts.ambient) log(c, 'trigger', `EVENT ${def.name} posted by ${who}`, { owner, bus });
  fact(c, `post:${event}`);

  if (def.retrigger === 'ignore') {
    const already = c.s.inst.find((i) => i.event === event && i.owner === owner);
    if (already) {
      log(c, 'note', `${def.label} is already playing${pos ? ` on ${who}` : ''}: the event is ignored, no second copy starts`, { inst: already.id, owner });
      fact(c, 'ignoredRetrigger');
      return already;
    }
  }
  // one line speaks at a time: a more important line interrupts, a less
  // important one waits its turn (here: is refused)
  if (def.bus === 'dialogue') {
    const speaking = c.s.inst.find((i) => GA_EVENTS[i.event].bus === 'dialogue');
    if (speaking) {
      if (GA_EVENTS[speaking.event].priority > def.priority) {
        log(c, 'refused', `${def.label} REFUSED: a more important line is speaking`, { owner, bus });
        fact(c, 'lineRefused');
        return null;
      }
      // one line tells it: the interrupted line's end is not logged again
      log(c, 'stop', `${GA_EVENTS[speaking.event].label} (${speaking.id}) INTERRUPTED by a more important line: it stops`, { inst: speaking.id, owner: speaking.owner, bus });
      fact(c, 'interrupted');
      c.holdDuck = true;
      stopInstance(c, speaking, 0.08, 'interrupted', true);
      c.holdDuck = false;
    }
  }

  if (def.bus === 'dialogue' && bus !== 'dialogue') fact(c, 'lineOnWrongBus');
  const inst: GaInstance = { id: nextId(c, 'i'), event, owner, pos, loop: def.kind === 'loop', born: c.s.t, chose: [] };
  if (opts.quiet || opts.ambient) inst.quiet = true;
  const made: GaVoice[] = [];
  let virtualSaid = false;
  for (const layer of def.layers) {
    if (layer.secondary === 'rattle' && !c.s.options.doorRattle) continue;
    if (layer.secondary === 'debris' && !c.s.options.debris) continue;
    const surface = opts.surface;
    const list = Array.isArray(layer.assets) ? (layer.assets as readonly string[]) : (layer.assets as Record<GaSurface, readonly string[]>)[surface ?? 'stone'];
    const key = `${event}/${layer.id}/${owner}/${surface ?? ''}`;
    const idx = choose(c, key, list.length, layer.select);
    let asset = opts.assetOverride && layer.secondary == null ? opts.assetOverride : list[idx];
    if (event === 'door_open' && layer.id === 'door' && c.s.faults.missingDoor) asset = 'door_open_v2.wav';
    if (event === 'bed_yard' && c.s.options.rawYardLoop) asset = 'amb_yard_raw';
    const record = gaAsset(asset);
    if (!record) {
      log(c, 'failed', `${def.label}: the file "${asset}" is NOT IN THE BUILD. The event was posted, but this layer cannot play`, { owner, bus });
      fact(c, 'missingAsset');
      continue;
    }
    // out of range: a one-shot is not started at all (it would be silent)
    const here = place(c.s, def, pos, 1);
    if (!here.inRange && def.kind === 'one-shot') {
      log(c, 'note', `${def.label} is beyond its maximum distance: not started`, { owner, bus });
      fact(c, 'culled');
      continue;
    }
    // no voice for it: a one-shot is refused and gone. A LOOP is refused a
    // voice but still STARTS, virtual: the thing it belongs to is running
    // (the machine is on), so it is tracked and plays when a voice is free.
    let noVoice = false;
    if (here.inRange && !allocate(c, def.priority, def.label, inst.id, voiceName(def, layer.id))) {
      if (def.kind !== 'loop') continue;
      noVoice = true;
    }
    const vary = def.vary && c.s.options.variation ? def.vary : null;
    const varyDb = vary ? (rand(c) * 2 - 1) * vary.gainDb : 0;
    const gainDb = (layer.gainDb ?? 0) + varyDb;
    const cents = vary ? (rand(c) * 2 - 1) * vary.cents : 0;
    const delayS = (layer.delayS ?? 0) + (opts.delayS ?? 0);
    const v: GaVoice = {
      v: nextId(c, 'v'),
      inst: inst.id,
      asset,
      layer: layer.id,
      bus,
      priority: def.priority,
      protected: !!def.protected,
      born: c.s.t,
      loop: def.kind === 'loop',
      base: lin(gainDb),
      rate: Math.pow(2, cents / 1200),
      state: here.inRange && !noVoice ? 'requested' : 'virtual',
      delayS,
    };
    if (noVoice) v.waiting = true;
    made.push(v);
    c.s.voices.push(v);
    if (v.state !== 'virtual') seat(c.s, v);
    inst.chose.push(asset);
    const take = list.length > 1 ? ` take ${idx + 1} of ${list.length}` : '';
    const late = delayS ? `, ${round(delayS, 2)} s later` : '';
    if (v.state === 'virtual') {
      if (!virtualSaid) {
        log(c, 'state', noVoice ? `${def.label} has no voice yet: it WAITS (tracked, not played) and plays when a voice is free` : `${def.label} is out of range: VIRTUAL (tracked, not played)`, { inst: inst.id, owner, bus });
      }
      virtualSaid = true;
      continue;
    }
    // a take chosen for this voice by something other than the container
    // (the language, the door's direction) is named by its FILE, so the two
    // choices read differently in the log (walk audit W2-16)
    const named = event in GA_LINES || (event === 'door_open' && layer.id === 'door');
    const file = named ? ` · ${record.file}` : '';
    const unheard = c.s.soundOn ? '' : ' (not heard: sound is off)';
    const text = `${def.label} · ${layer.id}${take}${late}${file} → ${GA_BUS_NAME[bus]} bus${unheard}`;
    const last = c.s.log[c.s.log.length - 1];
    if (opts.ambient && last && last.kind === 'start' && last.owner === owner && inst.quiet) {
      const count = (last.count ?? 1) + 1;
      c.s.log[c.s.log.length - 1] = { ...last, t: round(c.s.t, 2), text: `${text} · ${count} calls so far`, inst: inst.id, count };
    } else log(c, 'start', text, { inst: inst.id, owner, bus });
    fact(c, `take:${event}:${surface ?? ''}:${asset}`);
    // the takes strip: what the container chose, and the variation it was given
    const takes = c.s.recentTakes ?? [];
    takes.push({
      n: (takes[takes.length - 1]?.n ?? 0) + 1,
      t: round(c.s.t, 2),
      owner,
      group: `${event}/${layer.id}${surface ? `/${surface}` : ''}`,
      take: idx + 1,
      of: list.length,
      pitchCents: round(cents, 1),
      gainDb: round(varyDb, 2),
    });
    if (takes.length > GA_TAKES_MAX) takes.splice(0, takes.length - GA_TAKES_MAX);
    c.s.recentTakes = takes;
  }
  // only the voices that are still held: nothing is started that was taken
  const held = made.filter((v) => c.s.voices.includes(v));
  if (!held.length) return null;
  c.s.inst.push(inst);
  for (const v of held) if (v.state !== 'virtual') sendStart(c, v, def, inst);
  fact(c, `inst:${event}`);
  if (event in GA_LINES) c.s.caption = { event, text: GA_LINES[event as keyof typeof GA_LINES][c.s.options.language].text };
  // any line recounts the duck: one routed to the wrong bus adds no owner,
  // but the line it interrupted may have been the last one (check walk I7)
  if (def.bus === 'dialogue') setDuckOwners(c);
  // the courtyard bed scatters bird calls for as long as it plays
  if (event === 'bed_yard' && c.s.birdAt == null) c.s.birdAt = c.s.t + birdGap(c);
  return inst;
}

/** The door's sound for the way it just moved: one event, two takes. Until
 *  the bank holds the closing take, the opening one stands for both. */
function postDoor(c: Ctx): void {
  const closing = !c.s.doorOpen;
  post(c, 'door_open', 'door', { ...PLACES.door }, { assetOverride: closing && gaAsset(GA_DOOR_CLOSE_ASSET) ? GA_DOOR_CLOSE_ASSET : undefined });
}

/* ── courtyard birds (their own random stream) ──────────────────────────── */

function randBird(c: Ctx): number {
  const keep = c.s.seed;
  c.s.seed = c.s.birdSeed ?? 1;
  const r = rand(c);
  c.s.birdSeed = c.s.seed;
  c.s.seed = keep;
  return r;
}
const birdGap = (c: Ctx): number => GA_BIRD_MIN_S + randBird(c) * (GA_BIRD_MAX_S - GA_BIRD_MIN_S);

/** One bird call somewhere in the courtyard: low priority, and never when
 *  the budget is full (it would take a voice from something that matters). */
function birdCall(c: Ctx): void {
  const s = c.s;
  if (!GA_BIRD_ASSETS.every((id) => gaAsset(id))) return;
  if (s.voiceLimit && sounding(s).length >= s.voiceLimit) {
    fact(c, 'birdSkipped');
    return;
  }
  const pos = { x: round(1 + randBird(c) * (WALL_X - 2), 2), y: round(1 + randBird(c) * (WORLD_H - 2), 2) };
  const keep = s.seed;
  s.seed = s.birdSeed ?? 1;
  post(c, 'bird', 'bird', pos, { ambient: true });
  s.birdSeed = s.seed;
  s.seed = keep;
}

/* ── the network (an action is sent, then it lands) ─────────────────────── */

function land(c: Ctx, f: GaNetFlight): void {
  const s = c.s;
  // a repeat: the same id was sent before, so it has already been handled
  const seen = !!f.again;
  if (seen && s.options.dedupe) {
    f.result = 'ignored';
    log(c, 'net', `Action ${f.id} ARRIVED AGAIN: it was already handled, so it is ignored`, {});
    fact(c, 'netDuplicateIgnored');
    return;
  }
  if (seen && f.to !== 'them') fact(c, 'netDoublePlayed');
  if (f.to === 'them') {
    f.result = 'other';
    log(c, 'net', `Action ${f.id} (${f.what}) ARRIVED: it is for the OTHER player only, so nothing plays here`, {});
    fact(c, 'netPrivateOther');
    return;
  }
  f.result = 'played';
  let what: string = f.what;
  if (f.what === 'door' && !seen) {
    // a NEW door action moves the door, as the door key does; a repeat
    // handled a second time plays the sound again and moves nothing (the
    // door is already where that action put it)
    s.doorOpen = !s.doorOpen;
    f.door = s.doorOpen ? 'opened' : 'closed';
    what = s.doorOpen ? 'door opens' : 'door closes';
    fact(c, s.doorOpen ? 'doorOpened' : 'doorClosed');
  }
  const scope = f.to === 'me' ? 'it is for THIS player only' : 'it happens in the world, so every player in range hears it';
  log(c, 'net', seen ? `Action ${f.id} (${what}) ARRIVED AGAIN and is handled a SECOND time: ${scope}` : `Action ${f.id} (${what}) ARRIVED: ${scope}`, {});
  fact(c, f.to === 'me' ? 'netPrivateMe' : 'netWorld');
  if (f.what === 'door') {
    postDoor(c);
    if (!seen) respatialize(c, 0.25);
  } else post(c, 'ui_confirm', 'game', null);
}

/** Everything whose time has come: network actions land, a bird calls. */
function due(c: Ctx): void {
  const s = c.s;
  if (s.netFlights?.length) {
    for (const f of s.netFlights) if (f.result === 'pending' && f.due <= s.t + 1e-9) land(c, f);
    // (the same small tolerance as landing: a wake at exactly due + KEEP must
    // drop it, or the clock is woken at the same instant for ever)
    s.netFlights = s.netFlights.filter((f) => f.result === 'pending' || s.t - f.due < GA_NET_KEEP_S - 1e-9);
  }
  if (s.birdAt != null) {
    if (!s.inst.some((i) => i.event === 'bed_yard')) s.birdAt = null;
    else if (s.t >= s.birdAt) {
      birdCall(c);
      s.birdAt = s.t + birdGap(c);
    }
  }
}

/** The listener or a source moved, or the door changed: re-place every
 *  positioned voice. A loop that leaves range goes virtual and comes back. */
function respatialize(c: Ctx, ramp = 0.06): void {
  const said = new Set<string>();
  for (const v of [...c.s.voices]) {
    const i = instOf(c.s, v.inst);
    if (!i) continue;
    const def = GA_EVENTS[i.event];
    if (!def.spatial) continue;
    const sh = speedShape(layerOf(def, v.layer), speedOf(c.s, i));
    const p = place(c.s, def, i.pos, v.base * sh.gain);
    if (!p.inRange && v.state !== 'virtual' && v.loop) {
      if (c.s.soundOn) c.cmds.push({ t: 'stop', v: v.v, fade: 0.05 });
      v.state = 'virtual';
      v.slot = undefined;
      if (!said.has(i.id)) log(c, 'state', `${def.label} left its maximum distance: VIRTUAL (tracked, not played)`, { inst: i.id, owner: i.owner });
      said.add(i.id);
      fact(c, 'virtual');
      continue;
    }
    // a loop the budget took waits for a free voice, not for distance
    if (v.stolen || v.waiting) continue;
    if (p.inRange && v.state === 'virtual') {
      if (!allocate(c, v.priority, def.label)) {
        // back in range but refused a voice: it waits for one
        v.waiting = true;
        continue;
      }
      v.state = 'requested';
      v.v = nextId(c, 'v');
      if (!said.has(i.id)) log(c, 'state', `${def.label} is back in range: played again`, { inst: i.id, owner: i.owner });
      said.add(i.id);
      sendStart(c, v, def, i);
      continue;
    }
    if (v.state === 'virtual' || !c.s.soundOn) continue;
    c.cmds.push({ t: 'set', v: v.v, gain: p.gain, pan: p.pan, pos: p.pos, lowpass: p.lowpass, rev: p.rev, ramp });
  }
}

/** The beds follow the listener's zone: one crossfade per crossing. The
 *  engine ramps each bed FROM WHERE IT IS: the record keeps that, so a
 *  crossing reversed half-way is drawn as it sounds (check N6). `before`
 *  = the listener's zone before this change. */
function syncBeds(c: Ctx, ramp: number, before?: GaZone): void {
  const zone = zoneAt(listenerOf(c.s));
  const s = c.s;
  if (s.inst.some((i) => i.event === 'bed_room' || i.event === 'bed_yard')) {
    const was = before ?? zone;
    const cur = (z: GaZone): number => (s.bedFade ? bedShareRec(s.bedFade, z, s.t) : was === z ? 1 : 0);
    const from = { room: cur('room'), yard: cur('yard') };
    const f = s.bedFade;
    const settled = !f || !(f.ramp > 0) || s.t >= f.at + f.ramp;
    const still = Math.abs(from.room - (zone === 'room' ? 1 : 0)) < 1e-12 && Math.abs(from.yard - (zone === 'yard' ? 1 : 0)) < 1e-12;
    if (!(settled && still && (!f || f.to === zone))) s.bedFade = { at: s.t, to: zone, ramp, from };
  }
  for (const [event, z] of [['bed_room', 'room'], ['bed_yard', 'yard']] as const) {
    for (const i of c.s.inst.filter((x) => x.event === event)) {
      for (const v of voicesOf(c.s, i.id)) {
        if (c.s.soundOn && v.state !== 'virtual') c.cmds.push({ t: 'set', v: v.v, gain: v.base * (zone === z ? 1 : 0), ramp });
      }
    }
  }
}
function startBeds(c: Ctx): void {
  post(c, 'bed_room', 'scene', null);
  post(c, 'bed_yard', 'scene', null);
  syncBeds(c, 0.02);
}

function musicGains(s: GaState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of MUSIC_LAYERS) out[l] = s.music.layers[l] ? 1 : 0;
  return out;
}
const musicUnit = (boundary: GaMusicBoundary): number => {
  const beat = 60 / MUSIC_BPM;
  return boundary === 'beat' ? beat : boundary === 'bar' ? beat * MUSIC_BEATS_PER_BAR : beat * MUSIC_BEATS_PER_BAR * MUSIC_BARS;
};
/** Ask the music to move to the current layer set, on the chosen boundary.
 *  A request still waiting is WITHDRAWN first: the latest wish wins. */
function requestMusic(c: Ctx, asked: string, cause: 'mood' | 'layer'): void {
  let what = asked;
  const m = c.s.music;
  if (!m.on) {
    // nothing is playing: the next START simply begins with these layers
    m.applied = { ...m.layers };
    return;
  }
  // WHAT REALLY CHANGES (bug test 2026-11-13, pages 12–22 B-14): a request
  // is measured against what SOUNDS now (`applied`), not against the mood's
  // full list. With DRIVE already sounding, ALERT reads "add PULSE"; a
  // request equal to what sounds withdraws the waiting change and queues
  // nothing.
  const added = MUSIC_LAYERS.filter((l) => m.layers[l] && !m.applied[l]);
  const removed = MUSIC_LAYERS.filter((l) => !m.layers[l] && m.applied[l]);
  const and = (ls: readonly string[]) => { const u = ls.map((l) => l.toUpperCase()); return u.length <= 1 ? u.join('') : `${u.slice(0, -1).join(', ')} and ${u[u.length - 1]}`; };
  if (cause === 'mood' && added.length && !removed.length) what = `add ${and(added)}`;
  else if (cause === 'mood' && removed.length && !added.length && !MUSIC_LAYERS.some((l) => l !== 'calm' && m.layers[l])) what = 'back to CALM only';
  else if (cause === 'mood' && removed.length && !added.length) what = `remove ${and(removed)}`;
  if (m.pending) {
    log(c, 'music', `The waiting change (${m.pending.what}) is WITHDRAWN: a newer one replaces it`, { bus: 'music' });
    fact(c, 'musicWithdrawn');
    if (c.s.soundOn) c.cmds.push({ t: 'music', op: 'cancel', req: m.pending.req });
    m.pending = null;
  }
  if (!added.length && !removed.length) {
    log(c, 'music', `${cap(what)}: that is what plays now, so nothing is queued`, { bus: 'music' });
    fact(c, 'musicNoChange');
    return;
  }
  const req = nextId(c, 'm');
  const boundary = c.s.options.musicBoundary;
  m.pending = { req, what, boundary, inS: null, due: null, cause };
  log(c, 'music', boundary === 'now' ? `${cap(what)}: asked for NOW, with no boundary to wait for` : `${cap(what)}: QUEUED for the next ${boundary}`, { bus: 'music' });
  fact(c, 'musicQueued');
  if (c.s.soundOn) c.cmds.push({ t: 'music', op: 'layers', req, at: boundary, gains: musicGains(c.s), ramp: boundary === 'now' ? 0.4 : 0.03 });
  else if (boundary === 'now') {
    m.pending = null;
    m.applied = { ...m.layers };
    log(c, 'music', `${cap(what)}: APPLIED immediately (not heard: sound is off)`, { bus: 'music' });
    fact(c, 'musicApplied');
  } else {
    // unheard, the request still WAITS for its boundary, counted in scene
    // time from the music's start; the conductor reports it applied then
    m.pending.inS = gaMusicWait(c.s, boundary);
    m.pending.due = c.s.t + m.pending.inS;
  }
}
/** Seconds from now to the first boundary of this kind that is at least
 *  `room` away, in scene time: the engine's own rule (its nextBoundary). */
function boundaryWait(s: GaState, boundary: GaMusicBoundary, room: number): number {
  if (boundary === 'now') return 0;
  const unit = musicUnit(boundary);
  const n = Math.ceil((s.t + room - s.music.t0) / unit - 1e-9);
  return s.music.t0 + n * unit - s.t;
}
/** Seconds from now to the boundary a layer change asked now lands on: the
 *  next one that is at least GA_MUSIC_MARGIN_S (0.06 s) away. */
export function gaMusicWait(s: GaState, boundary: GaMusicBoundary): number {
  return boundaryWait(s, boundary, GA_MUSIC_MARGIN_S);
}
/** The same for a stinger: its file begins GA_STINGER_LEAD_S before the
 *  line so that its HIT lands on the line, so it takes the first boundary
 *  at least 0.3725 s away (the margin plus the lead), exactly as the engine
 *  does. Heard or unheard, it lands on the same line. */
export function gaStingerWait(s: GaState, boundary: GaMusicBoundary): number {
  return boundaryWait(s, boundary, GA_MUSIC_MARGIN_S + GA_STINGER_LEAD_S);
}
function sendMusicStart(c: Ctx): void {
  c.cmds.push({
    t: 'music',
    op: 'start',
    bpm: MUSIC_BPM,
    beatsPerBar: MUSIC_BEATS_PER_BAR,
    barsPerPhrase: MUSIC_BARS,
    stems: MUSIC_LAYERS.map((l) => ({ id: l, buf: `mu_${l}`, gain: c.s.music.layers[l] ? 1 : 0 })),
  });
}
function sendStinger(c: Ctx, req: string, boundary: GaMusicBoundary): void {
  c.cmds.push({ t: 'music', op: 'stinger', req, at: boundary, buf: GA_STINGER_ASSET, gain: GA_STINGER_GAIN, lead: GA_STINGER_LEAD_S });
}
/** The stinger's boundary came: it BEGINS, and from here it is an instance
 *  on the music bus, shown in PLAYING, until the engine says it ended. */
function beginStinger(c: Ctx): void {
  const s = c.s;
  const st = s.music.stinger;
  if (!st) return;
  s.music.stinger = null;
  const def = GA_EVENTS.stinger;
  const inst: GaInstance = { id: nextId(c, 'i'), event: 'stinger', owner: 'music', pos: null, loop: false, born: s.t, chose: [GA_STINGER_ASSET] };
  s.inst.push(inst);
  s.voices.push({ v: st.req, inst: inst.id, asset: GA_STINGER_ASSET, layer: def.layers[0].id, bus: 'music', priority: def.priority, protected: false, born: s.t, loop: false, base: GA_STINGER_GAIN, rate: 1, state: 'playing', delayS: 0, music: true });
  log(c, 'music', `STINGER played ${BOUNDARY_LANDED[st.boundary]}${st.boundary === 'now' ? '' : ' (its hit lands on the line)'} → ${GA_BUS_NAME.music} bus${s.soundOn ? '' : ' (not heard: sound is off)'}`, { bus: 'music', inst: inst.id, owner: 'music' });
  fact(c, 'stingerPlayed');
  fact(c, 'inst:stinger');
}
/** The music stops (or everything does) while something waits for a
 *  boundary that will now never come. */
function withdrawWaiting(c: Ctx, why: string): void {
  const m = c.s.music;
  if (m.pending) {
    if (m.pending.cause === 'mood') {
      // the game state stands; the next START begins in it
      log(c, 'music', `The waiting change (${m.pending.what}) never landed: ${why}. MOOD is still ${c.s.mood.toUpperCase()}, so the next START begins with its layers`, { bus: 'music' });
    } else {
      m.layers = { ...m.applied };
      log(c, 'music', `The waiting change (${m.pending.what}) is WITHDRAWN: ${why}`, { bus: 'music' });
    }
    fact(c, 'musicWithdrawnByStop');
    m.pending = null;
  }
  if (m.stinger) {
    log(c, 'music', `The waiting STINGER is WITHDRAWN: ${why}`, { bus: 'music' });
    fact(c, 'stingerWithdrawn');
    m.stinger = null;
  }
}

/** Sound came on: tell the engine everything that is logically playing.
 *  LOOPS only: a line or a door that is part-way through unheard is not
 *  started again from its first sample (audit 2, F24); it ends unheard. */
function resync(c: Ctx): void {
  const s = c.s;
  // the level and the buses are SET, not ramped: the engine still holds what
  // it had before sound went off, and a ramp from there would be heard (and
  // could not be drawn: the model does not know that old value)
  syncMaster(c, 0);
  c.cmds.push({ t: 'mono', on: s.mono });
  c.cmds.push({ t: 'reverb', buf: 'ir_room', gain: 0.9 });
  syncBuses(c, 0);
  for (const v of s.voices) {
    const i = instOf(s, v.inst);
    if (!i || v.state === 'virtual' || !v.loop) continue;
    v.state = 'requested';
    sendStart(c, v, GA_EVENTS[i.event], i);
  }
  syncBeds(c, 0.02);
  if (!s.music.on) return;
  // the engine starts the music from its first bar, with the layers asked
  // for: a change that was waiting is in that start (audit 2, F23)
  s.music.t0 = s.t;
  sendMusicStart(c);
  if (s.music.pending) {
    log(c, 'music', `${cap(s.music.pending.what)}: APPLIED as sound came back (the music restarted with it)`, { bus: 'music' });
    // not `musicApplied`: it did not land on its boundary (check N12)
    fact(c, 'musicAppliedOnRestart');
    s.music.pending = null;
  }
  s.music.applied = { ...s.music.layers };
  if (s.music.stinger) {
    s.music.stinger.inS = null;
    s.music.stinger.due = null;
    sendStinger(c, s.music.stinger.req, s.music.stinger.boundary);
  }
}

/* ── the reducer ────────────────────────────────────────────────────────── */

export function gaReduce(prev: GaState, a: GaAction, now?: number): { state: GaState; cmds: GaCmd[] } {
  const c: Ctx = { s: clone(prev), cmds: [], holdDuck: false };
  const s = c.s;
  if (a.type === 'tick') s.t = Math.max(s.t, a.t);
  else if (now != null && now > s.t) s.t = now;
  // what the clock brings first (not into a scene that is being cleared)
  if (a.type !== 'enterPage' && a.type !== 'reset' && a.type !== 'stopAll') due(c);
  switch (a.type) {
    case 'tick':
      break;

    case 'sound':
      if (a.on === s.soundOn) break;
      s.soundOn = a.on;
      if (a.on) resync(c);
      else {
        // nothing is audible; one-shots are over, loops go on unheard
        for (const v of [...s.voices]) if (!v.loop) dropVoice(c, v, null);
        for (const i of [...s.inst]) endInstanceIfEmpty(c, i.id, 'SOUND was switched off');
        if (s.music.pending) {
          s.music.pending.inS = gaMusicWait(s, s.music.pending.boundary);
          s.music.pending.due = s.t + s.music.pending.inS;
        }
        if (s.music.stinger) {
          s.music.stinger.inS = gaStingerWait(s, s.music.stinger.boundary);
          s.music.stinger.due = s.t + s.music.stinger.inS;
        }
        for (const v of s.voices) if (v.state === 'requested') v.state = 'playing';
      }
      break;

    case 'step': {
      const ch = s.chars[a.who];
      const dx = a.dx ?? Math.sin((ch.facing * Math.PI) / 180) * 0.7;
      const dy = a.dy ?? -Math.cos((ch.facing * Math.PI) / 180) * 0.7;
      const zoneBefore = zoneAt(listenerOf(s));
      const to = walkResult(ch, { x: ch.x + dx, y: ch.y + dy }, s.doorOpen);
      const inPlace = Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9;
      const moved = Math.hypot(to.x - ch.x, to.y - ch.y) > 1e-6;
      if (!moved && !inPlace) {
        // no step was taken, so no foot touched the ground: say why the
        // press did nothing (walk audits W1 F01, W2-21)
        const who = a.who === 'player' ? 'YOU are' : 'The GUIDE is';
        const where = to.stopped === 'door' ? 'at the closed door' : to.stopped === 'wall' ? 'at the wall' : 'at the edge of the scene';
        logOnce(c, 'note', `${who} ${where}: no step was taken, so no footstep plays${to.stopped === 'door' ? '. Open the door to walk through' : to.stopped === 'wall' ? '. The way through is the door' : '. Turn to walk another way'}`, { owner: a.who });
        fact(c, 'stepBlocked');
        break;
      }
      ch.x = to.x;
      ch.y = to.y;
      const surface = surfaceOf(s, a.who);
      if (surface !== surfaceAt(ch)) fact(c, 'stepWrongSurface');
      log(c, 'trigger', `TRIGGER foot contact · ${gaOwnerName(a.who)} · SWITCH surface = ${surface}`, { owner: a.who });
      fact(c, `step:${a.who}:${surface}`);
      post(c, 'footstep', a.who, { x: ch.x, y: ch.y }, { surface });
      afterMove(c, zoneBefore);
      break;
    }
    case 'move': {
      const ch = s.chars[a.who];
      const zoneBefore = zoneAt(listenerOf(s));
      const to = walkResult(ch, { x: a.x, y: a.y }, s.doorOpen);
      if (to.stopped === 'door' || to.stopped === 'wall') {
        logOnce(c, 'note', `${a.who === 'player' ? 'YOU are' : 'The GUIDE is'} stopped ${to.stopped === 'door' ? 'by the closed door. Open the door to walk through' : 'by the wall. The way through is the door'}`, { owner: a.who });
      }
      ch.x = to.x;
      ch.y = to.y;
      afterMove(c, zoneBefore);
      break;
    }
    case 'face':
      s.chars[a.who].facing = ((a.facing % 360) + 360) % 360;
      if (a.who === 'player') fact(c, 'turned');
      respatialize(c);
      break;
    case 'listener': {
      if (s.listenerMode === a.mode) break;
      const zoneBefore = zoneAt(listenerOf(s));
      s.listenerMode = a.mode;
      log(c, 'state', a.mode === 'camera' ? 'LISTENER moved to the overhead camera' : 'LISTENER moved back to YOU', {});
      fact(c, `listener:${a.mode}`);
      respatialize(c, 0.2);
      syncBeds(c, 1.2, zoneBefore);
      break;
    }

    case 'door':
      s.doorOpen = !s.doorOpen;
      log(c, 'trigger', `TRIGGER door ${s.doorOpen ? 'opened' : 'closed'}`, { owner: 'door' });
      fact(c, s.doorOpen ? 'doorOpened' : 'doorClosed');
      postDoor(c);
      respatialize(c, 0.25);
      break;

    case 'post': {
      const owner = a.owner ?? 'game';
      const pos = owner === 'crate' ? { ...PLACES.crate } : owner === 'guide' ? { x: s.chars.guide.x, y: s.chars.guide.y } : null;
      const assetOverride = a.event in GA_LINES ? GA_LINES[a.event as keyof typeof GA_LINES][s.options.language].asset : undefined;
      post(c, a.event, owner, GA_EVENTS[a.event].spatial ? pos : null, { assetOverride });
      break;
    }

    case 'machine': {
      const m = s.machines.find((x) => x.id === a.id);
      if (!m || m.on === a.on) break;
      m.on = a.on;
      if (a.on) post(c, 'generator', m.id, { x: m.x, y: m.y });
      else {
        const i = s.inst.find((x) => x.event === 'generator' && x.owner === m.id);
        if (i) {
          log(c, 'trigger', `STOP ${GA_EVENTS.generator.name} on ${gaOwnerName(m.id)} (a fade, then the voices are released)`, { owner: m.id, inst: i.id });
          stopInstance(c, i, 0.35, 'stopped by the game');
          fact(c, 'machineStopped');
        }
      }
      break;
    }
    case 'speed': {
      const m = s.machines.find((x) => x.id === a.id);
      if (!m) break;
      const value = clamp01(a.value);
      if (value === m.speed) break;
      m.speed = value;
      const i = s.inst.find((x) => x.event === 'generator' && x.owner === m.id);
      const pctNow = `${Math.round(value * 100)}%`;
      const which = gaOwnerName(m.id);
      const text = i ? `PARAMETER speed = ${pctNow} on ${which}: the SAME instance ${i.id} changes, nothing restarts` : `PARAMETER speed = ${pctNow} on ${which} (it is not running)`;
      // one drag is a RUN of values: it is one line, updated, so the lines
      // around it (the START to count) stay on screen (walk audit W1 F07)
      const last = s.log[s.log.length - 1];
      if (last && last.kind === 'value' && last.owner === m.id && last.inst === i?.id) {
        const count = (last.count ?? 1) + 1;
        s.log[s.log.length - 1] = { ...last, t: round(s.t, 2), text: `${text} · ${count} changes`, count };
      } else log(c, 'value', text, { owner: m.id, inst: i?.id });
      if (i) {
        fact(c, 'speedWhilePlaying');
        fact(c, `speed:${m.id}`);
        for (const v of voicesOf(s, i.id)) {
          if (v.state === 'virtual' || !s.soundOn) continue;
          const def = GA_EVENTS.generator;
          const sh = speedShape(layerOf(def, v.layer), value);
          const p = place(s, def, i.pos, v.base * sh.gain);
          c.cmds.push({ t: 'set', v: v.v, gain: p.gain, rate: v.rate * sh.rate, ramp: 0.12 });
        }
      }
      break;
    }
    case 'addMachine': {
      if (s.machines.length >= 2) break;
      // the free place: generator 2 below, or generator 1 if it was removed
      const id = s.machines.some((m) => m.id === 'generator-2') ? 'generator-1' : 'generator-2';
      const at = id === 'generator-1' ? PLACES.generator : PLACES.generator2;
      // an orphan loop left under this id is this machine's sound again, at its speed
      const orphan = s.inst.find((x) => x.event === 'generator' && x.owner === id);
      s.machines.push({ id, x: at.x, y: at.y, on: !!orphan, speed: orphan?.speed ?? 0.4 });
      log(c, 'note', 'A second generator was placed in the workshop (the same event will serve both)', { owner: id });
      fact(c, 'machineAdded');
      break;
    }
    case 'removeMachine': {
      const m = s.machines.find((x) => x.id === a.id);
      if (!m || s.machines.length < 2) break;
      s.machines = s.machines.filter((x) => x !== m);
      const i = s.inst.find((x) => x.event === 'generator' && x.owner === m.id);
      const which = gaOwnerName(m.id);
      if (i && s.faults.orphanLoop) {
        i.speed = m.speed;
        log(c, 'failed', `${which} was removed but nothing stopped its loop: instance ${i.id} is an ORPHAN, still playing with no owner`, { inst: i.id, owner: m.id });
        fact(c, 'orphan');
      } else if (i) {
        log(c, 'trigger', `${which} removed: its instance ${i.id} is stopped and released with it`, { inst: i.id, owner: m.id });
        stopInstance(c, i, 0.2, 'its owner was removed');
        fact(c, 'cleanRemove');
      } else {
        log(c, 'note', `${which} removed (it was not running)`, { owner: m.id });
      }
      break;
    }

    case 'scene':
      if (a.on) {
        startBeds(c);
        post(c, 'fountain', 'fountain', { ...PLACES.fountain });
        fact(c, 'sceneOn');
      } else {
        for (const i of s.inst.filter((x) => x.event === 'bed_room' || x.event === 'bed_yard' || x.event === 'fountain')) stopInstance(c, i, 0.5, 'the scene was stopped');
        s.birdAt = null;
      }
      break;

    case 'alarm': {
      const i = s.inst.find((x) => x.event === 'alarm');
      if (a.on && !i) {
        post(c, 'alarm', 'generator-1', { ...PLACES.generator });
        fact(c, 'alarmOn');
      } else if (!a.on && i) stopInstance(c, i, 0.1, 'the alarm was cleared');
      break;
    }

    case 'mood':
      if (s.mood === a.mood) break;
      s.mood = a.mood;
      log(c, 'state', `MOOD = ${a.mood.toUpperCase()} (a global state: everything that reads it changes)`, {});
      fact(c, `mood:${a.mood}`);
      s.music.layers = a.mood === 'alert' ? { calm: true, pulse: true, drive: true } : { calm: true, pulse: false, drive: false };
      requestMusic(c, a.mood === 'alert' ? 'add PULSE and DRIVE' : 'back to CALM only', 'mood');
      break;
    case 'musicStart':
      if (s.music.on) break;
      s.music.on = true;
      s.music.t0 = s.t;
      s.music.applied = { ...s.music.layers };
      log(c, 'music', 'Three layers START together on one clock (those switched off play at zero level)', { bus: 'music' });
      fact(c, 'musicStarted');
      if (s.soundOn) sendMusicStart(c);
      break;
    case 'musicStop':
      if (!s.music.on) break;
      s.music.on = false;
      log(c, 'music', 'The music STOPS', { bus: 'music' });
      withdrawWaiting(c, 'the music stopped first');
      // a stinger that has begun stops with the music (the engine stops it too)
      for (const i of s.inst.filter((x) => x.event === 'stinger')) stopInstance(c, i, 0.4, 'the music stopped');
      if (s.soundOn) c.cmds.push({ t: 'music', op: 'stop', fade: 0.4 });
      break;
    case 'musicLayer':
      if (s.music.layers[a.layer] === a.on) break;
      s.music.layers[a.layer] = a.on;
      fact(c, `layer:${a.layer}:${a.on ? 'on' : 'off'}`);
      requestMusic(c, `${a.on ? 'add' : 'remove'} ${a.layer.toUpperCase()}`, 'layer');
      break;
    case 'stinger': {
      if (!s.music.on) {
        logOnce(c, 'note', 'STINGER ignored: the music is not playing, so there is no beat or bar for it to land on', { bus: 'music' });
        break;
      }
      // one stinger waits at a time: a second press before it lands is not a second stinger
      if (s.music.stinger) {
        logOnce(c, 'note', 'A STINGER is already waiting for its line: this request is ignored', { bus: 'music' });
        fact(c, 'stingerIgnored');
        break;
      }
      const req = nextId(c, 'm');
      const boundary = s.options.musicBoundary;
      s.music.stinger = { req, boundary, inS: null, due: null };
      log(c, 'music', boundary === 'now' ? 'STINGER asked for NOW, with no boundary to wait for' : `STINGER QUEUED for the next ${boundary}`, { bus: 'music' });
      fact(c, 'stinger');
      if (s.soundOn) sendStinger(c, req, boundary);
      else if (boundary === 'now') beginStinger(c);
      else {
        s.music.stinger.inS = gaStingerWait(s, boundary);
        s.music.stinger.due = s.t + s.music.stinger.inS;
      }
      break;
    }

    case 'bus': {
      const b = s.bus[a.bus];
      if (a.db != null) b.db = Math.max(-60, Math.min(6, a.db));
      if (a.mute != null) b.mute = a.mute;
      if (a.solo != null) b.solo = a.solo;
      // a true minus sign (bug test 2026-11-13, pages 12–22 B-15)
      const text = `BUS ${GA_BUS_NAME[a.bus]}: ${String(round(b.db, 1)).replace('-', '−')} dB${b.mute ? ', MUTED' : ''}${b.solo ? ', SOLO' : ''}`;
      // one fader drag is one line, updated
      const last = s.log[s.log.length - 1];
      if (a.db != null && a.mute == null && a.solo == null && last && last.kind === 'mix' && last.bus === a.bus && last.count != null) {
        s.log[s.log.length - 1] = { ...last, t: round(s.t, 2), text, count: last.count + 1 };
      } else log(c, 'mix', text, a.db != null && a.mute == null && a.solo == null ? { bus: a.bus, count: 1 } : { bus: a.bus });
      fact(c, `bus:${a.bus}`);
      if (a.solo) fact(c, `solo:${a.bus}`);
      syncBuses(c);
      break;
    }
    case 'master':
      s.master = clamp01(a.value);
      syncMaster(c, 0.05);
      break;
    case 'mono':
      if (s.mono === a.on) break;
      s.mono = a.on;
      // leaving mono, name what is really chosen now (walk audit W2-07)
      log(c, 'mix', a.on ? 'OUTPUT folded to MONO (both ears get the same signal)' : `OUTPUT no longer folded to mono: ${s.pan === 'hrtf' ? 'headphone 3D (binaural)' : 'stereo'} again`, {});
      fact(c, a.on ? 'monoOn' : 'monoOff');
      if (s.soundOn) c.cmds.push({ t: 'mono', on: a.on });
      break;
    case 'pan':
      if (s.pan === a.mode) break;
      s.pan = a.mode;
      log(c, 'mix', a.mode === 'hrtf' ? 'RENDERER: headphone 3D (binaural)' : 'RENDERER: stereo pan (left and right only)', {});
      fact(c, `pan:${a.mode}`);
      // the renderer is part of a voice's path. Every positioned voice that
      // is sounding MOVES to the new one without starting again: the engine
      // crossfades the two placements, a loop keeps its place and a one-shot
      // plays on (audit 2, F26). Nothing ends because of this.
      if (s.soundOn) {
        for (const v of s.voices) {
          const i = instOf(s, v.inst);
          if (!i || !GA_EVENTS[i.event].spatial || v.state === 'virtual' || v.music) continue;
          const def = GA_EVENTS[i.event];
          const p = place(s, def, i.pos, v.base * speedShape(layerOf(def, v.layer), speedOf(s, i)).gain);
          c.cmds.push({ t: 'set', v: v.v, mode: a.mode, pan: p.pan, pos: p.pos, ramp: 0.03 });
        }
      }
      break;
    case 'voiceLimit':
      s.voiceLimit = Math.max(0, Math.round(a.limit));
      {
        // protected voices are never taken, so the budget cannot be set
        // below the number of them sounding: the count never passes the limit
        const guarded = sounding(s).filter((v) => v.protected).length;
        if (s.voiceLimit && s.voiceLimit < guarded) {
          log(c, 'mix', `BUDGET: ${s.voiceLimit} asked, but ${guarded} protected ${guarded === 1 ? 'voice is' : 'voices are'} sounding. The budget stays at ${guarded}`, {});
          fact(c, 'limitHeldByProtected');
          s.voiceLimit = guarded;
        }
      }
      log(c, 'mix', s.voiceLimit ? `BUDGET: at most ${s.voiceLimit} ${s.voiceLimit === 1 ? 'voice' : 'voices'} may sound at the same time` : 'BUDGET: no voice limit', {});
      fact(c, `limit:${s.voiceLimit}`);
      // over the new limit: the least important, oldest voices go first
      while (s.voiceLimit && sounding(s).length > s.voiceLimit) {
        const order = sounding(s)
          .filter((v) => !v.protected)
          .sort((x, y) => x.priority - y.priority || x.born - y.born);
        if (!order.length) break;
        takeVoice(c, order[0], 'Over the budget:', ' gives up its voice', 'shed');
      }
      // the slots that remain are the first ones
      if (s.voiceLimit) for (const v of sounding(s)) if (v.slot != null && v.slot >= s.voiceLimit) seat(s, v);
      break;
    case 'burst': {
      fact(c, 'burst');
      log(c, 'trigger', `BURST: ${a.count} crate impacts are posted within ${GA_BURST_SPREAD_S} s (a busy moment)`, { owner: 'crate' });
      // the busy moment is the impacts themselves: no debris tails, so the
      // count the learner reads is exactly the count that was asked for.
      // They are spread over a third of a second, each with its own level
      // and pitch, as a busy moment is: twelve copies in one instant are
      // heard as ONE hit (audit 2, F28). Their natural ends are not logged.
      const debris = s.options.debris;
      s.options.debris = false;
      const alarmBefore = s.inst.some((i) => i.event === 'alarm');
      const lostBefore = (s.facts.stolen ?? 0) + (s.facts.refused ?? 0);
      for (let k = 0; k < a.count; k++) post(c, 'crate_impact', 'crate', { ...PLACES.crate }, { delayS: a.count > 1 ? round((GA_BURST_SPREAD_S * k) / (a.count - 1), 3) : 0, quiet: true });
      s.options.debris = debris;
      if (alarmBefore && s.inst.some((i) => i.event === 'alarm') && (s.facts.stolen ?? 0) + (s.facts.refused ?? 0) > lostBefore) fact(c, 'alarmSurvivedBurst');
      break;
    }

    case 'option': {
      const before = s.options;
      s.options = { ...before, ...a.patch };
      for (const k of Object.keys(a.patch) as (keyof GaOptions)[]) {
        if (s.options[k] === before[k]) continue;
        fact(c, `option:${k}:${String(s.options[k])}`);
        if (!a.quiet) log(c, 'mix', `SETTING ${OPTION_WORD[k]}: ${optionValueWord(k, s.options[k])}`, {});
        if (k === 'reverb' && s.options.reverb && !s.reverbAvailable && !a.quiet) log(c, 'note', 'REVERB cannot be heard on this device: it could not load the room reverb, so the workshop stays dry', {});
      }
      if (a.patch.duck != null || a.patch.reverb != null) {
        syncBuses(c);
        respatialize(c, 0.2);
      }
      if (a.patch.rawYardLoop != null && a.patch.rawYardLoop !== before.rawYardLoop) {
        const bed = s.inst.find((x) => x.event === 'bed_yard');
        if (bed) {
          stopInstance(c, bed, 0.2, 'the loop file was swapped');
          post(c, 'bed_yard', 'scene', null);
          syncBeds(c, 0.2);
        }
      }
      break;
    }
    case 'fault': {
      const was = s.faults;
      s.faults = { ...s.faults, ...a.patch };
      for (const k of Object.keys(a.patch) as (keyof GaFaults)[]) if (s.faults[k] !== was[k]) fact(c, `fault:${k}:${s.faults[k] ? 'on' : 'fixed'}`);
      if (a.patch.voWrongBus != null) setDuckOwners(c);
      break;
    }

    case 'net': {
      // SENT now; it takes effect when it ARRIVES (see `land`). Every rule
      // (the ID check, who it is for) is applied at arrival.
      const flights = s.netFlights ?? [];
      const again = s.netSeen.includes(a.id);
      if (!again) s.netSeen.push(a.id);
      flights.push({ n: (flights[flights.length - 1]?.n ?? 0) + 1, id: a.id, what: a.what, to: a.to, sent: round(s.t, 3), due: round(s.t + GA_NET_DELAY_S, 3), result: 'pending', again });
      s.netFlights = flights;
      log(c, 'net', `Action ${a.id} (${a.what}) SENT: it arrives in ${GA_NET_DELAY_S} s`, {});
      fact(c, 'netSent');
      break;
    }

    case 'enterPage': {
      // A PAGE OPENS ON A CLEAN SCENE (the DJ lab's rule: a screen change
      // stops the sound and each screen starts from its own setup). Everyone
      // is at the start position, the door is closed, one generator is off,
      // nothing is playing, the game is calm, every setting is standard and
      // the log is empty. Kept: whether SOUND is on, the lab level, the scene
      // clock, what the device can do (the reverb), and the FACTS (they are
      // the record of what the learner has done; a page judges its goals
      // from the facts counted since it opened). No log line and no fact:
      // the learner did not do this.
      const fresh = gaInitial(s.seed);
      fresh.soundOn = s.soundOn;
      fresh.master = s.master;
      fresh.t = s.t;
      fresh.tPage = s.t;
      fresh.seq = s.seq;
      fresh.logN = s.logN;
      fresh.facts = { ...s.facts };
      fresh.reverbAvailable = s.reverbAvailable;
      fresh.audioOffset = s.audioOffset;
      // the buses ramp to flat FROM WHERE THEY ARE; the lab level stays
      fresh.busRamp = s.busRamp;
      fresh.masterRamp = s.masterRamp;
      const busy = s.inst.length > 0 || s.voices.length > 0 || s.music.on;
      const cmds: GaCmd[] = [];
      if (s.soundOn) {
        if (busy) cmds.push({ t: 'stopAll', fade: 0.12 });
        if (s.mono) cmds.push({ t: 'mono', on: false });
      }
      syncBuses({ s: fresh, cmds, holdDuck: false }, 0.1);
      return { state: fresh, cmds };
    }

    case 'engine':
      onEngine(c, a.evt);
      break;
    case 'expire': {
      const v = s.voices.find((x) => x.v === a.v);
      if (!v || v.loop) break;
      dropVoice(c, v, null);
      endInstanceIfEmpty(c, v.inst, 'it finished');
      break;
    }

    case 'stopAll':
      if (a.why === 'app') {
        // NOT a GAME line and not the learner's ■ STOP: the app stopped every
        // sound because the learner left it. The app-wide stop can arrive
        // twice for one leave (two listeners): said once (logOnce), and it
        // counts toward no goal (no `stopAll` / `stoppedSomething` fact).
        logOnce(c, 'stop', GA_APP_STOP_TEXT, {});
        fact(c, 'appStop');
      } else {
        log(c, 'trigger', 'STOP ALL: every instance is stopped and every waiting change is withdrawn', {});
        fact(c, 'stopAll');
        if (s.inst.length > 0 || s.music.on) fact(c, 'stoppedSomething');
      }
      withdrawWaiting(c, 'everything was stopped');
      s.voices = [];
      s.inst = [];
      s.duckOwners = 0;
      s.caption = null;
      s.music.on = false;
      s.birdAt = null;
      s.bedFade = null;
      // an action still on its way is dropped with everything else: nothing
      // may start to sound after ■ STOP. It was never handled, so its id is
      // not a known one.
      for (const f of s.netFlights ?? []) if (f.result === 'pending' && !f.again) s.netSeen = s.netSeen.filter((id) => id !== f.id);
      // one NET line for each action dropped on its way (bug test 2026-11-13,
      // pages 12–22 B-02: page 18's log said nothing). The flight itself
      // leaves `netFlights`: the page shows DROPPED from its disappearance.
      for (const f of s.netFlights ?? []) if (f.result === 'pending') log(c, 'net', `Action ${f.id} (${f.what}) DROPPED by STOP ALL: it never arrives`, {});
      s.netFlights = (s.netFlights ?? []).filter((f) => f.result !== 'pending');
      for (const m of s.machines) m.on = false;
      if (s.soundOn) c.cmds.push({ t: 'stopAll', fade: 0.04 });
      syncBuses(c, 0.05);
      break;
    case 'clearLog':
      s.log = [];
      break;
    case 'reset': {
      const fresh = gaInitial();
      fresh.soundOn = s.soundOn;
      fresh.master = s.master;
      fresh.t = s.t;
      fresh.tPage = s.t;
      // ids keep counting, so a late engine answer never matches a new voice
      fresh.seq = s.seq;
      fresh.logN = s.logN;
      fresh.reverbAvailable = s.reverbAvailable;
      fresh.audioOffset = s.audioOffset;
      fresh.busRamp = s.busRamp;
      fresh.masterRamp = s.masterRamp;
      const cmds: GaCmd[] = s.soundOn ? [{ t: 'stopAll', fade: 0.04 }] : [];
      const c2: Ctx = { s: fresh, cmds, holdDuck: false };
      if (s.soundOn) c2.cmds.push({ t: 'mono', on: false });
      syncBuses(c2, 0.05);
      return { state: fresh, cmds: c2.cmds };
    }
  }
  // a voice may have come free: a loop the budget took comes back
  reclaim(c);
  return { state: s, cmds: c.cmds };
}

function afterMove(c: Ctx, zoneBefore: GaZone): void {
  const s = c.s;
  respatialize(c);
  const zone = zoneAt(listenerOf(s));
  if (zone !== zoneBefore) {
    const beds = s.inst.some((i) => i.event === 'bed_room' || i.event === 'bed_yard');
    log(c, 'state', `ZONE: the listener entered the ${zone === 'room' ? 'workshop' : 'courtyard'}. ${beds ? 'ONE crossfade of the ambience beds' : 'No ambience bed is playing, so nothing fades'}`, {});
    fact(c, 'zoneCross');
    if (beds) fact(c, 'zoneCrossFade');
    syncBeds(c, GA_BED_FADE_S, zoneBefore);
  } else if (s.faults.bedPileUp && s.inst.some((i) => i.event === 'bed_room' || i.event === 'bed_yard')) {
    // the planted fault: every position update inside the zone starts the bed again
    const event: GaEventId = zone === 'room' ? 'bed_room' : 'bed_yard';
    const def = GA_EVENTS[event];
    const inst: GaInstance = { id: nextId(c, 'i'), event, owner: 'scene', pos: null, loop: true, born: s.t, chose: [def.layers[0].assets instanceof Array ? def.layers[0].assets[0] : ''] };
    if (allocate(c, def.priority, def.label)) {
      const v: GaVoice = { v: nextId(c, 'v'), inst: inst.id, asset: inst.chose[0], layer: 'bed', bus: def.bus, priority: def.priority, protected: false, born: s.t, loop: true, base: lin(def.layers[0].gainDb ?? 0), rate: 1, state: 'requested', delayS: 0 };
      s.voices.push(v);
      s.inst.push(inst);
      log(c, 'failed', `${def.label} was STARTED AGAIN by a position update: now ${s.inst.filter((i) => i.event === event).length} copies are stacked`, { inst: inst.id, bus: def.bus });
      fact(c, 'bedPileUp');
      sendStart(c, v, def, inst);
    }
  }
}

/** Keep the model's bar lines on the engine's: it reports that a boundary
 *  of this kind lies `inS` from now. The engine's `music started` answer has
 *  already put t0 on its clock; this only takes up the small difference a
 *  message's trip makes. A difference of half a beat or more cannot be told
 *  from a different line, so it is never "corrected" (check N5). */
function anchorMusic(s: GaState, inS: number, boundary: GaMusicBoundary): void {
  if (boundary === 'now' || !(inS >= 0)) return;
  const unit = musicUnit(boundary);
  const dueAt = s.t + inS;
  const n = Math.round((dueAt - s.music.t0) / unit);
  const t0 = dueAt - n * unit;
  if (Math.abs(t0 - s.music.t0) < musicUnit('beat') / 2) s.music.t0 = t0;
}

function onEngine(c: Ctx, e: GaEvt): void {
  const s = c.s;
  switch (e.e) {
    case 'started': {
      const v = s.voices.find((x) => x.v === e.v);
      // scene time minus the audio clock, as of this answer
      if (Number.isFinite(e.now)) s.audioOffset = s.t - e.now;
      if (v && v.state === 'requested') {
        v.state = 'playing';
        fact(c, 'heardStart');
      }
      break;
    }
    case 'clock':
      if (Number.isFinite(e.now)) s.audioOffset = s.t - e.now;
      break;
    case 'failed': {
      const why = e.why === 'suspended' ? 'audio is paused on this device' : e.why === 'missing-buffer' ? 'the sound was not loaded' : e.why;
      // the music's own refusals carry no voice id of the scene's
      if (e.v === 'music') {
        if (!s.music.on) break;
        log(c, 'failed', `The engine could NOT start the music: ${why}`, { bus: 'music' });
        fact(c, 'engineFailed');
        s.music.on = false;
        s.music.pending = null;
        s.music.stinger = null;
        break;
      }
      if (e.v.startsWith('music:') && e.v !== 'music:stinger') {
        // one music LAYER could not start: the others play on
        if (!s.music.on) break;
        log(c, 'failed', `The engine could NOT start the music layer ${e.v.slice(6).toUpperCase()}: ${why}`, { bus: 'music' });
        fact(c, 'engineFailed');
        break;
      }
      if (e.v === 'music:stinger') {
        if (!s.music.stinger) break;
        log(c, 'failed', `The engine could NOT play the stinger: ${why}`, { bus: 'music' });
        fact(c, 'engineFailed');
        s.music.stinger = null;
        break;
      }
      const v = s.voices.find((x) => x.v === e.v);
      // a voice that went VIRTUAL meanwhile asked the engine for nothing more:
      // a late refusal of its old start does not end it (check N11)
      if (!v || v.state === 'virtual') break;
      const i = instOf(s, v.inst);
      log(c, 'failed', `The engine could NOT start ${i ? voiceName(GA_EVENTS[i.event], v.layer) : 'a sound'}: ${why}`, { inst: v.inst });
      fact(c, 'engineFailed');
      dropVoice(c, v, null);
      endInstanceIfEmpty(c, v.inst, 'the engine refused it');
      // a generator that could not start at all is not running: its key
      // goes back to off so it can be tried again. (The BUDGET never does
      // this: a loop it takes stays on, virtual.)
      if (i && i.event === 'generator' && !instOf(s, i.id)) {
        const m = s.machines.find((x) => x.id === i.owner);
        if (m) m.on = false;
      }
      break;
    }
    case 'ended': {
      const v = s.voices.find((x) => x.v === e.v);
      // a VIRTUAL voice is one the model itself asked the engine to stop
      // and still tracks: the engine's confirmation of that stop is not the
      // end of the instance (audit 2, F2)
      if (!v || v.state === 'virtual') break;
      dropVoice(c, v, null);
      endInstanceIfEmpty(c, v.inst, e.why === 'natural' ? 'it finished' : 'stopped');
      break;
    }
    case 'music':
      if (e.what === 'started') {
        // the engine's own start time is where the bar lines are counted from:
        // a message's trip and a load of the stems are both in it (check N5)
        if (!s.music.on) break;
        const ahead = s.audioOffset != null && Number.isFinite(e.at) ? e.at + s.audioOffset - s.t : NaN;
        s.music.t0 = s.t + (ahead >= -0.25 && ahead <= 1 ? ahead : GA_MUSIC_START_AHEAD_S);
      } else if (e.what === 'queued') {
        if (s.music.pending?.req === e.req) {
          s.music.pending.inS = e.inS;
          s.music.pending.due = s.t + e.inS;
          anchorMusic(s, e.inS, s.music.pending.boundary);
        } else if (s.music.stinger?.req === e.req) {
          s.music.stinger.inS = e.inS;
          s.music.stinger.due = s.t + e.inS;
        }
      } else if (e.what === 'applied') {
        if (s.music.pending?.req === e.req) {
          log(c, 'music', `${cap(s.music.pending.what)}: APPLIED ${BOUNDARY_LANDED[s.music.pending.boundary]}${s.soundOn ? '' : ' (not heard: sound is off)'}`, { bus: 'music' });
          fact(c, 'musicApplied');
          s.music.pending = null;
          s.music.applied = { ...s.music.layers };
        } else if (s.music.stinger?.req === e.req) beginStinger(c);
      } else if (e.what === 'stinger') {
        // a stinger that had begun is over (by itself, or stopped with the music)
        const v = s.voices.find((x) => x.music && x.v === e.req);
        if (!v) break;
        dropVoice(c, v, null);
        endInstanceIfEmpty(c, v.inst, e.state === 'ended' ? 'it finished' : 'stopped');
      }
      // `stopped` is NOT taken as "the music is off": the model switches
      // `music.on` itself when IT asks for the stop (musicStop, stopAll).
      // A late `stopped` after a quick STOP then START, or one from a
      // restart, would otherwise leave music playing that the lab reads as
      // off and its key cannot stop (audit 2, F5).
      break;
    case 'reverb':
      if (e.ok === s.reverbAvailable) break;
      s.reverbAvailable = e.ok;
      if (!e.ok) {
        log(c, 'note', 'REVERB is not available on this device: it could not load the room reverb, so the workshop sounds dry', {});
        fact(c, 'reverbUnavailable');
      }
      respatialize(c, 0.2);
      break;
    default:
      break;
  }
}

/* ── read-outs the screens and the goals share ──────────────────────────── */

export const gaVoiceCount = (s: GaState): number => sounding(s).length;
/** Loops tracked without a voice: out of range, or taken by the budget. */
export const gaVirtualCount = (s: GaState): number => s.voices.filter((v) => v.state === 'virtual').length;
/** Of those, the loops the BUDGET took (they return when a voice is free). */
export const gaStolenCount = (s: GaState): number => s.voices.filter((v) => v.state === 'virtual' && v.stolen).length;
export const gaFact = (s: GaState, k: string): number => s.facts[k] ?? 0;
/** How many different facts start with this prefix (e.g. distinct takes). */
export const gaFactKinds = (s: GaState, prefix: string): number => Object.keys(s.facts).filter((k) => k.startsWith(prefix)).length;
export const gaPlaying = (s: GaState, event: GaEventId, owner?: string): boolean => s.inst.some((i) => i.event === event && (owner == null || i.owner === owner));
export const gaCopies = (s: GaState, event: GaEventId): number => s.inst.filter((i) => i.event === event).length;
/** False when this device could not load the room reverb: ROOM changes
 *  nothing that can be heard, and the page must say so. */
export const gaReverbAvailable = (s: GaState): boolean => s.reverbAvailable !== false;

/** How long an unheard one-shot is taken to last (seconds), by asset. The
 *  conductor ends unheard voices on this; a display can spread a one-shot's
 *  ring over it. */
export function gaNominalSeconds(asset: string): number {
  // a spoken line lasts as long as its OWN take: the lesson is that a
  // second-language take has a different length, heard or not
  if (asset.startsWith('vo_')) return gaSoundSeconds(asset) || 2.6;
  if (asset.startsWith('fs_')) return 0.4;
  if (asset === 'door') return 1.2;
  if (asset === GA_DOOR_CLOSE_ASSET) return 0.7;
  if (asset.startsWith('bird_')) return 0.6;
  // a stinger is an instance from its HIT on: the pickup before it is not counted
  if (asset === GA_STINGER_ASSET) return MUSIC_STINGER_S - GA_STINGER_LEAD_S;
  return 0.8;
}

/** The playback rate of a generator's hum at this SPEED (0 … 1): continuous
 *  over the whole lane, so a display can pace its rings by it. */
export function gaGeneratorRate(speed: number): number {
  return speedShape(layerOf(GA_EVENTS.generator, 'hum'), clamp01(speed)).rate;
}

/* ── computed levels, for the instrument strips ─────────────────────────────
 *
 * COMPUTED, not measured: these come from the model's own gain structure
 * (the layer and its variation, the speed shape, distance, the wall, the bed
 * crossfade, the bus fader, mute and solo, the duck, the lab LEVEL). 0 dB is
 * one voice at the level it was authored at; the loudness of the FILE itself
 * is not in them. Several voices add as unrelated sounds do (by power).
 * Changes that the engine ramps (the duck, a fade) are instant here, except
 * the beds' crossfade, which is drawn over its real length from the clock.
 * Pass `t` (scene seconds, gaNow()) to follow the clock between actions.
 */

/** The value a silent meter rests at. */
export const GA_METER_FLOOR_DB = -60;
const dbOf = (g: number): number => (g <= 0.001 ? GA_METER_FLOOR_DB : Math.max(GA_METER_FLOOR_DB, 20 * Math.log10(g)));

/** One bed's share (0 … 1) along a recorded crossfade, at `t`. */
function bedShareRec(f: NonNullable<GaState['bedFade']>, bz: GaZone, t: number): number {
  const target = f.to === bz ? 1 : 0;
  const from = f.from ? f.from[bz] : 1 - target;
  return rampAt({ from, to: target, at: f.at, ramp: f.ramp }, t);
}

/** A bus's gain at scene time `t`, as the engine has it: along the ramp it
 *  was last told (the duck's attack and release, a fader move, MUTE). */
export function gaBusGainAt(s: GaState, b: GaBus, t: number = s.t): number {
  const r = s.busRamp?.[b];
  return r && r.ramp > 0 && t < r.at + r.ramp ? rampAt(r, t) : busGain(s, b);
}
/** The duck's reduction on a bus at `t`, in dB (0 or negative), along its
 *  attack (GA_DUCK_ATTACK_S) and release (GA_DUCK_RELEASE_S). */
export function gaDuckDbAt(s: GaState, b: GaBus, t: number = s.t): number {
  const r = s.busRamp?.[b];
  if (!r || !(r.ramp > 0) || t >= r.at + r.ramp) return duckDbOf(s, b);
  const g = rampAt({ from: r.duckFrom, to: r.duckTo, at: r.at, ramp: r.ramp }, t);
  return g >= 1 ? 0 : 20 * Math.log10(Math.max(g, 1e-6));
}
/** The lab LEVEL at `t`, along its ramp. */
export function gaMasterAt(s: GaState, t: number = s.t): number {
  const r = s.masterRamp;
  return r && r.ramp > 0 && t < r.at + r.ramp ? rampAt(r, t) : s.master;
}

/** Is this voice sounding at `t`, as the engine has it? Not when it is
 *  virtual, not before a delayed layer begins, and with sound on not while
 *  it is only REQUESTED (the engine has not said `started`; the store may
 *  still be loading its file): the meters never show a request (check N8). */
const heardAt = (s: GaState, v: GaVoice, t: number): boolean => v.state !== 'virtual' && !(s.soundOn && v.state === 'requested') && t >= v.born + v.delayS;

/** A bed's share of its level while the two beds crossfade (0 … 1). */
function bedShare(s: GaState, event: GaEventId, t: number): number {
  if (event !== 'bed_room' && event !== 'bed_yard') return 1;
  const zone = zoneAt(listenerOf(s));
  const bz: GaZone = event === 'bed_room' ? 'room' : 'yard';
  const f = s.bedFade;
  if (!f || f.to !== zone) return bz === zone ? 1 : 0;
  return bedShareRec(f, bz, t);
}

export type GaVoiceOut = {
  /** Linear level at the output (see the note above). 0 = not sounding. */
  gain: number;
  db: number;
  /** What each side gets, linear, for the chosen output. */
  l: number;
  r: number;
  /** The stereo pan the engine is sent (−GA_PAN_WIDTH … +GA_PAN_WIDTH; 0 for a sound with no position). */
  pan: number;
  lowpassHz: number;
  /** The reverb send, 0 … 1. */
  rev: number;
};

/** One voice at the output, for the output the learner chose (stereo, 3D,
 *  mono). STEREO uses the engine's own equal-power pan law. For 3D the two
 *  sides are an ESTIMATE from the direction's left/right part (the real
 *  figures depend on the device's head data, and front/behind differ in
 *  tone, not in these two numbers). A sound with no position plays equally
 *  on both sides. */
export function gaVoiceOut(s: GaState, v: GaVoice, t: number = s.t): GaVoiceOut {
  const silent: GaVoiceOut = { gain: 0, db: GA_METER_FLOOR_DB, l: 0, r: 0, pan: 0, lowpassHz: 20000, rev: 0 };
  const i = instOf(s, v.inst);
  // virtual, only requested, or a delayed layer (the rattle, a BURST impact)
  // that has not begun yet
  if (!i || !heardAt(s, v, t)) return silent;
  const def = GA_EVENTS[i.event];
  const sh = speedShape(layerOf(def, v.layer), speedOf(s, i));
  const p = place(s, def, i.pos, v.base * sh.gain);
  const positioned = def.spatial && !!i.pos;
  // the engine trims a head-related (3D) voice by GA_HRTF_TRIM (F26)
  const trim = positioned && s.pan === 'hrtf' ? GA_HRTF_TRIM : 1;
  const gain = p.gain * trim * bedShare(s, i.event, t) * gaBusGainAt(s, v.bus, t) * gaMasterAt(s, t);
  const side = !positioned ? { l: 1, r: 1 } : s.pan === 'hrtf' ? panGains(p.pos[0] * GA_PAN_WIDTH) : panGains(p.pan);
  let l = gain * side.l;
  let r = gain * side.r;
  if (s.mono) l = r = (l + r) / 2;
  return { gain, db: dbOf(gain), l, r, pan: positioned ? p.pan : 0, lowpassHz: p.lowpass, rev: p.rev };
}

export type GaBusMeter = {
  bus: GaBus;
  /** The bus as the controls name it (GA_BUS_NAME). */
  name: string;
  /** Computed level of everything on this bus at the output, in dB;
   *  GA_METER_FLOOR_DB when silent. */
  db: number;
  /** The same, linear. */
  gain: number;
  /** The bus fader, in dB. */
  faderDb: number;
  /** The dialogue duck on this bus right now: 0, or a negative number of dB. */
  duckDb: number;
  /** Silenced by its own MUTE, by ANOTHER bus's SOLO, or not at all. */
  silenced: 'mute' | 'solo' | null;
  /** How many voices (and music layers) are sounding on it. */
  voices: number;
};

/** One meter per bus, in the mixer's order (GA_BUSES). The music bus is the
 *  layers that are SOUNDING (`music.applied`) plus a stinger that has begun. */
export function gaBusMeter(s: GaState, t: number = s.t): GaBusMeter[] {
  const pow: Record<string, number> = {};
  const n: Record<string, number> = {};
  for (const v of s.voices) {
    if (!heardAt(s, v, t)) continue;
    const o = gaVoiceOut(s, v, t);
    n[v.bus] = (n[v.bus] ?? 0) + 1;
    pow[v.bus] = (pow[v.bus] ?? 0) + o.gain * o.gain;
  }
  if (s.music.on) {
    const g = gaBusGainAt(s, 'music', t) * gaMasterAt(s, t);
    for (const l of MUSIC_LAYERS) {
      if (!(s.music.applied ?? s.music.layers)[l]) continue;
      n.music = (n.music ?? 0) + 1;
      pow.music = (pow.music ?? 0) + g * g;
    }
  }
  return GA_BUSES.map((b) => {
    const gain = Math.sqrt(pow[b] ?? 0);
    return { bus: b, name: GA_BUS_NAME[b], db: dbOf(gain), gain, faderDb: s.bus[b].db, duckDb: gaDuckDbAt(s, b, t), silenced: silencedBy(s, b), voices: n[b] ?? 0 };
  });
}

export type GaOutputLR = {
  /** What the device is sent: the mono fold wins over the renderer. */
  mode: 'stereo' | 'hrtf' | 'mono';
  /** Linear level of the whole mix on each side. */
  l: number;
  r: number;
  lDb: number;
  rDb: number;
};

/** The whole mix, left and right, for the chosen output (see gaVoiceOut for
 *  what each mode means). In MONO both sides are always equal. */
export function gaOutputLR(s: GaState, t: number = s.t): GaOutputLR {
  let pl = 0;
  let pr = 0;
  for (const v of s.voices) {
    const o = gaVoiceOut(s, v, t);
    pl += o.l * o.l;
    pr += o.r * o.r;
  }
  if (s.music.on) {
    const g = gaBusGainAt(s, 'music', t) * gaMasterAt(s, t);
    for (const layer of MUSIC_LAYERS) {
      if (!(s.music.applied ?? s.music.layers)[layer]) continue;
      pl += g * g;
      pr += g * g;
    }
  }
  const l = Math.sqrt(pl);
  const r = Math.sqrt(pr);
  return { mode: s.mono ? 'mono' : s.pan, l, r, lDb: dbOf(l), rDb: dbOf(r) };
}

export type GaVoiceSlot = {
  v: string;
  inst: string;
  event: GaEventId;
  /** What the learner would call it: the event's label, with the layer when
   *  the event plays several ("Generator · fan"). */
  name: string;
  owner: string;
  bus: GaBus;
  busName: string;
  priority: number;
  protected: boolean;
  loop: boolean;
  born: number;
  /** playing / requested = it holds a voice; virtual = a loop out of range;
   *  stolen = a loop whose voice the budget took (it returns when one is
   *  free). */
  state: 'playing' | 'requested' | 'virtual' | 'stolen' | 'waiting';
};
export type GaVoiceSlots = {
  /** The budget (0 = no limit). */
  limit: number;
  /** How many slots are in use (= gaVoiceCount). */
  used: number;
  /** The budget, slot by slot: the voice that holds each slot, or null for
   *  a free one. As long as the budget when there is one; otherwise as long
   *  as the highest slot in use. A voice keeps its slot while it sounds, and
   *  a new voice that steals takes the slot it freed. */
  slots: (GaVoiceSlot | null)[];
  /** Tracked WITHOUT a voice (virtual or stolen), most important first. */
  out: GaVoiceSlot[];
};

/** The voice budget as a display needs it. The music's layers and stinger
 *  are not in it (this scene leaves the music out of the count). */
export function gaVoiceSlots(s: GaState): GaVoiceSlots {
  const describe = (v: GaVoice): GaVoiceSlot | null => {
    const i = instOf(s, v.inst);
    if (!i) return null;
    const def = GA_EVENTS[i.event];
    return {
      v: v.v,
      inst: v.inst,
      event: i.event,
      name: voiceName(def, v.layer),
      owner: i.owner,
      bus: v.bus,
      busName: GA_BUS_NAME[v.bus],
      priority: v.priority,
      protected: v.protected,
      loop: v.loop,
      born: v.born,
      state: v.state === 'virtual' ? (v.stolen ? 'stolen' : v.waiting ? 'waiting' : 'virtual') : v.state,
    };
  };
  const live = sounding(s);
  const top = live.reduce((m, v) => Math.max(m, (v.slot ?? 0) + 1), 0);
  const slots: (GaVoiceSlot | null)[] = Array.from({ length: s.voiceLimit ? Math.max(s.voiceLimit, top) : top }, () => null);
  const loose: GaVoice[] = [];
  for (const v of live) {
    if (v.slot != null && slots[v.slot] === null) slots[v.slot] = describe(v);
    else loose.push(v);
  }
  // a voice with no slot of its own yet (an older state) takes the first free one
  for (const v of loose) {
    const k = slots.indexOf(null);
    if (k >= 0) slots[k] = describe(v);
    else slots.push(describe(v));
  }
  const out = s.voices
    .filter((v) => v.state === 'virtual' && !v.music)
    .sort((a, b) => b.priority - a.priority || a.born - b.born)
    .map(describe)
    .filter((x): x is GaVoiceSlot => x !== null);
  return { limit: s.voiceLimit, used: live.length, slots, out };
}

export type GaMusicClock = {
  on: boolean;
  beatS: number;
  barS: number;
  phraseS: number;
  /** Seconds into the four-bar phrase. */
  inPhraseS: number;
  /** 0 … 1 through the phrase (where a play line stands). */
  phase: number;
  /** The bar (0 … bars−1) and the beat in it (0 … beats−1) now. */
  bar: number;
  beat: number;
  bars: number;
  beatsPerBar: number;
};
/** Where the music is on its own clock (`music.t0`), at scene time `t`. */
export function gaMusicClock(s: GaState, t: number = s.t): GaMusicClock {
  const beatS = 60 / MUSIC_BPM;
  const barS = beatS * MUSIC_BEATS_PER_BAR;
  const phraseS = barS * MUSIC_BARS;
  // a few microseconds short of a line is ON the line: the clock's sums are
  // floating point, and the instant a change lands must read its own line
  let inPhraseS = s.music.on ? (((t - s.music.t0) % phraseS) + phraseS) % phraseS : 0;
  if (phraseS - inPhraseS < 1e-6) inPhraseS = 0;
  const bar = Math.min(MUSIC_BARS - 1, Math.floor(inPhraseS / barS + 1e-6));
  const beat = Math.min(MUSIC_BEATS_PER_BAR - 1, Math.max(0, Math.floor((inPhraseS - bar * barS) / beatS + 1e-6)));
  return { on: s.music.on, beatS, barS, phraseS, inPhraseS, phase: inPhraseS / phraseS, bar, beat, bars: MUSIC_BARS, beatsPerBar: MUSIC_BEATS_PER_BAR };
}

/** When the store should next move the clock by itself (scene seconds), or
 *  null: a network action lands, a landed one leaves the display, a bird
 *  calls. */
export function gaNextDue(s: GaState): number | null {
  let at: number | null = null;
  const take = (x: number) => {
    if (at == null || x < at) at = x;
  };
  for (const f of s.netFlights ?? []) take(f.result === 'pending' ? f.due : f.due + GA_NET_KEEP_S);
  if (s.birdAt != null) take(s.birdAt);
  return at;
}
