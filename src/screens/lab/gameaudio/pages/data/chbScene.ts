/**
 * chbScene — what chapter 2's pages (6–10) read from the shared scene to
 * judge a goal or draw a read-only figure. Pure TypeScript over the model's
 * state (node:test loads it: test/gameAudioChB.test.ts). Nothing here
 * changes the scene; `chbRoute` only RETURNS the `move` actions a page
 * dispatches.
 */
import { surfaceOf, type GaAction, type GaInstance, type GaState } from '../../model/gaModel.ts';
import { DOOR_POS, START, WALL_X, surfaceAt, zoneAt, type GaPoint, type GaZone } from '../../model/gaWorld.ts';
import { footstepId } from '../../sounds/gaSoundBank.ts';
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

/** How many loops are playing (a bed, the fountain, a generator, an alarm). */
export const chbLoops = (s: GaState): number => s.inst.filter((i) => i.loop).length;
