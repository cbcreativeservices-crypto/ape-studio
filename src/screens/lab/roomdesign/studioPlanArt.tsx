/**
 * Studio objects drawn the way a production drawing shows them (art pass
 * 2026-10-10): a monitor or a sub from ABOVE is the TOP of its cabinet, with
 * the baffle as its front edge and the drivers behind it as dashed HIDDEN
 * LINES (the drafting convention) — never a woofer face seen through the lid.
 * From the SIDE it is the cabinet's side panel: baffle edge toward the
 * listener, drivers hidden, a real stand under it.
 *
 * Every glyph is drawn centred on (0, 0) in PIXELS, from a cabinet size the
 * caller has already scaled from metres, so the drawing stays proportional to
 * the room. Pure react-native-svg (no gradient ids → safe to repeat in one
 * root). Plan glyphs face +y (baffle at +y); side glyphs face +x.
 *
 * Real sizes these are drawn from (mm):
 *  - nearfield 2-way monitor (6.5" woofer class): 210 W × 330 H × 280 D;
 *    woofer frame Ø165, basket depth ≈ 75, magnet Ø≈ 95 × 40; tweeter Ø25
 *    dome in a ≈ 100 mm waveguide; acoustic centre ≈ the tweeter.
 *  - main / mid-field 3-way monitor: 330 W × 450 H × 400 D; woofer frame Ø210.
 *  - 10" studio subwoofer: 380 W × 400 H × 380 D; woofer frame Ø254, front
 *    firing.
 *  - speaker stand: top plate 200 × 200, column Ø50–75, base plate 300 × 300.
 */
import { G, Line, Path, Rect } from 'react-native-svg';

const LID = '#2a2d34';
const LID_EDGE = '#5b5f6a';
const BAFFLE = '#0d0e11';
const HIDDEN = '#6b707c';
const HILITE = '#ffffff';

/** Woofer frame / basket / magnet as fractions of the cabinet, from the real
 *  sizes above (frame 165 of 210 W; basket 75 of 280 D; magnet 95 W × 40). */
const NEAR = { frame: 165 / 210, magnet: 95 / 210, basket: 75 / 280, magDepth: 40 / 280 };

/**
 * A monitor seen from ABOVE: the lid, the baffle along the front (+y) edge,
 * the woofer's basket and magnet as hidden lines behind the baffle, and the
 * power / signal leads leaving the rear panel. `w` × `d` in px.
 */
export function MonitorPlan({ w, d, stroke = LID_EDGE, strokeWidth = 1.2 }: { w: number; d: number; stroke?: string; strokeWidth?: number }) {
  const x0 = -w / 2;
  const y0 = -d / 2;
  const baffleD = Math.max(1.6, d * 0.075); // ≈ 20 mm front panel
  const yb = d / 2 - baffleD; // inner face of the baffle
  const fw = (w * NEAR.frame) / 2;
  const mw = (w * NEAR.magnet) / 2;
  const by = yb - d * NEAR.basket; // back of the basket
  const my = by - d * NEAR.magDepth; // back of the magnet
  const r = Math.min(w, d) * 0.07;
  return (
    <G>
      {/* contact shadow, light from the upper left */}
      <Rect x={x0 + w * 0.06} y={y0 + w * 0.06} width={w} height={d} rx={r} fill="#000" opacity={0.35} />
      {/* the lid */}
      <Rect x={x0} y={y0} width={w} height={d} rx={r} fill={LID} stroke={stroke} strokeWidth={strokeWidth} />
      {/* rim light on the back and left edges */}
      <Line x1={x0 + r} y1={y0 + 0.9} x2={-x0 - r} y2={y0 + 0.9} stroke={HILITE} strokeWidth={0.7} opacity={0.2} />
      <Line x1={x0 + 0.9} y1={y0 + r} x2={x0 + 0.9} y2={-y0 - r} stroke={HILITE} strokeWidth={0.6} opacity={0.12} />
      {/* the baffle (front panel) */}
      <Path d={`M${x0 + 0.6},${yb} L${-x0 - 0.6},${yb} L${-x0 - 0.6},${d / 2 - r * 0.6} Q${-x0 - 0.6},${d / 2 - 0.6} ${-x0 - r * 0.6},${d / 2 - 0.6} L${x0 + r * 0.6},${d / 2 - 0.6} Q${x0 + 0.6},${d / 2 - 0.6} ${x0 + 0.6},${d / 2 - r * 0.6} Z`} fill={BAFFLE} />
      {/* hidden lines: the woofer's basket narrowing to its magnet */}
      <Path
        d={`M${-fw},${yb} L${-mw},${by} L${-mw},${my} L${mw},${my} L${mw},${by} L${fw},${yb}`}
        fill="none"
        stroke={HIDDEN}
        strokeWidth={0.7}
        strokeDasharray="2 1.6"
        opacity={0.85}
      />
      {/* leads out of the rear panel (power + balanced input) */}
      <Path d={`M${-w * 0.14},${y0} q0,${-d * 0.18} ${-w * 0.1},${-d * 0.3} M${w * 0.06},${y0} q0,${-d * 0.2} ${w * 0.12},${-d * 0.32}`} fill="none" stroke="#14151a" strokeWidth={Math.max(1, w * 0.045)} strokeLinecap="round" opacity={0.9} />
    </G>
  );
}

