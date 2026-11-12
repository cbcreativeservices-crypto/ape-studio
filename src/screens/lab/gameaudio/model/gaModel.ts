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
 *                               on ONE machine's instance; CALM / ALERT is a
 *                               state for the whole game
 *   variation                   seeded choice among takes, no immediate
 *                               repeat when there are two or more, small
 *                               level and pitch differences
 *   distance, direction, wall   model/gaWorld
 *   zones                       the bed follows the LISTENER's zone with one
 *                               cross-fade per crossing
 *   the mix                     category buses; mute, solo; dialogue DUCKS
 *                               chosen buses while any line speaks (an
 *                               owner count, so overlapping lines hold it)
 *   the budget                  a voice limit with a stated rule (below)
 *   music                       layers asked for on a boundary; the latest
 *                               request wins and a withdrawn one never plays
 *   two players                 the same action delivered twice plays once
 *
 * THE VOICE RULE (deterministic, shown to the learner). At the limit a new
 * voice may take the place of the LEAST important voice sounding, the oldest
 * of those if several tie, provided that voice is not protected and is no
 * more important than the new one. If there is no such voice the NEW voice
 * is refused. Either way the count never passes the limit.
 *
 * SOUND OFF IS NOT A FAILURE. With sound off every request still makes its
 * instance and its log line, marked "not heard"; goals are judged from this
 * state, so a learner who cannot hear is never blocked. A sound the engine
 * REFUSED is a different line, with the engine's reason.
 */
import type { GaBus, GaCmd, GaEvt, GaMusicBoundary, GaPanMode } from '../engine/gaEngineProtocol.ts';
import { GA_BUSES } from '../engine/gaEngineProtocol.ts';
import { gaAsset } from '../sounds/gaSoundBank.ts';
import { MUSIC_BARS, MUSIC_BEATS_PER_BAR, MUSIC_BPM, MUSIC_LAYERS, type GaMusicLayer, type GaSurface } from '../sounds/gaSynth.ts';
import { GA_DUCK_ATTACK_S, GA_DUCK_DB, GA_DUCK_RELEASE_S, GA_EVENTS, GA_LINES, type GaEventDef, type GaEventId, type GaLanguage, type GaLayer } from './gaDefs.ts';
import {
  PLACES,
  START,
  WORLD_H,
  WORLD_W,
  attenuationGain,
  hrtfDirection,
  obstruction,
  stereoPan,
  surfaceAt,
  walkTo,
  zoneAt,
  type GaListener,
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
   *  out of range, tracked but not rendered. */
  state: 'requested' | 'playing' | 'virtual';
  delayS: number;
};

export type GaInstance = {
  id: string;
  event: GaEventId;
  owner: string;
  pos: GaPoint | null;
  loop: boolean;
  born: number;
  /** The take each layer chose, for the inspector. */
  chose: string[];
};

export type GaLogKind = 'trigger' | 'start' | 'stop' | 'value' | 'state' | 'refused' | 'failed' | 'mix' | 'music' | 'net' | 'note';
export type GaLogEntry = {
  n: number;
  /** Logical seconds since the scene started. */
  t: number;
  kind: GaLogKind;
  text: string;
  owner?: string;
  inst?: string;
  bus?: GaBus;
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
    /** Scene time the music started (the bar lines are counted from it). */
    t0: number;
    layers: Record<GaMusicLayer, boolean>;
    pending: { req: string; what: string; boundary: GaMusicBoundary; inS: number | null } | null;
  };
  /** Network action ids already handled. */
  netSeen: string[];
  /** The line on screen (dialogue always carries its text). */
  caption: { event: GaEventId; text: string } | null;
  log: GaLogEntry[];
  logN: number;
  /** Counts of things that really happened — what goals are judged from. */
  facts: Record<string, number>;
};

export const GA_LOG_MAX = 120;

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
    music: { on: false, t0: 0, layers: { calm: true, pulse: false, drive: false }, pending: null },
    netSeen: [],
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
  | { type: 'net'; id: string; what: 'door' | 'alert'; to: 'world' | 'me' | 'them' }
  /** A page opened: put the SETTINGS back to the standard setup (see the
   *  reducer). What is playing, where people stand and the door stay. */
  | { type: 'enterPage' }
  | { type: 'engine'; evt: GaEvt }
  | { type: 'expire'; v: string }
  | { type: 'stopAll' }
  | { type: 'clearLog' }
  | { type: 'reset' }
  | { type: 'tick'; t: number };

/** A setting's name and value as the log prints them. */
const OPTION_WORD: Record<keyof GaOptions, string> = {
  variation: 'variation (use every take)',
  avoidRepeat: 'avoid repeat',
  doorRattle: 'door rattle layer',
  debris: 'debris layer',
  visualCue: 'visual cue for the alarm',
  reverb: 'workshop reverb',
  rawYardLoop: 'courtyard wind file with no loop preparation',
  dedupe: 'network id check',
  duck: 'ducking under dialogue',
  language: 'language',
  musicBoundary: 'music changes land on',
};
const optionValueWord = (v: GaOptions[keyof GaOptions]): string => (v === true ? 'ON' : v === false ? 'OFF' : v === 'en' ? 'English' : v === 'es' ? 'Spanish' : v === 'now' ? 'the request, with no waiting' : `the next ${String(v)}`);

