/**
 * STAGE 6 — the rack's HARDWARE, drawn as a trade-textbook rear elevation
 * (owner 2026-09-28: the previous pass was "cartoon cable blobs, a green
 * spiral, unclear devices, markers floating" — "too poor to be acceptable").
 *
 * Rear view of a 15U 19-inch rack at RK ≈ 0.495 units per mm (1U = 44.45 mm =
 * 22 units). Every device sits ON the U grid (its ears on U boundaries, the
 * way real gear is racked), the rails carry the EIA universal hole pattern,
 * and every rear-panel part is drawn at its real size: keystone rears on a
 * 19.3 mm pitch, D-series XLR flanges (26 × 31 mm), NL4 panel jacks, IEC C14
 * inlets and C13 outlets, an RJ45 field, a 120 mm fan behind its grille.
 * Plugs are drawn END-ON (the way a rear view sees them), with the cable
 * leaving the boot.
 *
 * Rear panels carry SILKSCREEN (the printed names real equipment has) at the
 * lab's 9-pt floor so the picture reads before the exercise starts: PATCH,
 * SWITCH, DSP, INTERFACE, POWER AMP, PDU. Labels a technician ADDS (port
 * IDs, wrap labels) are separate — their absence is a defect the scene
 * teaches.
 *
 * Paints are per-SVG-root (useUid) and handed down through RackPaintCtx: two
 * racks can be on screen at once (the Phase-C BEFORE strip) and a duplicate
 * gradient id would resolve to the wrong root.
 */
