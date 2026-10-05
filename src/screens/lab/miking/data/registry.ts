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
  { id: 'strings', num: 4, name: 'Miking Lab 4: Strings & Pianos', blurb: 'Place microphones on drawn string instruments — the guitar family first: front view and from above, recommended starting points, the player’s space, studio or live, and what a second mic does. Silent; tendencies in words.' },
  { id: 'ensembles', num: 5, name: 'Miking Lab 5: Ensembles & Voice', blurb: '' },
  { id: 'field', num: 6, name: 'Miking Lab 6: Foley, Field & Scientific', blurb: '' },
  { id: 'broadcast', num: 7, name: 'Miking Lab 7: Sports & Broadcast', blurb: '' },
];

export const LESSONS: readonly LessonMeta[] = [
  { id: 'M01', labId: 'drums', title: 'Kick Drum', subtitle: 'Bass drum: inside, outside, one mic or two', status: 'ready' },
  { id: 'M02', labId: 'drums', title: 'Snare Drum', subtitle: 'Top, bottom, clamp or stand — and the hi-hat beside it', status: 'ready' },
  { id: 'M03', labId: 'drums', title: 'Rack and Floor Toms', subtitle: 'One mic each, one for two, or none — under the cymbals', status: 'ready' },
  // Lab 4 (strings): the guitar family — each lesson on its own line (built in parallel).
  { id: 'C01', labId: 'strings', title: 'Acoustic Guitar', subtitle: 'Steel-string, twelve-string and nylon — near the 12th fret, then move', status: 'ready' },
  { id: 'C07', labId: 'strings', title: 'Acoustic Bass Guitar', subtitle: 'A hollow-body bass: one mic, the pickup, and the lowest notes', status: 'ready' },
  { id: 'C03', labId: 'strings', title: 'Resonator Guitar', subtitle: 'Square neck in the lap, round neck upright — the cone under the coverplate', status: 'ready' },
  { id: 'C05A', labId: 'strings', title: 'Banjo', subtitle: 'A drumhead driven by a bridge — head, neck junction, or a clip', status: 'ready' },
  { id: 'C05B', labId: 'strings', title: 'Mandolin', subtitle: 'A-style or F-style — the neck junction, the opening, or a clip', status: 'ready' },
  { id: 'C05C', labId: 'strings', title: 'Ukulele', subtitle: 'A small body, a voice above — the upper body, the hole, or a clip', status: 'ready' },
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
