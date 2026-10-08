/**
 * LESSON COPY — the words a page prints that belong to ONE instrument (the
 * kick's "front head", the snare's "snares on", the toms' "rack pair"). The
 * pages are shared by every lesson (blueprint §7); before Lab 1's second
 * lesson they carried the kick's words inline. Each lesson now supplies its
 * own (`Lesson.copy`); a lesson that has none gets the NEUTRAL drum words
 * below — never another instrument's.
 *
 * Learner-facing, so the starting-points voice (owner ruling 2026-10-04,
 * charter §12) applies: no source, brand or model names, no badges. Pinned by
 * test/mikingLearnerText.test.ts (lesson data walk). Pure data; no React.
 */
import type { MicPattern, MicPose, MountKind, PatternId, VariantId, Vec3, ViewBox, ViewId } from './types.ts';

/** One of HOW IT SOUNDS step 3's two motions (`together` / `opposed`). */
export type PairMode = {
  /** The PAIR option and its blurb. */
  option: string;
  blurb: string;
  /** The dock's value word and the card's title. */
  short: string;
  title: string;
  card: string;
  /** The first two bezel values (keys in PairCopy.cells). */
  v0: string;
  sub0?: string;
  v1: string;
  /** The third cell, by the swing's sign (AT REST near zero). */
  air: { plus: string; minus: string; rest: string };
};
/** HOW IT SOUNDS step 3's words (see LessonCopy.sound.pair). */
export type PairCopy = {
  title: string;
  badge: string;
  looking: string;
  prompt: string;
  /** The dock key ("PAIR"). */
  key: string;
  /** The fader's words at rest. */
  rest: string;
  cells: readonly [string, string, string];
  together: PairMode;
  opposed: PairMode;
};

/** A strike-sequence bezel cell: its value at each event (index = event − 1). */
export type CopyCell = { k: string; at: readonly string[]; byVariant?: Readonly<Partial<Record<VariantId, readonly string[]>>>; flex?: number };
/** The words for one POSITION axis on the dock (placementDock). */
export type AxisWords = { plus: string; minus: string; label: string; blurb: string };
export type StrikePoint = { id: string; label: string; mm: number; blurb: string };