import { createContext, useContext, type ReactNode } from 'react';
import { Circle, Defs, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { fonts } from '../../../../theme/tokens';
import { JacketPath, PanelJack, RackRail, Screw, VentField, shade } from '../svgArt';

/** units per millimetre in the rack drawing (1U = 22 units). */
export const RK = 22 / 44.45;
/** The U grid: U n occupies y U_TOP + 22n … U_TOP + 22(n+1). */
export const U_TOP = 18;
export const U_H = 22;
export const uY = (n: number) => U_TOP + n * U_H;
/** 15U of rail. */
export const RACK_US = 15;
export const RAIL_Y0 = U_TOP;
export const RAIL_Y1 = uY(RACK_US);
/** Device faces span the rails. */
export const FACE_X = 54;
export const FACE_W = 232;
/** Silkscreen / label floor: 9.2 units ≈ 9.3 pt at the inline width (343 px). */
export const RACK_TEXT = 9.2;

type Paint = { face: string; faceHi: string; mgr: string; zinc: string; jack: string };
const RackPaintCtx = createContext<Paint>({ face: '#1c1d22', faceHi: '#1c1d22', mgr: '#141419', zinc: '#80868f', jack: '#0b0b0d' });

export function RackPaints({ uid, children }: { uid: string; children: ReactNode }) {
  const p: Paint = { face: `url(#${uid}f)`, faceHi: `url(#${uid}h)`, mgr: `url(#${uid}m)`, zinc: `url(#${uid}z)`, jack: `url(#${uid}j)` };
  return (
    <RackPaintCtx.Provider value={p}>
      <Defs>
        <LinearGradient id={`${uid}f`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2c2e34" />
          <Stop offset="0.12" stopColor="#24262b" />
          <Stop offset="1" stopColor="#191a1e" />
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

/** Silkscreen on a rear panel (printed, always present; ≥ 9 pt inline). */
export function Silk({ x, y, text, anchor = 'start', color = '#8f939c' }: { x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end'; color?: string }) {
  return (
    <SvgText x={x} y={y} fontFamily={fonts.oswaldMedium} fontSize={RACK_TEXT} fill={color} textAnchor={anchor} letterSpacing={0.5}>
      {text}
    </SvgText>
  );
}

/** A device's rear panel inside its U band: powder-coated face, top and
 *  bottom chassis lips, the four ear screws through the rails. */
export function DeviceFace({ y, h, label }: { y: number; h: number; label?: string }) {
  const p = usePaint();
  return (
    <G>
      <Rect x={FACE_X} y={y + 0.6} width={FACE_W} height={h - 1.2} rx={1} fill={p.face} stroke="#0a0a0c" strokeWidth={0.6} />
      <Line x1={FACE_X + 1} y1={y + 1.3} x2={FACE_X + FACE_W - 1} y2={y + 1.3} stroke="rgba(255,255,255,0.12)" strokeWidth={0.6} />
      <Line x1={FACE_X + 1} y1={y + h - 1.4} x2={FACE_X + FACE_W - 1} y2={y + h - 1.4} stroke="rgba(0,0,0,0.5)" strokeWidth={0.6} />
      {/* rack screws through the ears (one per U boundary pair, top + bottom) */}
      <Screw x={49} y={y + 3.2} r={1.5} />
      <Screw x={291} y={y + 3.2} r={1.5} />
      <Screw x={49} y={y + h - 3.2} r={1.5} />
      <Screw x={291} y={y + h - 3.2} r={1.5} />
      {label ? <Silk x={FACE_X + 4} y={y + h - 3.6} text={label} /> : null}
    </G>
  );
}

/* ── the frame: rails, managers, top + bottom ─────────────────────────────── */

/** A vertical finger duct (plastic fingers every 25 mm, a back channel). */
function VerticalManager({ x, w }: { x: number; w: number }) {
  const p = usePaint();
  const fingers: number[] = [];
  for (let y = RAIL_Y0 + 5; y < RAIL_Y1 - 4; y += 12.4) fingers.push(y);
  return (
    <G>
      <Rect x={x} y={RAIL_Y0} width={w} height={RAIL_Y1 - RAIL_Y0} rx={1.5} fill={p.mgr} stroke="#26272c" strokeWidth={0.6} />
      {fingers.map((y) => (
        <G key={y}>
          <Path d={`M${x} ${y} H${x + 7} Q${x + 9} ${y} ${x + 9} ${y + 2.4} Q${x + 9} ${y + 4.8} ${x + 7} ${y + 4.8} H${x} Z`} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.4} />
          <Path d={`M${x + w} ${y} H${x + w - 7} Q${x + w - 9} ${y} ${x + w - 9} ${y + 2.4} Q${x + w - 9} ${y + 4.8} ${x + w - 7} ${y + 4.8} H${x + w} Z`} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.4} />
        </G>
      ))}
    </G>
  );
}

/** The top panel's cable entry: a rectangular cut-out. Raw sheet edge in the
 *  bad rack; a brush grommet once dressed. */
export const ENTRY = { x: 150, w: 80, y: 7, h: 8 } as const;

export function RackFrame({ dress }: { dress: boolean }) {
  const p = usePaint();
  return (
    <G>
      <VerticalManager x={6} w={34} />
      <VerticalManager x={300} w={34} />
      <RackRail x={45} y0={RAIL_Y0} y1={RAIL_Y1} k={RK} uTop={U_TOP} />
      <RackRail x={287.1} y0={RAIL_Y0} y1={RAIL_Y1} k={RK} uTop={U_TOP} />
      {/* bottom panel */}
      <Rect x={44} y={RAIL_Y1} width={252} height={11} rx={1.5} fill={p.faceHi} stroke="#0a0a0c" strokeWidth={0.6} />
      {/* top panel (the full cabinet width, over the managers too) + the
          cable-entry cut-out */}
      <Rect x={6} y={4} width={328} height={U_TOP - 4} rx={1.5} fill={p.faceHi} stroke="#0a0a0c" strokeWidth={0.6} />
      <Silk x={12} y={14.4} text="REAR VIEW" color="#a5a9b2" />
      <Rect x={ENTRY.x} y={ENTRY.y} width={ENTRY.w} height={ENTRY.h} rx={1} fill="#050506" />
      {dress ? (
        <G>
          {/* brush grommet: a flanged frame with its bristle strip */}
          <Rect x={ENTRY.x - 2} y={ENTRY.y - 1.6} width={ENTRY.w + 4} height={ENTRY.h + 3.2} rx={2} fill="none" stroke="#3a3c42" strokeWidth={1.6} />
          <Path d={Array.from({ length: 39 }, (_, i) => `M${ENTRY.x + 1 + i * 2} ${ENTRY.y + 0.4} v3 M${ENTRY.x + 1 + i * 2} ${ENTRY.y + ENTRY.h - 0.4} v-3`).join('')} stroke="#4a4d54" strokeWidth={0.6} />
        </G>
      ) : (
        // the raw cut edge: a bright, unfinished sheet-metal lip
        <Rect x={ENTRY.x} y={ENTRY.y} width={ENTRY.w} height={ENTRY.h} rx={0.4} fill="none" stroke="#dfe2e7" strokeWidth={1.3} />
      )}
    </G>
  );
}

/* ── gear faces (all on the U grid) ─────────────────────────────────────── */

/** 2U 24-port keystone patch panel, REAR: the modules' punch-down rears on a
 *  19.3 mm pitch, the white designation strip below them, a lacing bar above
 *  (where the horizontals are dressed once the panel is done right). */
export const PATCH = { y: uY(1), h: 2 * U_H, modY: uY(1) + 8, modH: 12, stripY: uY(1) + 22.6, stripH: 9 } as const;

export function PatchPanelRear({ xs, dress }: { xs: number[]; dress: boolean }) {
  return (
    <G>
      <DeviceFace y={PATCH.y} h={PATCH.h} />
      <Silk x={FACE_X + FACE_W - 4} y={PATCH.y + PATCH.h - 3.6} text="PATCH · 24 PORT" anchor="end" />
      {/* keystone rears: dark module, punch-down cap with its IDC slots */}
      {xs.map((cx) => (
        <G key={cx}>
          <Rect x={cx - 4.2} y={PATCH.modY} width={8.4} height={PATCH.modH} rx={0.6} fill="#121317" stroke="#050506" strokeWidth={0.4} />
          <Rect x={cx - 3.4} y={PATCH.modY + 1} width={6.8} height={4.6} rx={0.4} fill="#2f3137" stroke="#0a0a0c" strokeWidth={0.3} />
          <Path d={[0, 1, 2, 3].map((i) => `M${cx - 2.6 + i * 1.7} ${PATCH.modY + 1.6} v3.2`).join('')} stroke="#0a0a0c" strokeWidth={0.5} />
          <Rect x={cx - 1} y={PATCH.modY + 6.4} width={2} height={4.6} rx={0.3} fill="#0a0a0c" />
        </G>
      ))}
      {/* designation strip: a white write-on strip along the panel */}
      <Rect x={FACE_X + 4} y={PATCH.stripY} width={FACE_W - 8} height={PATCH.stripH} rx={0.6} fill="#e9e7e0" stroke="#8d8a80" strokeWidth={0.35} />
      {dress ? (
        <G>
          {/* dressed: every port designated (printed, ≥ 9 pt would not fit 24
              across, so the IDs are drawn as print at true scale) */}
          {xs.map((cx) => (
            <Path key={`id${cx}`} d={`M${cx - 3} ${PATCH.stripY + 3} h3.4 M${cx - 3} ${PATCH.stripY + 5.6} h5.6`} stroke="#23252a" strokeWidth={0.9} />
          ))}
          {/* the horizontals arrive from a lacing bar above the modules, one
              per module, retained with hook-and-loop, each with a wrap label */}
          <Rect x={FACE_X + 6} y={PATCH.y + 3} width={FACE_W - 12} height={2.4} rx={1.2} fill="#9ba1a8" stroke="#2d3036" strokeWidth={0.35} />
          {xs.map((cx) => (
            <JacketPath key={`h${cx}`} d={`M${cx} ${PATCH.y + 5} V${PATCH.modY + 1}`} color="#37d97b" width={2.6} shadow={false} />
          ))}
        </G>
      ) : null}
    </G>
  );
}

/** 1U horizontal finger duct at the top of the rack: the trunks come through
 *  the entry into it and are distributed to the vertical managers. */
export const HMGR = { y: uY(0), h: U_H } as const;
export function HorizontalManager({ xs }: { xs: number[] }) {
  const p = usePaint();
  return (
    <G>
      <Rect x={FACE_X} y={HMGR.y + 1} width={FACE_W} height={HMGR.h - 2} rx={1} fill={p.mgr} stroke="#0a0a0c" strokeWidth={0.6} />
      <Screw x={49} y={HMGR.y + 4} r={1.5} />
      <Screw x={291} y={HMGR.y + 4} r={1.5} />
      <Screw x={49} y={HMGR.y + HMGR.h - 4} r={1.5} />
      <Screw x={291} y={HMGR.y + HMGR.h - 4} r={1.5} />
      {xs.map((x) => (
        <Path key={x} d={`M${x - 3.2} ${HMGR.y + HMGR.h - 2} V${HMGR.y + 5} Q${x - 3.2} ${HMGR.y + 2.6} ${x} ${HMGR.y + 2.6} Q${x + 3.2} ${HMGR.y + 2.6} ${x + 3.2} ${HMGR.y + 5} V${HMGR.y + HMGR.h - 2} Z`} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.4} />
      ))}
    </G>
  );
}

/** 1U network switch, reverse-racked so its ports face the rear with the
 *  rest of the cabling (AV practice): 8 × RJ45 with link LEDs, two SFP cages. */
export const SWITCH = { y: uY(3), h: U_H, portY: 0 } as const;
export function NetworkSwitch({ xs, lit = [] }: { xs: number[]; lit?: number[] }) {
  const y = SWITCH.y;
  return (
    <G>
      <DeviceFace y={y} h={SWITCH.h} />
      <Silk x={196} y={y + 14.6} text="SWITCH" />
      {xs.map((x, i) => (
        <G key={x}>
          <Rect x={x} y={y + 8.5} width={11.7} height={9.6} rx={0.6} fill="#050506" stroke="#6d737b" strokeWidth={0.45} />
          <Rect x={x + 4.1} y={y + 17.4} width={3.5} height={1.6} fill="#050506" />
          <Path d={[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `M${x + 1.9 + k * 1.15} ${y + 9.3} v1.8`).join('')} stroke="#c9a13c" strokeWidth={0.3} />
          {/* link / activity LEDs: lit only where a cable is actually seated */}
          <Circle cx={x + 2.4} cy={y + 5.4} r={1.1} fill={lit.includes(i) ? '#37d97b' : '#1b2a20'} />
          <Circle cx={x + 9.3} cy={y + 5.4} r={1.1} fill={lit.includes(i) ? '#ffc64d' : '#2a2616'} />
        </G>
      ))}
      {[248, 266].map((x) => (
        <G key={x}>
          <Rect x={x} y={y + 7.5} width={15} height={11.5} rx={0.8} fill="#050506" stroke="#9ba1a8" strokeWidth={0.6} />
          <Rect x={x + 2} y={y + 9.5} width={11} height={7.5} fill="#141518" />
        </G>
      ))}
    </G>
  );
}

/** 2U DSP rear: 8 XLR-F analog inputs on D-series flanges (numbered on the
 *  silkscreen), an etherCON-type network port, the IEC inlet. */
export const DSP = { y: uY(4), h: 2 * U_H, jackY: uY(4) + 14 } as const;
export function DspRear({ xs, dress }: { xs: number[]; dress: boolean }) {
  const y = DSP.y;
  return (
    <G>
      <DeviceFace y={y} h={DSP.h} />
      <Silk x={FACE_X + 4} y={y + DSP.h - 3.6} text="DSP · ANALOG IN" />
      {xs.map((cx, i) => (
        <G key={cx}>
          <PanelJack x={cx} y={DSP.jackY} k={RK} kind="xlrF" />
          <Silk x={cx} y={y + 30.4} text={String(i + 1)} anchor="middle" color={dress ? '#b9bdc6' : '#8f939c'} />
        </G>
      ))}
      <PanelJack x={266} y={DSP.jackY} k={RK} kind="rj45" />
      <Silk x={266} y={y + 30.4} text="NET" anchor="middle" />
      {/* IEC C14 inlet, bottom right (the dressed AC loom seats its cord) */}
      <IecInlet x={236} y={y + 32} />
    </G>
  );
}

/** IEC C14 chassis inlet (rear), 30 × 22 mm on its plate. */
export function IecInlet({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x} y={y} width={14} height={11} rx={1} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.45} />
      <Path d={`M${x + 2.2} ${y + 2} H${x + 11.8} V${y + 6.6} L${x + 9.6} ${y + 9} H${x + 4.4} L${x + 2.2} ${y + 6.6} Z`} fill="#050506" stroke="#6e727a" strokeWidth={0.35} />
      <Path d={`M${x + 4.6} ${y + 4} v3 M${x + 7} ${y + 3.4} v3 M${x + 9.4} ${y + 4} v3`} stroke="#c9a13c" strokeWidth={0.7} />
    </G>
  );
}

