/**
 * THE SHARED DRUM FAMILY — the look (charter §2 layer 3). Every Lab 1 drum is
 * drawn from its DrumSpec (drumSpec.ts) at the Kick's illustration standard:
 * gradients for form, light from the upper left, rim highlights, soft contact
 * shadows, a stroke hierarchy (cut faces 1.6, edges 1, detail 0.6 mm-eq).
 *
 *   DrumSection   the side view CUT OPEN at the drum's centre plane (the
 *                 kick's cutaway, for an upright or tilted drum): ply cut
 *                 faces, the far inner wall, both head films, the hoops' cut
 *                 faces and far halves, the hardware at the silhouette, and —
 *                 on a snare — the wires under the snare-side head with their
 *                 cords to the strainer and the butt plate.
 *   DrumExterior  the side view uncut (a neighbour): the lacquered shell as a
 *                 lit cylinder, the near lugs and rods, both hoops.
 *   DrumPlan      from above: the batter head (an ellipse when tilted), the
 *                 hoop, the rods and lugs, the shell's lower edge where a
 *                 tilt shows it; a snare's strainer and butt; a floor tom's
 *                 legs.
 *   CymbalSide / CymbalPlan / HiHatSide / HiHatPlan / BoomStand*  the kit
 *                 context the drum lessons need (spill sources, keep-outs).
 *                 Drawing defaults throughout (kit/GEOMETRY_PROPOSAL.md §3);
 *                 Art pass 2026-10-10: CymbalSide and HiHatSide draw the
 *                 cymbal family's plate, mounting stack, clutch and stand
 *                 (lessons/shared/cymbals/CymbalArt) for every kit size; the
 *                 boom stand has its two-stage tube, height clutch, ratchet
 *                 joint and counterweight; bells are 32 % of the diameter.
 *
 * Rules kept (as for the kick's art): nothing here moves (D8); paths are built
 * ONCE per spec and option and cached at module scope; no brand mark; parts
 * whose geometry is a drawing default stay where the spec puts them. Head
 * films are drawn ≈ 5 mm thick so they read at phone size (a line weight,
 * not a dimension). All coordinates are millimetres of the view's (u, v).
 */
import { useMemo } from 'react';
import { BlurMask, Circle, DashPathEffect, FillType, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { frameOf, hoopRadii, rodAngles, type DrumSpec, type PlacedDrum } from './drumSpec.ts';
import { CymbalSide as FamilyCymbalSide, HiHatSide as FamilyHiHatSide } from '../cymbals/CymbalArt';
import { CYMBAL_SPECS, KIT_PLACED_CYMBALS } from '../cymbals/cymbalSpec.ts';
import { KIT_FLOOR_Y } from '../kitPlanModel.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;

/* ── palette (house tokens + material ramps) ── */
const INK = '#08080a';
const PLY = ['#4a2a12', '#b98548', '#d9a766', '#9c6631', '#c48f52', '#5c3417'];
const PLY_LINE = '#2b170a';
/** Natural lacquer, lit from the upper left (a cosmetic finish: the kit's). */
const LACQUER = ['#3a2210', '#9c6631', '#e2b679', '#c48f52', '#7a4a20', '#2f1b0a'];
const LACQUER_POS = [0, 0.12, 0.3, 0.55, 0.85, 1];
const CAVITY = ['#0a0806', '#241910', '#33251a', '#2a1e14', '#140e09', '#070605'];
const CHROME = ['#3a3d45', '#eef1f6', '#9aa0ab', '#4a4e57', '#c8ccd4'];
const CHROME_V = ['#f2f4f8', '#9aa0ab', '#4a4e57', '#c8ccd4'];
const HEAD: Record<'coated' | 'clear' | 'ebony' | 'snareSide', string[]> = { coated: ['#fbf8f0', '#ece5d5', '#d6ccb7'], clear: ['#dfe6ee', '#b9c4d2', '#8d99ab'], ebony: ['#4a5060', '#272b33', '#15171c'], snareSide: ['#eef2f6', '#c9d2dd', '#a3afbf'] };
const WIRE = '#c9ced8';
const BRONZE = ['#f6d58f', '#d2a04a', '#9a6a24', '#5e3e12'];
export const DRUM_PALETTE = { INK, CHROME, LACQUER, HEAD } as const;

/* ── path helpers (build-time only) ── */
const make = () => Skia.Path.Make();
function rect(p: SkPath, x0: number, y0: number, x1: number, y1: number) {
  p.addRect(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)));
  return p;
}
function rrect(p: SkPath, x0: number, y0: number, x1: number, y1: number, r: number) {
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)), r, r));
  return p;
}
function seg(p: SkPath, a: number, b: number, c: number, d: number) {
  p.moveTo(a, b);
  p.lineTo(c, d);
  return p;
}
function oval(p: SkPath, cx: number, cy: number, rx: number, ry: number) {
  p.addOval(Skia.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2));
  return p;
}

const DEG = Math.PI / 180;

/** The drum's placement as a Skia transform for a SIDE view (x, y): its
 *  local drawing (x across, y down into the drum) rotated by its tilt. */
export function sideTransform(d: PlacedDrum) {
  return [{ translateX: d.c.x }, { translateY: d.c.y }, { rotate: -d.tiltDeg * DEG }];
}
/** …and for a TOP view (x, z): placed at its centre, no rotation. */
export function topTransform(d: PlacedDrum) {
  return [{ translateX: d.c.x }, { translateY: d.c.z }];
}

/* ═════════════════════════ SECTION (side, cut open) ═════════════════════════ */

type SectionOpts = { reso: boolean; wires: 'on' | 'off' | null };
type SectionPaths = ReturnType<typeof buildSection>;
const sectionCache = new Map<string, SectionPaths>();

/** Which rods the side cut leaves at the silhouette: the far half (sin θ ≤ 0)
 *  at the outline (|cos θ| ≥ 0.94) — the kick's rule, for any drum. */
export function sectionRods(spec: DrumSpec): { theta: number; sgn: 1 | -1 }[] {
  const out: { theta: number; sgn: 1 | -1 }[] = [];
  for (const th of rodAngles(spec)) {
    const a = th * DEG;
    if (Math.sin(a) > 0.02 || Math.abs(Math.cos(a)) < 0.94) continue;
    out.push({ theta: th, sgn: Math.cos(a) < 0 ? -1 : 1 });
  }
  return out;
}

