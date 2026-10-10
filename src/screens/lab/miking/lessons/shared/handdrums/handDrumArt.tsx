/**
 * HAND-DRUM FAMILY — the look (charter §2 layer 3). Real objects drawn from
 * the family's model anchors (handDrumModel.ts), in MILLIMETRES of a view's
 * (u, v) plane — side: u = x, v = y; top: u = x, v = z — under the scene's
 * one transform, so drawing, labels and hit areas agree at every zoom.
 *
 * What is drawn, and how honestly:
 *   • SHELLS as elevations (not cutaways — a hand drum is miked from outside):
 *     a staved wood shell (congas, bongos), a brass shell (timbales), a carved
 *     goblet (djembe), each with a cylinder's shading from the upper-left
 *     light, stave seams where the taper puts them, a rim highlight;
 *   • HEADS seen from above: rawhide / goat skin (translucent, mottled, a
 *     darker tucked edge) or a plastic film; edge-on in the side view;
 *   • HARDWARE: crown rims, tension hooks and side plates, rope tuning —
 *     their COUNTS and sizes are drawing defaults (placeholders, listed in
 *     each lesson's unknowns), never stated in words;
 *   • nothing moves (D8): paths are built once per drum (useMemo).
 * The palette is the house's: wood, chrome, brass, skin — no brand marks.
 */
import { useMemo } from 'react';
import { BlurMask, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import type { ViewId } from '../../../engine/model/types.ts';
import { type HandDrum, rimTopY } from './handDrumModel.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;

/* ── palette (house tokens + material ramps, light from the upper left) ── */
export const INK = '#08080a';
export const WOOD = ['#2a160a', '#6e4322', '#c08a52', '#d9a766', '#a8743f', '#5c3417', '#24130a'];
export const WOOD_DARK = ['#1a0e06', '#4a2a12', '#8a5a2e', '#9c6631', '#6b4220', '#3a1f0e', '#140b05'];
export const CHROME = ['#3a3d45', '#eef1f6', '#9aa0ab', '#4a4e57', '#c8ccd4', '#2a2c32'];
export const BRASS = ['#3d2a08', '#a07a2a', '#f0d27a', '#ffe9a8', '#c99a3e', '#7a5a18', '#2e1f05'];
export const RAWHIDE = ['#f6e9cc', '#e6cf9e', '#c9a874'];
export const GOAT = ['#fbf3e3', '#eadcbd', '#cdb88f'];
export const FILM = ['#fbf8f0', '#ece5d5', '#cfc4ad'];
export const FLOOR = ['#202128', '#141519', '#0b0b0e'];

const make = () => Skia.Path.Make();
export function seg(p: SkPath, a: number, b: number, c: number, d: number): SkPath {
  p.moveTo(a, b);
  p.lineTo(c, d);
  return p;
}
export function rrect(p: SkPath, x0: number, y0: number, x1: number, y1: number, r: number): SkPath {
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)), r, r));
  return p;
}
export function oval(p: SkPath, cx: number, cy: number, rx: number, ry: number): SkPath {
  p.addOval(Skia.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2));
  return p;
}
/** A closed polygon. */
export function poly(pts: readonly (readonly [number, number])[]): SkPath {
  const p = make();
  pts.forEach(([x, y], i) => (i === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
  p.close();
  return p;
}

/** A tiny deterministic generator (the skin's mottling is the same every render). */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ── FLOOR (side view) ── */
export function FloorSide({ y, u0, u1 }: { y: number; u0: number; u1: number }) {
  const p = useMemo(() => {
    const slab = make();
    slab.addRect(Skia.XYWHRect(u0 - 2000, y, u1 - u0 + 4000, 800));
    return { slab, edge: seg(make(), u0 - 2000, y, u1 + 2000, y) };
  }, [y, u0, u1]);
  return (
    <>
      <Path path={p.slab}>
        <LinearGradient start={vec(0, y)} end={vec(0, y + 70)} colors={FLOOR} />
      </Path>
      <Path path={p.edge} style="stroke" strokeWidth={2.5} color="#4a4c58" />
    </>
  );
}

/** A soft contact shadow under a footprint (side: a flat ellipse; top: a disc offset down-right). */
export function ContactShadow({ cx, cy, rx, ry, blur = 8, opacity = 0.65 }: { cx: number; cy: number; rx: number; ry: number; blur?: number; opacity?: number }) {
  const p = useMemo(() => oval(make(), cx, cy, rx, ry), [cx, cy, rx, ry]);
  return (
    <Path path={p} color="#000" opacity={opacity}>
      <BlurMask blur={blur} style="normal" />
    </Path>
  );
}

/* ── a TAPERED SHELL in elevation (side view) ── */
export type ShellLook = 'staved' | 'brass';
export type ShellSideProps = {
  d: HandDrum;
  look: ShellLook;
  /** Staves round the whole shell (drawing default); only the seams on the near half show. */
  staves?: number;
  /** Tuning lugs round the shell (drawing default count) and how far down the plates reach (mm below the head). */
  lugs?: number;
  plateDown?: number;
  /** The rim's band depth below the head (drawing). */
  rimDepth?: number;
  /** Far drum (behind another): drawn dimmer. */
  dim?: boolean;
  /** A BELLIED stave shell (congas): how far the belly stands out past the
   *  straight taper, as a fraction of the head radius, and where it peaks
   *  (0 = under the rim … 1 = the lower edge). The drawing only — the model
   *  keeps its capped cone for the collision. */
  belly?: { out: number; at: number };
  /** The hardware style: 'side' = hook, rod and a long side plate bolted to
   *  the shell with the tuning nut on top (congas); 'ear' = a long hook to an
   *  ear near the lower edge (bongos); 'casing' = a long tension rod from the
   *  rim to a short lug bracket near the lower edge (timbales). Default 'side'. */
  hardware?: 'side' | 'ear' | 'casing';
};

/** Visible lug angles (plan, from +x): the near half (sin ≥ 0, toward the camera at +z). */
export function nearAngles(n: number, phase = Math.PI / 2): number[] {
  const out: number[] = [];
  for (let k = 0; k < n; k++) {
    const a = phase + (k * 2 * Math.PI) / n;
    if (Math.sin(a) > 0.05) out.push(a);
  }
  return out;
}

/** The drawn outer radius of a (possibly bellied) shell at height y: the
 *  straight taper from the head radius to the lower edge, plus the belly,
 *  sin(π·t^k), peaking at t = `belly.at`. */
export function shellR(d: HandDrum, belly: ShellSideProps['belly'], y: number): number {
  const t = Math.max(0, Math.min(1, (y - d.headY) / (d.bottomY - d.headY)));
  const lin = d.R + (d.rBottom - d.R) * t;
  if (!belly) return lin;
  const k = Math.log(0.5) / Math.log(Math.max(0.05, Math.min(0.95, belly.at)));
  return lin + belly.out * d.R * Math.sin(Math.PI * Math.pow(t, k));
}

/** The same outline as a section profile (head → lower edge), for the cut-open drawings. */
export function shellProfile(d: HandDrum, belly: ShellSideProps['belly'], n = 24): { y: number; r: number }[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const y = d.headY + ((d.bottomY - d.headY) * i) / n;
    return { y, r: shellR(d, belly, y) };
  });
}

