/**
 * THE SPEAKER FAMILY — the look (charter §2 layer 3). Drawn ONLY from
 * cabGeometry.ts / speakerModel.ts, in millimetres of each view's (u, v)
 * plane, so the drawing, the labels, the hit areas and the readouts agree at
 * every zoom.
 *
 *   CabSection   a cabinet CUT through the active speaker's axis — the side
 *                view (u = x, v = y; cut at z = 0) or the top view (u = x,
 *                v = z; cut at y = 0): plywood cut faces, the baffle with its
 *                cut-out, the speaker in section (frame, cone, surround, dust
 *                cap, voice coil, spider, magnet), the grille cloth proud of
 *                the baffle, an open or closed back, and the cone axis (the
 *                readout reference, dashed amber).
 *   CabFront     the cabinet seen from the mic's side (u = z, v = y): the
 *                grille cloth (or the baffle with the cloth taken away, for
 *                finding the speaker behind it), every driver, the bass
 *                cabinet's horn, and the active speaker marked — or, focused,
 *                ONE speaker face-on in detail with the three lateral spots
 *                (centre, dust-cap edge, toward the edge).
 *
 * Light from the upper left, gradients for form, rim highlights; the house
 * stroke hierarchy (cut faces 1.6, edges 1, detail 0.6). Nothing moves (D8):
 * every path is built ONCE per (kind, back, view) and cached at module scope.
 * Colours are a cosmetic finish (black covering, dark cloth) — no maker's
 * likeness, no logo.
 */
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { SPEAKER_12, CONE_SPOTS, type CabKind } from './speakerModel.ts';
import { angledSetback, cabDraw, cutDrivers, frontDrivers, speakerSection, type Back, type CabDraw, type SpeakerSection } from './cabGeometry.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
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

/* ── palette (house tokens + material ramps) ── */
export const SPK = {
  amber: '#ffc64d',
  ink: '#08080a',
  ply: ['#5c3417', '#c48f52', '#d9a766', '#9c6631', '#b98548', '#6b3e1a'],
  plyLine: '#2b170a',
  tolex: ['#3a3b41', '#1d1e22', '#0f1012'],
  interior: ['#17110c', '#2a2016', '#1d160f', '#0c0907'],
  cloth: ['#3d3f46', '#2b2d33', '#1b1c20'],
  piping: '#b9bec8',
  cone: ['#4a4038', '#2c2621', '#171411'],
  coneEdge: '#0d0b09',
  dust: ['#5b524a', '#2f2924', '#191613'],
  steel: ['#c8ccd4', '#7c818c', '#3a3d45'],
  magnet: ['#5a5d66', '#26282e', '#111215'],
  chrome: ['#f2f4f8', '#9aa0ab', '#3a3d45'],
  floor: ['#202128', '#141519', '#0b0b0e'],
  corner: ['#e3e6ec', '#8a8f99', '#3c3f47'],
} as const;

/* ── one speaker in section (local: v = 0 on its axis) ── */
type SpeakerPaths = { flange: SkPath; struts: SkPath; magnetPlates: SkPath; magnet: SkPath; cone: SkPath; coneFill: SkPath; surround: SkPath; dust: SkPath; coil: SkPath; spider: SkPath; gasket: SkPath };

