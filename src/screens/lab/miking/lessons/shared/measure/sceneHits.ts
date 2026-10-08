/**
 * Hit areas and part labels for a measurement scene, from rectangles the
 * lesson's geometry gives per view (mm on the view's u, v). Pure — the art
 * passes them to the engine (LessonArt.labels / hitTest), and the label
 * tests run them in node. The first rectangle that holds the point wins, so
 * list a small part before the large one behind it.
 */
import type { VariantId, ViewId } from '../../../engine/model/types.ts';
import type { ArtLabel } from '../../../engine/scene/sceneTypes.ts';

export type HitRect = { id: string; u0: number; u1: number; v0: number; v1: number; variants?: readonly VariantId[] };
export type SceneHits = Readonly<Record<ViewId, readonly HitRect[]>>;

export function hitTestOf(hits: SceneHits) {
  return (view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null => {
    for (const r of hits[view] ?? []) {
      if (r.variants && !r.variants.includes(variant)) continue;
      if (u >= Math.min(r.u0, r.u1) - tol && u <= Math.max(r.u0, r.u1) + tol && v >= Math.min(r.v0, r.v1) - tol && v <= Math.max(r.v0, r.v1) + tol) return r.id;
    }
    return null;
  };
}

export type LabelSpec = ArtLabel & { variants?: readonly VariantId[] };
export function labelsOf(specs: Readonly<Record<ViewId, readonly LabelSpec[]>>) {
  return (view: ViewId, variant: VariantId): ArtLabel[] => (specs[view] ?? []).filter((l) => !l.variants || l.variants.includes(variant)).map(({ variants: _v, ...l }) => l);
}
