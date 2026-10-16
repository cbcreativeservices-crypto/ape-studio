/** Plan cases: the amplified-chain plans (C02, C04, C08 — BacklinePlan). */
import { lessonById } from '../../../data/lessons.ts';
import { backlineCue, backlineFoots, BACKLINE_ROOM, type Backline } from '../speakers/backlinePlanModel.ts';
import { cueCables } from '../monitoring/cueMix.ts';
import type { PlanCase } from './types.ts';

const WHO: Record<string, Backline> = { C02: 'guitar', C04: 'steel', C08: 'bass' };

export function backlineCases(): PlanCase[] {
  const out: PlanCase[] = [];
  for (const [id, who] of Object.entries(WHO)) {
    const lesson = lessonById(id);
    if (!lesson) continue;
    const g = `player:${who}`;
    out.push({ lesson: id, scene: 'stage', family: 'backline', foots: backlineFoots(who, 'stage', lesson.live.wedges), cables: [], cue: [], performers: [{ id: 'player', group: g }], allow: who === 'bass' ? [{ a: 'amp', b: 'ampHead', why: 'the bass head stands on its cabinet' }] : [] });
    const cue = backlineCue(who);
    out.push({ lesson: id, scene: 'studio', family: 'backline', room: BACKLINE_ROOM, foots: backlineFoots(who, 'studio', lesson.live.wedges), cables: cueCables(cue), cue: [cue], performers: [{ id: 'player', group: g }], allow: who === 'bass' ? [{ a: 'amp', b: 'ampHead', why: 'the bass head stands on its cabinet' }] : [] });
  }
  return out;
}
