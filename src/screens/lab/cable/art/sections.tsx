/**
 * Cable cross-sections + the PEEL side view (fix pass 2026-10-16).
 *
 * Every construction is drawn at its REAL size in millimetres (one common
 * scale for all of them, so a speaker cable really is fatter than a mic
 * cable and a fibre really is thinner than all of them):
 *
 *   mic / balanced pair   Ø6.0  two 0.22 mm² conductors (Ø1.6 insulated), braid
 *   instrument            Ø6.0  one Ø0.7 conductor, Ø3.0 PE insulation, braid
 *   2-core speaker        Ø8.5  two 2.5 mm² fine-stranded (Ø2.0, Ø3.4 insulated)
 *   AC cord (16 AWG ×3)   Ø8.0  three Ø1.5 conductors, Ø2.7 insulated
 *   Cat 5e U/UTP          Ø5.3  four pairs, Ø0.51 solid copper, Ø0.95 insulated
 *   75 Ω coax (RG-59)     Ø6.1  Ø0.81 centre, Ø3.7 foam dielectric, braid
 *   fibre (simplex)       Ø3.0  aramid yarn, Ø0.9 tight buffer, 125 µm glass,
 *                               50 µm core (the glass shown enlarged in a lens)
 *
 * The side view strips the cable back exactly as the lesson peels it: one
 * layer per tap, outside → in, each named on a leader. The layer just peeled
 * is ringed in amber in BOTH views.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type { CableSectionId } from '../cableTypes';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import { ART, BraidRing, CARD_LABEL_U, CopperEnd, InsulatedEnd, Label, Leader, ScaleBar, useArtUid } from './kit';
import { shade, tint } from './kit2';

/** Extra constructions used by the look-alike comparisons (Lesson 4). */
export type SectionId = CableSectionId | 'aes3_110' | 'dmx_120' | 'audio_coax' | 'rg58_50' | 'insert_y';

const JK = {
  black: '#2b2d32',
  grey: '#5d6068',
  blue: '#2d5f9e',
  purple: '#5a4386',
  orange: '#d9822b',
};
const INS = {
  red: '#b8352a',
  white: '#e4e4de',
  black: '#25262a',
  green: '#2f8f3f',
  pe: '#dfe3dc',
  foam: '#eeeee8',
  blue: '#2f6fc0',
};
/** T568B pair colours — a REAL standard colour code, not UI inks. */
const PAIR = { orange: '#e07b2a', green: '#3a9a4a', blue: '#2f6fc0', brown: '#7a4a2a' };

type XsProps = { k: number; cx: number; cy: number; hl: number };

/** Amber ring marking the layer just peeled. */
function Hl({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return <Circle cx={cx} cy={cy} r={r + 1.2} fill="none" stroke={ART.hi} strokeWidth={1.6} />;
}

function Jacket({ cx, cy, k, od, id, color }: { cx: number; cy: number; k: number; od: number; id: number; color: string }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={(od / 2) * k} fill={color} stroke={tint(color, 0.28)} strokeWidth={0.9} />
      <Path
        d={`M${cx - (od / 2) * k * 0.82} ${cy - (od / 2) * k * 0.45} A${(od / 2) * k * 0.94} ${(od / 2) * k * 0.94} 0 0 1 ${cx + (od / 2) * k * 0.2} ${cy - (od / 2) * k * 0.92}`}
        stroke={tint(color, 0.35)}
        strokeWidth={Math.max(1, ((od - id) / 2) * k * 0.35)}
        fill="none"
        opacity={0.2}
        strokeLinecap="round"
      />
      <Circle cx={cx} cy={cy} r={(id / 2) * k} fill={ART.insul} />
    </G>
  );
}

/** Two touching insulated conductors at angle `a` (rad) about (cx, cy). */
function pairPts(cx: number, cy: number, k: number, od: number, a: number): [[number, number], [number, number]] {
  const dx = Math.cos(a) * (od / 2) * k;
  const dy = Math.sin(a) * (od / 2) * k;
  return [
    [cx - dx, cy - dy],
    [cx + dx, cy + dy],
  ];
}

