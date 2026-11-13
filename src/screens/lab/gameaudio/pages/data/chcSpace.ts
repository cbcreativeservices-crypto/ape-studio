/**
 * chcSpace — the numbers pages 11–13 (Chapter 3, Space) print about one
 * source: how far it is, what the distance rule does to its level, where it
 * is from the listener's point of view, and its left/right pan. Pure
 * TypeScript on top of model/gaWorld, so what a page shows is the same
 * arithmetic the scene and the sound use (never a second copy of the rule).
 *
 * Also here: the WALK lane of page 12 (a position along the stone path that
 * does not land inside the wall), what page 12's card says the door does,
 * the actions behind page 13's OUTPUT choice, and the log each page shows.
 */
import { GA_EVENTS, type GaEventId } from '../../model/gaDefs.ts';
import { gaListenDistance, gaPlaying, listenerOf, type GaAction, type GaLogEntry, type GaLogKind, type GaState } from '../../model/gaModel.ts';
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

/** The name is the one the chips and the scene use (audit 2, L-07: the
 *  generator is GENERATOR 1 wherever there is room for it). */
export const CHC_SOURCES: Readonly<Record<ChcSource, { name: string; event: GaEventId; at: GaPoint }>> = {
  'generator-1': { name: 'GENERATOR 1', event: 'generator', at: PLACES.generator },
  fountain: { name: 'FOUNTAIN', event: 'fountain', at: PLACES.fountain },
};

