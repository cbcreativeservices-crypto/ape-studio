/**
 * F01 FOLEY FOOTSTEPS AND SURFACES — where things are (charter §2 layer 2),
 * on the shared Foley stage (lessons/shared/foley, frame F: the origin at the
 * centre of the footfall area on the walking surface, +x the walker's front
 * line toward the mics, +y down, +z the walker's right; the stage floor and
 * the pit's surface at y = 0).
 *
 * One performer walking in a 1.2 × 1 m pit (the walker crosses it from side
 * to side, facing the mics), the pit's surface as the VARIANT — tile on
 * concrete, a hollow wood panel, loose gravel, carpet over a wood floor — and
 * a LIVE variant: a theatre Foley booth at the side of the stage, a concrete
 * slab in its pit, the PA beside the stage and a wedge in front of the
 * performer. Keep-outs: the motion envelope (the pit plus the body's sweep)
 * and the exit path to the stage door. Research: foley_footsteps/
 * GEOMETRY_PROPOSAL.md §1–§5.
 */
import type { InstrumentModel, Part, Provenance, RadiatingRegion, Variant, VariantId } from '../../engine/model/types.ts';
import { PIT, STAGE_DIMS, SURFACES, type SurfaceId, boothSolids } from '../shared/foley/stage.ts';
import { bodyColumn, exitPath, motionEnvelope, PERFORMER_DIMS, sidePose, standing, topPose } from '../shared/foley/performer.ts';
import { v3 } from '../shared/foley/frameF.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });

/** The studio surfaces (the variants) and the live booth's slab. */
export const F01_SURFACE: Readonly<Record<string, SurfaceId>> = { tile: 'tile', wood: 'woodPanel', gravel: 'gravel', carpet: 'carpetOver', live: 'concrete' };
export const STUDIO_VARIANTS: readonly VariantId[] = ['tile', 'wood', 'gravel', 'carpet'];
export const surfaceOf = (v: VariantId) => SURFACES[F01_SURFACE[v] ?? 'tile'];

/**
 * THE WALKER (a drawing default): mid-stride across the pit's middle, facing
 * +x — the near (right) foot forward, heel down at the strike; the left foot
 * behind, its heel lifting; the arms swinging opposite the legs.
 */
export const WALKER = standing({
  floorY: 0,
  x: -40,
  stepR: 210,
  stepL: -230,
  liftL: 30,
  wrR: v3(-200, -840, 205),
  elR: v3(-140, -1105, 200),
  wrL: v3(110, -870, -205),
  elL: v3(40, -1120, -200),
});
export const WALKER_SIDE = sidePose(WALKER);
export const WALKER_TOP = topPose(WALKER);

/** The heel's strike point: under the forward shoe's heel (the shared shoe's
 *  heel sits ~96 mm behind the foot point). */
export const HEEL = v3(WALKER.ftR.x - 80, 0, WALKER.ftR.z);

const ENVELOPE = motionEnvelope({ hx: PIT.hx + PIT.rim, hz: PIT.hz, floorY: 0 });
const EXIT = exitPath({ from: PIT.hz + PERFORMER_DIMS.sweep.mm, to: 3200, floorY: 0, x: -200 });

const VARIANTS: Variant[] = [
  { id: 'tile', label: 'TILE', blurb: 'Tile on a concrete bed: a hard, solid surface — sharp contact, little give.', phrase: 'on tile' },
  { id: 'wood', label: 'HOLLOW WOOD', blurb: 'Wood boards over an air gap: the panel and the gap under it can ring with each step.', phrase: 'on a hollow wood panel' },
  { id: 'gravel', label: 'GRAVEL', blurb: 'Loose gravel on a sand bed: crunch, scatter and uneven steps — the walker needs room to work the material.', phrase: 'on loose gravel' },
  { id: 'carpet', label: 'CARPET', blurb: 'Carpet laid over a wood floor: a quiet step, the boards under it still heard — a carpet always lies on something.', phrase: 'on carpet over wood' },
  { id: 'live', label: 'LIVE STAGE', blurb: 'A Foley booth at the side of a theatre stage: a concrete slab in the pit, the PA beside the stage and a wedge in front of the performer. The audience sees the artist.', phrase: 'in a live Foley booth' },
];

