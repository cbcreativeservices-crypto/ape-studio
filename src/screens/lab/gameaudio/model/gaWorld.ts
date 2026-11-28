/**
 * gaWorld — the Game Audio lab's shared SCENE as numbers: a courtyard and a
 * workshop room seen from above, with everything the lessons need in it.
 * Pure TypeScript; the drawing (scene/) and the sound (model/gaModel) both
 * read these positions, so what the learner sees is where the sound is.
 *
 *   x → east (0 … 16 m)      y ↓ south (0 … 10 m)      plan view
 *
 *   ┌───────────── courtyard ─────────────┬──────── workshop ────────┐
 *   │  fountain            gravel         │          generator        │
 *   │                                     │                           │
 *   │ ═══════ stone path ═══════════════ door ══      wood floor     │
 *   │                                     │        guide              │
 *   │            crate     gravel         │          (second machine) │
 *   └─────────────────────────────────────┴───────────────────────────┘
 *
 * THE SPATIAL MODEL is a teaching model and the lab says so once:
 *   distance   level falls as 1/distance beyond MINIMUM DISTANCE and fades to
 *              silence at MAXIMUM DISTANCE (an "attenuation curve" an audio
 *              designer draws; real games choose their own curve per sound)
 *   direction  the angle from where the listener FACES sets a left/right
 *              pan. Two loudspeakers or plain stereo cannot place a sound in
 *              front versus behind — the lab shows that, it does not hide it
 *   the wall   a sound on the other side of the CLOSED door is turned down
 *              and low-passed: an authored treatment, not a simulation of
 *              how sound really passes a wall. The trade calls this
 *              OCCLUSION (a wall between source and listener). There is no
 *              line of sight here: only "different rooms and the door
 *              closed" is treated, wherever the listener stands
 */

export const WORLD_W = 16;
export const WORLD_H = 10;
/** The wall between courtyard and room, and the door in it. */
export const WALL_X = 9;
export const DOOR_Y0 = 4;
export const DOOR_Y1 = 6;
export const DOOR_POS = { x: WALL_X, y: (DOOR_Y0 + DOOR_Y1) / 2 } as const;

export type GaZone = 'yard' | 'room';
export type GaSurfaceId = 'wood' | 'stone' | 'gravel';
export type GaPoint = { x: number; y: number };

export const zoneAt = (p: GaPoint): GaZone => (p.x >= WALL_X ? 'room' : 'yard');

/** What is under a foot at this point: the room is a wood floor, a stone
 *  path crosses the courtyard to the door, the rest is gravel. */
export function surfaceAt(p: GaPoint): GaSurfaceId {
  if (p.x >= WALL_X) return 'wood';
  if (p.y >= DOOR_Y0 && p.y <= DOOR_Y1) return 'stone';
  return 'gravel';
}

export const SURFACE_NAME: Record<GaSurfaceId, string> = { wood: 'Wood floor', stone: 'Stone path', gravel: 'Gravel' };

/** Fixed things in the scene (the characters move; these do not). */
export const PLACES = {
  generator: { x: 13.6, y: 2.4 },
  generator2: { x: 13.6, y: 7.7 },
  fountain: { x: 3.0, y: 2.1 },
  crate: { x: 6.4, y: 8.0 },
  door: DOOR_POS,
} as const;

export const START = {
  player: { x: 5.2, y: 5.0, facing: 90 },
  guide: { x: 11.2, y: 7.9, facing: 270 },
} as const;

/** What held a walker back, if anything: the edge of the scene, the wall, or
 *  the doorway with the door closed. */
export type GaWalkStop = 'edge' | 'wall' | 'door' | null;

/** Keep a walker inside the scene and out of the wall (it passes only
 *  through the doorway, and only when the door is open), and say what
 *  stopped it. The wall outranks the edge when both did. */
export function walkResult(from: GaPoint, to: GaPoint, doorOpen: boolean): GaPoint & { stopped: GaWalkStop } {
  // 0.9 m from every edge: the figure and its ring stay inside the picture
  const x = Math.max(0.9, Math.min(WORLD_W - 0.9, to.x));
  const y = Math.max(0.9, Math.min(WORLD_H - 0.9, to.y));
  const edge: GaWalkStop = x !== to.x || y !== to.y ? 'edge' : null;
  const crosses = (from.x < WALL_X) !== (x < WALL_X);
  if (!crosses) return { x, y, stopped: edge };
  // where the straight path meets the wall
  const t = (WALL_X - from.x) / (x - from.x);
  const yAtWall = from.y + (y - from.y) * t;
  const throughDoor = yAtWall > DOOR_Y0 + 0.25 && yAtWall < DOOR_Y1 - 0.25;
  if (throughDoor && doorOpen) return { x, y, stopped: edge };
  // stopped at the wall, on the side it came from
  return { x: from.x < WALL_X ? WALL_X - 0.45 : WALL_X + 0.45, y, stopped: throughDoor ? 'door' : 'wall' };
}
export function walkTo(from: GaPoint, to: GaPoint, doorOpen: boolean): GaPoint {
  const r = walkResult(from, to, doorOpen);
  return { x: r.x, y: r.y };
}

export const distance = (a: GaPoint, b: GaPoint): number => Math.hypot(a.x - b.x, a.y - b.y);

