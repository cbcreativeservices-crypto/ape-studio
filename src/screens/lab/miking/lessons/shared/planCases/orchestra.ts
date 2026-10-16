/** Plan cases: the orchestra plans (M06 timpani — two and four drums —, M07a
 *  concert bass drum, M07b concert snare, M08 headed tambourine; OrchestraPlan). */
import { lessonById } from '../../../data/lessons.ts';
import { orchestraCue, orchestraFoots, orchPerformers, STUDIO_ROOM, type OwnInstrument } from '../concert/orchestraPlanModel.ts';
import { cueCables } from '../monitoring/cueMix.ts';
import type { PlanCase } from './types.ts';

const OWN: [string, OwnInstrument, (string | undefined)[]][] = [
  ['M06', 'timpani', ['two', 'four']],
  ['M07a', 'bassDrum', [undefined]],
  ['M07b', 'snare', [undefined]],
  ['M08', 'tambourine', [undefined]],
];

export function orchestraCases(): PlanCase[] {
  const out: PlanCase[] = [];
  const performers = orchPerformers().map((p) => ({ id: p.id, group: p.group }));
  for (const [id, own, variants] of OWN) {
    const lesson = lessonById(id);
    if (!lesson) continue;
    for (const variant of variants) {
      const four = variant === 'four';
      out.push({ lesson: id, scene: 'stage', family: 'orchestra', variant, foots: orchestraFoots(own, 'stage', four, lesson.live.wedges), cables: [], cue: [], performers });
      const cue = orchestraCue(own, four);
      out.push({ lesson: id, scene: 'studio', family: 'orchestra', variant, room: STUDIO_ROOM, foots: orchestraFoots(own, 'studio', four, lesson.live.wedges), cables: cue.flatMap(cueCables), cue, performers });
    }
  }
  return out;
}