function buildSection(spec: DrumSpec, o: SectionOpts) {
  const R = spec.d.mm / 2;
  const D = spec.depth.mm;
  const t = spec.tShell.mm;
  const rIn = R - t;
  const { rIn: hIn, rOut: hOut } = hoopRadii(spec);
  const up = spec.hoop.above.mm;
  const dn = spec.hoop.below.mm;
  // The far inner wall seen through the cut, its grain bunching at the edges.
  const cavity = rect(make(), -rIn, 0, rIn, D);
  const grain = make();
  const N = 12;
  for (let k = 1; k < N; k++) {
    const x = rIn * Math.cos((Math.PI * k) / N);
    seg(grain, x, 0, x, D);
  }
  const shadeTop = rect(make(), -rIn, 0, rIn, Math.min(26, D * 0.2));
  const shadeBot = rect(make(), -rIn, D - Math.min(26, D * 0.2), rIn, D);
  // Cut faces of the wall (left and right), ply seams vertical.
  const wallL = rect(make(), -R, 0, -rIn, D);
  const wallR = rect(make(), rIn, 0, R, D);
  const plyLines = make();
  for (let i = 1; i < spec.plies; i++) {
    const dx = (t * i) / spec.plies;
    seg(plyLines, -R + dx, 0, -R + dx, D);
    seg(plyLines, R - dx, 0, R - dx, D);
  }
  const outerEdge = seg(seg(make(), -R, 0, -R, D), R, 0, R, D);
  const innerEdge = seg(seg(make(), -rIn, 0, -rIn, D), rIn, 0, rIn, D);
  const gloss = seg(make(), -R + 0.6, 0, -R + 0.6, D);
  // Hoops: the far half edge-on (a band behind the head), and the cut faces
  // (a triple flange: the wall, a lip curled outward at the top).
  const hoopFar = make();
  rect(hoopFar, -hIn, -up, hIn, dn * 0.35);
  if (o.reso) rect(hoopFar, -hIn, D - dn * 0.35, hIn, D + up);
  const hoopCut = make();
  const flange = (sgn: number, y0: number, y1: number, lipAt: number) => {
    rrect(hoopCut, sgn * hIn, y0, sgn * hOut, y1, 0.8);
    rrect(hoopCut, sgn * hIn, lipAt - 1.2, sgn * (hOut + 4.5), lipAt + 1.2, 1);
  };
  flange(-1, -up, dn, -up);
  flange(1, -up, dn, -up);
  if (o.reso) {
    flange(-1, D - dn, D + up, D + up);
    flange(1, D - dn, D + up, D + up);
  }
  // Heads (≈ 5 mm films).
  const batter = rect(make(), -R - 1, -3, R + 1, 3);
  const reso = o.reso ? rect(make(), -R - 1, D - 3, R + 1, D + 3) : null;
  const sheen = seg(make(), -R * 0.92, -1.2, R * 0.6, -1.2);
  // Silhouette hardware: a lug per head, its rod down from the hoop's ear.
  const lugs = make();
  const rods = make();
  const ears = make();
  const lo = spec.lug.out.mm;
  const ll = spec.lug.len.mm;
  const li = spec.lug.inset.mm;
  const rodX = R + lo * 0.55;
  for (const { sgn } of sectionRods(spec)) {
    rrect(lugs, sgn * R, li, sgn * (R + lo), li + ll, 4);
    rrect(ears, sgn * hOut, -up + 1, sgn * (rodX + 5), -up + 6, 1.2);
    seg(rods, sgn * rodX, -up + 2, sgn * rodX, li + ll * 0.55);
    if (o.reso) {
      rrect(lugs, sgn * R, D - li - ll, sgn * (R + lo), D - li, 4);
      rrect(ears, sgn * hOut, D + up - 6, sgn * (rodX + 5), D + up - 1, 1.2);
      seg(rods, sgn * rodX, D + up - 2, sgn * rodX, D - li - ll * 0.55);
    }
  }
  // Snare wires (under the snare-side head), cords, strainer and butt.
  let wires: null | { band: SkPath; coils: SkPath; plates: SkPath; cords: SkPath; strainer: SkPath; lever: SkPath; butt: SkPath; y: number } = null;
  if (spec.wires && o.wires) {
    const w = spec.wires;
    const L2 = w.length.mm / 2;
    const y = D + 3 + (o.wires === 'off' ? w.dropOff.mm : 0);
    const band = rect(make(), -L2, y, L2, y + 5);
    const coils = make();
    for (let x = -L2 + 3; x < L2 - 3; x += 3.2) seg(coils, x, y + 0.4, x + 1.6, y + 4.6);
    const plates = rect(rect(make(), -L2 - 7, y - 0.5, -L2, y + 4), L2, y - 0.5, L2 + 7, y + 4);
    const sx = w.strainerDeg.mm >= 90 && w.strainerDeg.mm <= 270 ? -1 : 1;
    const strainer = rrect(make(), sx * (R + 2), D * 0.22, sx * (R + 30), D * 0.78, 3);
    // The throw-off lever: up (snares on) or swung down (off).
    const lever = o.wires === 'on' ? rrect(make(), sx * (R + 22), D * 0.02, sx * (R + 30), D * 0.5, 2.5) : rrect(make(), sx * (R + 22), D * 0.5, sx * (R + 30), D * 0.98, 2.5);
    const butt = rrect(make(), -sx * (R + 2), D * 0.5, -sx * (R + 20), D * 0.9, 2.5);
    // Cords: from each end plate round the bottom hoop's edge to its fitting.
    const cords = make();
    cords.moveTo(sx * (L2 + 7), y + 1.8);
    cords.lineTo(sx * (hOut + 1), D + up + 1);
    cords.lineTo(sx * (R + 16), D * 0.78);
    cords.moveTo(-sx * (L2 + 7), y + 1.8);
    cords.lineTo(-sx * (hOut + 1), D + up + 1);
    cords.lineTo(-sx * (R + 11), D * 0.9);
    wires = { band, coils, plates, cords, strainer, lever, butt, y };
  }
  return { R, D, rIn, hIn, hOut, up, cavity, grain, shadeTop, shadeBot, wallL, wallR, plyLines, outerEdge, innerEdge, gloss, hoopFar, hoopCut, batter, reso, sheen, lugs, rods, ears, wires };
}

function sectionPaths(spec: DrumSpec, o: SectionOpts): SectionPaths {
  const key = `${spec.id}:${o.reso ? 1 : 0}:${o.wires ?? '-'}`;
  let p = sectionCache.get(key);
  if (!p) {
    p = buildSection(spec, o);
    sectionCache.set(key, p);
  }
  return p;
}

/**
 * A drum CUT OPEN at its centre plane, seen from the side, in the drum's own
 * local frame (x across, y down into the drum, the batter at y = 0). Place it
 * with `sideTransform(drum)`.
 */
