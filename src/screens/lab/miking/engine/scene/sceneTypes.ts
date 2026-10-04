/**
 * What a lesson's ART hands the engine's scene (blueprint §2: the engine
 * holds no instrument facts; the lesson supplies its look). Everything is in
 * millimetres of the view's (u, v) plane — side u = x, v = y; top u = x,
 * v = z — and is drawn under the scene's single transform.
 */
import type { ReactElement } from 'react';
import type { VariantId, ViewId } from '../model/types.ts';

/** `short`: the words to fall back to where the full label would collide. */
export type ArtLabel = { id: string; text: string; short?: string; u: number; v: number; align: 'left' | 'center' | 'right'; tone?: 'muted' | 'illustrative' };

export type LessonArt = {
  /** The instrument (static; Skia elements in mm). */
  Instrument: (props: { view: ViewId; variant: VariantId }) => ReactElement;
  labels: (view: ViewId, variant: VariantId) => ArtLabel[];
  /** The part under a model point (u, v), `tol` in mm; null = none. */
  hitTest: (view: ViewId, variant: VariantId, u: number, v: number, tol: number) => string | null;
};
