/**
 * M10 DRUM ROOM MICROPHONES — where things are (charter §2 layer 2): the
 * shared kit as one scene, in the research's drawing-default ROOM (walls,
 * ceiling, the door and its walkway as a keep-out), and — live — the same
 * stage monitors as every Lab 1 lesson plus a PA pair at the stage's front
 * edge (ILLUSTRATIVE positions).
 */
import type { Envelope, Part, Wedge } from '../../engine/model/types.ts';
import { KICK_GEOM } from '../m01Kick/geometry.ts';
import { KIT_FLOOR_Y, yAt } from '../shared/kitPlanModel.ts';
import { KIT_LINES, kitModel } from '../shared/kitScene/kitSceneModel.ts';
import { ROOM } from './model.ts';

const ill = (reason: string) => ({ kind: 'illustrative', reason }) as const;

export const M10_VIEWS = {
  side: { u0: ROOM.back, u1: ROOM.front, v0: yAt(ROOM.ceilingH), v1: KIT_FLOOR_Y + 40 },
  top: { u0: ROOM.back, u1: ROOM.front, v0: ROOM.left, v1: ROOM.right },
};

/** The walls and the ceiling as solids (a mic, its boom and its stand stay
 *  inside the room; nothing is fixed to a wall, the ceiling or a grid). */
const WALL_T = 200;
const wall = (id: string, label: string, min: { x: number; y: number; z: number }, max: { x: number; y: number; z: number }): Part => ({ id, label, short: 'wall', role: '', prov: ill('the room is a drawing default (room/GEOMETRY_PROPOSAL.md §1)'), listIn: [], solid: { kind: 'box', min, max } });
const TOP = yAt(ROOM.ceilingH);
const ROOM_PARTS: Part[] = [
  wall('room.back', 'back wall', { x: ROOM.back - WALL_T, y: TOP - WALL_T, z: ROOM.left - WALL_T }, { x: ROOM.back, y: KIT_FLOOR_Y, z: ROOM.right + WALL_T }),
  wall('room.front', 'front wall', { x: ROOM.front, y: TOP - WALL_T, z: ROOM.left - WALL_T }, { x: ROOM.front + WALL_T, y: KIT_FLOOR_Y, z: ROOM.right + WALL_T }),
  wall('room.left', 'side wall', { x: ROOM.back - WALL_T, y: TOP - WALL_T, z: ROOM.left - WALL_T }, { x: ROOM.front + WALL_T, y: KIT_FLOOR_Y, z: ROOM.left }),
  wall('room.right', 'side wall', { x: ROOM.back - WALL_T, y: TOP - WALL_T, z: ROOM.right }, { x: ROOM.front + WALL_T, y: KIT_FLOOR_Y, z: ROOM.right + WALL_T }),
  wall('room.ceiling', 'ceiling', { x: ROOM.back - WALL_T, y: TOP - WALL_T, z: ROOM.left - WALL_T }, { x: ROOM.front + WALL_T, y: TOP, z: ROOM.right + WALL_T }),
];

/** The PA pair at the stage's front edge (live only; ILLUSTRATIVE). */
export const PA = { x: ROOM.front - 700, z: 2100, h0: 1500, h1: 2150, w: 420, d: 380 };
const PA_PARTS: Part[] = [-1, 1].map((s) => ({
  id: s < 0 ? 'pa.left' : 'pa.right',
  label: s < 0 ? 'PA speaker (stage left)' : 'PA speaker (stage right)',
  short: 'PA',
  role: 'A PA speaker on a stand, facing the audience. A room mic behind it still hears it — the PA and the room answer back.',
  variants: ['live'],
  prov: ill('a typical small stage; no source gives the position'),
  solid: { kind: 'box', min: { x: PA.x - PA.d / 2, y: yAt(PA.h1), z: s * PA.z - PA.w / 2 }, max: { x: PA.x + PA.d / 2, y: KIT_FLOOR_Y, z: s * PA.z + PA.w / 2 } },
}));

/** The door and the walkway to the kit (a keep-out: lesson L5 asks for them). */
const WALKWAY: Envelope = {
  id: 'env.walkway',
  label: 'the door and the walkway',
  shape: { kind: 'box', min: { x: ROOM.back, y: yAt(2000), z: ROOM.door.z0 }, max: { x: -300, y: KIT_FLOOR_Y, z: ROOM.door.z1 } },
  prov: ill('door 900 wide on the back wall and a route to the kit’s right side (room proposal §1, drawing defaults)'),
};

export const M10_MODEL = kitModel({
  id: 'kit5room',
  name: '5-piece drum kit in a live room',
  variants: [
    { id: 'studio', label: 'STUDIO ROOM', blurb: 'A studio live room, about 6.5 × 5.4 m with a 3 m ceiling: a room signal can become part of the kit’s sound.' },
    { id: 'live', label: 'LIVE STAGE', blurb: 'The same kit on a stage: monitors on the floor and a PA facing the audience. A distant room mic hears them too.' },
  ],
  defaultVariant: 'studio',
  views: M10_VIEWS,
  // The kick's axis first: the room mics' readouts measure off it.
  lines: [KIT_LINES[1], KIT_LINES[0], KIT_LINES[2]],
  extraParts: [...ROOM_PARTS, ...PA_PARTS],
  extraEnvelopes: [WALKWAY],
  roles: {
    'kit.kick': 'The kick: low and in the middle. A low mic about a metre in front of it hears an integrated kit with plenty of kick.',
    'kit.snare': 'The snare: its crack reaches a room mic first, then its echoes from the floor, the walls and the ceiling.',
    'cym.crash2': 'The highest cymbal: a high room mic in its line of sight tends to hear plenty of it.',
    'cym.ride': 'The ride, over the floor tom; a room mic on that side hears it strongly.',
    'kit.throne': 'The player sits here. Room mics stand well clear of the kit and of the player’s movement.',
  },
});

/** The stage monitors (M01's positions) and the PA (live; ILLUSTRATIVE). */
export const M10_WEDGES: Wedge[] = [
  {
    id: 'paL',
    label: 'the PA speaker at the stage’s front, on the left',
    short: 'PA LEFT',
    p: { x: PA.x, y: KIT_FLOOR_Y, z: -PA.z },
    lift: (PA.h0 + PA.h1) / 2,
    faces: { x: 1, y: 0, z: 0 },
    note: 'Behind and to the side of a room mic that faces the kit: a pattern’s null can face it — turn the mic, or change its pattern.',
    prov: { kind: 'illustrative', reason: 'a typical small stage; no source gives it' },
    glyph: 'none',
  },
  {
    id: 'fill',
    label: 'the drummer’s own fill, on the floor beside the throne',
    short: 'DRUM FILL',
    p: { x: -450, y: KIT_FLOOR_Y, z: 750 },
    lift: 150,
    faces: { x: -0.2, y: 0, z: -1 },
    note: 'On the kit’s side of a room mic that faces the kit: in FRONT of it, where no null reaches. Distance and level set how much it spills.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout (M01’s position); no source gives it' },
  },
  {
    id: 'downstage',
    label: 'a floor wedge for another player, downstage of the drums, facing upstage',
    short: 'DOWNSTAGE',
    p: { x: KICK_GEOM.L + 900, y: KIT_FLOOR_Y, z: -450 },
    lift: 150,
    faces: { x: -1, y: 0, z: 0 },
    note: 'Between the kit and a room mic in front of it: in its front, where no null reaches.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout (M01’s position); no source gives it' },
  },
];
