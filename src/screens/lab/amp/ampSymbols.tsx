/**
 * Amplifier Lab — the real parts, drawn (lab-art round 3, 2026-10-16: the
 * grading found "almost no real equipment: the supply, the active device,
 * the load and the half-bridge devices are labelled rounded boxes"). One
 * place for the schematic symbols an engineer would draw — MOSFET, BJT,
 * triode, DC supply, loudspeaker, ground — and the loudspeaker CABINET that
 * ends a signal-flow chain. All SVG, all in the caller's drawing units.
 */
import { Circle, G, Line, Path, Rect } from 'react-native-svg';

/** n-channel enhancement MOSFET, drain UP at (x, yD), source DOWN at (x, yS),
 *  gate lead to the LEFT ending in a small terminal. `on` (0..1) lights the
 *  three-segment channel. */
export function MosfetSymbol({ x, yD, yS, color, on = 1, dashed }: { x: number; yD: number; yS: number; color: string; on?: number; dashed?: boolean }) {
  const c = (yD + yS) / 2;
  const ch = x - 7; // channel bar
  const gp = x - 11; // gate plate
  return (
    <G>
      <Path d={`M${x} ${yD} V${c - 8} H${ch}`} fill="none" stroke={color} strokeWidth={1.5} />
      <Path d={`M${ch} ${c + 8} H${x} V${yS}`} fill="none" stroke={color} strokeWidth={1.5} />
      {/* body tied to the source; arrow INTO the channel = n-type */}
      <Path d={`M${x} ${c + 8} V${c} H${ch + 1}`} fill="none" stroke={color} strokeWidth={1.2} />
      <Path d={`M${ch + 1} ${c} l4 -2.6 v5.2 z`} fill={color} />
      {[-8, 0, 8].map((dy) => (
        <Line key={dy} x1={ch} y1={c + dy - 3.2} x2={ch} y2={c + dy + 3.2} stroke={color} strokeWidth={2.4} strokeOpacity={0.35 + 0.65 * on} />
      ))}
      <Line x1={gp} y1={c - 9} x2={gp} y2={c + 9} stroke={color} strokeWidth={1.5} strokeDasharray={dashed ? '3,2' : undefined} />
      <Line x1={gp} y1={c + 9} x2={gp - 12} y2={c + 9} stroke={color} strokeWidth={1.2} />
      <Circle cx={gp - 13.5} cy={c + 9} r={1.6} fill="none" stroke={color} strokeWidth={1} />
    </G>
  );
}

/** NPN BJT in its circle: base from the LEFT at (cx − r, cy), collector UP,
 *  emitter DOWN (arrow out). */
export function BjtSymbol({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  const bx = cx - r * 0.25;
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill="#101014" stroke={color} strokeWidth={1.3} />
      <Line x1={cx - r} y1={cy} x2={bx} y2={cy} stroke={color} strokeWidth={1.5} />
      <Line x1={bx} y1={cy - r * 0.5} x2={bx} y2={cy + r * 0.5} stroke={color} strokeWidth={2.6} />
      <Path d={`M${bx} ${cy - r * 0.22} L${cx + r * 0.42} ${cy - r * 0.62} V${cy - r}`} fill="none" stroke={color} strokeWidth={1.5} />
      <Path d={`M${bx} ${cy + r * 0.22} L${cx + r * 0.42} ${cy + r * 0.62} V${cy + r}`} fill="none" stroke={color} strokeWidth={1.5} />
      <Path d={`M${cx + r * 0.42} ${cy + r * 0.62} l-${r * 0.32} -${r * 0.02} l${r * 0.14} -${r * 0.27} z`} fill={color} />
    </G>
  );
}

/** Triode in its envelope: plate at the top, grid (dashed) in the middle fed
 *  from the LEFT, cathode at the bottom with its heater hint. */
export function TriodeSymbol({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill="#101014" stroke={color} strokeWidth={1.3} />
      {/* plate */}
      <Line x1={cx - r * 0.45} y1={cy - r * 0.45} x2={cx + r * 0.45} y2={cy - r * 0.45} stroke={color} strokeWidth={2} />
      <Line x1={cx} y1={cy - r * 0.45} x2={cx} y2={cy - r} stroke={color} strokeWidth={1.5} />
      {/* control grid */}
      <Line x1={cx - r * 0.5} y1={cy} x2={cx + r * 0.5} y2={cy} stroke={color} strokeWidth={1.4} strokeDasharray="2.5,2" />
      <Line x1={cx - r} y1={cy} x2={cx - r * 0.5} y2={cy} stroke={color} strokeWidth={1.4} />
      {/* cathode */}
      <Path d={`M${cx - r * 0.45} ${cy + r * 0.32} H${cx + r * 0.25} V${cy + r * 0.45} M${cx} ${cy + r * 0.32} V${cy + r}`} fill="none" stroke={color} strokeWidth={1.6} />
      <Path d={`M${cx - r * 0.35} ${cy + r * 0.82} l${r * 0.17} -${r * 0.22} l${r * 0.17} ${r * 0.22}`} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.6} />
    </G>
  );
}

