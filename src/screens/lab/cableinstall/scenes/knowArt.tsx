/**
 * STAGE 2 — cable CROSS-SECTIONS (owner 2026-09-26 art pass: each workbench
 * card carried a 16 px ring-and-dot as its "cable", and the open card had a
 * photograph with no drawing beside it — D23 wants both).
 *
 * Each of the 14 types is drawn end-on as its real CONSTRUCTION, in mm, at a
 * typical outside diameter (stated on the figure as "typical"):
 *   conductors (stranded copper in coloured insulation), pairs, drain wires,
 *   braid / spiral / foil shields, fillers, the Cat 6 pair separator, 900 µm
 *   buffered fibres round a strength member, aramid yarn, foam dielectric.
 * The jacket wears the lab's training tint (the workbench legend) — conductor
 * insulation wears its real colour code (U.S. colours for mains; TIA-568 pair
 * colours for data).
 *
 * Two uses: the list SWATCH (no words, 24 px) and the open card's labelled
 * SECTION (callouts at 10 units ≈ 10 pt on a 390 phone; FULL SCREEN capable).
 */
import { useMemo } from 'react';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { CiCableClass } from '../data/cableTypes';
import { Callout, INK, shade, tint as lighten, useUid } from '../svgArt';

/* ── construction specs (mm) ────────────────────────────────────────────── */

type Cond = { x: number; y: number; r: number; ins: string; cu?: number; stripe?: string; bare?: boolean };
type Fibre = { x: number; y: number; r: number; buf: string };
/** Stadium centred at (x, y), lying along x: end-circle centres ±half,
 *  radius r to the foil's centreline. metalOut = foil applied aluminum out. */
type PairWrap = { x: number; y: number; half: number; r: number; metalOut?: boolean };
type Spec = {
  od: number;
  /** jacket wall thickness */
  wall: number;
  /** jacket finish: PVC shine vs rubber/PU matte */
  matte?: boolean;
  shield?: { kind: 'braid' | 'spiral' | 'foil' | 'foil+braid'; r: number };
  aramid?: { r0: number; r1: number };
  dielectric?: { r: number; foam?: boolean };
  spline?: number;
  fillers?: { x: number; y: number; r: number }[];
  conds?: Cond[];
  /** individually-shielded pair groups: centre + foil radius */
  pairFoils?: { x: number; y: number; r: number; a?: string; b?: string }[];
  /** a foil tape wrapped snugly round ONE pair (a stadium end-on), its own
   *  conductors and drain listed in `conds` */
  pairWraps?: PairWrap[];
  fibres?: Fibre[];
  strength?: number;
  labels: { text: string; at: [number, number] }[];
  note?: string;
};

const CU = '#c9824a';
const TIN = '#c7ccd2';
const FOIL = '#d9dde2';
/** The polyester film the foil is laminated to (the non-conductive face). */
const FILM = '#7f8790';
/** Hairline round a bare tinned drain, so it reads as its own wire where it
 *  presses on the (equally bright) metal face of the foil. */
const DRAIN_EDGE = '#6f757d';

/*
 * DRAIN WIRES (owner 2026-11-09). In these foil + drain constructions the
 * foil is wrapped ALUMINUM SIDE IN and the bare drain runs inside it, beside
 * the pair, "in intimate contact with the Beldfoil shield throughout its
 * length" (Belden technical bulletin T/8-7; Belden 9451: "Drain wire is
 * inside foil shield"). So each drain is drawn pressed against the foil's
 * inner (metal) face — never floating in the cavity, never outside the foil.
 */
/** Drawn foil thickness, mm (the ring's stroke in the labelled figure). */
const FOIL_T = 0.1;
/** Distance from the foil's centre to a drain of radius `dr` that touches
 *  the inner face of a foil of radius `fr` (a hair of overlap so no seam
 *  of background shows between them at any zoom). */
const drainSeat = (fr: number, dr: number) => fr - FOIL_T / 2 - dr + 0.01;
/** A foiled pair's drain: radius and centre, below the pair on the foil. */
const PAIR_DRAIN_R = 0.14;
function pairDrain(p: { x: number; y: number; r: number }) {
  const dr = PAIR_DRAIN_R * p.r;
  return { x: p.x, y: p.y + drainSeat(p.r, dr), r: dr };
}
const LINE_FOIL_R = 1.36;
const LINE_DRAIN_R = 0.22;
const LINE_DRAIN_Y = drainSeat(LINE_FOIL_R, LINE_DRAIN_R);

