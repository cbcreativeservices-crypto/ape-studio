/**
 * SMALL-PERCUSSION FAMILY — a builder for a lesson's page words
 * (engine/model/copy.ts). The words every hand-percussion lesson shares —
 * the axes, the stage and studio plan titles, the monitor exercise, the two-
 * mic warnings — are written once here; each lesson passes its own instrument
 * words, its zones and its sound pair. Starting-points voice (owner ruling
 * 2026-10-04): no source, brand or model names; tendencies, never results.
 */
import type { LessonCopy, PairCopy } from '../../../engine/model/copy.ts';
import type { PatternId, Vec3, VariantId, ViewBox } from '../../../engine/model/types.ts';
import { spWords } from './commonItems.ts';

export type SpCopyOpts = {
  /** "egg shaker", "egg shakers" */
  noun: string;
  /** "the egg" (a short subject used in sentences) */
  the: string;
  /** id prefix of the practice ids */
  p: string;
  variantKey: string;
  variantShort: Partial<Record<VariantId, string>>;
  subject: Partial<Record<VariantId, string>>;
  origin: Partial<Record<VariantId, Vec3>>;
  /** What distances are read from ("the middle of the playing area"). */
  refWords: string;
  instrument: LessonCopy['instrument'];
  sound: Omit<LessonCopy['sound'], 'strikes' | 'strikeDefault' | 'striker' | 'strikerPhrase'> & { pair: PairCopy };
  setting: Omit<LessonCopy['setting'], 'plan'> & { planTitle: string };
  placement: Omit<LessonCopy['placement'], 'workedLine' | 'workedClear' | 'blocked' | 'availableLead'> & { workedClear?: string };
  context: { variant?: VariantId; zone: string; shield: string[]; facing: string; studioPrompt: string; studioNote: string; points: { title: string; text: string }[]; side?: ViewBox; plan?: ViewBox; looking?: string };
  twoMic: { variant?: VariantId; A: string; B: string; learn: [string, string] };
  practice?: { mixedIntro?: string };
  facing: string;
  reference: string;
  axis: string;
};

const PATTERNS: { id: PatternId; label: string; typeId: string }[] = [
  { id: 'cardioid', label: 'cardioid', typeId: 'orchSdc' },
  { id: 'supercardioid', label: 'supercardioid', typeId: 'orchSdc' },
  { id: 'hypercardioid', label: 'hypercardioid', typeId: 'orchSdc' },
];

export function spCopy(o: SpCopyOpts): LessonCopy {
  return {
    variantKey: o.variantKey,
    variantShort: o.variantShort,
    sceneSubject: o.subject,
    viewTag: { side: 'SIDE', top: 'FROM ABOVE' },
    axes: {
      x: { plus: 'toward the mic side', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience and the mic, or toward the player (x).' },
      y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: `Up or down (y). Distances are read from ${o.refWords}.` },
      z: { plus: 'to player’s right', minus: 'to player’s left', label: 'ACROSS', blurb: 'Toward the player’s left or right (z).' },
      origin: o.origin,
    },
    instrument: o.instrument,
    sound: {
      ...o.sound,
      strikes: [{ id: 'c', label: 'THE STROKE', mm: 0, blurb: 'One stroke.' }],
      strikeDefault: 'c',
      striker: 'STROKE',
      strikerPhrase: 'the stroke',
    },
    setting: {
      ...o.setting,
      plan: {
        title: o.setting.planTitle,
        badge: 'From above · a typical layout · grey = the player’s space',
        looking: 'Plan · the station, the audience to the right',
        stageBadge: 'From above · a stage · two monitors where a stage often puts them',
        studioBadge: 'From above · a studio room',
        stageLooking: 'Plan · on a stage',
        studioLooking: 'Plan · in a studio',
        widePrompt: 'Switch STAGE / STUDIO, and tap what is new around the player.',
      },
    },
    placement: {
      ...o.placement,
      workedLine: 'This starting point is also read against {line}: the readout says how far the mic is from the whole motion.',
      workedClear: o.placement.workedClear ?? `Clear of the whole motion — ${o.the}, the hands and arms, the face. Clearance comes first: the distance is a starting point, not a safety clearance, and the player stops before a real mic moves.`,
      blocked: {},
      availableLead: 'Starting points for this mic and way of playing',
    },
    context: {
      ...(o.context.variant ? { variant: o.context.variant } : {}),
      zone: o.context.zone,
      typeId: 'orchSdc',
      patterns: PATTERNS,
      micNoun: 'A small condenser',
      shield: o.context.shield,
      azMax: 45,
      elMax: 45,
      aimBlurb: `Swing the front up to 45° either way — it still faces ${o.context.facing}.`,
      plan: o.context.plan ?? { u0: -1300, u1: 1650, v0: -900, v1: 900 },
      side: o.context.side ?? { u0: -1300, u1: 1650, v0: -1800, v1: 60 },
      target: 'downstage',
      frontIds: ['fill'],
      targetWord: 'monitor',
      looking: o.context.looking ?? `Top view · the mic in front of ${o.the}`,
      prompt: 'The monitor stays where the stage needs it. Turn the MIC (AIM) or change its PATTERN until the downstage wedge sits in the rejection.',
      activityDone: 'done — the downstage wedge sat in a null by your aim or pattern',
      deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there. Use the null to aim, not to promise silence.',
      cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°). Supercardioid and hypercardioid patterns have a rear lobe and their deepest rejection off to the sides of the rear — so a wedge is placed by the real pattern, not simply behind.',
      shieldNote: 'Real patterns change with pitch and the stage reflects sound — this is the reasoning, not a prediction. A wider pattern covers a moving player but hears more of the stage.',
      studioId: `${o.p}.ctx.studio`,
      studioPrompt: o.context.studioPrompt,
      studioNote: o.context.studioNote,
      learn: {
        intro: 'These are scenario-based comparisons, not rules: a dedicated spot may suit a busy stage; an existing overhead or ensemble mic may suit a quiet one.',
        points: o.context.points,
        body: 'On an amplified stage the monitors stay where the players need them: turn the mic or choose its pattern so a null faces a loud unwanted source. Mute an unused channel when it is not needed.',
        warn: 'No mic position alone prevents feedback: the monitors and PA, channel gain and EQ, the room and the open mics all matter. Work it out with the system operator, and never create feedback deliberately.',
      },
    },
    twoMic: {
      ...(o.twoMic.variant ? { variant: o.twoMic.variant } : {}),
      A: { typeId: 'orchSdc', pattern: 'cardioid', zone: o.twoMic.A },
      B: { typeId: 'orchSdc', pattern: 'cardioid', zone: o.twoMic.B },
      learn: o.twoMic.learn,
      warn: `This simplified graph shows one point source and straight paths — a real ${o.noun} is played by moving hands, so the delay between two mics can change with every stroke. Read the notch depths as illustrative only.`,
    },
    practice: {
      gain: `${o.p}.prac.gain`,
      second: `${o.p}.prac.3`,
      mixed: [`${o.p}.mix.1`, `${o.p}.mix.2`, `${o.p}.mix.3`],
      mixedIntro: o.practice?.mixedIntro ?? 'Three cards from earlier pages, mixed: a reference point, a pattern’s null, and the delay between two mics.',
    },
    where: { inside: 'inside the motion', outside: 'clear of the motion' },
    viewWords: { side: 'Side view,', top: 'Top view' },
    words: spWords({ instrument: o.noun, reference: o.reference, axis: o.axis, facing: o.facing }),
  };
}