function speakerPaths(s: SpeakerSection, chord: number): SpeakerPaths {
  const flange = make();
  const struts = make();
  const magnetPlates = make();
  const magnet = make();
  const cone = make();
  const coneFill = make();
  const surround = make();
  const dust = make();
  const coil = make();
  const spider = make();
  const gasket = make();
  // The cut may pass off the axis (a neighbour's cut-out): everything is
  // clipped to |v| ≤ the chord at that radius; the active speaker is cut
  // through its axis (chord = rCut).
  const full = chord >= s.rCut - 0.5;
  for (const sgn of [-1, 1] as const) {
    rect(flange, s.xFlange - 4 * s.k, sgn * (s.rCut - 2), s.xFlange, sgn * s.rFrame);
    rect(gasket, s.xFlange + 0.01, sgn * (s.rCut + 1), s.xFlange + 1.5, sgn * (s.rFrame - 2));
    // Basket struts from the flange to the magnet's front plate.
    seg(struts, s.xFlange - 4 * s.k, sgn * (s.rFrame - 8 * s.k), s.xMagnetFront, sgn * (s.rMagnet + 4 * s.k));
    seg(struts, s.xFlange - 4 * s.k, sgn * (s.rCut - 4 * s.k), s.xMagnetFront + 6 * s.k, sgn * (s.rMagnet - 2 * s.k));
  }
  if (full) {
    // Magnet stack: front plate, ceramic ring, back plate (drawn as one
    // structure 97 → 135 mm behind the flange, the documented depths).
    const plate = 7 * s.k;
    rect(magnetPlates, s.xMagnetFront, -s.rMagnet, s.xMagnetFront - plate, s.rMagnet);
    rect(magnetPlates, s.xMagnetBack + plate, -s.rMagnet, s.xMagnetBack, s.rMagnet);
    rect(magnet, s.xMagnetFront - plate, -s.rMagnet + 2, s.xMagnetBack + plate, s.rMagnet - 2);
    // Cone (both sides of the axis) from the surround to the coil.
    for (const sgn of [-1, 1] as const) {
      const n = 24;
      for (let i = 0; i <= n; i++) {
        const r = s.rCoil + ((s.rSurroundIn - s.rCoil) * i) / n;
        if (i === 0) cone.moveTo(s.coneX(r), sgn * r);
        else cone.lineTo(s.coneX(r), sgn * r);
      }
    }
    // The cone's air side (a fill between the cone and the flange plane).
    const n = 24;
    coneFill.moveTo(s.coneX(s.rCoil), -s.rCoil);
    for (let i = 0; i <= n; i++) {
      const r = s.rCoil + ((s.rSurroundIn - s.rCoil) * i) / n;
      coneFill.lineTo(s.coneX(r), -r);
    }
    coneFill.lineTo(s.xFlange - 3 * s.k, -s.rCut);
    coneFill.lineTo(s.xFlange - 3 * s.k, s.rCut);
    for (let i = n; i >= 0; i--) {
      const r = s.rCoil + ((s.rSurroundIn - s.rCoil) * i) / n;
      coneFill.lineTo(s.coneX(r), r);
    }
    coneFill.close();
    // Surround: a corrugated paper edge, two small rolls (drawing default).
    for (const sgn of [-1, 1] as const) {
      const r0 = s.rSurroundIn;
      const r1 = s.rCut;
      const x0 = s.coneX(r0);
      const xm = s.xFlange - 3 * s.k;
      surround.moveTo(x0, sgn * r0);
      const steps = 4;
      for (let i = 1; i <= steps; i++) {
        const r = r0 + ((r1 - r0) * i) / steps;
        const bump = i % 2 ? 3.2 * s.k : 0;
        surround.lineTo(x0 + ((xm - x0) * i) / steps + bump, sgn * r);
      }
    }
    // Dust cap dome.
    const m = 16;
    for (let i = 0; i <= m; i++) {
      const r = -s.rDust + (2 * s.rDust * i) / m;
      if (i === 0) dust.moveTo(s.dustX(Math.abs(r)), r);
      else dust.lineTo(s.dustX(Math.abs(r)), r);
    }
    // Voice-coil former into the magnet gap; the spider (a corrugated
    // suspension) a little behind the apex.
    seg(coil, s.xApex, -s.rCoil, s.xMagnetFront - 10 * s.k, -s.rCoil);
    seg(coil, s.xApex, s.rCoil, s.xMagnetFront - 10 * s.k, s.rCoil);
    const xs = s.xApex - 12 * s.k;
    for (const sgn of [-1, 1] as const) {
      spider.moveTo(xs, sgn * s.rCoil);
      const r1 = s.rMagnet - 6 * s.k;
      const w = 6;
      for (let i = 1; i <= w; i++) spider.lineTo(xs + (i % 2 ? 2.5 : -2.5) * s.k, sgn * (s.rCoil + ((r1 - s.rCoil) * i) / w));
    }
  } else {
    // An off-axis cut through a neighbour: the cone's chord only.
    const r = Math.min(chord, s.rSurroundIn);
    seg(cone, s.coneX(Math.max(s.rCoil, Math.sqrt(Math.max(0, s.rCut * s.rCut - chord * chord)))), -r, s.coneX(s.rSurroundIn), -r);
  }
  return { flange, struts, magnetPlates, magnet, cone, coneFill, surround, dust, coil, spider, gasket };
}

