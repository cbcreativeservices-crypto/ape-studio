/**
 * THE FOLEY STAGE (frame F) — the shared model of a Foley stage: the pit and
 * its surfaces, the base slab, the room shell and the live theatre booth.
 * Pure; tested. Built once by group 1 (lab6-g1); used by F01–F04 and (group
 * 2) F05. Research: foley_footsteps/GEOMETRY_PROPOSAL.md §2, SOURCES.md §a.
 *
 * SOURCED (FF-PIT, practice, Medium): a pit of "1.2 x 1 meter" is "optimal"
 * ("0.8 sq. meters" the minimum usable), its framing "at least 70
 * millimeters", the author preferring "100 mm"; the base "a massive concrete
 * slab … not less than 30 centimeters", their own "35 centimeter". FF-CUE: "a
 * carpet is always laid on another surface. There is always tile, concrete,
 * hardwood, or hollow wood underneath." NF-FOLEY: a stage keeps many
 * surfaces (carpet, concrete, tile, wood, gravel …). ENO-FOLEY: in a theatre,
 * "a special booth is constructed stage left … so that the foley artist is
 * visible to the audience".
 *
 * DRAWING DEFAULTS (`placeholder`, listed in each lesson's unknowns): the
 * pit's depth (100 mm, inside FF-PIT's 50 mm – 1 m), how the 1.2 × 1 m sits
 * (1.2 m across the walker, 1 m front to back), the hollow panel's boards and
 * void, the layers' thicknesses, the room's back wall, the booth, the PA and
 * the wedge.
 */
import type { Dim, Provenance, Shape3, Vec3 } from '../../../engine/model/types.ts';
import { v3 } from './frameF.ts';

const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const dd = (mm: number, needed: string): Dim => ({ mm, prov: { kind: 'unknown', needed }, placeholder: true });

export const STAGE_DIMS = {
  /** Across the walker (z): the pit's 1.2 m. */
  pitAcross: { mm: 1200, prov: src('FF-PIT', 'Dimensions of 1.2 x 1 meter are optimal') } as Dim,
  /** Front to back (x): the pit's 1 m. */
  pitDeep: { mm: 1000, prov: src('FF-PIT', 'Dimensions of 1.2 x 1 meter are optimal') } as Dim,
  /** The concrete framing round the pit. */
  rim: { mm: 100, prov: src('FF-PIT', 'concrete framing at least 70 millimeters … I prefer 100 mm') } as Dim,
  /** The surface layer's depth in a dry pit. */
  depth: dd(100, 'a dry pit’s depth (FF-PIT gives 50 mm to 1 m; 100 mm drawn)'),
  /** The base slab under the stage (section only). */
  slab: { mm: 350, prov: src('FF-PIT', 'their own 35 centimeter monolithic cement slab laying on a thick layer of dense sand') } as Dim,
  /** The minimum usable area (m², for the tests and the words). */
  minArea: { mm: 0.8, prov: src('FF-PIT', '0.8 sq. meters') } as Dim,
  /** The hollow wood panel: boards over an air void. */
  board: dd(22, 'a hollow wood panel’s boards (22 mm drawn)'),
  void: dd(55, 'a hollow wood panel’s air void (55 mm drawn)'),
  /** Carpet over wood: the carpet's thickness. */
  carpet: dd(12, 'a stage carpet’s thickness (12 mm drawn)'),
  tile: dd(10, 'a tile’s thickness (10 mm drawn) on a concrete bed'),
  /** The room shell: the back wall behind the performer, its height. */
  backWall: dd(1700, 'the back wall’s distance behind the active area (1.7 m drawn)'),
  wallH: dd(3000, 'the stage room’s wall height (3 m drawn)'),
} as const;

/** The pit's half-sizes (mm). */
export const PIT = {
  hx: STAGE_DIMS.pitDeep.mm / 2,
  hz: STAGE_DIMS.pitAcross.mm / 2,
  rim: STAGE_DIMS.rim.mm,
  depth: STAGE_DIMS.depth.mm,
  slab: STAGE_DIMS.slab.mm,
} as const;

/** The pit's area in m² (1.2 × 1.0 = 1.2 — above the 0.8 m² minimum). */
export const PIT_AREA_M2 = (STAGE_DIMS.pitAcross.mm * STAGE_DIMS.pitDeep.mm) / 1e6;

/**
 * THE SURFACES (NF-FOLEY, FF-CUE, FF-KMR, FF-PIT): each is drawn as a real
 * material in its section — never as hatching — and named for what it does
 * to a step. `layers` run top to bottom (mm, drawn thicknesses).
 */