const XS: Record<SectionId, { od: number; xs: (p: XsProps) => ReactNode }> = {
  balanced_shielded: {
    od: 6.0,
    xs: ({ k, cx, cy, hl }) => {
      const [a, b] = pairPts(cx, cy, k, 1.6, 0.35);
      return (
        <G>
          <Jacket cx={cx} cy={cy} k={k} od={6.0} id={3.9} color={JK.black} />
          <BraidRing cx={cx} cy={cy} ro={1.95} ri={1.7} k={k} />
          <InsulatedEnd cx={a[0]} cy={a[1]} od={1.6} cu={0.62} k={k} color={INS.red} />
          <InsulatedEnd cx={b[0]} cy={b[1]} od={1.6} cu={0.62} k={k} color={INS.white} />
          {hl === 0 ? <Hl cx={cx} cy={cy} r={3.0 * k} /> : null}
          {hl === 1 ? <Hl cx={cx} cy={cy} r={1.95 * k} /> : null}
          {hl === 2 ? [a, b].map((p, i) => <Hl key={i} cx={p[0]} cy={p[1]} r={0.8 * k} />) : null}
          {hl === 3 ? [a, b].map((p, i) => <Hl key={i} cx={p[0]} cy={p[1]} r={0.31 * k} />) : null}
        </G>
      );
    },
  },
  instrument_unbalanced: {
    od: 6.0,
    xs: ({ k, cx, cy, hl }) => (
      <G>
        <Jacket cx={cx} cy={cy} k={k} od={6.0} id={3.5} color={JK.black} />
        <BraidRing cx={cx} cy={cy} ro={1.75} ri={1.5} k={k} />
        <InsulatedEnd cx={cx} cy={cy} od={3.0} cu={0.7} k={k} color={INS.pe} />
        {hl === 0 ? <Hl cx={cx} cy={cy} r={3.0 * k} /> : null}
        {hl === 1 ? <Hl cx={cx} cy={cy} r={1.75 * k} /> : null}
        {hl === 2 ? <Hl cx={cx} cy={cy} r={1.5 * k} /> : null}
        {hl === 3 ? <Hl cx={cx} cy={cy} r={0.35 * k} /> : null}
      </G>
    ),
  },
  speaker_2c: {
    od: 8.5,
    xs: ({ k, cx, cy, hl }) => {
      const pts: [number, number][] = [
        [cx - 1.7 * k, cy],
        [cx + 1.7 * k, cy],
      ];
      return (
        <G>
          <Jacket cx={cx} cy={cy} k={k} od={8.5} id={6.9} color={JK.black} />
          <InsulatedEnd cx={pts[0][0]} cy={pts[0][1]} od={3.4} cu={2.0} k={k} color={INS.red} />
          <InsulatedEnd cx={pts[1][0]} cy={pts[1][1]} od={3.4} cu={2.0} k={k} color={'#3a3b40'} />
          {hl === 0 ? <Hl cx={cx} cy={cy} r={4.25 * k} /> : null}
          {hl === 1 ? pts.map((p, i) => <Hl key={i} cx={p[0]} cy={p[1]} r={1.7 * k} />) : null}
          {hl === 2 ? pts.map((p, i) => <Hl key={i} cx={p[0]} cy={p[1]} r={1.0 * k} />) : null}
        </G>
      );
    },
  },
  ac_3c_grounded: {
    od: 8.0,
    xs: ({ k, cx, cy, hl }) => {
      const pts = [-90, 30, 150].map((deg) => [cx + Math.cos((deg * Math.PI) / 180) * 1.56 * k, cy + Math.sin((deg * Math.PI) / 180) * 1.56 * k] as [number, number]);
      const cols = [INS.green, INS.white, '#1f2024'];
      return (
        <G>
          <Jacket cx={cx} cy={cy} k={k} od={8.0} id={5.9} color={JK.black} />
          {pts.map((p, i) => (
            <InsulatedEnd key={i} cx={p[0]} cy={p[1]} od={2.7} cu={1.5} k={k} color={cols[i]} />
          ))}
          {hl === 0 ? <Hl cx={cx} cy={cy} r={4.0 * k} /> : null}
          {hl === 1 ? pts.map((p, i) => <Hl key={i} cx={p[0]} cy={p[1]} r={1.35 * k} />) : null}
          {hl === 2 ? pts.map((p, i) => <Hl key={i} cx={p[0]} cy={p[1]} r={0.75 * k} />) : null}
        </G>
      );
    },
  },
  ethernet_4pair: {
    od: 5.3,
    xs: ({ k, cx, cy, hl }) => {
      const cols = [PAIR.orange, PAIR.green, PAIR.blue, PAIR.brown];
      const pairs = [45, 135, 225, 315].map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        const pc: [number, number] = [cx + Math.cos(a) * 1.2 * k, cy + Math.sin(a) * 1.2 * k];
        const [p1, p2] = pairPts(pc[0], pc[1], k, 0.95, a); // pair axis radial: inner + outer conductor
        return { pc, p1, p2, col: cols[i], a };
      });
      return (
        <G>
          <Jacket cx={cx} cy={cy} k={k} od={5.3} id={4.3} color={JK.blue} />
          {pairs.map((p, i) => (
            <G key={i}>
              <InsulatedEnd cx={p.p1[0]} cy={p.p1[1]} od={0.95} cu={0.51} k={k} color={p.col} solid />
              <InsulatedEnd cx={p.p2[0]} cy={p.p2[1]} od={0.95} cu={0.51} k={k} color={INS.white} stripe={p.col} solid />
            </G>
          ))}
          {hl === 0 ? <Hl cx={cx} cy={cy} r={2.65 * k} /> : null}
          {hl === 1
            ? pairs.map((p, i) => (
                <Ellipse
                  key={i}
                  cx={p.pc[0]}
                  cy={p.pc[1]}
                  rx={0.95 * k + 1.6}
                  ry={0.475 * k + 1.6}
                  transform={`rotate(${(p.a * 180) / Math.PI} ${p.pc[0]} ${p.pc[1]})`}
                  fill="none"
                  stroke={ART.hi}
                  strokeWidth={1.4}
                />
              ))
            : null}
          {hl === 2 ? pairs.flatMap((p, i) => [<Hl key={`a${i}`} cx={p.p1[0]} cy={p.p1[1]} r={0.475 * k} />, <Hl key={`b${i}`} cx={p.p2[0]} cy={p.p2[1]} r={0.475 * k} />]) : null}
          {hl === 3 ? pairs.flatMap((p, i) => [<Hl key={`a${i}`} cx={p.p1[0]} cy={p.p1[1]} r={0.26 * k} />, <Hl key={`b${i}`} cx={p.p2[0]} cy={p.p2[1]} r={0.26 * k} />]) : null}
        </G>
      );
    },
  },
  coax: {
    od: 6.1,
    xs: ({ k, cx, cy, hl }) => (
      <G>
        <Jacket cx={cx} cy={cy} k={k} od={6.1} id={4.3} color={JK.black} />
        <BraidRing cx={cx} cy={cy} ro={2.15} ri={1.85} k={k} />
        <InsulatedEnd cx={cx} cy={cy} od={3.7} cu={0.81} k={k} color={INS.foam} solid />
        {hl === 0 ? <Hl cx={cx} cy={cy} r={3.05 * k} /> : null}
        {hl === 1 ? <Hl cx={cx} cy={cy} r={2.15 * k} /> : null}
        {hl === 2 ? <Hl cx={cx} cy={cy} r={1.85 * k} /> : null}
        {hl === 3 ? <Hl cx={cx} cy={cy} r={0.405 * k} /> : null}
      </G>
    ),
  },
  optical_fiber: {
    od: 3.0,
    xs: ({ k, cx, cy, hl }) => {
      // The glass (125 µm cladding, 50 µm core) is 1.5 units across at this
      // scale — real, and too small to read — so a lens shows it enlarged.
      const lx = cx + 34;
      const ly = cy + 30;
      const lr = 25;
      const m = lr / 0.08; // lens scale (units per mm): cladding Ø0.125 → Ø~39
      return (
        <G>
          <Jacket cx={cx} cy={cy} k={k} od={3.0} id={2.0} color={JK.orange} />
          <Circle cx={cx} cy={cy} r={1.0 * k} fill="#d8c070" opacity={0.85} />
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2;
            return <Line key={i} x1={cx + Math.cos(a) * 0.5 * k} y1={cy + Math.sin(a) * 0.5 * k} x2={cx + Math.cos(a + 0.4) * 0.98 * k} y2={cy + Math.sin(a + 0.4) * 0.98 * k} stroke="#b59a45" strokeWidth={0.6} />;
          })}
          <Circle cx={cx} cy={cy} r={0.45 * k} fill="#f2f2ee" stroke="#9a9a92" strokeWidth={0.4} />
          <Circle cx={cx} cy={cy} r={0.0625 * k + 0.4} fill="#cfefff" />
          {/* lens cone from the glass to the enlarged view */}
          <Path d={`M${cx + 1} ${cy + 1} L${lx - lr * 0.75} ${ly - lr * 0.66} M${cx + 1} ${cy + 1} L${lx + lr * 0.2} ${ly - lr * 0.98}`} stroke={ART.leader} strokeWidth={0.6} />
          <Circle cx={lx} cy={ly} r={lr} fill="#f2f2ee" stroke={ART.sub} strokeWidth={0.8} />
          <Circle cx={lx} cy={ly} r={0.0625 * m} fill="#a9dcf5" stroke="#6fa7c4" strokeWidth={0.6} />
          <Circle cx={lx} cy={ly} r={0.025 * m} fill="#e9fbff" stroke="#7fd4ff" strokeWidth={0.6} />
          <Label x={lx + 8} y={ly + lr + 12} text="glass, magnified" anchor="end" size={9.5} color={ART.sub} weight="regular" />
          {hl === 0 ? <Hl cx={cx} cy={cy} r={1.5 * k} /> : null}
          {hl === 1 ? <Hl cx={lx} cy={ly} r={0.0625 * m} /> : null}
          {hl === 2 ? <Hl cx={lx} cy={ly} r={0.025 * m} /> : null}
        </G>
      );
    },
  },
  aes3_110: {
    od: 5.6,
    xs: ({ k, cx, cy }) => {
      const [a, b] = pairPts(cx, cy, k, 1.9, 0.35);
      return (
        <G>
          <Jacket cx={cx} cy={cy} k={k} od={5.6} id={4.3} color={JK.grey} />
          <Circle cx={cx} cy={cy} r={2.1 * k} fill="none" stroke="#d4d8de" strokeWidth={1.2} />
          <CopperEnd cx={cx + 1.1 * k} cy={cy + 1.45 * k} d={0.5} k={k} tinned />
          <InsulatedEnd cx={a[0]} cy={a[1]} od={1.9} cu={0.6} k={k} color={INS.foam} />
          <InsulatedEnd cx={b[0]} cy={b[1]} od={1.9} cu={0.6} k={k} color={INS.blue} />
        </G>
      );
    },
  },
  dmx_120: {
    od: 6.0,
    xs: ({ k, cx, cy }) => {
      const [a, b] = pairPts(cx, cy, k, 1.8, -0.3);
      return (
        <G>
          <Jacket cx={cx} cy={cy} k={k} od={6.0} id={4.2} color={JK.purple} />
          <BraidRing cx={cx} cy={cy} ro={2.1} ri={1.85} k={k} />
          <Circle cx={cx} cy={cy} r={1.82 * k} fill="none" stroke="#d4d8de" strokeWidth={1} />
          <InsulatedEnd cx={a[0]} cy={a[1]} od={1.8} cu={0.6} k={k} color={INS.foam} />
          <InsulatedEnd cx={b[0]} cy={b[1]} od={1.8} cu={0.6} k={k} color={INS.blue} />
        </G>
      );
    },
  },
  audio_coax: {
    od: 4.5,
    xs: ({ k, cx, cy }) => (
      <G>
        <Jacket cx={cx} cy={cy} k={k} od={4.5} id={3.1} color={JK.black} />
        <BraidRing cx={cx} cy={cy} ro={1.55} ri={1.35} k={k} />
        <InsulatedEnd cx={cx} cy={cy} od={2.7} cu={0.5} k={k} color={INS.pe} />
      </G>
    ),
  },
  rg58_50: {
    od: 4.95,
    xs: ({ k, cx, cy }) => (
      <G>
        <Jacket cx={cx} cy={cy} k={k} od={4.95} id={3.6} color={JK.black} />
        <BraidRing cx={cx} cy={cy} ro={1.8} ri={1.5} k={k} />
        <InsulatedEnd cx={cx} cy={cy} od={2.95} cu={0.9} k={k} color={'#e6e8e2'} solid />
      </G>
    ),
  },
  insert_y: {
    od: 8.0,
    xs: ({ k, cx, cy }) => (
      <G>
        {[-1, 1].map((s) => (
          <G key={s}>
            <Jacket cx={cx + s * 2.0 * k} cy={cy} k={k} od={4.0} id={2.8} color={JK.black} />
            <BraidRing cx={cx + s * 2.0 * k} cy={cy} ro={1.4} ri={1.2} k={k} />
            <InsulatedEnd cx={cx + s * 2.0 * k} cy={cy} od={2.4} cu={0.5} k={k} color={INS.pe} />
          </G>
        ))}
      </G>
    ),
  },
};

