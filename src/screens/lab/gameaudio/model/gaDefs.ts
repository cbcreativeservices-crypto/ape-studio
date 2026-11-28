/**
 * gaDefs — the Game Audio lab's EVENTS: the authored behaviors the game asks
 * for by name. Pure data.
 *
 * In the glossary's words an "Audio event (game)" is the thing a game posts
 * and the audio tool answers; what it plays, how it varies, where it is
 * routed and how important it is are all decided here, ahead of time, by the
 * sound designer — never by the code that posts it. That separation is the
 * lab's first lesson, so the data is shaped the same way:
 *
 *   an EVENT     names a behavior                (door_open)
 *   its LAYERS   are the sounds it plays together (the door, then the rattle)
 *   a layer's ASSETS are its takes; `select` chooses among them
 *   the event's BUS is its mix category; its PRIORITY decides who keeps a
 *   voice when the budget runs out
 *
 * Tool-neutral on purpose. Where a real tool has a name for the idea the
 * lesson text gives it (a random container, a switch group, an RTPC); the
 * model never depends on one tool's structure.
 */
import type { GaBus } from '../engine/gaEngineProtocol.ts';
import { FOOTSTEP_TAKES, GA_SURFACES, MUSIC_STINGER_LEAD_S, type GaSurface } from '../sounds/gaSynth.ts';
import { footstepId } from '../sounds/gaSoundBank.ts';
import type { GaAttenuation } from './gaWorld.ts';

export type GaEventId =
  | 'footstep'
  | 'door_open'
  | 'generator'
  | 'fountain'
  | 'bed_room'
  | 'bed_yard'
  | 'crate_impact'
  | 'alarm'
  | 'ui_confirm'
  | 'ui_deny'
  | 'vo_greeting'
  | 'vo_warning'
  | 'chat'
  /** A courtyard spot sound the wind bed scatters (audit 2, F14). */
  | 'bird'
  /** The music's one-shot accent. It is posted by the music system when its
   *  boundary comes, never by a game event (audit 2, F3). */
  | 'stinger';

export type GaLayer = {
  id: string;
  /** The takes. A plain list, or one list per surface (a SWITCH chooses). */
  assets: readonly string[] | Readonly<Record<GaSurface, readonly string[]>>;
  /** fixed = always the first; random / sequence choose among the takes. */
  select: 'fixed' | 'random' | 'sequence';
  gainDb?: number;
  /** Seconds after the event (a secondary detail arrives late). */
  delayS?: number;
  /** An optional detail the lesson can switch off. */
  secondary?: 'rattle' | 'debris';
  /** This layer's level follows the owner's SPEED parameter (0 … 1). */
  speedGain?: readonly [number, number];
  /** This layer's playback rate follows SPEED. Rate changes pitch AND
   *  length together — the lesson says so. */
  speedRate?: readonly [number, number];
};

export type GaEventDef = {
  id: GaEventId;
  /** The name a sound designer would give it in a tool. */
  name: string;
  /** Plain words for the log and the inspector. */
  label: string;
  bus: GaBus;
  kind: 'one-shot' | 'loop';
  layers: readonly GaLayer[];
  /** Positioned in the scene (an emitter) or not (a bed, an interface cue). */
  spatial: boolean;
  atten?: GaAttenuation;
  /** 0 … 100. Higher keeps its voice when the budget is full. */
  priority: number;
  /** Never stolen, whatever else needs a voice. */
  protected?: boolean;
  /** Posting the event while this owner's instance is still playing:
   *  overlap = another instance; ignore = keep the one playing. */
  retrigger: 'overlap' | 'ignore';
  /** Takes vary a little in level and pitch each time (when variation is on). */
  vary?: { gainDb: number; cents: number };
};

/** The courtyard's spot sounds (audit 2, F14). While the courtyard bed plays
 *  the model posts one of these at a random place in the courtyard, at a
 *  random time every GA_BIRD_MIN_S … GA_BIRD_MAX_S scene seconds, on the
 *  ambience bus, and never when the voice budget is full. */