/** DC supply (a battery-style cell pair) with + on the RIGHT terminal at
 *  (x + w, cy) and − on the LEFT at (x, cy). */
export function DcSupplySymbol({ x, cy, w, color }: { x: number; cy: number; w: number; color: string }) {
  const m = x + w / 2;
  return (
    <G>
      <Line x1={x} y1={cy} x2={m - 9} y2={cy} stroke={color} strokeWidth={1.5} />
      {/* two cells: long plate = +, short plate = − */}
      <Line x1={m - 9} y1={cy - 6} x2={m - 9} y2={cy + 6} stroke={color} strokeWidth={2.4} />
      <Line x1={m - 3} y1={cy - 12} x2={m - 3} y2={cy + 12} stroke={color} strokeWidth={1.6} />
      <Line x1={m + 3} y1={cy - 6} x2={m + 3} y2={cy + 6} stroke={color} strokeWidth={2.4} />
      <Line x1={m + 9} y1={cy - 12} x2={m + 9} y2={cy + 12} stroke={color} strokeWidth={1.6} />
      <Line x1={m + 9} y1={cy} x2={x + w} y2={cy} stroke={color} strokeWidth={1.5} />
      <Path d={`M${m + 14} ${cy - 15} h6 M${m + 17} ${cy - 18} v6`} stroke={color} strokeWidth={1.2} />
      <Path d={`M${m - 20} ${cy - 15} h6`} stroke={color} strokeWidth={1.2} />
    </G>
  );
}

/** Loudspeaker, schematic symbol: the magnet block with its cone opening to
 *  the RIGHT; terminals at the top (x, y) and bottom (x, y + 22). */
export function SpeakerSymbol({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <G>
      <Rect x={x - 6} y={y} width={12} height={22} rx={1.5} fill="#1a2a1e" stroke={color} strokeWidth={1.4} />
      <Path d={`M${x + 6} ${y + 4} L${x + 20} ${y - 8} V${y + 30} L${x + 6} ${y + 18} Z`} fill="#1a2a1e" stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
    </G>
  );
}

/** A loudspeaker CABINET seen from the front (woofer, tweeter, port), top
 *  centre at (cx, y), `h` tall (width ≈ 0.62 h — a typical 2-way box). */
export function SpeakerCabinet({ cx, y, h, color }: { cx: number; y: number; h: number; color: string }) {
  const w = h * 0.62;
  const x = cx - w / 2;
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={h * 0.05} fill="#17181d" stroke={color} strokeWidth={1.2} />
      <Circle cx={cx} cy={y + h * 0.17} r={h * 0.075} fill="#0b0c0f" stroke={color} strokeWidth={0.9} />
      <Circle cx={cx} cy={y + h * 0.56} r={h * 0.25} fill="#0b0c0f" stroke={color} strokeWidth={1.1} />
      <Circle cx={cx} cy={y + h * 0.56} r={h * 0.17} fill="none" stroke={color} strokeWidth={0.6} strokeOpacity={0.6} />
      <Circle cx={cx} cy={y + h * 0.56} r={h * 0.07} fill={color} fillOpacity={0.25} />
      <Rect x={cx - w * 0.28} y={y + h * 0.86} width={w * 0.56} height={h * 0.05} rx={h * 0.025} fill="#0b0c0f" stroke={color} strokeWidth={0.6} />
    </G>
  );
}

/** Ground symbol (three shrinking bars) hanging under (x, y). */
export function GroundSymbol({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <G>
      <Line x1={x} y1={y} x2={x} y2={y + 4} stroke={color} strokeWidth={1.4} />
      <Line x1={x - 8} y1={y + 4} x2={x + 8} y2={y + 4} stroke={color} strokeWidth={1.6} />
      <Line x1={x - 5} y1={y + 7.5} x2={x + 5} y2={y + 7.5} stroke={color} strokeWidth={1.4} />
      <Line x1={x - 2} y1={y + 11} x2={x + 2} y2={y + 11} stroke={color} strokeWidth={1.2} />
    </G>
  );
}

