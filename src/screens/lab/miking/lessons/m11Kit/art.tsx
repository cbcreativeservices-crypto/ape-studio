/**
 * M11 COMPLETE DRUM-KIT SETUPS — the look: the whole kit (lessons/shared/
 * kitScene) from the shared drum and cymbal families; the lesson's own pages.
 */
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { KitSide, KitTop, kitHitTest, kitLabels } from '../shared/kitScene/KitSceneArt';
import { M11_PAGES } from './pages';

export function WholeKitArt({ view }: { view: ViewId; variant: VariantId }) {
  return <Group>{view === 'side' ? <KitSide swing /> : <KitTop />}</Group>;
}

export const M11_ART: LessonArt = {
  Instrument: WholeKitArt,
  labels: (view) => kitLabels(view),
  hitTest: (view, _variant, u, v, tol) => kitHitTest(view, u, v, tol),
  // Every drum is "its own" here: none is ringed on the kit plan.
  plan: { own: 'none' },
  pages: M11_PAGES,
};