/** A front-firing subwoofer from ABOVE: a square lid, the baffle at +y, the
 *  10" woofer and its magnet as hidden lines. `s` = cabinet width in px. */
export function SubPlan({ s, stroke = LID_EDGE, strokeWidth = 1.2 }: { s: number; stroke?: string; strokeWidth?: number }) {
  const h = s / 2;
  const baffleD = Math.max(2, s * 0.065);
  const yb = h - baffleD;
  const fw = (s * (254 / 380)) / 2;
  const mw = (s * (120 / 380)) / 2;
  const by = yb - s * (110 / 380);
  const my = by - s * (55 / 380);
  const r = s * 0.05;
  return (
    <G>
      <Rect x={-h + s * 0.05} y={-h + s * 0.05} width={s} height={s} rx={r} fill="#000" opacity={0.35} />
      <Rect x={-h} y={-h} width={s} height={s} rx={r} fill={LID} stroke={stroke} strokeWidth={strokeWidth} />
      <Line x1={-h + r} y1={-h + 0.9} x2={h - r} y2={-h + 0.9} stroke={HILITE} strokeWidth={0.7} opacity={0.2} />
      <Line x1={-h + 0.9} y1={-h + r} x2={-h + 0.9} y2={h - r} stroke={HILITE} strokeWidth={0.6} opacity={0.12} />
      <Rect x={-h + 0.6} y={yb} width={s - 1.2} height={baffleD - 0.6} fill={BAFFLE} />
      <Path d={`M${-fw},${yb} L${-mw},${by} L${-mw},${my} L${mw},${my} L${mw},${by} L${fw},${yb}`} fill="none" stroke={HIDDEN} strokeWidth={0.7} strokeDasharray="2 1.6" opacity={0.85} />
      {/* rear amplifier plate */}
      <Rect x={-h * 0.62} y={-h + 0.6} width={h * 1.24} height={Math.max(1.2, s * 0.03)} fill="#17181d" />
      <Path d={`M${-s * 0.08},${-h} q0,${-s * 0.12} ${-s * 0.08},${-s * 0.2}`} fill="none" stroke="#14151a" strokeWidth={Math.max(1, s * 0.03)} strokeLinecap="round" opacity={0.9} />
    </G>
  );
}

/**
 * A monitor seen from the SIDE, facing +x: the side panel (depth × height),
 * the baffle edge on the +x side, the drivers' baskets as hidden lines, the
 * tweeter's axis marked at (0, 0) — the acoustic centre the room model uses.
 * The cabinet spans y ∈ [−0.27 h, 0.73 h]: the tweeter sits ≈ 90 mm below
 * the top of a 330 mm box, the woofer centre ≈ 205 mm below it.
 */