export type LessonCopy = {
  /** The variant choice's key on the dock and in SETUP ("FRONT HEAD"). */
  variantKey: string;
  /** Short words for the variant in landing lines ("ported front head"). */
  variantShort: Readonly<Partial<Record<VariantId, string>>>;
  /** The scene's subject in words, per variant ("a 22 × 18 in kick with a ported front head"). */
  sceneSubject: Readonly<Partial<Record<VariantId, string>>>;
  /** The tag in each view's corner ("SIDE · CUTAWAY"). */
  viewTag: Readonly<Record<ViewId, string>>;
  /** POSITION lane words; `origin` (per variant) is where the lane's numbers start. */
  axes: { x: AxisWords; y: AxisWords; z: AxisWords; surfaceY?: string; origin?: Readonly<Partial<Record<VariantId, Vec3>>> };
  instrument: {
    figureBadge: string;
    figureLabel: string;
    partsBadge: string;
    partsLooking: Readonly<Record<ViewId, string>>;
    /** The well when no part is chosen. */
    partsIdle: string;
    variantNotes: Readonly<Partial<Record<VariantId, string>>>;
  };
  sound: {
    strikes: readonly StrikePoint[];
    strikeDefault: string;
    /** The strike mark's word on the face-on head ("BEATER"). */
    striker: string;
    /** In a sentence ("the beater"). */
    strikerPhrase: string;
    /** The cutaway in words, for the screen reader ("Side view of the kick, cut open"). */
    subject: string;
    looking: Readonly<Partial<Record<VariantId, string>>>;
    cells: readonly CopyCell[];
    /** After the sequence reached its end, with a prediction made. */
    reveal: string;
    /** After the sequence reached its end. */
    after: string;
    shapesNotes: readonly string[];
    coupledSubject: string;
    coupledNote: string;
    silentNote: string;
    /** HOW IT SOUNDS step 3 for an instrument that is not two heads round
     *  one air (a kettle under one head, a frame with jingles): the step's
     *  words. None = the two-headed drum's words (PSound's TWO_HEADS). */
    pair?: PairCopy;
    /** Step 2's shape card, when the lesson's shapes are not the ideal
     *  membrane's (a timpani's kettle): `{ratio}` is filled in. */
    shapeWords?: { lowest: string; other: string; ratioSub: string; badge?: string };
  };
  setting: {
    kitA11y: string;
    kitLanding: string;
    kitIdle: string;
    leftHanded: string;
    stageA11y: string;
    studioA11y: string;
    stageIdle: string;
    studioIdle: string;
    before: readonly { title: string; text: string }[];
    /** The plan's words for an instrument that is not on the kit (a lesson
     *  with its own SettingPlan). None = the kit's words. */
    plan?: {
      title: string;
      badge: string;
      looking: string;
      stageBadge: string;
      studioBadge: string;
      stageLooking: string;
      studioLooking: string;
      widePrompt: string;
    };
  };
  placement: {
    /** The worked example's zone, per variant. */
    workedZone: Readonly<Partial<Record<VariantId, string>>>;
    /** "OFF THE LINE" step, when the zone names a line. */
    workedLine: string;
    workedAim: string;
    workedClear: string;
    /** When a stand mic is stopped, per variant. */
    blocked: Readonly<Partial<Record<VariantId, string>>>;
    reveal: string;
    typeNotes: Readonly<Partial<Record<string, string>>>;
    note: string;
    /** "Starting points for this mic and head" (before the list). */
    availableLead: string;
    learn: { intro: string; separate: string; clearance: string; tendencies: string };
  };
  context: {
    variant?: VariantId;
    zone: string;
    typeId: string;
    patterns: readonly { id: PatternId; label: string; typeId: string }[];
    /** A dynamic of this pattern ("A kick dynamic"). */
    micNoun: string;
    shield: readonly string[];
    azMax: number;
    elMax: number;
    aimBlurb: string;
    plan: ViewBox;
    side: ViewBox;
    /** The source to null for credit. */
    target: string;
    /** Sources a pattern cannot reach (their note is shown as a warning). */
    frontIds: readonly string[];
    targetWord: string;
    /** Owner 2026-10-08 (L7F): the live badge's loudspeaker words, the
     *  lesson's own ("the PA where the venue hangs it"). Default: "monitors
     *  where a stage often puts them". */
    badgeWhere?: string;
    looking: string;
    prompt: string;
    activityDone: string;
    deepNull: string;
    cardioidReveal: string;
    shieldNote: string;
    studioId: string;
    studioPrompt: string;
    studioNote: string;
    learn: { intro: string; points: readonly { title: string; text: string }[]; body: string; warn: string };
  };
  twoMic: {
    variant?: VariantId;
    /** The pair's name on STARTING SETUPS (default: its two zones' labels). */
    label?: string;
    A: { typeId: string; pattern: MicPattern; zone: string };
    B: { typeId: string; pattern: MicPattern; zone?: string; pose?: MicPose };
    /** Mics on OPPOSITE sides of this surface face heads that move the same
     *  way: one hears a push while the other hears a pull (the lowest,
     *  heads-together motion). The comb then acts inverted. */
    opposite?: { surface: string; note: string };
    learn: readonly string[];
    warn: string;
  };
  practice: { gain: string; second: string; mixed: readonly string[]; mixedIntro: string };
  /** How a mic inside / outside the interior is said to the screen reader
   *  (default: the family words; a hand drum: "below / above the heads"). */
  where?: { inside: string; outside: string };
  /** The screen reader's opening words per view (default: the family words,
   *  "Side view, cutaway," / "Top view") — a drum drawn whole, not cut open,
   *  says "Side view,". */
  viewWords?: Readonly<Record<ViewId, string>>;
  /** The instrument family's words where a shared page would otherwise say
   *  "drum" (added with the guitar family; the drum words are the default). */
  words?: Partial<FamilyWords>;
  /** The bowed strings' words (same purpose, its own names). Folded into
   *  `words` by copyOf (termsToWords); the fields `words` has no slot for
   *  (startIntro, startNew, refTitle, otherRef, noAim) are read as terms. */
  terms?: LessonTerms;
};

export type FamilyWords = {
  /** "the drum itself", "faces the drum" */
  instrument: string;
  /** "the drummer stopped" */
  player: string;
  /** The surface a distance is read from, in the worked example ("THE HEAD"). */
  reference: string;
  /** Where a mic is, for the screen reader. */
  inside: string;
  outside: string;
  /** "aimed 10° off the head's axis" (screen reader). */
  axis: string;
  /** The context page's AIM lane at its home. */
  facing: string;
  /** The context page's PICKUP cell when the instrument blocks the path. */
  shield: string;
  /** The microphone page's mount lines. */
  mountStand: string;
  mountClip: string;
  /** The practice page's optional observation sheet. */
  sheet: string;
  /** The canvas description's view words. */
  viewSide: string;
  viewTop: string;
  /* The keyboard and harp lessons' page words (miking-c4), all optional:
   * absent = each page's own words. */
  /** ORIENT, START: the lesson's opening paragraph. */
  intro?: string;
  /** ORIENT, START: the note once NEW is chosen. */
  newNote?: string;
  /** MICROPHONES: the mount line, per mount (wins over mountStand / mountClip). */
  mount?: Readonly<Partial<Record<MountKind, string>>>;
  /** PLACEMENT, worked example: THE SURFACE ({head} = its label). */
  workedHead?: string;
  /** PLACEMENT, worked example: THE AIM when the zone names none. */
  workedNoAim?: string;
  /** STUDIO OR LIVE: what lies in the path (the SHIELDED cell) — `shield`'s other name. */
  inPath?: string;
};