/* ── side view (the peel) ─────────────────────────────────────────────────── */

type Grad = (c: string) => string;

/** A cylinder segment, side-on, lit from above. */
function Cyl({ x0, x1, cy, d, k, color, g, edge = true }: { x0: number; x1: number; cy: number; d: number; k: number; color: string; g: Grad; edge?: boolean }) {
  const r = (d / 2) * k;
  return (
    <G>
      <Rect x={x0} y={cy - r} width={Math.max(0, x1 - x0)} height={2 * r} fill={g(color)} />
      {edge ? <Line x1={x1} y1={cy - r} x2={x1} y2={cy + r} stroke={shade(color, 0.55)} strokeWidth={0.9} /> : null}
    </G>
  );
}

/** Braid texture over a cylinder segment: the two crossing strand sets. */
function BraidSide({ x0, x1, cy, d, k, clip }: { x0: number; x1: number; cy: number; d: number; k: number; clip: string }) {
  const r = (d / 2) * k;
  const step = 0.55 * k;
  const lines: string[] = [];
  for (let x = x0 - 2 * r; x < x1 + 2 * r; x += step) {
    lines.push(`M${x} ${cy - r} L${x + r * 1.1} ${cy + r}`);
    lines.push(`M${x} ${cy + r} L${x + r * 1.1} ${cy - r}`);
  }
  return (
    <G>
      <Defs>
        <ClipPath id={clip}>
          <Rect x={x0} y={cy - r} width={Math.max(0, x1 - x0)} height={2 * r} />
        </ClipPath>
      </Defs>
      <Rect x={x0} y={cy - r} width={Math.max(0, x1 - x0)} height={2 * r} fill={ART.tinLo} />
      <Path d={lines.join(' ')} clipPath={`url(#${clip})`} stroke={ART.tin} strokeWidth={Math.max(0.8, step * 0.38)} />
      <Rect x={x0} y={cy - r} width={Math.max(0, x1 - x0)} height={r * 0.5} fill="#ffffff" opacity={0.12} />
      <Rect x={x0} y={cy + r * 0.45} width={Math.max(0, x1 - x0)} height={r * 0.55} fill="#000000" opacity={0.25} />
    </G>
  );
}