function pair(cx: number, cy: number, r: number, a: string, b: string, angle = 0, stripeA?: string): Cond[] {
  const c = Math.cos(angle) * r;
  const s = Math.sin(angle) * r;
  return [
    { x: cx - c, y: cy - s, r, ins: a, stripe: stripeA },
    { x: cx + c, y: cy + s, r, ins: b },
  ];
}

function ring(n: number, rad: number, phase = 0) {
  return Array.from({ length: n }, (_, i) => {
    const a = phase + (i * Math.PI * 2) / n;
    return { x: Math.cos(a) * rad, y: Math.sin(a) * rad, a };
  });
}

const WHITE = '#e9e9e4';
const PAIR_COLORS = ['#c83b32', '#2f64c8', '#3a9a48', '#e0782a', '#7a4a2a', '#1b1c20', '#7d8590', '#7b4bb0'];
const TIA = { blue: '#2f64c8', orange: '#e0782a', green: '#3a9a48', brown: '#7a4a2a' };

function cat6(od: number): Spec {
  const q = 1.05;
  const r = 0.52;
  return {
    od,
    wall: 0.62,
    spline: 2.2,
    conds: [
      ...pair(-q, -q, r, WHITE, TIA.blue, Math.PI / 4, TIA.blue),
      ...pair(q, -q, r, WHITE, TIA.orange, -Math.PI / 4, TIA.orange),
      ...pair(q, q, r, WHITE, TIA.green, Math.PI / 4, TIA.green),
      ...pair(-q, q, r, WHITE, TIA.brown, -Math.PI / 4, TIA.brown),
    ],
    labels: [],
  };
}

/* The 2-pair control cable (see SECTION.control for the datasheet values). */
const CONTROL = (() => {
  const ins = 0.6; // Ø1.2 insulated
  const cu = 0.38; // 22 AWG 7×30 ≈ Ø0.76
  const fr = ins + FOIL_T / 2; // foil centreline round each pair
  const py = ins + FOIL_T; // the two foiled pairs stacked, foil touching foil
  const dr = 0.305; // 24 AWG 7×32 ≈ Ø0.61
  // each drain nests in a groove beside the pairs, pressed on the foil's
  // OUTER (metal) face: its centre sits (foil outer face + dr) from the end
  // of the pair's foil, less a hair of overlap
  const dx = ins + Math.sqrt((py + dr - 0.01) ** 2 - py ** 2);
  const wraps: PairWrap[] = [
    { x: 0, y: -py, half: ins, r: fr, metalOut: true },
    { x: 0, y: py, half: ins, r: fr, metalOut: true },
  ];
  const conds: Cond[] = [
    { x: -ins, y: -py, r: ins, cu, ins: '#1b1c20' },
    { x: ins, y: -py, r: ins, cu, ins: '#c83b32' },
    { x: -ins, y: py, r: ins, cu, ins: WHITE },
    { x: ins, y: py, r: ins, cu, ins: '#2f9a44' },
  ];
  const drains = [
    { x: -dx, y: 0, r: dr, ins: CU, bare: true },
    { x: dx, y: 0, r: dr, ins: CU, bare: true },
  ];
  return { od: 4.27, wall: 0.51, wraps, conds, drains };
})();
const MULTI_PAIRS = ring(4, 1.95, Math.PI / 4).map((p) => ({ x: p.x, y: p.y, r: 1.36 }));
/** Where a callout leader lands on a drain (slightly right of its centre). */
const onDrain = (d: { x: number; y: number; r: number }): [number, number] => [d.x + d.r * 0.55, d.y];

