/**
 * Miking Labs REGISTRY — metadata only (no lesson content), so the lab
 * catalog can read it in node without pulling the drawings in.
 *
 * Owner rule (2026-09-17, "NO placeholder rows"): a lab appears in the
 * catalog only when it has at least one lesson with status 'ready'. Lesson
 * ids are IMMUTABLE once live (they key the learner's progress).
 */
import type { MikingLabId } from '../engine/model/types.ts';

export type MikingLabMeta = { id: MikingLabId; num: number; name: string; blurb: string };
export type LessonMeta = { id: string; labId: MikingLabId; title: string; subtitle: string; status: 'ready' };

export const MIKING_LABS: readonly MikingLabMeta[] = [
  { id: 'drums', num: 1, name: 'Miking Lab 1: Drums', blurb: 'Place microphones on a drawn drum in side and top view — recommended starting points, safe clearance, studio or live, and what a second mic does. Silent; tendencies in words.' },
  { id: 'percussion', num: 2, name: 'Miking Lab 2: Cymbals & Percussion', blurb: '' },
  { id: 'winds', num: 3, name: 'Miking Lab 3: Winds', blurb: '' },
  { id: 'strings', num: 4, name: 'Miking Lab 4: Strings & Pianos', blurb: 'Place microphones on drawn string instruments and their players — recommended starting points, the bow’s sweep and the player’s space, stand or clip, studio or live. Silent; tendencies in words.' },
  { id: 'ensembles', num: 5, name: 'Miking Lab 5: Ensembles & Voice', blurb: '' },
  { id: 'field', num: 6, name: 'Miking Lab 6: Foley, Field & Scientific', blurb: '' },
  { id: 'broadcast', num: 7, name: 'Miking Lab 7: Sports & Broadcast', blurb: '' },
];

export const LESSONS: readonly LessonMeta[] = [
  { id: 'M01', labId: 'drums', title: 'Kick Drum', subtitle: 'Bass drum: inside, outside, one mic or two', status: 'ready' },
  { id: 'M02', labId: 'drums', title: 'Snare Drum', subtitle: 'Top, bottom, clamp or stand — and the hi-hat beside it', status: 'ready' },
  { id: 'M03', labId: 'drums', title: 'Rack and Floor Toms', subtitle: 'One mic each, one for two, or none — under the cymbals', status: 'ready' },
  { id: 'C09a', labId: 'strings', title: 'Violin and Fiddle', subtitle: 'In front and a little above, closer to the bow, or a clip on the violin', status: 'ready' },
  { id: 'C09b', labId: 'strings', title: 'Viola', subtitle: 'A stand in front, a cardioid aimed at one area, or a miniature', status: 'ready' },
  { id: 'C09c', labId: 'strings', title: 'Cello', subtitle: 'A foot from the bridge, a farther view, or a clip on the strings', status: 'ready' },
  { id: 'C06a', labId: 'strings', title: 'Upright Bass, Plucked', subtitle: 'In front just above the bridge, an f-hole, or a clip on the strings', status: 'ready' },
  { id: 'C06b', labId: 'strings', title: 'Upright Bass, Bowed', subtitle: 'In front outside the bow’s sweep, an f-hole, a clip, or a section spot', status: 'ready' },
];

/** Labs with at least one ready lesson — the only ones the catalog lists. */
export function readyLabs(): MikingLabMeta[] {
  return MIKING_LABS.filter((l) => LESSONS.some((x) => x.labId === l.id && x.status === 'ready'));
}

export function lessonsOf(labId: MikingLabId): LessonMeta[] {
  return LESSONS.filter((x) => x.labId === labId && x.status === 'ready');
}

export function lessonMeta(id: string): LessonMeta | undefined {
  return LESSONS.find((x) => x.id === id);
}

export function labMeta(id: string): MikingLabMeta | undefined {
  return MIKING_LABS.find((l) => l.id === id);
}