export type SurfaceId = 'tile' | 'woodPanel' | 'concrete' | 'gravel' | 'leaves' | 'carpetOver';
export type Layer = { id: string; label: string; mm: number; kind: 'tile' | 'mortar' | 'concrete' | 'board' | 'void' | 'joist' | 'gravel' | 'leaves' | 'soil' | 'carpet' | 'underlay' | 'sand' };
export type SurfaceSpec = { id: SurfaceId; label: string; short: string; layers: readonly Layer[]; hollow: boolean; loose: boolean };

export const SURFACES: Readonly<Record<SurfaceId, SurfaceSpec>> = {
  tile: {
    id: 'tile',
    label: 'tile on concrete',
    short: 'TILE',
    hollow: false,
    loose: false,
    layers: [
      { id: 'tile', label: 'tiles', mm: 10, kind: 'tile' },
      { id: 'bed', label: 'mortar bed', mm: 15, kind: 'mortar' },
      { id: 'conc', label: 'concrete', mm: 75, kind: 'concrete' },
    ],
  },
  woodPanel: {
    id: 'woodPanel',
    label: 'a hollow wood panel',
    short: 'HOLLOW WOOD',
    hollow: true,
    loose: false,
    layers: [
      { id: 'boards', label: 'boards', mm: 22, kind: 'board' },
      { id: 'void', label: 'air void', mm: 55, kind: 'void' },
      { id: 'sleeper', label: 'sleepers', mm: 23, kind: 'joist' },
    ],
  },
  concrete: {
    id: 'concrete',
    label: 'bare concrete',
    short: 'CONCRETE',
    hollow: false,
    loose: false,
    layers: [{ id: 'conc', label: 'concrete', mm: 100, kind: 'concrete' }],
  },
  gravel: {
    id: 'gravel',
    label: 'loose gravel',
    short: 'GRAVEL',
    hollow: false,
    loose: true,
    layers: [
      { id: 'gravel', label: 'gravel', mm: 70, kind: 'gravel' },
      { id: 'sand', label: 'sand bed', mm: 30, kind: 'sand' },
    ],
  },
  leaves: {
    id: 'leaves',
    label: 'dry leaves on soil',
    short: 'LEAVES',
    hollow: false,
    loose: true,
    layers: [
      { id: 'leaves', label: 'dry leaves', mm: 40, kind: 'leaves' },
      { id: 'soil', label: 'soil', mm: 60, kind: 'soil' },
    ],
  },
  carpetOver: {
    id: 'carpetOver',
    label: 'carpet over a wood floor',
    short: 'CARPET',
    hollow: true,
    loose: false,
    layers: [
      { id: 'carpet', label: 'carpet', mm: 12, kind: 'carpet' },
      { id: 'under', label: 'underlay', mm: 6, kind: 'underlay' },
      { id: 'boards', label: 'boards under the carpet', mm: 22, kind: 'board' },
      { id: 'void', label: 'air void', mm: 37, kind: 'void' },
      { id: 'sleeper', label: 'sleepers', mm: 23, kind: 'joist' },
    ],
  },
};

/** The layers fill the pit's depth exactly (tested). */
export function layerDepth(s: SurfaceSpec): number {
  return s.layers.reduce((a, l) => a + l.mm, 0);
}

/**
 * THE LIVE THEATRE BOOTH (ENO-FOLEY; drawing defaults): the Foley station
 * at the side of the stage, the PA beside the stage facing the audience, a
 * wedge on the floor in front of the performer facing back at them. Frame F
 * with the floor at `floorY`.
 */
export function liveBooth(floorY: number) {
  return {
    /** The booth's front edge (a low front rail between the artist and the audience). */
    rail: { x: 1900, h: 1000 },
    /** The PA: a cabinet on a pole stand, beside the stage, facing the audience (+x). */
    pa: { p: v3(2400, floorY - 1700, -2300), faces: v3(1, 0, 0.1) } as { p: Vec3; faces: Vec3 },
    /** The wedge: on the floor in front of the performer, off to their right, facing back at them. */
    wedge: { p: v3(1500, floorY, 750), faces: v3(-1, 0, -0.45) } as { p: Vec3; faces: Vec3 },
  };
}

/** The back wall's plane (x) and the stage's view tag words. */
export const BACK_WALL_X = -STAGE_DIMS.backWall.mm;

/** The booth's rail and the PA (cabinet and pole) as collision solids — so a
 *  mic or stand cannot pass through them and the drawing's frame holds them. */
export function boothSolids(floorY: number): { rail: Shape3; pa: Shape3 } {
  const b = liveBooth(floorY);
  return {
    rail: { kind: 'box', min: v3(b.rail.x, floorY - b.rail.h, -1400), max: v3(b.rail.x + 60, floorY, 1400) },
    pa: { kind: 'box', min: v3(b.pa.p.x - 200, b.pa.p.y - 330, b.pa.p.z - 280), max: v3(b.pa.p.x + 160, floorY, b.pa.p.z + 280) },
  };
}
