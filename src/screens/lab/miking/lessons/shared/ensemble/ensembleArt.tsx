/**
 * An ensemble as the engine's LessonArt: the seating drawn in the engine's
 * two views ('top' = the plan in the conductor's view, 'side' = the stage
 * from the hall), its labels said as the conductor faces the players, and a
 * hit test that names the section (the part id the engine model uses:
 * ensembleModel.sectionPartId). Every Lab 5 ensemble lesson's art is
 *
 *   { ...ensembleLessonArt({ american: seatingOf('orch.american'), … }),
 *     pages: makeEnsemblePages(spec), stepCounts: ENSEMBLE_STEP_COUNTS }
 */
import type { ArtLabel, LessonArt } from '../../../engine/scene/sceneTypes.ts';
import type { VariantId, ViewId } from '../../../engine/model/types.ts';
import type { Seating } from './seating.ts';
import { SeatingView } from './SeatingArt';
import { stageHit, stageLabels } from './stageLabels.ts';
import { sectionPartId } from './ensembleModel.ts';

const sv = (view: ViewId) => (view === 'top' ? ('plan' as const) : ('front' as const));

export function ensembleLessonArt(byVariant: Readonly<Record<VariantId, Seating>>): LessonArt {
  const first = Object.values(byVariant)[0];
  const of = (v: VariantId) => byVariant[v] ?? first;
  return {
    Instrument: ({ view, variant }) => <SeatingView seating={of(variant)} view={sv(view)} />,
    labels: (view: ViewId, variant: VariantId): ArtLabel[] => stageLabels(of(variant), sv(view)).filter((l) => l.id !== 'cond'),
    hitTest: (view, variant, u, v, tol) => {
      const id = stageHit(of(variant), sv(view), u, v, tol);
      return id ? sectionPartId(variant, id === 'cond' ? 'podium' : id) : null;
    },
  };
}
