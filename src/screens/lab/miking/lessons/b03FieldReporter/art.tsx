/**
 * B03 FIELD REPORTERS AND HANDHELD INTERVIEWS — the look (charter §2 layer
 * 3): the scene (scene.tsx: the guest and the reporter face to face, the
 * camera, the street, the local loudspeaker) and the lesson's own pages
 * (pages.tsx: MEET IT's one-mic interview and the wind; STARTING SETUPS'
 * routing and "before any mic").
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { B03Instrument, b03FigureAt, b03HitTest, b03Labels } from './scene';
import { B03_ZONES } from './model.ts';
import { B03_PAGES, B03_STEP_COUNTS } from './pages';
import { B03_HELD, V2, flagDrawLen } from './held';
import { HEAD_C, HEAD_R } from '../shared/voice/voiceSpec.ts';
import { REPORTER, SHOULDER_REP } from './geometry.ts';
import type { ViewBox } from '../../engine/model/types.ts';
import { aimVec } from '../../engine/geometry/vec.ts';
import { heldMicAt } from '../shared/figureV2/heldLive';

/** (figure V2) the labels also keep off both faces and the reporter's hand at the shared start (the new figures'
 *  outlines there are larger than the old envelope). Text and anchors unchanged. */
const ZONE_OBST = voiceLabelObstacles(B03_ZONES);
function b03Obstacles(view: 'side' | 'top', variant: string, shown: readonly string[]): ViewBox[] {
  const out = [...ZONE_OBST(view, variant, shown)];
  if (!V2) return out;
  for (const t of [{ x: 0, z: 0, f: 1 }, { x: REPORTER.lip.x, z: REPORTER.lip.z, f: -1 }]) {
    const back = t.x + t.f * (HEAD_C.x - HEAD_R - 20);
    const front = t.x + t.f * 30;
    const u0 = Math.min(back, front);
    const u1 = Math.max(back, front);
    out.push(view === 'side' ? { u0, u1, v0: HEAD_C.y - HEAD_R - 30, v1: 70 } : { u0, u1, v0: t.z - HEAD_R - 20, v1: t.z + HEAD_R + 20 });
  }
  const z = B03_ZONES.find((q) => q.id === 'b3.shared');
  if (z && variant !== 'twoMics') {
    const m = heldMicAt('s', z.start.p, aimVec(z.start.az, z.start.el), 230, 24, SHOULDER_REP, B03_HELD, 'repOmni');
    const fu = m.fist.x;
    const fv = view === 'side' ? m.fist.y : m.fist.z;
    out.push({ u0: fu - 85, u1: fu + 85, v0: fv - 85, v1: fv + 85 });
  }
  return out;
}

export const B03_ART: LessonArt = {
  Instrument: B03Instrument,
  labels: b03Labels,
  hitTest: b03HitTest,
  figureAt: b03FigureAt,
  labelObstacles: b03Obstacles,
  labelsYieldToMic: true,
  pages: B03_PAGES,
  stepCounts: B03_STEP_COUNTS,
  // (figure V2) the reporter holds the handheld themselves; the cardioid flag drawn longer at its tail
  ...(V2 ? { heldV2: B03_HELD, micDrawLen: flagDrawLen } : {}),
};