export const SECTION: Record<CiCableClass, Spec> = {
  mic: {
    od: 6.5,
    wall: 1.0,
    shield: { kind: 'braid', r: 2.05 },
    conds: pair(0, 0, 0.78, WHITE, TIA.blue),
    fillers: [...ring(8, 1.55, 0.2).map((p) => ({ x: p.x, y: p.y, r: 0.2 }))],
    labels: [
      { text: 'PVC JACKET', at: [2.9, -1.5] },
      { text: 'BRAIDED SHIELD', at: [1.45, -1.45] },
      { text: 'TWISTED PAIR', at: [0.8, 0.1] },
      { text: 'COTTON FILLER', at: [-0.2, 1.52] },
    ],
  },
  line: {
    od: 4.8,
    wall: 0.95,
    shield: { kind: 'foil', r: LINE_FOIL_R },
    // the drain lies inside the foil, pressed against its metal face, below the pair
    conds: [...pair(0, -0.12, 0.6, '#1b1c20', '#c83b32'), { x: 0, y: LINE_DRAIN_Y, r: LINE_DRAIN_R, ins: CU, bare: true }],
    labels: [
      { text: 'PVC JACKET', at: [2.1, -1.1] },
      { text: 'FOIL SHIELD', at: [1.3, -0.45] },
      { text: 'TWISTED PAIR', at: [0.6, -0.12] },
      { text: 'DRAIN WIRE', at: onDrain({ x: 0, y: LINE_DRAIN_Y, r: LINE_DRAIN_R }) },
    ],
  },
  unbalanced: {
    od: 6.0,
    wall: 0.95,
    shield: { kind: 'braid', r: 1.9 },
    dielectric: { r: 1.55 },
    conds: [{ x: 0, y: 0, r: 0.42, ins: CU }],
    labels: [
      { text: 'PVC JACKET', at: [2.6, -1.3] },
      { text: 'SHIELD = SIGNAL RETURN', at: [1.85, -0.3] },
      { text: 'INSULATION', at: [0.9, 0.9] },
      { text: 'ONE CONDUCTOR', at: [0.2, 0.2] },
    ],
  },
  speaker: {
    od: 9.0,
    wall: 1.15,
    conds: [
      { x: -1.66, y: 0, r: 1.6, ins: '#2a2c31', cu: 0.95 },
      { x: 1.66, y: 0, r: 1.6, ins: '#c83b32', cu: 0.95 },
    ],
    fillers: [
      { x: 0, y: -2.2, r: 0.9 },
      { x: 0, y: 2.2, r: 0.9 },
    ],
    labels: [
      { text: 'JACKET', at: [3.9, -2.0] },
      { text: '2 × 2.5 mm² COPPER', at: [2.3, 0.6] },
      { text: 'FILLER', at: [0.3, 2.3] },
    ],
    note: 'NO SHIELD — HIGH LEVEL, LOW IMPEDANCE',
  },
  power: {
    od: 8.6,
    wall: 1.1,
    conds: [
      { x: 0, y: -1.26, r: 1.28, ins: '#1b1c20', cu: 0.82 },
      { x: -1.1, y: 0.66, r: 1.28, ins: '#e6e6e0', cu: 0.82 },
      { x: 1.1, y: 0.66, r: 1.28, ins: '#2f9a44', cu: 0.82 },
    ],
    fillers: [{ x: 0, y: 0.1, r: 0.35 }],
    labels: [
      { text: 'JACKET', at: [3.7, -1.9] },
      { text: 'HOT (BLACK)', at: [0.6, -1.5] },
      { text: 'NEUTRAL (WHITE)', at: [-1.3, 1.25] },
      { text: 'GROUND (GREEN)', at: [1.55, 1.1] },
    ],
    note: 'U.S. COLORS SHOWN — CODES VARY BY COUNTRY',
  },
  network: {
    ...cat6(6.2),
    labels: [
      { text: 'JACKET', at: [2.8, -1.4] },
      { text: '4 TWISTED PAIRS', at: [1.6, -0.9] },
      { text: 'PAIR SEPARATOR', at: [0.2, 1.3] },
    ],
    note: 'CAT 6 U/UTP — PAIR GEOMETRY IS THE PERFORMANCE',
  },
  poe: {
    ...cat6(7.2),
    wall: 0.75,
    labels: [
      { text: 'JACKET', at: [3.3, -1.6] },
      { text: 'PAIRS ALSO CARRY DC', at: [1.6, -0.9] },
      { text: 'PAIR SEPARATOR', at: [0.2, 1.3] },
    ],
    note: 'CAT 6A — BUNDLES WARM UP UNDER POE LOAD',
  },
  fiber: {
    od: 5.0,
    wall: 0.6,
    aramid: { r0: 1.55, r1: 1.9 },
    strength: 0.5,
    fibres: ring(6, 1.0, 0).map((p, i) => ({
      x: p.x,
      y: p.y,
      r: 0.45,
      buf: [TIA.blue, TIA.orange, TIA.green, TIA.brown, '#7d8590', WHITE][i],
    })),
    labels: [
      { text: 'JACKET', at: [2.2, -1.1] },
      { text: 'ARAMID YARN', at: [1.5, -0.8] },
      { text: '900 µm BUFFERED FIBERS', at: [1.0, 0.1] },
      { text: 'STRENGTH MEMBER', at: [0.2, 0.3] },
    ],
  },
  coax: {
    od: 6.9,
    wall: 0.72,
    shield: { kind: 'foil+braid', r: 2.55 },
    dielectric: { r: 2.3, foam: true },
    conds: [{ x: 0, y: 0, r: 0.51, ins: CU }],
    labels: [
      { text: 'JACKET', at: [3.1, -1.5] },
      { text: 'BRAID OVER FOIL', at: [2.5, -0.6] },
      { text: 'FOAM DIELECTRIC', at: [1.4, 0.9] },
      { text: 'CENTER CONDUCTOR', at: [0.3, 0.2] },
    ],
    note: 'RG-6 — 75 Ω; GEOMETRY + DIELECTRIC SET THE IMPEDANCE',
  },
  // 2-pair individually foiled audio/control/instrument cable, drawn from the
  // maker's datasheet (owner 2026-11-09: "correct for reference"): 22 AWG
  // 7×30 tinned copper (Ø0.76), polypropylene insulation 0.23 wall (Ø1.2),
  // pairs Black & Red / Green & White, a foil tape on EACH pair applied
  // FOIL-OUT ("foil-out tape on each pair, one drain wire"), so each pair's
  // bare 24 AWG 7×32 tinned drain (Ø0.61) runs OUTSIDE its foil, on the metal;
  // no overall shield; PVC jacket 0.51 wall, OD 0.160–0.168 in (4.06–4.27).
  // The two foiled pairs are cabled together; the drains lie in the grooves
  // beside them. Nothing else (no filler, no rip cord) is listed, so none is drawn.
  control: {
    od: CONTROL.od,
    wall: CONTROL.wall,
    pairWraps: CONTROL.wraps,
    conds: [...CONTROL.conds, ...CONTROL.drains],
    labels: [
      { text: 'PVC JACKET', at: [1.21, -1.44] },
      { text: 'FOIL, METAL SIDE OUT', at: [0.3, -1.37] },
      { text: '2 PAIRS · 22 AWG', at: [0.75, -0.7] },
      { text: 'DRAIN WIRE · 1 PER PAIR', at: onDrain(CONTROL.drains[1]) },
    ],
    note: 'NO OVERALL SHIELD — EACH PAIR HAS ITS OWN',
  },
  multipair: {
    od: 9.5,
    wall: 1.0,
    shield: { kind: 'braid', r: 3.6 },
    pairFoils: MULTI_PAIRS,
    labels: [
      { text: 'OVERALL JACKET', at: [4.3, -1.9] },
      { text: 'OVERALL BRAID', at: [3.3, -1.45] },
      { text: 'EACH PAIR FOILED', at: [2.66, 0.91] },
      { text: 'ONE DRAIN PER PAIR', at: onDrain(pairDrain(MULTI_PAIRS[0])) },
    ],
    note: 'ONE SHIELDED PAIR PER CHANNEL',
  },
  snake: {
    od: 17.0,
    wall: 1.9,
    matte: true,
    shield: { kind: 'braid', r: 6.45 },
    pairFoils: [
      ...ring(3, 1.55, Math.PI / 6).map((p) => ({ x: p.x, y: p.y, r: 1.35 })),
      ...ring(9, 4.35, 0).map((p) => ({ x: p.x, y: p.y, r: 1.35 })),
    ],
    labels: [
      { text: 'TOUGH FLEXIBLE JACKET', at: [7.8, -3.6] },
      { text: 'OVERALL BRAID', at: [6.1, 2.0] },
      { text: '12 FOILED PAIRS', at: [4.35, 0.3] },
    ],
    note: 'PORTABLE — BUILT TO BE COILED AND REDEPLOYED',
  },
  tacfiber: {
    od: 6.0,
    wall: 1.05,
    matte: true,
    aramid: { r0: 1.05, r1: 1.95 },
    fibres: ring(4, 0.52, Math.PI / 4).map((p, i) => ({ x: p.x, y: p.y, r: 0.45, buf: [TIA.blue, TIA.orange, TIA.green, TIA.brown][i] })),
    labels: [
      { text: 'RUGGED PU JACKET', at: [2.6, -1.3] },
      { text: 'DENSE ARAMID', at: [1.5, -0.2] },
      { text: '4 BUFFERED FIBERS', at: [0.5, 0.5] },
    ],
  },
  extension: {
    od: 11.4,
    wall: 1.65,
    matte: true,
    conds: [
      { x: 0, y: -1.72, r: 1.75, ins: '#1b1c20', cu: 1.03 },
      { x: -1.5, y: 0.88, r: 1.75, ins: '#e6e6e0', cu: 1.03 },
      { x: 1.5, y: 0.88, r: 1.75, ins: '#2f9a44', cu: 1.03 },
    ],
    fillers: [
      { x: 0, y: 0.05, r: 0.55 },
      { x: -2.4, y: -1.6, r: 0.8 },
      { x: 2.4, y: -1.6, r: 0.8 },
      { x: 0, y: 3.05, r: 0.8 },
    ],
    labels: [
      { text: 'HARD-USAGE RUBBER JACKET', at: [5.0, -2.2] },
      { text: '3 CONDUCTORS (U.S.)', at: [1.9, 1.1] },
      { text: 'FILLERS KEEP IT ROUND', at: [0, 3.05] },
    ],
    note: 'E.G. 12/3 SJOOW — U.S. COLORS SHOWN',
  },
};

