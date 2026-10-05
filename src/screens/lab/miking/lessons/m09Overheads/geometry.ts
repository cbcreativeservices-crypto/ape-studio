/**
 * M09 DRUM OVERHEADS — where things are (charter §2 layer 2): the shared kit
 * as one scene (lessons/shared/kitScene), framed for overheads, with the
 * stage's two monitors for the live variant. Positions of the monitors are
 * M01's (the same stage across Lab 1: LESSON_JOURNEY §6 stage 3) —
 * ILLUSTRATIVE, never a readout reference.
 */
import type { Wedge } from '../../engine/model/types.ts';
import { KICK_GEOM } from '../m01Kick/geometry.ts';
import { KIT_FLOOR_Y } from '../shared/kitPlanModel.ts';
import { kitModel } from '../shared/kitScene/kitSceneModel.ts';

export const M09_VIEWS = {
  side: { u0: -1150, u1: 850, v0: -1750, v1: KIT_FLOOR_Y + 30 },
  top: { u0: -1150, u1: 850, v0: -1000, v1: 1100 },
};

export const M09_MODEL = kitModel({
  id: 'kit5overheads',
  name: '5-piece drum kit with overheads',
  variants: [
    { id: 'studio', label: 'STUDIO', blurb: 'A studio room: the overheads may be the main picture of the kit, with close mics adding focus. The room itself can help.' },
    { id: 'live', label: 'LIVE STAGE', blurb: 'A stage with monitors and a PA: overheads add cymbals (and spill) to what the audience already hears from the kit.' },
  ],
  defaultVariant: 'studio',
  views: M09_VIEWS,
  roles: {
    'kit.kick': 'Low in the middle of the kit: an overhead hears it last and weakest. The line from the kick through the snare is a useful centre line for a pair.',
    'kit.snare': 'The overheads’ usual reference: distances are measured to its centre, so its sound reaches each mic at the same moment.',
    'kit.tom1': 'Under the crash on the left. Moving a pair toward the front of the kit brings the rack toms and the cymbals closer.',
    'kit.tom2': 'Under the larger crash. Its fills reach the overheads after the snare’s sound does.',
    'kit.floor': 'On the player’s right. The side mic of the floor-tom method sits just beyond its rim, outside the player’s reach.',
    'cym.hihat': 'On the player’s left: close and loud in an overhead on that side. Air puffs out sideways as the pair closes.',
    'cym.crash1': 'Hangs high, close to the overheads, and swings when struck. Mics and booms stay clear of the swing.',
    'cym.crash2': 'The highest cymbal here — closest of all to a mic above the kit. It swings when struck.',
    'cym.ride': 'Over the floor tom, played all the time on its bow and bell: an overhead on that side hears it strongly.',
    'kit.throne': 'The player sits here. The space above and around it — head, shoulders, the sticks’ reach — is the player’s.',
  },
});

/** The stage's two monitors (M01's positions, ILLUSTRATIVE). */
export const M09_WEDGES: Wedge[] = [
  {
    id: 'fill',
    label: 'the drummer’s own fill, on the floor beside the throne',
    short: 'DRUM FILL',
    p: { x: -450, y: KIT_FLOOR_Y, z: 750 },
    lift: 150,
    faces: { x: -0.2, y: 0, z: -1 },
    note: 'Below and behind the side mic: a pattern’s null can face it if you tilt the mic or change its pattern — while it still looks across at the snare.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout (M01’s position); no source gives it' },
  },
  {
    id: 'downstage',
    label: 'a floor wedge for another player, downstage of the drums, facing upstage',
    short: 'DOWNSTAGE',
    p: { x: KICK_GEOM.L + 900, y: KIT_FLOOR_Y, z: -450 },
    lift: 150,
    faces: { x: -1, y: 0, z: 0 },
    note: 'In FRONT of the side mic, across the kit: no null reaches it. Its spill is set by distance, level and how much the mic needs to be turned up.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout (M01’s position); no source gives it' },
  },
];
