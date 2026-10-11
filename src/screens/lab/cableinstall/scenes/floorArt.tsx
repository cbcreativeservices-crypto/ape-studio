/**
 * STAGE 9 — the three PLANS and their furniture (owner 2026-09-26 art pass:
 * the plans were outline rectangles with default-serif labels, a circle for a
 * mic stand and a trapezoid outline for a wedge).
 *
 * Top views, drawn as the objects are seen from above: a timber stage deck
 * (plank joints), tripod mic stands with their booms, wedge monitors with
 * grilles, a stage box with its XLR panel, a monitor console, theatre seating
 * rows of chairs, a FOH riser with the desk, a roll-up dock door with
 * hazard-striped load-in lane edges, a forklift, road cases with corner
 * hardware and handles, a distro with its outlets, cable ramps and a
 * vehicle-rated protector (yellow lids, black ramps). Labels use the lab's
 * fonts (Oswald) — the plans used the browser's default serif before.
 */
import { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Callout, useUid } from '../svgArt';
import { HeadIconSvg } from '../../../../features/lab/headIconsSvg';

export const PLAN_LABEL = '#8d9199';

/** A label in the lab's type (no pill). */
export function PlanLabel({ x, y, text, anchor = 'middle', color = PLAN_LABEL, size = 10.5 }: { x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end'; color?: string; size?: number }) {
  return <Callout x={x} y={y} text={text} anchor={anchor} size={size} color={color} bg={null} />;
}

/** Timber stage deck, plank joints running across; `grid` draws the plot's
 *  1 m grid (units per metre) the way a CAD stage plot carries one. */
export function StageDeck({ x, y, w, h, grid }: { x: number; y: number; w: number; h: number; grid?: number }) {
  const id = useUid();
  const joints: string[] = [];
  for (let yy = y + 9; yy < y + h; yy += 9) joints.push(`M${x + 1} ${yy} H${x + w - 1}`);
  const butts: string[] = [];
  let r = 0;
  for (let yy = y; yy < y + h - 1; yy += 9) {
    for (let xx = x + ((r % 3) * 40 + 30); xx < x + w; xx += 120) butts.push(`M${xx} ${yy} v9`);
    r++;
  }
  const g: string[] = [];
  if (grid) {
    for (let xx = x + grid; xx < x + w - 1; xx += grid) g.push(`M${xx} ${y + 1} V${y + h - 1}`);
    for (let yy = y + grid; yy < y + h - 1; yy += grid) g.push(`M${x + 1} ${yy} H${x + w - 1}`);
  }
  return (
    <G>
      <Defs>
        <LinearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2a241d" />
          <Stop offset="1" stopColor="#1f1a15" />
        </LinearGradient>
      </Defs>
      <Rect x={x} y={y} width={w} height={h} rx={4} fill={`url(#${id}d)`} stroke="#0d0b09" strokeWidth={0.8} />
      <Path d={joints.join('')} stroke="#171310" strokeWidth={0.5} opacity={0.55} />
      <Path d={butts.join('')} stroke="#171310" strokeWidth={0.45} opacity={0.55} />
      {g.length ? <Path d={g.join('')} stroke="rgba(255,255,255,0.12)" strokeWidth={0.5} /> : null}
    </G>
  );
}

/** A dimension line with end ticks and its text (plot convention). */
export function DimLine({ x1, y1, x2, y2, text }: { x1: number; y1: number; x2: number; y2: number; text: string }) {
  const vert = x1 === x2;
  const tick = 3;
  return (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={PLAN_LABEL} strokeWidth={0.7} />
      {vert ? (
        <Path d={`M${x1 - tick} ${y1} h${2 * tick} M${x2 - tick} ${y2} h${2 * tick}`} stroke={PLAN_LABEL} strokeWidth={0.7} />
      ) : (
        <Path d={`M${x1} ${y1 - tick} v${2 * tick} M${x2} ${y2 - tick} v${2 * tick}`} stroke={PLAN_LABEL} strokeWidth={0.7} />
      )}
      {vert ? (
        <G transform={`rotate(-90 ${x1 - 4} ${(y1 + y2) / 2})`}>
          <PlanLabel x={x1 - 4} y={(y1 + y2) / 2 + 3.4} text={text} size={9.6} />
        </G>
      ) : (
        <PlanLabel x={(x1 + x2) / 2} y={y1 - 2.2} text={text} size={9.6} />
      )}
    </G>
  );
}

/** A drum kit on its riser, from above: kick, snare, toms, hats, cymbals,
 *  the throne — the plot iconography every production manager reads. */
export function DrumKitTop({ x, y }: { x: number; y: number }) {
  const drum = (cx: number, cy: number, r: number, cymbal = false) => (
    <G key={`${cx}-${cy}`}>
      <Circle cx={cx + 0.6} cy={cy + 0.8} r={r} fill="rgba(0,0,0,0.45)" />
      <Circle cx={cx} cy={cy} r={r} fill={cymbal ? '#8a7a3a' : '#c9c6bc'} stroke={cymbal ? '#4a3f18' : '#4a4a46'} strokeWidth={0.6} />
      {cymbal ? <Circle cx={cx} cy={cy} r={r * 0.35} fill="none" stroke="#4a3f18" strokeWidth={0.4} /> : <Circle cx={cx} cy={cy} r={r * 0.78} fill="none" stroke="#8d8a80" strokeWidth={0.35} />}
    </G>
  );
  return (
    <G>
      {drum(x, y + 2, 7.4)}
      {drum(x - 9, y - 6, 4.2)}
      {drum(x - 3.5, y - 9.5, 3.6)}
      {drum(x + 4, y - 9.5, 3.8)}
      {drum(x + 11, y - 1, 4.8)}
      {drum(x - 15, y - 12, 4.6, true)}
      {drum(x - 11, y - 18, 5.4, true)}
      {drum(x + 12, y - 15, 6, true)}
      <Circle cx={x} cy={y + 15} r={3.2} fill="#2a2c31" stroke="#0a0a0c" strokeWidth={0.5} />
    </G>
  );
}

/** A riser (platform) outline with its step, from above. */
export function RiserTop({ x, y, w, h, step = 'bottom' }: { x: number; y: number; w: number; h: number; step?: 'bottom' | 'right' }) {
  return (
    <G>
      <Rect x={x + 1} y={y + 1.4} width={w} height={h} rx={1} fill="rgba(0,0,0,0.5)" />
      <Rect x={x} y={y} width={w} height={h} rx={1} fill="#332b22" stroke="#0d0b09" strokeWidth={0.8} />
      <Path d={`M${x + 1} ${y + 1} H${x + w - 1}`} stroke="rgba(255,255,255,0.1)" strokeWidth={0.6} />
      {step === 'bottom' ? (
        <Rect x={x + w / 2 - 8} y={y + h - 0.5} width={16} height={4} rx={0.6} fill="#2a241d" stroke="#0d0b09" strokeWidth={0.6} />
      ) : (
        <Rect x={x + w - 0.5} y={y + h / 2 - 8} width={4} height={16} rx={0.6} fill="#2a241d" stroke="#0d0b09" strokeWidth={0.6} />
      )}
    </G>
  );
}

/** A keyboard on its stand, from above. */
export function KeysTop({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const keys: string[] = [];
  for (let xx = x + 2; xx < x + w - 1; xx += 1.8) keys.push(`M${xx} ${y + h - 1.5} v-${h * 0.45}`);
  return (
    <G>
      <Rect x={x + 0.8} y={y + 1.2} width={w} height={h} rx={1} fill="rgba(0,0,0,0.45)" />
      <Rect x={x} y={y} width={w} height={h} rx={1} fill="#1d1f24" stroke="#0a0a0c" strokeWidth={0.6} />
      <Rect x={x + 1.5} y={y + h * 0.5} width={w - 3} height={h * 0.5 - 1.5} fill="#e8e6dd" />
      <Path d={keys.join('')} stroke="#2a2c31" strokeWidth={0.35} />
    </G>
  );
}

/** A guitar combo amp from above (the grille faces downstage). */
export function GtrAmpTop({ x, y, w = 22, h = 12 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <G>
      <Rect x={x + 0.8} y={y + 1.2} width={w} height={h} rx={1.2} fill="rgba(0,0,0,0.45)" />
      <Rect x={x} y={y} width={w} height={h} rx={1.2} fill="#26221c" stroke="#0a0a0c" strokeWidth={0.6} />
      <Rect x={x + 2} y={y + h - 3} width={w - 4} height={2} rx={0.5} fill="#6d5a3c" />
      <Rect x={x + w / 2 - 5} y={y + 1.2} width={10} height={1.6} rx={0.8} fill="#0b0b0d" />
    </G>
  );
}

/** A DI box from above: the small steel box with its jacks. */
export function DiBoxTop({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x - 4} y={y - 2.6} width={8} height={5.2} rx={0.6} fill="#2a2c31" stroke="#0a0a0c" strokeWidth={0.5} />
      <Circle cx={x - 2} cy={y} r={0.9} fill="#050506" stroke="#8d9199" strokeWidth={0.3} />
      <Circle cx={x + 2} cy={y} r={0.9} fill="#050506" stroke="#8d9199" strokeWidth={0.3} />
    </G>
  );
}

/** The snake head (stage box) from above: the steel box, two rows of XLR
 *  inputs, the trunk leaving toward FOH. */
export function SnakeHeadTop({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x + 1} y={y + 1.4} width={24} height={14} rx={1.4} fill="rgba(0,0,0,0.5)" />
      <Rect x={x} y={y} width={24} height={14} rx={1.4} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.6} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Circle key={i} cx={x + 3 + i * 3.6} cy={y + 4.2} r={1.25} fill="#050506" stroke="#8d9199" strokeWidth={0.3} />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Circle key={`b${i}`} cx={x + 3 + i * 3.6} cy={y + 9.8} r={1.25} fill="#050506" stroke="#8d9199" strokeWidth={0.3} />
      ))}
    </G>
  );
}

