/**
 * The plucked-string family's page words (engine/model/copy.ts), built once
 * with each lesson's own nouns and specifics. Starting-points voice (owner
 * ruling 2026-10-04): no sources, brands or badges. C01 keeps its own
 * hand-written copy (it set this pattern); later lessons build theirs here.
 */
import type { LessonCopy, StrikePoint } from '../../../engine/model/copy.ts';
import type { PatternId, VariantId, ViewBox } from '../../../engine/model/types.ts';
import type { Noun } from './stringsContent.ts';

export type StringsCopyOpts = {
  n: Noun;
  /** "a seated player with an acoustic bass guitar" per variant. */
  subject: Record<VariantId, string>;
  variantKey: string;
  /** The view tags (default FRONT / FROM ABOVE: an upright instrument). */
  viewTag?: { side: string; top: string };
  variantShort: Record<VariantId, string>;
  variantNotes?: Partial<Record<VariantId, string>>;
  figureLabel: string;
  partsIdle: string;
  /** What drives the air (the "top", the "head", the "cone"). */
  radiator: string;
  strikes: StrikePoint[];
  strikeDefault: string;
  striker?: string;
  strikerPhrase?: string;
  soundReveal: string;
  soundAfter: string;
  shapesNote2: string;
  coupledNote: string;
  setting: { kitA11y: string; kitIdle: string; leftHanded: string; stageA11y: string; studioA11y: string; stageIdle: string; studioIdle: string; before: { title: string; text: string }[] };
  workedZone: Record<VariantId, string>;
  workedLine?: string;
  workedAim: string;
  clearWhat: string;
  placementReveal: string;
  typeNotes: Partial<Record<string, string>>;
  learnSeparate: string;
  learnTendencies: string;
  context: { variant?: VariantId; zone: string; shield: string[]; plan: ViewBox; side: ViewBox; frontIds: string[]; looking: string; points: { title: string; text: string }[]; body: string; studioId: string; studioPrompt: string; studioNote: string };
  twoMic: { variant?: VariantId; A: string; B: string; learn: string[] };
  practice: { prefix: string; mixedIntro: string };
  words: NonNullable<LessonCopy['words']>;
};