/* ── helpers ────────────────────────────────────────────────────────────── */

const lin = (db: number) => Math.pow(10, db / 20);
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const round = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

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
    music: { ...s.music, layers: { ...s.music.layers }, pending: s.music.pending ? { ...s.music.pending } : null },
    netSeen: [...s.netSeen],
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

/** What one bus is at right now, linear: its fader, mute and solo, and the
 *  dialogue duck. */
export function busGain(s: GaState, b: GaBus): number {
  const st = s.bus[b];
  const anySolo = GA_BUSES.some((x) => s.bus[x].solo);
  if (st.mute || (anySolo && !st.solo)) return 0;
  const duck = s.options.duck && s.duckOwners > 0 ? (GA_DUCK_DB[b] ?? 0) : 0;
  return lin(st.db + duck);
}

type Placed = { gain: number; pan: number; pos: [number, number, number]; lowpass: number; rev: number; inRange: boolean };

/** Where a voice sits for the listener, and how loud. */
function place(s: GaState, def: GaEventDef, pos: GaPoint | null, base: number): Placed {
  if (!def.spatial || !pos || !def.atten) return { gain: base, pan: 0, pos: [0, 0, -1], lowpass: 20000, rev: 0, inRange: true };
  const L = listenerOf(s);
  const a = attenuationGain(gaListenDistance(L, pos), def.atten);
  const ob = obstruction(L, pos, s.doorOpen);
  const room = s.options.reverb && zoneAt(pos) === 'room' ? (zoneAt(L) === 'room' ? 0.28 : 0.12) : 0;
  return { gain: base * a * ob.gain, pan: stereoPan(L, pos), pos: hrtfDirection(L, pos), lowpass: ob.lowpassHz, rev: room, inRange: a > 0 };
}

/** How far a source is from the listener for LEVEL: along the ground. */
export const gaListenDistance = (L: GaListener, pos: GaPoint): number => Math.hypot(pos.x - L.x, pos.y - L.y);

const instOf = (s: GaState, id: string) => s.inst.find((i) => i.id === id);
const voicesOf = (s: GaState, inst: string) => s.voices.filter((v) => v.inst === inst);
const sounding = (s: GaState) => s.voices.filter((v) => v.state !== 'virtual');

/** The speed of the machine that owns an instance (0.4 if it has none). */
function speedOf(s: GaState, owner: string): number {
  return s.machines.find((m) => m.id === owner)?.speed ?? 0.4;
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
  return v.base * speedShape(layerOf(GA_EVENTS[i.event], v.layer), speedOf(s, i.owner)).gain * busGain(s, v.bus);
}

function sendStart(c: Ctx, v: GaVoice, def: GaEventDef, inst: GaInstance): void {
  const sh = speedShape(layerOf(def, v.layer), speedOf(c.s, inst.owner));
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
  if (fade != null && c.s.soundOn && v.state !== 'virtual') c.cmds.push({ t: 'stop', v: v.v, fade });
}

function endInstanceIfEmpty(c: Ctx, id: string, why: string): void {
  if (voicesOf(c.s, id).length) return;
  const i = instOf(c.s, id);
  if (!i) return;
  c.s.inst = c.s.inst.filter((x) => x !== i);
  const def = defOf(c.s, i.event);
  log(c, 'stop', `${def.label} ${i.id} ended (${why})`, { inst: i.id, owner: i.owner, bus: busOf(c.s, i.event) });
  if (c.s.caption?.event === i.event) c.s.caption = null;
  // a generator that lost its voices (stolen, over the budget) is not running:
  // the picture and the ENGINE key must not go on saying it is
  if (i.event === 'generator') {
    const m = c.s.machines.find((x) => x.id === i.owner);
    if (m) m.on = false;
  }
  if (def.bus === 'dialogue' && busOf(c.s, i.event) === 'dialogue' && !c.holdDuck) setDuckOwners(c);
}

function stopInstance(c: Ctx, i: GaInstance, fade: number, why: string): void {
  for (const v of voicesOf(c.s, i.id)) dropVoice(c, v, fade);
  endInstanceIfEmpty(c, i.id, why);
}

/** Recount the speaking dialogue lines and move the ducked buses if the
 *  count crossed zero. */
function setDuckOwners(c: Ctx): void {
  const n = c.s.inst.filter((i) => GA_EVENTS[i.event].bus === 'dialogue' && busOf(c.s, i.event) === 'dialogue').length;
  const was = c.s.duckOwners;
  c.s.duckOwners = n;
  if ((was > 0) === (n > 0)) return;
  if (c.s.options.duck) log(c, 'mix', n > 0 ? 'DUCK on: a line is speaking — music, ambience and effects turn down' : 'DUCK off: the last line ended — the mix comes back', { bus: 'dialogue' });
  if (n > 0 && c.s.options.duck) fact(c, 'duck');
  syncBuses(c, n > 0 ? GA_DUCK_ATTACK_S : GA_DUCK_RELEASE_S);
}