/** A tripod mic stand from above: three legs, the pole, the boom to the mic. */
export function MicStandTop({ x, y, boom = 0, reach = 12 }: { x: number; y: number; boom?: number; reach?: number }) {
  const a = (boom * Math.PI) / 180;
  const mx = x + Math.sin(a) * reach;
  const my = y - Math.cos(a) * reach;
  return (
    <G>
      {/* one leg under the boom (so the stand can't tip toward the singer),
          the other two at ±120° */}
      {[boom - 90, boom + 30, boom + 150].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return <Line key={deg} x1={x} y1={y} x2={x + Math.cos(r) * 8} y2={y + Math.sin(r) * 8} stroke="#6d7179" strokeWidth={1.3} strokeLinecap="round" />;
      })}
      <Circle cx={x} cy={y} r={2} fill="#2a2c31" stroke="#9aa0a8" strokeWidth={0.6} />
      <Line x1={x} y1={y} x2={mx} y2={my} stroke="#9aa0a8" strokeWidth={1} />
      <G transform={`rotate(${boom} ${mx} ${my})`}>
        <Rect x={mx - 1.7} y={my - 5} width={3.4} height={7} rx={1.6} fill="#1b1c20" stroke="#8d9199" strokeWidth={0.5} />
        <Rect x={mx - 1.9} y={my - 6.4} width={3.8} height={3.2} rx={1.6} fill="#3a3c42" stroke="#8d9199" strokeWidth={0.5} />
      </G>
    </G>
  );
}