export const GA_BIRD_ASSETS = ['bird_1', 'bird_2', 'bird_3'] as const;
export const GA_BIRD_MIN_S = 4;
export const GA_BIRD_MAX_S = 9;

/** The door's two takes: `door` when it opens, `door_close` when it closes
 *  (audit 2, F13). One event, Play_Door, plays both. */
export const GA_DOOR_OPEN_ASSET = 'door';
export const GA_DOOR_CLOSE_ASSET = 'door_close';

/** The stinger file, and how far into it the HIT is: a half beat at 96 BPM
 *  (0.3125 s; the number is the file's own, sounds/gaSynth). The engine
 *  starts the file that much BEFORE the boundary, so the hit lands on the
 *  line (audit 2, F9). */
export const GA_STINGER_ASSET = 'mu_stinger';
export const GA_STINGER_LEAD_S = MUSIC_STINGER_LEAD_S;
export const GA_STINGER_GAIN = 0.9;

/** The engine starts the music this long after it is asked (gaEngineSource:
 *  `t0: now() + 0.12`; a test holds the two equal). The model's bar lines
 *  start from the engine's own answer when it has one (N5). */
export const GA_MUSIC_START_AHEAD_S = 0.12;

/** The engine never promises a boundary nearer than this: a change (or a
 *  stinger's pickup) takes the first line at least this far away. The model
 *  counts its own unheard waits by the same rule, so a change lands on the
 *  same line heard or not. */
export const GA_MUSIC_MARGIN_S = 0.06;

/** BURST (lesson 17) spreads its impacts over this long: a busy moment is
 *  many hits close together, not one file twelve times in one instant
 *  (audit 2, F28). */
export const GA_BURST_SPREAD_S = 0.3;

/** A network action is SENT now and takes effect this much later, on every
 *  machine (accuracy audit B5). The figure is this scene's choice, long
 *  enough to SEE on the network strip; it is not a typical real delay. Real
 *  delays vary from moment to moment and from player to player, and are
 *  often shorter than this. */
export const GA_NET_DELAY_S = 0.25;
/** How long a landed action stays in `netFlights` for the display. */
export const GA_NET_KEEP_S = 4;

/** The ambience beds cross-fade over this long when the listener changes
 *  zone (lesson 10 prints it). */
export const GA_BED_FADE_S = 1.5;

/** THE NAME OF EACH BUS as a learner knows it (the words on the mix page's
 *  controls). Every log line and every display prints these, never the ids
 *  (learning audit L-03, decision 11). */
export const GA_BUS_NAME: Readonly<Record<GaBus, string>> = {
  ambience: 'AMBIENCE',
  sfx: 'EFFECTS',
  dialogue: 'DIALOGUE',
  music: 'MUSIC',
  ui: 'INTERFACE',
  chat: 'CHAT',
};

/** THE NAME OF EACH GAME OBJECT as the controls and the scene label it. The
 *  ids (player, generator-1 …) stay inside the model. */
export const GA_OWNER_NAME: Readonly<Record<string, string>> = {
  player: 'YOU',
  guide: 'GUIDE',
  'generator-1': 'GENERATOR 1',
  'generator-2': 'GENERATOR 2',
  door: 'DOOR',
  crate: 'CRATE',
  fountain: 'FOUNTAIN',
  bird: 'BIRD',
  scene: 'SCENE',
  music: 'MUSIC',
  game: 'GAME',
};
export const gaOwnerName = (owner: string): string => GA_OWNER_NAME[owner] ?? owner.toUpperCase();

const takes = (s: GaSurface) => Array.from({ length: FOOTSTEP_TAKES }, (_, t) => footstepId(s, t));
const FOOTSTEP_ASSETS = Object.fromEntries(GA_SURFACES.map((s) => [s, takes(s)])) as Record<GaSurface, string[]>;