function SpeakerInSection({ s, chord, paths, active }: { s: SpeakerSection; chord: number; paths: SpeakerPaths; active: boolean }) {
  const full = chord >= s.rCut - 0.5;
  return (
    <Group>
      {/* Basket struts (pressed steel) and the frame flange. */}
      <Path path={paths.struts} style="stroke" strokeWidth={5 * s.k} strokeCap="round" color="#2d3038" />
      <Path path={paths.struts} style="stroke" strokeWidth={1.6 * s.k} strokeCap="round" color="#9aa0ab" opacity={0.55} />
      <Path path={paths.flange}>
        <LinearGradient start={vec(s.xFlange - 4, -s.rFrame)} end={vec(s.xFlange, s.rFrame)} colors={[...SPK.steel]} />
      </Path>
      <Path path={paths.flange} style="stroke" strokeWidth={0.8} color={SPK.ink} />
      <Path path={paths.gasket} color="#101114" />
      {full ? (
        <>
          {/* Magnet: chrome plates either side of the dark ceramic ring. */}
          <Path path={paths.magnet}>
            <LinearGradient start={vec(0, -s.rMagnet)} end={vec(0, s.rMagnet)} colors={[...SPK.magnet]} />
          </Path>
          <Path path={paths.magnetPlates}>
            <LinearGradient start={vec(0, -s.rMagnet)} end={vec(0, s.rMagnet)} colors={[...SPK.chrome]} />
          </Path>
          <Path path={paths.magnet} style="stroke" strokeWidth={0.8} color={SPK.ink} />
          <Path path={paths.magnetPlates} style="stroke" strokeWidth={0.8} color={SPK.ink} />
          {/* The cone's front air space: a faint warm glow so the cone reads. */}
          <Path path={paths.coneFill}>
            <LinearGradient start={vec(s.xApex, 0)} end={vec(s.xFlange, 0)} colors={['rgba(255,214,160,0.02)', 'rgba(255,214,160,0.07)']} />
          </Path>
          <Path path={paths.coil} style="stroke" strokeWidth={2.4 * s.k} color="#c4914a" />
          <Path path={paths.spider} style="stroke" strokeWidth={1.4 * s.k} color="#b8a46e" opacity={0.85} />
          {/* Cone paper (a thick stroke: a line weight, not a thickness). */}
          <Path path={paths.cone} style="stroke" strokeWidth={4.2 * s.k} strokeCap="round" color={SPK.coneEdge} />
          <Path path={paths.cone} style="stroke" strokeWidth={2.6 * s.k} strokeCap="round" color={active ? '#5a4c40' : '#3a332c'} />
          <Path path={paths.surround} style="stroke" strokeWidth={2.4 * s.k} strokeJoin="round" color="#4b4038" />
          <Path path={paths.dust} style="stroke" strokeWidth={3.4 * s.k} strokeCap="round" color="#0f0d0b" />
          <Path path={paths.dust} style="stroke" strokeWidth={2 * s.k} strokeCap="round" color="#6b6056" />
        </>
      ) : (
        <Path path={paths.cone} style="stroke" strokeWidth={2.6 * s.k} color="#3a332c" />
      )}
    </Group>
  );
}

/* ── a cabinet in section ── */
type CabSectionBuilt = {
  floor: SkPath | null;
  floorEdge: SkPath | null;
  shadow: SkPath;
  interior: SkPath;
  panelsCut: SkPath;
  plyLines: SkPath;
  covering: SkPath;
  baffle: SkPath;
  cloth: SkPath;
  clothWeave: SkPath;
  corners: SkPath;
  drivers: { v: number; x: number; off: number; s: SpeakerSection; chord: number; active: boolean; paths: SpeakerPaths; tilt: number }[];
  axisEnd: number;
};
const cache = new Map<string, CabSectionBuilt>();

