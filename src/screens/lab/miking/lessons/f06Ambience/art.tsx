/**
 * F06 NATURAL AND URBAN AMBIENCE — the look (charter §2 layer 3): the two
 * sites drawn by the field family's SiteArt (lessons/shared/field) in plan
 * and in section, their part labels and hit areas, and the lesson's own
 * pages (pages.tsx). FULLY SILENT; nothing moves by itself.
 */
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { hitTestOf, labelsOf, type SceneHits } from '../shared/measure/sceneHits.ts';
import { SiteArt } from '../shared/field/SiteArt';
import { PLAZA, PLAZA_KERB_X, STREAM_BANK_X, WOODS_BIRDS } from '../shared/field/sites.ts';
import { F06_SITE } from './geometry.ts';
import { F06_PAGES, F06_STEP_COUNTS } from './pages';

function Site({ view, variant }: { view: ViewId; variant: VariantId }) {
  return <SiteArt site={variant === 'plaza' ? F06_SITE.plaza : F06_SITE.woodland} view={view} />;
}

const W = ['woodland'] as const;
const P = ['plaza'] as const;
const bird = (c: readonly [number, number], r = 900) => ({ u0: c[0] - r, u1: c[0] + r, v0: c[1] - r, v1: c[1] + r });

const HITS: SceneHits = {
  side: [
    { id: 'birds', u0: WOODS_BIRDS.a.c[0] - 700, u1: WOODS_BIRDS.a.c[0] + 700, v0: -WOODS_BIRDS.a.h - 700, v1: -WOODS_BIRDS.a.h + 500, variants: W },
    { id: 'birds', u0: WOODS_BIRDS.b.c[0] - 700, u1: WOODS_BIRDS.b.c[0] + 700, v0: -WOODS_BIRDS.b.h - 700, v1: -WOODS_BIRDS.b.h + 500, variants: W },
    { id: 'stream', u0: STREAM_BANK_X - 300, u1: STREAM_BANK_X + 3300, v0: -200, v1: 600, variants: W },
    { id: 'path', u0: -2400, u1: -800, v0: -150, v1: 150, variants: W },
    { id: 'canopy', u0: -9000, u1: 16000, v0: -17000, v1: -3500, variants: W },
    { id: 'floor', u0: -9000, u1: 16000, v0: 0, v1: 1400, variants: W },
    { id: 'facade', u0: -11000, u1: PLAZA.facadeX, v0: -12000, v1: 0, variants: P },
    { id: 'cafe', u0: PLAZA.cafe.x0, u1: PLAZA.cafe.x1, v0: -2800, v1: 0, variants: P },
    { id: 'sidewalk', u0: PLAZA.sidewalk.x0, u1: PLAZA.sidewalk.x1, v0: -200, v1: 100, variants: P },
    { id: 'road', u0: PLAZA_KERB_X, u1: 17000, v0: -3200, v1: 200, variants: P },
    { id: 'paving', u0: PLAZA.facadeX, u1: PLAZA.sidewalk.x0, v0: -100, v1: 1400, variants: P },
  ],
  top: [
    { id: 'birds', ...bird(WOODS_BIRDS.a.c), variants: W },
    { id: 'birds', ...bird(WOODS_BIRDS.b.c), variants: W },
    { id: 'stream', u0: STREAM_BANK_X - 200, u1: STREAM_BANK_X + 3000, v0: -11000, v1: 11000, variants: W },
    { id: 'path', u0: -2400, u1: -800, v0: -11000, v1: 11000, variants: W },
    { id: 'canopy', u0: 9000, u1: 16000, v0: -11000, v1: 11000, variants: W },
    { id: 'floor', u0: -9000, u1: 16000, v0: -11000, v1: 11000, variants: W },
    { id: 'walkway', u0: PLAZA.walkway.x0, u1: PLAZA.walkway.x1, v0: PLAZA.walkway.z0, v1: PLAZA.walkway.z1, variants: P },
    { id: 'cafe', u0: PLAZA.cafe.x0, u1: PLAZA.cafe.x1, v0: PLAZA.cafe.z0, v1: PLAZA.cafe.z1, variants: P },
    { id: 'facade', u0: -11000, u1: PLAZA.facadeX, v0: -13500, v1: 11500, variants: P },
    { id: 'sidewalk', u0: PLAZA.sidewalk.x0, u1: PLAZA.sidewalk.x1, v0: -13500, v1: 11500, variants: P },
    { id: 'road', u0: PLAZA_KERB_X, u1: 17000, v0: -13500, v1: 11500, variants: P },
    { id: 'paving', u0: PLAZA.facadeX, u1: PLAZA.sidewalk.x0, v0: -13500, v1: 11500, variants: P },
  ],
};

const LABELS = {
  side: [
    { id: 'stream', text: 'STREAM', u: STREAM_BANK_X + 1200, v: 1150, align: 'center' as const, variants: W },
    { id: 'path', text: 'PATH', u: -1600, v: 900, align: 'center' as const, tone: 'muted' as const, variants: W },
    { id: 'birds', text: 'BIRD CALLING', short: 'BIRD', u: WOODS_BIRDS.a.c[0], v: -WOODS_BIRDS.a.h - 1500, align: 'center' as const, variants: W },
    { id: 'facade', text: 'FACADE', u: PLAZA.facadeX - 300, v: -12600, align: 'right' as const, variants: P },
    { id: 'road', text: 'ROAD', u: 12500, v: 900, align: 'center' as const, variants: P },
    { id: 'cafe', text: 'CAFÉ', u: 200, v: -3300, align: 'center' as const, tone: 'muted' as const, variants: P },
  ],
  top: [
    { id: 'stream', text: 'STREAM', u: STREAM_BANK_X + 1300, v: -9800, align: 'center' as const, variants: W },
    { id: 'path', text: 'PATH', u: -1600, v: 9800, align: 'center' as const, tone: 'muted' as const, variants: W },
    { id: 'birdA', text: 'BIRD', u: WOODS_BIRDS.a.c[0], v: WOODS_BIRDS.a.c[1] - 1700, align: 'center' as const, variants: W },
    { id: 'birdB', text: 'BIRD', u: WOODS_BIRDS.b.c[0], v: WOODS_BIRDS.b.c[1] + 1800, align: 'center' as const, variants: W },
    { id: 'facade', text: 'FACADE', u: PLAZA.facadeX - 900, v: 9500, align: 'right' as const, variants: P },
    { id: 'road', text: 'ROAD', u: 12500, v: 10200, align: 'center' as const, variants: P },
    { id: 'sidewalk', text: 'SIDEWALK', short: 'WALK', u: 7500, v: -12400, align: 'center' as const, tone: 'muted' as const, variants: P },
    { id: 'cafe', text: 'CAFÉ', u: 200, v: -6800, align: 'center' as const, variants: P },
    { id: 'walkway', text: 'WALKWAY', u: -6500, v: -6000, align: 'center' as const, tone: 'muted' as const, variants: P },
  ],
};

export const F06_ART: LessonArt = {
  Instrument: Site,
  labels: labelsOf(LABELS),
  hitTest: hitTestOf(HITS),
  labelsYieldToMic: true,
  pages: F06_PAGES,
  stepCounts: F06_STEP_COUNTS,
};
