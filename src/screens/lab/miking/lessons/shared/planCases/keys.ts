/** Plan cases: the electric pianos' stage / studio plans (I11a tine piano,
 *  I11b reed piano — keys/KeysPlan.tsx). */
import { lessonById } from '../../../data/lessons.ts';
import { DECK_EDGE_U, KEYS_BOX, keysCue, keysFoots, keysRoom, type KeysRig } from '../keys/keysPlanModel.ts';
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
    const stageFoots = keysFoots(rig, 'stage', lesson.live.wedges);
    const audience = { axis: 'u' as const, dir: 1 as const, lip: DECK_EDGE_U, kind: 'seats' as const, marks: stageFoots.filter((f) => f.kind === 'audienceChair') };
    out.push({ lesson: id, scene: 'stage', family: 'keys', variant: rig, audience, deck: { u0: KEYS_BOX[rig].stage.u0, u1: DECK_EDGE_U, v0: KEYS_BOX[rig].stage.v0, v1: KEYS_BOX[rig].stage.v1 }, foots: stageFoots, cables: [], cue: [], performers, allow });
    const cue = keysCue(rig);
    out.push({ lesson: id, scene: 'studio', family: 'keys', variant: rig, room: keysRoom(rig), foots: keysFoots(rig, 'studio', lesson.live.wedges), cables: cueCables(cue), cue: [cue], performers, allow });
  }
  return out;
}