function buildShellSide(p: ShellSideProps) {
  const { d } = p;
  const top = rimTopY(d);
  const rimDepth = p.rimDepth ?? 24;
  const yS = d.headY + rimDepth - 6; // the shell shows below the rim band
  const rAt = (y: number) => shellR(d, p.belly, y);
  // The outline, sampled so the belly reads as one smooth curve.
  const N = p.belly ? 40 : 1;
  const ys = Array.from({ length: N + 1 }, (_, i) => yS + ((d.bottomY - yS) * i) / N);
  const pts: [number, number][] = [];
  ys.forEach((y) => pts.push([d.c.x - rAt(y), y]));
  for (let i = ys.length - 1; i >= 0; i--) pts.push([d.c.x + rAt(ys[i]), ys[i]]);
  const shell = poly(pts);
  const seams = make();
  const n = p.staves ?? 0;
  for (let j = 0; j < n; j++) {
    const a = (j + 0.5) * ((2 * Math.PI) / n);
    const s = Math.cos(a); // screen x offset fraction on the near half
    if (Math.sin(a) <= 0.02) continue;
    ys.forEach((y, i) => (i === 0 ? seams.moveTo(d.c.x + rAt(y) * s, y) : seams.lineTo(d.c.x + rAt(y) * s, y)));
  }
  // Rim: a band from its top edge down over the head's edge.
  const rim = rrect(make(), d.c.x - d.R - d.rim.t, top, d.c.x + d.R + d.rim.t, d.headY + rimDepth, 4);
  const rimLip = seg(make(), d.c.x - d.R - d.rim.t + 3, top + 2.5, d.c.x + d.R + d.rim.t - 3, top + 2.5);
  // Lugs on the near half (count: drawing default).
  const plates = make();
  const rods = make();
  const hooks = make();
  const nuts = make();
  const bolts = make();
  const hw = p.hardware ?? 'side';
  const plateDown = p.plateDown ?? 120;
  for (const a of nearAngles(p.lugs ?? 0)) {
    const cs = Math.cos(a);
    const w = Math.max(0.35, Math.sin(a)); // foreshortening of a part's width toward the outline
    const xr = d.c.x + (d.R + d.rim.t) * cs;
    const yHook = d.headY + rimDepth + 4;
    // The hook: a J over the rim's top edge, down its face.
    rrect(hooks, xr - 6 * w, top - 3, xr + 6 * w, yHook, 3);
    if (hw === 'side') {
      // Rod down to the nut on the plate's top bracket; a long plate bolted on.
      const yNut = d.headY + plateDown - 52;
      const yPlate0 = yNut + 10;
      const yPlate1 = d.headY + plateDown + 60;
      const xs = (y: number) => d.c.x + (rAt(y) + 5) * cs;
      seg(rods, xr, yHook, xs(yNut), yNut);
      rrect(nuts, xs(yNut) - 9 * w, yNut - 12, xs(yNut) + 9 * w, yNut, 2);
      rrect(plates, xs(yPlate0) - 10 * w, yPlate0, xs(yPlate1) + 10 * w, yPlate1, 4);
      for (const yb of [yPlate0 + 16, yPlate1 - 14]) oval(bolts, (xs(yb)), yb, 3.4 * w, 3.4);
    } else if (hw === 'ear') {
      // A long hook down the shell to an ear near the lower edge, nut under it.
      const yEar = d.headY + plateDown;
      const xs = (y: number) => d.c.x + (rAt(y) + 7) * cs;
      seg(rods, xr, yHook, xs(yEar - 8), yEar - 8);
      rrect(plates, xs(yEar) - 11 * w, yEar - 8, xs(yEar) + 11 * w, yEar + 6, 3);
      rrect(nuts, xs(yEar) - 6 * w, yEar + 6, xs(yEar) + 6 * w, yEar + 15, 2);
      oval(bolts, xs(yEar), yEar - 1, 2.6 * w, 2.6);
    } else {
      // A long tension rod from the rim down the outside of the shell into a
      // short lug bracket bolted on near the lower edge.
      const yC1 = d.headY + plateDown;
      const yC0 = yC1 - 40;
      const xs = (y: number) => d.c.x + (rAt(y) + 6) * cs;
      seg(rods, xr, yHook, xs(yC0), yC0);
      rrect(plates, Math.min(xs(yC0), xs(yC1)) - 9 * w, yC0, Math.max(xs(yC0), xs(yC1)) + 9 * w, yC1, 6);
    }
  }
  // A narrow band at the lower edge (the shell's bottom edge, drawn).
  const foot = rrect(make(), d.c.x - d.rBottom - 2, d.bottomY - 10, d.c.x + d.rBottom + 2, d.bottomY, 2);
  // The head, edge-on, just visible inside the rim's top.
  const headLine = seg(make(), d.c.x - d.R + 4, top + 5, d.c.x + d.R - 4, top + 5);
  const rMax = Math.max(...ys.map(rAt));
  return { shell, seams, rim, rimLip, plates, rods, hooks, nuts, bolts, foot, headLine, yS, top, rimDepth, rMax };
}

