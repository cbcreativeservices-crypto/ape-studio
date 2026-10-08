/**
 * I08 MARIMBA — the technical truth (charter §2 layer 1). The family's
 * marimba rows (shared/mallets/malletSpec.ts: the Adams Alpha 5.0 and 4.3
 * printed ranges, bar widths and footprints; the lowest bar's ~620 mm from a
 * maker's guide; the Helmholtz bass from a maker's spec). Keys:
 * docs/labs/miking/marimba/SOURCES.md, vibraphone/SOURCES.md §0–§1.
 */
import type { DocumentedZone } from '../../engine/model/types.ts';
import { ROWS } from '../shared/mallets/malletSpec.ts';
import { oneMicZone, spacedMemberZone, underZone, type MalletFamily } from '../shared/mallets/malletModel.ts';

export const MARIMBA_FAM: MalletFamily = {
  p: 'mr',
  name: 'marimba, 5 octaves (C2–C7)',
  variants: [
    { row: ROWS.marimba50, label: '5 OCTAVES', blurb: 'C2 to C7: 61 bars across about 2.5 m. The lowest notes need boxes, not tubes, under them.', phrase: 'five octaves' },
    { row: ROWS.marimba43, label: '4.3 OCTAVES', blurb: 'A2 to C7: 52 bars across about 2.1 m — a common size for schools and ensembles.', phrase: 'four and a third octaves' },
  ],
  roles: {
    naturals: 'The wooden (or synthetic) bars of the naturals, nearest the player. Longer and wider toward the low end — the lowest about 62 cm long. A mallet strikes; the bar rings.',
    accidentals: 'The sharps and flats in the far row, a little higher — the piano’s black keys, laid out the same way.',
    resonators: 'One pipe under each bar, open at the top and closed at the bottom; the lower the note, the longer the pipe. The lowest notes would need pipes taller than the bars are high, so they get wide boxes instead.',
    cords: 'Cords through each bar at its still points, held by bar posts on the rails; springs on the bass side keep them taut. Nothing clamps to a bar, a cord or a pipe.',
    frame: 'The frame: end assemblies on locking casters, rails and a low stretcher. Lock the wheels and check it stands firm before any stand goes near it.',
  },
};

const MICS = ['mlSdc', 'mlDynCard'];

/* ── SUGGESTED STARTING POINTS (lesson L11, L14, L16; corrections I2-M*) ── */
export const MARIMBA_ZONES: DocumentedZone[] = [
  oneMicZone(MARIMBA_FAM, {
    id: 'mr.one',
    min: 600,
    max: 1000,
    srcKey: 'LESSON-MAR',
    quote: 'start with a suitable directional condenser or another appropriate mic about 60–100 cm (2–3¼ ft) above the center of the *played* span, aimed downward so the relevant low and high bars are in useful pickup',
    micTypeIds: MICS,
    words: {
      label: 'One mic above the middle of the played span',
      band: 'Start about 60–100 cm (2–3¼ ft) above the bars, over the middle of the notes the part actually plays, aimed down — clear of every raised mallet.',
      tendency: 'Bars and resonators together, with the room. A point close to the low bars can make them dominate and lose the far end; higher tends to blend the keyboard but brings in more room.',
      checks: ['Clear of both hands’ whole reach along the keyboard', 'The lowest, middle and highest notes the part plays', 'Rolls and four-mallet chords, not just single strokes'],
    },
  }),
  spacedMemberZone(MARIMBA_FAM, {
    id: 'mr.pairLow',
    side: 'low',
    micTypeIds: MICS,
    words: {
      label: 'One of a spaced pair — over the low half',
      band: 'Start about 46 cm (1½ ft) above the bars, about 30 cm (1 ft) to the low side of the middle, aimed down; its partner mirrors it, about 61 cm (2 ft) apart — then widen for a five-octave part.',
      tendency: 'More separate control of bass and treble. On a five-octave keyboard 61 cm can be too narrow: test the real range and widen the spacing, raise the pair, or re-aim.',
      checks: ['The far low notes and the far high notes', 'The middle, heard by both — no hole', 'Each mic alone, both together, and in mono'],
    },
  }),
  spacedMemberZone(MARIMBA_FAM, {
    id: 'mr.pairHigh',
    side: 'high',
    micTypeIds: MICS,
    words: {
      label: 'One of a spaced pair — over the high half',
      band: 'Start about 46 cm (1½ ft) above the bars, about 30 cm (1 ft) to the high side of the middle, aimed down; its partner mirrors it, about 61 cm (2 ft) away.',
      tendency: 'The treble’s side of the pair. Arrival-time differences can colour a note both mics hear — listen before reaching for automatic alignment or the polarity switch.',
      checks: ['The partner over the low half', 'The middle notes in both mics', 'The sum in mono'],
    },
  }),
  underZone(MARIMBA_FAM, {
    id: 'mr.under',
    srcKey: 'LESSON-MAR',
    quote: 'A mic placed under a resonator opening may provide a more localized, colored sound or mechanical noise and should be auditioned as an optional effect, not asserted to be the universally natural marimba sound.',
    micTypeIds: MICS,
    words: {
      label: 'Under the pipes, aimed up — an optional effect',
      band: 'Only as an optional effect: under the high part of the keyboard, between the rows of pipes, aimed up — touching nothing, out of the player’s way.',
      tendency: 'A more localised, coloured sound, and more mechanical noise. Not the natural marimba sound — audition it against a mic above the bars.',
      checks: ['Nothing touches a pipe, and nothing can be kicked', 'Rattles and mechanical noise', 'Compare it with the view from above'],
    },
  }),
];
