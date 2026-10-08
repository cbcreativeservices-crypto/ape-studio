/**
 * F03 PROPS AND OBJECT HANDLING — where things are (charter §2 layer 2), on
 * the shared Foley stage (frame F: the origin at the prop's SOUNDING PART —
 * the jingle of the keys, the paper's bend, the door's handle and latch, the
 * chair's leg on the floor; +x toward the mics, +y down, +z the performer's
 * right). The floor sits where that part puts it, per variant (a drawing
 * default: keys and the handle at 1 m, the paper on a 750 mm table, the
 * chair's leg on the floor).
 *
 * Variants (foley_props/GEOMETRY_PROPOSAL.md §1–§2): KEYS, PAPER, DOOR,
 * CHAIR, and LIVE (keys at a theatre station, the PA beside the stage, a
 * wedge in front). Keep-outs: the handling arm and the prop's sweep, the
 * door's SWING ARC and PINCH ZONES, the chair's lift-and-drag path, the
 * performer's body. No source gives a prop's size or a distance to it: every
 * number is a drawing default (O-6).
 */
import type { Envelope, InstrumentModel, Part, Provenance, RadiatingRegion, ReferenceSurface, Variant, VariantId, ViewBox } from '../../engine/model/types.ts';
import { bodyColumn, sidePose, standing, topPose, type Body3 } from '../shared/foley/performer.ts';
import { CHAIR, DOOR, PROP_DIMS, chairKeepOut, doorKeepOuts, handArc } from '../shared/foley/propGeom.ts';
import { v3 } from '../shared/foley/frameF.ts';
import { boothSolids } from '../shared/foley/stage.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

export const F03_VARIANTS = ['keys', 'paper', 'door', 'chair', 'live'] as const;
/** The floor's y under each variant's sounding part. */
export const FLOOR: Readonly<Record<string, number>> = { keys: PROP_DIMS.keysHeight.mm, paper: PROP_DIMS.tableH.mm, door: PROP_DIMS.handleH.mm, chair: 0, live: PROP_DIMS.keysHeight.mm };
export const floorOf = (v: VariantId) => FLOOR[v] ?? 1000;

/** The table under the paper (F03) — its top at y = 0 in the PAPER variant. */
export const TABLE = { x0: -330, x1: 300, z0: -480, z1: 480 } as const;

const KEYS_BODY: Body3 = standing({ floorY: FLOOR.keys, x: -380, wrR: v3(-60, -30, 40), elR: v3(-300, -160, 220), wrL: v3(-330, 160, -230), elL: v3(-360, -100, -220), kindR: 'grip' });
const PAPER_BODY: Body3 = standing({ floorY: FLOOR.paper, x: -470, wrR: v3(-150, -40, 80), elR: v3(-380, -300, 230), wrL: v3(-150, -30, -90), elL: v3(-380, -300, -230) });
const DOOR_BODY: Body3 = standing({ floorY: FLOOR.door, x: -430, z: -330, wrR: v3(-90, -10, 20), elR: v3(-340, -150, -130), wrL: v3(-420, 160, -540), elL: v3(-440, -100, -520), kindR: 'grip' });
const CHAIR_BODY: Body3 = standing({ floorY: FLOOR.chair, x: -760, z: -210, wrR: v3(-470, -880, -80), elR: v3(-650, -1090, -30), wrL: v3(-470, -880, -340), elL: v3(-650, -1090, -390), kindR: 'grip', kindL: 'grip' });

export const BODIES: Readonly<Record<string, Body3>> = { keys: KEYS_BODY, paper: PAPER_BODY, door: DOOR_BODY, chair: CHAIR_BODY, live: KEYS_BODY };
export const bodyOf = (v: VariantId): Body3 => BODIES[v] ?? KEYS_BODY;
const POSES = Object.fromEntries(Object.entries(BODIES).map(([k, b]) => [k, { side: sidePose(b), top: topPose(b) }]));
export const posesOf = (v: VariantId) => POSES[v] ?? POSES.keys;

const VARIANTS: Variant[] = [
  { id: 'keys', label: 'KEYS', blurb: 'A key ring handled at hand level: the keys jingle against each other, go into a lock, turn.', phrase: 'with keys' },
  { id: 'paper', label: 'PAPER', blurb: 'A sheet of paper on a table: lifted, bent, folded, slid and set down.', phrase: 'with paper' },
  { id: 'door', label: 'DOOR', blurb: 'A door on a Foley stand: the handle, the latch, the hinge, the panel and the frame — and its swing.', phrase: 'with a door' },
  { id: 'chair', label: 'CHAIR', blurb: 'A wooden chair lifted, dragged and set down: the legs on the floor, the frame’s rattle.', phrase: 'with a chair' },
  { id: 'live', label: 'LIVE STAGE', blurb: 'A live theatre: keys handled at a fixed prop station beside the stage, the PA beside the stage and a wedge in front.', phrase: 'at a live station' },
];