/** A performer's position from above, facing downstage (the audience) —
 *  the way a plot marks where a singer stands: the owner's ABOVE head icon,
 *  a lone head marker, its face toward the house (+y). Head fix 2026-10-08:
 *  a head on its own is the shared icon, never a circle. Drawn over
 *  life size (0.4 m crown→chin, ~1.7× a real head) so it reads on the plot. */
export function PerformerTop({ x, y, m }: { x: number; y: number; m: number }) {
  return <HeadIconSvg view="above" x={x} y={y} size={0.4 * m} color="#b4bac6" plate minStroke={1} />;
}

/**
 * A 2-way floor wedge (12" + 1") from above, at true size on the plot's
 * 32 units/m: 600 mm wide × 420 mm deep (owner 2026-10-10: a stage wedge,
 * not a guitar amp). The baffle slopes up toward the performer at ~45°, so
 * from above it fills the FRONT ~70 % of the footprint, foreshortened (×0.7):
 * the 12" woofer reads as an ellipse, the HF horn's rectangular mouth sits
 * above it on the high side, all behind a grille with its edge frame. The
 * flat top panel is the rear strip; the input panel is recessed into the
 * rear edge (WEDGE_JACK_DX/DY from the centre), where the feed lands. Handle
 * recesses on both sides. The front faces −y (upstage, at the performer);
 * `angle` toes it in toward its performer's mic.
 */
