/**
 * B10 SIDELINE AND POST-EVENT INTERVIEWS — the look (charter §2 layer 3):
 * the scene (scene.tsx: the sideline, two handhelds, the post-event mark)
 * and the lesson's own pages (pages.tsx: MEET IT's handoff and open mics;
 * STARTING SETUPS' routing — the return, the crowd and the cues).
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { voiceLabelObstacles } from '../shared/voice/VoiceArt';
import { B10Instrument, b10FigureAt, b10HitTest, b10Labels, reporterFist } from './scene';
import { HEAD_C, HEAD_R } from '../shared/voice/voiceSpec.ts';
import { REPORTER } from './geometry.ts';
import type { ViewBox } from '../../engine/model/types.ts';
import { B10_ZONES } from './model.ts';
import { B10_PAGES, B10_STEP_COUNTS } from './pages';
import { B10_HELD, V2, flagDrawLen } from './held';

/** (figure V2) the labels also keep off the faces and the reporter's hand on the handheld (its start): the new
 *  figures' outlines there are larger than the old envelope. Text and anchors unchanged. */
const ZONE_OBST = voiceLabelObstacles(B10_ZONES);
function b10Obstacles(view: 'side' | 'top', variant: string, shown: readonly string[]): ViewBox[] {
  const out = [...ZONE_OBST(view, variant, shown)];
  if (!V2) return out;
  const head = (lipX: number, lipZ: number) => (view === 'side' ? { u0: lipX + HEAD_C.x - HEAD_R - 20, u1: lipX + 30, v0: HEAD_C.y - HEAD_R - 30, v1: 70 } : { u0: lipX + HEAD_C.x - HEAD_R - 20, u1: lipX + 30, v0: lipZ - HEAD_R - 20, v1: lipZ + HEAD_R + 20 });
  out.push(head(0, 0));
  if (view === 'top') out.push(head(REPORTER.lip.x, REPORTER.lip.z));
  if (variant === 'sideline' || variant === 'twoMics') {
    const f = reporterFist();
    const fu = f.x;
    const fv = view === 'side' ? f.y : f.z;
    out.push({ u0: fu - 85, u1: fu + 85, v0: fv - 85, v1: fv + 85 });
  }
  return out;
}

export const B10_ART: LessonArt = {
  Instrument: B10Instrument,
  labels: b10Labels,
  hitTest: b10HitTest,
  figureAt: b10FigureAt,
  labelObstacles: b10Obstacles,
  labelsYieldToMic: true,
  pages: B10_PAGES,
  stepCounts: B10_STEP_COUNTS,
  // (figure V2) the guest and the reporter hold their handhelds themselves; the flag drawn longer at its tail
  // (FrontBoom3: B10_HELD.front, set in scene.tsx, paints the boom operator's fists again over the engine's pole)
  ...(V2 ? { heldV2: B10_HELD, micDrawLen: flagDrawLen } : {}),
};