/** Bare stranded copper, side-on: a copper rod with its strand lay lines. */
function CopperSide({ x0, x1, cy, d, k, g, tinned }: { x0: number; x1: number; cy: number; d: number; k: number; g: Grad; tinned?: boolean }) {
  const r = (d / 2) * k;
  const lay: string[] = [];
  if (r > 2.5) for (let x = x0; x < x1; x += Math.max(2, r * 0.8)) lay.push(`M${x} ${cy + r} L${Math.min(x1, x + r * 0.9)} ${cy - r}`);
  return (
    <G>
      <Rect x={x0} y={cy - r} width={Math.max(0, x1 - x0)} height={2 * r} rx={Math.min(r, 1.2)} fill={g(tinned ? ART.tin : ART.copper)} />
      {lay.length ? <Path d={lay.join(' ')} stroke={tinned ? ART.tinLo : ART.copperLo} strokeWidth={0.5} opacity={0.8} /> : null}
    </G>
  );
}

/** An insulated wire following a path of points, side-on (stroke ribbon). */
function Wire({ pts, w, color }: { pts: [number, number][]; w: number; color: string }) {
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
  return (
    <G>
      <Path d={d} stroke={shade(color, 0.45)} strokeWidth={w} fill="none" strokeLinecap="butt" />
      <Path d={d} stroke={color} strokeWidth={w * 0.78} fill="none" strokeLinecap="butt" />
      <Path d={d} stroke="#ffffff" strokeWidth={w * 0.18} fill="none" opacity={0.3} transform={`translate(0 ${-w * 0.2})`} />
    </G>
  );
}

/** A twisted pair from x0 to x1 about centre line `yc(x)`: two wires on a
 *  helix (lay length `lay` units), drawn half-twist by half-twist so the
 *  front wire always covers the back one. */
function TwistedPair({ x0, x1, yc, w, colors, lay, stripe }: { x0: number; x1: number; yc: (x: number) => number; w: number; colors: [string, string]; lay: number; stripe?: string }) {
  const a = w / 2;
  const out: ReactNode[] = [];
  const half = lay / 2;
  let n = 0;
  for (let xs = x0; xs < x1 - 0.01; xs += half, n++) {
    const xe = Math.min(x1, xs + half);
    const seg = (ph: number): [number, number][] => {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 8; i++) {
        const x = xs + ((xe - xs) * i) / 8;
        const th = ((x - x0) / lay) * Math.PI * 2 + ph;
        pts.push([x, yc(x) + a * Math.cos(th)]);
      }
      return pts;
    };
    // In half-twist n, wire (n % 2) is behind.
    const back = n % 2;
    const order = [back, 1 - back];
    for (const wi of order) {
      out.push(<Wire key={`${n}-${wi}`} pts={seg(wi * Math.PI)} w={w} color={colors[wi]} />);
      if (stripe && wi === 1) {
        const p = seg(Math.PI);
        out.push(<Path key={`${n}-s`} d={p.map((q, i) => `${i ? 'L' : 'M'}${q[0]} ${q[1]}`).join(' ')} stroke={stripe} strokeWidth={w * 0.22} strokeDasharray={`${w * 0.9} ${w * 0.9}`} fill="none" />);
      }
    }
  }
  return <G>{out}</G>;
}