export const WEDGE_W = 19.2;
export const WEDGE_D = 13.4;
/** The rear input connector, relative to the wedge centre (angle 0). */
export const WEDGE_JACK_DX = 6;
export const WEDGE_JACK_DY = 5.3;
export function WedgeTop({ x, y, angle = 0 }: { x: number; y: number; angle?: number }) {
  const w = WEDGE_W;
  const h = WEDGE_D;
  const x0 = x - w / 2;
  const y0 = y - h / 2;
  const top = y0 + h * 0.7; // baffle (front) | top panel (rear)
  const jx = x + WEDGE_JACK_DX;
  const jy = y + WEDGE_JACK_DY;
  return (
    <G transform={`rotate(${angle} ${x} ${y})`}>
      <Rect x={x0 + 0.8} y={y0 + 1.2} width={w} height={h} rx={1.2} fill="rgba(0,0,0,0.5)" />
      {/* the cabinet, then the flat top panel at the back (catching light) */}
      <Rect x={x0} y={y0} width={w} height={h} rx={1.2} fill="#1d1f24" stroke="#0a0a0c" strokeWidth={0.6} />
      <Rect x={x0 + 0.5} y={top} width={w - 1} height={y0 + h - top - 0.5} rx={0.8} fill="#2e3138" />
      <Line x1={x0 + 1} y1={top + 0.3} x2={x0 + w - 1} y2={top + 0.3} stroke="#4a4e56" strokeWidth={0.5} />
      {/* the sloped baffle: grille with its edge frame */}
      <Rect x={x0 + 0.9} y={y0 + 0.7} width={w - 1.8} height={top - y0 - 1.1} rx={0.8} fill="#131418" stroke="#4d5159" strokeWidth={0.55} />
      <Path d={[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `M${x0 + 1.6} ${y0 + 1.3 + i * 0.95} H${x0 + w - 1.6}`).join('')} stroke="#1c1e23" strokeWidth={0.35} />
      {/* 12" woofer, foreshortened by the slope */}
      <Ellipse cx={x} cy={y0 + 3.9} rx={4.6} ry={3.1} fill="#0b0c0f" stroke="#3d4148" strokeWidth={0.45} />
      <Ellipse cx={x} cy={y0 + 3.9} rx={1.5} ry={1} fill="#24262c" />
      {/* the HF horn's rectangular mouth, above it on the high side */}
      <Rect x={x - 3.6} y={y0 + 7.2} width={7.2} height={1.9} rx={0.3} fill="#0b0c0f" stroke="#3d4148" strokeWidth={0.4} />
      <Path d={`M${x - 3.2} ${y0 + 7.5} L${x - 0.6} ${y0 + 8.15} M${x + 3.2} ${y0 + 7.5} L${x + 0.6} ${y0 + 8.15}`} stroke="#2a2c31" strokeWidth={0.3} />
      {/* handle recesses in both side panels */}
      <Rect x={x0 - 0.1} y={y - 1.4} width={1} height={3.4} rx={0.4} fill="#050506" />
      <Rect x={x0 + w - 0.9} y={y - 1.4} width={1} height={3.4} rx={0.4} fill="#050506" />
      {/* the recessed rear input panel and its connector */}
      <Rect x={jx - 2.4} y={jy - 1.4} width={4.8} height={2.9} rx={0.4} fill="#0d0e11" stroke="#4a4e56" strokeWidth={0.35} />
      <Circle cx={jx} cy={jy} r={0.95} fill="#050506" stroke="#8d9199" strokeWidth={0.3} />
    </G>
  );
}