function buildSection(c: CabDraw, view: 'side' | 'top'): CabSectionBuilt {
  const P = c.panel;
  const { x0 } = c.box;
  const v0 = view === 'side' ? c.box.y0 : c.box.z0;
  const v1 = view === 'side' ? c.box.y1 : c.box.z1;
  const gx = c.grilleX;
  const floor = view === 'side' ? rect(make(), -3000, c.floorY, 4000, c.floorY + 600) : null;
  const floorEdge = view === 'side' ? seg(make(), -3000, c.floorY, 4000, c.floorY) : null;
  const shadow = view === 'side' ? rrect(make(), x0 - 10, c.floorY - 6, gx + 18, c.floorY + 10, 8) : rrect(make(), x0 + 14, v0 + 16, gx + 24, v1 + 22, 18);
  // The front face at height/position v (the 4×12's angled top sets back).
  const front = (v: number) => (view === 'side' ? -angledSetback(c, v) : 0);
  // The bend of an angled front (side view); a plain front has none.
  const bend = view === 'side' ? Math.max(v0 + P, Math.min(v1 - P, c.centre.y)) : 0;
  // Interior seen through the cut (the far half's inner faces).
  const interior = make();
  const backInner = c.back === 'open' && view === 'top' ? x0 : x0 + P;
  interior.moveTo(backInner, v0 + P);
  interior.lineTo(front(v0 + P) - P, v0 + P);
  interior.lineTo(front(bend) - P, bend);
  interior.lineTo(-P, v1 - P);
  interior.lineTo(backInner, v1 - P);
  interior.close();
  // Cut faces: the two panels across the cut, and the back (closed: whole;
  // open: a top and a bottom rail in the side view, nothing at y = 0).
  const panelsCut = make();
  const tf = front(v0);
  panelsCut.moveTo(x0, v0);
  panelsCut.lineTo(tf, v0);
  panelsCut.lineTo(front(v0 + P), v0 + P);
  panelsCut.lineTo(x0, v0 + P);
  panelsCut.close();
  rect(panelsCut, x0, v1 - P, 0, v1);
  const RAIL = 90;
  if (c.back === 'closed') rect(panelsCut, x0, v0 + P, x0 + P, v1 - P);
  else if (view === 'side') {
    rect(panelsCut, x0, v0 + P, x0 + P, v0 + P + RAIL);
    rect(panelsCut, x0, v1 - P - RAIL, x0 + P, v1 - P);
  }
  // The baffle board in section, interrupted by each cut-out.
  const cut = cutDrivers(c, view);
  const baffle = make();
  const holes = cut.map((d) => [d.v - d.chord, d.v + d.chord] as const).sort((a, b) => a[0] - b[0]);
  let at = v0 + P;
  const bseg = (a: number, b: number) => {
    if (b - a < 0.5) return;
    // An angled front: the board leans back above the bend (side view).
    baffle.moveTo(front(a) - P, a);
    baffle.lineTo(front(a), a);
    baffle.lineTo(front(b), b);
    baffle.lineTo(front(b) - P, b);
    baffle.close();
  };
  for (const [a, b] of holes) {
    bseg(at, Math.max(at, a));
    at = Math.max(at, b);
  }
  bseg(at, v1 - P);
  // Ply seams along every cut face (7 plies, drawing default).
  const plyLines = make();
  for (let i = 1; i < 7; i++) {
    const t = (P * i) / 7;
    seg(plyLines, x0, v0 + t, front(v0 + t) - 0.5, v0 + t);
    seg(plyLines, x0, v1 - t, -0.5, v1 - t);
    if (c.back === 'closed') seg(plyLines, x0 + t, v0 + P, x0 + t, v1 - P);
  }
  // The covering on the outside faces, and protective corners (cosmetic).
  const covering = make();
  covering.moveTo(x0 - 2, v1 + 2);
  covering.lineTo(x0 - 2, v0 - 2);
  covering.lineTo(tf + 1, v0 - 2);
  const corners = make();
  for (const [cx, cv, sx, sv] of [
    [x0, v0, 1, 1],
    [x0, v1, 1, -1],
    [tf, v0, -1, 1],
    [0, v1, -1, -1],
  ] as const) {
    corners.moveTo(cx - sx * 3, cv - sv * 3);
    corners.lineTo(cx + sx * 46, cv - sv * 3);
    corners.quadTo(cx + sx * 30, cv + sv * 14, cx - sx * 3, cv + sv * 46);
    corners.close();
  }
  // The grille cloth: a thin woven band proud of the baffle, on a frame.
  const cloth = make();
  cloth.moveTo(front(v0 + P) + gx - 2.5, v0 + P);
  cloth.lineTo(front(v0 + P) + gx, v0 + P);
  cloth.lineTo(gx, bend);
  cloth.lineTo(gx, v1 - P);
  cloth.lineTo(gx - 2.5, v1 - P);
  cloth.lineTo(gx - 2.5, bend);
  cloth.close();
  const clothWeave = make();
  for (let v = v0 + P + 6; v < v1 - P; v += 9) seg(clothWeave, front(v) + gx - 2.4, v, front(v) + gx - 0.2, v + 4);
  // Frame battens between the baffle and the cloth (top and bottom).
  rect(panelsCut, front(v0 + P), v0 + P, front(v0 + P) + gx - 2.5, v0 + P + 14);
  rect(panelsCut, 0, v1 - P - 14, gx - 2.5, v1 - P);
  // The speakers in section (the 4×12's upper one tilted with the front).
  const deg = c.spec.angledTop?.mm ?? 0;
  const drivers = cut.map((d) => ({ v: d.v, x: front(d.v), off: d.off, s: d.sec, chord: d.chord, active: d.active, paths: speakerPaths(d.sec, d.chord), tilt: view === 'side' && d.v < c.centre.y && deg ? -deg : 0 }));
  return { floor, floorEdge, shadow, interior, panelsCut, plyLines, covering, baffle, cloth, clothWeave, corners, drivers, axisEnd: 1000 };
}

