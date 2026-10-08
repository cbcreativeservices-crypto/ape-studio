/**
 * F04 IMPACTS, LIQUIDS AND TEXTURES — where things are (charter §2 layer 2),
 * on the shared Foley stage (frame F: the origin at the ACTION — the impact
 * point on the table, the water's entry at its surface, the middle of the
 * brush's friction line; +x toward the mics, +y down, +z the performer's
 * right). The floor sits where the action puts it, per variant.
 *
 * Variants (foley_impacts_liquids/GEOMETRY_PROPOSAL.md §1): IMPACT — a
 * padded block struck on a sturdy wooden table; WATER — a shallow basin on
 * a stable low table, a non-slip mat, a small pour; TEXTURE — a dry brush
 * across coarse fabric on a board; LIVE — the impact at a theatre station
 * (no wet effect live without approved containment). Keep-outs: the block's
 * travel, the SPLASH ENVELOPE (2.5 × the basin's radius, illustrative —
 * O-7), the brush's stroke, the performer's body. Every size and distance a
 * drawing default (no source gives one).
 */
import type { Envelope, InstrumentModel, Part, Provenance, RadiatingRegion, Variant, VariantId, ViewBox } from '../../engine/model/types.ts';
import { bodyColumn, sidePose, standing, topPose, type Body3 } from '../shared/foley/performer.ts';
import { BASIN, PROP_DIMS, handArc, splashKeepOut } from '../shared/foley/propGeom.ts';
import { v3 } from '../shared/foley/frameF.ts';
import { boothSolids } from '../shared/foley/stage.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

export const F04_VARIANTS = ['impact', 'water', 'texture', 'live'] as const;
const TABLE_H = PROP_DIMS.tableH.mm;
const BOARD_T = 18;
/** The floor's y under each variant's action. */
export const FLOOR: Readonly<Record<string, number>> = { impact: TABLE_H, water: PROP_DIMS.lowTableH.mm + BASIN.water, texture: TABLE_H + BOARD_T, live: TABLE_H };
export const floorOf = (v: VariantId) => FLOOR[v] ?? TABLE_H;
/** The table's top under the action, per variant (the basin's low table under the water's bottom). */
export const TABLE = { x0: -380, x1: 300, z0: -450, z1: 450 } as const;
export const tableTop = (v: VariantId) => (v === 'water' ? BASIN.water : v === 'texture' ? BOARD_T : 0);

const IMPACT_BODY: Body3 = standing({ floorY: FLOOR.impact, x: -500, lean: 28, wrR: v3(-110, -180, 40), elR: v3(-330, -300, 230), wrL: v3(-330, -40, -210), elL: v3(-420, -300, -260), kindR: 'grip' });
const WATER_BODY: Body3 = standing({ floorY: FLOOR.water, x: -560, lean: 30, wrR: v3(-190, -320, 60), elR: v3(-400, -480, 230), wrL: v3(-170, -250, -40), elL: v3(-380, -420, -260), kindR: 'grip' });
const TEXTURE_BODY: Body3 = standing({ floorY: FLOOR.texture, x: -520, lean: 25, wrR: v3(-110, -90, 80), elR: v3(-330, -300, 230), wrL: v3(-200, -40, -260), elL: v3(-400, -300, -280), kindR: 'grip' });
export const BODIES: Readonly<Record<string, Body3>> = { impact: IMPACT_BODY, water: WATER_BODY, texture: TEXTURE_BODY, live: IMPACT_BODY };
export const bodyOf = (v: VariantId): Body3 => BODIES[v] ?? IMPACT_BODY;
const POSES = Object.fromEntries(Object.entries(BODIES).map(([k, b]) => [k, { side: sidePose(b), top: topPose(b) }]));
export const posesOf = (v: VariantId) => POSES[v] ?? POSES.impact;