/** Wavy break line marking where the drawn cable continues off-figure. */
function BreakEnd({ x, cy, r }: { x: number; cy: number; r: number }) {
  return <Path d={`M${x} ${cy - r - 1} C${x + 4} ${cy - r / 2}, ${x - 4} ${cy + r / 2}, ${x} ${cy + r + 1}`} stroke={ART.bg} strokeWidth={3} fill="none" />;
}

export type SideLayer = { name: string };

const VB_W = 340;
const VB_H = 156;
const K = 12; // units per mm — one scale for every construction
const SX0 = 136; // side view start
const SX1 = 336; // side view end
const SCY = 72;
const XCX = 64; // cross-section centre
const XCY = 70;

/** Side-view stripping positions (mm from the side view's start). */
function stops(L: number): number[] {
  return L >= 4 ? [0, 4.4, 7.0, 13.0] : [0, 6.4, 11.6];
}

type SideProps = { m: number; hl: number; g: Grad; uid: string; X: (mm: number) => number; xEnd: number };

/** Fan geometry for a multi-conductor cable leaving its jacket. */
function fanY(j: number, n: number, mouthPitch: number, endPitch: number, x: number, xm: number, xf: number) {
  const t = Math.max(0, Math.min(1, (x - xm) / Math.max(1, xf - xm)));
  const e = t * t * (3 - 2 * t);
  const off = j - (n - 1) / 2;
  return SCY + off * (mouthPitch + (endPitch - mouthPitch) * e);
}

