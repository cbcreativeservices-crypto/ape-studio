/**
 * STAGE 6 — the rack's HARDWARE, drawn (owner 2026-09-26 art pass: the rack
 * was grey rounded rectangles with circle "jacks" and 3-px line "cables").
 *
 * Rear view of a 19-inch rack at ≈ 0.495 units per mm, so 1U (44.45 mm) is
 * 22 units — the rails carry real EIA square holes on that pitch, and every
 * connector is at its real size: D-series XLR flanges (26 × 31 mm), RJ45
 * keystones, NL4 speaker jacks, IEC C14 inlets and C13 outlets, a fan grille.
 * The band geometry (y ranges) is the scene's own — hit regions, defects and
 * loom routes are anchored to it — so every part here draws INSIDE the band
 * the old placeholder occupied.
 *
 * Paints are per-SVG-root (useUid) and handed down through RackPaintCtx: two
 * racks can be on screen at once (the Phase-C BEFORE strip) and a duplicate
 * gradient id would resolve to the wrong root.
 */
import { createContext, useContext, type ReactNode } from 'react';
import { Circle, Defs, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Callout, PanelJack, RackRail, Screw, VentField } from '../svgArt';

/** units per millimetre in the rack drawing (1U = 22 units). */
export const RK = 22 / 44.45;

type Paint = { face: string; faceHi: string; mgr: string; zinc: string; jack: string };
const RackPaintCtx = createContext<Paint>({ face: '#1c1d22', faceHi: '#1c1d22', mgr: '#141419', zinc: '#80868f', jack: '#0b0b0d' });

