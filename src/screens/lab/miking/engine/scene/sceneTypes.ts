/**
 * What a lesson's ART hands the engine's scene (blueprint §2: the engine
 * holds no instrument facts; the lesson supplies its look). Everything is in
 * millimetres of the view's (u, v) plane — side u = x, v = y; top u = x,
 * v = z — and is drawn under the scene's single transform.
 */
import type { ReactElement, ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import type { PageId, VariantId, ViewId } from '../model/types.ts';

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
  /** THE SETTING: the instrument's footprint on the kit plan (top view, mm). */
  plan?: { drum: { u0: number; u1: number; halfW: number }; pedal: { u0: number; u1: number; halfW: number } };
  /** A FAMILY's own page for a page id (the hand-drum family: no pedal, no
   *  front head, no kit plan). Pages not listed use the shared pages/. Typed
   *  loosely here (the page props live above the engine). */
  pages?: Partial<Record<PageId, (props: never) => ReactNode>>;
  /** Steps per page for those family pages (the strip's count before a page reports). */
  stepCounts?: Partial<Record<PageId, number>>;
};
