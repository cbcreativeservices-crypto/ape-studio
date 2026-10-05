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
  { id: 'percussion', num: 2, name: 'Miking Lab 2: Cymbals & Percussion', blurb: 'Place microphones on drawn percussion that is struck, shaken or scraped — the kit’s cymbals, the cajón and hand percussion, hanging metal and the gong, the mallet keyboards and the electric pianos: how each one sounds, recommended starting points, the player’s whole motion, studio or live, and what a second mic or a direct signal does. Silent; tendencies in words.' },
  { id: 'winds', num: 3, name: 'Miking Lab 3: Winds', blurb: 'Place microphones on drawn wind and brass instruments and their players — how the lips or the reed start the sound, where it leaves (a bell, the open holes), recommended starting points clear of the hands, the bell, the slide, the keys and the player’s movement, studio or live, and what a second mic does. Silent; tendencies in words.' },
  { id: 'strings', num: 4, name: 'Miking Lab 4: Strings & Pianos', blurb: 'Place microphones on drawn string instruments, keyboards and harps and their players — guitars and their amps, the bowed strings, piano, harp and clavinet, and the lutes: recommended starting points that keep clear of the hands and the bow, studio or live, and what a second mic does. Silent; tendencies in words.' },
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
  // Lab 4 (strings), in catalogue order: C01, C02, C03, C04, C05A–C, C06a/b, C07, C08, C09a–c, C10, C11, C12, C13, C14, C15.
  { id: 'C01', labId: 'strings', title: 'Acoustic Guitar', subtitle: 'Steel-string, twelve-string and nylon — near the 12th fret, then move', status: 'ready' },
  { id: 'C02', labId: 'strings', title: 'Electric Guitar', subtitle: 'The guitar amp: across the cone, close or back, front and rear', status: 'ready' },
  { id: 'C03', labId: 'strings', title: 'Resonator Guitar', subtitle: 'Square neck in the lap, round neck upright — the cone under the coverplate', status: 'ready' },
  { id: 'C04', labId: 'strings', title: 'Pedal Steel and Lap Steel', subtitle: 'Mic the amp; keep the pedals and knee levers clear', status: 'ready' },
  { id: 'C05A', labId: 'strings', title: 'Banjo', subtitle: 'A drumhead driven by a bridge — head, neck junction, or a clip', status: 'ready' },
  { id: 'C05B', labId: 'strings', title: 'Mandolin', subtitle: 'A-style or F-style — the neck junction, the opening, or a clip', status: 'ready' },
  { id: 'C05C', labId: 'strings', title: 'Ukulele', subtitle: 'A small body, a voice above — the upper body, the hole, or a clip', status: 'ready' },
  { id: 'C06a', labId: 'strings', title: 'Upright Bass, Plucked', subtitle: 'In front just above the bridge, an f-hole, or a clip on the strings', status: 'ready' },
  { id: 'C06b', labId: 'strings', title: 'Upright Bass, Bowed', subtitle: 'In front outside the bow’s sweep, an f-hole, a clip, or a section spot', status: 'ready' },
  { id: 'C07', labId: 'strings', title: 'Acoustic Bass Guitar', subtitle: 'A hollow-body bass: one mic, the pickup, and the lowest notes', status: 'ready' },
  { id: 'C08', labId: 'strings', title: 'Electric Bass', subtitle: 'Fretted and fretless: one woofer, room to breathe, mic and DI', status: 'ready' },
  { id: 'C09a', labId: 'strings', title: 'Violin and Fiddle', subtitle: 'In front and a little above, closer to the bow, or a clip on the violin', status: 'ready' },
  { id: 'C09b', labId: 'strings', title: 'Viola', subtitle: 'A stand in front, a cardioid aimed at one area, or a miniature', status: 'ready' },
  { id: 'C09c', labId: 'strings', title: 'Cello', subtitle: 'A foot from the bridge, a farther view, or a clip on the strings', status: 'ready' },
  { id: 'C10', labId: 'strings', title: 'Harp', subtitle: 'Concert pedal and lever harps: board, pillar and the room', status: 'ready' },
  { id: 'C11', labId: 'strings', title: 'Piano', subtitle: 'Grand, baby grand and upright: lid, strings and soundboard', status: 'ready' },
  { id: 'C12', labId: 'strings', title: 'Clavinet', subtitle: 'The direct signal and the miked amp: two capture paths', status: 'ready' },
  { id: 'C13', labId: 'strings', title: 'Oud', subtitle: 'A fretless lute with a deep bowl — the upper face, the face, the rose', status: 'ready' },
  { id: 'C14', labId: 'strings', title: 'Sitar', subtitle: 'Low by the bridge, high by the neck — and the sympathetic strings', status: 'ready' },
  { id: 'C15', labId: 'strings', title: 'Saraswati Veena', subtitle: 'Over the top plate, out of the hand’s reach — the resonator, the drone, the yali', status: 'ready' },
  // Lab 2 (percussion), in catalogue order: I01a–e, I02, I03a–c, I04, I05a–d, I06a–c, I07, I08, I09, I10, I11a, I11b, I12.
  { id: 'I01a', labId: 'percussion', title: 'Hi-Hat', subtitle: 'Above the pair, away from the snare — or underneath on a clip', status: 'ready' },
  { id: 'I01b', labId: 'percussion', title: 'Ride Cymbal', subtitle: 'A spot over the bow, a mic a foot or two above, or one underneath', status: 'ready' },
  { id: 'I01c', labId: 'percussion', title: 'Crash Cymbal', subtitle: 'Overheads first — then above the plate, or underneath', status: 'ready' },
  { id: 'I01d', labId: 'percussion', title: 'Splash Cymbal', subtitle: 'On an arm or on top of a crash — a short cue among loud neighbours', status: 'ready' },
  { id: 'I01e', labId: 'percussion', title: 'China Cymbal', subtitle: 'Upright or turned over — above it, or under its lowest point', status: 'ready' },
  { id: 'I02', labId: 'percussion', title: 'Cajón', subtitle: 'A box you sit on: find the port first — front, back, or both — outside the hands, knees and the way off', status: 'ready' },
  { id: 'I03a', labId: 'percussion', title: 'Handheld Shaker', subtitle: 'A moving source: one mic outside the arc — toward the mic or side to side', status: 'ready' },
  { id: 'I03b', labId: 'percussion', title: 'Egg Shaker', subtitle: 'No handle: one egg, two close, or hands apart — the grip is part of it', status: 'ready' },
  { id: 'I03c', labId: 'percussion', title: 'Maracas', subtitle: 'A pair, two arms: one mic centred on the heads, a spot each, or a singer’s pair', status: 'ready' },
  { id: 'I04', labId: 'percussion', title: 'Headless Tambourine and Jingles', subtitle: 'No head, just jingles: from the instrument as played — and a clear gap to the nearest stroke', status: 'ready' },
  { id: 'I05a', labId: 'percussion', title: 'Cowbell', subtitle: 'Struck steel: overheads first, a spot outside the stick’s path, open or muted', status: 'ready' },
  { id: 'I05b', labId: 'percussion', title: 'Claves', subtitle: 'Two sticks of wood: cradled to ring, never a mic between them', status: 'ready' },
  { id: 'I05c', labId: 'percussion', title: 'Woodblock', subtitle: 'Space under the block first: the playing surface or the opening — never into the slot', status: 'ready' },
  { id: 'I05d', labId: 'percussion', title: 'Güiro', subtitle: 'A scraped gourd: cover the whole stroke, both ways — never across the scraper’s path', status: 'ready' },
  { id: 'I06a', labId: 'percussion', title: 'Triangle', subtitle: 'A bent steel bar hung freely: attack, a long ring and the cutoff', status: 'ready' },
  { id: 'I06b', labId: 'percussion', title: 'Finger Cymbals', subtitle: 'A small pair, held still or danced — attack, ring and the moving hands', status: 'ready' },
  { id: 'I06c', labId: 'percussion', title: 'Bar Chimes', subtitle: 'A row of graduated bars swept by hand — the whole sweep and its tail', status: 'ready' },
  { id: 'I07', labId: 'percussion', title: 'Vibraphone', subtitle: 'Metal bars, tubes and fans: one mic above, or a spaced or coincident pair', status: 'ready' },
  { id: 'I08', labId: 'percussion', title: 'Marimba', subtitle: 'Wooden bars over pipes, five octaves wide: one mic, or a spaced or coincident pair', status: 'ready' },
  { id: 'I09', labId: 'percussion', title: 'Xylophone', subtitle: 'Hard, bright bars: one mic above, off-axis, or a spaced or coincident pair', status: 'ready' },
  { id: 'I10', labId: 'percussion', title: 'Glockenspiel', subtitle: 'Steel bars that ring long: a safe view above, the close example that conflicts, one mic or two', status: 'ready' },
  { id: 'I11a', labId: 'percussion', title: 'Rhodes (Tine Piano)', subtitle: 'Mic the speaker it plays through — the direct signal compared alongside', status: 'ready' },
  { id: 'I11b', labId: 'percussion', title: 'Wurlitzer (Reed Piano)', subtitle: 'Two small oval speakers that face the player — a close mic in a narrow gap', status: 'ready' },
  { id: 'I12', labId: 'percussion', title: 'Gong', subtitle: 'Tam-tam or bossed gong: identify it, then a front view, a closer spot or the room', status: 'ready' },
  // Lab 3 (winds), in catalogue order: A01, A02, A03, A04a/b, A05a–d, A06 … A12.
  { id: 'A01', labId: 'winds', title: 'Trumpet and Flugelhorn', subtitle: 'A little off the bell’s axis, a more open view, or a clip on the bell', status: 'ready' },
  { id: 'A02', labId: 'winds', title: 'Trombone and Bass Trombone', subtitle: 'Above or beside the slide’s path, aimed across the bell — or a clip on the bell', status: 'ready' },
  { id: 'A03', labId: 'winds', title: 'French Horn', subtitle: 'A bell that faces back: the room in front, or a mic beside the bell', status: 'ready' },
  { id: 'A04a', labId: 'winds', title: 'Tuba', subtitle: 'Bell up or bell front: above the bell, a little off to the side, or farther back', status: 'ready' },
  { id: 'A04b', labId: 'winds', title: 'Euphonium', subtitle: 'Bell up or bell front: above the bell toward its edge, a little off axis, or farther back', status: 'ready' },
  { id: 'A05a', labId: 'winds', title: 'Soprano Saxophone', subtitle: 'A straight horn: into the bell, above it toward the holes, or a clip far from the bell', status: 'ready' },
  { id: 'A05b', labId: 'winds', title: 'Alto Saxophone', subtitle: 'Above the bell toward the holes, into the bell, near the keys, or a clip', status: 'ready' },
  { id: 'A05c', labId: 'winds', title: 'Tenor Saxophone', subtitle: 'Above the bell, a third of the way up from farther off, or a clip', status: 'ready' },
  { id: 'A05d', labId: 'winds', title: 'Baritone Saxophone', subtitle: 'A big horn: above the bell, the triangle from farther off, and the lowest notes', status: 'ready' },
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
