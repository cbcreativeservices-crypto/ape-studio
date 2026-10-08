/**
 * WHERE THE RECEIVERS GO (F13 L23; room_acoustics/GEOMETRY_PROPOSAL.md §2):
 * a set of receiver positions judged for what it can represent. Pure; tested.
 *
 *   • one position stands only for itself — a room needs at least two;
 *   • a single "centre of the room" reading never replaces spatial sampling;
 *   • the set should differ in distance (near and far from the source) and
 *     include a position that differs in its boundaries (a side seat);
 *   • a corner, or a spot dominated by direct sound, is unrepresentative
 *     unless that spot itself is the question.
 * The governing method sets the real counts and spacing — this is the
 * reasoning, never a count.
 */

export type SpotKind = 'centre' | 'front' | 'mid' | 'rear' | 'side' | 'corner';
export type Spot = { id: SpotKind; label: string; distance: 'near' | 'mid' | 'far'; boundary: 'open' | 'wall' | 'corner'; note: string };

export const SPOTS: readonly Spot[] = [
  { id: 'centre', label: 'The middle of the room', distance: 'mid', boundary: 'open', note: 'One “centre of the room” reading is a single point, not the room.' },
  { id: 'front', label: 'A front-row seat', distance: 'near', boundary: 'open', note: 'Near the source: more direct sound, less of the room’s decay.' },
  { id: 'mid', label: 'A seat mid-audience', distance: 'mid', boundary: 'open', note: 'A typical listener: the direct sound and the room together.' },
  { id: 'rear', label: 'A seat near the back', distance: 'far', boundary: 'open', note: 'Far from the source: more of the room, the direct sound weaker.' },
  { id: 'side', label: 'A side seat, about 1 m from the wall', distance: 'mid', boundary: 'wall', note: 'Its nearest wall changes its early reflections: a seat that differs.' },
  { id: 'corner', label: 'Into a rear corner', distance: 'far', boundary: 'corner', note: 'Two walls and the floor close by: unrepresentative unless the corner is the question.' },
];

export type SamplingVerdict = { ok: boolean; points: string[] };

export function judgeSampling(ids: readonly SpotKind[]): SamplingVerdict {
  const set = SPOTS.filter((s) => ids.includes(s.id));
  const points: string[] = [];
  if (set.length < 2) points.push(set.length === 1 && set[0].id === 'centre' ? 'One centre-of-room reading cannot stand for the room: sample more than one position.' : 'One position stands only for itself: choose at least two.');
  const dists = new Set(set.map((s) => s.distance));
  if (set.length >= 2 && !(dists.has('near') || dists.has('mid')) ) points.push('Every position is far from the source: add one nearer.');
  if (set.length >= 2 && !dists.has('far')) points.push('Nothing is far from the source: add a seat near the back.');
  if (set.length >= 2 && !set.some((s) => s.boundary === 'wall')) points.push('Every position is out in the open: a side seat shows how a nearby wall changes the decay.');
  if (set.some((s) => s.boundary === 'corner')) points.push('A corner is unrepresentative unless the corner itself is the question.');
  const ok = set.length >= 2 && dists.has('far') && (dists.has('near') || dists.has('mid')) && set.some((s) => s.boundary === 'wall') && !set.some((s) => s.boundary === 'corner');
  if (ok) points.unshift('These positions differ in distance and in their boundaries: together they can describe the room, as far as the method’s count allows.');
  return { ok, points };
}
