/**
 * THE FOLEY FAMILY'S PAGE WORDS (engine/model/copy.ts) — shared by F01–F04
 * (and later Foley lessons): the lesson hands in what is its own (the worked
 * starting points, the live start, the pair, the sound words, the "before
 * any mic" points, the studio card), the rest is the family's. Starting-
 * points voice (owner ruling 2026-10-04 and the wording rule of 2026-10-07:
 * suggested, possible starting points; "your ears and the room"; now and
 * then "Experimentation is encouraged."). No sources, brands or badges.
 * Pure data.
 */
import type { LessonCopy } from '../../../engine/model/copy.ts';
import type { MicPose, ViewBox } from '../../../engine/model/types.ts';

export type FoleyCopyOpts = {
  /** "footsteps" — what the lesson mics, for the sentences. */
  what: string;
  /** The variant key ("SURFACE", "ACTION", "PROP"). */
  variantKey: string;
  variantShort: LessonCopy['variantShort'];
  sceneSubject: LessonCopy['sceneSubject'];
  axesBlurb?: string;
  instrument: LessonCopy['instrument'];
  sound: LessonCopy['sound'];
  before: LessonCopy['setting']['before'];
  /** The worked example per variant. */
  worked: LessonCopy['placement']['workedZone'];
  /** The live variant and the live start the Studio-or-live page begins from. */
  live: { variant: string; zone: string; typeId: string; patterns?: LessonCopy['context']['patterns']; micNoun?: string; plan: ViewBox; side: ViewBox; looking: string; prompt: string; points: LessonCopy['context']['learn']['points']; cardioidReveal: string; shieldNote: string };
  studio: { id: string; prompt: string; note: string };
  /** The two-mic page's pair. */
  pair: { variant: string; A: { typeId: string; zone: string }; B: { typeId: string; zone?: string; pose?: MicPose }; label?: string; learn: readonly string[]; warn: string };
  practice: LessonCopy['practice'];
  startIntro: string;
  /** What distances are read from ("the middle of the steps"). */
  ref: string;
  /** The reference's words for the worked example. */
  otherRef: string;
  /** Placement's tendencies and reveal for this lesson. */
  reveal: string;
  tendencies: string;
  typeNotes?: LessonCopy['placement']['typeNotes'];
  /** "the walker", "the artist". */
  performer: string;
};

