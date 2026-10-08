/**
 * Miking Labs REGISTRY — metadata only (no lesson content), so the lab
 * catalog can read it in node without pulling the drawings in.
 *
 * Owner rule (2026-09-17, "NO placeholder rows"): a lab appears in the
 * catalog only when it has at least one lesson with status 'ready'. Lesson
 * ids are IMMUTABLE once live (they key the learner's progress).
 */
import type { MikingLabId } from '../engine/model/types.ts';

/**
 * `family` / `familyBlurb` (owner 2026-10-06): each READY lab is ONE tile on
 * the member Labs menu (labCatalog → Instruments & Recording), named by its
 * instrument family, with a short plain line saying what is in it; the tile
 * opens that lab's lessons (MikingHub { lab }). "Those tiles … should be on
 * the member lab menu, not inside another menu." Family order IS this array's
 * order (Membranophones, Idiophones, Aerophones, Chordophones, Voice &
 * Ensemble, then the rest). A family appears only when its lab is ready
 * (readyLabs), so an unbuilt family is never shown or promised.
 */
export type MikingLabMeta = { id: MikingLabId; num: number; name: string; blurb: string; family: string; familyBlurb: string };
export type LessonMeta = { id: string; labId: MikingLabId; title: string; subtitle: string; status: 'ready' };