export function ShellSide(props: ShellSideProps) {
  const g = useMemo(() => buildShellSide(props), [props.d, props.look, props.staves, props.lugs, props.plateDown, props.rimDepth, props.belly?.out, props.belly?.at, props.hardware]); // eslint-disable-line react-hooks/exhaustive-deps
  const { d } = props;
  const x0 = d.c.x - g.rMax;
  const x1 = d.c.x + g.rMax;
  const mat = props.look === 'brass' ? BRASS : props.dim ? WOOD_DARK : WOOD;
  return (
    <Group opacity={props.dim ? 0.62 : 1}>
      {/* the shell, shaded as a cylinder lit from the upper left */}
      <Path path={g.shell}>
        <LinearGradient start={vec(x0, 0)} end={vec(x1, 0)} colors={mat} />
      </Path>
      <Path path={g.shell}>
        <LinearGradient start={vec(0, g.yS)} end={vec(0, d.bottomY)} colors={['rgba(255,236,200,0.10)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.30)']} />
      </Path>
      {props.look === 'staved' ? <Path path={g.seams} style="stroke" strokeWidth={1.1} color="#1a0d05" opacity={0.7} /> : null}
      {props.look === 'brass' ? <Path path={g.seams} style="stroke" strokeWidth={0.8} color="#3d2a08" opacity={0.35} /> : null}
      <Path path={g.foot} color="#17110c" />
      <Path path={g.shell} style="stroke" strokeWidth={1.4} color={INK} opacity={0.9} />
      {/* lugs: rods, side plates, hooks over the rim (counts: drawing default) */}
      <Path path={g.rods} style="stroke" strokeWidth={4.6} strokeCap="round" color="#2a2c32" />
      <Path path={g.rods} style="stroke" strokeWidth={1.6} strokeCap="round" color="#dfe3ea" opacity={0.8} />
      <Path path={g.plates}>
        <LinearGradient start={vec(x0, 0)} end={vec(x1, 0)} colors={CHROME} />
      </Path>
      <Path path={g.plates} style="stroke" strokeWidth={0.8} color={INK} />
      <Path path={g.bolts} color="#2a2c32" />
      <Path path={g.nuts}>
        <LinearGradient start={vec(x0, 0)} end={vec(x1, 0)} colors={['#c8ccd4', '#6d727c', '#2a2c32']} />
      </Path>
      <Path path={g.nuts} style="stroke" strokeWidth={0.8} color={INK} />
      {/* the rim band (chrome) and its rolled top edge */}
      <Path path={g.rim}>
        <LinearGradient start={vec(x0 - d.rim.t, 0)} end={vec(x1 + d.rim.t, 0)} colors={CHROME} />
      </Path>
      <Path path={g.rimLip} style="stroke" strokeWidth={2} color="#ffffff" opacity={0.55} />
      <Path path={g.rim} style="stroke" strokeWidth={1} color={INK} />
      <Path path={g.hooks}>
        <LinearGradient start={vec(x0, 0)} end={vec(x1, 0)} colors={['#f2f4f8', '#8f949f', '#3a3d45']} />
      </Path>
      <Path path={g.hooks} style="stroke" strokeWidth={0.8} color={INK} />
    </Group>
  );
}