export function DrumSection({ spec, reso = true, wires = null }: { spec: DrumSpec; reso?: boolean; wires?: 'on' | 'off' | null }) {
  const g = sectionPaths(spec, { reso: reso && spec.reso != null, wires: spec.wires ? wires : null });
  const { R, D, rIn, hIn } = g;
  const head = HEAD[spec.batter];
  const resoCols = spec.reso ? HEAD[spec.reso] : HEAD.clear;
  return (
    <Group>
      {/* The far inner wall: warm, dim, lit from the upper left. */}
      <Path path={g.cavity}>
        <LinearGradient start={vec(-rIn, 0)} end={vec(rIn, 0)} colors={CAVITY} positions={[0, 0.16, 0.38, 0.62, 0.86, 1]} />
      </Path>
      <Path path={g.cavity}>
        <RadialGradient c={vec(-rIn * 0.4, D * 0.25)} r={Math.max(R, D) * 1.2} colors={['rgba(255,214,160,0.09)', 'rgba(255,214,160,0)']} />
      </Path>
      <Path path={g.grain} style="stroke" strokeWidth={0.9} color="#d9a766" opacity={0.12} />
      <Path path={g.shadeTop}>
        <LinearGradient start={vec(0, 0)} end={vec(0, Math.min(26, D * 0.2))} colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']} />
      </Path>
      <Path path={g.shadeBot}>
        <LinearGradient start={vec(0, D)} end={vec(0, D - Math.min(26, D * 0.2))} colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']} />
      </Path>
      {/* The hoops' far halves, edge-on, behind the heads. */}
      <Path path={g.hoopFar}>
        <LinearGradient start={vec(-hIn, 0)} end={vec(hIn, 0)} colors={['#2a2c32', '#6c717c', '#3a3d45', '#1d1e23']} />
      </Path>
      {/* Shell cut faces: the plies, the lacquer gloss, the inner edge. */}
      <Path path={g.wallL}>
        <LinearGradient start={vec(-R, 0)} end={vec(-rIn, 0)} colors={PLY} />
      </Path>
      <Path path={g.wallR}>
        <LinearGradient start={vec(R, 0)} end={vec(rIn, 0)} colors={PLY} />
      </Path>
      <Path path={g.plyLines} style="stroke" strokeWidth={0.3} color={PLY_LINE} opacity={0.75} />
      <Path path={g.outerEdge} style="stroke" strokeWidth={1.2} color="#140b05" />
      <Path path={g.gloss} style="stroke" strokeWidth={0.9} color="#ffe2ae" opacity={0.55} />
      <Path path={g.innerEdge} style="stroke" strokeWidth={0.9} color={INK} opacity={0.9} />
      {/* Heads: the coated batter; the resonant (or snare-side) film. */}
      <Path path={g.batter}>
        <LinearGradient start={vec(-R, 0)} end={vec(R, 0)} colors={head} />
      </Path>
      <Path path={g.sheen} style="stroke" strokeWidth={1} color="#ffffff" opacity={0.55} />
      <Path path={g.batter} style="stroke" strokeWidth={0.7} color="#8a7f6c" opacity={0.7} />
      {g.reso ? (
        <>
          <Path path={g.reso}>
            <LinearGradient start={vec(-R, 0)} end={vec(R, 0)} colors={resoCols} />
          </Path>
          <Path path={g.reso} style="stroke" strokeWidth={0.7} color="#6c7686" opacity={0.7} />
        </>
      ) : null}
      {/* Hoop cut faces: a chrome triple flange, lit edge on top. */}
      <Path path={g.hoopCut}>
        <LinearGradient start={vec(0, -g.up)} end={vec(0, D + g.up)} colors={CHROME_V} />
      </Path>
      <Path path={g.hoopCut} style="stroke" strokeWidth={0.7} color={INK} />
      {/* Hardware at the silhouette: lugs, rods, the hoop ears. */}
      <Path path={g.lugs}>
        <LinearGradient start={vec(-R - 24, 0)} end={vec(R + 24, 0)} colors={CHROME} />
      </Path>
      <Path path={g.lugs} style="stroke" strokeWidth={0.7} color={INK} />
      <Path path={g.rods} style="stroke" strokeWidth={3.4} strokeCap="round" color="#2a2c32" />
      <Path path={g.rods} style="stroke" strokeWidth={1.1} strokeCap="round" color="#d9dde5" opacity={0.85} />
      <Path path={g.ears} color="#b6bbc5" />
      <Path path={g.ears} style="stroke" strokeWidth={0.6} color={INK} />
      {g.wires ? <SnareWires w={g.wires} /> : null}
    </Group>
  );
}

function SnareWires({ w }: { w: NonNullable<SectionPaths['wires']> }) {
  return (
    <>
      <Path path={w.cords} style="stroke" strokeWidth={2.2} strokeJoin="round" color="#1b1c21" />
      <Path path={w.cords} style="stroke" strokeWidth={0.9} strokeJoin="round" color="#6c717c" />
      <Path path={w.band} color="#7d828d" />
      <Path path={w.coils} style="stroke" strokeWidth={0.7} color={WIRE} opacity={0.95} />
      <Path path={w.band} style="stroke" strokeWidth={0.6} color={INK} opacity={0.8} />
      <Path path={w.plates}>
        <LinearGradient start={vec(0, w.y)} end={vec(0, w.y + 4)} colors={['#eef1f6', '#7d828d']} />
      </Path>
      <Path path={w.strainer}>
        <LinearGradient start={vec(0, 0)} end={vec(30, 0)} colors={CHROME} />
      </Path>
      <Path path={w.strainer} style="stroke" strokeWidth={0.8} color={INK} />
      <Path path={w.lever} color="#2a2c32" />
      <Path path={w.lever} style="stroke" strokeWidth={0.8} color="#c6cad4" />
      <Path path={w.butt}>
        <LinearGradient start={vec(0, 0)} end={vec(20, 0)} colors={CHROME} />
      </Path>
      <Path path={w.butt} style="stroke" strokeWidth={0.8} color={INK} />
    </>
  );
}

/* ═════════════════════════ EXTERIOR (side, uncut) ═════════════════════════ */

const exteriorCache = new Map<string, ReturnType<typeof buildExterior>>();

function buildExterior(spec: DrumSpec, reso: boolean) {
  const R = spec.d.mm / 2;
  const D = spec.depth.mm;
  const { hOut, up, dn } = { hOut: hoopRadii(spec).rOut, up: spec.hoop.above.mm, dn: spec.hoop.below.mm };
  const shell = rect(make(), -R, 0, R, D);
  const shadow = oval(make(), 0, D + 3, R * 1.02, Math.max(4, R * 0.05));
  // Hoops as bands across the full width (the near half, seen side-on).
  const hoopTop = rrect(make(), -hOut, -up, hOut, dn, 1.5);
  const hoopBot = reso ? rrect(make(), -hOut, D - dn, hOut, D + up, 1.5) : null;
  const lips = make();
  seg(lips, -hOut - 3, -up, hOut + 3, -up);
  if (reso) seg(lips, -hOut - 3, D + up, hOut + 3, D + up);
  // Near-side lugs (sin θ > 0), foreshortened by sin θ; rods from the hoop.
  const lugs = make();
  const rods = make();
  const li = spec.lug.inset.mm;
  const ll = spec.lug.len.mm;
  for (const th of rodAngles(spec)) {
    const a = th * DEG;
    if (Math.sin(a) <= 0.05) continue;
    const x = R * Math.cos(a);
    const hw = 6 * Math.sin(a) + 1.5;
    rrect(lugs, x - hw, li, x + hw, li + ll, 3);
    seg(rods, x, -up + 2, x, li + ll * 0.5);
    if (reso) {
      rrect(lugs, x - hw, D - li - ll, x + hw, D - li, 3);
      seg(rods, x, D + up - 2, x, D - li - ll * 0.5);
    }
  }
  return { R, D, hOut, up, shell, shadow, hoopTop, hoopBot, lips, lugs, rods };
}

/**
 * A drum from the side, uncut (a neighbour in a lesson's view), in its local
 * frame; place it with `sideTransform(drum)`. `dim` < 1 recedes it.
 */
