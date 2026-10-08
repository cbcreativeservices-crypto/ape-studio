/**
 * F07 WILDLIFE AND DISTANT SOURCES — the look (charter §2 layer 3): the three
 * sites drawn by the field family's SiteArt, the setback rings, their labels
 * and hit areas, and the lesson's own pages. FULLY SILENT; nothing moves by
 * itself.
 */
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { hitTestOf, labelsOf, type SceneHits } from '../shared/measure/sceneHits.ts';
import { SiteArt } from '../shared/field/SiteArt';
import { BISON, EDGE_BIRD, FLOCK_LINE } from '../shared/field/sites.ts';
import { SETBACK } from '../shared/field/safety.ts';
import { F07_SITE } from './geometry.ts';
import { F07_PAGES, F07_STEP_COUNTS } from './pages';

function Site({ view, variant }: { view: ViewId; variant: VariantId }) {
  return <SiteArt site={variant === 'flock' ? F07_SITE.flock : variant === 'distant' ? F07_SITE.distant : F07_SITE.bird} view={view} />;
}

const B = ['bird'] as const;
const F = ['flock'] as const;
const D = ['distant'] as const;
const R = SETBACK.most.mm;
const HITS: SceneHits = {
  side: [
    { id: 'bird', u0: EDGE_BIRD.c[0] - 1200, u1: EDGE_BIRD.c[0] + 1200, v0: -EDGE_BIRD.h - 900, v1: -EDGE_BIRD.h + 700, variants: B },
    { id: 'brook', u0: -9200, u1: -6600, v0: 0, v1: 600, variants: B },
    { id: 'trail', u0: -4400, u1: -2800, v0: -40, v1: 70, variants: B },
    { id: 'flock', u0: FLOCK_LINE.x - 1600, u1: FLOCK_LINE.x + 1600, v0: -FLOCK_LINE.h - 900, v1: -FLOCK_LINE.h + 700, variants: F },
    { id: 'animal', u0: BISON.c[0] - 2200, u1: BISON.c[0] + 1500, v0: -2000, v1: 0, variants: D },
  ],
  top: [
    { id: 'bird', u0: EDGE_BIRD.c[0] - 900, u1: EDGE_BIRD.c[0] + 900, v0: -900, v1: 900, variants: B },
    { id: 'brook', u0: -9200, u1: -6600, v0: -19000, v1: 19000, variants: B },
    { id: 'trail', u0: -4400, u1: -2800, v0: -19000, v1: 19000, variants: B },
    { id: 'flock', u0: FLOCK_LINE.x - 5500, u1: FLOCK_LINE.x + 1500, v0: -3500, v1: 3500, variants: F },
    { id: 'hedge', u0: 36500, u1: 39500, v0: -24000, v1: 24000, variants: F },
    { id: 'animal', u0: BISON.c[0] - 2200, u1: BISON.c[0] + 2200, v0: -1500, v1: 1500, variants: D },
  ],
};

const LABELS = {
  side: [
    { id: 'bird', text: 'BIRD CALLING', short: 'BIRD', u: EDGE_BIRD.c[0], v: -EDGE_BIRD.h - 2600, align: 'center' as const, variants: B },
    { id: 'ring', text: 'SETBACK RING', short: 'RING', u: EDGE_BIRD.c[0] - R, v: -5000, align: 'left' as const, tone: 'muted' as const, variants: B },
    { id: 'brook', text: 'BROOK', u: -7900, v: 1150, align: 'center' as const, tone: 'muted' as const, variants: B },
    { id: 'flock', text: 'FLOCK', u: FLOCK_LINE.x, v: -FLOCK_LINE.h - 1600, align: 'center' as const, variants: F },
    { id: 'animal', text: 'LOW CALL, FAR OFF', short: 'ANIMAL', u: BISON.c[0], v: -3800, align: 'center' as const, variants: D },
  ],
  top: [
    { id: 'bird', text: 'BIRD', u: EDGE_BIRD.c[0], v: -2400, align: 'center' as const, variants: B },
    { id: 'ring', text: 'SETBACK RING · 25 YD', short: 'RING', u: EDGE_BIRD.c[0] - R + 600, v: 15500, align: 'left' as const, tone: 'muted' as const, variants: B },
    { id: 'trail', text: 'TRAIL', u: -3500, v: 17500, align: 'center' as const, tone: 'muted' as const, variants: B },
    { id: 'flock', text: 'FLOCK →', u: FLOCK_LINE.x, v: -4500, align: 'center' as const, variants: F },
    { id: 'hedge', text: 'HEDGEROW', u: 34800, v: 21500, align: 'right' as const, tone: 'muted' as const, variants: F },
    { id: 'animal', text: 'ANIMAL', u: BISON.c[0], v: -3600, align: 'center' as const, variants: D },
    { id: 'ring', text: 'SETBACK RING · 25 YD', short: 'RING', u: BISON.c[0] - R - 800, v: 26000, align: 'right' as const, tone: 'muted' as const, variants: D },
  ],
};

export const F07_ART: LessonArt = {
  Instrument: Site,
  labels: labelsOf(LABELS),
  hitTest: hitTestOf(HITS),
  labelsYieldToMic: true,
  pages: F07_PAGES,
  stepCounts: F07_STEP_COUNTS,
};
