/**
 * What a lesson's ART hands the engine's scene (blueprint §2: the engine
 * holds no instrument facts; the lesson supplies its look). Everything is in
 * millimetres of the view's (u, v) plane — side u = x, v = y; top u = x,
 * v = z — and is drawn under the scene's single transform.
 */
import type { ReactElement, ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import type { PageId, SettingItem, VariantId, Vec3, ViewId, Wedge } from '../model/types.ts';

/** `short`: the words to fall back to where the full label would collide.
 *  `alts`: other places it may sit (tried before the short form); `at`: the
 *  part's own point — a label moved away from it gets a thin leader to it
 *  (labelLayout.fitLabels; strings art pass 2026-10-05). `lead`: the same as
 *  `at` (the Lab 4 review's name for it).  */
export type ArtLabel = {
  id: string;
  text: string;
  short?: string;
  u: number;
  v: number;
  align: 'left' | 'center' | 'right';
  tone?: 'muted' | 'illustrative';
  alts?: readonly { u: number; v: number; align: 'left' | 'center' | 'right' }[];
  at?: { u: number; v: number };
  lead?: { u: number; v: number };
};

/** A rectangle in mm of a view's (u, v) plane. */
export type ViewRect = { u0: number; u1: number; v0: number; v1: number };

export type LessonArt = {
  /** The instrument (static; Skia elements in mm). */
  Instrument: (props: { view: ViewId; variant: VariantId }) => ReactElement;
  labels: (view: ViewId, variant: VariantId) => ArtLabel[];
  /** The part under a model point (u, v), `tol` in mm; null = none. */
  hitTest: (view: ViewId, variant: VariantId, u: number, v: number, tol: number) => string | null;
  /** Opt-in label manners (strings art pass 2026-10-05): rectangles (mm)
   *  the part labels keep off — the boxes of the recommended starting points
   *  the scene is showing (`shown`: their ids) — and whether a label fades
   *  while a mic sits under it (the lobe's tag also steps round the labels),
   *  so the words never hide the mic, a zone or a readout. A lesson that
   *  gives neither is unchanged. */
  labelObstacles?: (view: ViewId, variant: VariantId, shown: readonly string[]) => readonly ViewRect[];
  /** Opt-in: whether the drawn PLAYER figure covers (u, v) (mm, within
   *  `tol`) where the hit test does not name the player — the part labels
   *  keep off the figure too (artLabels.ts; players/playerPose.poseHit). */
  figureAt?: (view: ViewId, variant: VariantId, u: number, v: number, tol: number) => boolean;
  labelsYieldToMic?: boolean;
  /** HOW IT SOUNDS (LESSON_JOURNEY §6 stage 2): the strike sequence revealed
   *  by `reveal` (1 … n, a shared value: stepped, or played ONCE by the
   *  page), with `shown` (an integer, for the labels) … */
  StrikeSequence?: (props: { w: number; h: number; variant: VariantId; reveal: SharedValue<number>; shown: number; accessibilityLabel: string }) => ReactElement;
  /** … and the two heads coupled through the air, swung by hand. */
  CoupledHeads?: (props: { w: number; h: number; variant: VariantId; mode: 'together' | 'opposed'; swing: number; accessibilityLabel: string }) => ReactElement;
  /** THE SETTING: the lesson's drum on the shared kit plan (lessons/shared/
   *  KitPlan): its plan id, whether the lesson's own art draws it there (M01's
   *  kick), and where the lesson's frame origin sits on the plan (mm). */
  plan?: { own: string | readonly string[]; useArt?: boolean; offset?: Vec3 };
  /** A lesson's or family's OWN page for a page id, where the kick-shaped
   *  default does not fit its instrument (the speaker / Leslie module, tonbak,
   *  tabla; the hand drums; the guitar and bowed families). The host falls
   *  back to the shared page for every id not given. Typed loosely here (the
   *  page props live above the engine). */
  pages?: Partial<Record<PageId, (props: never) => ReactNode>>;
  /** Steps per page for those family pages (the strip's count before a page reports). */
  stepCounts?: Partial<Record<PageId, number>>;
  /** ORIENT's "What it is" figure, when the lesson's own drawing reads
   *  better than its side view (added 2026-10-05: a string instrument seen
   *  face-on). `render` draws it at (w, h); `aspect` = w ÷ h. */
  figure?: { aspect: number; render: (w: number, h: number) => ReactNode };
  /** THE SETTING for an instrument that does not sit on the kit (an
   *  orchestra's percussion, a hand drum): the lesson's own plan, drawn in
   *  place of the shared kit plan. Same contract as KitPlan. */
  SettingPlan?: (props: SettingPlanProps) => ReactElement;
};

/** What PSetting hands a lesson's own SettingPlan (the KitPlan contract). */
export type SettingPlanProps = {
  w: number;
  h: number;
  /** 'kit' = the instrument among its neighbours (the ensemble); 'stage' and
   *  'studio' as for the kit. */
  scene: 'kit' | 'stage' | 'studio';
  variant: VariantId;
  items: readonly SettingItem[];
  wedges: readonly Wedge[];
  highlight: string | null;
  onTap: (itemId: string) => void;
  accessibilityLabel: string;
};
