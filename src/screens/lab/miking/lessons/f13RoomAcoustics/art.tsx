/**
 * F13 ROOM ACOUSTICS AND REVERBERATION — the look (charter §2 layer 3): the
 * room in section and plan (RoomArt13), its part labels and hit areas, and
 * the lesson's own pages. FULLY SILENT; nothing moves by itself.
 */
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { hitTestOf, labelsOf, type SceneHits } from '../shared/measure/sceneHits.ts';
import { F13_FLOOR, PA13, ROOM13, ROWS, SRC_R } from './geometry.ts';
import { RoomArt13 } from './RoomArt';
import { F13_PAGES, F13_STEP_COUNTS } from './pages';

function Room({ view, variant }: { view: ViewId; variant: VariantId }) {
  return <RoomArt13 view={view} variant={variant} />;
}

const TOP = F13_FLOOR - ROOM13.ceiling;
const PA_TOP = F13_FLOOR - PA13.h - PA13.top;

const HITS: SceneHits = {
  side: [
    { id: 'src', u0: -SRC_R - 30, u1: SRC_R + 30, v0: -SRC_R - 30, v1: SRC_R + 30, variants: ['room'] },
    { id: 'pa', u0: PA13.x - PA13.depth - 200, u1: PA13.x + 60, v0: PA_TOP, v1: F13_FLOOR, variants: ['pa'] },
    { id: 'vent', u0: 3600, u1: 4400, v0: TOP - 90, v1: TOP + 80 },
    { id: 'door', u0: ROOM13.front - 80, u1: ROOM13.front + 160, v0: F13_FLOOR - 2100, v1: F13_FLOOR },
    { id: 'seats', u0: ROWS[0] - 250, u1: ROWS[ROWS.length - 1] + 320, v0: F13_FLOOR - 900, v1: F13_FLOOR },
  ],
  top: [
    { id: 'src', u0: -SRC_R - 30, u1: SRC_R + 30, v0: -SRC_R - 30, v1: SRC_R + 30, variants: ['room'] },
    { id: 'pa', u0: PA13.x - PA13.depth - 200, u1: PA13.x + 60, v0: -PA13.z - 200, v1: -PA13.z + 200, variants: ['pa'] },
    { id: 'curtains', u0: 1500, u1: 7600, v0: ROOM13.half - 170, v1: ROOM13.half },
    { id: 'door', u0: ROOM13.front - 1100, u1: ROOM13.front + 160, v0: ROOM13.door.z0, v1: ROOM13.door.z1 },
    { id: 'seats', u0: ROWS[0] - 240, u1: ROWS[ROWS.length - 1] + 270, v0: -2950, v1: 2950 },
  ],
};

const LABELS = {
  side: [
    { id: 'src', text: 'OMNI TEST SOURCE', short: 'SOURCE', u: 0, v: TOP + 520, align: 'center' as const, at: { u: 0, v: -SRC_R }, variants: ['room'] },
    { id: 'pa', text: 'INSTALLED PA', short: 'PA', u: PA13.x + 500, v: TOP + 520, align: 'left' as const, at: { u: PA13.x, v: PA_TOP }, variants: ['pa'] },
    { id: 'vent', text: 'AIR VENT', u: 4000, v: TOP + 420, align: 'center' as const, at: { u: 4000, v: TOP + 80 } },
    // Above the receivers' ear height, between the rows and the door: never
    // under the receiver's ring (owner decision X6, 2026-10-08).
    { id: 'seats', text: 'SEATS', u: 5650, v: F13_FLOOR - 2400, align: 'center' as const, at: { u: 5650, v: F13_FLOOR - 900 } },
    { id: 'door', text: 'DOOR', u: ROOM13.front - 500, v: F13_FLOOR - 2600, align: 'right' as const, at: { u: ROOM13.front - 40, v: F13_FLOOR - 2100 } },
  ],
  top: [
    { id: 'src', text: 'OMNI TEST SOURCE', short: 'SOURCE', u: 0, v: -900, align: 'center' as const, at: { u: 0, v: -SRC_R }, variants: ['room'] },
    { id: 'pa', text: 'INSTALLED PA', short: 'PA', u: PA13.x, v: -1700, align: 'center' as const, at: { u: PA13.x - 150, v: -PA13.z + 200 }, variants: ['pa'] },
    { id: 'curtains', text: 'CURTAINS', u: 1200, v: ROOM13.half - 600, align: 'right' as const, at: { u: 1500, v: ROOM13.half - 120 } },
    { id: 'seats', text: 'SEATS', u: 1300, v: 0, align: 'right' as const, at: { u: ROWS[0] - 240, v: 0 } },
  ],
};

export const F13_ART: LessonArt = {
  Instrument: Room,
  labels: labelsOf(LABELS),
  hitTest: hitTestOf(HITS),
  labelsYieldToMic: true,
  pages: F13_PAGES,
  stepCounts: F13_STEP_COUNTS,
};