/** A stage box from above: the steel box with its connector panel. */
export function StageBoxTop({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x} y={y} width={18} height={12} rx={1.4} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.6} />
      {[0, 1, 2, 3].map((i) => (
        <Circle key={i} cx={x + 3.4 + i * 3.8} cy={y + 4} r={1.3} fill="#050506" stroke="#8d9199" strokeWidth={0.3} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Circle key={`b${i}`} cx={x + 3.4 + i * 3.8} cy={y + 8.4} r={1.3} fill="#050506" stroke="#8d9199" strokeWidth={0.3} />
      ))}
    </G>
  );
}

/** A small mixing console on its desk (monitor world / FOH), from above. */
export function ConsoleTop({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const strips: string[] = [];
  for (let xx = x + 3; xx < x + w - 3; xx += 2.4) strips.push(`M${xx} ${y + 3} v${h - 8}`);
  return (
    <G>
      <Rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx={1.4} fill="#141518" stroke="#2c2e34" strokeWidth={0.6} />
      <Rect x={x} y={y} width={w} height={h} rx={1.2} fill="#2a2c31" stroke="#0a0a0c" strokeWidth={0.5} />
      <Path d={strips.join('')} stroke="#1a1b1f" strokeWidth={0.7} />
      <Rect x={x + 2} y={y + h - 4} width={w - 4} height={2} fill="#37d97b" opacity={0.25} />
    </G>
  );
}

/** A row of theatre chairs from above. */
export function SeatRow({ x0, x1, y }: { x0: number; x1: number; y: number }) {
  const out = [];
  for (let x = x0; x + 9 <= x1; x += 10) out.push(x);
  return (
    <G>
      {out.map((x) => (
        <G key={x}>
          <Rect x={x} y={y - 3.4} width={9} height={6.8} rx={1.8} fill="#23252a" stroke="#0e0f12" strokeWidth={0.4} />
          <Rect x={x + 0.8} y={y + 1.6} width={7.4} height={1.6} rx={0.8} fill="#34363c" />
        </G>
      ))}
    </G>
  );
}

/** A cable ramp segment from above (yellow lid, black ramps, direction ribs). */
export function RampTop({ x, y, w, h, vertical = false }: { x: number; y: number; w: number; h: number; vertical?: boolean }) {
  const ribs: string[] = [];
  if (vertical) for (let yy = y + 2; yy < y + h; yy += 3) ribs.push(`M${x + 1} ${yy} H${x + w * 0.22} M${x + w * 0.78} ${yy} H${x + w - 1}`);
  else for (let xx = x + 2; xx < x + w; xx += 3) ribs.push(`M${xx} ${y + 1} V${y + h * 0.22} M${xx} ${y + h * 0.78} V${y + h - 1}`);
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={1.2} fill="#1b1c20" stroke="#050506" strokeWidth={0.5} />
      <Path d={ribs.join('')} stroke="#34363c" strokeWidth={0.6} />
      {vertical ? (
        <Rect x={x + w * 0.26} y={y + 0.6} width={w * 0.48} height={h - 1.2} rx={0.8} fill="#e3b73a" stroke="#6b5520" strokeWidth={0.4} />
      ) : (
        <Rect x={x + 0.6} y={y + h * 0.26} width={w - 1.2} height={h * 0.48} rx={0.8} fill="#e3b73a" stroke="#6b5520" strokeWidth={0.4} />
      )}
    </G>
  );
}

/** Gaffer tape strip across a floor cable (dressing it to the edge). */
export function TapeStrip({ x, y, angle = 90, len = 9 }: { x: number; y: number; angle?: number; len?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Rect x={-len / 2} y={-2} width={len} height={4} rx={0.4} fill="#4a4d54" opacity={0.95} />
      <Path d={`M${-len / 2} -2 l0.8 1 l-0.8 1 l0.8 1 l-0.8 1 M${len / 2} -2 l-0.8 1 l0.8 1 l-0.8 1 l0.8 1`} stroke="#2a2c31" strokeWidth={0.4} fill="none" />
    </G>
  );
}