export function DrumExterior({ spec, reso = true, dim = 1 }: { spec: DrumSpec; reso?: boolean; dim?: number }) {
  const key = `${spec.id}:${reso ? 1 : 0}`;
  let g = exteriorCache.get(key);
  if (!g) {
    g = buildExterior(spec, reso && spec.reso != null);
    exteriorCache.set(key, g);
  }
  const { R, D, hOut, up } = g;
  const hoopCols = spec.hoop.kind === 'wood' ? ['#2f1b0a', '#c48a4c', '#9a6430', '#5e3a1b'] : CHROME;
  return (
    <Group opacity={dim}>
      <Path path={g.shadow} color="#000" opacity={0.45}>
        <BlurMask blur={6} style="normal" />
      </Path>
      <Path path={g.shell}>
        <LinearGradient start={vec(-R, 0)} end={vec(R, 0)} colors={LACQUER} positions={LACQUER_POS} />
      </Path>
      <Path path={g.shell}>
        <LinearGradient start={vec(0, 0)} end={vec(0, D)} colors={['rgba(255,240,210,0.10)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.25)']} />
      </Path>
      <Path path={g.shell} style="stroke" strokeWidth={1} color="#140b05" />
      <Path path={g.lugs}>
        <LinearGradient start={vec(-R, 0)} end={vec(R, 0)} colors={CHROME} />
      </Path>
      <Path path={g.lugs} style="stroke" strokeWidth={0.6} color={INK} />
      <Path path={g.rods} style="stroke" strokeWidth={3} strokeCap="round" color="#2a2c32" />
      <Path path={g.rods} style="stroke" strokeWidth={1} strokeCap="round" color="#d9dde5" opacity={0.8} />
      <Path path={g.hoopTop}>
        <LinearGradient start={vec(-hOut, -up)} end={vec(hOut, 0)} colors={hoopCols} />
      </Path>
      <Path path={g.hoopTop} style="stroke" strokeWidth={0.7} color={INK} />
      {g.hoopBot ? (
        <>
          <Path path={g.hoopBot}>
            <LinearGradient start={vec(-hOut, D)} end={vec(hOut, D + up)} colors={hoopCols} />
          </Path>
          <Path path={g.hoopBot} style="stroke" strokeWidth={0.7} color={INK} />
        </>
      ) : null}
      {spec.hoop.kind === 'triple' ? <Path path={g.lips} style="stroke" strokeWidth={2.4} strokeCap="round" color="#dfe3ea" /> : null}
    </Group>
  );
}

/** A HORIZONTAL drum from the side (the kick as a neighbour): DrumExterior
 *  turned so its axis runs along +x from its batter head at `x0`. */
export function KickSideNeighbour({ spec, x0, cy, dim = 0.5 }: { spec: DrumSpec; x0: number; cy: number; dim?: number }) {
  return (
    <Group transform={[{ translateX: x0 }, { translateY: cy }, { rotate: -Math.PI / 2 }]}>
      <DrumExterior spec={spec} dim={dim} />
    </Group>
  );
}

/** The kick from above (uncut): its shell as a lit cylinder, both wood hoops,
 *  the lugs, claws and T-rods on its upper half, and the pedal on the
 *  player's side. `u0` is
 *  the batter head's x; `z` its axis. */
export function KickFromAbove({ spec, u0, z, pedal, dim = 1 }: { spec: DrumSpec; u0: number; z: number; pedal?: { u0: number; u1: number; halfW: number }; dim?: number }) {
  const R = spec.d.mm / 2;
  const L = spec.depth.mm;
  const { rOut } = hoopRadii(spec);
  const parts = useMemo(() => {
    const shell = rrect(make(), 0, -R, L, R, 4);
    const hoops = make();
    rrect(hoops, -spec.hoop.above.mm, -rOut, spec.hoop.below.mm, rOut, 5);
    rrect(hoops, L - spec.hoop.below.mm, -rOut, L + spec.hoop.above.mm, rOut, 5);
    // The hardware on the upper half (seen from above): at every rod angle φ
    // (from the bottom toward +z, the M01 convention) with cos φ ≤ 0, a lug on
    // the shell, a T-rod from the claw on the hoop to it, and the T handle —
    // both ends. Real sizes: lug ≈ 16 × 32 mm standing 24 mm off the shell,
    // rod axis ≈ 16 mm off the shell, claw ≈ 14 mm wide, T bar ≈ 28 mm.
    const rods = make();
    const lugs = make();
    const claws = make();
    const tees = make();
    const up = spec.hoop.above.mm;
    for (const phi of rodAngles(spec)) {
      const a = (phi * Math.PI) / 180;
      if (Math.cos(a) > 0.01) continue;
      const sn = Math.sin(a);
      const zr = (R + 16) * sn;
      const zl0 = R * sn - 8 * Math.abs(Math.cos(a)) * Math.sign(sn || 1);
      const zl1 = (R + 24) * sn + 8 * Math.abs(Math.cos(a)) * Math.sign(sn || 1);
      for (const end of [0, 1] as const) {
        const X = (x: number) => (end === 0 ? x : L - x);
        seg(rods, X(-up - 6), zr, X(60), zr);
        rrect(lugs, X(44), Math.min(zl0, zl1), X(76), Math.max(zl0, zl1), 6);
        rrect(claws, X(-up - 3), zr - 7, X(spec.hoop.below.mm + 2), zr + 7, 2);
        rrect(tees, X(-up - 13), zr - 14, X(-up - 7), zr + 14, 2.5);
      }
    }
    const ped = pedal ? rrect(make(), pedal.u0 - u0, -pedal.halfW, pedal.u1 - u0, pedal.halfW, 10) : null;
    return { shell, hoops, rods, lugs, claws, tees, ped };
  }, [R, L, rOut, spec, pedal, u0]);
  return (
    <Group opacity={dim} transform={[{ translateX: u0 }, { translateY: z }]}>
      <Group transform={[{ translateX: 12 }, { translateY: 16 }]}>
        <Path path={parts.shell} color="#000" opacity={0.5}>
          <BlurMask blur={14} style="normal" />
        </Path>
      </Group>
      <Path path={parts.shell}>
        <LinearGradient start={vec(0, -R)} end={vec(0, R)} colors={['#3a2210', '#e2b679', '#c48f52', '#7a4a20', '#2f1b0a']} positions={[0, 0.25, 0.5, 0.8, 1]} />
      </Path>
      <Path path={parts.lugs}>
        <LinearGradient start={vec(0, -R - 24)} end={vec(0, R + 24)} colors={CHROME} />
      </Path>
      <Path path={parts.lugs} style="stroke" strokeWidth={0.8} color={INK} />
      <Path path={parts.rods} style="stroke" strokeWidth={6} strokeCap="round" color="#2a2c32" />
      <Path path={parts.rods} style="stroke" strokeWidth={2} strokeCap="round" color="#d9dde5" opacity={0.8} />
      <Path path={parts.hoops}>
        <LinearGradient start={vec(0, -rOut)} end={vec(0, rOut)} colors={['#c48a4c', '#7a4a20', '#2f1b0a']} />
      </Path>
      <Path path={parts.claws}>
        <LinearGradient start={vec(0, -rOut)} end={vec(0, rOut)} colors={CHROME} />
      </Path>
      <Path path={parts.claws} style="stroke" strokeWidth={0.8} color={INK} />
      <Path path={parts.tees}>
        <LinearGradient start={vec(0, -rOut)} end={vec(0, rOut)} colors={CHROME} />
      </Path>
      {parts.ped ? (
        <Path path={parts.ped}>
          <LinearGradient start={vec(-300, -45)} end={vec(0, 45)} colors={['#6b707b', '#3a3d45', '#22242a']} />
        </Path>
      ) : null}
    </Group>
  );
}

/** A drumstick (ILLUSTRATIVE: no source gives a stick; a common 16 in
 *  hickory stick drawn), from its butt to its tip bead. */