/* ── the drawing ───────────────────────────────────────────────────────── */

/**
 * A foil shield end-on, `w` wide at radius `r` (drawing units). In the
 * labelled figure it is two-tone: the bright aluminum face on the INSIDE
 * (where the drain touches it) and the darker polyester film on the outside.
 * The swatch keeps one tone (too small to split).
 */
function FoilRing({ cx, cy, r, w, fine, fill = 'none' }: { cx: number; cy: number; r: number; w: number; fine: boolean; fill?: string }) {
  if (!fine) return <Circle cx={cx} cy={cy} r={r} fill={fill} stroke={FOIL} strokeWidth={w} />;
  return (
    <G>
      {fill !== 'none' ? <Circle cx={cx} cy={cy} r={r} fill={fill} /> : null}
      <Circle cx={cx} cy={cy} r={r + w / 4} fill="none" stroke={FILM} strokeWidth={w / 2} />
      <Circle cx={cx} cy={cy} r={r - w / 4} fill="none" stroke={FOIL} strokeWidth={w / 2} />
    </G>
  );
}

/** Draws the section centred at (cx, cy) with outside radius R (drawing units). */
export function CableSection({ cls, tint, cx, cy, R, fine = true }: { cls: CiCableClass; tint: string; cx: number; cy: number; R: number; fine?: boolean }) {
  const id = useUid();
  const sp = SECTION[cls];
  const s = R / (sp.od / 2);
  const X = (v: number) => cx + v * s;
  const Y = (v: number) => cy + v * s;
  const jr = sp.od / 2;
  const ir = jr - sp.wall;
  const jacketBody = shade(tint, 0.42);
  const hair = Math.max(0.35, 0.05 * s);

  const braid = useMemo(() => {
    if (!sp.shield || (sp.shield.kind !== 'braid' && sp.shield.kind !== 'foil+braid')) return '';
    const rr = sp.shield.r;
    const n = Math.round((2 * Math.PI * rr) / 0.34);
    const parts: string[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r1 = rr + (i % 2 ? 0.07 : -0.07);
      const x = cx + Math.cos(a) * r1 * s;
      const y = cy + Math.sin(a) * r1 * s;
      const rad = 0.1 * s;
      parts.push(`M${x - rad} ${y} a${rad} ${rad} 0 1 0 ${2 * rad} 0 a${rad} ${rad} 0 1 0 ${-2 * rad} 0`);
    }
    return parts.join('');
  }, [sp, cx, cy, s]);

  const strands = (x: number, y: number, r: number) => {
    const out: string[] = [];
    const sr = r / 3;
    const pts = [{ x: 0, y: 0 }, ...ring(6, sr * 2, 0)];
    for (const p of pts) {
      const px = x + p.x;
      const py = y + p.y;
      out.push(`M${px - sr} ${py} a${sr} ${sr} 0 1 0 ${2 * sr} 0 a${sr} ${sr} 0 1 0 ${-2 * sr} 0`);
    }
    return out.join('');
  };

  return (
    <G>
      <Defs>
        <RadialGradient id={`${id}j`} cx="38%" cy="32%" r="72%">
          <Stop offset="0" stopColor={lighten(jacketBody, sp.matte ? 0.12 : 0.28)} />
          <Stop offset="0.6" stopColor={jacketBody} />
          <Stop offset="1" stopColor={shade(jacketBody, 0.45)} />
        </RadialGradient>
        <RadialGradient id={`${id}c`} cx="40%" cy="35%" r="70%">
          <Stop offset="0" stopColor="#f0b27a" />
          <Stop offset="1" stopColor="#8e5429" />
        </RadialGradient>
        <RadialGradient id={`${id}d`} cx="40%" cy="35%" r="70%">
          <Stop offset="0" stopColor="#f4f5f2" />
          <Stop offset="1" stopColor="#b9bdb8" />
        </RadialGradient>
      </Defs>
      {/* jacket (annulus) — its cut face */}
      <Circle cx={cx + 0.12 * s} cy={cy + 0.2 * s} r={jr * s} fill="rgba(0,0,0,0.45)" />
      <Path
        d={`M${cx - jr * s} ${cy} a${jr * s} ${jr * s} 0 1 0 ${2 * jr * s} 0 a${jr * s} ${jr * s} 0 1 0 ${-2 * jr * s} 0 Z M${cx - ir * s} ${cy} a${ir * s} ${ir * s} 0 1 1 ${2 * ir * s} 0 a${ir * s} ${ir * s} 0 1 1 ${-2 * ir * s} 0 Z`}
        fill={`url(#${id}j)`}
        fillRule="evenodd"
        stroke={shade(tint, 0.7)}
        strokeWidth={hair}
      />
      <Circle cx={cx} cy={cy} r={jr * s - hair} fill="none" stroke={tint} strokeWidth={hair * 0.9} opacity={0.55} />
      {/* the cavity */}
      <Circle cx={cx} cy={cy} r={ir * s} fill="#0b0b0d" />
      {sp.aramid ? (
        <G>
          <Circle cx={cx} cy={cy} r={((sp.aramid.r0 + sp.aramid.r1) / 2) * s} fill="none" stroke="#c9a53a" strokeWidth={(sp.aramid.r1 - sp.aramid.r0) * s} opacity={0.85} />
          {fine ? (
            <Circle
              cx={cx}
              cy={cy}
              r={((sp.aramid.r0 + sp.aramid.r1) / 2) * s}
              fill="none"
              stroke="#f1d27a"
              strokeWidth={(sp.aramid.r1 - sp.aramid.r0) * s * 0.8}
              strokeDasharray={`${0.05 * s} ${0.12 * s}`}
              opacity={0.7}
            />
          ) : null}
        </G>
      ) : null}
      {sp.shield && sp.shield.kind === 'foil' ? (
        // foil + drain (the line pair): aluminum side in, drain inside against it
        <FoilRing cx={cx} cy={cy} r={sp.shield.r * s} w={Math.max(hair * 1.4, FOIL_T * s)} fine={fine} />
      ) : null}
      {sp.shield && sp.shield.kind === 'foil+braid' ? (
        <Circle cx={cx} cy={cy} r={(sp.shield.r - 0.18) * s} fill="none" stroke={FOIL} strokeWidth={Math.max(hair * 1.4, 0.1 * s)} />
      ) : null}
      {braid ? (fine ? <Path d={braid} fill={CU} stroke="#6d3f1d" strokeWidth={hair * 0.4} /> : <Circle cx={cx} cy={cy} r={sp.shield!.r * s} fill="none" stroke={CU} strokeWidth={0.22 * s} />) : null}
      {sp.dielectric ? (
        <G>
          <Circle cx={cx} cy={cy} r={sp.dielectric.r * s} fill={sp.dielectric.foam ? '#f2f2ec' : '#dcdcd6'} stroke="#9a9a92" strokeWidth={hair} />
          {sp.dielectric.foam && fine
            ? ring(14, sp.dielectric.r * 0.6, 0.3).map((p, i) => <Circle key={i} cx={X(p.x)} cy={Y(p.y)} r={0.09 * s} fill="#d6d6cf" />)
            : null}
        </G>
      ) : null}
      {sp.spline ? (
        <G>
          <Path
            d={`M${X(-sp.spline / 2)} ${Y(0)} H${X(sp.spline / 2)} M${X(0)} ${Y(-sp.spline / 2)} V${Y(sp.spline / 2)}`}
            stroke="#d8d8d2"
            strokeWidth={0.32 * s}
            strokeLinecap="round"
          />
        </G>
      ) : null}
      {sp.fillers?.map((f, i) => (
        <Circle key={`f${i}`} cx={X(f.x)} cy={Y(f.y)} r={f.r * s} fill="#b9ad8f" stroke="#6f6652" strokeWidth={hair * 0.6} opacity={0.9} />
      ))}
      {sp.pairFoils?.map((p, i) => {
        // conductor radius / offset / drain position scale with the group
        const cr = 0.345 * p.r;
        const off = 0.345 * p.r;
        const a = p.a ?? WHITE;
        const b = p.b ?? PAIR_COLORS[i % PAIR_COLORS.length];
        const dn = pairDrain(p);
        return (
          <G key={`p${i}`}>
            <FoilRing cx={X(p.x)} cy={Y(p.y)} r={p.r * s} w={Math.max(hair, FOIL_T * s)} fine={fine} fill="#101013" />
            <Circle cx={X(p.x - off)} cy={Y(p.y + off * 0.24)} r={cr * s} fill={a} stroke="#5a5d64" strokeWidth={hair * 0.5} />
            <Circle cx={X(p.x + off)} cy={Y(p.y - off * 0.24)} r={cr * s} fill={b} stroke="#5a5d64" strokeWidth={hair * 0.5} />
            {fine ? (
              <>
                <Circle cx={X(p.x - off)} cy={Y(p.y + off * 0.24)} r={cr * 0.4 * s} fill={`url(#${id}c)`} />
                <Circle cx={X(p.x + off)} cy={Y(p.y - off * 0.24)} r={cr * 0.4 * s} fill={`url(#${id}c)`} />
              </>
            ) : null}
            {/* the pair's bare drain, inside the foil and pressed against its metal face */}
            <Circle cx={X(dn.x)} cy={Y(dn.y)} r={dn.r * s} fill={fine ? `url(#${id}d)` : TIN} stroke={fine ? DRAIN_EDGE : 'none'} strokeWidth={hair * 0.45} />
          </G>
        );
      })}
      {sp.pairWraps?.map((p, i) => (
        <WrapFoil key={`w${i}`} x={X(p.x - p.half - p.r)} y={Y(p.y - p.r)} wd={(2 * p.half + 2 * p.r) * s} ht={2 * p.r * s} w={Math.max(hair, FOIL_T * s)} metalOut={!!p.metalOut} fine={fine} />
      ))}
      {sp.strength ? <Circle cx={cx} cy={cy} r={sp.strength * s} fill="#3e5f45" stroke="#1d2d20" strokeWidth={hair} /> : null}
      {sp.fibres?.map((f, i) => (
        <G key={`fb${i}`}>
          <Circle cx={X(f.x)} cy={Y(f.y)} r={f.r * s} fill={f.buf} stroke="#111" strokeWidth={hair * 0.6} />
          <Circle cx={X(f.x)} cy={Y(f.y)} r={Math.max(0.125 * s, 0.6)} fill="#e7f6ff" stroke="#8fb9cf" strokeWidth={hair * 0.4} />
        </G>
      ))}
      {sp.conds?.map((c, i) => {
        const cu = c.bare ? c.r : c.cu ?? c.r * 0.52;
        return (
          <G key={`c${i}`}>
            {c.bare ? null : (
              <>
                <Circle cx={X(c.x)} cy={Y(c.y)} r={c.r * s} fill={c.ins} stroke="#5a5d64" strokeWidth={hair * 0.7} />
                {c.stripe ? (
                  <Path
                    d={`M${X(c.x - c.r * 0.7)} ${Y(c.y - c.r * 0.7)} A${c.r * s} ${c.r * s} 0 0 1 ${X(c.x + c.r * 0.7)} ${Y(c.y - c.r * 0.7)}`}
                    stroke={c.stripe}
                    strokeWidth={c.r * s * 0.34}
                    fill="none"
                  />
                ) : null}
                <Circle cx={X(c.x - c.r * 0.3)} cy={Y(c.y - c.r * 0.35)} r={c.r * s * 0.35} fill="rgba(255,255,255,0.18)" />
              </>
            )}
            <Circle
              cx={X(c.x)}
              cy={Y(c.y)}
              r={cu * s}
              fill={c.bare ? `url(#${id}d)` : `url(#${id}c)`}
              stroke={c.bare && fine ? DRAIN_EDGE : 'none'}
              strokeWidth={hair * 0.45}
            />
            {fine && cu * s > 2.2 ? <Path d={strands(X(c.x), Y(c.y), cu * s * 0.95)} fill="none" stroke="rgba(80,40,15,0.55)" strokeWidth={hair * 0.5} /> : null}
          </G>
        );
      })}
    </G>
  );
}