function parts(): Part[] {
  const fl = FLOOR;
  return [
    { id: 'f03.artist', label: 'the Foley artist', short: 'artist', role: 'The performer handles the prop in time with the picture — their hands, breath and clothes are near the mic too, and their whole movement is a keep-out.', moving: true, prov: ill('the shared adult figure (drawing default)') },
    { id: 'f03.keys', label: 'key ring', short: 'keys', role: 'Keys jingle against each other, go into a lock and turn: several small metal events from one hand.', moving: true, prov: ill('a key ring, Ø 30 mm, four keys (drawing default)'), variants: ['keys', 'live'] },
    { id: 'f03.paper', label: 'sheet of paper', short: 'paper', role: 'A sheet lifted, bent, folded, slid and set down: the sound is where it bends or rubs on the table.', moving: true, prov: ill('A4, 210 × 297 mm (drawing default)'), variants: ['paper'] },
    { id: 'f03.table', label: 'prop table', short: 'table', role: 'A sturdy table: it can resonate under a set-down — part of the sound, or a noise to check.', prov: ill('a table 750 mm high (drawing default)'), variants: ['paper'], solid: { kind: 'box', min: v3(TABLE.x0, 0, TABLE.z0), max: v3(TABLE.x1, fl.paper, TABLE.z1) } },
    { id: 'f03.handle', label: 'handle and latch', short: 'latch', role: 'The lever turns and the latch releases: a small, sharp click — the detail of a door.', moving: true, prov: ill('a lever handle 1000 mm up (drawing default)'), variants: ['door'] },
    { id: 'f03.leaf', label: 'door leaf (the panel)', short: 'panel', role: 'The panel swings and resonates: the body of a door. Never a mic on a moving door without an approved mounting plan.', moving: true, prov: ill('a leaf 800 × 2000 mm (drawing default)'), variants: ['door'], solid: { kind: 'box', min: v3(-DOOR.t / 2, fl.door - DOOR.H, 0), max: v3(DOOR.t / 2, fl.door - 25, DOOR.W) } },
    { id: 'f03.frame', label: 'frame and hinge', short: 'frame', role: 'The hinge creaks and the leaf closes into the frame: the final contact. Hinges and the latch edge are pinch points — hands and hardware clear.', prov: ill('the door’s frame on its stand (drawing default)'), variants: ['door'], solid: { kind: 'box', min: v3(-420, fl.door - 70, -90), max: v3(420, fl.door, DOOR.W + 90) } },
    { id: 'f03.chair', label: 'wooden chair', short: 'chair', role: 'Lifted, dragged and set down: the legs scrape and knock on the floor, the frame can rattle. Use an assistant for heavy furniture.', moving: true, prov: ill('a chair 450 × 450 mm, 900 mm high (drawing default)'), variants: ['chair'], solid: { kind: 'box', min: v3(-CHAIR.S - 20, FLOOR.chair - CHAIR.back, -CHAIR.S - 20), max: v3(30, FLOOR.chair, 30) } },
    { id: 'f03.room', label: 'the stage room', short: 'room', role: 'A farther mic hears the prop with the room — wanted to make the object and its space read as one event, unwanted when the scene is elsewhere.', prov: ill('a generic Foley stage room (drawing default)') },
    { id: 'f03.pa', label: 'PA loudspeaker, beside the stage', short: 'PA', role: 'The PA faces the audience — and every open mic hears it too.', prov: ill('a typical theatre layout (drawing default)'), variants: ['live'], solid: boothSolids(FLOOR.live).pa },
    { id: 'f03.booth', label: 'the prop station’s front rail', short: 'station', role: 'A known object station beside the stage: the prop always in the same place for the mic.', prov: { kind: 'sourced', src: 'ENO-FOLEY', quote: 'A special booth is constructed stage left … so that the foley artist is visible to the audience' }, variants: ['live'], solid: boothSolids(FLOOR.live).rail },
  ];
}