function syncBuses(c: Ctx, ramp = 0.05): void {
  if (!c.s.soundOn) return;
  for (const b of GA_BUSES) c.cmds.push({ t: 'bus', bus: b, gain: busGain(c.s, b), ramp });
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

/** Find room for one more voice, by THE VOICE RULE. */
function allocate(c: Ctx, priority: number, label: string): boolean {
  const limit = c.s.voiceLimit;
  const live = sounding(c.s);
  if (!limit || live.length < limit) return true;
  const open = live.filter((v) => !v.protected && v.priority <= priority);
  if (!open.length) {
    log(c, 'refused', `${label} REFUSED: ${limit === 1 ? 'the one voice is' : `all ${limit} voices are`} in use by sounds that are more important or protected`);
    fact(c, 'refused');
    return false;
  }
  open.sort((a, b) => a.priority - b.priority || a.born - b.born);
  const victim = open[0];
  const vi = instOf(c.s, victim.inst);
  log(c, 'stop', `voice STOLEN from ${vi ? GA_EVENTS[vi.event].label : victim.asset} (${victim.inst}) — the least important, oldest voice — to play ${label}`, {
    inst: victim.inst,
  });
  fact(c, 'stolen');
  dropVoice(c, victim, 0.02);
  endInstanceIfEmpty(c, victim.inst, 'its voice was stolen');
  return true;
}

/** POST AN EVENT. The game calls this; everything else is the audio side. */
function post(c: Ctx, event: GaEventId, owner: string, pos: GaPoint | null, opts: { assetOverride?: string; surface?: GaSurface } = {}): GaInstance | null {
  const def = defOf(c.s, event);
  const bus = busOf(c.s, event);
  log(c, 'trigger', `EVENT ${def.name} posted by ${owner}`, { owner, bus });
  fact(c, `post:${event}`);

  if (def.retrigger === 'ignore') {
    const already = c.s.inst.find((i) => i.event === event && i.owner === owner);
    if (already) {
      log(c, 'note', `${def.label} is already playing on ${owner}: the event is ignored, no second copy starts`, { inst: already.id, owner });
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
      log(c, 'stop', `${GA_EVENTS[speaking.event].label} INTERRUPTED by a more important line`, { inst: speaking.id, bus });
      fact(c, 'interrupted');
      c.holdDuck = true;
      stopInstance(c, speaking, 0.08, 'interrupted');
      c.holdDuck = false;
    }
  }

  if (def.bus === 'dialogue' && bus !== 'dialogue') fact(c, 'lineOnWrongBus');
  const inst: GaInstance = { id: nextId(c, 'i'), event, owner, pos, loop: def.kind === 'loop', born: c.s.t, chose: [] };
  const made: GaVoice[] = [];
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
    if (!gaAsset(asset)) {
      log(c, 'failed', `${def.label}: the file "${asset}" is NOT IN THE BUILD — the event was posted, but this layer cannot play`, { owner, bus });
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
    if (here.inRange && !allocate(c, def.priority, def.label)) continue;
    const vary = def.vary && c.s.options.variation ? def.vary : null;
    const gainDb = (layer.gainDb ?? 0) + (vary ? (rand(c) * 2 - 1) * vary.gainDb : 0);
    const cents = vary ? (rand(c) * 2 - 1) * vary.cents : 0;
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
      state: here.inRange ? 'requested' : 'virtual',
      delayS: layer.delayS ?? 0,
    };
    made.push(v);
    c.s.voices.push(v);
    inst.chose.push(asset);
    const take = list.length > 1 ? ` take ${idx + 1} of ${list.length}` : '';
    const late = layer.delayS ? `, ${layer.delayS} s later` : '';
    if (v.state === 'virtual') {
      log(c, 'state', `${def.label} ${layer.id} is out of range: VIRTUAL (tracked, not rendered)`, { inst: inst.id, owner, bus });
    } else {
      log(c, 'start', `${c.s.soundOn ? 'START' : 'START (not heard: sound is off)'} ${def.label} · ${layer.id}${take}${late} → ${bus} bus`, { inst: inst.id, owner, bus });
      fact(c, `take:${event}:${surface ?? ''}:${asset}`);
    }
  }
  if (!made.length) return null;
  c.s.inst.push(inst);
  for (const v of made) if (v.state !== 'virtual') sendStart(c, v, def, inst);
  fact(c, `inst:${event}`);
  if (event in GA_LINES) c.s.caption = { event, text: GA_LINES[event as keyof typeof GA_LINES][c.s.options.language].text };
  if (def.bus === 'dialogue' && bus === 'dialogue') setDuckOwners(c);
  return inst;
}

