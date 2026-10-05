/**
 * HAND-DRUM FAMILY — what a hand-drum lesson supplies ON TOP of the engine's
 * Lesson (engine/model/types.ts), for the family's own pages
 * (shared/handdrums/pages/*). It rides on the lesson object as `hand`, so
 * the learner-text test walks it with the rest of the lesson data. Pure data.
 */
import type { Lesson, MicPattern, MicPose, VariantId, ViewId } from '../../../engine/model/types.ts';
import type { LessonCopy } from '../../../engine/model/copy.ts';
import type { HandDrum } from './handDrumModel.ts';

/** A hand-drum scene in words (each lesson's geometry.ts): the subject per
 *  setup, the view tags, POSITION's axes ("86 cm above base": `plus` /
 *  `minus` and the point measured `from`), and inside / outside. */
export type HandWords = {
  subject: Partial<Record<VariantId, string>>;
  viewTag: Record<ViewId, string>;
  axes: Record<'x' | 'y' | 'z', { label: string; blurb: string; plus: string; minus: string; from: string }>;
  where: { inside: string; outside: string };
};

/** The lesson's copy (engine/model/copy.ts) from its scene words. The pages
 *  the family shares with the kit drums (microphone, troubleshoot, practice)
 *  read the practice ids; the family's own pages carry their words in `hand`. */
export function handCopy(w: HandWords): Partial<LessonCopy> {
  const ax = (a: HandWords['axes']['x']) => ({ label: a.label, blurb: a.blurb, plus: `${a.plus} ${a.from}`, minus: `${a.minus} ${a.from}` });
  return {
    sceneSubject: w.subject,
    viewTag: w.viewTag,
    axes: { x: ax(w.axes.x), y: ax(w.axes.y), z: ax(w.axes.z) },
    where: w.where,
    // The drums are drawn whole, not cut open.
    viewWords: { side: 'Side view,', top: 'Top view,' },
    practice: {
      gain: 'k.prac.gain',
      second: 'k.prac.3',
      mixed: ['k.mix.1', 'k.mix.2', 'k.mix.3'],
      mixedIntro: 'Three cards from earlier pages, mixed: a reference head, a pattern’s null, and polarity versus delay.',
    },
  };
}

/** One way of striking, on the head seen from above (HOW IT SOUNDS). `frac`
 *  = how far from the centre the strike lands (0 centre … 1 edge) — a
 *  drawing position for a sourced description ("near the center", "closer to
 *  the edge"); null = not on the head (a rim or a metal shell). */
export type StrokeSpec = { id: string; label: string; short: string; frac: number | null; tool: 'palm' | 'fingers' | 'tips' | 'stick'; text: string; /** Which of the set's drums (HandExtra.drums), when not the main one. */ drum?: string };

/** One neighbour on THE SETTING's plan (positions ILLUSTRATIVE; `prov` is on
 *  the matching SettingItem). */
export type PlanThing = {
  id: string;
  kind: 'kit' | 'amp' | 'perc' | 'micstand' | 'wedge' | 'sidefill' | 'audience' | 'room' | 'player' | 'drums' | 'keys';
  u: number;
  v: number;
  /** Facing (plan radians from +x) for wedges / fills / amps. */
  face?: number;
  scene: 'all' | 'stage' | 'studio';
};

/** A two-mic preset on the TWO MICROPHONES page. */
export type PairSpec = {
  id: string;
  label: string;
  blurb: string;
  variant?: VariantId;
  A: { typeId: string; pattern: MicPattern; pose: MicPose };
  B: { typeId: string; pattern: MicPattern; pose: MicPose };
  /** The region id the paths are drawn from by default. */
  source: string;
};

export type HandExtra = {
  /** The drum drawn on HOW IT SOUNDS (one of the set). */
  drum: HandDrum;
  /** The set's other drums by id (a stroke can name one). */
  drums?: Record<string, HandDrum>;
  shellLook: 'staved' | 'brass' | 'goblet';
  headLook: 'rawhide' | 'goat' | 'film';
  /** What strikes the head: hands (congas, bongos, djembe) or sticks (timbales). */
  tool: 'hand' | 'stick';
  /** The SETUP option's title for the variants ("SETUP", "MOUNT", "POSTURE"). */
  variantKey: string;
  /** ORIENT: the large figure on "What it is". */
  figure: { view: ViewId; badge: string; label: string };
  partsBadge: string;
  partsPrompt: string;
  partsNote: string;
  /** HOW IT SOUNDS, step 1's own sentence for where sound leaves, per variant. */
  soundBadge: string;
  /** The head's shapes step: which drum's head, and the word for the strike mark. */
  faceLabel: string;
  strikeWord: string;
  face: { kind: 'crown' | 'rope'; lugs: number };
  /** The face step's strike positions (fractions of the radius; drawing positions). */
  facePoints: readonly { id: string; label: string; frac: number; blurb: string }[];
  /** Whether the open lower end is clear of the floor, per variant (the bezel's OPEN END). */
  openEnd: Partial<Record<VariantId, boolean>> & { default: boolean };
  /** HOW IT SOUNDS, step 3: where the hand or stick lands. */
  strokes: { title: string; intro: string; badge: string; items: readonly StrokeSpec[]; note: string; /** The dock's label (default STROKE). */ key?: string };
  /** HOW IT SOUNDS, step 4's prediction-reveal line (after the strike sequence). */
  soundReveal: string;
  /** THE SETTING. */
  plan: { box: { u0: number; u1: number; v0: number; v1: number }; things: readonly PlanThing[]; badge: string; looking: string; prompt: string; intro: string; label: string };
  before: { ask: string; asIs: string };
  /** PLACEMENT: the worked example's zone per variant, the free step's start zone. */
  worked: Partial<Record<VariantId, string>> & { default: string };
  clearWords: string;
  ideas: Partial<Record<string, string>>;
  placeLearn: readonly string[];
  /** STUDIO OR LIVE: the mic's start, the drum it faces. */
  context: { pose: MicPose; looking: string; prompt: string; learn: readonly { title: string; text: string }[]; closing: string };
  /** TWO MICROPHONES. */
  pairs: readonly PairSpec[];
  pairLearn: readonly string[];
  pairWarn: string;
};

export type HandLesson = Lesson & { hand: HandExtra };

export function handOf(lesson: Lesson): HandExtra {
  const h = (lesson as Partial<HandLesson>).hand;
  if (!h) throw new Error(`lesson ${lesson.id} is not a hand-drum lesson`);
  return h;
}
