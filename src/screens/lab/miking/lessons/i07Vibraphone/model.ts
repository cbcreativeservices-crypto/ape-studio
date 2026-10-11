/**
 * I07 VIBRAPHONE — the technical truth (charter §2 layer 1). The instrument
 * is the family's vibraphone row (shared/mallets/malletSpec.ts ROWS.vibe:
 * the Adams Concert Vibraphone's printed range, bar widths and footprint);
 * keys point into docs/labs/miking/vibraphone/SOURCES.md and
 * hihat/SOURCES.md §0. Owner ruling 2026-10-04: `src`, `quote`, `prov` and
 * the unknowns are internal; learner words are starting points.
 */
import type { DocumentedZone } from '../../engine/model/types.ts';
import { ROWS } from '../shared/mallets/malletSpec.ts';
import { oneMicZone, spacedMemberZone, underZone, type MalletFamily } from '../shared/mallets/malletModel.ts';

const NO_MOTOR = { ...ROWS.vibe, id: 'nomotor', model: 'Adams Concert Vibraphone, the "Motor : No" version', extras: { damper: 'pedal' as const } };

export const VIBE_FAM: MalletFamily = {
  p: 'vb',
  name: 'vibraphone, 3 octaves (F3–F6)',
  variants: [
    { row: ROWS.vibe, label: 'WITH MOTOR', blurb: 'Fans in the tops of the tubes, turned by a small motor at a speed the player sets — or switched off.', phrase: 'a motor' },
    { row: NO_MOTOR, label: 'NO MOTOR', blurb: 'Some vibraphones come without a motor (or with one as an option): no fans, no pulsing — the bars and tubes alone.', phrase: 'no motor' },
  ],
  roles: {
    naturals: 'The bars of the naturals, nearest the player: metal (an aluminium alloy), graduated — longest and widest at the low end. A mallet strikes; the bar rings.',
    accidentals: 'The sharps and flats, in the far row, level with the naturals — the piano’s black keys, laid out the same way.',
    resonators: 'A tube under every bar, open at the top and closed at the bottom; the lower the note, the longer the tube. The air inside rings with the bar and makes the note fuller.',
    cords: 'A cord runs through each bar where it does not move as it rings, held by posts on the rails, so the bar rings freely. Nothing clamps to a bar, a cord or a tube.',
    frame: 'The frame: two end assemblies on locking casters, joined by rails and a low stretcher. Lock the wheels before any stand goes near it.',
    damper: 'A felt-covered bar under the bars. Pedal up, it touches them and stops the notes; pedal down, it moves away and they ring on.',
    pedal: 'The damper pedal, at the player’s feet. The player’s foot and its travel are the player’s space — keep stand legs and cable loops away from it.',
    motor: 'A small motor under the low end turns the fan shafts at a speed the player sets. It needs mains power; its housing is never opened for a mic.',
    fans: 'A fan in the top of every tube, on one shaft per row. Turning, they open and close the tubes — the pulsing vibrato.',
  },
};

const DOWN_MICS = ['mlSdc', 'mlDynCard'];

/* ── SUGGESTED STARTING POINTS (lesson L10, L11, L15; corrections I2-V*) ── */
export const VIBE_ZONES: DocumentedZone[] = [
  oneMicZone(VIBE_FAM, {
    id: 'vb.one',
    min: 450,
    max: 750,
    srcKey: 'LESSON-VIBE',
    quote: 'try a stand-mounted directional condenser or another suitable mic approximately 45–75 cm (18–30 in) above the central playing region, angled to hear the full range',
    micTypeIds: DOWN_MICS,
    words: {
      label: 'One mic above the middle of the keyboard',
      band: 'Start about 45–75 cm (18–30 in) above the bars, over the middle of the part, aimed down so it hears the whole range — and clear of the raised mallets.',
      tendency: 'One view of the whole keyboard: attack, sustain and the room together. A single point can favour the bars nearest it — play the lowest, middle and highest notes, and move it in small steps.',
      checks: ['Clear of the highest mallet stroke through the whole passage', 'Lowest, middle and highest notes, both rows', 'The motor and the pedal, heard or not'],
    },
  }),
  spacedMemberZone(VIBE_FAM, {
    id: 'vb.pairLow',
    side: 'low',
    micTypeIds: DOWN_MICS,
    words: {
      label: 'One of a spaced pair — over the low half',
      band: 'Start about 46 cm (1½ ft) above the bars, about 30 cm (1 ft) to the low side of the middle, aimed down. Its partner mirrors it: the pair is about 61 cm (2 ft) apart.',
      tendency: 'With its partner, more separate control of the low and high halves — and a wider picture. A bar the two mics hear at different times can sound coloured when they are summed: check in mono.',
      checks: ['Its partner mirrored over the high half', 'The middle notes, heard by both: no hole', 'The sum in mono, at matched levels'],
    },
  }),
  spacedMemberZone(VIBE_FAM, {
    id: 'vb.pairHigh',
    side: 'high',
    micTypeIds: DOWN_MICS,
    words: {
      label: 'One of a spaced pair — over the high half',
      band: 'Start about 46 cm (1½ ft) above the bars, about 30 cm (1 ft) to the high side of the middle, aimed down; its partner mirrors it, about 61 cm (2 ft) away.',
      tendency: 'The high half’s side of the pair. Overlap through the middle matters more than the exact spacing — adjust from the real passage.',
      checks: ['Its partner over the low half', 'The middle notes in both mics', 'The sum in mono'],
    },
  }),
  underZone(VIBE_FAM, {
    id: 'vb.under',
    srcKey: 'LESSON-VIBE',
    quote: 'Do not assume aiming at the resonator openings from underneath will give a complete natural instrument. If that sound is wanted, audition it as a deliberate alternative while keeping motor and pedal hardware clear.',
    micTypeIds: DOWN_MICS,
    words: {
      label: 'Under the tubes, aimed up — an alternative',
      band: 'Only as a deliberate alternative: under the high part of the keyboard, between the rows of tubes, aimed up — clear of the motor, the pedal and the player’s feet.',
      tendency: 'A more local, coloured sound, and more mechanical noise — not the whole instrument. An effect to audition, never the first choice.',
      checks: ['The pedal, the motor and the player’s feet, clear', 'Motor and damper noise', 'Compare it with a mic above the bars'],
    },
  }),
];