/**
 * A foil tape round ONE pair, end-on: a stadium (x, y = its box's top-left,
 * wd × ht, fully rounded ends), `w` thick on its centreline. Two-tone in the
 * labelled figure: the bright aluminum on the side the drain touches (out
 * for a foil-out tape), the darker polyester film on the other.
 */
function WrapFoil({ x, y, wd, ht, w, metalOut, fine }: { x: number; y: number; wd: number; ht: number; w: number; metalOut: boolean; fine: boolean }) {
  const ring = (grow: number, stroke: string, sw: number, fill = 'none') => (
    <Rect x={x - grow} y={y - grow} width={wd + 2 * grow} height={ht + 2 * grow} rx={ht / 2 + grow} ry={ht / 2 + grow} fill={fill} stroke={stroke} strokeWidth={sw} />
  );
  if (!fine) return ring(0, FOIL, w, '#101013');
  return (
    <G>
      {ring(0, 'none', 0, '#101013')}
      {ring(w / 4, metalOut ? FOIL : FILM, w / 2)}
      {ring(-w / 4, metalOut ? FILM : FOIL, w / 2)}
    </G>
  );
}

/** The list swatch: the section, no words. */
export function CableSwatchArt({ cls, tint, size }: { cls: CiCableClass; tint: string; size: number }) {
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={size} height={size} viewBox="0 0 20 20">
      <CableSection cls={cls} tint={tint} cx={10} cy={10} R={8.6} fine={false} />
    </Svg>
  );
}