function sideRender(id: CableSectionId, p: SideProps): { body: ReactNode; anchors: { x: number; y: number }[] } {
  const { m, g, uid, X, xEnd } = p;
  const segEnd = (i: number) => (i < m ? X(stops(XS_LAYERS[id])[i + 1]) : xEnd);
  const segStart = (i: number) => X(stops(XS_LAYERS[id])[i]);
  const mid = (i: number) => (segStart(i) + segEnd(i)) / 2;
  const anchors: { x: number; y: number }[] = [];
  const parts: ReactNode[] = [];
  const conc = (layers: { d: number; color: string; tex?: 'braid' | 'copper' }[]) => {
    // Concentric construction: draw innermost visible first, outer over it.
    for (let i = Math.min(m, layers.length - 1); i >= 0; i--) {
      const L = layers[i];
      const x0 = i === 0 ? SX0 : segStart(i) - 2;
      const x1 = segEnd(i);
      if (L.tex === 'braid') parts.push(<BraidSide key={i} x0={x0} x1={x1} cy={SCY} d={L.d} k={K} clip={`${uid}c${i}`} />);
      else if (L.tex === 'copper') parts.push(<CopperSide key={i} x0={x0} x1={x1} cy={SCY} d={L.d} k={K} g={g} />);
      else parts.push(<Cyl key={i} x0={x0} x1={x1} cy={SCY} d={L.d} k={K} color={L.color} g={g} />);
    }
    for (let i = 0; i <= Math.min(m, layers.length - 1); i++) anchors.push({ x: mid(i), y: SCY - (layers[i].d / 2) * K });
  };
  switch (id) {
    case 'instrument_unbalanced':
      conc([
        { d: 6.0, color: JK.black },
        { d: 3.5, color: ART.tin, tex: 'braid' },
        { d: 3.0, color: INS.pe },
        { d: 0.7, color: ART.copper, tex: 'copper' },
      ]);
      break;
    case 'coax':
      conc([
        { d: 6.1, color: JK.black },
        { d: 4.3, color: ART.tin, tex: 'braid' },
        { d: 3.7, color: INS.foam },
        { d: 0.81, color: ART.copper, tex: 'copper' },
      ]);
      break;
    case 'balanced_shielded': {
      const show = Math.min(m, 3);
      if (show >= 2) {
        // the twisted pair (insulated) from inside the shield to its strip point
        const x0 = segStart(2) - 3;
        const xIns = segEnd(2);
        const yc = () => SCY;
        if (show >= 3) {
          // stripped tips: two bare conductors, parted slightly
          [[-1, INS.red], [1, INS.white]].forEach(([s]) => {
            const y = SCY + (s as number) * 0.8 * K;
            parts.push(<CopperSide key={`cu${s}`} x0={xIns - 1} x1={xEnd} cy={y} d={0.62} k={K} g={g} />);
          });
          // the pair parts just before the strip point
          parts.push(<Wire key="pa" pts={[[xIns - 14, SCY - 0.4 * K], [xIns, SCY - 0.8 * K]]} w={1.6 * K} color={INS.red} />);
          parts.push(<Wire key="pb" pts={[[xIns - 14, SCY + 0.4 * K], [xIns, SCY + 0.8 * K]]} w={1.6 * K} color={INS.white} />);
          parts.push(<TwistedPair key="tp" x0={x0} x1={xIns - 14} yc={yc} w={1.6 * K} colors={[INS.red, INS.white]} lay={8 * K} />);
        } else {
          parts.push(<TwistedPair key="tp" x0={x0} x1={xIns} yc={yc} w={1.6 * K} colors={[INS.red, INS.white]} lay={8 * K} />);
        }
      }
      if (m >= 1) parts.push(<BraidSide key="br" x0={segStart(1) - 2} x1={segEnd(1)} cy={SCY} d={3.9} k={K} clip={`${uid}br`} />);
      parts.push(<Cyl key="jk" x0={SX0} x1={segEnd(0)} cy={SCY} d={6.0} k={K} color={JK.black} g={g} />);
      anchors.push({ x: mid(0), y: SCY - 3.0 * K });
      if (m >= 1) anchors.push({ x: mid(1), y: SCY - 1.95 * K });
      if (m === 2) anchors.push({ x: mid(2), y: SCY - 0.9 * K });
      if (m >= 3) {
        const xIns = segEnd(2);
        anchors.push({ x: xIns - 6, y: SCY - 0.8 * K - 0.8 * K }); // insulation: the parted wire
        anchors.push({ x: (segStart(2) + xIns - 14) / 2, y: SCY - 0.8 * K }); // the twisted run
      }
      break;
    }
    case 'speaker_2c':
    case 'ac_3c_grounded': {
      const spk = id === 'speaker_2c';
      const n = spk ? 2 : 3;
      const od = spk ? 3.4 : 2.7;
      const cu = spk ? 2.0 : 1.5;
      const cols = spk ? [INS.red, '#3a3b40'] : ['#1f2024', INS.white, INS.green];
      const jod = spk ? 8.5 : 8.0;
      const xm = segStart(1);
      const xf = xm + 3 * K;
      if (m >= 1) {
        for (let j = 0; j < n; j++) {
          const pts: [number, number][] = [];
          const xIns = m >= 2 ? segEnd(1) : xEnd;
          for (let x = xm - 6; x <= xIns; x += 3) pts.push([x, fanY(j, n, od * K * 0.92, od * K * 1.12, x, xm, xf)]);
          pts.push([xIns, fanY(j, n, od * K * 0.92, od * K * 1.12, xIns, xm, xf)]);
          if (m >= 2) parts.push(<CopperSide key={`c${j}`} x0={xIns - 1} x1={xEnd} cy={pts[pts.length - 1][1]} d={cu} k={K} g={g} />);
          parts.push(<Wire key={`w${j}`} pts={pts} w={od * K} color={cols[j]} />);
        }
      }
      parts.push(<Cyl key="jk" x0={SX0} x1={segEnd(0)} cy={SCY} d={jod} k={K} color={JK.black} g={g} />);
      anchors.push({ x: mid(0), y: SCY - (jod / 2) * K });
      if (m >= 1) anchors.push({ x: mid(1), y: fanY(0, n, od * K * 0.92, od * K * 1.12, mid(1), xm, xf) - (od / 2) * K });
      if (m >= 2) anchors.push({ x: mid(2), y: fanY(0, n, od * K * 0.92, od * K * 1.12, mid(2), xm, xf) - (cu / 2) * K });
      break;
    }
    case 'ethernet_4pair': {
      const cols = [PAIR.orange, PAIR.green, PAIR.blue, PAIR.brown];
      const w = 0.95 * K;
      const xm = segStart(1);
      const xf = xm + 2.4 * K;
      const pairPitchMouth = 1.05 * K;
      const pairPitch = 2.2 * K;
      if (m >= 1) {
        const xPairEnd = m >= 2 ? segEnd(1) : xEnd;
        cols.forEach((c, j) => {
          const yc = (x: number) => fanY(j, 4, pairPitchMouth, pairPitch, x, xm, xf);
          parts.push(<TwistedPair key={`p${j}`} x0={xm - 4} x1={xPairEnd} yc={yc} w={w} colors={[c, INS.white]} lay={(14 + j * 2.5) * K * 0.5} stripe={c} />);
          if (m >= 2) {
            // untwisted: the two wires of the pair run straight and part
            const xIns = m >= 3 ? segEnd(2) : xEnd;
            const y = yc(xPairEnd);
            [-1, 1].forEach((s, wi) => {
              const yy = y + s * w * 0.62;
              const col = wi === 0 ? c : INS.white;
              if (m >= 3) parts.push(<CopperSide key={`cu${j}${wi}`} x0={xIns - 1} x1={xEnd} cy={yy} d={0.51} k={K} g={g} />);
              parts.push(<Wire key={`u${j}${wi}`} pts={[[xPairEnd - 1, y + s * w * 0.5], [xPairEnd + 6, yy], [xIns, yy]]} w={w} color={col} />);
              if (wi === 1) parts.push(<Path key={`us${j}`} d={`M${xPairEnd + 6} ${yy} L${xIns} ${yy}`} stroke={c} strokeWidth={w * 0.22} strokeDasharray={`${w * 0.9} ${w * 0.9}`} />);
            });
          }
        });
      }
      parts.push(<Cyl key="jk" x0={SX0} x1={segEnd(0)} cy={SCY} d={5.3} k={K} color={JK.blue} g={g} />);
      anchors.push({ x: mid(0), y: SCY - 2.65 * K });
      if (m >= 1) anchors.push({ x: mid(1), y: fanY(0, 4, pairPitchMouth, pairPitch, mid(1), xm, xf) - w });
      if (m >= 2) anchors.push({ x: mid(2), y: fanY(0, 4, pairPitchMouth, pairPitch, mid(2), xm, xf) - w * 1.1 });
      if (m >= 3) anchors.push({ x: mid(3), y: fanY(0, 4, pairPitchMouth, pairPitch, mid(2), xm, xf) - w * 0.62 - 0.26 * K });
      break;
    }
    case 'optical_fiber': {
      // Jacket & buffer (one peel): the orange jacket stops, the aramid yarn
      // shows for 2 mm, then the white 0.9 mm tight buffer.
      const jEnd = m >= 1 ? segStart(1) - 4.6 * K : xEnd;
      const yEnd = m >= 1 ? segStart(1) - 2.6 * K : xEnd;
      const bEnd = segEnd(0);
      if (m >= 1) parts.push(<Cyl key="gl" x0={bEnd - 2} x1={xEnd} cy={SCY} d={0.125} k={K} color="#cfefff" g={g} edge={false} />);
      parts.push(<Cyl key="bf" x0={SX0} x1={bEnd} cy={SCY} d={0.9} k={K} color="#f2f2ee" g={g} />);
      if (m >= 1) {
        const yarn: string[] = [];
        for (let i = 0; i < 9; i++) {
          const y = SCY - 0.95 * K + (i / 8) * 1.9 * K;
          yarn.push(`M${jEnd - 2} ${y} C${jEnd + 6} ${y + 1.5}, ${yEnd - 8} ${y - 1.5}, ${yEnd + (i % 3) * 2} ${SCY + (y - SCY) * 0.55}`);
        }
        parts.push(<Path key="yn" d={yarn.join(' ')} stroke="#d8c070" strokeWidth={1.1} fill="none" />);
      }
      parts.push(<Cyl key="jk" x0={SX0} x1={jEnd} cy={SCY} d={3.0} k={K} color={JK.orange} g={g} />);
      anchors.push({ x: (SX0 + jEnd) / 2, y: SCY - 1.5 * K });
      if (m >= 1) {
        anchors.push({ x: (bEnd + xEnd) / 2, y: SCY - 1 });
        // un-numbered parts named in passing: the yarn and the buffer
        parts.push(
          <G key="fx">
            <Leader x1={jEnd + 4} y1={SCY + 34} x2={jEnd + 6} y2={SCY + 0.7 * K} />
            <Label x={jEnd - 2} y={SCY + 45} text="aramid yarn" size={9.5} color={ART.sub} weight="regular" />
            <Leader x1={yEnd + 30} y1={SCY + 22} x2={yEnd + 18} y2={SCY + 0.45 * K} />
            <Label x={yEnd + 26} y={SCY + 33} text="0.9 mm buffer" size={9.5} color={ART.sub} weight="regular" />
          </G>,
        );
      }
      if (m >= 2) anchors.push({ x: -1, y: -1 }); // the core: pointed at in the lens
      break;
    }
  }
  return { body: <G>{parts}</G>, anchors };
}