/** A roll-up dock door (top of the backstage plan). */
export function DockDoor({ x, w }: { x: number; w: number }) {
  return (
    <G>
      <Rect x={x} y={2} width={w} height={8} fill="#3a3c42" />
      <Path d={[1, 2, 3].map((i) => `M${x} ${2 + i * 2} H${x + w}`).join('')} stroke="#23252a" strokeWidth={0.6} />
    </G>
  );
}

/** Hazard striping along an edge (yellow / black). */
export function HazardEdge({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e3b73a" strokeWidth={2.4} />
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#141518" strokeWidth={2.4} strokeDasharray="3 3" />
    </G>
  );
}

/** A counterbalance forklift from above, forks leading. */
export function ForkliftTop({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x} y={y} width={22} height={12} rx={2.4} fill="#c9a52c" stroke="#3b3212" strokeWidth={0.6} />
      <Rect x={x + 4} y={y + 2.4} width={9} height={7.2} rx={1.2} fill="#1b1c20" />
      <Rect x={x + 22} y={y + 1.6} width={2} height={8.8} fill="#3a3c42" />
      <Rect x={x + 24} y={y + 2.2} width={9} height={1.6} fill="#6d7179" />
      <Rect x={x + 24} y={y + 8.2} width={9} height={1.6} fill="#6d7179" />
      {[
        [x + 3, y - 1.4],
        [x + 15, y - 1.4],
        [x + 3, y + 11.6],
        [x + 15, y + 11.6],
      ].map(([cx, cy], i) => (
        <Rect key={i} x={cx} y={cy} width={5} height={1.8} rx={0.6} fill="#0b0b0d" />
      ))}
    </G>
  );
}

/** A road case from above: laminate lid, corner caps, recessed handles. */
export function RoadCaseTop({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={1.4} fill="#1b1c20" stroke="#0a0a0c" strokeWidth={0.6} />
      <Rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} fill="#23252a" stroke="#3a3c42" strokeWidth={0.4} />
      {[
        [x, y],
        [x + w - 4, y],
        [x, y + h - 4],
        [x + w - 4, y + h - 4],
      ].map(([cx, cy], i) => (
        <Rect key={i} x={cx} y={cy} width={4} height={4} rx={0.8} fill="#9aa0a8" />
      ))}
      <Rect x={x + w / 2 - 5} y={y + h / 2 - 1.4} width={10} height={2.8} rx={1.2} fill="#0b0b0d" stroke="#6d7179" strokeWidth={0.4} />
    </G>
  );
}

/** A power distro from above with its outlets and feeder tails. */
export function DistroTop({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x} y={y} width={32} height={22} rx={1.6} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.6} />
      {[0, 1, 2].map((i) => (
        <Rect key={i} x={x + 3 + i * 9.5} y={y + 4} width={7} height={6} rx={1} fill="#101114" stroke="#c8372b" strokeWidth={0.5} />
      ))}
      {[0, 1, 2].map((i) => (
        <Circle key={`b${i}`} cx={x + 6.5 + i * 9.5} cy={y + 16} r={2.2} fill="#101114" stroke="#8d9199" strokeWidth={0.5} />
      ))}
    </G>
  );
}

/** A rigging point (rated) from above: a plate with a shackle. */
export function RigPointTop({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <G>
      <Rect x={x - 3.4} y={y - 3.4} width={6.8} height={6.8} rx={0.8} fill="#26282d" stroke={color} strokeWidth={0.9} />
      <Circle cx={x} cy={y} r={1.6} fill="none" stroke="#c3c8cf" strokeWidth={0.8} />
    </G>
  );
}

/** A 2 m scale bar for the stage plan. */
export function PlanScale({ x, y, m }: { x: number; y: number; m: number }) {
  return (
    <G>
      <Line x1={x} y1={y} x2={x + 2 * m} y2={y} stroke={PLAN_LABEL} strokeWidth={0.8} />
      <Path d={`M${x} ${y - 2.4} v4.8 M${x + m} ${y - 1.6} v3.2 M${x + 2 * m} ${y - 2.4} v4.8`} stroke={PLAN_LABEL} strokeWidth={0.8} />
      <PlanLabel x={x + 2 * m + 4} y={y + 3.4} text="2 m" anchor="start" size={9.5} />
    </G>
  );
}