/** 1U audio interface: six combo XLR/TRS inputs and two XLR-M outputs. */
export const IFACE = { y: uY(6), h: U_H, jackY: uY(6) + 11 } as const;
export function AudioInterface({ xs }: { xs: number[] }) {
  const p = usePaint();
  const y = IFACE.y;
  return (
    <G>
      <DeviceFace y={y} h={IFACE.h} />
      {xs.map((cx) => (
        <G key={cx}>
          <Circle cx={cx} cy={IFACE.jackY} r={5.4} fill={p.jack} stroke="#6e727a" strokeWidth={0.45} />
          <Circle cx={cx} cy={IFACE.jackY} r={1.7} fill="#050506" stroke="#9ba1a8" strokeWidth={0.35} />
          <Rect x={cx - 0.9} y={IFACE.jackY - 5.4} width={1.8} height={1.6} fill="#050506" />
        </G>
      ))}
      <Silk x={xs[xs.length - 1] + 12} y={y + 14.4} text="INTERFACE" />
      {[254, 274].map((cx) => (
        <PanelJack key={cx} x={cx} y={IFACE.jackY} k={RK * 0.7} kind="xlrM" />
      ))}
    </G>
  );
}

/** A blank filler panel of `us` U at U `u`. */
export function BlankPanel({ u, us }: { u: number; us: number }) {
  return <DeviceFace y={uY(u)} h={us * U_H} />;
}