export function RackPaints({ uid, children }: { uid: string; children: ReactNode }) {
  const p: Paint = { face: `url(#${uid}f)`, faceHi: `url(#${uid}h)`, mgr: `url(#${uid}m)`, zinc: `url(#${uid}z)`, jack: `url(#${uid}j)` };
  return (
    <RackPaintCtx.Provider value={p}>
      <Defs>
        <LinearGradient id={`${uid}f`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2c2e34" />
          <Stop offset="0.12" stopColor="#23252a" />
          <Stop offset="1" stopColor="#17181c" />
        </LinearGradient>
        <LinearGradient id={`${uid}h`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#34363d" />
          <Stop offset="1" stopColor="#1f2025" />
        </LinearGradient>
        <LinearGradient id={`${uid}m`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#0f1013" />
          <Stop offset="0.5" stopColor="#17181c" />
          <Stop offset="1" stopColor="#0f1013" />
        </LinearGradient>
        <LinearGradient id={`${uid}z`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#d3d7dc" />
          <Stop offset="0.5" stopColor="#9ba1a8" />
          <Stop offset="1" stopColor="#5d636b" />
        </LinearGradient>
        <RadialGradient id={`${uid}j`} cx="40%" cy="35%" r="70%">
          <Stop offset="0" stopColor="#2a2c31" />
          <Stop offset="1" stopColor="#050506" />
        </RadialGradient>
      </Defs>
      {children}
    </RackPaintCtx.Provider>
  );
}

const usePaint = () => useContext(RackPaintCtx);

/** A device's rear panel inside its band: powder-coated face, top/bottom lips. */
export function DeviceFace({ y, h }: { y: number; h: number }) {
  const p = usePaint();
  return (
    <G>
      <Rect x={54} y={y} width={232} height={h} rx={1.2} fill={p.face} stroke="#0a0a0c" strokeWidth={0.6} />
      <Line x1={55} y1={y + 0.7} x2={285} y2={y + 0.7} stroke="rgba(255,255,255,0.12)" strokeWidth={0.6} />
      <Line x1={54} y1={y + h - 1.4} x2={286} y2={y + h - 1.4} stroke="rgba(0,0,0,0.5)" strokeWidth={0.6} />
    </G>
  );
}

/* ── the frame: rails, managers, top + bottom ─────────────────────────────── */

/** A vertical finger manager: back channel, finger columns on both edges. */
function VerticalManager({ x, w }: { x: number; w: number }) {
  const p = usePaint();
  const fingers: number[] = [];
  for (let y = 24; y < 402; y += 11) fingers.push(y);
  return (
    <G>
      <Rect x={x} y={20} width={w} height={386} rx={2} fill={p.mgr} stroke="#26272c" strokeWidth={0.6} />
      {fingers.map((y) => (
        <G key={y}>
          <Path d={`M${x} ${y} H${x + 6} Q${x + 8} ${y} ${x + 8} ${y + 2.4} Q${x + 8} ${y + 4.8} ${x + 6} ${y + 4.8} H${x} Z`} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.4} />
          <Path d={`M${x + w} ${y} H${x + w - 6} Q${x + w - 8} ${y} ${x + w - 8} ${y + 2.4} Q${x + w - 8} ${y + 4.8} ${x + w - 6} ${y + 4.8} H${x + w} Z`} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.4} />
        </G>
      ))}
    </G>
  );
}

export function RackFrame({ dress }: { dress: boolean }) {
  const p = usePaint();
  return (
    <G>
      <VerticalManager x={6} w={34} />
      <VerticalManager x={300} w={34} />
      <RackRail x={45} y0={20} y1={402} k={RK} uTop={19} />
      <RackRail x={287.1} y0={20} y1={402} k={RK} uTop={19} />
      <Rect x={44} y={402} width={252} height={9} rx={1.5} fill={p.faceHi} stroke="#0a0a0c" strokeWidth={0.6} />
      {/* top panel + the cable-entry slot; dressed = a brush-grommet edge */}
      <Rect x={44} y={6} width={252} height={14} rx={1.5} fill={p.faceHi} stroke="#0a0a0c" strokeWidth={0.6} />
      <Rect x={150} y={9} width={80} height={8} rx={2.5} fill="#050506" />
      {dress ? (
        <G>
          <Rect x={148.5} y={7.6} width={83} height={10.8} rx={3.4} fill="none" stroke="#3a3c42" strokeWidth={1.6} />
          <Path d={Array.from({ length: 38 }, (_, i) => `M${152 + i * 2} 9.2 v2.6 M${152 + i * 2} 17 v-2.6`).join('')} stroke="#3a3c42" strokeWidth={0.6} />
        </G>
      ) : null}
    </G>
  );
}

/* ── gear faces (all inside the scene's band geometry) ───────────────────── */

/** 2U patch panel: two rows of RJ45 keystones + the designation strip. */
export function PatchPanel({ xs, dress }: { xs: number[]; dress: boolean }) {
  return (
    <G>
      <DeviceFace y={46} h={40} />
      <Screw x={58.5} y={52} r={1.6} />
      <Screw x={281.5} y={52} r={1.6} />
      {xs.map((cx) => (
        <G key={cx}>
          {[54, 66].map((y) => (
            <G key={y}>
              <Rect x={cx - 4} y={y - 0.5} width={8} height={8} rx={0.8} fill="#e9e8e3" stroke="#8d8a80" strokeWidth={0.35} />
              <Rect x={cx - 2.9} y={y + 0.7} width={5.8} height={5.2} rx={0.4} fill="#050506" />
              <Rect x={cx - 1.2} y={y + 5.9} width={2.4} height={1} fill="#050506" />
              <Path d={`M${cx - 2.3} ${y + 1.3} v1.4 M${cx - 1.2} ${y + 1.3} v1.4 M${cx} ${y + 1.3} v1.4 M${cx + 1.2} ${y + 1.3} v1.4 M${cx + 2.3} ${y + 1.3} v1.4`} stroke="#c9a13c" strokeWidth={0.35} />
            </G>
          ))}
        </G>
      ))}
      {dress
        ? xs.map((cx) => (
            <G key={`lb${cx}`}>
              <Rect x={cx - 5} y={78} width={10} height={5.4} rx={0.6} fill="#eceae3" stroke="#8d8a80" strokeWidth={0.35} />
              <Path d={`M${cx - 3.4} 80 h4.6 M${cx - 3.4} 81.8 h6.4`} stroke="#23252a" strokeWidth={0.8} />
            </G>
          ))
        : null}
    </G>
  );
}

/** 1U horizontal finger manager. */
export function HorizontalManager({ xs }: { xs: number[] }) {
  const p = usePaint();
  return (
    <G>
      <Rect x={54} y={92} width={232} height={12} rx={1} fill={p.mgr} stroke="#0a0a0c" strokeWidth={0.6} />
      {xs.map((x) => (
        <Path key={x} d={`M${x - 3} 104 V95 Q${x - 3} 93 ${x} 93 Q${x + 3} 93 ${x + 3} 95 V104 Z`} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.4} />
      ))}
    </G>
  );
}

/** 1U network switch: RJ45 ports with link LEDs, an SFP cage. */
export function NetworkSwitch({ xs }: { xs: number[] }) {
  return (
    <G>
      <DeviceFace y={110} h={28} />
      {xs.map((x, i) => (
        <G key={x}>
          <Rect x={x} y={119} width={11} height={9} rx={0.6} fill="#050506" stroke="#6d737b" strokeWidth={0.45} />
          <Rect x={x + 3.8} y={127.2} width={3.4} height={1.6} fill="#050506" />
          <Path d={[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `M${x + 1.6 + k * 1.1} 119.8 v1.6`).join('')} stroke="#c9a13c" strokeWidth={0.3} />
          <Circle cx={x + 2.4} cy={115} r={1.1} fill={i % 3 === 0 ? '#37d97b' : '#1b2a20'} />
          <Circle cx={x + 8.6} cy={115} r={1.1} fill={i % 3 === 0 ? '#ffc64d' : '#2a2616'} />
        </G>
      ))}
      <Rect x={262} y={117} width={16} height={12} rx={0.8} fill="#050506" stroke="#9ba1a8" strokeWidth={0.6} />
      <Rect x={264} y={119} width={12} height={8} fill="#141518" />
    </G>
  );
}

/** DSP rear: eight XLR-female inputs on D-series flanges. */
export function DspInputs({ xs, dress }: { xs: number[]; dress: boolean }) {
  return (
    <G>
      <DeviceFace y={144} h={40} />
      {xs.map((cx, i) => (
        <G key={cx}>
          <PanelJack x={cx} y={162} k={RK} kind="xlrF" />
          {dress ? <Callout x={cx} y={182} text={String(i + 1)} size={9.5} color="#b9bdc6" bg={null} /> : null}
        </G>
      ))}
    </G>
  );
}

/** Audio interface: six combo XLR/TRS jacks + two XLR-male outputs. */
export function AudioInterface({ xs }: { xs: number[] }) {
  const p = usePaint();
  return (
    <G>
      <DeviceFace y={190} h={28} />
      {xs.map((cx) => (
        <G key={cx}>
          <Circle cx={cx} cy={204} r={5.2} fill={p.jack} stroke="#6e727a" strokeWidth={0.45} />
          <Circle cx={cx} cy={204} r={1.7} fill="#050506" stroke="#9ba1a8" strokeWidth={0.35} />
          <Rect x={cx - 0.9} y={198.8} width={1.8} height={1.4} fill="#050506" />
        </G>
      ))}
      {[244, 268].map((cx) => (
        <PanelJack key={cx} x={cx} y={204} k={RK * 0.86} kind="xlrM" />
      ))}
    </G>
  );
}

/** A blank filler panel of `h` units at `y`. */
export function BlankPanel({ y, h }: { y: number; h: number }) {
  return (
    <G>
      <DeviceFace y={y} h={h} />
      <Screw x={60} y={y + h / 2} r={1.7} />
      <Screw x={280} y={y + h / 2} r={1.7} />
    </G>
  );
}

/** A speakON-type NL4 panel jack (round, keyed, on its flange). */
function Nl4({ cx, cy }: { cx: number; cy: number }) {
  const p = usePaint();
  return (
    <G>
      <Rect x={cx - 8.2} y={cy - 8.8} width={16.4} height={17.6} rx={1.4} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.5} />
      <Circle cx={cx} cy={cy} r={7.2} fill={p.jack} stroke="#7b7f86" strokeWidth={0.6} />
      <Circle cx={cx} cy={cy} r={4.2} fill="#141518" stroke="#3a3c42" strokeWidth={0.5} />
      <Rect x={cx - 1} y={cy - 7.2} width={2} height={3} fill="#050506" />
      <Screw x={cx - 6} y={cy - 6.8} r={0.9} />
      <Screw x={cx + 6} y={cy + 6.8} r={0.9} />
    </G>
  );
}

