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
  { id: 'percussion', num: 2, name: 'Miking Lab 2: Cymbals & Percussion', blurb: 'Place microphones on drawn cymbals and percussion — hanging metal first: the triangle, finger cymbals, bar chimes and the gong, how each one rings, recommended starting points and the player’s space. Silent; tendencies in words.' },
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
  { id: 'M09', labId: 'drums', title: 'Drum Overheads', subtitle: 'One mic or a pair above the kit — the floor-tom method, X/Y, ORTF and a spaced pair', status: 'ready' },
  { id: 'M10', labId: 'drums', title: 'Drum Room Mics', subtitle: 'The kit and its room — close, low in front, farther out, in the corners', status: 'ready' },
  { id: 'M11', labId: 'drums', title: 'Complete Kit Setups', subtitle: 'From one mic to every channel — plans, bleed, mono and routing', status: 'ready' },
  { id: 'M04a', labId: 'drums', title: 'Congas', subtitle: 'A pair of hand drums: one mic or one each, top or bottom', status: 'ready' },
  { id: 'M04b', labId: 'drums', title: 'Bongos', subtitle: 'A small pair: one mic between, two spots, or clip-ons', status: 'ready' },
  { id: 'M04c', labId: 'drums', title: 'Timbales', subtitle: 'Heads, rims and shells: one mic above, spots, or under', status: 'ready' },
  { id: 'M05', labId: 'drums', title: 'Djembe', subtitle: 'A goblet drum: one mic above first, a low mic only if it helps', status: 'ready' },
  { id: 'M06', labId: 'drums', title: 'Timpani', subtitle: 'Kettledrums: the main pickup, a shared spot, two drums or four', status: 'ready' },
  { id: 'M07a', labId: 'drums', title: 'Concert Bass Drum', subtitle: 'Orchestral bass drum on its stand: main pickup, one spot, never move the drum', status: 'ready' },
  { id: 'M07b', labId: 'drums', title: 'Concert Snare', subtitle: 'Orchestra and band snare: no spot, one spot, or a bottom mic', status: 'ready' },
  { id: 'M08', labId: 'drums', title: 'Headed Tambourine', subtitle: 'Head and jingles: held, shaken or mounted — one mic that covers the motion', status: 'ready' },
  { id: 'SPK', labId: 'drums', title: 'Amplified speakers & Leslie', subtitle: 'Guitar and bass cabinets, and the rotary cabinet — from outside', status: 'ready' },
  { id: 'M12', labId: 'drums', title: 'Tonbak', subtitle: 'The Persian goblet drum: one head, many strokes', status: 'ready' },
  { id: 'M13', labId: 'drums', title: 'Tabla', subtitle: 'Two drums, one instrument: the dayan and the bayan', status: 'ready' },
  // Lab 4 (strings), in catalogue order: C01, C02, C03, C04, C05A–C, C06a/b, C07, C08, C09a–c, C10 … C15.
  { id: 'C01', labId: 'strings', title: 'Acoustic Guitar', subtitle: 'Steel-string, twelve-string and nylon — near the 12th fret, then move', status: 'ready' },
  { id: 'C02', labId: 'strings', title: 'Electric Guitar', subtitle: 'The guitar amp: across the cone, close or back, front and rear', status: 'ready' },
  { id: 'C03', labId: 'strings', title: 'Resonator Guitar', subtitle: 'Square neck in the lap, round neck upright — the cone under the coverplate', status: 'ready' },
  { id: 'C04', labId: 'strings', title: 'Pedal Steel and Lap Steel', subtitle: 'Mic the amp; keep the pedals and knee levers clear', status: 'ready' },
  { id: 'C05A', labId: 'strings', title: 'Banjo', subtitle: 'A drumhead driven by a bridge — head, neck junction, or a clip', status: 'ready' },
  { id: 'C05B', labId: 'strings', title: 'Mandolin', subtitle: 'A-style or F-style — the neck junction, the opening, or a clip', status: 'ready' },
  { id: 'C05C', labId: 'strings', title: 'Ukulele', subtitle: 'A small body, a voice above — the upper body, the hole, or a clip', status: 'ready' },
  { id: 'C07', labId: 'strings', title: 'Acoustic Bass Guitar', subtitle: 'A hollow-body bass: one mic, the pickup, and the lowest notes', status: 'ready' },
  { id: 'C08', labId: 'strings', title: 'Electric Bass', subtitle: 'Fretted and fretless: one woofer, room to breathe, mic and DI', status: 'ready' },
  // Lab 2 (percussion), suspended metal: I06a–c, I12 (each lesson on its own line).
  { id: 'I06a', labId: 'percussion', title: 'Triangle', subtitle: 'A bent steel bar hung freely: attack, a long ring and the cutoff', status: 'ready' },
  { id: 'I06b', labId: 'percussion', title: 'Finger Cymbals', subtitle: 'A small pair, held still or danced — attack, ring and the moving hands', status: 'ready' },
  { id: 'I06c', labId: 'percussion', title: 'Bar Chimes', subtitle: 'A row of graduated bars swept by hand — the whole sweep and its tail', status: 'ready' },
  { id: 'I12', labId: 'percussion', title: 'Gong', subtitle: 'Tam-tam or bossed gong: identify it, then a front view, a closer spot or the room', status: 'ready' },
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