/** The rack's empty bay: nothing racked, the back of the enclosure visible. */
export function OpenBay({ u, us }: { u: number; us: number }) {
  return <Rect x={FACE_X} y={uY(u)} width={FACE_W} height={us * U_H} fill="#08080a" />;
}

/** An NL4 (speakON-type) panel jack: round, keyed, on its square flange. */
function Nl4({ cx, cy }: { cx: number; cy: number }) {
  const p = usePaint();
  return (
    <G>
      <Rect x={cx - 8.2} y={cy - 8.2} width={16.4} height={16.4} rx={1.4} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.5} />
      <Circle cx={cx} cy={cy} r={7} fill={p.jack} stroke="#7b7f86" strokeWidth={0.6} />
      <Circle cx={cx} cy={cy} r={4.2} fill="#141518" stroke="#3a3c42" strokeWidth={0.5} />
      <Rect x={cx - 1} y={cy - 7} width={2} height={3} fill="#050506" />
      <Screw x={cx - 6} y={cy - 6} r={0.9} />
      <Screw x={cx + 6} y={cy + 6} r={0.9} />
    </G>
  );
}

/** 3U power amplifier rear: NL4 outputs, XLR-F inputs, the IEC inlet, and
 *  the fan intake behind its grille (which the loom must never cross). */
