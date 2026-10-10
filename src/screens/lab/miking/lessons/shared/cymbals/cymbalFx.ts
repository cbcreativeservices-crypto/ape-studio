/**
 * THE SHARED CYMBAL FAMILY, Lab 2 additions (beside cymbalSpec.ts, which
 * stays unchanged): the SPLASH (10 in on an arm, 8 in inverted on top of a
 * crash) and the CHINA (18 in, upright or inverted). Pure (no React Native);
 * the lessons' geometry and the tests read it directly, CymbalFxArt.tsx draws
 * from it.
 *
 * SOURCES (docs/labs/miking/splash_cymbal/, china_cymbal/ SOURCES.md):
 *   • sizes: the 10 and 8 in splash (ZIL-ASPL, ZIL-KSPL); the 18 in China
 *     (SAB-101 "16” and 18” being popular sizes"; ZIL-ACH18);
 *   • the inverted 8 in splash on top of a larger cymbal (ZIL-BARATA);
 *   • the Z-shaped 3/8 in arm (MEINL-CY2: rod Ø 9.525 mm);
 *   • the China's strike "about an inch above" the valley (SAB-JH).
 * EVERYTHING ELSE IS A DRAWING DEFAULT (`placeholder: true`, never a
 * readout): the China's cup, shoulder, valley and lip (china_cymbal/
 * GEOMETRY_PROPOSAL.md: "the whole China profile is a drawing default"), the
 * splash profile (the family's 8 % rise, 32 % bell), the arm's bends and the
 * piggyback spacing, every position.
 *
 * POSITIONS (the shared kit frame K, kit/GEOMETRY_PROPOSAL.md §1):
 *   • the 10 in splash on its arm over the 10 in tom, clamped to the tom
 *     holder's post — moved from the proposal's (−150, h 1000, −380), where a
 *     mic above it would sit inside the 16 in crash (CORRECTIONS_LOG CY-07);
 *   • the 8 in splash inverted on top of the 18 in crash, sharing its rod;
 *   • the China ON the 18 in crash's stand, in its place (the proposal's
 *     first option; its second, (150, h 1150, 700), overlaps the 18 in crash
 *     — CORRECTIONS_LOG CY-08).
 */
import type { Dim, Provenance, Shape3, Vec3 } from '../../../engine/model/types.ts';
import { CYMBAL_PROFILE, KIT_CYMBALS, KIT_FLOOR_Y } from '../kitPlanModel.ts';
import { CYMBAL_HARDWARE, CYMBAL_SWING, cymbalFrame, cymbalPoint, type CymbalSpec, type PlacedCymbal } from './cymbalSpec.ts';

export { CYMBAL_SWING };

const IN = 25.4;
const src = (s: string, quote: string): Provenance => ({ kind: 'sourced', src: s, quote });
const unk = (needed: string): Provenance => ({ kind: 'unknown', needed });
const dd = (mm: number, needed: string): Dim => ({ mm, prov: unk(needed), placeholder: true });
const yAt = (h: number) => KIT_FLOOR_Y - h;

/** The family's crash profile (8 % rise, 32 % bell): drawing defaults. */
const profile = (d: number): Pick<CymbalSpec, 'rise' | 'bellD' | 'edgeFrac' | 'drawT'> => ({
  rise: dd(CYMBAL_PROFILE.rise * d, 'cymbal profile height (8 % of the diameter)'),
  bellD: dd(CYMBAL_PROFILE.bell * d, 'bell diameter (32 % of the diameter)'),
  edgeFrac: dd(0.85, 'where the edge band starts (85 % of the radius)'),
  drawT: dd(3, 'the drawn plate thickness (a line weight; the real thickness is unknown)'),
});

/* ── the splash ── */
export const SPLASH_10: CymbalSpec = { id: 'splash10', kind: 'crash', name: '10 in splash', d: { mm: 10 * IN, prov: src('ZIL-ASPL', 'variants "8" (A0210), "10" (A0211)') }, ...profile(10 * IN) };
export const SPLASH_8: CymbalSpec = { id: 'splash8', kind: 'crash', name: '8 in splash', d: { mm: 8 * IN, prov: src('ZIL-KSPL', '"8" (K0857), "10" (K0858), "12" (K0859)') }, ...profile(8 * IN) };

/** Splash sizes: "12” down to 6”" (SAB-101). */
export const SPLASH_RANGE_IN = { min: 6, max: 12 } as const;

/* ── the China: its own profile (all drawing defaults) ── */

/**
 * The China's profile, upright (cup up), as fractions of R and mm (china
 * proposal table): a flat-topped CUP r 0–0.18 R, 25 mm high; the SHOULDER
 * falling 10° from the cup to the VALLEY at 0.78 R; the LIP turning up from
 * the valley to the rim, 18 mm. Heights are measured from the RIM PLANE (the
 * China's edge plane): the valley sits 18 mm below it, the cup's top 31 mm
 * above it.
 */
