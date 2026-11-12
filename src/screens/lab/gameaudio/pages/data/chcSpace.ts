/**
 * chcSpace — the numbers pages 11–13 (Chapter 3, Space) print about one
 * source: how far it is, what the distance rule does to its level, where it
 * is from the listener's point of view, and its left/right pan. Pure
 * TypeScript on top of model/gaWorld, so what a page shows is the same
 * arithmetic the scene and the sound use (never a second copy of the rule).
 *
 * Also here: the WALK lane of page 12 (a position along the stone path that
 * does not land inside the wall).
 */
import { GA_EVENTS, type GaEventId } from '../../model/gaDefs.ts';
import { gaListenDistance, gaPlaying, listenerOf, type GaState } from '../../model/gaModel.ts';
import {
  DOOR_POS,
  OBSTRUCTED,
  PLACES,
  WALL_X,
  WORLD_W,
  attenuationGain,
  bearing,
  gainDb,
  obstruction,
  stereoPan,
  zoneAt,
  type GaAttenuation,
  type GaPoint,
} from '../../model/gaWorld.ts';

export type ChcSource = 'generator-1' | 'fountain';

export const CHC_SOURCES: Readonly<Record<ChcSource, { name: string; event: GaEventId; at: GaPoint }>> = {
  'generator-1': { name: 'GENERATOR', event: 'generator', at: PLACES.generator },
  fountain: { name: 'FOUNTAIN', event: 'fountain', at: PLACES.fountain },
};

export type ChcSpace = {
  /** The source has an instance (heard or not). */
  playing: boolean;
  /** Every voice of it is tracked but not rendered (past its maximum). */
  virtual: boolean;
  distanceM: number;
  atten: GaAttenuation;
  /** Linear gain from DISTANCE alone (the wall is separate). */
  gain: number;
  levelDb: number;
  zone: 'full' | 'falling' | 'silent';
  /** Degrees clockwise from straight ahead, −180 … 180. */
  bearingDeg: number;
  /** −1 (left) … +1 (right). */
  pan: number;
  /** The closed door is between the listener and the source. */
  obstructed: boolean;
};

/** One source, measured from the LISTENER. Distance is the model's own
 *  (gaListenDistance: along the ground), so the level printed here is the
 *  level the scene plays. */
export function chcSpace(s: GaState, id: ChcSource): ChcSpace {
  const src = CHC_SOURCES[id];
  const L = listenerOf(s);
  const atten = GA_EVENTS[src.event].atten ?? { min: 1, max: 10 };
  const d = gaListenDistance(L, src.at);
  const gain = attenuationGain(d, atten);
  const insts = s.inst.filter((i) => i.event === src.event);
  const voices = s.voices.filter((v) => insts.some((i) => i.id === v.inst));
  return {
    playing: gaPlaying(s, src.event),
    virtual: voices.length > 0 && voices.every((v) => v.state === 'virtual'),
    distanceM: d,
    atten,
    gain,
    levelDb: gainDb(gain),
    zone: !(d > atten.min) ? 'full' : gain > 0 ? 'falling' : 'silent',
    bearingDeg: bearing(L, src.at),
    pan: stereoPan(L, src.at),
    obstructed: obstruction(L, src.at, s.doorOpen).obstructed,
  };
}

/** PAN in words: CENTER, or the side and how far (100% = fully that side). */
export function panWord(pan: number): string {
  const p = Math.round(Math.abs(pan) * 100);
  return p < 1 ? 'CENTER' : `${pan < 0 ? 'LEFT' : 'RIGHT'} ${p}%`;
}
/** The same, short enough for a readout window. */
export function panShort(pan: number): string {
  const p = Math.round(Math.abs(pan) * 100);
  return p < 1 ? 'CENTER' : `${pan < 0 ? 'L' : 'R'} ${p}%`;
}

/** What the distance rule does to the level, in words where a number would
 *  mislead (full level is not "0.0 dB of something"; silence has no dB). */
export function levelWord(r: ChcSpace): string {
  if (r.zone === 'full') return 'FULL LEVEL (inside the minimum)';
  if (r.zone === 'silent') return 'SILENT (past the maximum)';
  return `${Math.abs(r.levelDb).toFixed(1)} dB below full level`;
}

/** Where the source is from the listener's point of view. */
export function directionWord(deg: number): string {
  const a = Math.abs(deg);
  if (a <= 2.5) return 'straight ahead';
  if (a >= 177.5) return 'straight behind';
  const n = Math.round(a);
  return `${n}° to your ${deg > 0 ? 'right' : 'left'}, ${n < 90 ? 'in front' : n > 90 ? 'behind' : 'at your side'}`;
}

/** One word for a readout: which quarter the source is in. */
export function sideWord(deg: number): 'AHEAD' | 'BEHIND' | 'LEFT' | 'RIGHT' {
  const a = Math.abs(deg);
  if (a <= 45) return 'AHEAD';
  if (a >= 135) return 'BEHIND';
  return deg > 0 ? 'RIGHT' : 'LEFT';
}

/* ── the wall (page 12) ─────────────────────────────────────────────────── */

/** The authored treatment through the closed door, as the model has it. */
export const WALL_DB = Math.round(gainDb(OBSTRUCTED.gain));
export const WALL_HZ = OBSTRUCTED.lowpassHz;

/** The WALK lane: 0 … 1 along the stone path, west edge to east edge. The
 *  model keeps a walker 0.9 m from every edge (gaWorld.walkTo). */
export const WALK_EDGE = 0.9;
export const WALK_X0 = WALK_EDGE;
export const WALK_X1 = WORLD_W - WALK_EDGE;
export const WALK_Y = DOOR_POS.y;
/** How close to the wall line a walker may stand (model/gaWorld walkTo). */
const WALL_KEEP = 0.45;

/** Lane position → meters east, in 0.1 m steps, never inside the wall. */
export function walkX(v: number): number {
  const k = v < 0 ? 0 : v > 1 ? 1 : v;
  const x = Math.round((WALK_X0 + k * (WALK_X1 - WALK_X0)) * 10) / 10;
  if (Math.abs(x - WALL_X) < WALL_KEEP) return x < WALL_X ? WALL_X - WALL_KEEP : WALL_X + WALL_KEEP;
  return x;
}
export const walkV = (x: number): number => Math.max(0, Math.min(1, (x - WALK_X0) / (WALK_X1 - WALK_X0)));

/** The player is standing against the closed door (it stopped the walk). */
export function atClosedDoor(s: GaState): boolean {
  const p = s.chars.player;
  return !s.doorOpen && Math.abs(Math.abs(p.x - WALL_X) - WALL_KEEP) < 0.06 && Math.abs(p.y - WALK_Y) < 0.8;
}

/** The WALK lane's line: where the player stands, in words. Short: the lane
 *  has room for about 30 characters on a phone. */
export function walkLine(s: GaState): string {
  if (atClosedDoor(s)) return 'DOOR CLOSED: STOPPED AT THE WALL';
  const p = s.chars.player;
  const m = Math.abs(p.x - WALL_X).toFixed(1);
  return zoneAt(p) === 'room' ? `WORKSHOP · ${m} m IN` : `COURTYARD · ${m} m TO WALL`;
}