export function Stick({ from, to, dim = 1 }: { from: { x: number; y: number }; to: { x: number; y: number }; dim?: number }) {
  const ang = Math.atan2(to.y - from.y, to.x - from.x);
  const len = Math.hypot(to.x - from.x, to.y - from.y);
  const p = useMemo(() => {
    // A tapered dowel along +x: Ø 14 at the butt to a shoulder, a bead tip.
    const body = make();
    body.moveTo(0, -7);
    body.lineTo(len * 0.78, -6);
    body.quadTo(len * 0.93, -3.2, len - 9, -2.6);
    body.lineTo(len - 9, 2.6);
    body.quadTo(len * 0.93, 3.2, len * 0.78, 6);
    body.lineTo(0, 7);
    body.close();
    const bead = oval(make(), len - 5, 0, 6, 4.4);
    return { body, bead };
  }, [len]);
  return (
    <Group opacity={dim} transform={[{ translateX: from.x }, { translateY: from.y }, { rotate: ang }]}>
      <Path path={p.body}>
        <LinearGradient start={vec(0, -7)} end={vec(0, 7)} colors={['#f3dcae', '#d9b277', '#a87b42', '#6e4a22']} />
      </Path>
      <Path path={p.bead}>
        <RadialGradient c={vec(len - 7, -1.5)} r={7} colors={['#fff2d6', '#d9b277', '#8a5e2e']} />
      </Path>
      <Path path={p.body} style="stroke" strokeWidth={0.8} color="#3a240e" opacity={0.8} />
    </Group>
  );
}

/* ═════════════════════════ PLAN (from above) ═════════════════════════ */

const planCache = new Map<string, ReturnType<typeof buildPlan>>();

function buildPlan(d: PlacedDrum) {
  const s = d.spec;
  const f = frameOf(d);
  const R = f.R;
  const ct = Math.cos(d.tiltDeg * DEG);
  const shift = f.depth * Math.sin(d.tiltDeg * DEG);
  const { rIn, rOut } = hoopRadii(s);
  // The shell's visible side (a tilt shows its lower edge toward +x): the
  // hull of the head ellipse and the bottom rim, shifted.
  const hull = make();
  if (shift > 0.5) {
    hull.moveTo(0, -R);
    hull.lineTo(shift, -R);
    hull.arcToOval(Skia.XYWHRect(shift - R * ct, -R, 2 * R * ct, 2 * R), -90, 180, false);
    hull.lineTo(0, R);
    hull.close();
  }
  const head = oval(make(), 0, 0, R * ct, R);
  const hoop = oval(oval(make(), 0, 0, rOut * ct, rOut), 0, 0, rIn * ct, rIn);
  hoop.setFillType(FillType.EvenOdd); // a ring
  const inner = oval(make(), 0, 0, (R - 14) * ct, R - 14);
  // Rods and lugs, at the rod angles, on the projected hoop.
  const lugs = make();
  const rods = make();
  const P = (r: number, th: number) => ({ x: Math.cos(th * DEG) * r * ct, y: Math.sin(th * DEG) * r });
  for (const th of rodAngles(s)) {
    const a = P(rOut + 2, th);
    const b = P(R + s.lug.out.mm + 4, th);
    seg(rods, a.x, a.y, b.x, b.y);
    const q0 = P(R + 4, th - 2.2);
    const q1 = P(R + s.lug.out.mm, th - 2.2);
    const q2 = P(R + s.lug.out.mm, th + 2.2);
    const q3 = P(R + 4, th + 2.2);
    lugs.moveTo(q0.x, q0.y);
    lugs.lineTo(q1.x, q1.y);
    lugs.lineTo(q2.x, q2.y);
    lugs.lineTo(q3.x, q3.y);
    lugs.close();
  }
  // A snare's strainer and butt on the shell.
  const fittings = make();
  if (s.wires) {
    for (const [deg, w] of [
      [s.wires.strainerDeg.mm, 15],
      [s.wires.buttDeg.mm, 10],
    ] as const) {
      const a = P(R + 2, deg - 4);
      const b = P(R + 30, deg + 4);
      rrect(fittings, Math.min(a.x, b.x), Math.min(a.y, b.y) - (w - 10), Math.max(a.x, b.x), Math.max(a.y, b.y) + (w - 10), 3);
    }
  }
  // A floor tom's legs: from a bracket on the shell out to the floor.
  const legs = make();
  const feet = make();
  if (s.legs) {
    for (let k = 0; k < s.legs.n.mm; k++) {
      const th = s.legs.phaseDeg.mm + (k * 360) / s.legs.n.mm;
      const a = P(R + 18, th);
      const b = P(R + s.legs.spread.mm, th);
      seg(legs, a.x, a.y, b.x, b.y);
      oval(feet, b.x, b.y, 10, 10);
    }
  }
  return { R, ct, shift, rOut, hull, head, hoop, inner, lugs, rods, fittings, legs, feet };
}

/**
 * A drum seen from above, at its centre (place with `topTransform(drum)`).
 * `highlight` rings it in amber; `dim` recedes it (a drum mounted above
 * another is drawn translucent by the kit plan).
 */
export function DrumPlan({ drum, highlight = false, dim = 1, dashed = false }: { drum: PlacedDrum; highlight?: boolean; dim?: number; dashed?: boolean }) {
  const key = `${drum.spec.id}:${drum.tiltDeg}`;
  let g = planCache.get(key);
  if (!g) {
    g = buildPlan(drum);
    planCache.set(key, g);
  }
  const { R, ct, rOut } = g;
  const head = HEAD[drum.spec.batter];
  return (
    <Group opacity={dim}>
      <Group transform={[{ translateX: 12 }, { translateY: 16 }]}>
        <Path path={g.head} color="#000" opacity={0.5}>
          <BlurMask blur={14} style="normal" />
        </Path>
      </Group>
      {g.legs ? <Path path={g.legs} style="stroke" strokeWidth={13} strokeCap="round" color="#2a2c32" /> : null}
      <Path path={g.legs} style="stroke" strokeWidth={8} strokeCap="round" color="#9aa0ab" />
      <Path path={g.feet} color="#17181c" />
      {g.shift > 0.5 ? (
        <Path path={g.hull}>
          <LinearGradient start={vec(R * ct, 0)} end={vec(R * ct + g.shift, 0)} colors={['#c48f52', '#7a4a20', '#2f1b0a']} />
        </Path>
      ) : null}
      <Path path={g.lugs}>
        <LinearGradient start={vec(-R, -R)} end={vec(R, R)} colors={['#eef1f6', '#9aa0ab', '#4a4e57']} />
      </Path>
      <Path path={g.rods} style="stroke" strokeWidth={5} strokeCap="round" color="#2a2c32" />
      <Path path={g.rods} style="stroke" strokeWidth={1.8} strokeCap="round" color="#d9dde5" opacity={0.8} />
      <Path path={g.fittings}>
        <LinearGradient start={vec(-R, -R)} end={vec(R, R)} colors={CHROME} />
      </Path>
      <Path path={g.hoop}>
        <LinearGradient start={vec(-rOut, -rOut)} end={vec(rOut, rOut)} colors={['#eef1f6', '#9aa0ab', '#3a3d45', '#c8ccd4']} />
      </Path>
      <Path path={g.head}>
        <RadialGradient c={vec(-R * 0.35 * ct, -R * 0.4)} r={R * 1.7} colors={head} />
      </Path>
      <Path path={g.inner} style="stroke" strokeWidth={2} color="#a99f88" opacity={0.55} />
      {dashed ? (
        <Path path={g.hoop} style="stroke" strokeWidth={4} color="#e8eaee">
          <DashPathEffect intervals={[18, 12]} />
        </Path>
      ) : null}
      {highlight ? <Circle cx={0} cy={0} r={R + 46} style="stroke" strokeWidth={9} color="#ffc64d" /> : null}
    </Group>
  );
}

/* ═════════════════════════ KIT CONTEXT: cymbals, hi-hat, stands ═════════════════════════ */

/** A cymbal's profile (side), local: centre at the origin, edge at ±R; the
 *  rise (8 % of the diameter) and bell (32 %) are drawing defaults. */