export const CHINA_PROFILE = {
  cupR: dd(0.18, 'China cup radius (18 % of the radius)'),
  cupH: dd(25, 'China cup height'),
  shoulderDeg: dd(10, 'China shoulder slope'),
  valleyR: dd(0.78, 'China valley radius (78 % of the radius)'),
  lipRise: dd(18, 'China lip rise above the valley'),
} as const;

const R18 = (18 * IN) / 2;
/** The shoulder's drop from the cup's foot to the valley (DERIVED: 10° over 0.6 R). */
const SHOULDER_DROP = Math.tan((CHINA_PROFILE.shoulderDeg.mm * Math.PI) / 180) * (CHINA_PROFILE.valleyR.mm - CHINA_PROFILE.cupR.mm) * R18;
/** The cup's top above the rim plane (DERIVED from the defaults: 31 mm). */
export const CHINA_TOP = CHINA_PROFILE.cupH.mm + SHOULDER_DROP - CHINA_PROFILE.lipRise.mm;

export const CHINA_18: CymbalSpec = {
  id: 'china18',
  kind: 'crash',
  name: '18 in China',
  d: { mm: 18 * IN, prov: src('SAB-101', '"China or Chinese are cymbals that have an upturned edge. They are typically in the same size range as crashes, with 16”and 18” being popular sizes."') },
  rise: dd(CHINA_TOP, 'the China cup’s top above the rim plane (derived from the profile defaults)'),
  bellD: dd(2 * CHINA_PROFILE.cupR.mm * R18, 'China cup diameter'),
  edgeFrac: dd(CHINA_PROFILE.valleyR.mm, 'where the China’s valley sits'),
  drawT: dd(3, 'the drawn plate thickness (a line weight)'),
};

/**
 * The China's top surface above its rim plane at radius r (mm), upright.
 * Flip the sign for an inverted China (its cup down, its lip up).
 */
export function chinaHeight(r: number): number {
  const R = CHINA_18.d.mm / 2;
  const a = Math.min(R, Math.abs(r));
  const cupR = CHINA_PROFILE.cupR.mm * R;
  const valR = CHINA_PROFILE.valleyR.mm * R;
  const foot = CHINA_TOP - CHINA_PROFILE.cupH.mm; // the shoulder's top (the cup's foot)
  const wall = 0.025 * R; // the cup's near-vertical wall
  if (a <= cupR) return CHINA_TOP - 1.5 * Math.pow(a / cupR, 6); // a flat top, eased at the corner
  if (a <= cupR + wall) return CHINA_TOP - 1.5 - (CHINA_PROFILE.cupH.mm - 1.5) * Math.sin(((a - cupR) / wall) * (Math.PI / 2));
  if (a <= valR) return foot - SHOULDER_DROP * ((a - cupR - wall) / (valR - cupR - wall));
  // The lip: up from the valley to the rim, curling a little (a smooth rise).
  const q = (a - valR) / (R - valR);
  return -CHINA_PROFILE.lipRise.mm + CHINA_PROFILE.lipRise.mm * Math.pow(q, 1.25);
}

/** The China's three areas as radii (mm): cup, shoulder, lip. */
export function chinaAreas(): { cup: [number, number]; shoulder: [number, number]; lip: [number, number] } {
  const R = CHINA_18.d.mm / 2;
  return { cup: [0, CHINA_PROFILE.cupR.mm * R], shoulder: [CHINA_PROFILE.cupR.mm * R, CHINA_PROFILE.valleyR.mm * R], lip: [CHINA_PROFILE.valleyR.mm * R, R] };
}

/** The upright jazz strike: "about an inch above" the valley, on the
 *  shoulder's side (SAB-JH) — 25.4 mm up the 10° shoulder from the valley. */
export const CHINA_SHOULDER_STRIKE_R = CHINA_PROFILE.valleyR.mm * R18 - 25.4 * Math.cos((CHINA_PROFILE.shoulderDeg.mm * Math.PI) / 180);

/* ── placements (kit frame K) ── */

export type FxPlaced = PlacedCymbal & { inverted?: boolean };

/** Where a cymbal's centre hole sits on a stand: the underside of the 18 in
 *  crash's bell (its centre) — the seat the China takes over. */
const C2 = KIT_CYMBALS.crash2;
// The 18 in crash and the 18 in China share a diameter: one frame serves both.
const F2 = cymbalFrame({ spec: CHINA_18, c: C2.c, tiltDeg: C2.tiltDeg });
const CRASH2_RISE = CYMBAL_PROFILE.rise * C2.d;
/** The bottom felt's top: the crash's bell underside (rise − the drawn thickness). */
const SEAT = cymbalPoint(F2, 0, 0, CRASH2_RISE - 4);

/** The China on the 18 in crash's stand: upright (its cup's underside on the
 *  seat) or inverted (the cup turned down, its top resting on the seat). */