export function MonitorSide({ dpx, hpx, stroke = LID_EDGE, strokeWidth = 1.2 }: { dpx: number; hpx: number; stroke?: string; strokeWidth?: number }) {
  const x0 = -dpx / 2;
  const top = -hpx * 0.27;
  const baffleD = Math.max(1.6, dpx * 0.075);
  const xb = dpx / 2 - baffleD;
  const r = Math.min(dpx, hpx) * 0.06;
  // woofer centre ≈ 0.62 h below the top on a 330 mm box (tweeter at 0.27 h)
  const wy = top + hpx * 0.62;
  const fw = (hpx * (165 / 330)) / 2;
  const mw = (hpx * (95 / 330)) / 2;
  const bx = xb - dpx * NEAR.basket;
  const mx = bx - dpx * NEAR.magDepth;
  return (
    <G>
      <Rect x={x0} y={top} width={dpx} height={hpx} rx={r} fill={LID} stroke={stroke} strokeWidth={strokeWidth} />
      <Line x1={x0 + r} y1={top + 0.9} x2={-x0 - r} y2={top + 0.9} stroke={HILITE} strokeWidth={0.7} opacity={0.2} />
      <Rect x={xb} y={top + 0.6} width={baffleD - 0.6} height={hpx - 1.2} fill={BAFFLE} />
      {/* hidden lines: woofer basket + magnet, tweeter chamber */}
      <Path d={`M${xb},${wy - fw} L${bx},${wy - mw} L${mx},${wy - mw} L${mx},${wy + mw} L${bx},${wy + mw} L${xb},${wy + fw}`} fill="none" stroke={HIDDEN} strokeWidth={0.7} strokeDasharray="2 1.6" opacity={0.85} />
      <Path d={`M${xb},${-hpx * 0.06} L${xb - dpx * 0.12},${-hpx * 0.045} L${xb - dpx * 0.12},${hpx * 0.045} L${xb},${hpx * 0.06}`} fill="none" stroke={HIDDEN} strokeWidth={0.7} strokeDasharray="2 1.6" opacity={0.85} />
      {/* the tweeter axis tick on the baffle */}
      <Line x1={dpx / 2} y1={0} x2={dpx / 2 + Math.max(2.5, dpx * 0.12)} y2={0} stroke={stroke} strokeWidth={1} />
    </G>
  );
}

/** A speaker stand in elevation under a cabinet whose bottom is at y = 0:
 *  top plate, column, base plate down to the floor at y = `floor` (px). */
export function StandSide({ wpx, floor }: { wpx: number; floor: number }) {
  if (floor <= 2) return null;
  const plate = Math.max(1.4, wpx * 0.06);
  const col = Math.max(2, wpx * 0.24);
  const base = wpx * 1.3;
  return (
    <G>
      <Rect x={-wpx * 0.48} y={0} width={wpx * 0.96} height={plate} fill="#3a3d45" />
      <Rect x={-col / 2} y={plate} width={col} height={Math.max(0, floor - plate * 2)} fill="#2a2c33" stroke="#4a4e58" strokeWidth={0.6} />
      <Line x1={-col / 2 + 0.6} y1={plate} x2={-col / 2 + 0.6} y2={floor - plate} stroke={HILITE} strokeWidth={0.5} opacity={0.15} />
      <Rect x={-base / 2} y={floor - plate} width={base} height={plate} rx={0.6} fill="#3a3d45" />
    </G>
  );
}

/** A front-firing sub from the SIDE, facing +x, centred on (0, 0): side
 *  panel, baffle edge, hidden woofer, two short feet. `s` = height px. */
