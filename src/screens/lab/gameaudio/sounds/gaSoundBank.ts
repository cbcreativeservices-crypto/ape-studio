/**
 * gaSoundBank — the Game Audio lab's ASSET RECORDS and the lazy builder that
 * turns a record into samples. Pure TypeScript.
 *
 * An asset record is what a game team would call the sound file's entry in
 * the project: an id, what it is, how long, how many channels, and where it
 * came from. Lesson 6 ("From source to game build") shows these records to
 * the learner, so they are real data, not decoration.
 *
 * PROVENANCE. Every asset here is `made: 'app'` — synthesised by sounds/
 * gaSynth.ts, original to this app, no third-party recording, nothing to
 * license. When the owner's own recordings replace one, its record changes to
 * `made: 'recorded'` with the take's details (docs/labs/gameaudio/SOURCES.md
 * keeps the register).
 *
 * Samples are built on FIRST USE and cached: a page asks for the handful it
 * plays, so a phone never synthesises the whole bank up front.
 */
import {
  ALARM_S,
  AMB_ROOM_S,
  AMB_YARD_S,
  FOOTSTEP_TAKES,
  FOUNTAIN_S,
  GA_SURFACES,
  GEN_AIR_S,
  GEN_HUM_S,
  MUSIC_LAYERS,
  MUSIC_LOOP_S,
  alarm,
  ambienceRoom,
  ambienceYard,
  ambienceYardUnprepared,
  crateDebris,
  crateImpact,
  door,
  doorRattle,
  footstep,
  fountain,
  generatorAir,
  generatorHum,
  musicLayer,
  musicStinger,
  roomImpulse,
  uiConfirm,
  uiDeny,
  voiceLine,
  type GaSound,
  type GaSurface,
} from './gaSynth.ts';

export type GaAssetRole = 'one-shot' | 'loop' | 'music layer' | 'impulse response';

export type GaAsset = {
  id: string;
  /** What a sound designer would name the file. */
  file: string;
  /** Plain words: what the learner hears. */
  label: string;
  role: GaAssetRole;
  /** Exact loop length in seconds (loops and music layers only). */
  loopS?: number;
  made: 'app';
  build: () => GaSound;
};

const A = (id: string, file: string, label: string, role: GaAssetRole, build: () => GaSound, loopS?: number): GaAsset => ({
  id,
  file,
  label,
  role,
  loopS,
  made: 'app',
  build,
});

export const footstepId = (surface: GaSurface, take: number): string => `fs_${surface}_${take + 1}`;

const SURFACE_WORD: Record<GaSurface, string> = { wood: 'wood floor', stone: 'stone path', gravel: 'gravel' };

const FOOTSTEPS: GaAsset[] = GA_SURFACES.flatMap((s) =>
  Array.from({ length: FOOTSTEP_TAKES }, (_, t) =>
    A(footstepId(s, t), `footstep_${s}_0${t + 1}.wav`, `Footstep on ${SURFACE_WORD[s]}, take ${t + 1}`, 'one-shot', () => footstep(s, t)),
  ),
);

export const GA_ASSETS: readonly GaAsset[] = [
  ...FOOTSTEPS,
  A('door', 'door_open.wav', 'Door: latch, hinge, thud', 'one-shot', door),
  A('door_rattle', 'door_latch_rattle.wav', 'Loose latch settling', 'one-shot', doorRattle),
  A('gen_hum', 'generator_hum_loop.wav', 'Generator hum', 'loop', generatorHum, GEN_HUM_S),
  A('gen_air', 'generator_fan_loop.wav', 'Generator cooling fan', 'loop', generatorAir, GEN_AIR_S),
  A('fountain', 'fountain_loop.wav', 'Fountain', 'loop', fountain, FOUNTAIN_S),
  A('amb_room', 'amb_room_tone_loop.wav', 'Room tone', 'loop', ambienceRoom, AMB_ROOM_S),
  A('amb_yard', 'amb_courtyard_wind_loop.wav', 'Courtyard wind and birds', 'loop', ambienceYard, AMB_YARD_S),
  A('amb_yard_raw', 'amb_courtyard_wind_RAW.wav', 'Courtyard wind, cut with no loop preparation', 'loop', ambienceYardUnprepared, AMB_YARD_S),
  A('impact', 'crate_impact.wav', 'Crate dropped', 'one-shot', crateImpact),
  A('debris', 'crate_debris.wav', 'Debris scatter', 'one-shot', crateDebris),
  A('alarm', 'generator_overheat_alarm_loop.wav', 'Overheat alarm', 'loop', alarm, ALARM_S),
  A('ui_confirm', 'ui_confirm.wav', 'Interface: confirm', 'one-shot', uiConfirm),
  A('ui_deny', 'ui_deny.wav', 'Interface: not allowed', 'one-shot', uiDeny),
  A('vo_greeting', 'vo_guide_greeting_EN.wav', 'Stand-in voice: the guide’s greeting', 'one-shot', () => voiceLine('greeting')),
  A('vo_greeting_long', 'vo_guide_greeting_ES.wav', 'Stand-in voice: the same line, a longer take', 'one-shot', () => voiceLine('greetingLong')),
  A('vo_warning', 'vo_guide_warning_EN.wav', 'Stand-in voice: a short warning', 'one-shot', () => voiceLine('warning')),
  A('vo_warning_long', 'vo_guide_warning_ES.wav', 'Stand-in voice: the same warning, a longer take', 'one-shot', () => voiceLine('warningLong')),
  A('vo_chat', 'chat_player_sim.wav', 'Simulated player communication', 'one-shot', () => voiceLine('chat')),
  ...MUSIC_LAYERS.map((l) => A(`mu_${l}`, `music_${l}_96bpm_4bar.wav`, `Music layer: ${l}`, 'music layer', () => musicLayer(l), MUSIC_LOOP_S)),
  A('mu_stinger', 'music_stinger.wav', 'Music stinger', 'one-shot', musicStinger),
  A('ir_room', 'ir_workshop_room.wav', 'Room reverb impulse', 'impulse response', roomImpulse),
];

const BY_ID = new Map(GA_ASSETS.map((a) => [a.id, a]));
export const gaAsset = (id: string): GaAsset | undefined => BY_ID.get(id);

const cache = new Map<string, GaSound>();

/** The samples of one asset (built once). Unknown id → null: a missing asset
 *  is a FAULT the lab reports, never a silent stand-in. */
export function gaSound(id: string): GaSound | null {
  const hit = cache.get(id);
  if (hit) return hit;
  const a = BY_ID.get(id);
  if (!a) return null;
  const s = a.build();
  cache.set(id, s);
  return s;
}

export const gaSoundSeconds = (id: string): number => {
  const s = gaSound(id);
  return s ? s.ch[0].length / s.sr : 0;
};

/** Decoded size in memory: samples × 4 bytes (Float32), every channel. This
 *  is the arithmetic lesson 17 shows — encoded file size is a different
 *  number, and an engine adds its own overhead. */
export const gaSoundBytes = (id: string): number => {
  const s = gaSound(id);
  return s ? s.ch.reduce((n, c) => n + c.length * 4, 0) : 0;
};

/** Drop every cached sample (the lab calls it on close). */
export function releaseGaSounds(): void {
  cache.clear();
}