/* ── a HEAD seen from above (top view), with its rim and lug tabs ── */
export type HeadLook = 'rawhide' | 'goat' | 'film';
/** `phaseDeg`: where the first lug sits (deg, y down; 90 = +z). A pair set
 *  side by side turns one drum so their lugs never meet in the gap. */
export function HeadTop({ d, look, lugs = 0, seed = 7, rimColors = CHROME, rimWidth, phaseDeg = 90 }: { d: HandDrum; look: HeadLook; lugs?: number; seed?: number; rimColors?: string[]; rimWidth?: number; phaseDeg?: number }) {
  const g = useMemo(() => {
    const cx = d.c.x;
    const cz = d.c.z;
    const rr = d.R + (rimWidth ?? d.rim.t);
    const mottle = make();
    const r = rng(seed);
    if (look !== 'film') for (let i = 0; i < 9; i++) {
      const a = r() * 2 * Math.PI;
      const q = Math.sqrt(r()) * d.R * 0.78;
      oval(mottle, cx + Math.cos(a) * q, cz + Math.sin(a) * q, d.R * (0.08 + r() * 0.14), d.R * (0.06 + r() * 0.1));
    }
    const fibres = make();
    if (look !== 'film') for (let i = 0; i < 14; i++) {
      const a = r() * 2 * Math.PI;
      const q = r() * d.R * 0.8;
      const l = d.R * (0.1 + r() * 0.2);
      const t = a + Math.PI / 2 + (r() - 0.5) * 0.6;
      const x = cx + Math.cos(a) * q;
      const z = cz + Math.sin(a) * q;
      seg(fibres, x - Math.cos(t) * l / 2, z - Math.sin(t) * l / 2, x + Math.cos(t) * l / 2, z + Math.sin(t) * l / 2);
    }
    const tabs = make();
    const hooks = make();
    for (let k = 0; k < lugs; k++) {
      const a = (phaseDeg * Math.PI) / 180 + (k * 2 * Math.PI) / lugs;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const pt = (rad: number, w: number) => [cx + c * rad - s * w, cz + s * rad + c * w] as const;
      const q = [pt(d.R - 4, -6), pt(rr + 4, -6), pt(rr + 4, 6), pt(d.R - 4, 6)];
      hooks.moveTo(q[0][0], q[0][1]);
      for (const z of q.slice(1)) hooks.lineTo(z[0], z[1]);
      hooks.close();
      const t = [pt(rr + 4, -9), pt(rr + 20, -9), pt(rr + 20, 9), pt(rr + 4, 9)];
      tabs.moveTo(t[0][0], t[0][1]);
      for (const z of t.slice(1)) tabs.lineTo(z[0], z[1]);
      tabs.close();
    }
    return { cx, cz, rr, mottle, fibres, tabs, hooks };
  }, [d, look, lugs, seed, rimWidth, phaseDeg]);
  const skin = look === 'rawhide' ? RAWHIDE : look === 'goat' ? GOAT : FILM;
  return (
    <Group>
      <Circle cx={g.cx + 12} cy={g.cz + 16} r={g.rr + 10} color="#000" opacity={0.55}>
        <BlurMask blur={12} style="normal" />
      </Circle>
      <Path path={g.tabs}>
        <LinearGradient start={vec(g.cx - g.rr, g.cz - g.rr)} end={vec(g.cx + g.rr, g.cz + g.rr)} colors={CHROME} />
      </Path>
      <Path path={g.tabs} style="stroke" strokeWidth={0.8} color={INK} />
      {/* the rim ring */}
      <Circle cx={g.cx} cy={g.cz} r={g.rr}>
        <RadialGradient c={vec(g.cx - g.rr * 0.45, g.cz - g.rr * 0.5)} r={g.rr * 1.7} colors={rimColors} />
      </Circle>
      <Circle cx={g.cx} cy={g.cz} r={g.rr} style="stroke" strokeWidth={1.2} color={INK} />
      {/* the skin, lit from the upper left, translucent toward its tucked edge */}
      <Circle cx={g.cx} cy={g.cz} r={d.R}>
        <RadialGradient c={vec(g.cx - d.R * 0.35, g.cz - d.R * 0.4)} r={d.R * 1.55} colors={skin} />
      </Circle>
      {look !== 'film' ? (
        <>
          <Path path={g.mottle} color="#8a6a3c" opacity={0.1} />
          <Path path={g.fibres} style="stroke" strokeWidth={0.9} color="#7a5a30" opacity={0.18} />
        </>
      ) : null}
      <Circle cx={g.cx} cy={g.cz} r={d.R}>
        <RadialGradient c={vec(g.cx, g.cz)} r={d.R} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(70,45,15,0.35)']} positions={[0, 0.82, 1]} />
      </Circle>
      <Circle cx={g.cx} cy={g.cz} r={d.R} style="stroke" strokeWidth={1.4} color="#5a4326" opacity={0.8} />
      <Path path={g.hooks}>
        <LinearGradient start={vec(g.cx - g.rr, g.cz - g.rr)} end={vec(g.cx + g.rr, g.cz + g.rr)} colors={['#f2f4f8', '#8f949f', '#3a3d45']} />
      </Path>
      <Path path={g.hooks} style="stroke" strokeWidth={0.7} color={INK} />
    </Group>
  );
}

