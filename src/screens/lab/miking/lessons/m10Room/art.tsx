/**
 * M10 DRUM ROOM MICROPHONES — the lesson's art for the engine: the room
 * around the kit (RoomArt.tsx) and the lesson's own pages.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { RoomArt, roomHitTest, roomLabels } from './RoomArt';
import { M10_PAGES } from './pages';

export const M10_ART: LessonArt = {
  Instrument: RoomArt,
  labels: roomLabels,
  hitTest: roomHitTest,
  // No drum of its own is ringed on the kit plan.
  plan: { own: 'none' },
  pages: M10_PAGES,
};