export const SECTION_VB_W = 320;
export const SECTION_VB_H = 150;
export const SECTION_ASPECT = SECTION_VB_W / SECTION_VB_H;

/** The open card's labelled section: drawing left, named layers right. */
export function CableSectionFigure({ cls, tint, w, h }: { cls: CiCableClass; tint: string; w: number; h: number }) {
  const sp = SECTION[cls];
  const R = 60;
  const cx = 72;
  const cy = sp.note ? 68 : 75;
  const s = R / (sp.od / 2);
  const n = sp.labels.length;
  const gap = 21;
  // labels + the OD line form one column, centred on the section
  const top = cy - (n * gap) / 2 + 2;
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox={`0 0 ${SECTION_VB_W} ${SECTION_VB_H}`}>
      <CableSection cls={cls} tint={tint} cx={cx} cy={cy} R={R} />
      {sp.labels.map((l, i) => {
        const ax = cx + l.at[0] * s;
        const ay = cy + l.at[1] * s;
        const ty = top + i * gap;
        return (
          <G key={l.text}>
            <Line x1={ax} y1={ay} x2={150} y2={ty} stroke="rgba(230,232,236,0.55)" strokeWidth={0.7} />
            <Line x1={150} y1={ty} x2={158} y2={ty} stroke="rgba(230,232,236,0.55)" strokeWidth={0.7} />
            <Circle cx={ax} cy={ay} r={1.5} fill="#f2f3f5" stroke="#111" strokeWidth={0.5} />
            <Callout x={160} y={ty + 3.5} text={l.text} anchor="start" size={10} color={INK.label} bg={null} />
          </G>
        );
      })}
      <Callout x={160} y={top + n * gap + 3.5} text={`TYPICAL OD ≈ ${sp.od} mm`} anchor="start" size={9.5} color={INK.sub} bg={null} />
      {sp.note ? <Callout x={SECTION_VB_W / 2} y={SECTION_VB_H - 7} text={sp.note} size={9.5} color={INK.warn} bg={null} /> : null}
    </Svg>
  );
}
