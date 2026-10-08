/**
 * F12 SOUND LEVEL AND ENVIRONMENTAL NOISE — the look (charter §2 layer 3):
 * the site in section and in plan (SiteArt), its part labels and hit areas,
 * the meter's "What it is" figure, and the lesson's own pages. FULLY SILENT;
 * nothing moves by itself.
 */
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { hitTestOf, labelsOf, type SceneHits } from '../shared/measure/sceneHits.ts';
import { MeterOnTripod, METER_FIGURE_ASPECT } from '../shared/measure/MeterFigure';
import { F12_VIEWS, HOUSE, HVAC, POWER, ROAD } from './geometry.ts';
import { SiteArt } from './SiteArt';
import { F12_PAGES, F12_STEP_COUNTS } from './pages';

function Site({ view }: { view: ViewId; variant: VariantId }) {
  return <SiteArt view={view} />;
}

const HITS: SceneHits = {
  side: [
    { id: 'facade', u0: -260, u1: 0, v0: -HOUSE.eaves, v1: 0 },
    { id: 'house', u0: HOUSE.x0 - 300, u1: HOUSE.x1 + 300, v0: -HOUSE.ridge, v1: 0 },
    { id: 'hvac', u0: HVAC.x0, u1: HVAC.x1, v0: -HVAC.h - 70, v1: 0 },
    { id: 'power', u0: POWER.x - 750, u1: POWER.x + 750, v0: -POWER.h - 900, v1: 0 },
    { id: 'road', u0: ROAD.x0 - 160, u1: F12_VIEWS.side.u1, v0: -140, v1: 140 },
    { id: 'lawn', u0: F12_VIEWS.side.u0, u1: ROAD.x0, v0: -60, v1: 300 },
  ],
  top: [
    { id: 'facade', u0: -260, u1: 0, v0: HOUSE.z0, v1: HOUSE.z1 },
    { id: 'house', u0: HOUSE.x0 - 300, u1: HOUSE.x1 + 250, v0: HOUSE.z0 - 300, v1: HOUSE.z1 + 300 },
    { id: 'hvac', u0: HVAC.x0, u1: HVAC.x1, v0: HVAC.z0, v1: HVAC.z1 },
    { id: 'power', u0: POWER.x - 200, u1: POWER.x + 200, v0: F12_VIEWS.top.v0, v1: F12_VIEWS.top.v1 },
    { id: 'road', u0: ROAD.x0 - 160, u1: F12_VIEWS.top.u1, v0: F12_VIEWS.top.v0, v1: F12_VIEWS.top.v1 },
  ],
};

const LABELS = {
  side: [
    { id: 'house', text: 'HOUSE', u: -5200, v: -8400, align: 'center' as const, at: { u: -4200, v: -7300 } },
    { id: 'facade', text: 'FACADE', u: 900, v: -6400, align: 'left' as const, at: { u: 0, v: -5200 } },
    { id: 'hvac', text: 'AIR UNIT', u: 1400, v: -2200, align: 'left' as const, at: { u: 900, v: -950 } },
    { id: 'power', text: 'POWER LINE · KEEP 3 M (10 FT) AWAY', short: 'POWER LINE', u: POWER.x, v: -POWER.h - 3500, align: 'center' as const },
    { id: 'road', text: 'ROAD', u: 9000, v: -900, align: 'center' as const, at: { u: 9000, v: -100 } },
  ],
  top: [
    { id: 'house', text: 'HOUSE', u: -3500, v: HOUSE.z1 + 900, align: 'center' as const, at: { u: -3500, v: HOUSE.z1 + 250 } },
    { id: 'hvac', text: 'AIR UNIT', u: 2400, v: -6400, align: 'left' as const, at: { u: HVAC.x1, v: HVAC.z0 } },
    { id: 'power', text: 'POWER LINE', u: 5200, v: 4300, align: 'right' as const, at: { u: POWER.x - 200, v: 4300 } },
    { id: 'road', text: 'ROAD', u: 5200, v: -6400, align: 'right' as const, at: { u: ROAD.x0 + 300, v: -6400 } },
  ],
};

export const F12_ART: LessonArt = {
  Instrument: Site,
  labels: labelsOf(LABELS),
  hitTest: hitTestOf(HITS),
  labelsYieldToMic: true,
  figure: { aspect: METER_FIGURE_ASPECT, render: (w, h) => <MeterOnTripod w={w} h={h} label="A sound level meter on its tripod, its foam windscreen over the capsule, the capsule 1.5 metres above the ground — the height one highway method names." /> },
  pages: F12_PAGES,
  stepCounts: F12_STEP_COUNTS,
};