function cymbalProfile(R: number) {
  const rise = 0.16 * R;
  const bellR = 0.32 * R;
  const p = make();
  p.moveTo(-R, 0);
  p.cubicTo(-R * 0.6, -rise * 0.35, -bellR * 1.6, -rise * 0.62, -bellR, -rise * 0.7);
  p.cubicTo(-bellR * 0.9, -rise * 1.35, bellR * 0.9, -rise * 1.35, bellR, -rise * 0.7);
  p.cubicTo(bellR * 1.6, -rise * 0.62, R * 0.6, -rise * 0.35, R, 0);
  p.lineTo(R, 2.2);
  p.cubicTo(R * 0.6, -rise * 0.35 + 2.2, bellR * 1.6, -rise * 0.62 + 2.4, bellR, -rise * 0.7 + 2.4);
  p.lineTo(-bellR, -rise * 0.7 + 2.4);
  p.cubicTo(-bellR * 1.6, -rise * 0.62 + 2.4, -R * 0.6, -rise * 0.35 + 2.2, -R, 2.2);
  p.close();
  return p;
}
const cymCache = new Map<number, SkPath>();
function cym(R: number) {
  let p = cymCache.get(R);
  if (!p) {
    p = cymbalProfile(R);
    cymCache.set(R, p);
  }
  return p;
}

/** The cymbal family's spec for a kit cymbal of this diameter (14, 16, 18
 *  or 20 in), or null. */
function familySpec(d: number) {
  return Object.values(CYMBAL_SPECS).find((s) => Math.abs(s.d.mm - d) < 1) ?? null;
}

/** A cymbal from the side, centre at (cx, cy), tilted toward the drummer:
 *  the cymbal family's plate (lathed bronze profile, bell) on its mounting
 *  stack — tilter, felts, sleeve, wing nut — for every kit size; the plain
 *  profile only for a size the family does not carry. */
export function CymbalSide({ cx, cy, d, tiltDeg, dim = 1 }: { cx: number; cy: number; d: number; tiltDeg: number; dim?: number }) {
  const spec = familySpec(d);
  if (spec) return <FamilyCymbalSide spec={spec} cx={cx} cy={cy} tiltDeg={tiltDeg} dim={dim} />;
  const R = d / 2;
  const p = cym(R);
  return (
    <Group opacity={dim} transform={[{ translateX: cx }, { translateY: cy }, { rotate: -tiltDeg * DEG }]}>
      <Path path={p}>
        <LinearGradient start={vec(-R, -R * 0.2)} end={vec(R, R * 0.1)} colors={BRONZE} />
      </Path>
      <Path path={p} style="stroke" strokeWidth={0.9} color="#5e3e12" />
      <Circle cx={0} cy={-R * 0.2} r={4} color="#1a1b1f" />
    </Group>
  );
}

/**
 * A boom cymbal stand from the side, built on the given foot, joint height
 * (`top`) and cymbal centre: a tripod (Ø 22 mm legs, ≈ 160 mm reach, hub
 * 150 mm up), a Ø 25 mm lower tube, the height clutch, a Ø 19 mm upper tube
 * to the boom joint, and the Ø 19 mm boom from its 48 mm counterweight
 * (140 mm behind the joint) up to the cymbal's tilter ≈ 24 mm under the
 * cymbal (drawing defaults; kit proposal §2, the cymbal family's sizes).
 */
export function BoomStandSide({ foot, top, cym: c, floorY, dim = 1 }: { foot: number; top: number; cym: { x: number; y: number }; floorY: number; dim?: number }) {
  const g = useMemo(() => {
    const hub = floorY - 150;
    const legs = make();
    seg(legs, foot, hub, foot - 160, floorY);
    seg(legs, foot, hub, foot + 160, floorY);
    seg(legs, foot, hub, foot + 48, floorY);
    const clutchY = (hub + top) / 2 + 40;
    const lower = seg(make(), foot, hub, foot, clutchY);
    const upper = seg(make(), foot, clutchY, foot, top);
    const end = { x: c.x, y: c.y + 24 };
    const dx = end.x - foot;
    const dy = end.y - top;
    const l = Math.hypot(dx, dy) || 1;
    const back = { x: foot - (dx / l) * 140, y: top - (dy / l) * 140 };
    const boom = seg(make(), back.x, back.y, end.x, end.y);
    return { legs, lower, upper, boom, back, clutchY, hub };
  }, [foot, top, c.x, c.y, floorY]);
  return (
    <Group opacity={dim}>
      <Path path={g.legs} style="stroke" strokeWidth={10} strokeCap="round" color="#1d1e23" />
      <Path path={g.legs} style="stroke" strokeWidth={6} strokeCap="round" color="#8a8f99" />
      <Circle cx={foot} cy={g.hub} r={13} color="#1b1c21" />
      <Path path={g.lower} style="stroke" strokeWidth={29} strokeCap="round" color="#16171b" />
      <Path path={g.lower} style="stroke" strokeWidth={25} strokeCap="round" color="#7d828d" />
      <Path path={g.upper} style="stroke" strokeWidth={22} strokeCap="round" color="#16171b" />
      <Path path={g.upper} style="stroke" strokeWidth={17} strokeCap="round" color="#aeb3bd" />
      <Group transform={[{ translateX: -3 }, { translateY: 0 }]}>
        <Path path={g.upper} style="stroke" strokeWidth={2.2} strokeCap="round" color="#eef1f6" opacity={0.55} />
      </Group>
      <Path path={g.boom} style="stroke" strokeWidth={22} strokeCap="round" color="#16171b" />
      <Path path={g.boom} style="stroke" strokeWidth={16} strokeCap="round" color="#9aa0ab" />
      <Circle cx={g.back.x} cy={g.back.y} r={24}>
        <RadialGradient c={vec(g.back.x - 8, g.back.y - 8)} r={34} colors={['#6c717c', '#2a2c32', '#121317']} />
      </Circle>
      {/* the height clutch (a wing bolt on its collar) and the ratchet boom joint */}
      <Circle cx={foot} cy={g.clutchY} r={16} color="#16171b" />
      <Circle cx={foot} cy={g.clutchY} r={16} style="stroke" strokeWidth={2} color="#9aa0ab" />
      <Circle cx={foot + 22} cy={g.clutchY} r={7} color="#2a2c32" />
      <Circle cx={foot} cy={top} r={18}>
        <RadialGradient c={vec(foot - 5, top - 5)} r={22} colors={['#eef1f6', '#7d828d', '#2a2c32']} />
      </Circle>
      <Circle cx={foot} cy={top} r={18} style="stroke" strokeWidth={1.4} color={INK} />
    </Group>
  );
}

