/**
 * The SIDE / TOP view key — shown only where pressing it changes the picture
 * (owner 2026-10-06, Pixel: "some displays showed both above and side views
 * but in full screen some of the view buttons didn't matter because the items
 * were going to be shown in the display no matter what. Useless buttons
 * should just be hidden.").
 *
 *   • A model with ONE view (no side or no top box): no key at all.
 *   • A DualView stage (`stage: 'dual'`): the glass shows one view with the
 *     other as an inset, so the key works there; FULL SCREEN shows both views
 *     at once, so the key is hidden there (rackTypes `hideInFull`).
 *   • A single-view stage (`stage: 'single'`: one PlacementScene, a plan,
 *     a custom drawing that follows `view`): the key works everywhere.
 *
 * Every Miking view key goes through here (test/mikingViewToggle.test.ts).
 */
import type { DockParam } from '../../../rack/rackTypes';
import type { InstrumentModel, VariantId, ViewBox, ViewId } from '../model/types.ts';
import { viewsOf } from '../model/types.ts';

export type ViewStage = 'dual' | 'single';

/** Whether a model draws both views in this variant. */
export function hasBothViews(model: InstrumentModel, variant: VariantId): boolean {
  const v: { side?: ViewBox; top?: ViewBox } = viewsOf(model, variant);
  return !!v.side && !!v.top;
}

/** The view key (0 or 1 params). `labels`: [side, top] words for the key. */
export function viewToggle(o: { view: ViewId; setView: (f: (v: ViewId) => ViewId) => void; stage: ViewStage; both?: boolean; labels?: readonly [string, string] }): DockParam[] {
  if (o.both === false) return [];
  const [side, top] = o.labels ?? ['SIDE VIEW', 'TOP VIEW'];
  return [
    {
      kind: 'toggle',
      id: 'view',
      label: o.view === 'side' ? side : top,
      value: o.view === 'top',
      onToggle: () => o.setView((v) => (v === 'side' ? 'top' : 'side')),
      ...(o.stage === 'dual' ? { hideInFull: true } : {}),
    },
  ];
}