const XS_LAYERS: Record<CableSectionId, number> = {
  balanced_shielded: 4,
  instrument_unbalanced: 4,
  speaker_2c: 3,
  ac_3c_grounded: 3,
  ethernet_4pair: 4,
  coax: 4,
  optical_fiber: 3,
};

/** One-line caption per construction (sizes and what is real). */
export const SECTION_CAPTION: Record<SectionId, string> = {
  balanced_shielded: 'Drawn to scale: Ø 6 mm mic cable — two 0.22 mm² conductors inside a braid shield. Insulation colours vary by maker.',
  instrument_unbalanced: 'Drawn to scale: Ø 6 mm instrument cable — one small conductor inside a braid shield.',
  speaker_2c: 'Drawn to scale: Ø 8.5 mm speaker cable — two 2.5 mm² fine-stranded conductors, no shield. Markings vary by maker.',
  ac_3c_grounded:
    'Drawn to scale: Ø 8 mm cord, three 16 AWG conductors in the North American colours (black line, white neutral, green earth). Other regions use other codes — e.g. IEC brown, blue, green-yellow.',
  ethernet_4pair: 'Drawn to scale: Ø 5.3 mm Cat 5e — four pairs in the T568 colours, each twisted at its own rate.',
  coax: 'Drawn to scale: Ø 6.1 mm 75-ohm coax — one centre conductor, foam dielectric, braid shield.',
  optical_fiber: 'Drawn to scale: Ø 3 mm fibre patch cord. The glass is only 0.125 mm across, so the lens shows it enlarged: cladding around a 0.05 mm core.',
  aes3_110: 'Ø 5.6 mm 110-ohm digital pair: foamed insulation, foil shield and a drain wire.',
  dmx_120: 'Ø 6 mm 120-ohm data pair: foamed insulation, foil and braid.',
  audio_coax: 'Ø 4.5 mm audio interconnect: one conductor and a braid — not impedance-controlled.',
  rg58_50: 'Ø 5 mm 50-ohm coax: solid dielectric, thicker centre.',
  insert_y: 'Two small shielded cables side by side — send and return.',
};

/** Short tile captions for the look-alike comparisons (no job named — the
 *  learner is deciding the job). */
export const SECTION_SHORT: Record<SectionId, string> = {
  balanced_shielded: 'Ø 6 mm · two conductors + braid shield',
  instrument_unbalanced: 'Ø 6 mm · one small conductor + braid shield',
  speaker_2c: 'Ø 8.5 mm · two heavy conductors, no shield',
  ac_3c_grounded: 'Ø 8 mm · three conductors',
  ethernet_4pair: 'Ø 5.3 mm · four twisted pairs',
  coax: 'Ø 6.1 mm · 75-ohm coax, foam dielectric',
  optical_fiber: 'Ø 3 mm · glass fibre',
  aes3_110: 'Ø 5.6 mm · 110-ohm pair, foil + drain wire',
  dmx_120: 'Ø 6 mm · 120-ohm pair, foil + braid',
  audio_coax: 'Ø 4.5 mm · one conductor + braid, impedance not controlled',
  rg58_50: 'Ø 5 mm · 50-ohm coax, solid dielectric',
  insert_y: 'two small shielded cables, side by side',
};

/**
 * The Lesson 2 peel figure: the cut end (left) + the cable stripped back
 * layer by layer (right). `revealed` = layers named so far (0 = unopened).
 * `names` = the lesson's own layer names, outside → in.
 */
