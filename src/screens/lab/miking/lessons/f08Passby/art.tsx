/**
 * F08 MOVING SOURCES AND PASS-BYS — the look (charter §2 layer 3): the
 * walking route and the vehicle paper plan drawn by the field family's
 * SiteArt, their labels and hit areas, the boom operator for the tracked
 * shotgun (the shared figure, lessons/shared/fieldmics), and the lesson's
 * own pages. FULLY SILENT; nothing moves by itself.
 */
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { hitTestOf, labelsOf, type SceneHits } from '../shared/measure/sceneHits.ts';
import { PoleOperatorArt } from '../shared/fieldmics/FieldMicArt';
import { SiteArt } from '../shared/field/SiteArt';
import { CREW_LINE_X, ROUTE_X, VEH_X } from '../shared/field/sites.ts';
import { F08_SITE } from './geometry.ts';
import { F08_PAGES, F08_STEP_COUNTS } from './pages';

function Site({ view, variant }: { view: ViewId; variant: VariantId }) {
  return <SiteArt site={variant === 'vehicle' ? F08_SITE.vehicle : F08_SITE.walk} view={view} />;
}

const W = ['walk'] as const;
const V = ['vehicle'] as const;
const HITS: SceneHits = {
  side: [
    { id: 'walker', u0: ROUTE_X - 400, u1: ROUTE_X + 400, v0: -1800, v1: 0, variants: W },
    { id: 'path', u0: ROUTE_X - 1000, u1: ROUTE_X + 1000, v0: -40, v1: 70, variants: W },
    { id: 'cones', u0: ROUTE_X - 1400, u1: ROUTE_X - 1000, v0: -700, v1: 0, variants: W },
    { id: 'vehicle', u0: VEH_X - 2200, u1: VEH_X + 2200, v0: -1500, v1: 0, variants: V },
    { id: 'route', u0: VEH_X - 3000, u1: VEH_X + 3000, v0: 0, v1: 170, variants: V },
    { id: 'barrier', u0: CREW_LINE_X - 160, u1: CREW_LINE_X + 160, v0: -1000, v1: 0, variants: V },
  ],
  top: [
    { id: 'walker', u0: ROUTE_X - 400, u1: ROUTE_X + 400, v0: -9400, v1: -8600, variants: W },
    { id: 'cones', u0: ROUTE_X - 1450, u1: ROUTE_X - 950, v0: -250, v1: 250, variants: W },
    { id: 'path', u0: ROUTE_X - 1000, u1: ROUTE_X + 1000, v0: -16500, v1: 16500, variants: W },
    { id: 'vehicle', u0: VEH_X - 1000, u1: VEH_X + 1000, v0: -16300, v1: -11700, variants: V },
    { id: 'barrier', u0: CREW_LINE_X - 150, u1: CREW_LINE_X + 150, v0: -22000, v1: 22000, variants: V },
    { id: 'route', u0: VEH_X - 3000, u1: VEH_X + 3000, v0: -23000, v1: 23000, variants: V },
  ],
};

const LABELS = {
  side: [
    { id: 'path', text: 'WALKING ROUTE', short: 'ROUTE', u: ROUTE_X, v: 700, align: 'center' as const, variants: W },
    { id: 'route', text: 'CLOSED ROUTE · PAPER PLAN', short: 'ROUTE', u: VEH_X, v: 800, align: 'center' as const, variants: V },
    { id: 'barrier', text: 'CREW LINE', u: CREW_LINE_X, v: -1500, align: 'center' as const, tone: 'muted' as const, variants: V },
  ],
  top: [
    { id: 'path', text: 'ROUTE · CLOSED TO TRAFFIC', short: 'ROUTE', u: ROUTE_X + 1300, v: 14500, align: 'left' as const, variants: W },
    { id: 'cones', text: 'CLOSEST POINT', short: 'CLOSEST', u: ROUTE_X - 1500, v: 1300, align: 'right' as const, tone: 'muted' as const, variants: W },
    { id: 'route', text: 'CLOSED ROUTE · PAPER PLAN', short: 'PAPER PLAN', u: VEH_X + 3200, v: 20000, align: 'left' as const, variants: V },
    { id: 'barrier', text: 'CREW SETBACK LINE', short: 'CREW LINE', u: CREW_LINE_X - 400, v: 20000, align: 'right' as const, tone: 'muted' as const, variants: V },
  ],
};

export const F08_ART: LessonArt = {
  Instrument: Site,
  labels: labelsOf(LABELS),
  hitTest: hitTestOf(HITS),
  labelsYieldToMic: true,
  PoleOperator: PoleOperatorArt,
  pages: F08_PAGES,
  stepCounts: F08_STEP_COUNTS,
};
