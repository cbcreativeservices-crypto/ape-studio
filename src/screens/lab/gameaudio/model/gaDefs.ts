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
import { FOOTSTEP_TAKES, GA_SURFACES, type GaSurface } from '../sounds/gaSynth.ts';
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
  | 'chat';

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
    atten: { min: 2, max: 13 },
    priority: 40,
    retrigger: 'ignore',
  },
  fountain: {
    id: 'fountain',
    name: 'Play_Fountain',
    label: 'Fountain',
    bus: 'ambience',
    kind: 'loop',
    layers: [{ id: 'water', assets: ['fountain'], select: 'fixed', gainDb: -3 }],
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
    layers: [{ id: 'bed', assets: ['amb_room'], select: 'fixed' }],
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
    layers: [{ id: 'bed', assets: ['amb_yard'], select: 'fixed' }],
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
    layers: [{ id: 'beeper', assets: ['alarm'], select: 'fixed', gainDb: -6 }],
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
