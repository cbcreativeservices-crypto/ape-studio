/**
 * F08 MOVING SOURCES AND PASS-BYS — the shared pages' words on the field
 * family's words (lessons/shared/field/fieldCopy.ts). Starting-points voice;
 * no sources, brands or badges.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { fieldCopy } from '../shared/field/fieldCopy.ts';

export const F08_COPY: Partial<LessonCopy> = fieldCopy({
  variantKey: 'PASS',
  variantShort: { walk: 'a walking pass', vehicle: 'a vehicle paper plan' },
  sceneSubject: { walk: 'a listening point 3 m from a walking route closed to traffic', vehicle: 'a paper plan: a closed vehicle route, the crew behind a setback line' },
  instrument: {
    figureBadge: 'The route, cut across toward the path',
    figureLabel: 'A section from the listening point toward the path: the ground, the route and what stands along it.',
    partsBadge: 'A pass-by · tap a part to name it',
    partsLooking: { side: 'Section · the path to the right', top: 'Plan · the path to the right' },
    partsIdle: 'A pass-by is a source that approaches, crosses and recedes. Tap the route, the walker, the cones — or, on the paper plan, the route and the crew’s line.',
    variantNotes: {
      walk: 'WALKING PASS: a consenting walker on a path closed to traffic, 3 m from the listening point. Switch PASS for the vehicle paper plan.',
      vehicle: 'VEHICLE · PAPER PLAN: a closed, permitted route, a driver and a safety lead — planned on paper only, never a pass you stage yourself.',
    },
  },
  worked: { walk: 'pb.walk.fixed', vehicle: 'pb.veh.fixed' },
  ref: 'the path’s centre line',
  reveal: 'Nearer the path the level arc steepens and the closest moment jumps out; farther back the pass is gentler and longer. A fixed pair lets it cross the image; a tracked mic holds it. Different viewpoints, not one right answer.',
  tendencies: 'Closer: a steeper arc, a louder closest moment, more headroom needed. Farther: a gentler, longer pass and more of the place. A narrow mic can lose the ends of the pass. Tendencies to check by ear — your ears and the place decide.',
  practice: { gain: 'pb.prac.gain', second: 'pb.prac.3', mixed: ['pb.mix.1', 'pb.mix.2', 'pb.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: level, image and pitch kept apart, and a pair of separate mics.' },
  startIntro: 'This lesson is about putting microphones beside a moving source — a walker, and on paper a vehicle — as it approaches, crosses and recedes. First the pass itself, scrubbed with your finger, then real starting setups drawn beside the path, the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  otherRef: 'Every starting point here is measured from the path’s centre line back to the mic — and the mic always stays outside the path’s envelope.',
  blocked: 'The stand would be inside the path’s envelope or past the crew’s line — move it back.',
  typeNotes: {
    shotgunShort: 'Ideas to try with a fixed shotgun: aim it at the crossing — and notice how quickly the ends of the pass fall off its axis.',
    shotgunPole: 'Ideas to try with the tracked shotgun: the operator’s feet stay planted at the station; swing smoothly, and listen for handling.',
  },
});