const shellProv = src('FF-PIT', 'Dimensions of 1.2 x 1 meter are optimal; concrete framing at least 70 millimeters … I prefer 100 mm');
const layerRole: Readonly<Record<string, string>> = {
  tile: 'Tile on a concrete bed: the step meets a hard, stiff surface — a sharp contact and a short tail.',
  wood: 'Boards over an air gap: the panel flexes under the step, and it and the gap can add a low boom.',
  gravel: 'Loose stones on a sand bed: each step pushes and scatters them — crunch, grains, uneven strikes.',
  carpet: 'A soft carpet over boards: the contact is quiet and the wood under it can still be heard.',
  live: 'A concrete slab in the booth’s pit: a hard, solid step that reads clearly through a PA.',
};
const underRole: Readonly<Record<string, string>> = {
  tile: 'The concrete bed under the tiles: solid, so little of the step goes into it as a boom.',
  wood: 'The air gap and the sleepers under the boards: the hollow part. A hollow panel can boom — choose and support the panel before you move the mic.',
  gravel: 'The sand bed under the stones: it soaks up the push of the step.',
  carpet: 'The boards and the gap under the carpet — the hidden floor every carpet step lands on.',
  live: 'The slab itself: there is no hollow part to boom.',
};

function parts(): Part[] {
  const out: Part[] = [
    { id: 'f01.walker', label: 'the Foley artist, walking', short: 'artist', role: 'The performer walks the cue in place, facing the screen and the mics: the shoes, the clothes and the breath are all near the mic. Their whole movement — feet, arms and body — is a keep-out.', moving: true, prov: ill('the shared adult figure, mid-stride (drawing default)') },
    { id: 'f01.shoe', label: 'shoe — heel, sole and toe', short: 'shoe', role: 'The heel lands first, the sole rolls, the toe pushes off — and a scuff drags along. The shoe’s sole material is half of every footstep: choose the shoe first.', moving: true, prov: ill('the shared figure’s shoe (drawing default)') },
    { id: 'f01.pitRim', label: 'pit and its concrete rim', short: 'pit', role: 'A pit about 1.2 × 1 m, framed in concrete about 10 cm wide: one surface to walk on, set into the stage floor. Stands stay outside it.', prov: shellProv, solid: { kind: 'box', min: v3(-PIT.hx - PIT.rim, 0, -PIT.hz - PIT.rim), max: v3(PIT.hx + PIT.rim, PIT.depth, PIT.hz + PIT.rim) } },
    { id: 'f01.slab', label: 'base slab under the stage', short: 'slab', role: 'A massive concrete slab, about 35 cm thick, on dense sand: the floor under every pit. A slab this heavy keeps the floor itself from booming.', prov: src('FF-PIT', 'their own 35 centimeter monolithic cement slab laying on a thick layer of dense sand') },
    { id: 'f01.room', label: 'the stage room', short: 'room', role: 'The room around the pit: its walls, the ventilation and the other props. A farther mic hears more of it — wanted for a wide shot, unwanted when the scene is somewhere else.', prov: ill('a generic Foley stage room (drawing default)') },
  ];
  for (const v of ['tile', 'wood', 'gravel', 'carpet', 'live']) {
    const s = surfaceOf(v);
    out.push({ id: `f01.surface.${v}`, label: `walking surface — ${s.label}`, short: s.short.toLowerCase(), role: layerRole[v], prov: src('NF-FOLEY', 'carpet, concrete, grass, tile, metal, creaky wood floor, laminate, wood plank, dirt, rock, sand, snow, and a low water pit'), variants: [v] });
    out.push({ id: `f01.under.${v}`, label: s.hollow ? 'under the surface — the hollow part' : 'under the surface', short: s.hollow ? 'hollow' : 'under', role: underRole[v], prov: src('FF-CUE', 'a carpet is always laid on another surface. There is always tile, concrete, hardwood, or hollow wood underneath.'), variants: [v] });
  }
  out.push({ id: 'f01.pa', label: 'PA loudspeaker, beside the stage', short: 'PA', role: 'The PA faces the audience — and every open mic on stage hears it too. That is the feedback path a live Foley mic has to live with.', prov: ill('a typical theatre layout (drawing default)'), variants: ['live'], solid: boothSolids(0).pa });
  out.push({ id: 'f01.booth', label: 'the Foley booth’s front rail', short: 'booth', role: 'The booth at the side of the stage, open so the audience can see the artist: a fixed station, its props and mics set before the show.', prov: src('ENO-FOLEY', 'A special booth is constructed stage left … so that the foley artist is visible to the audience'), variants: ['live'], solid: boothSolids(0).rail });
  return out;
}

