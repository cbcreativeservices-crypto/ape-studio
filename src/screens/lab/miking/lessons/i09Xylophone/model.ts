/**
 * I09 XYLOPHONE — the technical truth (charter §2 layer 1). The family's
 * xylophone rows (shared/mallets/malletSpec.ts): the Yamaha YX-500R's
 * sounding range F4–C8, its non-graduated 1 5/8 in bars and 54 3/8 × 29 1/2
 * in footprint, "only essential accidental resonators"; and the Adams
 * Concert four-octave option. Keys: docs/labs/miking/xylophone/SOURCES.md,
 * vibraphone/SOURCES.md §0–§1.
 */
import type { DocumentedZone } from '../../engine/model/types.ts';
import { ROWS } from '../shared/mallets/malletSpec.ts';
import { oneMicZone, slantZone, spacedMemberZone, underZone, type MalletFamily } from '../shared/mallets/malletModel.ts';

export const XYLO_FAM: MalletFamily = {
  p: 'xy',
  name: 'xylophone, 3½ octaves (sounding F4–C8)',
  variants: [
    { row: ROWS.xyloYX, label: '3½ OCTAVES', blurb: 'F4 to C8 as it sounds (written an octave lower): 44 bars, all the same width, with tubes under the naturals and only some sharps and flats.', phrase: 'three and a half octaves' },
    { row: ROWS.xyloConcert, label: '4 OCTAVES', blurb: 'C4 to C8: 49 bars, slightly graduated, a tube under every bar, on a deeper frame.', phrase: 'four octaves' },
  ],
  roles: {
    naturals: 'The bars of the naturals, nearest the player: rosewood or a synthetic, hard and bright. A mallet strikes; the bar rings, briefly.',
    accidentals: 'The sharps and flats in the far row, a little higher — laid out like the piano’s black keys.',
    resonators: 'A tube under each bar it serves, open at the top and closed at the bottom; the lower the note, the longer the tube. Some models put tubes under only the sharps and flats that need them.',
    cords: 'Cords through each bar at its still points, on posts along the rails. Nothing clamps to a bar, a cord or a tube; nothing is set on the bars.',
    frame: 'The frame on locking casters, height adjustable. Park it and lock it before the stands go in.',
  },
};

const MICS = ['mlSdc', 'mlDynCard'];

/* ── SUGGESTED STARTING POINTS (lesson L10, L15; corrections I2-X*) ── */
export const XYLO_ZONES: DocumentedZone[] = [
  oneMicZone(XYLO_FAM, {
    id: 'xy.one',
    min: 450,
    max: 750,
    srcKey: 'LESSON-XYL',
    quote: 'Begin with a suitable directional microphone roughly 45–75 cm (1½–2½ ft) above the center of the *played* notes, pointed down toward the bars, only if that affords full hand and mallet clearance.',
    micTypeIds: MICS,
    words: {
      label: 'One mic above the middle of the played notes',
      band: 'Start about 45–75 cm (1½–2½ ft) above the bars, over the middle of the notes the passage plays, aimed down — only where it clears both hands and every mallet stroke.',
      tendency: 'Closer tends to bring more mallet impact and one region of the keyboard; higher, more of the keyboard blended — and more room.',
      checks: ['Full hand and mallet clearance, strongest stroke included', 'Low, middle and high notes; fast repeated notes', 'Pitch against click'],
    },
  }),
  spacedMemberZone(XYLO_FAM, {
    id: 'xy.pairLow',
    side: 'low',
    micTypeIds: MICS,
    words: {
      label: 'One of a spaced pair — over the low half',
      band: 'Start about 46 cm (1½ ft) above the bars, about 30 cm (1 ft) to the low side of the middle, aimed down; its partner mirrors it, about 61 cm (2 ft) apart.',
      tendency: 'One mic toward each region, with overlap in the middle. Notes reaching both mics at different times can change their colour when summed.',
      checks: ['The partner over the high half', 'Overlap in the middle', 'Each alone, both together, and in mono'],
    },
  }),
  spacedMemberZone(XYLO_FAM, {
    id: 'xy.pairHigh',
    side: 'high',
    micTypeIds: MICS,
    words: {
      label: 'One of a spaced pair — over the high half',
      band: 'Start about 46 cm (1½ ft) above the bars, about 30 cm (1 ft) to the high side of the middle, aimed down; its partner mirrors it, about 61 cm (2 ft) away.',
      tendency: 'The high region’s mic. A width that balances in headphones can be awkward for an audience spread across a mono PA.',
      checks: ['The partner over the low half', 'The middle in both mics', 'Mono, and the audience’s PA'],
    },
  }),
  slantZone(XYLO_FAM, {
    id: 'xy.offAxis',
    min: 600,
    max: 900,
    aMin: 35,
    aMax: 55,
    kind: 'trial',
    srcKey: 'LESSON-XYL',
    quote: 'Move higher or to a safe off-axis position as needed.',
    micTypeIds: MICS,
    words: {
      label: 'A safe off-axis position — audience side',
      band: 'Out of the mallets’ way: on the audience side, about 60–90 cm (2–3 ft) from the middle of the keyboard, up at about 45°, aimed back at the bars.',
      tendency: 'A less direct view: tends to soften the click and blend more of the keyboard, with more of the room and the neighbours.',
      checks: ['The player’s sightline over the keyboard', 'Melody still clear, attack less brittle', 'Spill from loud neighbours'],
    },
  }),
  underZone(XYLO_FAM, {
    id: 'xy.under',
    srcKey: 'LESSON-XYL',
    quote: 'Miking below resonator openings can be auditioned for a deliberate local color; it may isolate a narrow part of the instrument or expose mechanical noise.',
    micTypeIds: MICS,
    words: {
      label: 'Under the tubes, aimed up — a deliberate colour',
      band: 'Only for a deliberate local colour: under the high part of the keyboard, between the tubes, aimed up — never into a tube, never on a bar.',
      tendency: 'A narrow part of the instrument, and more mechanical noise. Not the whole xylophone — compare it with a view from above.',
      checks: ['Nothing inside a tube or touching the frame', 'Rattles and noise', 'Compare with a mic above'],
    },
  }),
];
