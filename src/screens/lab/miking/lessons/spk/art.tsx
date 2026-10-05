/**
 * SPEAKER CABINET & LESLIE MODULE — the art the engine's placement scene
 * draws with (one LessonArt per cabinet; the shared speaker family draws it).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import { CabSection } from '../shared/speakers/SpeakerArt';
import { cabHitTest, cabLabels } from '../shared/speakers/cabLabels.ts';
import type { CabKind } from '../shared/speakers/speakerModel.ts';
import type { Back } from '../shared/speakers/cabGeometry.ts';

const backOf = (v: VariantId): Back => (v === 'open' ? 'open' : 'closed');

const made = new Map<CabKind, LessonArt>();

/** The placement scene's art for one cabinet (variant = its back). */
export function cabArt(kind: CabKind): LessonArt {
  let a = made.get(kind);
  if (!a) {
    a = {
      Instrument: ({ view, variant }: { view: ViewId; variant: VariantId }) => <CabSection kind={kind} back={backOf(variant)} view={view} />,
      labels: (view, variant) => cabLabels(kind, backOf(variant), view),
      hitTest: (view, variant, u, v, tol) => cabHitTest(kind, backOf(variant), view, u, v, tol),
    };
    made.set(kind, a);
  }
  return a;
}