export const GA_EVENTS: Readonly<Record<GaEventId, GaEventDef>> = {
  footstep: {
    id: 'footstep',
    name: 'Play_Footstep',
    label: 'Footstep',
    bus: 'sfx',
    kind: 'one-shot',
    layers: [{ id: 'step', assets: FOOTSTEP_ASSETS, select: 'random' }],
    spatial: true,
    atten: { min: 1.5, max: 14 },
    priority: 30,
    retrigger: 'overlap',
    vary: { gainDb: 1.5, cents: 45 },
  },
  door_open: {
    id: 'door_open',
    name: 'Play_Door',
    label: 'Door',
    bus: 'sfx',
    kind: 'one-shot',
    layers: [
      { id: 'door', assets: ['door'], select: 'fixed' },
      { id: 'rattle', assets: ['door_rattle'], select: 'fixed', gainDb: -5, delayS: 1.0, secondary: 'rattle' },
    ],
    spatial: true,
    atten: { min: 2, max: 16 },
    priority: 50,
    retrigger: 'overlap',
  },
  generator: {
    id: 'generator',
    name: 'Play_Generator',
    label: 'Generator',
    bus: 'sfx',
    kind: 'loop',
    layers: [
      { id: 'hum', assets: ['gen_hum'], select: 'fixed', speedRate: [0.75, 1.45], speedGain: [0.7, 1] },
      { id: 'fan', assets: ['gen_air'], select: 'fixed', gainDb: -4, speedGain: [0.15, 1], speedRate: [0.9, 1.15] },
    ],
    spatial: true,
    // min 4 m (audit 2, F6: from where every page opens the generator was
    // 20 dB under a spoken line); max 12 m (walk audit F01: the west end of
    // the stone path must be PAST the maximum, so "walk until it is virtual"
    // can always be done)
    atten: { min: 4, max: 12 },
    priority: 40,
    retrigger: 'ignore',
  },
  fountain: {
    id: 'fountain',
    name: 'Play_Fountain',
    label: 'Fountain',
    bus: 'ambience',
    kind: 'loop',
    // 0 dB (was -3): the rebuilt fountain file is 3.6 dB quieter at the same
    // gain, so this keeps the fountain where it sat in the scene
    layers: [{ id: 'water', assets: ['fountain'], select: 'fixed', gainDb: 0 }],
    spatial: true,
    atten: { min: 1.5, max: 9 },
    priority: 20,
    retrigger: 'ignore',
  },
  bed_room: {
    id: 'bed_room',
    name: 'Play_Amb_Room',
    label: 'Room tone',
    bus: 'ambience',
    kind: 'loop',
    // a bed sits well under speech (audit 2, F12)
    layers: [{ id: 'bed', assets: ['amb_room'], select: 'fixed', gainDb: -12 }],
    spatial: false,
    priority: 10,
    retrigger: 'ignore',
  },
  bed_yard: {
    id: 'bed_yard',
    name: 'Play_Amb_Courtyard',
    label: 'Courtyard wind',
    bus: 'ambience',
    kind: 'loop',
    layers: [{ id: 'bed', assets: ['amb_yard'], select: 'fixed', gainDb: -8 }],
    spatial: false,
    priority: 10,
    retrigger: 'ignore',
  },
  crate_impact: {
    id: 'crate_impact',
    name: 'Play_Crate_Impact',
    label: 'Crate impact',
    bus: 'sfx',
    kind: 'one-shot',
    layers: [
      { id: 'impact', assets: ['impact'], select: 'fixed' },
      { id: 'debris', assets: ['debris'], select: 'fixed', gainDb: -4, delayS: 0.22, secondary: 'debris' },
    ],
    spatial: true,
    atten: { min: 2, max: 16 },
    priority: 45,
    retrigger: 'overlap',
    vary: { gainDb: 1, cents: 30 },
  },
  alarm: {
    id: 'alarm',
    name: 'Play_Overheat_Alarm',
    label: 'Overheat alarm',
    bus: 'sfx',
    kind: 'loop',
    // -11 dB (audit 2, F20): at -6 it was the hottest sound in the lab and
    // covered the warning line it goes with
    layers: [{ id: 'beeper', assets: ['alarm'], select: 'fixed', gainDb: -11 }],
    spatial: true,
    atten: { min: 3, max: 30 },
    priority: 90,
    protected: true,
    retrigger: 'ignore',
  },
  ui_confirm: {
    id: 'ui_confirm',
    name: 'Play_UI_Confirm',
    label: 'Interface: confirm',
    bus: 'ui',
    kind: 'one-shot',
    layers: [{ id: 'cue', assets: ['ui_confirm'], select: 'fixed', gainDb: -4 }],
    spatial: false,
    priority: 60,
    retrigger: 'overlap',
  },
  ui_deny: {
    id: 'ui_deny',
    name: 'Play_UI_Deny',
    label: 'Interface: not allowed',
    bus: 'ui',
    kind: 'one-shot',
    layers: [{ id: 'cue', assets: ['ui_deny'], select: 'fixed', gainDb: -4 }],
    spatial: false,
    priority: 60,
    retrigger: 'overlap',
  },
  vo_greeting: {
    id: 'vo_greeting',
    name: 'Play_VO_Guide_Greeting',
    label: 'Guide: greeting',
    bus: 'dialogue',
    kind: 'one-shot',
    layers: [{ id: 'line', assets: ['vo_greeting'], select: 'fixed' }],
    spatial: false,
    priority: 80,
    retrigger: 'ignore',
  },
  vo_warning: {
    id: 'vo_warning',
    name: 'Play_VO_Guide_Warning',
    label: 'Guide: warning',
    bus: 'dialogue',
    kind: 'one-shot',
    layers: [{ id: 'line', assets: ['vo_warning'], select: 'fixed' }],
    spatial: false,
    priority: 95,
    protected: true,
    retrigger: 'ignore',
  },
  chat: {
    id: 'chat',
    name: 'Chat_Remote_Player',
    label: 'Simulated player communication',
    bus: 'chat',
    kind: 'one-shot',
    layers: [{ id: 'voice', assets: ['vo_chat'], select: 'fixed', gainDb: -3 }],
    spatial: false,
    priority: 70,
    retrigger: 'ignore',
  },
  bird: {
    id: 'bird',
    name: 'Play_Courtyard_Bird',
    label: 'Bird',
    bus: 'ambience',
    kind: 'one-shot',
    layers: [{ id: 'call', assets: GA_BIRD_ASSETS, select: 'random' }],
    spatial: true,
    atten: { min: 3, max: 22 },
    // the least important sound in the scene: it never takes a voice
    priority: 5,
    retrigger: 'overlap',
    vary: { gainDb: 2, cents: 60 },
  },
  stinger: {
    id: 'stinger',
    name: 'Play_Music_Stinger',
    label: 'Stinger',
    bus: 'music',
    kind: 'one-shot',
    layers: [{ id: 'accent', assets: [GA_STINGER_ASSET], select: 'fixed' }],
    spatial: false,
    priority: 85,
    retrigger: 'overlap',
  },
};