export function SubSide({ s, stroke = LID_EDGE, strokeWidth = 1.2 }: { s: number; stroke?: string; strokeWidth?: number }) {
  const d = s * (380 / 400);
  const h = s;
  const x0 = -d / 2;
  const y0 = -h / 2;
  const baffleD = Math.max(2, d * 0.065);
  const xb = d / 2 - baffleD;
  const fw = (h * (254 / 400)) / 2;
  const mw = (h * (120 / 400)) / 2;
  const bx = xb - d * (110 / 380);
  const mx = bx - d * (55 / 380);
  const r = s * 0.05;
  return (
    <G>
      <Rect x={x0} y={y0} width={d} height={h} rx={r} fill={LID} stroke={stroke} strokeWidth={strokeWidth} />
      <Line x1={x0 + r} y1={y0 + 0.9} x2={-x0 - r} y2={y0 + 0.9} stroke={HILITE} strokeWidth={0.7} opacity={0.2} />
      <Rect x={xb} y={y0 + 0.6} width={baffleD - 0.6} height={h - 1.2} fill={BAFFLE} />
      <Path d={`M${xb},${-fw} L${bx},${-mw} L${mx},${-mw} L${mx},${mw} L${bx},${mw} L${xb},${fw}`} fill="none" stroke={HIDDEN} strokeWidth={0.7} strokeDasharray="2 1.6" opacity={0.85} />
    </G>
  );
}

/**
 * Desk furniture from ABOVE, inside a desk top at (x, y) of w × d px with
 * k px per metre: computer displays near the back edge (the −y side, toward
 * the front wall) with their stand feet, a keyboard and a mouse near the
 * listener's edge. Real sizes: 27" display panel 615 × 55, stand foot
 * 250 × 200; keyboard 440 × 135; mouse 65 × 115 (mm).
 */
export function DeskTopItems({ x, y, w, d, k, stroke }: { x: number; y: number; w: number; d: number; k: number; stroke: string }) {
  const cx = x + w / 2;
  const panelW = 0.615 * k;
  const panelD = Math.max(1.2, 0.055 * k);
  const footW = 0.25 * k;
  const footD = 0.2 * k;
  const backY = y + Math.min(d * 0.32, 0.24 * k); // panel line, ~ 24 cm off the back edge
  const two = w >= 1.3 * k;
  // the outer ends angle FORWARD, wrapping toward the listener
  const displays = two ? [{ dx: -0.33 * k, rot: -9 }, { dx: 0.33 * k, rot: 9 }] : [{ dx: 0, rot: 0 }];
  const kbW = 0.44 * k;
  const kbD = 0.135 * k;
  const kbY = y + d - kbD - Math.min(0.08 * k, d * 0.12);
  const kbX = cx - kbW / 2 - 0.04 * k;
  return (
    <G>
      {displays.map((m, i) => (
        <G key={i} transform={`translate(${cx + m.dx},${backY}) rotate(${m.rot})`}>
          {/* stand foot, partly under the panel */}
          <Rect x={-footW / 2} y={-footD * 0.55} width={footW} height={footD} rx={footD * 0.18} fill="#24262d" stroke={stroke} strokeWidth={0.6} />
          {/* stand neck */}
          <Rect x={-footW * 0.16} y={-footD * 0.45} width={footW * 0.32} height={footD * 0.42} fill="#30333b" />
          {/* the panel — screen side toward the listener (+y) */}
          <Rect x={-panelW / 2} y={0} width={panelW} height={panelD} rx={panelD * 0.3} fill="#121318" stroke={stroke} strokeWidth={0.7} />
          <Line x1={-panelW / 2 + 1} y1={panelD} x2={panelW / 2 - 1} y2={panelD} stroke="#6fa8ff" strokeWidth={0.8} opacity={0.45} />
        </G>
      ))}
      {/* keyboard: case + four key rows */}
      <Rect x={kbX} y={kbY} width={kbW} height={kbD} rx={kbD * 0.12} fill="#26282f" stroke={stroke} strokeWidth={0.6} />
      {[0.25, 0.45, 0.65, 0.85].map((f) => (
        <Line key={f} x1={kbX + kbW * 0.05} y1={kbY + kbD * f} x2={kbX + kbW * 0.95} y2={kbY + kbD * f} stroke="#4a4e58" strokeWidth={Math.max(0.5, kbD * 0.1)} strokeDasharray={`${Math.max(1, kbW * 0.03)} ${Math.max(0.5, kbW * 0.008)}`} opacity={0.8} />
      ))}
      {/* mouse */}
      <Rect x={kbX + kbW + 0.07 * k} y={kbY + kbD * 0.05} width={0.065 * k} height={0.115 * k} rx={0.032 * k} fill="#26282f" stroke={stroke} strokeWidth={0.6} />
    </G>
  );
}