function regions(): RadiatingRegion[] {
  const out: RadiatingRegion[] = [
    { id: 'r.heel', partId: 'f01.shoe', label: 'heel contact', anchor: HEEL, prov: ill('the heel strike, under the forward shoe (drawing default)'), note: 'The heel meets the surface: the sharp contact of the step starts here, right at floor level.' },
    { id: 'r.room', partId: 'f01.room', label: 'the room', anchor: v3(-1700, -1500, 0), prov: ill('the stage room (drawing default)'), note: 'The step’s sound reaches the walls and comes back: the farther the mic, the more of this it hears.' },
  ];
  for (const v of ['tile', 'wood', 'gravel', 'carpet', 'live']) {
    const s = surfaceOf(v);
    out.push({ id: `r.surface.${v}`, partId: `f01.surface.${v}`, label: 'the surface', anchor: v3(0, 0, 0), prov: ill('the middle of the footfall area — the lesson’s reference point'), variants: [v], note: s.loose ? 'The stones scatter and grind round the shoe: a texture that spreads over the whole area the walker works.' : 'The surface under the shoe rings or hushes: tile clicks, boards knock, carpet whispers — its texture is part of the step.' });
    if (s.hollow) out.push({ id: `r.under.${v}`, partId: `f01.under.${v}`, label: 'the hollow under it', anchor: v3(0, 60, 0), prov: ill('the panel’s air gap (drawing default)'), variants: [v], note: 'The boards flex and the air gap under them rings: a low boom that travels through the floor into the step.' });
  }
  return out;
}

export const F01_MODEL: InstrumentModel = {
  id: 'foleyFootsteps',
  name: 'Foley footsteps in a pit',
  parts: parts(),
  regions: regions(),
  surfaces: [{ id: 'steps', partId: 'f01.pitRim', label: 'the middle of the steps', point: v3(0, 0, 0), normal: v3(1, 0, 0), target: true }],
  lines: [{ id: 'clear', label: 'the movement', point: v3(PIT.hx + PIT.rim, 0, 0), dir: v3(1, 0, 0), plane: true, words: { plus: 'clear of', minus: 'inside', keyPlus: 'CLEAR', keyMinus: '✕ INSIDE' } }],
  envelopes: [ENVELOPE, EXIT, bodyColumn({ x: WALKER.neck.x - 10, floorY: 0, r: 260 })],
  variants: VARIANTS,
  defaultVariant: 'tile',
  views: {
    side: { u0: -1000, u1: 2600, v0: -2300, v1: 520 },
    top: { u0: -1000, u1: 2600, v0: -1350, v1: 1350 },
  },
  viewTags: { side: 'SIDE · THE PIT CUT OPEN', top: 'FROM ABOVE' },
  // The room mic stands high at the right: the other view's inset takes the lower corner.
  insetAt: 'bottom',
  yFloor: { mm: 0, prov: ill('the stage floor and the pit’s surface are y = 0 by frame F') },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  ports: { tile: null, wood: null, gravel: null, carpet: null, live: null },
};

/** The pit's depth and sizes, for the art and the tests. */
export const F01_DIMS = { ...STAGE_DIMS, ...PERFORMER_DIMS };