const VARIANTS: Variant[] = [
  { id: 'impact', label: 'IMPACT', blurb: 'A padded block struck on a sturdy wooden table: the contact, the table’s body and the room.', phrase: 'with an impact' },
  { id: 'water', label: 'WATER', blurb: 'A small pour into a shallow basin on a stable low table, a non-slip mat and a towel at hand: the entry, the splash, the drips.', phrase: 'with water' },
  { id: 'texture', label: 'TEXTURE', blurb: 'A dry brush drawn across coarse fabric on a board: a steady friction and a natural end.', phrase: 'with a texture' },
  { id: 'live', label: 'LIVE STAGE', blurb: 'A live theatre: the impact at a fixed station beside the stage, the PA beside the stage and a wedge in front. No wet effect live without approved containment and cleanup.', phrase: 'at a live station' },
];

function parts(): Part[] {
  return [
    { id: 'f04.artist', label: 'the Foley artist', short: 'artist', role: 'The performer makes the impact, the pour or the stroke with a repeatable force — never more force just to reach the meter.', moving: true, prov: ill('the shared adult figure (drawing default)') },
    { id: 'f04.block', label: 'padded block', short: 'block', role: 'Leather over foam: a safe, controllable impact. The contact is the attack; the table answers with the body.', moving: true, prov: ill('a padded block 150 × 100 × 60 mm (drawing default)'), variants: ['impact', 'live'] },
    { id: 'f04.table', label: 'sturdy wooden table', short: 'table', role: 'The table’s top resonates under the hit: part of the body of the sound — and vibration that can reach a stand.', prov: ill('a table 750 mm high (drawing default)'), variants: ['impact', 'live'], solid: { kind: 'box', min: v3(TABLE.x0, 0, TABLE.z0), max: v3(TABLE.x1, TABLE_H, TABLE.z1) } },
    { id: 'f04.tableTex', label: 'sturdy wooden table', short: 'table', role: 'The table under the board: it carries the stroke’s vibration — part of the texture, and a path to a stand.', prov: ill('a table 750 mm high (drawing default)'), variants: ['texture'], solid: { kind: 'box', min: v3(TABLE.x0, BOARD_T, TABLE.z0), max: v3(TABLE.x1, FLOOR.texture, TABLE.z1) } },
    { id: 'f04.basin', label: 'shallow basin of water', short: 'basin', role: 'Water only, in a stable shallow basin on a non-slip mat: the entry, the splash, bubbles, the container wall, the drips.', prov: ill('a basin Ø 400 × 120 mm (drawing default)'), variants: ['water'], solid: { kind: 'cyl', a: v3(0, BASIN.water, 0), b: v3(0, -(BASIN.depth - BASIN.water), 0), r: BASIN.R } },
    { id: 'f04.lowTable', label: 'stable low table and mat', short: 'low table', role: 'A low, stable table and a non-slip mat under the basin; power, cables and connectors kept away from the wet area.', prov: ill('a low table 400 mm high (drawing default)'), variants: ['water'], solid: { kind: 'box', min: v3(-380, BASIN.water, -380), max: v3(380, FLOOR.water, 380) } },
    { id: 'f04.board', label: 'fabric-covered board and a dry brush', short: 'board', role: 'A dry brush drawn across coarse fabric: continuous friction along the stroke, the board’s resonance, a natural end.', moving: true, prov: ill('a board 600 × 400 mm (drawing default)'), variants: ['texture'] },
    { id: 'f04.room', label: 'the stage room', short: 'room', role: 'A farther mic joins the source and the room — and may avoid direct splash or air bursts, at the cost of more room noise.', prov: ill('a generic Foley stage room (drawing default)') },
    { id: 'f04.pa', label: 'PA loudspeaker, beside the stage', short: 'PA', role: 'The PA faces the audience — and every open mic hears it too.', prov: ill('a typical theatre layout (drawing default)'), variants: ['live'], solid: boothSolids(FLOOR.live).pa },
    { id: 'f04.booth', label: 'the station’s front rail', short: 'station', role: 'A fixed effects station beside the stage: small, contained effects, the same place every night.', prov: { kind: 'sourced', src: 'ENO-FOLEY', quote: 'A special booth is constructed stage left … so that the foley artist is visible to the audience' }, variants: ['live'], solid: boothSolids(FLOOR.live).rail },
  ];
}