function regions(): RadiatingRegion[] {
  return [
    { id: 'r.jingle', partId: 'f03.keys', label: 'the jingle', anchor: v3(0, 30, 0), prov: ill('the keys hanging from the ring'), variants: ['keys', 'live'], note: 'Keys strike keys below the ring: small, bright metal clicks spread round the hand.' },
    { id: 'r.bend', partId: 'f03.paper', label: 'the bend', anchor: v3(0, 0, 0), prov: ill('the sheet’s bend line'), variants: ['paper'], note: 'Where the sheet bends and rubs on the table: friction and a crisp crackle.' },
    { id: 'r.latch', partId: 'f03.handle', label: 'the latch', anchor: v3(0, 0, 0), prov: ill('the handle and latch'), variants: ['door'], note: 'The latch releases and catches: a small, sharp click at the door’s edge.' },
    { id: 'r.panel', partId: 'f03.leaf', label: 'the panel', anchor: v3(0, -300, 450), prov: ill('the panel’s middle'), variants: ['door'], note: 'The panel resonates as it swings and when it closes: the door’s body, spread over its whole face.' },
    { id: 'r.legs', partId: 'f03.chair', label: 'the legs on the floor', anchor: v3(0, 0, 0), prov: ill('the front leg’s floor contact'), variants: ['chair'], note: 'The legs scrape and knock on the floor: the sound starts at the floor and the frame rattles above it.' },
    { id: 'r.room', partId: 'f03.room', label: 'the room', anchor: v3(-1700, -600, 0), prov: ill('the stage room (drawing default)'), note: 'The prop’s sound reaches the walls and comes back: a farther mic joins the object and its room.' },
  ];
}

function envelopes(): Envelope[] {
  const out: Envelope[] = [];
  for (const v of F03_VARIANTS) {
    const b = BODIES[v];
    out.push({ ...bodyColumn({ x: b.neck.x - 10, z: b.neck.z, floorY: FLOOR[v], r: 270 }), id: `env.body.${v}`, variants: [v] });
  }
  out.push(handArc('env.hand.keys', 'the hand and the swinging keys', KEYS_BODY.shR, v3(0, 40, 0), 140, ['keys', 'live']));
  out.push(handArc('env.hand.paper', 'the hands and the lifting sheet', PAPER_BODY.shR, v3(0, -60, 0), 170, ['paper']));
  out.push({ id: 'env.flutter', label: 'the sheet’s lift and flutter', shape: { kind: 'box', min: v3(-170, -300, -130), max: v3(170, 0, 130) }, prov: ill('the sheet lifted and fluttering, up to about 30 cm (drawing default)'), variants: ['paper'] });
  out.push(handArc('env.hand.door', 'the hand on the handle', DOOR_BODY.shR, v3(-40, 0, 40), 120, ['door']));
  out.push(...doorKeepOuts(FLOOR.door, ['door']));
  out.push(chairKeepOut(FLOOR.chair, ['chair']));
  return out;
}

/** The reference points: the sounding part (all variants) and the door's panel. */
const SURFACES: ReferenceSurface[] = [
  { id: 'part', partId: 'f03.artist', label: 'the sounding part', point: v3(0, 0, 0), normal: v3(1, 0, 0), target: true },
  { id: 'panel', partId: 'f03.leaf', label: 'the door’s panel', point: v3(0, -300, 450), normal: v3(1, 0, 0), target: true, variants: ['door'] },
];

const W: ViewBox = { u0: -1000, u1: 2900, v0: 0, v1: 0 };
const side = (v0: number, floor: number): ViewBox => ({ ...W, v0, v1: floor + 60 });
const top: ViewBox = { u0: -1000, u1: 2900, v0: -1500, v1: 1500 };

export const F03_MODEL: InstrumentModel = {
  id: 'foleyProps',
  name: 'Foley props',
  parts: parts(),
  regions: regions(),
  surfaces: SURFACES,
  lines: [],
  envelopes: envelopes(),
  variants: VARIANTS,
  defaultVariant: 'keys',
  views: { side: side(-1150, FLOOR.keys), top },
  viewsByVariant: {
    paper: { side: side(-1250, FLOOR.paper), top },
    door: { side: side(-1250, FLOOR.door), top },
    chair: { side: side(-1900, FLOOR.chair), top },
  },
  viewTags: { side: 'SIDE · FROM THE ARTIST’S RIGHT', top: 'FROM ABOVE' },
  yFloor: { mm: FLOOR.keys, prov: ill('the floor under the sounding part — per variant (a drawing default)') },
  floorByVariant: { ...FLOOR },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  ports: Object.fromEntries(F03_VARIANTS.map((v) => [v, null])),
  mountRule: { boom: 'level', fallback: v3(1, 0, 0), length: 300 },
  insetAt: 'bottom',
};

export const CHAIR_DIMS = CHAIR;
