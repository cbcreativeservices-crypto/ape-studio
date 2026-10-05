/**
 * M09 DRUM OVERHEADS — the look: the whole kit (lessons/shared/kitScene),
 * drawn from the shared drum and cymbal families, with the swing envelopes
 * the overheads keep clear of; the lesson's own pages. The engine's scene
 * draws the mics, booms, zones and lobes over it.
 */
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { KitSide, KitTop, kitHitTest, kitLabels } from '../shared/kitScene/KitSceneArt';
import { M09_PAGES } from './pages';

export function OverheadsArt({ view }: { view: ViewId; variant: VariantId }) {
  return <Group>{view === 'side' ? <KitSide swing /> : <KitTop />}</Group>;
}

export const M09_ART: LessonArt = {
  Instrument: OverheadsArt,
  labels: (view) => kitLabels(view),
  hitTest: (view, _variant, u, v, tol) => kitHitTest(view, u, v, tol),
  // The overheads' reference on the kit plan: the snare (ringed).
  plan: { own: 'snare' },
  pages: M09_PAGES,
};