export function CableSectionFigure({ id, revealed, names, controls }: { id: CableSectionId; revealed: number; names: string[]; controls?: ReactNode }) {
  const uid = useArtUid();
  const a11y = `Drawing of ${names.length}-layer cable, ${revealed === 0 ? 'unopened' : `${revealed} of ${names.length} layers peeled`}.`;
  return (
    <ExpandableFigure
      aspect={VB_W / VB_H}
      title="INSIDE THE CABLE"
      controls={controls}
      render={(w, h) => (
        <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
          <SectionSvg id={id} revealed={revealed} names={names} uid={uid} w={w} h={h} />
        </View>
      )}
    />
  );
}

function SectionSvg({ id, revealed, names, uid, w, h }: { id: CableSectionId; revealed: number; names: string[]; uid: string; w: number; h: number }) {
  // Deterministic gradient ids per colour (a child component resolves its
  // fill at ITS render, after this one returns — so the Defs list is fixed).
  const g: Grad = (c) => `url(#${uid}g${c.replace('#', '')})`;
  const m = Math.max(0, revealed - 1);
  const hl = revealed - 1;
  const X = (mm: number) => SX0 + mm * K;
  const { body, anchors } = sideRender(id, { m, hl, g, uid, X, xEnd: SX1 });
  const spec = XS[id];
  const isFiber = id === 'optical_fiber';
  const xcx = isFiber ? XCX - 20 : XCX;
  const xcy = isFiber ? XCY - 22 : XCY;
  // Labels for the layers named so far: one row above and one below the
  // side view; each label takes the free slot nearest its own stretch of
  // cable (no two labels ever touch) and points at it on a leader.
  const labels: ReactNode[] = [];
  const placed: { row: 0 | 1; x0: number; x1: number }[] = [];
  const textW = (t: string) => t.length * 5.6 + 4;
  for (let i = 0; i < Math.min(revealed, names.length); i++) {
    const a = anchors[i];
    const text = `${i + 1} ${names[i]}`;
    if (!a) continue;
    if (a.x < 0) {
      // fibre core: labelled at the lens
      labels.push(
        <G key={i}>
          <Leader x1={xcx + 64} y1={xcy + 56} x2={xcx + 36} y2={xcy + 31} />
          <Label x={xcx + 66} y={xcy + 62} text={text} size={CARD_LABEL_U} color={i === hl ? ART.hi : ART.label} />
        </G>,
      );
      continue;
    }
    const tw = textW(text);
    let best: { row: 0 | 1; x0: number; cost: number } | null = null;
    for (const row of [0, 1] as const) {
      const pref = Math.min(VB_W - 4 - tw, Math.max(SX0 - 8, a.x - tw / 2));
      for (let dx = 0; dx < 240; dx += 4) {
        for (const sgn of [1, -1]) {
          const x0 = pref + sgn * dx;
          if (x0 < SX0 - 8 || x0 + tw > VB_W - 4) continue;
          const clash = placed.some((q) => q.row === row && x0 < q.x1 + 6 && x0 + tw > q.x0 - 6);
          if (!clash) {
            const cost = dx + (row === (i % 2 === 0 ? 0 : 1) ? 0 : 10);
            if (!best || cost < best.cost) best = { row, x0, cost };
            break;
          }
        }
        if (best && best.row === row) break;
      }
    }
    if (!best) continue;
    placed.push({ row: best.row, x0: best.x0, x1: best.x0 + tw });
    const above = best.row === 0;
    const ly = above ? 14 : VB_H - 8;
    const lx = best.x0 + tw / 2;
    const tipY = above ? a.y : SCY + (SCY - a.y);
    labels.push(
      <G key={i}>
        <Leader x1={lx} y1={above ? ly + 3 : ly - 11} x2={a.x} y2={tipY} />
        <Label x={lx} y={ly} text={text} anchor="middle" size={CARD_LABEL_U} color={i === hl ? ART.hi : ART.label} />
      </G>,
    );
  }
  const gradColours = [...Object.values(JK), ...Object.values(INS), ART.copper, ART.tin, '#cfefff', '#f2f2ee', '#3a3b40', '#1f2024'];
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      <Rect x={0} y={0} width={VB_W} height={VB_H} rx={8} fill={ART.bg} />
      {spec.xs({ k: K, cx: xcx, cy: xcy, hl })}
      {body}
      <BreakEnd x={SX0} cy={SCY} r={(spec.od / 2) * K} />
      {labels}
      <Label x={8} y={VB_H - 8} text="CUT END" color={ART.sub} size={CARD_LABEL_U} />
      <ScaleBar x={70} y={VB_H - 11} k={K} mm={2} />
      <Defs>
        {Array.from(new Set(gradColours)).map((c) => (
          <LinearGradient key={c} id={`${uid}g${c.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={tint(c, 0.32)} />
            <Stop offset="0.35" stopColor={c} />
            <Stop offset="1" stopColor={shade(c, 0.55)} />
          </LinearGradient>
        ))}
      </Defs>
    </Svg>
  );
}

/** A cross-section on its own (comparisons): drawn at `k` units per mm so
 *  sibling tiles share one scale. */
export function SectionTile({ id, k = 9, size = 96 }: { id: SectionId; k?: number; size?: number }) {
  return (
    <View style={{ width: size, height: size }} accessible accessibilityRole="image" accessibilityLabel={`Cross-section: ${SECTION_CAPTION[id]}`}>
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {XS[id].xs({ k, cx: size / 2, cy: size / 2, hl: -1 })}
      </Svg>
    </View>
  );
}

export const SECTION_OD: Record<SectionId, number> = Object.fromEntries(Object.entries(XS).map(([k2, v]) => [k2, v.od])) as Record<SectionId, number>;