function regions(): RadiatingRegion[] {
  return [
    { id: 'r.hit', partId: 'f04.block', label: 'the contact', anchor: v3(0, 0, 0), prov: ill('the impact point on the table'), variants: ['impact', 'live'], note: 'The block meets the table: the attack starts at the contact.' },
    { id: 'r.tableBody', partId: 'f04.table', label: 'the table’s body', anchor: v3(-40, 60, 0), prov: ill('the table top under the impact'), variants: ['impact', 'live'], note: 'The table top rings on after the hit: the body and decay.' },
    { id: 'r.entry', partId: 'f04.basin', label: 'the water’s entry', anchor: v3(0, 0, 0), prov: ill('the water’s surface where the pour enters'), variants: ['water'], note: 'The pour enters the surface: the splash, then bubbles and flow.' },
    { id: 'r.wall', partId: 'f04.basin', label: 'the container wall and the drips', anchor: v3(BASIN.R, 20, 0), prov: ill('the basin’s wall'), variants: ['water'], note: 'The container wall resonates and the drips go on long after the pour: the tail.' },
    { id: 'r.stroke', partId: 'f04.board', label: 'the friction line', anchor: v3(0, 0, 0), prov: ill('the middle of the brush’s stroke'), variants: ['texture'], note: 'The bristles drag across the fabric along the stroke: a continuous friction, changing with pressure.' },
    { id: 'r.room', partId: 'f04.room', label: 'the room', anchor: v3(-1700, -600, 0), prov: ill('the stage room (drawing default)'), note: 'The room carries the decay and the drip tail on.' },
  ];
}

function envelopes(): Envelope[] {
  const out: Envelope[] = [];
  for (const v of F04_VARIANTS) {
    const b = BODIES[v];
    out.push({ ...bodyColumn({ x: b.neck.x - 10, z: b.neck.z, floorY: FLOOR[v], r: 220 }), id: `env.body.${v}`, variants: [v] });
  }
  out.push(handArc('env.travel', 'the block’s travel and the hand', IMPACT_BODY.shR, v3(0, -200, 0), 140, ['impact', 'live']));
  out.push(splashKeepOut(FLOOR.water, ['water']));
  out.push(handArc('env.pour', 'the pouring hand and the jug', WATER_BODY.shR, v3(-120, -300, 0), 150, ['water']));
  out.push({ id: 'env.stroke', label: 'the brush’s stroke', shape: { kind: 'box', min: v3(-150, -160, -340), max: v3(150, 0, 340) }, prov: ill('the brush drawn across the board, its handle and the hand — a drawing default'), variants: ['texture'] });
  return out;
}

const side = (v0: number, floor: number): ViewBox => ({ u0: -1050, u1: 2000, v0, v1: floor + 60 });
const top: ViewBox = { u0: -1050, u1: 2000, v0: -1250, v1: 1250 };

export const F04_MODEL: InstrumentModel = {
  id: 'foleyImpacts',
  name: 'Foley impacts, liquids and textures',
  parts: parts(),
  regions: regions(),
  surfaces: [{ id: 'action', partId: 'f04.artist', label: 'the action', point: v3(0, 0, 0), normal: v3(1, 0, 0), target: true }],
  lines: [],
  envelopes: envelopes(),
  variants: VARIANTS,
  defaultVariant: 'water',
  views: { side: side(-1150, FLOOR.impact), top },
  viewsByVariant: {
    water: { side: side(-1400, FLOOR.water), top },
    // The live station: wide enough for the rail and the PA beside the stage.
    live: { side: { ...side(-1150, FLOOR.live), u1: 2700 }, top: { ...top, u1: 2700 } },
    texture: { side: side(-1150, FLOOR.texture), top },
  },
  viewTags: { side: 'SIDE · FROM THE ARTIST’S RIGHT', top: 'FROM ABOVE' },
  yFloor: { mm: FLOOR.impact, prov: ill('the floor under the action — per variant (a drawing default)') },
  floorByVariant: { ...FLOOR },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  ports: Object.fromEntries(F04_VARIANTS.map((v) => [v, null])),
  mountRule: { boom: 'level', fallback: v3(1, 0, 0), length: 300 },
  insetAt: 'bottom',
};