/** A cymbal from above (an ellipse when tilted), lathed bronze, its bell. */
export function CymbalPlan({ cx, cz, d, tiltDeg, highlight = false, dim = 0.82 }: { cx: number; cz: number; d: number; tiltDeg: number; highlight?: boolean; dim?: number }) {
  const R = d / 2;
  const ct = Math.cos(tiltDeg * DEG);
  const { rings, disc } = useMemo(() => {
    const rings = make();
    for (let q = R * 0.3; q < R - 4; q += 11) oval(rings, 0, 0, q * ct, q);
    return { rings, disc: oval(make(), 0, 0, R * ct, R) };
  }, [R, ct]);
  return (
    <Group transform={[{ translateX: cx }, { translateY: cz }]}>
      <Group opacity={dim}>
        <Group transform={[{ translateX: 14 }, { translateY: 18 }]}>
          <Path path={disc} color="#000" opacity={0.4}>
            <BlurMask blur={16} style="normal" />
          </Path>
        </Group>
        <Path path={disc}>
          <RadialGradient c={vec(-R * 0.4 * ct, -R * 0.45)} r={R * 1.8} colors={BRONZE} />
        </Path>
        <Path path={rings} style="stroke" strokeWidth={1.6} color="#5e3e12" opacity={0.4} />
        <Circle cx={0} cy={0} r={R * 0.32}>
          <RadialGradient c={vec(-R * 0.1, -R * 0.11)} r={R * 0.45} colors={['#fff0c4', '#d9a85a', '#8a5e1e']} />
        </Circle>
        <Circle cx={0} cy={0} r={12} color="#1a1b1f" />
        <Path path={disc} style="stroke" strokeWidth={3} color="#7a5418" />
      </Group>
      {/* the rim, crisp at any translucency: a cymbal above reads as above */}
      <Path path={disc} style="stroke" strokeWidth={3.5} color="#e2b679" opacity={0.75} />
      <Circle cx={0} cy={0} r={12} color="#1a1b1f" opacity={0.8} />
      {highlight ? <Circle cx={0} cy={0} r={R + 40} style="stroke" strokeWidth={9} color="#ffc64d" /> : null}
    </Group>
  );
}

/** A closed hi-hat from the side: the pair, the clutch and rod, the stand's
 *  tube and tripod, the pedal toward the drummer (−x). Drawing defaults. */
export function HiHatSide({ cx, cy, d, floorY, dim = 1 }: { cx: number; cy: number; d: number; floorY: number; dim?: number }) {
  const R = d / 2;
  const p = cym(R);
  const { tube, rod, legs, pedal } = useMemo(() => {
    const legs = make();
    seg(legs, cx, floorY - 150, cx - 170, floorY);
    seg(legs, cx, floorY - 150, cx + 170, floorY);
    return { tube: seg(make(), cx, cy + 40, cx, floorY - 40), rod: seg(make(), cx, cy - 60, cx, cy + 40), legs, pedal: rrect(make(), cx - 260, floorY - 46, cx - 20, floorY - 30, 6) };
  }, [cx, cy, floorY]);
  // At the kit's own hi-hat (14 in, at its height over the floor) this is the
  // cymbal family's: the pair, clutch and pull rod, seat, two-stage stand,
  // tripod and pedal, moved into the caller's frame.
  const hh = KIT_PLACED_CYMBALS.hihat;
  if (Math.abs(d - hh.spec.d.mm) < 1 && Math.abs(floorY - cy - (KIT_FLOOR_Y - hh.c.y)) < 1) {
    return (
      <Group transform={[{ translateX: cx - hh.c.x }, { translateY: cy - hh.c.y }]}>
        <FamilyHiHatSide dim={dim} />
      </Group>
    );
  }
  return (
    <Group opacity={dim}>
      <Path path={legs} style="stroke" strokeWidth={8} strokeCap="round" color="#5b5f69" />
      <Path path={pedal}>
        <LinearGradient start={vec(cx - 260, floorY - 46)} end={vec(cx, floorY - 30)} colors={['#1f2126', '#6b707b', '#30323a']} />
      </Path>
      <Path path={tube} style="stroke" strokeWidth={15} strokeCap="round" color="#2a2c32" />
      <Path path={tube} style="stroke" strokeWidth={10} strokeCap="round" color="#8a8f99" />
      <Path path={rod} style="stroke" strokeWidth={5} strokeCap="round" color="#c6cad4" />
      {/* bottom cymbal (inverted), then the top one */}
      <Group transform={[{ translateX: cx }, { translateY: cy + 8 }, { scaleY: -1 }]}>
        <Path path={p}>
          <LinearGradient start={vec(-R, 0)} end={vec(R, 0)} colors={BRONZE} />
        </Path>
        <Path path={p} style="stroke" strokeWidth={0.9} color="#5e3e12" />
      </Group>
      <Group transform={[{ translateX: cx }, { translateY: cy }]}>
        <Path path={p}>
          <LinearGradient start={vec(-R, -R * 0.2)} end={vec(R, R * 0.1)} colors={BRONZE} />
        </Path>
        <Path path={p} style="stroke" strokeWidth={0.9} color="#5e3e12" />
      </Group>
      <Circle cx={cx} cy={cy - 36} r={9} color="#16171b" />
      <Circle cx={cx} cy={cy - 36} r={9} style="stroke" strokeWidth={2} color="#8a8f99" />
    </Group>
  );
}

/**
 * A snare stand from the side, under a drum whose bottom hoop sits at
 * `basketY`. Drawing defaults (snare/GEOMETRY_PROPOSAL §3: "leg spread and
 * basket UNKNOWN"); REAL proportions of a double-braced basket stand (mm):
 *   basket centre 50 under the hoop; three basket arms (Ø 10 steel) rising
 *   from it to rubber-tipped cradle hooks that grip the bottom hoop's edge
 *   (rubber sleeve ≈ 30 long, hook lip ≈ 14 up); the basket adjustment knob
 *   (Ø 36) under the basket centre; a ratchet tilter (Ø 40 disc, T-bolt) on
 *   a Ø 19 upper tube; the height clutch (memory collar + wing bolt) on a
 *   Ø 25.4 lower tube; three Ø 19 legs from the top collar (150 up) to
 *   rubber feet ≈ 240 out, braced from a lower collar 60 up.
 * Legs and arms sit at their plan angles (`legsDeg`, `armsDeg`; θ from +x
 * toward +z, +z toward the viewer): the one pointing at the viewer is
 * foreshortened to the centre, a far one is drawn behind and dimmer.
 */