export type ChcSpace = {
  /** The source has an instance (heard or not). */
  playing: boolean;
  /** Every voice of it is tracked but not played (past its maximum). */
  virtual: boolean;
  distanceM: number;
  atten: GaAttenuation;
  /** Linear gain from DISTANCE alone (the wall is separate). */
  gain: number;
  levelDb: number;
  zone: 'full' | 'falling' | 'silent';
  /** Degrees clockwise from straight ahead, −180 … 180. */
  bearingDeg: number;
  /** −GA_PAN_WIDTH (left) … +GA_PAN_WIDTH (right). */
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

/** The card's STATUS row: is this source sounding, tracked, or off. */
export function statusWord(r: ChcSpace): string {
  return !r.playing ? 'Not switched on' : r.virtual ? 'VIRTUAL: tracked, not played' : 'Playing';
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

/** From this many degrees round, page 11 calls a source "straight behind"
 *  (FACING moves in 5° steps, so a learner needs some room to land on it).
 *  The goal chip and the card use this ONE number, so the card never says
 *  the goal's words while the chip stays empty (walk audit W1 F14). */
export const CHC_BEHIND_DEG = 170;
export const isStraightBehind = (deg: number): boolean => Math.abs(deg) >= CHC_BEHIND_DEG;

/** Where the source is from the listener's point of view. The words
 *  "straight behind" appear exactly when `isStraightBehind` is true.
 *  `pan` (optional): the PAN printed beside it. A card never says "straight
 *  behind" (or ahead) beside a PAN that is not CENTER: at 178° the pan reads
 *  LEFT 4% (bug test 2026-11-13, B-S3-09), so that is "almost straight
 *  behind". */
export function directionWord(deg: number, pan?: number): string {
  const a = Math.abs(deg);
  const centered = pan == null || panShort(pan) === 'CENTER';
  if (a <= 2.5 && centered) return 'straight ahead';
  if (a >= 177.5 && centered) return 'straight behind';
  const n = Math.round(a);
  const side = deg > 0 ? 'right' : 'left';
  if (a <= 2.5) return `almost straight ahead (${n}° to your ${side})`;
  if (a >= CHC_BEHIND_DEG) return `almost straight behind (${n}° to your ${side})`;
  return `${n}° to your ${side}, ${n < 90 ? 'in front' : n > 90 ? 'behind you' : 'at your side'}`;
}

/** One word for a readout: where the source is. BEHIND from a quarter turn
 *  (more than 90°), the same line the picture's BEHIND YOU mark uses, so
 *  the readout and the picture never disagree; LEFT or RIGHT between 45°
 *  and 90°; AHEAD inside 45°. */
export function sideWord(deg: number): 'AHEAD' | 'BEHIND' | 'LEFT' | 'RIGHT' {
  const a = Math.abs(deg);
  if (a <= 45) return 'AHEAD';
  if (a > 90) return 'BEHIND';
  return deg > 0 ? 'RIGHT' : 'LEFT';
}

/* ── the log a page shows ───────────────────────────────────────────────── */

/** ■ STOP's own line: every page that filters its log still shows it, so a
 *  press never leaves the log saying nothing (walk audit W2-22). */
export const isStopAllLine = (l: GaLogEntry): boolean => l.kind === 'trigger' && l.text.startsWith('STOP ALL');

/** The scene with only the log lines a page wants to show, for `ActivityLog`.
 *  A page that filters by KIND alone uses the log's own `only`; this is for a
 *  page that also needs single lines of another kind (■ STOP's line). */
export function chcLogView(s: GaState, keep: (l: GaLogEntry) => boolean): GaState {
  return { ...s, log: s.log.filter((l) => keep(l) || isStopAllLine(l)) };
}

/** Page 11's log: STATE lines (a source goes VIRTUAL and comes back) and
 *  NOTE lines (a step that could not move says why: walk audit W1 F01). */
export const P11_LOG: readonly GaLogKind[] = ['state', 'note'];

/** Page 13's log: the OUTPUT choices (MIX lines), and ■ STOP. */
export const p13Log = (s: GaState): GaState => chcLogView(s, (l) => l.kind === 'mix');

/* ── the wall (page 12) ─────────────────────────────────────────────────── */

/** The authored treatment through the closed door, as the model has it. */
export const WALL_DB = Math.round(gainDb(OBSTRUCTED.gain));
export const WALL_HZ = OBSTRUCTED.lowpassHz;
/** The engine's filter is one second-order low-pass: 12 dB per octave above
 *  its frequency (accuracy audit B1: it turns the high part down, it does
 *  not cut it off). */
export const WALL_FILTER_SLOPE = '12 dB per octave';
export const WALL_LEVEL_WORD = `${Math.abs(WALL_DB)} dB lower`;
export const WALL_FILTER_WORD = `Low-pass at about ${WALL_HZ} Hz`;

/** Page 12's card: what the closed door does to the source, from where the
 *  listener is. A source that is not sounding (off, or virtual) has nothing
 *  done to it, so the rows say what the door WOULD do (walk audit W2-21). */
export function wallRows(r: ChcSpace): { level: string; filter: string; sounding: boolean } {
  const sounding = r.playing && !r.virtual;
  if (!r.obstructed) return { level: 'None', filter: 'None', sounding };
  if (!sounding) return { level: `Would be ${WALL_LEVEL_WORD}`, filter: `Would be a low-pass at about ${WALL_HZ} Hz`, sounding };
  return { level: WALL_LEVEL_WORD, filter: WALL_FILTER_WORD, sounding };
}

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

/** The WALK key's own word: the place the scene, the trays and the text
 *  name (audit 2, section 4: COURTYARD / WORKSHOP, not OUTSIDE / INSIDE). */
export const walkPlace = (s: GaState): 'COURTYARD' | 'WORKSHOP' => (zoneAt(s.chars.player) === 'room' ? 'WORKSHOP' : 'COURTYARD');

/** West of this point on the stone path the generator is past its maximum
 *  distance, so it is VIRTUAL there (the far west end of the WALK lane). */
export const WALK_GEN_RANGE_X = (() => {
  const g = PLACES.generator;
  const max = GA_EVENTS.generator.atten?.max ?? 0;
  const dy = g.y - WALK_Y;
  return max > Math.abs(dy) ? g.x - Math.sqrt(max * max - dy * dy) : WALK_X0;
})();

/* ── the output (page 13) ───────────────────────────────────────────────── */

export type ChcOutput = 'stereo' | 'hrtf' | 'mono';
export const outputOf = (s: GaState): ChcOutput => (s.mono ? 'mono' : s.pan);

/** What choosing an OUTPUT sends to the scene. MONO folds whatever renderer
 *  is on. Leaving MONO for one of the other two sets the renderer FIRST and
 *  then switches the fold off, so the log never says "headphone 3D again"
 *  on the way to STEREO. A choice that is already in force sends nothing. */
export function outputActions(s: GaState, o: ChcOutput): GaAction[] {
  if (o === 'mono') return s.mono ? [] : [{ type: 'mono', on: true }];
  const out: GaAction[] = [];
  if (s.pan !== o) out.push({ type: 'pan', mode: o });
  if (s.mono) out.push({ type: 'mono', on: false });
  return out;
}
