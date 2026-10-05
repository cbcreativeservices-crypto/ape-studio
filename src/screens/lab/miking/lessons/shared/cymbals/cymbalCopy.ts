/**
 * THE CYMBAL LESSONS' SHARED WORDS (engine/model/copy.ts sections that read
 * the same for every cymbal). Starting-points voice (owner ruling
 * 2026-10-04): suggestions in plain words; no source, brand or model names;
 * safety stays (clearance, hearing, phantom and gain, never provoking
 * feedback). Pure data.
 */
import type { FamilyWords, LessonCopy } from '../../../engine/model/copy.ts';
import type { PatternId } from '../../../engine/model/types.ts';

export function cymbalWords(name: string): FamilyWords {
  return {
    instrument: name,
    player: 'drummer',
    reference: 'cymbal',
    inside: 'under the cymbal',
    outside: 'near the cymbal',
    axis: 'the cymbal’s straight-on line',
    facing: 'facing the cymbal',
    shield: 'cymbal in path',
    mountStand: 'Mount: a boom stand outside the kit, its boom clear of the swing, the stick and the player',
    mountClip: 'Mount: clamps to a stand under the cymbal — a clip made for it, with the player’s agreement',
    sheet: 'For a real kit, with the player’s agreement and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
    viewSide: 'Side view, from the player’s right,',
    viewTop: 'Top view',
  };
}

export const CYM_VIEW_WORDS = { side: 'Side view, from the player’s right,', top: 'Top view,' } as const;
export const CYM_WHERE = { inside: 'under the cymbal', outside: 'near the cymbal' } as const;

/** Under-mic patterns for the Studio-or-live page (one mic type, three ideal shapes). */
export function underPatterns(typeId: string): { id: PatternId; label: string; typeId: string }[] {
  return [
    { id: 'cardioid', label: 'cardioid', typeId },
    { id: 'supercardioid', label: 'supercardioid', typeId },
    { id: 'hypercardioid', label: 'hypercardioid', typeId },
  ];
}

export const CYM_CONTEXT_WORDS: Pick<LessonCopy['context'], 'deepNull' | 'cardioidReveal' | 'shieldNote' | 'activityDone' | 'learn'> = {
  activityDone: 'done — the monitor sat in a null by your aim or pattern',
  deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence — and some of the kit in a cymbal mic belongs to the kit sound.',
  cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). Pointing UP at a cymbal, its rear faces the floor — toward the monitors and the drums below.',
  shieldNote: 'Real patterns change with pitch and the stage reflects sound — this is the reasoning, not a prediction.',
  learn: {
    intro: 'These are conditional choices, not genre rules: a mic above a cymbal can suit a loud stage, and a mic underneath can suit a quiet studio.',
    points: [
      { title: 'ROLE OF THE OVERHEADS', text: 'Studio: a good overhead pair often carries the cymbals well, and a close cymbal mic adds focus only when it helps. Live: check what the overheads and the room already give before adding a channel.' },
      { title: 'ABOVE OR UNDERNEATH', text: 'Above, a mic faces the cymbal and also the drums and the floor below it. Underneath, aimed up, its rear faces the floor — the monitors and much of the kit fall toward its rejection. One reason some engineers mic cymbals from below on loud stages.' },
      { title: 'CHANNEL COUNT', text: 'Each cymbal mic is one more open channel: more spill to manage and less gain before feedback. Fewer open mics are simpler.' },
      { title: 'MOUNTING', text: 'Cymbals swing and stands get bumped. Live, use secure, repeatable mounts and protect the cables; in the studio, stopped sessions allow careful moves.' },
    ],
    body: 'Cymbals are loud and spread their sound widely: placement and the overheads matter more than the mic model. A pattern’s rejection helps — it does not remove a loud neighbour.',
    warn: 'No cymbal-mic position alone prevents feedback: the pattern, the other open mics, the monitors, the PA and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
  },
};

export const CYM_TWO_WARN = 'The two mics hear DIFFERENT faces of the plate, so this simplified graph shows only the shared part of the sound — not what the pair will sound like. The notch POSITIONS follow from the arrival-time difference; their DEPTH depends on the two levels, which this model takes from distance alone — read the depths as illustrative. Judge the pair by ear, in mono, at matched levels.';

export const CYM_LINKS = {
  overheads: 'The Drum Overheads lesson (Lab 1) shows the pair above the kit that usually carries every cymbal first — start there, then add a close cymbal mic only for what it is missing.',
  kit: 'The Complete Kit Setups lesson (Lab 1) builds a whole kit’s channels, from one mic up — where a cymbal mic fits in the plan, and when it does not.',
} as const;