/** 3U amplifier rear: two NL4 outputs, an IEC C14 inlet, a fan grille. */
export function Amplifier({ ventXs, dress }: { ventXs: number[]; dress: boolean }) {
  const x0 = ventXs[0] - 4;
  const x1 = ventXs[ventXs.length - 1] + 4;
  return (
    <G>
      <DeviceFace y={248} h={68} />
      <Nl4 cx={78} cy={272} />
      <Nl4 cx={106} cy={272} />
      {/* IEC C14 inlet */}
      <Rect x={130} y={264} width={20} height={15} rx={1.4} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.5} />
      <Path d="M133.5 267 H146.5 V273.5 L143.5 276.5 H136.5 L133.5 273.5 Z" fill="#050506" stroke="#6e727a" strokeWidth={0.4} />
      <Path d="M137 269.5 v4 M140 269.5 v4 M143 269.5 v4" stroke="#c9a13c" strokeWidth={0.8} />
      {/* the fan grille (intake) */}
      <VentField x={x0} y={256} w={x1 - x0} h={52} k={RK} />
      <Circle cx={(x0 + x1) / 2} cy={282} r={23} fill="none" stroke="#2c2e34" strokeWidth={0.9} />
      <Circle cx={(x0 + x1) / 2} cy={282} r={15} fill="none" stroke="#2c2e34" strokeWidth={0.7} />
      <Circle cx={(x0 + x1) / 2} cy={282} r={5} fill="#1b1c20" stroke="#2c2e34" strokeWidth={0.6} />
      {dress ? (
        <G>
          {[70, 98].map((x) => (
            <G key={x}>
              <Rect x={x} y={288} width={16} height={6} rx={0.6} fill="#eceae3" stroke="#8d8a80" strokeWidth={0.35} />
              <Path d={`M${x + 2} 290.2 h7 M${x + 2} 292 h11`} stroke="#23252a" strokeWidth={0.7} />
            </G>
          ))}
        </G>
      ) : null}
    </G>
  );
}