export const AMP = { y: uY(9), h: 3 * U_H, nl4Y: uY(9) + 30, nl4Xs: [76, 104] as const, inXs: [140, 162] as const, grille: { x: 178, y: uY(9) + 6, w: 100, h: 54 } } as const;
export function Amplifier({ dress }: { dress: boolean }) {
  const y = AMP.y;
  const g = AMP.grille;
  return (
    <G>
      <DeviceFace y={y} h={AMP.h} label="POWER AMP" />
      <Silk x={FACE_X + 4} y={y + 12} text="OUTPUTS" />
      {AMP.nl4Xs.map((cx) => (
        <Nl4 key={cx} cx={cx} cy={AMP.nl4Y} />
      ))}
      <Silk x={AMP.inXs[0] - 8} y={y + 12} text="INPUTS" />
      {AMP.inXs.map((cx) => (
        <PanelJack key={cx} x={cx} y={AMP.nl4Y} k={RK * 0.86} kind="xlrF" />
      ))}
      <IecInlet x={128} y={y + 50} />
      <Silk x={148} y={y + 58.6} text="AC IN" />
      {/* the 120 mm fan behind its punched grille — front-to-rear airflow, so
          this is the EXHAUST */}
      <VentField x={g.x} y={g.y} w={g.w} h={g.h} k={RK} />
      <Circle cx={g.x + g.w / 2} cy={g.y + g.h / 2} r={24} fill="none" stroke="#2c2e34" strokeWidth={0.9} />
      <Circle cx={g.x + g.w / 2} cy={g.y + g.h / 2} r={15} fill="none" stroke="#2c2e34" strokeWidth={0.7} />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        const cx = g.x + g.w / 2;
        const cy = g.y + g.h / 2;
        return <Path key={i} d={`M${cx + Math.cos(a) * 6} ${cy + Math.sin(a) * 6} Q${cx + Math.cos(a + 0.5) * 16} ${cy + Math.sin(a + 0.5) * 16} ${cx + Math.cos(a + 0.9) * 22} ${cy + Math.sin(a + 0.9) * 22}`} stroke="#2c2e34" strokeWidth={2.2} fill="none" strokeLinecap="round" />;
      })}
      <Circle cx={g.x + g.w / 2} cy={g.y + g.h / 2} r={5.5} fill="#1b1c20" stroke="#2c2e34" strokeWidth={0.6} />
      <Silk x={g.x + g.w / 2} y={y + AMP.h - 3.6} text="EXHAUST · KEEP CLEAR" anchor="middle" />
      {/* `dress` only brightens nothing here: the dressed looms draw their
          own seated plugs (AC cord, NL4s, input XLRs) where they land */}
      {dress ? null : null}
    </G>
  );
}