export const MIKING_LABS: readonly MikingLabMeta[] = [
  { id: 'drums', num: 1, name: 'Miking Lab 1: Drums', blurb: 'Place microphones on a drawn drum in side and top view — recommended starting points, safe clearance, studio or live, and what a second mic does. Silent; tendencies in words.', family: 'Membranophones', familyBlurb: 'Miking drums — kit, hand, concert — and speaker cabinets' },
  { id: 'percussion', num: 2, name: 'Miking Lab 2: Cymbals & Percussion', blurb: 'Place microphones on drawn percussion that is struck, shaken or scraped — the kit’s cymbals, the cajón and hand percussion, hanging metal and the gong, the mallet keyboards and the electric pianos: how each one sounds, recommended starting points, the player’s whole motion, studio or live, and what a second mic or a direct signal does. Silent; tendencies in words.', family: 'Idiophones', familyBlurb: 'Miking cymbals and percussion, from hi-hat to gong' },
  { id: 'winds', num: 3, name: 'Miking Lab 3: Winds', blurb: 'Place microphones on drawn wind instruments and their players — brass, saxophones, the flute, piccolo, clarinets, oboe and bassoon, the harmonica, the accordion and the pipe organ: how the lips, the reed, the air jet or the bellows start the sound, where it leaves (a bell, the first open holes, the embouchure, the reeds, the pipes), recommended starting points clear of the mouth, the hands, the bell, the slide, the keys, the breath, the bellows and the player’s movement, studio or live, and what a second mic does. Silent; tendencies in words.', family: 'Aerophones', familyBlurb: 'Miking winds and brass, from trumpet to pipe organ' },
  { id: 'strings', num: 4, name: 'Miking Lab 4: Strings & Pianos', blurb: 'Place microphones on drawn string instruments, keyboards and harps and their players — guitars and their amps, the bowed strings, piano, harp and clavinet, and the lutes: recommended starting points that keep clear of the hands and the bow, studio or live, and what a second mic does. Silent; tendencies in words.', family: 'Chordophones', familyBlurb: 'Miking strings and pianos, from guitar to harp' },
  { id: 'ensembles', num: 5, name: 'Miking Lab 5: Ensembles & Voice', blurb: 'Place microphones on drawn singers and ensembles — a lead vocal, rap, a singer at a guitar or piano, the string quartet and sections, mixed classical groups and the full orchestra: where the sound comes from, recommended starting points (measured from the lips for a voice; main pairs and the three-omni tree drawn whole for an ensemble), supports for a named need, studio or live, and what a second mic does. Silent; tendencies in words.', family: 'Voice & Ensemble', familyBlurb: 'Miking voices and ensembles, from a lead vocal to the orchestra' },
  // Lab 6 is filled by groups (group 6: F09, F10 location and spatial; group
  // 4: F11–F13 measurement): the blurb names only what is built; later groups
  // widen it as they land.
  { id: 'field', num: 6, name: 'Miking Lab 6: Foley, Field & Scientific', blurb: 'Microphones on location, in the field and for measurement, on drawn sets, sites, benches and rooms — speech with the camera’s frame, the boom, the body mic and the practical sounds of a scene; spatial pickup for headphones, surround and Ambisonics with the channel maps that keep it right; the measurement chain and its field check, where a measurement mic or a meter goes for the question asked, and the honest label for the result. Safety in plain words. Silent; suggested starting points.', family: 'Foley, Field & Scientific', familyBlurb: 'Miking on location, in the field and for measurement' },
  // Not built yet: no ready lesson, so neither the lab nor its family tile is
  // listed. Fill `blurb` and `familyBlurb` when the first lesson goes ready.
  { id: 'broadcast', num: 7, name: 'Miking Lab 7: Sports & Broadcast', blurb: '', family: 'Sports & Broadcast', familyBlurb: '' },
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
  { id: 'A06', labId: 'winds', title: 'Flute', subtitle: 'Metal or wooden — identify the design, then close, behind the head, in front, or a headset', status: 'ready' },
  { id: 'A07', labId: 'winds', title: 'Piccolo', subtitle: 'Half a flute, an octave up: the flute’s starting points, the ensemble first, your ears protected', status: 'ready' },
  { id: 'A08a', labId: 'winds', title: 'Clarinet', subtitle: 'The B♭ clarinet: facing the holes a third up from the bell, farther back, or a clip', status: 'ready' },
  { id: 'A08b', labId: 'winds', title: 'Bass clarinet', subtitle: 'Bell and holes together: in front, the body-and-bell blend, the bell to compare, or a clip', status: 'ready' },
  { id: 'A09a', labId: 'winds', title: 'Oboe', subtitle: 'Facing the holes a third up from the bell, a foot away, near the bell, or a clip', status: 'ready' },
  { id: 'A09b', labId: 'winds', title: 'Bassoon', subtitle: 'A third of the way down from the bell, a foot from the holes, high on the right, or a clip', status: 'ready' },
  { id: 'A10', labId: 'winds', title: 'Harmonica', subtitle: 'Acoustic on a stand, cupped through an amp, or the amp’s speaker — three paths', status: 'ready' },
  { id: 'A11', labId: 'winds', title: 'Accordion', subtitle: 'Two moving sides: one mic in front, one for each side, or a mount that moves with it', status: 'ready' },
  { id: 'A12', labId: 'winds', title: 'Acoustic Pipe Organ', subtitle: 'A room-sized instrument: the main pair, a division spot, the stream and the PA', status: 'ready' },
  // Lab 5 (ensembles and voice), group 1 — voice I, solo: E01, E03, E07 (the shared voice family, lessons/shared/voice).
  { id: 'E01', labId: 'ensembles', title: 'Lead Vocal', subtitle: 'Any voice, any style: about 15 cm in the studio, within 10 cm on stage — measured from the lips', status: 'ready' },
  { id: 'E03', labId: 'ensembles', title: 'Rap and Rhythmic Vocal', subtitle: 'Fast consonants and sudden peaks: a close, steady distance, a working zone, the grille kept open', status: 'ready' },
  { id: 'E07', labId: 'ensembles', title: 'Singer with Guitar or Piano', subtitle: 'One performer, two sources: one coherent mic, or a vocal mic and an instrument mic — each hearing both', status: 'ready' },
  // Lab 5 (ensembles), arrays and orchestra (group 3): E11, E13, E14 — each on its own line.
  { id: 'E11', labId: 'ensembles', title: 'String Quartet and Sections', subtitle: 'A pair in front of the quartet, one support if needed — then the larger string sections', status: 'ready' },
  { id: 'E13', labId: 'ensembles', title: 'Mixed Classical Ensembles', subtitle: 'A chamber group or an orchestra: one main array first, the tree and its centre, supports for a named need', status: 'ready' },
  { id: 'E14', labId: 'ensembles', title: 'Full Orchestra', subtitle: 'A main pair or a tree over the podium first — supports only where something is missing', status: 'ready' },
  // Lab 5 (ensembles and voice), group 2 — voice II, groups: E02, E04, E05, E06 (each lesson on its own line).
  { id: 'E02', labId: 'ensembles', title: 'Background and Harmony Vocals', subtitle: 'A handheld each about 4–8 cm from the lips and 3:1 apart, or one shared mic the singers balance by distance', status: 'ready' },
  { id: 'E04', labId: 'ensembles', title: 'Duets and Small Vocal Groups', subtitle: 'One mic with the singers matched, a figure-8 between two, a pair for a group — or a mic each, 3:1 apart', status: 'ready' },
  { id: 'E05', labId: 'ensembles', title: 'Choirs, Choruses and A Cappella', subtitle: 'A few feet out and a little above, aimed at the rows: the fewest area mics, 3:1 apart — or one main pair', status: 'ready' },
  { id: 'E06', labId: 'ensembles', title: 'Children’s Voices and Choirs', subtitle: 'Supervised and safe first: one pair before any close mic, aimed at the children’s mouths — shown from above', status: 'ready' },
  // Lab 5 (ensembles), group 4 — bands & stage plots: E09, E15, E08 (each lesson on its own line).
  { id: 'E09', labId: 'ensembles', title: 'Rhythm Sections and Complete Bands', subtitle: 'A band on a stage plot: arrange it first, the fewest mics that do the job, every open mic counted', status: 'ready' },
  { id: 'E15', labId: 'ensembles', title: 'Jazz Combo', subtitle: 'A conversation with bleed: one main view, a few supports, close mics or a hybrid — and the amp turned away', status: 'ready' },
  { id: 'E08', labId: 'ensembles', title: 'Acoustic Duos and Small Groups', subtitle: 'Players about equally far from one pair; a spot only for a reason, 3:1 between spots', status: 'ready' },
  // Lab 5 (ensembles), group 5 — sections: E10, E16, E12 (each on its own line).
  { id: 'E10', labId: 'ensembles', title: 'Horn Sections', subtitle: 'Brass and saxes together: one section view, a mic for two, or a close mic on each — the players make the balance', status: 'ready' },
  { id: 'E16', labId: 'ensembles', title: 'Jazz Big Band', subtitle: 'Rows of reeds and brass with a rhythm section: a main view, section mics or a mic on every horn — the band makes the balance', status: 'ready' },
  { id: 'E12', labId: 'ensembles', title: 'Percussion Ensembles', subtitle: 'Stations of drums, mallets and small percussion: one main pickup first, at most two supports, the movement covered', status: 'ready' },
  // Lab 6 (field), group 6 — location and spatial: F09, F10 (each lesson on its own line).
  { id: 'F09', labId: 'field', title: 'Location Speech and Practical Sounds', subtitle: 'A boom just above the frame, a body mic on the chest, a plant for the action — each on its own channel', status: 'ready' },
  { id: 'F10', labId: 'field', title: 'Spatial and Specialist Field Pickup', subtitle: 'The listener’s point first: a binaural head, an Ambisonic mic, a five-channel array — and the channel map that keeps them right', status: 'ready' },
  /* Lab 6 group 4 — measurement core: F11, F12, F13 (one block; each lesson on its own line). */
  { id: 'F11', labId: 'field', title: 'Measurement Microphones and Calibration', subtitle: 'The question first, the right field and power path, a check before and after — and an honest label', status: 'ready' },
  { id: 'F12', labId: 'field', title: 'Sound Level and Environmental Noise', subtitle: 'A named question and window, the method’s height, an open or facade position — and a conclusion no bigger than the evidence', status: 'ready' },
  { id: 'F13', labId: 'field', title: 'Room Acoustics and Reverberation', subtitle: 'Room only or system + room, seats that differ, a tail above the floor — T20, T30 and EDT kept apart', status: 'ready' },
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