export type LessonTerms = {
  /** "the instrument" — "inside / outside the instrument" in the scene words. */
  instrument: string;
  /** What a mic's aim is read against ("the bridge"): "aimed 20° off <aimRef>". */
  aimRef: string;
  /** START: what the lesson covers first ("first the instrument itself: …"). */
  startIntro: string;
  /** START, the NEW path's note. */
  startNew: string;
  /** PLACEMENT's worked example: the second piece's title ("THE HEAD"). */
  refTitle: string;
  /** … and its sentence after "The distance is measured from X." */
  otherRef: string;
  /** … when the starting point gives no aim. */
  noAim: string;
  /** MICROPHONES: a clip mount's and a stand mount's plain line. */
  clipMount: string;
  standMount: string;
  /** STUDIO OR LIVE: the instrument in the path, and the aim at rest. */
  inPath: string;
  facing: string;
  /** PRACTICE: the optional observation sheet. */
  observation: string;
};

/** The bowed family's terms as family words (one vocabulary for the pages). */
export function termsToWords(t: LessonTerms): Partial<FamilyWords> {
  return {
    instrument: t.instrument.replace(/^the /, ''),
    inside: `inside ${t.instrument}`,
    outside: `outside ${t.instrument}`,
    axis: t.aimRef,
    facing: t.facing,
    shield: t.inPath,
    mountStand: t.standMount,
    mountClip: t.clipMount,
    sheet: t.observation,
  };
}

export const DRUM_WORDS: FamilyWords = {
  instrument: 'drum',
  player: 'drummer',
  reference: 'head',
  inside: 'inside the drum',
  outside: 'outside the drum',
  axis: 'the head’s axis',
  facing: 'facing the head',
  shield: 'drum in path',
  mountStand: 'Mount: a stand or a suitable mount, kept off the heads and damping',
  mountClip: 'Mount: clamps to the drum’s hoop — a clamp made for it, with the player’s agreement',
  sheet: 'For a real instrument, with the player’s agreement and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
  viewSide: 'Side view, cutaway,',
  viewTop: 'Top view',
};

const NEUTRAL_AXES: LessonCopy['axes'] = {
  x: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the player (x).' },
  y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). Distances are read from the head the zone names.' },
  z: { plus: 'to player’s right', minus: 'to player’s left', label: 'ACROSS', blurb: 'Toward the player’s left or right (z).' },
};

/** Neutral drum words for a lesson that brings no copy (never another
 *  instrument's). Lists that need lesson data are empty: a page without
 *  them shows nothing rather than another drum's numbers. */