/* ── a three-legged stand (raised congas), from the same capsules the collision uses ── */
export function StandLegs({ legs, view, ring }: { legs: { top: { x: number; y: number; z: number }; foot: { x: number; y: number; z: number } }[]; view: ViewId; ring: { cx: number; cv: number; r: number; y?: number } }) {
  const p = useMemo(() => {
    const l = make();
    const feet = make();
    for (const g of legs) {
      const a = { u: g.top.x, v: view === 'side' ? g.top.y : g.top.z };
      const b = { u: g.foot.x, v: view === 'side' ? g.foot.y : g.foot.z };
      seg(l, a.u, a.v, b.u, b.v);
      oval(feet, b.u, b.v - (view === 'side' ? 5 : 0), view === 'side' ? 16 : 13, view === 'side' ? 6 : 13);
    }
    const r = make();
    if (view === 'side') rrect(r, ring.cx - ring.r, (ring.y ?? 0) - 9, ring.cx + ring.r, (ring.y ?? 0) + 9, 4);
    else r.addCircle(ring.cx, ring.cv, ring.r);
    return { l, feet, r };
  }, [legs, view, ring.cx, ring.cv, ring.r, ring.y]);
  return (
    <>
      <Path path={p.l} style="stroke" strokeWidth={22} strokeCap="round" color={INK} opacity={0.9} />
      <Path path={p.l} style="stroke" strokeWidth={17} strokeCap="round" color="#4d515b" />
      <Group transform={[{ translateX: -2 }, { translateY: -2.5 }]}>
        <Path path={p.l} style="stroke" strokeWidth={5} strokeCap="round" color="#d4d8e0" opacity={0.5} />
      </Group>
      <Path path={p.feet} color="#16171b" />
      {view === 'side' ? (
        <Path path={p.r}>
          <LinearGradient start={vec(0, (ring.y ?? 0) - 9)} end={vec(0, (ring.y ?? 0) + 9)} colors={CHROME} />
        </Path>
      ) : (
        <Path path={p.r} style="stroke" strokeWidth={12} color="#5b5f69" />
      )}
    </>
  );
}