/** The listener or a source moved, or the door changed: re-place every
 *  positioned voice. A loop that leaves range goes virtual and comes back. */
function respatialize(c: Ctx, ramp = 0.06): void {
  for (const v of [...c.s.voices]) {
    const i = instOf(c.s, v.inst);
    if (!i) continue;
    const def = GA_EVENTS[i.event];
    if (!def.spatial) continue;
    const sh = speedShape(layerOf(def, v.layer), speedOf(c.s, i.owner));
    const p = place(c.s, def, i.pos, v.base * sh.gain);
    if (!p.inRange && v.state !== 'virtual' && v.loop) {
      if (c.s.soundOn) c.cmds.push({ t: 'stop', v: v.v, fade: 0.05 });
      v.state = 'virtual';
      log(c, 'state', `${def.label} left its maximum distance: VIRTUAL (tracked, not rendered)`, { inst: i.id, owner: i.owner });
      fact(c, 'virtual');
      continue;
    }
    if (p.inRange && v.state === 'virtual') {
      if (!allocate(c, v.priority, def.label)) continue;
      v.state = 'requested';
      v.v = nextId(c, 'v');
      log(c, 'state', `${def.label} is back in range: rendered again`, { inst: i.id, owner: i.owner });
      sendStart(c, v, def, i);
      continue;
    }
    if (v.state === 'virtual' || !c.s.soundOn) continue;
    c.cmds.push({ t: 'set', v: v.v, gain: p.gain, pan: p.pan, pos: p.pos, lowpass: p.lowpass, rev: p.rev, ramp });
  }
}

