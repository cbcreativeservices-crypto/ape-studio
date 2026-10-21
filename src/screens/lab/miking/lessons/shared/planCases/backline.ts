/** Plan cases: the amplified-chain plans (C02, C04, C08 — BacklinePlan), with
 *  their cables (R2-MK-04: instrument → DI → pedals → amp, the DI's XLR out). */
import { lessonById } from '../../../data/lessons.ts';
import { BACKLINE_BOX, backlineCables, backlineCue, backlineFoots, BACKLINE_ROOM, DECK_EDGE_U, type Backline } from '../speakers/backlinePlanModel.ts';
import { cueCables } from '../monitoring/cueMix.ts';
import { turnCase, type PlanCase } from './types.ts';

const WHO: Record<string, Backline> = { C02: 'guitar', C04: 'steel', C08: 'bass' };

export function backlineCases(): PlanCase[] {
  const out: PlanCase[] = [];
  for (const [id, who] of Object.entries(WHO)) {
    const lesson = lessonById(id);
    if (!lesson) continue;
    const g = `player:${who}`;
    const stageFoots = backlineFoots(who, 'stage', lesson.live.wedges);
    const audience = { axis: 'u' as const, dir: 1 as const, lip: DECK_EDGE_U, kind: 'seats' as const, marks: stageFoots.filter((f) => f.kind === 'audienceChair') };
    out.push(turnCase({ lesson: id, scene: 'stage', family: 'backline', audience, deck: { u0: BACKLINE_BOX.stage.u0, u1: DECK_EDGE_U, v0: BACKLINE_BOX.stage.v0, v1: BACKLINE_BOX.stage.v1 }, foots: stageFoots, cables: backlineCables(who, 'stage'), cue: [], performers: [{ id: 'player', group: g }], allow: who === 'bass' ? [{ a: 'amp', b: 'ampHead', why: 'the bass head stands on its cabinet' }] : [] }));
    const cue = backlineCue(who);
    out.push({ lesson: id, scene: 'studio', family: 'backline', room: BACKLINE_ROOM, foots: backlineFoots(who, 'studio', lesson.live.wedges), cables: [...backlineCables(who, 'studio'), ...cueCables(cue)], cue: [cue], performers: [{ id: 'player', group: g }], allow: who === 'bass' ? [{ a: 'amp', b: 'ampHead', why: 'the bass head stands on its cabinet' }] : [] });
  }
  return out;
}