/** An NL4 (speakON-type) cable plug seated in its panel jack, end-on: the
 *  round black housing, the twist-lock ring, the cable leaving its centre. */
export function Nl4PlugRear({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Circle cx={x + 0.8} cy={y + 1.4} r={7.4} fill="rgba(0,0,0,0.5)" />
      <Circle cx={x} cy={y} r={7.4} fill="#1e2024" stroke="#050506" strokeWidth={0.5} />
      <Circle cx={x} cy={y} r={5.2} fill="#2a2c31" stroke="#0d0e10" strokeWidth={0.4} />
      <Path d={`M${x - 5.2} ${y} a5.2 5.2 0 0 1 10.4 0`} stroke="rgba(255,255,255,0.18)" strokeWidth={0.7} fill="none" />
      <Circle cx={x} cy={y} r={2.4} fill="#0b0b0d" />
      <Rect x={x - 1.4} y={y - 8.6} width={2.8} height={3} rx={0.6} fill="#2a2c31" stroke="#050506" strokeWidth={0.4} />
    </G>
  );
}

/** An IEC C13 outlet on the PDU. */
function C13({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x} y={y} width={15} height={11} rx={1.2} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.45} />
      <Path d={`M${x + 2.2} ${y + 2} H${x + 12.8} V${y + 6.6} L${x + 10.4} ${y + 9} H${x + 4.6} L${x + 2.2} ${y + 6.6} Z`} fill="#050506" stroke="#6e727a" strokeWidth={0.35} />
      <Path d={`M${x + 4.6} ${y + 4.6} h1.8 M${x + 8.6} ${y + 4.6} h1.8 M${x + 6.6} ${y + 3} h1.8`} stroke="#8d8a80" strokeWidth={0.7} />
    </G>
  );
}