export function SnareStandSide({ cx, basketY, hoopR, floorY, armsDeg, legsDeg = [90, 210, 330] }: { cx: number; basketY: number; hoopR: number; floorY: number; armsDeg: readonly number[]; legsDeg?: readonly number[] }) {
  const hub = basketY + 50;
  const g = useMemo(() => {
    const collar = floorY - 150;
    const lowCollar = floorY - 60;
    const tilt = hub + 46;
    const clutchY = (collar + tilt) / 2 + 30;
    const legsNear = make();
    const legsFar = make();
    const braces = make();
    const feet = make();
    for (const deg of legsDeg) {
      const a = deg * DEG;
      const fx = cx + Math.cos(a) * 240;
      const tgt = Math.sin(a) < -0.2 ? legsFar : legsNear;
      seg(tgt, cx, collar, fx, floorY - 6);
      // brace from the lower collar to the leg's middle
      seg(braces, cx, lowCollar, cx + Math.cos(a) * 120, (collar + floorY) / 2);
      rrect(feet, fx - 14, floorY - 9, fx + 14, floorY, 4);
    }
    const lower = seg(make(), cx, lowCollar, cx, clutchY);
    const upper = seg(make(), cx, clutchY, cx, tilt);
    const post = seg(make(), cx, tilt, cx, hub);
    const armsNear = make();
    const armsFar = make();
    const rubber = make();
    const hooks = make();
    for (const deg of armsDeg) {
      const a = deg * DEG;
      const x = Math.cos(a) * hoopR;
      const far = Math.sin(a) < -0.2;
      const tgt = far ? armsFar : armsNear;
      const ex = cx + x * 0.96;
      const ey = basketY + 6;
      tgt.moveTo(cx + x * 0.12, hub);
      tgt.lineTo(ex, ey);
      if (!far && Math.abs(x) > 1) {
        const ux = (ex - (cx + x * 0.12)) / Math.hypot(ex - (cx + x * 0.12), ey - hub);
        const uy = (ey - hub) / Math.hypot(ex - (cx + x * 0.12), ey - hub);
        // the rubber sleeve over the arm's last 30 mm
        rubber.moveTo(ex - ux * 30, ey - uy * 30);
        rubber.lineTo(ex, ey);
        // the cradle hook: up the hoop's outside, a lip over its edge
        const s = Math.sign(x);
        hooks.moveTo(ex, ey);
        hooks.lineTo(cx + s * (hoopR + 7), ey);
        hooks.lineTo(cx + s * (hoopR + 7), basketY - 14);
        hooks.lineTo(cx + s * (hoopR + 1), basketY - 14);
      }
    }
    const basketHub = oval(make(), cx, hub, 13, 9);
    const knob = rrect(make(), cx - 18, hub + 10, cx + 18, hub + 24, 5);
    const tilter = oval(make(), cx, tilt, 20, 20);
    const tBolt = seg(make(), cx + 20, tilt, cx + 52, tilt);
    const tHandle = seg(make(), cx + 52, tilt - 12, cx + 52, tilt + 12);
    const clutchRing = rrect(make(), cx - 19, clutchY - 7, cx + 19, clutchY + 9, 3);
    const wing = rrect(make(), cx + 19, clutchY - 6, cx + 40, clutchY + 6, 3);
    const collars = make();
    rrect(collars, cx - 20, collar - 12, cx + 20, collar + 10, 4);
    rrect(collars, cx - 17, lowCollar - 8, cx + 17, lowCollar + 8, 3);
    return { legsNear, legsFar, braces, feet, lower, upper, post, armsNear, armsFar, rubber, hooks, basketHub, knob, tilter, tBolt, tHandle, clutchRing, wing, collars, tilt, clutchY };
  }, [cx, hub, basketY, hoopR, floorY, armsDeg, legsDeg]);
  return (
    <Group>
      {/* far leg and far basket arm, behind */}
      <Group opacity={0.55}>
        <Path path={g.legsFar} style="stroke" strokeWidth={22} strokeCap="round" color="#2a2c32" />
        <Path path={g.legsFar} style="stroke" strokeWidth={16} strokeCap="round" color="#7d828d" />
        <Path path={g.armsFar} style="stroke" strokeWidth={13} strokeCap="round" color="#2a2c32" />
        <Path path={g.armsFar} style="stroke" strokeWidth={8} strokeCap="round" color="#9aa0ab" />
      </Group>
      <Path path={g.braces} style="stroke" strokeWidth={11} strokeCap="round" color="#2a2c32" />
      <Path path={g.braces} style="stroke" strokeWidth={6} strokeCap="round" color="#8a8f99" />
      <Path path={g.legsNear} style="stroke" strokeWidth={22} strokeCap="round" color="#2a2c32" />
      <Path path={g.legsNear} style="stroke" strokeWidth={16} strokeCap="round" color="#9aa0ab" />
      <Path path={g.legsNear} style="stroke" strokeWidth={4} strokeCap="round" color="#eef1f6" opacity={0.45} />
      <Path path={g.feet} color="#121316" />
      {/* the centre tube: lower Ø 25.4, clutch, upper Ø 19 */}
      <Path path={g.lower} style="stroke" strokeWidth={29} strokeCap="butt" color="#16171b" />
      <Path path={g.lower} style="stroke" strokeWidth={25} strokeCap="butt" color="#8a8f99" />
      <Path path={g.upper} style="stroke" strokeWidth={22} strokeCap="butt" color="#16171b" />
      <Path path={g.upper} style="stroke" strokeWidth={18} strokeCap="butt" color="#b6bbc5" />
      <Group transform={[{ translateX: -4 }, { translateY: 0 }]}>
        <Path path={g.upper} style="stroke" strokeWidth={3} color="#eef1f6" opacity={0.5} />
      </Group>
      <Path path={g.collars}>
        <LinearGradient start={vec(cx - 20, 0)} end={vec(cx + 20, 0)} colors={CHROME} />
      </Path>
      <Path path={g.clutchRing}>
        <LinearGradient start={vec(cx - 19, 0)} end={vec(cx + 19, 0)} colors={CHROME} />
      </Path>
      <Path path={g.wing} color="#1d1e22" />
      {/* tilter (ratchet disc and its T-bolt) and the post up to the basket */}
      <Path path={g.post} style="stroke" strokeWidth={16} strokeCap="round" color="#16171b" />
      <Path path={g.post} style="stroke" strokeWidth={11} strokeCap="round" color="#b6bbc5" />
      <Path path={g.tilter}>
        <RadialGradient c={vec(cx - 6, g.tilt - 6)} r={26} colors={['#eef1f6', '#7d828d', '#2a2c32']} />
      </Path>
      <Path path={g.tilter} style="stroke" strokeWidth={1.4} color={INK} />
      <Path path={g.tBolt} style="stroke" strokeWidth={7} strokeCap="round" color="#2a2c32" />
      <Path path={g.tHandle} style="stroke" strokeWidth={8} strokeCap="round" color="#1d1e22" />
      {/* the basket: arms, rubber-tipped cradle hooks on the hoop, the knob */}
      <Path path={g.armsNear} style="stroke" strokeWidth={13} strokeCap="round" strokeJoin="round" color="#2a2c32" />
      <Path path={g.armsNear} style="stroke" strokeWidth={8} strokeCap="round" strokeJoin="round" color="#c6cad4" />
      <Path path={g.rubber} style="stroke" strokeWidth={14} strokeCap="round" color="#141518" />
      <Path path={g.hooks} style="stroke" strokeWidth={8} strokeCap="round" strokeJoin="round" color="#141518" />
      <Path path={g.basketHub}>
        <LinearGradient start={vec(cx - 13, 0)} end={vec(cx + 13, 0)} colors={CHROME} />
      </Path>
      <Path path={g.knob} color="#1d1e22" />
      <Path path={g.knob} style="stroke" strokeWidth={1.2} color="#5d616c" />
    </Group>
  );
}

/** A floor tom's legs from the side (local frame, as DrumSection). */
export function FloorTomLegsSide({ spec, floorS }: { spec: DrumSpec; floorS: number }) {
  const R = spec.d.mm / 2;
  const { legs, brackets } = useMemo(() => {
    const legs = make();
    const brackets = make();
    const L = spec.legs;
    if (L) {
      for (let k = 0; k < L.n.mm; k++) {
        const th = (L.phaseDeg.mm + (k * 360) / L.n.mm) * DEG;
        const x = Math.cos(th) * R;
        const fx = Math.cos(th) * (R + L.spread.mm);
        seg(legs, x + Math.sign(x) * 14, spec.depth.mm * 0.3, fx, floorS);
        if (Math.sin(th) > -0.2) rrect(brackets, x - 9, spec.depth.mm * 0.22, x + 9, spec.depth.mm * 0.38, 3);
      }
    }
    return { legs, brackets };
  }, [spec, R, floorS]);
  if (!spec.legs) return null;
  return (
    <>
      <Path path={legs} style="stroke" strokeWidth={13} strokeCap="round" color="#2a2c32" />
      <Path path={legs} style="stroke" strokeWidth={8} strokeCap="round" color="#9aa0ab" />
      <Path path={brackets}>
        <LinearGradient start={vec(-R, 0)} end={vec(R, 0)} colors={CHROME} />
      </Path>
    </>
  );
}