export const CHINA_UPRIGHT: FxPlaced = { spec: CHINA_18, c: cymbalPoint(F2, 0, 0, CRASH2_RISE - 4 - (CHINA_TOP - 3)), tiltDeg: C2.tiltDeg };
export const CHINA_INVERTED: FxPlaced = { spec: CHINA_18, c: { x: SEAT.x + F2.n.x * CHINA_TOP, y: SEAT.y + F2.n.y * CHINA_TOP, z: SEAT.z + F2.n.z * CHINA_TOP }, tiltDeg: C2.tiltDeg, inverted: true };
export const CHINA_SEAT: Vec3 = SEAT;

/** The 10 in splash on its arm: over the 10 in tom, below and in front of the
 *  16 in crash (drawing default; tilted 10° toward the drummer). */
export const SPLASH_ARM: FxPlaced = { spec: SPLASH_10, c: { x: -20, y: yAt(1050), z: -200 }, tiltDeg: 10 };

/** The 8 in splash inverted on top of the 18 in crash, on the same rod: its
 *  edge plane 25 mm above the crash's bell (drawing default). */
export const PIGGY_GAP = dd(25, 'the piggyback splash’s edge plane above the host bell');
export const SPLASH_PIGGY: FxPlaced = { spec: SPLASH_8, c: cymbalPoint(F2, 0, 0, CRASH2_RISE + PIGGY_GAP.mm), tiltDeg: C2.tiltDeg, inverted: true };

/**
 * The Z-shaped arm (MEINL-CY2, rod Ø 9.525): a multi-clamp on the tom
 * holder's post (h 740), the rod rising to h 930, running level toward the
 * splash, and rising to its tilter. The bends and the clamp height are
 * drawing defaults.
 */
export const ARM_ROD = { d: { mm: 9.525, prov: src('MEINL-CY2', 'Z-shaped 3/8” rod with extra-long knurled end') } as Dim, clampH: dd(740, 'the arm’s clamp height on the post'), runH: dd(930, 'the arm’s level run height') } as const;
export const TOM_POST_PLAN = { u: 230, v: -110 } as const;

export function splashArmPoints(): { clamp: Vec3; up: Vec3; elbow: Vec3; tilter: Vec3 } {
  const f = cymbalFrame(SPLASH_ARM);
  const tilter = cymbalPoint(f, 0, 0, -(SPLASH_10.rise.mm - SPLASH_10.drawT.mm + CYMBAL_HARDWARE.feltT.mm + CYMBAL_HARDWARE.tilterH.mm));
  const clamp = { x: TOM_POST_PLAN.u, y: yAt(ARM_ROD.clampH.mm), z: TOM_POST_PLAN.v };
  const up = { x: TOM_POST_PLAN.u, y: yAt(ARM_ROD.runH.mm), z: TOM_POST_PLAN.v };
  const elbow = { x: tilter.x, y: yAt(ARM_ROD.runH.mm), z: tilter.z };
  return { clamp, up, elbow, tilter };
}

/** The family's Lab 2 drawing defaults, by name (for the lessons' unknowns). */
export const FX_DRAWING_DEFAULTS: readonly string[] = [
  'the splash profile (8 % rise, 32 % bell) and its position on the arm',
  'the arm’s clamp height and bends (only the rod’s 3/8 in is published)',
  'the piggyback splash’s spacing above the crash',
  'the whole China profile: cup, shoulder slope, valley and lip',
  'the China taking the 18 in crash’s stand',
];

/* ── solids (collision) ── */

/**
 * A placed cymbal as a solid: a disc (slab) along −n from the top of its
 * profile to just under its lowest point, clearance = the swing (± 60 mm,
 * the family's drawing default). An inverted cymbal hangs the other way.
 */
export function fxSolid(p: FxPlaced): { shape: Shape3; clearance: number } {
  const f = cymbalFrame(p);
  const axis = { x: -f.n.x, y: -f.n.y, z: -f.n.z };
  const china = p.spec.id === CHINA_18.id;
  // Along `axis` (down the plate's normal): x0 = −(highest point), x1 = lowest + thickness.
  const top = china ? CHINA_TOP : p.spec.rise.mm;
  const bottom = china ? CHINA_PROFILE.lipRise.mm : 0;
  const t = p.spec.drawT.mm;
  const [x0, x1] = p.inverted ? [-(bottom + t), top] : [-top, bottom + t];
  return { shape: { kind: 'slab', c: f.c, axis, r: f.R, x0, x1 }, clearance: CYMBAL_SWING.mm };
}

/** The arm as capsules (clamp → up → elbow → tilter). */
export function splashArmSolids(): Shape3[] {
  const a = splashArmPoints();
  const r = ARM_ROD.d.mm / 2;
  return [
    { kind: 'capsule', a: a.clamp, b: a.up, r },
    { kind: 'capsule', a: a.up, b: a.elbow, r },
    { kind: 'capsule', a: a.elbow, b: a.tilter, r },
    // the multi-clamp on the post (drawing default, Ø 40 × 60)
    { kind: 'capsule', a: { ...a.clamp, y: a.clamp.y - 30 }, b: { ...a.clamp, y: a.clamp.y + 30 }, r: 20 },
  ];
}