/** A dashed reference line (a readout's reference — kept crisp). */
export function RefDash({ u0, v0, u1, v1 }: { u0: number; v0: number; u1: number; v1: number }) {
  const p = useMemo(() => seg(make(), u0, v0, u1, v1), [u0, v0, u1, v1]);
  return (
    <Path path={p} style="stroke" strokeWidth={1.6} color="#ffc64d" opacity={0.55}>
      <DashPathEffect intervals={[16, 10]} />
    </Path>
  );
}

/* ── the head face-on (HOW IT SOUNDS, the head's shapes): its rim, under and over ── */
/** What MembraneFace draws in place of the kick's hoop and claws, centred at
 *  (0, 0), in mm: a chrome crown rim or a rope ring under the head, the lug
 *  hooks (count: drawing default) or the ropes over it, and the skin. */
export function faceLook(d: HandDrum, kind: 'crown' | 'rope', lugs: number, head: 'rawhide' | 'goat' | 'film') {
  const rr = d.R + Math.max(6, d.rim.t);
  const hooks = make();
  for (let k = 0; k < lugs; k++) {
    const a = Math.PI / 2 + (k * 2 * Math.PI) / lugs;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const pt = (rad: number, w: number) => [c * rad - s * w, s * rad + c * w] as const;
    const q = [pt(d.R - 5, -7), pt(rr + 22, -7), pt(rr + 22, 7), pt(d.R - 5, 7)];
    hooks.moveTo(q[0][0], q[0][1]);
    for (const z of q.slice(1)) hooks.lineTo(z[0], z[1]);
    hooks.close();
  }
  const ropes = make();
  if (kind === 'rope') {
    for (let k = 0; k < 24; k++) {
      const a = (k * 2 * Math.PI) / 24;
      ropes.moveTo(Math.cos(a) * (d.R + 2), Math.sin(a) * (d.R + 2));
      ropes.lineTo(Math.cos(a + 0.13) * (rr + 16), Math.sin(a + 0.13) * (rr + 16));
    }
  }
  const under = (
    <Group>
      <Circle cx={10} cy={14} r={rr + 14} color="#000" opacity={0.55}>
        <BlurMask blur={10} style="normal" />
      </Circle>
      {kind === 'rope' ? (
        <>
          <Circle cx={0} cy={0} r={rr + 16} color="#2a1a0c" />
          <Circle cx={0} cy={0} r={rr + 16} style="stroke" strokeWidth={9} color="#d8cdb4" />
        </>
      ) : (
        <Circle cx={0} cy={0} r={rr}>
          <RadialGradient c={vec(-rr * 0.45, -rr * 0.5)} r={rr * 1.7} colors={CHROME} />
        </Circle>
      )}
    </Group>
  );
  const over = (
    <Group>
      {kind === 'rope' ? (
        <>
          <Path path={ropes} style="stroke" strokeWidth={6} color="#2a2c32" />
          <Path path={ropes} style="stroke" strokeWidth={3.6} color="#e9e1cd" />
        </>
      ) : (
        <>
          <Path path={hooks}>
            <LinearGradient start={vec(-rr, -rr)} end={vec(rr, rr)} colors={['#f2f4f8', '#8f949f', '#3a3d45']} />
          </Path>
          <Path path={hooks} style="stroke" strokeWidth={1.2} color={INK} />
        </>
      )}
    </Group>
  );
  return { under, over, head: head === 'rawhide' ? RAWHIDE : head === 'goat' ? GOAT : FILM };
}
