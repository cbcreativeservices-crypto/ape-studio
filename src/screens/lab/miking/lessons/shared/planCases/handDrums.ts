/**
 * Plan cases: the shared band plan (handdrums/HandPlan) — the hand drums
 * (M04a–M05), the small-percussion stations (I02–I05d) and the mallet bars
 * (I07–I10); every lesson × scene × setup (the lesson's own art changes its
 * footprint with the setup).
 */
import { lessonById } from '../../../data/lessons.ts';
import type { Lesson } from '../../../engine/model/types.ts';
import { cueCables } from '../monitoring/cueMix.ts';
import type { HandLesson } from '../handdrums/family.ts';
import type { SpLesson } from '../smallperc/family.ts';
import type { PlanThing } from '../handdrums/family.ts';
import { handPlanFoots, modelArtPlan, planCue, planPerformers, planRoom, type ArtPlan, type PlanBox, type PlanCueSpec } from '../handdrums/handPlanModel.ts';
import { malletArtPlan } from '../mallets/malletPlanModel.ts';
import type { MalletFamily } from '../mallets/malletModel.ts';
import { VIBE_PLAN } from '../../i07Vibraphone/plan.ts';
import { MARIMBA_PLAN } from '../../i08Marimba/plan.ts';
import { XYLO_PLAN } from '../../i09Xylophone/plan.ts';
import { GLOCK_PLAN } from '../../i10Glockenspiel/plan.ts';
import { VIBE_FAM } from '../../i07Vibraphone/model.ts';
import { MARIMBA_FAM } from '../../i08Marimba/model.ts';
import { XYLO_FAM } from '../../i09Xylophone/model.ts';
import { GLOCK_FAM } from '../../i10Glockenspiel/model.ts';
import { markAt, type PlanCase } from './types.ts';

const HAND = ['M04a', 'M04b', 'M04c', 'M05'];
const SMALL = ['I02', 'I03a', 'I03b', 'I03c', 'I04', 'I05a', 'I05b', 'I05c', 'I05d'];
const MALLETS: Record<string, { plan: { box: PlanBox; things: readonly PlanThing[]; cue?: PlanCueSpec }; fam: MalletFamily }> = {
  I07: { plan: VIBE_PLAN, fam: VIBE_FAM },
  I08: { plan: MARIMBA_PLAN, fam: MARIMBA_FAM },
  I09: { plan: XYLO_PLAN, fam: XYLO_FAM },
  I10: { plan: GLOCK_PLAN, fam: GLOCK_FAM },
};

function cases(lesson: Lesson, plan: { box: PlanBox; things: readonly PlanThing[]; cue?: PlanCueSpec }, art: (variant: string) => ArtPlan): PlanCase[] {
  const out: PlanCase[] = [];
  const variants = lesson.model.variants.map((v) => v.id);
  for (const variant of variants)
    for (const scene of ['stage', 'studio'] as const) {
      const a = art(variant);
      const rig = planCue(plan.things, plan.box, a, plan.cue, scene);
      // the deck's downstage edge (dashed) at the audience thing; its arrows
      // and words just beyond it (HandPlan)
      const aud = plan.things.find((t) => t.kind === 'audience');
      const H = plan.box.v1 - plan.box.v0;
      const audience =
        scene === 'stage' && aud
          ? { axis: 'u' as const, dir: 1 as const, lip: aud.u, kind: 'direction' as const, marks: [markAt(aud.u + 260, aud.v, 160, 90), ...[plan.box.v0 + H * 0.3, plan.box.v1 - H * 0.3].map((v) => ({ u0: aud.u + 90, u1: aud.u + 300, v0: v - 34, v1: v + 34 }))] }
          : undefined;
      out.push({
        audience,
        lesson: lesson.id,
        scene,
        family: 'handDrums',
        variant: variants.length > 1 ? variant : undefined,
        room: scene === 'studio' ? planRoom(plan.box) : undefined,
        foots: handPlanFoots(plan.things, plan.box, scene, a, plan.cue),
        cables: rig ? cueCables(rig) : [],
        cue: rig ? [rig] : [],
        performers: planPerformers(plan.things, scene, a).map((p) => ({ id: p.id, group: p.group })),
      });
    }
  return out;
}

export function handDrumsCases(): PlanCase[] {
  const out: PlanCase[] = [];
  for (const id of HAND) {
    const L = lessonById(id) as HandLesson | undefined;
    if (L) out.push(...cases(L, L.hand.plan, (v) => modelArtPlan(L.model, v, false)));
  }
  for (const id of SMALL) {
    const L = lessonById(id) as SpLesson | undefined;
    if (L) out.push(...cases(L, L.sp.plan, (v) => modelArtPlan(L.model, v, true)));
  }
  for (const [id, m] of Object.entries(MALLETS)) {
    const L = lessonById(id);
    if (L) out.push(...cases(L, m.plan, (v) => malletArtPlan(m.fam, L.model, v)));
  }
  return out;
}