/** An IEC C13 outlet on the distro. */
function C13({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x} y={y} width={15} height={11} rx={1.2} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.45} />
      <Path d={`M${x + 2.2} ${y + 2} H${x + 12.8} V${y + 6.6} L${x + 10.4} ${y + 9} H${x + 4.6} L${x + 2.2} ${y + 6.6} Z`} fill="#050506" stroke="#6e727a" strokeWidth={0.35} />
      <Path d={`M${x + 4.6} ${y + 4.6} h1.8 M${x + 8.6} ${y + 4.6} h1.8 M${x + 6.6} ${y + 3} h1.8`} stroke="#8d8a80" strokeWidth={0.7} />
    </G>
  );
}

/** A C13 plug seated in an outlet, cord leaving downward. */
export function C13Plug({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x - 0.5} y={y - 0.5} width={15} height={12} rx={1.6} fill="#1b1c20" stroke="#3a3c42" strokeWidth={0.6} />
      <Rect x={x + 1.4} y={y + 1.2} width={11} height={3} rx={0.8} fill="#34363d" />
      <Rect x={x + 4.5} y={y + 11.5} width={5} height={4} rx={0.8} fill="#1b1c20" />
    </G>
  );
}

/** 1U power distro: C13 outlets, a breaker. */
export function PowerDistro({ xs, dress }: { xs: number[]; dress: boolean }) {
  return (
    <G>
      <DeviceFace y={326} h={30} />
      {xs.map((x) => (
        <C13 key={x} x={x} y={334} />
      ))}
      <Rect x={266} y={333} width={14} height={14} rx={1.4} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.45} />
      <Rect x={269.5} y={335.5} width={7} height={9} rx={1} fill="#c8372b" />
      {dress ? [64, 90, 116].map((x) => <C13Plug key={x} x={x} y={333} />) : [64, 90, 116].map((x) => <C13 key={x} x={x} y={334} />)}
    </G>
  );
}