/** A C13 plug seated in an outlet, seen end-on: the moulded body, the
 *  cord leaving its centre downward. */
export function C13Plug({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x - 0.6} y={y - 0.6} width={16.2} height={12.2} rx={1.8} fill="#1b1c20" stroke="#3a3c42" strokeWidth={0.6} />
      <Rect x={x + 1.6} y={y + 1.4} width={11.8} height={2.8} rx={0.8} fill="#34363d" />
      <Rect x={x + 5} y={y + 11} width={5} height={4.2} rx={0.9} fill="#1b1c20" stroke="#3a3c42" strokeWidth={0.4} />
    </G>
  );
}

/** 1U PDU rear: eight C13 outlets in a row, the breaker, the inlet. */
export const PDU = { y: uY(12), h: U_H, outY: uY(12) + 5.5 } as const;
export function PowerDistro({ xs, dress }: { xs: number[]; dress: boolean }) {
  const y = PDU.y;
  return (
    <G>
      <DeviceFace y={y} h={PDU.h} />
      {xs.map((x) => (
        <C13 key={x} x={x} y={PDU.outY} />
      ))}
      {/* breaker (rocker with its trip button) + the C14 inlet */}
      <Rect x={222} y={y + 4} width={14} height={14} rx={1.4} fill="#26282d" stroke="#0a0a0c" strokeWidth={0.45} />
      <Rect x={225.5} y={y + 6.5} width={7} height={9} rx={1} fill="#c8372b" />
      <Silk x={243} y={y + 14.4} text="PDU" />
      <IecInlet x={264} y={y + 5.5} />
      {/* the dressed AC loom seats its own cords in outlets 1–2 */}
      {dress ? null : null}
    </G>
  );
}

/* ── plugs seen end-on (the rear view of a plugged cable) ────────────────── */

/** An RJ45 plug latched in a port, end-on, with its snagless boot. */
export function Rj45PlugRear({ x, y, color = '#37d97b' }: { x: number; y: number; color?: string }) {
  return (
    <G>
      <Rect x={x + 0.8} y={y + 0.6} width={10.1} height={8.4} rx={0.6} fill="rgba(215,225,235,0.55)" stroke="#dfe7ef" strokeWidth={0.4} />
      <Rect x={x + 3.2} y={y + 3.2} width={5.3} height={5.6} rx={1.2} fill={shade(color, 0.3)} stroke="rgba(0,0,0,0.6)" strokeWidth={0.35} />
      <Rect x={x + 2.4} y={y - 1.4} width={6.9} height={2} rx={0.5} fill="rgba(215,225,235,0.7)" />
    </G>
  );
}

/** A ¼-inch / XLR combo input with a TRS plug in it, end-on. */
export function TrsPlugRear({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Circle cx={x + 0.6} cy={y + 1} r={4.2} fill="rgba(0,0,0,0.5)" />
      <Circle cx={x} cy={y} r={4.2} fill="#262a31" stroke="#0a0a0c" strokeWidth={0.4} />
      <Circle cx={x} cy={y} r={2.6} fill="#1b1c20" stroke="#2e3036" strokeWidth={0.5} />
      <Circle cx={x} cy={y} r={1.2} fill="#0b0b0d" />
    </G>
  );
}

/* ── defect helpers (real cable, real hardware, wrong use) ──────────────── */

/**
 * A tightly wound HANK of excess cable (the "drum"): turns laid side by side
 * at the cable's own diameter, so it reads as wound cable, not a spiral.
 * A cable tie holds it; the two tails leave at `tailAngle`.
 */
