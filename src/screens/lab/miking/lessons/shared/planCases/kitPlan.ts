/** Plan cases: the shared kit plan (KitPlan / CymbalSettingPlan) — every
 *  Lab 1 / Lab 2 kit lesson's stage and studio, with each lesson's own
 *  wedges (M02's in its own frame, moved by its offset) and, for the splash
 *  and China lessons, each setup's own cymbal drawn over the kit. */
import { lessonById } from '../../../data/lessons.ts';
import type { Vec3 } from '../../../engine/model/types.ts';
import { cueCables } from '../monitoring/cueMix.ts';
import { AUDIENCE_MARK, fxFoot, kitCue, kitPlanFoots, KITPLAN_ROOM, KITPLAN_STAGE, type FxOwn } from '../kitPlanLayout.ts';
import { S0_KIT } from '../../m02Snare/model.ts';
import type { PlanCase } from './types.ts';

type KitLesson = { id: string; offset?: Vec3; fx?: { own: FxOwn; variants: string[] } };

const LESSONS: KitLesson[] = [
  { id: 'M01' },
  { id: 'M02', offset: S0_KIT },
  { id: 'M03' },
  { id: 'M09' },
  { id: 'M11' },
  { id: 'I01a' },
  { id: 'I01b' },
  { id: 'I01c' },
  { id: 'I01d', fx: { own: 'splash', variants: ['arm', 'piggy'] } },
  { id: 'I01e', fx: { own: 'china', variants: ['upright', 'inverted'] } },
];

export function kitPlanCases(): PlanCase[] {
  const out: PlanCase[] = [];
  for (const L of LESSONS) {
    const lesson = lessonById(L.id);
    if (!lesson) continue;
    const variants: (string | undefined)[] = L.fx ? L.fx.variants : [undefined];
    for (const variant of variants) {
      const extra = L.fx && variant ? [fxFoot(L.fx.own, variant)] : [];
      const performers = [{ id: 'drummer', group: 'kit' }];
      const audience = { axis: 'u' as const, dir: 1 as const, lip: KITPLAN_STAGE.lipU, kind: 'direction' as const, marks: [AUDIENCE_MARK] };
      out.push({ lesson: L.id, scene: 'stage', family: 'kitPlan', variant, audience, foots: kitPlanFoots('stage', lesson.live.wedges, L.offset, extra), cables: [], cue: [], performers });
      const cue = kitCue();
      out.push({ lesson: L.id, scene: 'studio', family: 'kitPlan', variant, room: KITPLAN_ROOM, foots: kitPlanFoots('studio', lesson.live.wedges, L.offset, extra), cables: cueCables(cue), cue: [cue], performers });
    }
  }
  return out;
}
