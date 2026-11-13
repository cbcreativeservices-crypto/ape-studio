/**
 * chbScene — what chapter 2's pages (6–10) read from the shared scene to
 * judge a goal or draw a read-only figure. Pure TypeScript over the model's
 * state (node:test loads it: test/gameAudioChB.test.ts). Nothing here
 * changes the scene; `chbRoute` only RETURNS the `move` actions a page
 * dispatches.
 */
import { surfaceOf, type GaAction, type GaInstance, type GaLogKind, type GaState } from '../../model/gaModel.ts';
import { DOOR_POS, START, WALL_X, surfaceAt, zoneAt, type GaPoint, type GaSurfaceId, type GaZone } from '../../model/gaWorld.ts';
import { footstepId, gaAsset } from '../../sounds/gaSoundBank.ts';
import { FOOTSTEP_TAKES, GA_SURFACES, type GaSurface } from '../../sounds/gaSynth.ts';

export const CHB_SURFACES = GA_SURFACES;

/** Every footstep take (a page that steps lists them in its assets). */
export const CHB_FOOTSTEP_ASSETS: readonly string[] = GA_SURFACES.flatMap((s) => Array.from({ length: FOOTSTEP_TAKES }, (_, t) => footstepId(s, t)));

/* ── places the player can be sent to ───────────────────────────────────── */

export type ChbPlaceId = 'stone' | 'gravel' | 'workshop';

/** One standing place per surface. The workshop place is on the door's
 *  line, so a straight walk from it leaves through the doorway, and far
 *  enough east that YOU and the guide do not overlap in the picture. */
export const CHB_PLACES: Readonly<Record<ChbPlaceId, GaPoint>> = {
  stone: { x: START.player.x, y: START.player.y },
  gravel: { x: 4.2, y: 7.5 },
  workshop: { x: 13.4, y: DOOR_POS.y },
};

/** In front of the door, on each side of the wall. */
export const CHB_DOORSTEP: Readonly<Record<GaZone, GaPoint>> = {
  yard: { x: WALL_X - 1, y: DOOR_POS.y },
  room: { x: WALL_X + 1, y: DOOR_POS.y },
};

/** Which place a point belongs to, by the surface under it. */
export function chbPlaceOf(p: GaPoint): ChbPlaceId {
  const su = surfaceAt(p);
  return su === 'wood' ? 'workshop' : su;
}

/**
 * The `move` actions that take the player to a place. A walker passes the
 * wall only through the open doorway (gaWorld `walkTo`), so a change of zone
 * goes by the two doorsteps. With the door closed the player walks up to the
 * door and stops there: `blocked`.
 */
export function chbRoute(from: GaPoint, doorOpen: boolean, to: ChbPlaceId): { moves: GaAction[]; blocked: boolean } {
  const target = CHB_PLACES[to];
  const here = zoneAt(from);
  const there = zoneAt(target);
  const mv = (p: GaPoint): GaAction => ({ type: 'move', who: 'player', x: p.x, y: p.y });
  if (here === there) return { moves: [mv(target)], blocked: false };
  if (!doorOpen) return { moves: [mv(CHB_DOORSTEP[here])], blocked: true };
  return { moves: [mv(CHB_DOORSTEP[here]), mv(CHB_DOORSTEP[there]), mv(target)], blocked: false };
}

/* ── page 7: instances and their owners ─────────────────────────────────── */

/** Generator instances still playing whose machine is no longer in the scene. */
export const chbOrphans = (s: GaState): GaInstance[] => s.inst.filter((i) => i.event === 'generator' && !s.machines.some((m) => m.id === i.owner));

/* ── page 8: local and global ───────────────────────────────────────────── */

/** The guide's footstep switch reads the surface under THE GUIDE while the
 *  player stands on a different one: the proof that the switch is local. */
export const chbGuideOwnSurface = (s: GaState): boolean => surfaceOf(s, 'guide') === surfaceAt(s.chars.guide) && surfaceAt(s.chars.guide) !== surfaceAt(s.chars.player);

/**
 * The guide's surface switch AS THE PAGE SHOWS IT. A planted fault does not
 * name itself (lead's decision 10): while the switch is set for everyone and
 * the learner has not yet produced the symptom (`named` false: no guide step
 * has used a wrong surface since the fault began), the readout and the table
 * keep the surface the guide stands on, which is the value its last footstep
 * sent. After that they show what the switch really reads.
 */
export const chbGuideSurfaceShown = (s: GaState, named: boolean): GaSurfaceId => (s.faults.globalSurface && !named ? surfaceAt(s.chars.guide) : surfaceOf(s, 'guide'));