/* ── distance ───────────────────────────────────────────────────────────── */

export type GaAttenuation = { min: number; max: number };

/** Linear gain 0…1 at this distance. Full level inside `min`; 1/distance
 *  beyond it; the last fifth of the range fades to exactly 0 at `max`. */
export function attenuationGain(d: number, a: GaAttenuation): number {
  if (!(d > a.min)) return 1;
  if (d >= a.max) return 0;
  const inverse = a.min / d;
  const fadeFrom = a.min + (a.max - a.min) * 0.8;
  const fade = d <= fadeFrom ? 1 : 1 - (d - fadeFrom) / (a.max - fadeFrom);
  return inverse * fade;
}
export const gainDb = (g: number): number => (g <= 1e-6 ? -120 : 20 * Math.log10(g));

/* ── direction ──────────────────────────────────────────────────────────── */

export type GaListener = GaPoint & {
  /** Compass degrees the listener FACES: 0 = north (up the plan), 90 = east. */
  facing: number;
  /** Metres above the ground. An overhead camera listener sits high, which
   *  shrinks every left/right angle — the reason a strategy view pans less. */
  height: number;
};

/** The source seen from the listener: how far to the RIGHT and how far in
 *  FRONT, in metres (negative = left / behind). */
export function relative(listener: GaListener, source: GaPoint): { right: number; front: number } {
  const dx = source.x - listener.x;
  const dy = source.y - listener.y; // south is +y
  const a = (listener.facing * Math.PI) / 180;
  // facing unit vector (east, south) for compass angle a: (sin a, −cos a)
  const fx = Math.sin(a);
  const fy = -Math.cos(a);
  // right-hand unit vector: facing turned 90° clockwise = (cos a, sin a)
  const rx = Math.cos(a);
  const ry = Math.sin(a);
  return { right: dx * rx + dy * ry, front: dx * fx + dy * fy };
}

/** The widest a stereo pan goes. A source square to the side reaches this,
 *  not ±1: at ±1 one ear gets digital silence, which is uncomfortable on
 *  headphones and is not what a game's stereo pan does (audit 2, F25). */
export const GA_PAN_WIDTH = 0.85;

/** Left/right pan −GA_PAN_WIDTH … +GA_PAN_WIDTH for a stereo output. Height
 *  and distance behind do not exist in a stereo pan: a source dead ahead and
 *  one dead behind both read 0. Very close sources are pulled to the center
 *  (a sound at your feet is not hard left). */
export function stereoPan(listener: GaListener, source: GaPoint): number {
  const { right, front } = relative(listener, source);
  const flat = Math.hypot(right, front);
  const d = Math.hypot(flat, listener.height);
  if (d < 1e-6) return 0;
  const near = Math.min(1, flat / 1.0);
  return Math.max(-1, Math.min(1, (right / d) * near)) * GA_PAN_WIDTH;
}

/** What an equal-power stereo pan gives each side for a pan of −1 … +1 (the
 *  law the engine's stereo panner uses for a one-channel sound): linear gain
 *  for the left and the right. Center is 0.707 on both. */
export function panGains(pan: number): { l: number; r: number } {
  const a = ((Math.max(-1, Math.min(1, pan)) + 1) * Math.PI) / 4;
  return { l: Math.cos(a), r: Math.sin(a) };
}

/** The direction for a head-related (binaural) panner: +x right, +y up,
 *  −z in front. A unit vector; distance is applied by the model. */
export function hrtfDirection(listener: GaListener, source: GaPoint, sourceHeight = 0): [number, number, number] {
  const { right, front } = relative(listener, source);
  const up = sourceHeight - listener.height;
  const d = Math.hypot(right, front, up);
  if (d < 1e-6) return [0, 0, -1];
  return [right / d, up / d, -front / d];
}

/** Degrees clockwise from straight ahead, −180 … 180 (for the readout). */
export function bearing(listener: GaListener, source: GaPoint): number {
  const { right, front } = relative(listener, source);
  return (Math.atan2(right, front) * 180) / Math.PI;
}

/* ── the wall ───────────────────────────────────────────────────────────── */

/* NAMING (accuracy audit B8). What this file calls OBSTRUCTED / obstruction()
 * is, in the trade's words and in lesson 12's, an OCCLUSION treatment: a wall
 * between the source and the listener, so the direct sound AND the room's
 * echoes are lowered and dulled. The old names are imported by pages, the
 * scene and tests, so they stay; `OCCLUDED` and `occlusion` are the same
 * things under the right word. Write learner text from the right word. */
export type GaObstruction = { gain: number; lowpassHz: number; obstructed: boolean };
export const OBSTRUCTED: GaObstruction = { gain: Math.pow(10, -9 / 20), lowpassHz: 900, obstructed: true };
export const CLEAR: GaObstruction = { gain: 1, lowpassHz: 20000, obstructed: false };

/** The authored treatment for a source in the other room with the door
 *  closed. NO line of sight is tested: with the door open nothing is
 *  treated, wherever the listener stands (lesson 12 says so). */
export function obstruction(listener: GaPoint, source: GaPoint, doorOpen: boolean): GaObstruction {
  return zoneAt(listener) !== zoneAt(source) && !doorOpen ? OBSTRUCTED : CLEAR;
}
export const OCCLUDED = OBSTRUCTED;
export const occlusion = obstruction;