export function stringsCopy(o: StringsCopyOpts): LessonCopy {
  const n = o.n;
  const pats: { id: PatternId; label: string; typeId: string }[] = [
    { id: 'cardioid', label: 'cardioid', typeId: 'sdcCard' },
    { id: 'supercardioid', label: 'supercardioid', typeId: 'sdcCard' },
    { id: 'hypercardioid', label: 'hypercardioid', typeId: 'sdcCard' },
  ];
  return {
    variantKey: o.variantKey,
    variantShort: o.variantShort,
    sceneSubject: o.subject,
    viewTag: o.viewTag ?? { side: 'FRONT', top: 'FROM ABOVE' },
    axes: {
      x: { plus: 'toward the headstock', minus: 'toward the tail', label: 'ALONG', blurb: 'Along the strings, toward the headstock or the tail end (x).' },
      // Engine words that hold in every posture (upright or lap style).
      y: { plus: 'lower', minus: 'higher', label: 'UP–DOWN', blurb: 'Up or down, toward the floor (y).' },
      z: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: `Toward the audience or back toward the player (z). Distances are read from the point the zone names on the ${n.one}’s ${o.radiator}.` },
    },
    instrument: {
      figureBadge: 'Drawn to scale from the front, with the player',
      figureLabel: o.figureLabel,
      partsBadge: 'Tap a part to name it · front and from above',
      partsLooking: { side: `Front view · the ${n.one} and the player`, top: `From above · the ${n.one} edge-on` },
      partsIdle: o.partsIdle,
      variantNotes: o.variantNotes ?? {},
    },
    sound: {
      strikes: o.strikes,
      strikeDefault: o.strikeDefault,
      striker: o.striker ?? 'PICK',
      strikerPhrase: o.strikerPhrase ?? 'pick',
      subject: `Front view of the ${n.one}`,
      looking: Object.fromEntries(Object.keys(o.variantShort).map((v) => [v, `Front view · ${o.variantShort[v]}`])),
      cells: [
        { k: 'STRING', at: ['PULLED', 'SWINGING', 'SWINGING', 'SWINGING'], flex: 1.1 },
        { k: o.radiator.toUpperCase(), at: ['AT REST', 'BARELY', 'DRIVEN', 'RADIATING'], flex: 1.1 },
        { k: 'SOUND', at: ['—', 'FAINT', 'BUILDING', 'LEAVING'], flex: 1 },
      ],
      reveal: o.soundReveal,
      after: o.soundAfter,
      shapesNotes: ['A pluck sets a shape moving only as much as the string moves at the pick in that shape. Plucked in the exact middle, every even shape has a still point under the pick, so it is not set moving. Nearer the bridge, the upper shapes join in: brighter.', o.shapesNote2],
      coupledSubject: `Front view of the ${n.one}`,
      coupledNote: o.coupledNote,
      silentNote: `This lab never plays a sound and draws no frequency curve for the ${n.one}: how a real one sounds depends on the instrument, the strings, the room and the player. The pictures show where the sound comes from and where it leaves.`,
    },
    setting: {
      kitA11y: o.setting.kitA11y,
      kitLanding: `Tap anything round the player — or step through ITEM — to see what it means for a ${n.one} mic. There is nothing to answer yet.`,
      kitIdle: o.setting.kitIdle,
      leftHanded: o.setting.leftHanded,
      stageA11y: o.setting.stageA11y,
      studioA11y: o.setting.studioA11y,
      stageIdle: o.setting.stageIdle,
      studioIdle: o.setting.studioIdle,
      before: o.setting.before,
    },
    placement: {
      workedZone: o.workedZone,
      workedLine: o.workedLine ?? 'This starting point also sits near {line}, out in front of the instrument.',
      workedAim: o.workedAim,
      workedClear: `Clear of every part — ${o.clearWhat}. Clearance comes first, before any number, and the player stops before a real mic moves.`,
      blocked: Object.fromEntries(Object.keys(o.variantShort).map((v) => [v, ` A stand mic keeps out of ${o.clearWhat} — come in from the front.`])),
      reveal: o.placementReveal,
      typeNotes: o.typeNotes,
      note: `Clearance comes first: stop the player before moving a real mic. A mic, stand or cable anywhere ${o.clearWhat} can reach is in the wrong place, whatever the number says.`,
      availableLead: 'Starting points for this mic',
      learn: {
        intro: `What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic, measured from the point it names. They are starting points, not rules: move from there and listen — there is no single right answer, and every ${n.one} is different.`,
        separate: o.learnSeparate,
        clearance: `Clearance comes first. Stop the player before moving a mic; keep the mic, stand and cable out of ${o.clearWhat}, and never lean a boom toward the player or the instrument. Keep-clear areas appear as the mic gets close — in red, with the reason, if a move is stopped — and show roughly where to keep clear — leave more room for a real player.`,
        tendencies: o.learnTendencies,
      },
    },
    context: {
      variant: o.context.variant,
      zone: o.context.zone,
      typeId: 'sdcCard',
      patterns: pats,
      micNoun: 'A small condenser',
      shield: o.context.shield,
      azMax: 45,
      elMax: 30,
      aimBlurb: `Swing the front up to 45° either way — it still points at the ${n.one}.`,
      plan: o.context.plan,
      side: o.context.side,
      target: 'wedge',
      frontIds: o.context.frontIds,
      targetWord: 'wedge',
      looking: o.context.looking,
      prompt: `The wedge stays where the player needs it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — while the mic still points at the ${n.one}.`,
      activityDone: 'done — the wedge sat in a null by your aim or pattern',
      deepNull: `On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and often least at low frequencies. Use the null to aim, not to promise silence — and the ${n.one} can still reflect stage sound back into the mic.`,
      cardioidReveal: `What you just saw: a cardioid rejects most directly behind (180°). Aimed at the ${n.one}, its rear faces out toward the floor in front — near the wedge.`,
      shieldNote: `Moving a mic for isolation changes the ${n.one}’s tone, too: check both. Real patterns change with pitch and the stage reflects sound — this is the reasoning, not a prediction.`,
      studioId: o.context.studioId,
      studioPrompt: o.context.studioPrompt,
      studioNote: o.context.studioNote,
      learn: {
        intro: 'These are scenario-based comparisons, not restrictions: a close directional mic can suit a studio take, and a farther mic can suit a quiet stage.',
        points: o.context.points,
        body: o.context.body,
        warn: `No ${n.one}-mic position alone prevents feedback: the pattern, the other open mics, the monitors, the system level and the room all matter. If it starts, lower the level first, then change the geometry. Never create feedback deliberately — not as an exercise, not to “find” a frequency.`,
      },
    },
    twoMic: {
      variant: o.twoMic.variant,
      A: { typeId: 'sdcCard', pattern: 'cardioid', zone: o.twoMic.A },
      B: { typeId: 'sdcCard', pattern: 'cardioid', zone: o.twoMic.B },
      learn: o.twoMic.learn,
      warn: `Both mics hear the same ${n.one}, but from different spots, so this simplified graph shows only the timing part of the sum. The notch POSITIONS follow from the arrival-time difference; their DEPTH depends on the two levels, which this model takes from distance alone — read the depths as illustrative. Judge the pair by ear, in mono, at matched levels.`,
    },
    practice: { gain: `${o.practice.prefix}.prac.gain`, second: `${o.practice.prefix}.prac.3`, mixed: [`${o.practice.prefix}.mix.1`, `${o.practice.prefix}.mix.2`, `${o.practice.prefix}.mix.3`], mixedIntro: o.practice.mixedIntro },
    words: o.words,
  };
}