export function Hank({ cx, cy, rx, ry, turns, color, width, jam = false }: { cx: number; cy: number; rx: number; ry: number; turns: number; color: string; width: number; jam?: boolean }) {
  const rings: number[] = [];
  for (let i = 0; i < turns; i++) rings.push(i);
  return (
    <G>
      {rings.map((i) => {
        const f = 1 - (i * width * 1.05) / rx;
        // jammed: the turns are not concentric — each one sits a little off,
        // squashed where the hank was forced into the bay
        const jx = jam ? ((i % 3) - 1) * 2.2 : 0;
        const jy = jam ? ((i % 2) - 0.5) * 2.6 : 0;
        const rxi = rx * f + (jam ? (i % 2) * 1.4 : 0);
        const ryi = ry * f * (jam ? 0.92 + (i % 3) * 0.05 : 1);
        return <JacketPath key={i} d={`M${cx + jx - rxi} ${cy + jy} a${rxi} ${ryi} 0 1 0 ${2 * rxi} 0 a${rxi} ${ryi} 0 1 0 ${-2 * rxi} 0`} color={color} width={width} shadow={i === 0} />;
      })}
    </G>
  );
}

/**
 * Two cables PLAITED through each other (power + signal twisted together):
 * anti-phase sine waves, and in each half-period the cable in front is the
 * one drawn last — a real over-under lay, not two wiggles.
 */
export function Plait({ x0, x1, y, amp, period, colors: cs, widths, phase = 0 }: { x0: number; x1: number; y: number; amp: number; period: number; colors: [string, string]; widths: [number, number]; phase?: number }) {
  const segs: { d: string; k: 0 | 1; over: boolean }[] = [];
  const half = period / 2;
  const n = Math.max(1, Math.round((x1 - x0) / half));
  const sample = (k: 0 | 1, a: number, b: number) => {
    const pts: string[] = [];
    const steps = 8;
    for (let s = 0; s <= steps; s++) {
      const x = a + ((b - a) * s) / steps;
      const yy = y + (k === 0 ? 1 : -1) * amp * Math.sin(((x - x0) / period) * Math.PI * 2 + phase);
      pts.push(`${s === 0 ? 'M' : 'L'}${x.toFixed(1)} ${yy.toFixed(1)}`);
    }
    return pts.join(' ');
  };
  for (let i = 0; i < n; i++) {
    const a = x0 + i * half;
    const b = Math.min(x1, a + half);
    const front: 0 | 1 = i % 2 === 0 ? 0 : 1;
    segs.push({ d: sample(front === 0 ? 1 : 0, a, b), k: front === 0 ? 1 : 0, over: false });
    segs.push({ d: sample(front, a, b), k: front, over: true });
  }
  return (
    <G>
      {segs.map((s, i) => (
        <JacketPath key={i} d={s.d} color={cs[s.k]} width={widths[s.k]} shadow={s.over} />
      ))}
    </G>
  );
}

/** The inspector's red strain flag: two short strokes where cable is loaded. */
export function StrainFlag({ x, y, angle = 0 }: { x: number; y: number; angle?: number }) {
  return (
    <G transform={`rotate(${angle} ${x} ${y})`}>
      <Path d={`M${x - 3} ${y - 2.4} l-3 -3 M${x + 3} ${y - 2.4} l3 -3`} stroke="#ff7a68" strokeWidth={1.6} strokeLinecap="round" />
    </G>
  );
}

/** A crease where a jacket has been folded past its bend radius: the jacket
 *  flattened and stress-whitened across the fold, a dark crease line through
 *  it — a mark ON the cable, never an arrow. `angle` = the cable's direction
 *  at the fold (0 = horizontal). */
export function Kink({ x, y, angle = 0 }: { x: number; y: number; angle?: number }) {
  return (
    <G transform={`rotate(${angle} ${x} ${y})`}>
      <Rect x={x - 1.3} y={y - 2.3} width={2.6} height={4.6} rx={0.6} fill="#e9ecef" opacity={0.85} />
      <Line x1={x} y1={y - 2.4} x2={x} y2={y + 2.4} stroke="#0a0a0c" strokeWidth={0.7} />
    </G>
  );
}