function getSection(kind: CabKind, back: Back, view: 'side' | 'top'): CabSectionBuilt {
  const key = `${kind}:${back}:${view}`;
  let b = cache.get(key);
  if (!b) {
    b = buildSection(cabDraw(kind, back), view);
    cache.set(key, b);
  }
  return b;
}

/** The cabinet CUT through the active speaker's axis (side or top view). */
export function CabSection({ kind, back, view, showAxis = true }: { kind: CabKind; back: Back; view: 'side' | 'top'; showAxis?: boolean }) {
  const c = cabDraw(kind, back);
  const g = getSection(kind, c.back, view);
  const v0 = view === 'side' ? c.box.y0 : c.box.z0;
  const v1 = view === 'side' ? c.box.y1 : c.box.z1;
  const act = g.drivers.find((d) => d.active);
  return (
    <Group>
      {g.floor ? (
        <>
          <Path path={g.floor}>
            <LinearGradient start={vec(0, c.floorY)} end={vec(0, c.floorY + 60)} colors={[...SPK.floor]} />
          </Path>
        </>
      ) : null}
      <Path path={g.shadow} color="#000" opacity={0.6}>
        <BlurMask blur={view === 'side' ? 7 : 16} style="normal" />
      </Path>
      {g.floorEdge ? <Path path={g.floorEdge} style="stroke" strokeWidth={2.5} color="#4a4c58" /> : null}
      {/* The inside of the box, seen through the cut: dim, lit from the upper left. */}
      <Path path={g.interior}>
        <LinearGradient start={vec(0, v0)} end={vec(0, v1)} colors={[...SPK.interior]} />
      </Path>
      <Path path={g.interior}>
        <RadialGradient c={vec(c.box.x0 + 60, v0 + 80)} r={Math.max(300, v1 - v0)} colors={['rgba(255,214,160,0.07)', 'rgba(255,214,160,0)']} />
      </Path>
      {/* Speakers behind the baffle. */}
      {g.drivers.map((d, i) => (
        <Group key={`d${i}`} transform={[{ translateX: d.x }, { translateY: d.v }, { rotate: (d.tilt * Math.PI) / 180 }]}>
          <SpeakerInSection s={d.s} chord={d.chord} paths={d.paths} active={d.active} />
        </Group>
      ))}
      {/* Plywood cut faces: panels, back (or rails), battens; the baffle. */}
      <Path path={g.panelsCut}>
        <LinearGradient start={vec(c.box.x0, v0)} end={vec(c.box.x0 + 24, v0 + 24)} colors={[...SPK.ply]} />
      </Path>
      <Path path={g.baffle}>
        <LinearGradient start={vec(-c.panel, 0)} end={vec(0, 0)} colors={[...SPK.ply]} />
      </Path>
      <Path path={g.plyLines} style="stroke" strokeWidth={0.35} color={SPK.plyLine} opacity={0.7} />
      <Path path={g.panelsCut} style="stroke" strokeWidth={1.6} color={SPK.ink} opacity={0.9} />
      <Path path={g.baffle} style="stroke" strokeWidth={1.6} color={SPK.ink} opacity={0.9} />
      {/* The black covering on the outer faces; protective corners. */}
      <Path path={g.covering} style="stroke" strokeWidth={4} color="#0d0d10" />
      <Path path={g.covering} style="stroke" strokeWidth={1.2} color="#5a5c64" opacity={0.6} />
      <Path path={g.corners}>
        <LinearGradient start={vec(c.box.x0, v0)} end={vec(c.box.x0 + 40, v0 + 40)} colors={[...SPK.corner]} />
      </Path>
      <Path path={g.corners} style="stroke" strokeWidth={0.8} color={SPK.ink} />
      {/* The grille cloth: woven, a little translucent (the speaker shows through). */}
      <Path path={g.cloth}>
        <LinearGradient start={vec(c.grilleX - 3, v0)} end={vec(c.grilleX, v1)} colors={[...SPK.cloth]} />
      </Path>
      <Path path={g.clothWeave} style="stroke" strokeWidth={0.7} color="#8d919b" opacity={0.55} />
      <Path path={g.cloth} style="stroke" strokeWidth={0.9} color={SPK.piping} opacity={0.65} />
      {/* The cone axis — the readout reference (crisp, never under an effect). */}
      {showAxis && act ? (
        <Line p1={vec(act.s.dustX(0), 0)} p2={vec(g.axisEnd, 0)} color={SPK.amber} strokeWidth={1.6} opacity={0.6}>
          <DashPathEffect intervals={[16, 10]} />
        </Line>
      ) : null}
    </Group>
  );
}

