/**
 * I10 GLOCKENSPIEL — the technical truth (charter §2 layer 1). The family's
 * glockenspiel rows (shared/mallets/malletSpec.ts): the Yamaha YG-2500 as
 * its owner's manual prints it (C52–E92, 32.5 × 9 mm steel bars, 106.2 ×
 * 56.4 cm, damper pedal, gas spring, "only essential accidental
 * resonators"), and the YG-1210 case model on a table (F57–C88, 31 × 19 ×
 * 4¼ in, removable lid, hand-damped). Keys: docs/labs/miking/glockenspiel/
 * SOURCES.md, vibraphone/SOURCES.md §0–§1.
 *
 * Shure's close example — ONE mic 4–6 in (101.6–152.4 mm) above the bars —
 * lies INSIDE the mallets' travel (25 cm, a drawing default): the lesson's
 * own point (L9). It is drawn as a conflict band (CLOSE_EXAMPLE), never as a
 * zone a mic can rest in.
 */
import type { DocumentedZone } from '../../engine/model/types.ts';
import { IN, ROWS } from '../shared/mallets/malletSpec.ts';
import { slantZone, type MalletFamily } from '../shared/mallets/malletModel.ts';

export const GLOCK_FAM: MalletFamily = {
  p: 'gl',
  name: 'glockenspiel (orchestral bells), sounding C5–E8',
  variants: [
    { row: ROWS.glockPedal, label: 'ON A FRAME', blurb: 'A concert model on its own frame: 41 steel bars, tubes under them, a damper pedal, and height-adjusting legs.', phrase: 'a pedal and a frame' },
    { row: ROWS.glockCase, label: 'IN A CASE', blurb: 'A case model on a table: 32 steel bars in a wooden case, its lid open behind them; the player damps with the hand.', phrase: 'a case on a table' },
  ],
  roles: {
    naturals: 'Steel bars, all the same width, nearest the player. A hard mallet strikes; the bar rings bright and long.',
    accidentals: 'The sharps and flats in the far row, a little higher — laid out like the piano’s black keys.',
    resonators: 'Short tubes under the naturals and under only the sharps and flats that need one, open at the top and closed at the bottom. The highest are barely longer than a fingertip.',
    cords: 'The bars hang on strings through holes drilled in their sides, at their still points. Nothing clamps to a bar or a damper.',
    frame: 'The frame and its legs: a gas spring sets the height. Never strike or open the gas spring; lower the instrument before it is rolled.',
    damper: 'A damper under the bars, worked by the pedal: up, it stops the notes; down, they ring.',
    pedal: 'The damper pedal at the player’s feet — the player’s space. Keep stand legs and cables away from it.',
    case: 'A wooden case that holds the bars: its box can be the resonating chamber. It sits on a table — not a mic mount.',
    lid: 'The lid, open and standing behind the bars on the audience side. Nobody props or moves it for a mic without the owner’s agreement.',
    table: 'The table under the case: it must be stable and level.',
  },
};

const MICS = ['mlSdc', 'mlDynCard'];

/** Shure's close example (S-LIVE / S-RECBK): one mic 4–6 in above the bars. */
export const CLOSE_EXAMPLE = { min: 4 * IN, max: 6 * IN } as const;

/* ── SUGGESTED STARTING POINTS (lesson L11; corrections I2-G*) ── */
export const GLOCK_ZONES: DocumentedZone[] = [
  slantZone(GLOCK_FAM, {
    id: 'gl.high',
    min: 450,
    max: 600,
    aMin: 5,
    aMax: 35,
    kind: 'trial',
    srcKey: 'LESSON-GLK',
    quote: 'trial one suitable microphone above and slightly toward the audience side of the *played* span, perhaps 30–60 cm (1–2 ft) from the bars where the full mallet arc clears it … compare a higher, more integrated view with a closer, more immediate view',
    micTypeIds: MICS,
    words: {
      label: 'Higher, slightly toward the audience',
      band: 'Start about 45–60 cm (1½–2 ft) from the bars, above them and a little toward the audience side, aimed down across the bars the part plays.',
      tendency: 'The higher, more integrated view of a bright instrument: pitched body and ring with less click, and more of the room.',
      checks: ['The whole mallet arc and the damping hand, through the passage', 'Pitch and ring on the lowest and highest notes', 'The full decay, not cut off'],
    },
  }),
  slantZone(GLOCK_FAM, {
    id: 'gl.near',
    min: 300,
    max: 450,
    aMin: 5,
    aMax: 35,
    // A steeper start, so a boom over the open case lid clears it.
    start: { r: 420, a: 12 },
    kind: 'trial',
    srcKey: 'LESSON-GLK',
    quote: 'perhaps 30–60 cm (1–2 ft) from the bars where the full mallet arc clears it … Moving closer may improve direct-to-spill ratio but exaggerate one area of the keyboard.',
    micTypeIds: MICS,
    words: {
      label: 'Closer, slightly toward the audience',
      band: 'Start about 30–45 cm (1–1½ ft) from the bars, above them and a little toward the audience side, aimed down across the played bars — only where every stroke clears it.',
      tendency: 'A closer, more immediate view: more attack and less of the room, and it can favour one area of the keyboard. Compare it with the higher view at matched level.',
      checks: ['The strongest stroke and the damping hand clear it', 'Click against pitch', 'An even run from the lowest to the highest note'],
    },
  }),
  slantZone(GLOCK_FAM, {
    id: 'gl.lateral',
    min: 400,
    max: 700,
    aMin: 45,
    aMax: 65,
    kind: 'trial',
    srcKey: 'LESSON-GLK',
    quote: 'Aim down across the relevant bars and compare with a safe lateral angle.',
    micTypeIds: MICS,
    variants: ['pedal'],
    words: {
      label: 'A safe lateral angle — audience side',
      band: 'To compare: lower and farther toward the audience, about 40–70 cm (1¼–2¼ ft) from the bars at a slant, aimed back across them.',
      tendency: 'An oblique view across the bars: tends to soften the attack. Compare it with the higher view at matched level.',
      checks: ['The player’s and conductor’s sightlines', 'Click against pitch', 'Neighbours and monitors in the pickup'],
    },
  }),
];