/** The on-screen text of each spoken line (dialogue always has matching
 *  text). `en` and `es` are the two takes lesson 15 swaps: the SAME line,
 *  different lengths — text and logic must follow the asset, not a guessed
 *  duration. The audio is a wordless stand-in until the owner's recordings
 *  arrive (must-do D60). */
export const GA_LINES = {
  vo_greeting: {
    en: { asset: 'vo_greeting', text: 'The generator is in the workshop. Follow the stone path.' },
    es: { asset: 'vo_greeting_long', text: 'El generador está en el taller. Sigue el camino de piedra.' },
  },
  vo_warning: {
    en: { asset: 'vo_warning', text: 'Warning: the generator is overheating.' },
    es: { asset: 'vo_warning_long', text: 'Atención: el generador se está sobrecalentando.' },
  },
} as const;
export type GaLanguage = 'en' | 'es';

/** What dialogue turns down while it speaks (event-driven ducking: the DUCK
 *  starts when a line starts and ends when the last line ends — it does not
 *  listen to the audio's level, and the lab says so). */
export const GA_DUCK_DB: Readonly<Partial<Record<GaBus, number>>> = { music: -10, ambience: -8, sfx: -5 };
export const GA_DUCK_ATTACK_S = 0.12;
export const GA_DUCK_RELEASE_S = 0.45;