/* ── the cabinet from the front ── */
type FrontBuilt = { box: SkPath; cloth: SkPath; weave: SkPath; piping: SkPath; corners: SkPath; horn: SkPath | null; hornThroat: SkPath | null };
const frontCache = new Map<string, FrontBuilt>();

function buildFront(c: CabDraw): FrontBuilt {
  const { z0, z1, y0, y1 } = c.box;
  const box = rrect(make(), z0, y0, z1, y1, 10);
  const inset = 26;
  const cloth = rrect(make(), z0 + inset, y0 + inset, z1 - inset, y1 - inset, 6);
  const weave = make();
  for (let u = z0 + inset + 4; u < z1 - inset; u += 8) seg(weave, u, y0 + inset, u, y1 - inset);
  for (let v = y0 + inset + 4; v < y1 - inset; v += 8) seg(weave, z0 + inset, v, z1 - inset, v);
  const piping = rrect(make(), z0 + inset - 3, y0 + inset - 3, z1 - inset + 3, y1 - inset + 3, 8);
  const corners = make();
  for (const [cu, cv, su, sv] of [
    [z0, y0, 1, 1],
    [z1, y0, -1, 1],
    [z0, y1, 1, -1],
    [z1, y1, -1, -1],
  ] as const) {
    corners.moveTo(cu - su * 2, cv - sv * 2);
    corners.lineTo(cu + su * 50, cv - sv * 2);
    corners.quadTo(cu + su * 30, cv + sv * 30, cu - su * 2, cv + sv * 50);
    corners.close();
  }
  const h = c.horn;
  const horn = h ? rrect(make(), h.z - h.w / 2, h.y - h.h / 2, h.z + h.w / 2, h.y + h.h / 2, 6) : null;
  const hornThroat = h ? rrect(make(), h.z - h.w * 0.18, h.y - h.h * 0.18, h.z + h.w * 0.18, h.y + h.h * 0.18, 3) : null;
  return { box, cloth, weave, piping, corners, horn, hornThroat };
}

