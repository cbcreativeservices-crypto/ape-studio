/**
 * What a lesson's ART hands the engine's scene (blueprint §2: the engine
 * holds no instrument facts; the lesson supplies its look). Everything is in
 * millimetres of the view's (u, v) plane — side u = x, v = y; top u = x,
 * v = z — and is drawn under the scene's single transform.
 */
import type { ReactElement, ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import type { PageId, VariantId, Vec3, ViewId } from '../model/types.ts';
import type { PageProps } from '../../pages/pageTypes';

/** `short`: the words to fall back to where the full label would collide. */
export type ArtLabel = { id: string; text: string; short?: string; u: number; v: number; align: 'left' | 'center' | 'right'; tone?: 'muted' | 'illustrative' };

export type LessonArt = {
  /** The instrument (static; Skia elements in mm). */
  Instrument: (props: { view: ViewId; variant: VariantId }) => ReactElement;
  labels: (view: ViewId, variant: VariantId) => ArtLabel[];
  /** The part under a model point (u, v), `tol` in mm; null = none. */
  hitTest: (view: ViewId, variant: VariantId, u: number, v: number, tol: number) => string | null;
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
  /** A lesson's OWN page for a page id, where the kick-shaped default does not
   *  fit its instrument (added 2026-10-05: the speaker / Leslie module, tonbak,
   *  tabla). The host falls back to the shared page for every id not given. */
  pages?: Partial<Record<PageId, (p: PageProps) => ReactNode>>;
  /** ORIENT's "What it is" figure, when the lesson's own drawing reads
   *  better than its side view (added 2026-10-05: a string instrument seen
   *  face-on). `render` draws it at (w, h); `aspect` = w ÷ h. */
  figure?: { aspect: number; render: (w: number, h: number) => ReactNode };
};