export const NEUTRAL_COPY: LessonCopy = {
  variantKey: 'SETUP',
  variantShort: {},
  sceneSubject: {},
  viewTag: { side: 'SIDE', top: 'TOP' },
  axes: NEUTRAL_AXES,
  instrument: {
    figureBadge: 'The drum, drawn to scale',
    figureLabel: 'The drum, drawn from the side.',
    partsBadge: 'Tap a part to name it',
    partsLooking: { side: 'Side view', top: 'Top view' },
    partsIdle: 'Tap a part to see what it is and what it does.',
    variantNotes: {},
  },
  sound: {
    strikes: [{ id: 'c', label: 'CENTRE', mm: 0, blurb: 'The exact centre of the head.' }],
    strikeDefault: 'c',
    striker: 'STRIKE',
    strikerPhrase: 'the strike',
    subject: 'Side view of the drum',
    looking: {},
    cells: [],
    reveal: '',
    after: 'Then the heads spring back and keep ringing for a while — the BODY of the sound.',
    shapesNotes: ['A shape is set moving only as much as the head moves at the strike point in that shape. At the exact centre, every shape with a still line across the head stands still — so a centre strike drives only the ring-shaped ones.'],
    coupledSubject: 'Side view of the drum',
    coupledNote: 'One strike sets both going; the sound you hear is the two together.',
    silentNote: 'This lab never plays a sound and draws no frequency curve for the drum. The pictures show where the sound comes from and where it leaves.',
  },
  setting: {
    kitA11y: 'The drum kit from above.',
    kitLanding: 'Tap anything around the drum — or step through ITEM. There is nothing to answer yet.',
    kitIdle: 'Everything around the drum is either the player’s space or a loud neighbour.',
    leftHanded: 'Left-handed players set the kit up mirrored.',
    stageA11y: 'The kit on a stage, from above.',
    studioA11y: 'The kit in a studio room, from above.',
    stageIdle: 'Floor monitors feed the players; the PA faces the audience.',
    studioIdle: 'No monitors on the floor. The room itself is part of the picture now.',
    before: [],
  },
  placement: {
    workedZone: {},
    workedLine: 'This starting point also places the mic relative to a reference line, drawn dashed.',
    workedAim: 'Face the mic toward the head it is measured from.',
    workedClear: 'Clear of every part. Clearance comes first, before any number, and the player stops before a real mic moves.',
    blocked: {},
    reveal: '',
    typeNotes: {},
    note: 'Clearance comes first: stop the player before moving a real mic.',
    availableLead: 'Starting points for this mic here',
    learn: {
      intro: 'After our research, each blue zone is where we suggest you begin with that kind of mic, measured from the head it names. They are starting points, not rules.',
      separate: 'Height, distance and angle are separate variables: change one at a time.',
      clearance: 'Clearance comes first. Stop the player before moving a mic.',
      tendencies: 'Tonal changes are tendencies to check by ear.',
    },
  },
  context: {
    zone: '',
    typeId: '',
    patterns: [],
    micNoun: 'A dynamic',
    shield: [],
    azMax: 45,
    elMax: 30,
    aimBlurb: 'Swing the front either way.',
    plan: { u0: -1000, u1: 1000, v0: -1000, v1: 1000 },
    side: { u0: -1000, u1: 1000, v0: -600, v1: 400 },
    target: '',
    frontIds: [],
    targetWord: 'source',
    looking: 'Top view',
    prompt: 'Turn the mic or change its pattern until the unwanted source sits in the rejection.',
    activityDone: 'done — the source sat in a null by your aim or pattern',
    deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence.',
    cardioidReveal: 'What you just saw: a cardioid rejects most directly behind (180°).',
    shieldNote: 'Real patterns change with pitch and the stage reflects sound — this is the reasoning, not a prediction.',
    studioId: '',
    studioPrompt: 'A studio session has no wedge to reject. The decision changes: what is the room worth?',
    studioNote: 'In the studio, repeated trials are practical when the performer stops.',
    learn: { intro: 'These are scenario-based comparisons, not restrictions.', points: [], body: '', warn: 'No mic position alone prevents feedback. Never create feedback deliberately.' },
  },
  twoMic: {
    A: { typeId: '', pattern: 'cardioid', zone: '' },
    B: { typeId: '', pattern: 'cardioid' },
    learn: [],
    warn: 'Judge the pair by ear, in mono, at matched levels.',
  },
  practice: { gain: '', second: '', mixed: [], mixedIntro: 'Cards from earlier pages, mixed.' },
  words: DRUM_WORDS,
};

/** The lesson's copy over the neutral words (one level deep per section). */
export function copyOf(lesson: { copy?: Partial<LessonCopy> }): LessonCopy & { words: FamilyWords } {
  const c = lesson.copy;
  if (!c) return { ...NEUTRAL_COPY, words: DRUM_WORDS };
  return {
    ...NEUTRAL_COPY,
    ...c,
    axes: { ...NEUTRAL_COPY.axes, ...(c.axes ?? {}) },
    instrument: { ...NEUTRAL_COPY.instrument, ...(c.instrument ?? {}) },
    sound: { ...NEUTRAL_COPY.sound, ...(c.sound ?? {}) },
    setting: { ...NEUTRAL_COPY.setting, ...(c.setting ?? {}) },
    placement: { ...NEUTRAL_COPY.placement, ...(c.placement ?? {}) },
    context: { ...NEUTRAL_COPY.context, ...(c.context ?? {}) },
    twoMic: { ...NEUTRAL_COPY.twoMic, ...(c.twoMic ?? {}) },
    practice: { ...NEUTRAL_COPY.practice, ...(c.practice ?? {}) },
    words: { ...DRUM_WORDS, ...(c.terms ? termsToWords(c.terms) : {}), ...(c.words ?? {}), ...(c.words?.inPath ? { shield: c.words.inPath } : {}) },
    ...(c.terms ? { terms: c.terms } : {}),
  };
}
