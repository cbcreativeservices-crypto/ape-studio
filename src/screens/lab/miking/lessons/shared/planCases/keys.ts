/** Plan cases: the electric pianos' stage / studio plans (I11a tine piano,
 *  I11b reed piano — keys/KeysPlan.tsx). */
import { lessonById } from '../../../data/lessons.ts';
import { keysCue, keysFoots, keysRoom, type KeysRig } from '../keys/keysPlanModel.ts';
import { cueCables } from '../monitoring/cueMix.ts';
import type { PlanCase } from './types.ts';

const RIGS: Record<string, KeysRig> = { I11a: 'rhodes', I11b: 'wurli' };

export function keysCases(): PlanCase[] {
  const out: PlanCase[] = [];
  for (const [id, rig] of Object.entries(RIGS)) {
    const lesson = lessonById(id);
    if (!lesson) continue;
    const performers = [{ id: 'keyboardist', group: 'player:keys' }];
    // The tine piano's sustain pedal stands on the floor under the front of the
    // keybed (one assembly with the keyboard, the player and the bench).
    const allow = rig === 'rhodes' ? [{ a: 'pedal', b: 'keyboard', why: 'the sustain pedal stands on the floor under the front of the keybed, at the player’s foot; the keyboard stands over it on its legs' }] : [];
    out.push({ lesson: id, scene: 'stage', family: 'keys', variant: rig, foots: keysFoots(rig, 'stage', lesson.live.wedges), cables: [], cue: [], performers, allow });
    const cue = keysCue(rig);
    out.push({ lesson: id, scene: 'studio', family: 'keys', variant: rig, room: keysRoom(rig), foots: keysFoots(rig, 'studio', lesson.live.wedges), cables: cueCables(cue), cue: [cue], performers, allow });
  }
  return out;
}