/** One speaker face-on (local: centre at 0, 0). */
function SpeakerFaceOn({ rFrame, rCut, rSurroundIn, rDust, k, active, detail }: { rFrame: number; rCut: number; rSurroundIn: number; rDust: number; k: number; active: boolean; detail: boolean }) {
  const holes: [number, number][] = detail
    ? [45, 135, 225, 315].map((a) => {
        const r = (SPEAKER_12.pcd.mm / 2) * k;
        return [r * Math.cos((a * Math.PI) / 180), r * Math.sin((a * Math.PI) / 180)];
      })
    : [];
  return (
    <Group>
      {/* Frame flange behind the cut-out (steel), with its 4 mounting holes. */}
      <Circle cx={0} cy={0} r={rFrame}>
        <RadialGradient c={vec(-rFrame * 0.4, -rFrame * 0.45)} r={rFrame * 1.6} colors={[...SPK.steel]} />
      </Circle>
      {holes.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={4.5 * k} color="#0d0e11" />
      ))}
      {/* Surround (a corrugated paper edge), then the cone, lit from the upper left. */}
      <Circle cx={0} cy={0} r={rCut}>
        <RadialGradient c={vec(-rCut * 0.35, -rCut * 0.4)} r={rCut * 1.5} colors={['#4f4740', '#2a241f', '#14110e']} />
      </Circle>
      <Circle cx={0} cy={0} r={rSurroundIn + (rCut - rSurroundIn) * 0.33} style="stroke" strokeWidth={(rCut - rSurroundIn) * 0.22} color="#1c1815" />
      <Circle cx={0} cy={0} r={rSurroundIn + (rCut - rSurroundIn) * 0.72} style="stroke" strokeWidth={(rCut - rSurroundIn) * 0.18} color="#1c1815" />
      <Circle cx={0} cy={0} r={rSurroundIn}>
        <RadialGradient c={vec(-rSurroundIn * 0.4, -rSurroundIn * 0.45)} r={rSurroundIn * 1.4} colors={[...SPK.cone]} />
      </Circle>
      <Circle cx={0} cy={0} r={rSurroundIn} style="stroke" strokeWidth={1.4 * k} color="#5a5048" />
      {detail ? (
        <>
          {/* Compliance rings pressed into the cone paper (drawing default). */}
          <Circle cx={0} cy={0} r={rSurroundIn * 0.82} style="stroke" strokeWidth={1.2 * k} color="#5c5249" opacity={0.6} />
          <Circle cx={0} cy={0} r={rSurroundIn * 0.66} style="stroke" strokeWidth={1.2 * k} color="#5c5249" opacity={0.45} />
        </>
      ) : null}
      {/* Dust cap: a felt-paper dome, highlight upper left. */}
      <Circle cx={0} cy={0} r={rDust}>
        <RadialGradient c={vec(-rDust * 0.4, -rDust * 0.45)} r={rDust * 1.3} colors={['#7a6f64', '#3b342e', '#1d1916']} />
      </Circle>
      <Circle cx={0} cy={0} r={rDust} style="stroke" strokeWidth={1.6 * k} color={active ? '#c9b28a' : '#0d0b09'} opacity={active ? 0.75 : 0.9} />
      <Circle cx={-rDust * 0.35} cy={-rDust * 0.38} r={rDust * 0.22} color="#ffffff" opacity={0.08}>
        <BlurMask blur={rDust * 0.2} style="normal" />
      </Circle>
    </Group>
  );
}

export type FrontMode = 'cloth' | 'baffle';

/** The cabinet from the mic's side (u = z, v = y). `cloth`: the grille cloth
 *  as seen (drivers faint behind it); `baffle`: the cloth taken away in the
 *  drawing (never on a real cabinet) to find the speaker behind it. */