export function foleyCopy(o: FoleyCopyOpts): Partial<LessonCopy> {
  return {
    variantKey: o.variantKey,
    variantShort: o.variantShort,
    sceneSubject: o.sceneSubject,
    viewTag: { side: 'SIDE · A CUT THROUGH THE ACTION', top: 'FROM ABOVE' },
    axes: {
      x: { plus: 'out toward the mics', minus: `toward ${o.performer}`, label: 'IN–OUT', blurb: `Out from ${o.performer} toward the mics, or back (x). Distances are read from ${o.ref}.` },
      y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: o.axesBlurb ?? 'Up or down (y). Height changes the angle down onto the action as well as the distance.' },
      z: { plus: 'to the performer’s right', minus: 'to the performer’s left', label: 'ACROSS', blurb: 'Toward the performer’s right or left (z).' },
    },
    instrument: o.instrument,
    sound: o.sound,
    setting: {
      kitA11y: 'A Foley stage.',
      kitLanding: 'Tap anything on the stage. There is nothing to answer yet.',
      kitIdle: 'Everything round the performer is either their movement or something the mic can hear.',
      leftHanded: '',
      stageA11y: 'A live Foley booth.',
      studioA11y: 'A Foley stage room.',
      stageIdle: 'The PA and a wedge share the room with the Foley mic.',
      studioIdle: 'A quiet room: the room itself is part of what a farther mic hears.',
      before: o.before,
    },
    placement: {
      workedZone: o.worked,
      workedLine: 'This starting point is also read against {line}: the readout says how far the mic is outside it.',
      workedAim: 'Aim at the action — the lab counts it while the mic points within about {tol}° of it. Distance, height and angle are separate things to try.',
      workedClear: 'Clear of the whole movement first: the mic, its stand, its base and its cable stay outside every keep-out, and the performer stops before any hardware moves. Clearance comes before any number.',
      blocked: {},
      reveal: o.reveal,
      typeNotes: {
        shotgunShort: 'Ideas to try with the short shotgun: aim its front at the action and listen as you turn it a little — off its axis the tone changes. In a live, reflective room it still hears the room; compare it with the small supercardioid at the same place.',
        scSupercard: 'Ideas to try with the small supercardioid: smoother off its axis, so it can often sit a little closer or cover a wider moving area. Compare it with the shotgun at the same distance, at matched level.',
        ldcRoom: 'Ideas to try with the large condenser: as the second, farther mic — the room round the action, on its own channel.',
        ...(o.typeNotes ?? {}),
      },
      note: 'Clearance comes first: walk the cue without recording, mark the movement on the floor, and stop the performer before moving any hardware. Experimentation is encouraged — one change at a time.',
      availableLead: 'Starting points for this mic',
      learn: {
        intro: `What you just did, in words. After our research, each blue zone is a suggested, possible place to begin with that kind of mic on ${o.what}, measured from ${o.ref} to the mic’s capsule. They are starting points, not rules: move from there and listen — your ears and the room decide, and there is no single right answer.`,
        separate: 'Distance, aim and height are separate variables: change one at a time, with the same shoe, surface, performer and action. Distances are read to the capsule — on a shotgun that is at the back of its tube, not at its grille — and rounded to about 5 mm below 1 m and more coarsely above it, with feet from 3 m, so no millimetre claim is made.',
        clearance: 'Clearance comes first. The mic, stand, base and cable stay outside the whole movement and the exit path — keep-clear areas appear as the mic gets close, in red with the reason if a move is stopped. Leave more room for a real performer.',
        tendencies: o.tendencies,
      },
    },
    context: {
      variant: o.live.variant,
      zone: o.live.zone,
      typeId: o.live.typeId,
      patterns: o.live.patterns ?? [
        { id: 'supercardioid', label: 'supercardioid (the shotgun’s base)', typeId: 'shotgunShort' },
        { id: 'cardioid', label: 'cardioid', typeId: 'scSupercard' },
      ],
      micNoun: o.live.micNoun ?? 'A short shotgun',
      shield: [],
      azMax: 60,
      elMax: 60,
      aimBlurb: 'Swing the front up to 60° either way — it still faces the action.',
      plan: o.live.plan,
      side: o.live.side,
      target: 'wedge',
      frontIds: [],
      targetWord: 'wedge',
      looking: o.live.looking,
      prompt: o.live.prompt,
      activityDone: 'done — the wedge sat in a null by your aim or pattern',
      deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and often least at low frequencies — and a shotgun’s rejection changes with pitch. Use the null to aim, not to promise silence.',
      cardioidReveal: o.live.cardioidReveal,
      shieldNote: o.live.shieldNote,
      studioId: o.studio.id,
      studioPrompt: o.studio.prompt,
      studioNote: o.studio.note,
      learn: {
        intro: 'These are scenario-based comparisons, not restrictions: the same action, a quiet Foley stage or a live theatre with a PA.',
        points: o.live.points,
        body: 'In a live room every open mic also hears the PA and the wedges. Aim the pattern’s rejection at the loudest one, keep the mic close enough, and keep the open channels few.',
        warn: 'No mic position alone prevents feedback: the PA, the wedges, the channel gain, the room and the open mics all matter — check them with the system operator at the intended level. Never create feedback deliberately, not as a demonstration and not to “find” a frequency.',
      },
    },
    twoMic: {
      variant: o.pair.variant,
      ...(o.pair.label ? { label: o.pair.label } : {}),
      A: { typeId: o.pair.A.typeId, pattern: 'supercardioid', zone: o.pair.A.zone },
      B: { typeId: o.pair.B.typeId, pattern: 'cardioid', ...(o.pair.B.zone ? { zone: o.pair.B.zone } : {}), ...(o.pair.B.pose ? { pose: o.pair.B.pose } : {}) },
      learn: o.pair.learn,
      warn: o.pair.warn,
    },
    practice: o.practice,
    terms: {
      instrument: 'the performer',
      aimRef: 'the line to the action',
      startIntro: o.startIntro,
      startNew: 'Good — NEXT takes you through the action and the stage first. You can change how you started here at any time.',
      refTitle: 'MEASURED FROM',
      otherRef: o.otherRef,
      noAim: 'This starting point gives no aim, so the mic simply faces the action. Distance, height and angle are still separate things to try.',
      clipMount: 'Mount: not used here — Foley mics stay off the performer and the props',
      standMount: 'Mount: a heavy stand with a shock mount, its base and cable outside the movement and the exit path',
      inPath: 'body in path',
      facing: 'facing the action',
      observation: 'For a real session, with the performer’s agreement and the performer stopped while any hardware moves. Write tendencies in words — what you heard, not a promised result.',
    },
    words: {
      mount: {
        stand: 'Mount: a heavy stand with a shock mount, its base and cable outside the movement and the exit path',
        pole: 'Mount: a boom pole held by an operator outside the movement — the pole, the operator and the cable clear of the performer',
      },
    },
  };
}