/** Page 8's log shows the lines its steps tell the learner to read: what the
 *  GAME sent (each trigger with its switch value, each event), VALUE and
 *  STATE lines, a FAULT, and a NOTE that says why a move did nothing. The
 *  START and STOP lines of four footsteps would push them out of view. */
export const CHB_P08_LOG: readonly GaLogKind[] = ['trigger', 'value', 'state', 'failed', 'note'];

/** How many footsteps a character has taken (every surface). */
export const chbSteps = (s: GaState, who: 'player' | 'guide'): number => GA_SURFACES.reduce((n, su) => n + (s.facts[`step:${who}:${su}`] ?? 0), 0);

/* ── page 9: which take played ──────────────────────────────────────────── */

export type ChbTake = {
  /** The instance, with its birth time (ids start again after a reset). */
  key: string;
  surface: GaSurface;
  /** 1-based, as the log prints it. */
  take: number;
  /** The same take as the step before it, on the same surface. */
  repeat: boolean;
};

/** `fs_stone_3` → stone, take 3. Anything else is not a footstep take. */
export function chbTakeOf(asset: string): { surface: GaSurface; take: number } | null {
  const m = /^fs_([a-z]+)_(\d+)$/.exec(asset);
  if (!m || !(GA_SURFACES as readonly string[]).includes(m[1])) return null;
  return { surface: m[1] as GaSurface, take: Number(m[2]) };
}

/**
 * The footsteps a character has played, oldest first: `prev` plus every
 * footstep instance in the scene that is not in it yet. Read from the
 * instance's own record of the take it chose, never from the log's wording.
 * Returns `prev` itself when nothing is new.
 */
export function chbNoteTakes(prev: readonly ChbTake[], s: GaState, who: 'player' | 'guide' = 'player', keep = 10): readonly ChbTake[] {
  const fresh = s.inst
    .filter((i) => i.event === 'footstep' && i.owner === who && !prev.some((p) => p.key === `${i.id}@${i.born}`))
    .sort((a, b) => a.born - b.born);
  if (!fresh.length) return prev;
  const out = [...prev];
  for (const i of fresh) {
    const t = chbTakeOf(i.chose[0] ?? '');
    if (!t) continue;
    const last = out[out.length - 1];
    out.push({ key: `${i.id}@${i.born}`, surface: t.surface, take: t.take, repeat: !!last && last.surface === t.surface && last.take === t.take });
  }
  return out.slice(-keep);
}

/** The most layers any door instance now playing was started with. */
export const chbDoorLayers = (s: GaState): number => s.inst.filter((i) => i.event === 'door_open').reduce((n, i) => Math.max(n, i.chose.length), 0);

/* ── page 10: the beds ──────────────────────────────────────────────────── */

export type ChbBeds = {
  /** Copies of each bed now playing (one of each is the clean scene). */
  room: number;
  yard: number;
  /** The courtyard bed playing is the cut with no loop preparation. */
  raw: boolean;
};

export function chbBeds(s: GaState): ChbBeds {
  const yard = s.inst.filter((i) => i.event === 'bed_yard');
  return { room: s.inst.filter((i) => i.event === 'bed_room').length, yard: yard.length, raw: yard.some((i) => i.chose.includes('amb_yard_raw')) };
}

/** Page 10's log leaves out the four lines every footstep prints and the
 *  bird calls' START lines, so a ZONE line (kind `state`) is still in view
 *  after the walk that caused it. A NOTE stays: it says why a step did
 *  nothing (the wall, the closed door, the edge of the scene). */
export const CHB_P10_LOG: readonly GaLogKind[] = ['state', 'mix', 'failed', 'note'];

/** The courtyard bed that is playing the RAW CUT: when it started and how
 *  long one pass of its file is. Null while the prepared loop plays, or no
 *  courtyard bed plays. */
export function chbRawBed(s: GaState): { id: string; born: number; loopS: number } | null {
  const bed = s.inst.find((i) => i.event === 'bed_yard' && i.chose.includes('amb_yard_raw'));
  const loopS = gaAsset('amb_yard_raw')?.loopS;
  return bed && loopS ? { id: bed.id, born: bed.born, loopS } : null;
}

/** How many times a loop has passed its JOIN (its end meeting its start) by
 *  scene time `now`. The raw cut's level jumps there. Counted from the
 *  model's clock, so it is the same with sound off. */
export const chbJoinsPassed = (bed: { born: number; loopS: number } | null, now: number): number => (bed && now > bed.born ? Math.floor((now - bed.born) / bed.loopS + 1e-9) : 0);

/** How many loops are playing (a bed, the fountain, a generator, an alarm). */
export const chbLoops = (s: GaState): number => s.inst.filter((i) => i.loop).length;