export function CabFront({ kind, mode, spot }: { kind: CabKind; mode: FrontMode; spot?: 'centre' | 'boundary' | 'edge' | null }) {
  const c = cabDraw(kind, 'closed');
  const key = kind;
  let f = frontCache.get(key);
  if (!f) {
    f = buildFront(c);
    frontCache.set(key, f);
  }
  const fd = frontDrivers(c);
  const act = fd.find((d) => d.active)!;
  const k = act.rFrame / ((SPEAKER_12.dFrame.mm / 2));
  const spotR = spot ? CONE_SPOTS[spot] * k : null;
  return (
    <Group>
      <Group transform={[{ translateX: 12 }, { translateY: 16 }]}>
        <Path path={f.box} color="#000" opacity={0.55}>
          <BlurMask blur={18} style="normal" />
        </Path>
      </Group>
      <Path path={f.box}>
        <LinearGradient start={vec(c.box.z0, c.box.y0)} end={vec(c.box.z1, c.box.y1)} colors={[...SPK.tolex]} />
      </Path>
      <Path path={f.box} style="stroke" strokeWidth={2} color="#55585f" opacity={0.7} />
      {/* The baffle and its speakers (and the bass cabinet's horn). */}
      <Path path={f.cloth} color="#120f0c" />
      {fd.map((d, i) => (
        <Group key={i} transform={[{ translateX: d.u }, { translateY: d.v }]}>
          <SpeakerFaceOn rFrame={d.rFrame} rCut={d.rCut} rSurroundIn={d.rSurroundIn} rDust={d.rDust} k={d.rFrame / (SPEAKER_12.dFrame.mm / 2)} active={d.active} detail={mode === 'baffle'} />
        </Group>
      ))}
      {c.horn && f.horn && f.hornThroat ? (
        <Group>
          <Path path={f.horn}>
            <LinearGradient start={vec(c.horn.z - c.horn.w / 2, c.horn.y - c.horn.h / 2)} end={vec(c.horn.z + c.horn.w / 2, c.horn.y + c.horn.h / 2)} colors={['#4a4e57', '#1b1c20', '#0b0b0d']} />
          </Path>
          <Path path={f.hornThroat} color="#050506" />
        </Group>
      ) : null}
      {/* The grille cloth over it all (woven, translucent) — or taken away. */}
      {mode === 'cloth' ? (
        <>
          <Path path={f.cloth} opacity={0.88}>
            <LinearGradient start={vec(c.box.z0, c.box.y0)} end={vec(c.box.z1, c.box.y1)} colors={[...SPK.cloth]} />
          </Path>
          <Path path={f.weave} style="stroke" strokeWidth={0.8} color="#7b808a" opacity={0.22} />
        </>
      ) : (
        <Path path={f.cloth} style="stroke" strokeWidth={2} color={SPK.piping} opacity={0.35}>
          <DashPathEffect intervals={[14, 10]} />
        </Path>
      )}
      <Path path={f.piping} style="stroke" strokeWidth={3} color={SPK.piping} opacity={0.75} />
      <Path path={f.corners}>
        <LinearGradient start={vec(c.box.z0, c.box.y0)} end={vec(c.box.z0 + 40, c.box.y0 + 40)} colors={[...SPK.corner]} />
      </Path>
      {/* The active (miked) speaker, ringed in amber; on the cloth, the
          dust-cap region and outer cone marked "from outside the grille". */}
      <Circle cx={act.u} cy={act.v} r={act.rCut + 10} style="stroke" strokeWidth={5} color={SPK.amber} opacity={0.85}>
        <DashPathEffect intervals={[20, 12]} />
      </Circle>
      {mode === 'cloth' ? (
        <Circle cx={act.u} cy={act.v} r={act.rDust} style="stroke" strokeWidth={4} color={SPK.amber} opacity={0.7}>
          <DashPathEffect intervals={[10, 8]} />
        </Circle>
      ) : null}
      {spotR != null ? (
        <>
          <Circle cx={act.u} cy={act.v - spotR} r={14} style="stroke" strokeWidth={5} color="#6fa8ff" />
          <Circle cx={act.u} cy={act.v - spotR} r={4} color="#6fa8ff" />
        </>
      ) : null}
    </Group>
  );
}

/** One 12-in speaker face-on, large (the anatomy close-up): local centre 0, 0. */
export function SpeakerFace({ spot }: { spot?: 'centre' | 'boundary' | 'edge' | null }) {
  const s = speakerSection(12);
  return (
    <Group>
      <Circle cx={8} cy={12} r={s.rFrame + 6} color="#000" opacity={0.5}>
        <BlurMask blur={14} style="normal" />
      </Circle>
      <SpeakerFaceOn rFrame={s.rFrame} rCut={s.rCut} rSurroundIn={s.rSurroundIn} rDust={s.rDust} k={1} active detail />
      {spot ? (
        <>
          <Circle cx={0} cy={-CONE_SPOTS[spot]} r={13} style="stroke" strokeWidth={5} color="#6fa8ff" />
          <Circle cx={0} cy={-CONE_SPOTS[spot]} r={4} color="#6fa8ff" />
        </>
      ) : null}
    </Group>
  );
}