/** The beds follow the listener's zone: one cross-fade per crossing. */
function syncBeds(c: Ctx, ramp: number): void {
  const zone = zoneAt(listenerOf(c.s));
  for (const [event, z] of [['bed_room', 'room'], ['bed_yard', 'yard']] as const) {
    for (const i of c.s.inst.filter((x) => x.event === event)) {
      for (const v of voicesOf(c.s, i.id)) {
        if (c.s.soundOn) c.cmds.push({ t: 'set', v: v.v, gain: v.base * (zone === z ? 1 : 0), ramp });
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
/** Ask the music to move to the current layer set, on the chosen boundary.
 *  A request still waiting is WITHDRAWN first: the latest wish wins. */
function requestMusic(c: Ctx, what: string): void {
  if (!c.s.music.on) return;
  if (c.s.music.pending) {
    log(c, 'music', `music: the waiting change (${c.s.music.pending.what}) is WITHDRAWN — a newer one replaces it`);
    fact(c, 'musicWithdrawn');
    if (c.s.soundOn) c.cmds.push({ t: 'music', op: 'cancel', req: c.s.music.pending.req });
  }
  const req = nextId(c, 'm');
  const boundary = c.s.options.musicBoundary;
  c.s.music.pending = { req, what, boundary, inS: null };
  log(c, 'music', `music: ${what} — QUEUED for the next ${boundary === 'now' ? 'moment (no waiting)' : boundary}`);
  fact(c, 'musicQueued');
  if (c.s.soundOn) c.cmds.push({ t: 'music', op: 'layers', req, at: boundary, gains: musicGains(c.s), ramp: boundary === 'now' ? 0.4 : 0.03 });
  else if (boundary === 'now') {
    c.s.music.pending = null;
    log(c, 'music', `music: ${what} applied (not heard: sound is off)`);
    fact(c, 'musicApplied');
  } else {
    // unheard, the request still WAITS for its boundary, counted in scene
    // time from the music's start; the conductor reports it applied then
    c.s.music.pending.inS = gaMusicWait(c.s, boundary);
  }
}
/** Seconds from now to the next boundary of this kind, in scene time. */
export function gaMusicWait(s: GaState, boundary: GaMusicBoundary): number {
  if (boundary === 'now') return 0;
  const beat = 60 / MUSIC_BPM;
  const unit = boundary === 'beat' ? beat : boundary === 'bar' ? beat * MUSIC_BEATS_PER_BAR : beat * MUSIC_BEATS_PER_BAR * MUSIC_BARS;
  const into = (((s.t - s.music.t0) % unit) + unit) % unit;
  return unit - into;
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

/** Sound came on: tell the engine everything that is logically playing. */
function resync(c: Ctx): void {
  c.cmds.push({ t: 'master', gain: c.s.master, ramp: 0.02 });
  c.cmds.push({ t: 'mono', on: c.s.mono });
  c.cmds.push({ t: 'reverb', buf: 'ir_room', gain: 0.9 });
  syncBuses(c, 0.02);
  for (const v of c.s.voices) {
    const i = instOf(c.s, v.inst);
    if (!i || v.state === 'virtual') continue;
    v.state = 'requested';
    sendStart(c, v, GA_EVENTS[i.event], i);
  }
  syncBeds(c, 0.02);
  if (c.s.music.on) sendMusicStart(c);
}

/* ── the reducer ────────────────────────────────────────────────────────── */

export function gaReduce(prev: GaState, a: GaAction, now?: number): { state: GaState; cmds: GaCmd[] } {
  const c: Ctx = { s: clone(prev), cmds: [], holdDuck: false };
  const s = c.s;
  if (now != null && now > s.t) s.t = now;
  switch (a.type) {
    case 'tick':
      s.t = a.t;
      break;

    case 'sound':
      if (a.on === s.soundOn) break;
      s.soundOn = a.on;
      if (a.on) resync(c);
      else {
        // nothing is audible; one-shots are over, loops go on unheard
        for (const v of [...s.voices]) if (!v.loop) dropVoice(c, v, null);
        for (const i of [...s.inst]) endInstanceIfEmpty(c, i.id, 'sound went off');
        if (s.music.pending) s.music.pending.inS = gaMusicWait(s, s.music.pending.boundary);
        for (const v of s.voices) if (v.state === 'requested') v.state = 'playing';
      }
      break;

    case 'step': {
      const ch = s.chars[a.who];
      const dx = a.dx ?? Math.sin((ch.facing * Math.PI) / 180) * 0.7;
      const dy = a.dy ?? -Math.cos((ch.facing * Math.PI) / 180) * 0.7;
      const zoneBefore = zoneAt(listenerOf(s));
      const to = walkTo(ch, { x: ch.x + dx, y: ch.y + dy }, s.doorOpen);
      ch.x = to.x;
      ch.y = to.y;
      const surface = surfaceOf(s, a.who);
      if (surface !== surfaceAt(ch)) fact(c, 'stepWrongSurface');
      log(c, 'trigger', `TRIGGER foot contact · ${a.who} · SWITCH surface = ${surface}`, { owner: a.who });
      fact(c, `step:${a.who}:${surface}`);
      post(c, 'footstep', a.who, { x: ch.x, y: ch.y }, { surface });
      afterMove(c, zoneBefore);
      break;
    }
    case 'move': {
      const ch = s.chars[a.who];
      const zoneBefore = zoneAt(listenerOf(s));
      const to = walkTo(ch, { x: a.x, y: a.y }, s.doorOpen);
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
    case 'listener':
      if (s.listenerMode === a.mode) break;
      s.listenerMode = a.mode;
      log(c, 'state', a.mode === 'camera' ? 'LISTENER moved to the overhead camera' : 'LISTENER moved to the player', {});
      fact(c, `listener:${a.mode}`);
      respatialize(c, 0.2);
      syncBeds(c, 1.2);
      break;

    case 'door':
      s.doorOpen = !s.doorOpen;
      log(c, 'trigger', `TRIGGER door ${s.doorOpen ? 'opened' : 'closed'}`, { owner: 'door' });
      fact(c, s.doorOpen ? 'doorOpened' : 'doorClosed');
      post(c, 'door_open', 'door', { ...PLACES.door });
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
          log(c, 'trigger', `STOP ${GA_EVENTS.generator.name} on ${m.id} (a fade, then the voices are released)`, { owner: m.id, inst: i.id });
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
      // the object is named as every other log line names it (its game-object name)
      const which = m.id;
      log(c, 'value', i ? `PARAMETER speed = ${pctNow} on ${which} — the SAME instance ${i.id} changes; nothing restarts` : `PARAMETER speed = ${pctNow} on ${which} (it is not running)`, {
        owner: m.id,
        inst: i?.id,
      });
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
    case 'addMachine':
      if (s.machines.length >= 2) break;
      // an orphan loop left under this id is this machine's sound again
      s.machines.push({ id: 'generator-2', x: PLACES.generator2.x, y: PLACES.generator2.y, on: s.inst.some((x) => x.event === 'generator' && x.owner === 'generator-2'), speed: 0.4 });
      log(c, 'note', 'a second generator was placed in the workshop (the same event will serve both)', { owner: 'generator-2' });
      fact(c, 'machineAdded');
      break;
    case 'removeMachine': {
      const m = s.machines.find((x) => x.id === a.id);
      if (!m || s.machines.length < 2) break;
      s.machines = s.machines.filter((x) => x !== m);
      const i = s.inst.find((x) => x.event === 'generator' && x.owner === m.id);
      if (i && s.faults.orphanLoop) {
        log(c, 'failed', `${m.id} was removed but nothing stopped its loop: instance ${i.id} is an ORPHAN, still playing with no owner`, { inst: i.id, owner: m.id });
        fact(c, 'orphan');
      } else if (i) {
        log(c, 'trigger', `${m.id} removed: its instance ${i.id} is stopped and released with it`, { inst: i.id, owner: m.id });
        stopInstance(c, i, 0.2, 'its owner was removed');
        fact(c, 'cleanRemove');
      } else {
        log(c, 'note', `${m.id} removed (it was not running)`, { owner: m.id });
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
      log(c, 'state', `STATE mood = ${a.mood} (a global state: everything that reads it changes)`, {});
      fact(c, `mood:${a.mood}`);
      s.music.layers = a.mood === 'alert' ? { calm: true, pulse: true, drive: true } : { calm: true, pulse: false, drive: false };
      requestMusic(c, a.mood === 'alert' ? 'add PULSE and DRIVE' : 'back to CALM only');
      break;
    case 'musicStart':
      if (s.music.on) break;
      s.music.on = true;
      s.music.t0 = s.t;
      log(c, 'music', 'music: three layers START together on one clock (those switched off play at zero level)', { bus: 'music' });
      fact(c, 'musicStarted');
      if (s.soundOn) sendMusicStart(c);
      break;
    case 'musicStop':
      if (!s.music.on) break;
      s.music.on = false;
      s.music.pending = null;
      log(c, 'music', 'music: STOP', { bus: 'music' });
      if (s.soundOn) c.cmds.push({ t: 'music', op: 'stop', fade: 0.4 });
      break;
    case 'musicLayer':
      if (s.music.layers[a.layer] === a.on) break;
      s.music.layers[a.layer] = a.on;
      fact(c, `layer:${a.layer}:${a.on ? 'on' : 'off'}`);
      requestMusic(c, `${a.on ? 'add' : 'remove'} ${a.layer.toUpperCase()}`);
      break;
    case 'stinger': {
      if (!s.music.on) break;
      const req = nextId(c, 'm');
      log(c, 'music', `music: STINGER queued for the next ${s.options.musicBoundary === 'now' ? 'moment' : s.options.musicBoundary}`, { bus: 'music' });
      fact(c, 'stinger');
      if (s.soundOn) c.cmds.push({ t: 'music', op: 'stinger', req, at: s.options.musicBoundary, buf: 'mu_stinger', gain: 0.9 });
      break;
    }

    case 'bus': {
      const b = s.bus[a.bus];
      if (a.db != null) b.db = Math.max(-60, Math.min(6, a.db));
      if (a.mute != null) b.mute = a.mute;
      if (a.solo != null) b.solo = a.solo;
      log(c, 'mix', `BUS ${a.bus}: ${round(b.db, 1)} dB${b.mute ? ', MUTED' : ''}${b.solo ? ', SOLO' : ''}`, { bus: a.bus });
      fact(c, `bus:${a.bus}`);
      if (a.solo) fact(c, `solo:${a.bus}`);
      syncBuses(c);
      break;
    }
    case 'master':
      s.master = clamp01(a.value);
      if (s.soundOn) c.cmds.push({ t: 'master', gain: s.master, ramp: 0.05 });
      break;
    case 'mono':
      s.mono = a.on;
      log(c, 'mix', a.on ? 'OUTPUT folded to MONO (both ears get the same signal)' : 'OUTPUT back to stereo', {});
      fact(c, a.on ? 'monoOn' : 'monoOff');
      if (s.soundOn) c.cmds.push({ t: 'mono', on: a.on });
      break;
    case 'pan':
      if (s.pan === a.mode) break;
      s.pan = a.mode;
      log(c, 'mix', a.mode === 'hrtf' ? 'RENDERER: head-related 3D (for headphones)' : 'RENDERER: stereo pan (left and right only)', {});
      fact(c, `pan:${a.mode}`);
      // the panner is part of a voice's path: positioned voices restart on it
      for (const v of s.voices) {
        const i = instOf(s, v.inst);
        if (!i || !GA_EVENTS[i.event].spatial || v.state === 'virtual') continue;
        if (s.soundOn) c.cmds.push({ t: 'stop', v: v.v, fade: 0.03 });
        if (!v.loop) continue;
        v.v = nextId(c, 'v');
        v.state = 'requested';
        sendStart(c, v, GA_EVENTS[i.event], i);
      }
      s.voices = s.voices.filter((v) => v.loop || !GA_EVENTS[instOf(s, v.inst)?.event ?? 'ui_confirm'].spatial);
      for (const i of [...s.inst]) endInstanceIfEmpty(c, i.id, 'the renderer changed');
      break;
    case 'voiceLimit':
      s.voiceLimit = Math.max(0, Math.round(a.limit));
      {
        // protected voices are never taken, so the budget cannot be set
        // below the number of them sounding: the count never passes the limit
        const guarded = sounding(s).filter((v) => v.protected).length;
        if (s.voiceLimit && s.voiceLimit < guarded) {
          log(c, 'mix', `BUDGET: ${s.voiceLimit} asked, but ${guarded} protected ${guarded === 1 ? 'voice is' : 'voices are'} sounding — the budget stays at ${guarded}`, {});
          fact(c, 'limitHeldByProtected');
          s.voiceLimit = guarded;
        }
      }
      log(c, 'mix', s.voiceLimit ? `BUDGET: at most ${s.voiceLimit} ${s.voiceLimit === 1 ? 'voice' : 'voices'} may sound at once` : 'BUDGET: no voice limit', {});
      fact(c, `limit:${s.voiceLimit}`);
      // over the new limit: the least important, oldest voices go first
      while (s.voiceLimit && sounding(s).length > s.voiceLimit) {
        const order = sounding(s)
          .filter((v) => !v.protected)
          .sort((x, y) => x.priority - y.priority || x.born - y.born);
        if (!order.length) break;
        const v = order[0];
        log(c, 'stop', `over the budget: ${v.asset} (${v.inst}) is stopped`, { inst: v.inst });
        dropVoice(c, v, 0.03);
        endInstanceIfEmpty(c, v.inst, 'over the budget');
      }
      break;
    case 'burst': {
      fact(c, 'burst');
      log(c, 'trigger', `${a.count} crate impacts are posted at the same time (a busy moment)`, { owner: 'crate' });
      // the busy moment is the impacts themselves: no debris tails, so the
      // count the learner reads is exactly the count that was asked for
      const debris = s.options.debris;
      s.options.debris = false;
      const alarmBefore = s.inst.some((i) => i.event === 'alarm');
      const lostBefore = (s.facts.stolen ?? 0) + (s.facts.refused ?? 0);
      for (let k = 0; k < a.count; k++) post(c, 'crate_impact', 'crate', { ...PLACES.crate });
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
        if (!a.quiet) log(c, 'mix', `SETTING ${OPTION_WORD[k]}: ${optionValueWord(s.options[k])}`, {});
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
      const seen = s.netSeen.includes(a.id);
      if (seen && s.options.dedupe) {
        log(c, 'net', `network: action ${a.id} arrived AGAIN — already handled, ignored`, {});
        fact(c, 'netDuplicateIgnored');
        break;
      }
      if (seen && a.to !== 'them') fact(c, 'netDoublePlayed');
      if (!seen) s.netSeen.push(a.id);
      if (a.to === 'them') {
        log(c, 'net', `network: action ${a.id} (${a.what}) is for the OTHER player only — nothing plays here`, {});
        fact(c, 'netPrivateOther');
        break;
      }
      log(c, 'net', `network: action ${a.id} (${a.what}) ${a.to === 'me' ? 'is for THIS player only' : 'happens in the world: every player in range hears it'}${seen ? ' — handled a SECOND time' : ''}`, {});
      fact(c, a.to === 'me' ? 'netPrivateMe' : 'netWorld');
      if (a.what === 'door') {
        // a NEW door action moves the door, as the door key does; a repeat
        // handled a second time plays the sound again and moves nothing
        // (the door is already where that action put it)
        if (!seen) {
          s.doorOpen = !s.doorOpen;
          fact(c, s.doorOpen ? 'doorOpened' : 'doorClosed');
        }
        post(c, 'door_open', 'door', { ...PLACES.door });
        if (!seen) respatialize(c, 0.25);
      } else post(c, 'ui_confirm', 'game', null);
      break;
    }

    case 'enterPage': {
      // A PAGE OPENS ON A CLEAN SCENE (the DJ lab's rule: a screen change
      // stops the sound and each screen starts from its own setup). Everyone
      // is at the start position, the door is closed, one generator is off,
      // nothing is playing, the game is calm, every setting is standard and
      // the log is empty. Kept: whether SOUND is on, the lab level, the scene
      // clock, and the FACTS (they are the record of what the learner has
      // done; a page judges its goals from the facts counted since it
      // opened). No log line and no fact: the learner did not do this.
      const fresh = gaInitial(s.seed);
      fresh.soundOn = s.soundOn;
      fresh.master = s.master;
      fresh.t = s.t;
      fresh.seq = s.seq;
      fresh.logN = s.logN;
      fresh.facts = { ...s.facts };
      const busy = s.inst.length > 0 || s.voices.length > 0 || s.music.on;
      const cmds: GaCmd[] = [];
      if (s.soundOn) {
        if (busy) cmds.push({ t: 'stopAll', fade: 0.12 });
        if (s.mono) cmds.push({ t: 'mono', on: false });
        const c2: Ctx = { s: fresh, cmds, holdDuck: false };
        syncBuses(c2, 0.1);
      }
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
      log(c, 'trigger', 'STOP ALL: every instance is stopped and every waiting change is withdrawn', {});
      fact(c, 'stopAll');
      if (s.inst.length > 0 || s.music.on) fact(c, 'stoppedSomething');
      s.voices = [];
      s.inst = [];
      s.duckOwners = 0;
      s.caption = null;
      s.music.on = false;
      s.music.pending = null;
      for (const m of s.machines) m.on = false;
      if (s.soundOn) {
        c.cmds.push({ t: 'stopAll', fade: 0.04 });
        syncBuses(c, 0.05);
      }
      break;
    case 'clearLog':
      s.log = [];
      break;
    case 'reset': {
      const fresh = gaInitial();
      fresh.soundOn = s.soundOn;
      fresh.master = s.master;
      fresh.t = s.t;
      const cmds: GaCmd[] = s.soundOn ? [{ t: 'stopAll', fade: 0.04 }] : [];
      const c2: Ctx = { s: fresh, cmds, holdDuck: false };
      if (s.soundOn) {
        c2.cmds.push({ t: 'mono', on: false });
        syncBuses(c2, 0.05);
      }
      return { state: fresh, cmds: c2.cmds };
    }
  }
  return { state: s, cmds: c.cmds };
}

function afterMove(c: Ctx, zoneBefore: GaZone): void {
  const s = c.s;
  respatialize(c);
  const zone = zoneAt(listenerOf(s));
  if (zone !== zoneBefore) {
    const beds = s.inst.some((i) => i.event === 'bed_room' || i.event === 'bed_yard');
    log(c, 'state', `ZONE: the listener entered the ${zone === 'room' ? 'workshop' : 'courtyard'} — ${beds ? 'ONE cross-fade of the ambience beds' : 'no ambience bed is playing, so nothing fades'}`, {});
    fact(c, 'zoneCross');
    if (beds) fact(c, 'zoneCrossFade');
    syncBeds(c, 1.5);
  } else if (s.faults.bedPileUp && s.inst.some((i) => i.event === 'bed_room' || i.event === 'bed_yard')) {
    // the planted fault: every position update inside the zone starts the bed again
    const event: GaEventId = zone === 'room' ? 'bed_room' : 'bed_yard';
    const def = GA_EVENTS[event];
    const inst: GaInstance = { id: nextId(c, 'i'), event, owner: 'scene', pos: null, loop: true, born: s.t, chose: [def.layers[0].assets instanceof Array ? def.layers[0].assets[0] : ''] };
    if (allocate(c, def.priority, def.label)) {
      const v: GaVoice = { v: nextId(c, 'v'), inst: inst.id, asset: inst.chose[0], layer: 'bed', bus: def.bus, priority: def.priority, protected: false, born: s.t, loop: true, base: 1, rate: 1, state: 'requested', delayS: 0 };
      s.voices.push(v);
      s.inst.push(inst);
      log(c, 'failed', `${def.label} was STARTED AGAIN by a position update: now ${s.inst.filter((i) => i.event === event).length} copies are stacked`, { inst: inst.id, bus: def.bus });
      fact(c, 'bedPileUp');
      sendStart(c, v, def, inst);
    }
  }
}

function onEngine(c: Ctx, e: GaEvt): void {
  const s = c.s;
  switch (e.e) {
    case 'started': {
      const v = s.voices.find((x) => x.v === e.v);
      if (v && v.state === 'requested') v.state = 'playing';
      fact(c, 'heardStart');
      break;
    }
    case 'failed': {
      const v = s.voices.find((x) => x.v === e.v);
      if (!v) break;
      const i = instOf(s, v.inst);
      log(c, 'failed', `the engine could NOT start ${i ? GA_EVENTS[i.event].label : v.asset}: ${e.why === 'suspended' ? 'audio is paused on this device' : e.why === 'missing-buffer' ? 'the sound was not loaded' : e.why}`, { inst: v.inst });
      fact(c, 'engineFailed');
      dropVoice(c, v, null);
      endInstanceIfEmpty(c, v.inst, 'the engine refused it');
      break;
    }
    case 'ended': {
      const v = s.voices.find((x) => x.v === e.v);
      if (!v) break;
      dropVoice(c, v, null);
      endInstanceIfEmpty(c, v.inst, e.why === 'natural' ? 'it finished' : 'stopped');
      break;
    }
    case 'music':
      if (e.what === 'queued' && s.music.pending?.req === e.req) s.music.pending.inS = e.inS;
      else if (e.what === 'applied' && s.music.pending?.req === e.req) {
        log(c, 'music', `music: ${s.music.pending.what} — APPLIED exactly on the ${s.music.pending.boundary === 'now' ? 'request' : `${s.music.pending.boundary} line`}${s.soundOn ? '' : ' (not heard: sound is off)'}`, { bus: 'music' });
        fact(c, 'musicApplied');
        s.music.pending = null;
      } else if (e.what === 'stopped') {
        s.music.on = false;
        s.music.pending = null;
      }
      break;
    default:
      break;
  }
}

/* ── read-outs the screens and the goals share ──────────────────────────── */

export const gaVoiceCount = (s: GaState): number => sounding(s).length;
export const gaVirtualCount = (s: GaState): number => s.voices.length - sounding(s).length;
export const gaFact = (s: GaState, k: string): number => s.facts[k] ?? 0;
/** How many different facts start with this prefix (e.g. distinct takes). */
export const gaFactKinds = (s: GaState, prefix: string): number => Object.keys(s.facts).filter((k) => k.startsWith(prefix)).length;
export const gaPlaying = (s: GaState, event: GaEventId, owner?: string): boolean => s.inst.some((i) => i.event === event && (owner == null || i.owner === owner));
export const gaCopies = (s: GaState, event: GaEventId): number => s.inst.filter((i) => i.event === event).length;
