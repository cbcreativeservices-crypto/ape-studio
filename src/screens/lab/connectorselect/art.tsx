/**
 * Audio Connectors & Cable Selection Lab — SVG art.
 *
 * ExplodedCable: the Station-1 anatomy diagram. Every part is BOTH a
 * pressable SVG zone and mirrored by the part list below it (selection is
 * shared state owned by the page) — colors always pair with text labels,
 * never color alone.
 *
 * CrossSectionView: Station-4 construction cross-sections, drawn to the
 * layer lists in data/practice.ts. Diagrammatic, not photoreal — these are
 * teaching sections, and nothing here pretends to be a measurement.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { ExpandableFigure } from '../kit/ExpandableFigure';
import type { SectionKind } from './data/practice';

/* ── exploded cable ──────────────────────────────────────────────────────── */

const INK = {
  metal: '#9aa3ad',
  metalDark: '#6b7480',
  shell: '#2c2f34',
  jacket: '#1f6feb',
  shield: '#c0c7cf',
  insul: '#d9822b',
  copper: '#e3b341',
  panel: '#191b1f',
  hi: colors.cyanBright,
};

/* The drawing is a ¼-inch (6.35 mm) TRS plug on a balanced (two conductors +
 * braid shield) cable, AUTHORED AT 1.45 viewBox units per mm so every part
 * is its real size relative to the others:
 *   panel jack: hex nut 14 mm across flats, bushing Ø9.5, socket Ø6.4;
 *   plug shaft Ø6.35 × 31 mm — tip 8 (ball + neck groove), insulator 2.5,
 *     ring 5, insulator 2.5, sleeve 13;
 *   handle (barrel) Ø13 × 38 mm with grip grooves;
 *   strain-relief boot 25 mm, Ø10 tapering to the cable;
 *   cable Ø6.5 mm PVC jacket; braid shield Ø5.2; two insulated conductors
 *     Ø1.9 each, twisted; stranded copper Ø0.9 (drawn 1.1 mm so it reads).
 * The cable's layers are stripped back in steps along its length — the usual
 * cable-anatomy convention, read left to right. */
const MM = 1.45;
const CY = 75;
const X_TIP = 62;
const SHAFT = { tipBall: 8.6, neckEnd: 11, ins1: 13.5, ring: 18.5, ins2: 21, sleeve: 31 } as const;
const X_BARREL = X_TIP + SHAFT.sleeve * MM; // 107
const X_BOOT = X_BARREL + 38 * MM; // 162
const X_JACKET = X_BOOT + 25 * MM; // 198
const X_SHIELD = 250;
const X_INSUL = 288;
const X_COND = 314;
const R_SHAFT = (6.35 / 2) * MM;
const R_BARREL = (13 / 2) * MM;
const R_CABLE = (6.5 / 2) * MM;
const R_BRAID = (5.2 / 2) * MM;
const R_WIRE = (1.9 / 2) * MM;

/** Full-height invisible hit zones (design pass: the drawn shapes are far
 *  below 44 pt — conductors render ~3 pt tall). Each zone spans its part's
 *  whole horizontal band INCLUDING the label, the full 150-unit height
 *  (≈44+ pt at any phone width). `fill="transparent"` is required —
 *  `fill="none"` does not receive presses in react-native-svg. */
const HIT_ZONES: readonly { id: string; x: number; w: number }[] = [
  { id: 'jack', x: 0, w: 56 },
  { id: 'contacts', x: 56, w: X_BARREL - 56 },
  { id: 'plug', x: X_BARREL, w: X_BOOT - X_BARREL },
  { id: 'relief', x: X_BOOT, w: X_JACKET - X_BOOT },
  { id: 'jacket', x: X_JACKET, w: X_SHIELD - X_JACKET },
  { id: 'shield', x: X_SHIELD, w: X_INSUL - X_SHIELD },
  { id: 'insulation', x: X_INSUL, w: X_COND - X_INSUL },
  { id: 'conductors', x: X_COND, w: 360 - X_COND },
];

const EXPLODED_W = 360;
const EXPLODED_H = 150;

/** A horizontal cylinder segment lit from above: body, highlight band, core shadow. */
function Cyl({ x0, x1, r, fill, stroke, sw = 0.8, hiOp = 0.45 }: { x0: number; x1: number; r: number; fill: string; stroke: string; sw?: number; hiOp?: number }) {
  return (
    <G>
      <Rect x={x0} y={CY - r} width={x1 - x0} height={2 * r} fill={fill} stroke={stroke} strokeWidth={sw} />
      <Rect x={x0 + 0.4} y={CY - r * 0.72} width={x1 - x0 - 0.8} height={r * 0.32} fill="#ffffff" opacity={hiOp} />
      <Rect x={x0 + 0.4} y={CY + r * 0.45} width={x1 - x0 - 0.8} height={r * 0.5} fill="#000000" opacity={0.25} />
    </G>
  );
}

/** `controls`: the page's readout for the selected part, docked under the
 *  drawing in FULL SCREEN (D35, full-screen pass 2026-09-30); the SVG hit
 *  zones are the control itself and keep working at every zoom. The drawing
 *  is rendered through ExpandableFigure at (w, w ÷ aspect) — it used to be a
 *  fixed 150 pt tall and letterboxed at every width. */
export function ExplodedCable({ selected, onSelect, controls }: { selected: string | null; onSelect: (id: string) => void; controls?: ReactNode }) {
  const hi = (id: string) => (selected === id ? INK.hi : undefined);
  const sw = (id: string) => (selected === id ? 2 : 0.8);
  const x = (mm: number) => X_TIP + mm * MM;
  // hex nut (14 mm across flats → circumradius 8.08 mm)
  const nutR = 8.08 * MM;
  const hex = [0, 1, 2, 3, 4, 5].map((k) => `${(27 + nutR * Math.cos((Math.PI / 3) * k)).toFixed(2)},${(CY + nutR * Math.sin((Math.PI / 3) * k)).toFixed(2)}`).join(' ');
  // braid: a diamond weave of short diagonal strokes across the exposed shield
  const braid: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let bx = X_SHIELD + 1; bx < X_INSUL - 6; bx += 3.2) {
    braid.push({ x1: bx, y1: CY - R_BRAID, x2: bx + 2.6, y2: CY + R_BRAID });
    braid.push({ x1: bx, y1: CY + R_BRAID, x2: bx + 2.6, y2: CY - R_BRAID });
  }
  // the twisted pair: two wires crossing every ~6 mm of lay
  const lay = 6 * MM;
  const wire = (phase: number) => {
    let d = '';
    for (let t = 0; t <= X_COND - X_INSUL + 0.01; t += 1) {
      const yy = CY + R_WIRE * 1.05 * Math.cos(((t / lay) * 2 + phase) * Math.PI);
      d += `${t === 0 ? 'M' : 'L'} ${(X_INSUL + t).toFixed(2)} ${yy.toFixed(2)} `;
    }
    return d;
  };
  return (
    <ExpandableFigure aspect={EXPLODED_W / EXPLODED_H} title="THE CABLE" controls={controls} render={(w, h) => (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel="Exploded cable diagram: a quarter-inch TRS panel jack on the left, then the plug's tip, ring and sleeve contacts, its handle, the strain relief, and the cable opened up layer by layer — jacket, braided shield, the insulated twisted pair, the bare copper conductors. Tap a zone or use the part list below.">
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" viewBox={`0 0 ${EXPLODED_W} ${EXPLODED_H}`} width={w} height={h}>
        {/* equipment panel + ¼-inch jack, face-on: nut, washer, threaded bushing, socket */}
        <G onPress={() => onSelect('jack')}>
          <Rect x={4} y={30} width={46} height={90} rx={3} fill={INK.panel} stroke={hi('jack') ?? '#33373d'} strokeWidth={sw('jack')} />
          <Rect x={5} y={31} width={44} height={6} rx={2} fill="#ffffff" opacity={0.05} />
          <Circle cx={27} cy={CY} r={9.6 * MM} fill="#16181c" stroke="#2a2d33" strokeWidth={0.8} />
          <Path d={`M ${hex.split(' ').join(' L ')} Z`} fill={INK.metalDark} stroke={hi('jack') ?? '#3d434b'} strokeWidth={sw('jack')} />
          <Circle cx={27} cy={CY} r={4.75 * MM} fill={INK.metal} stroke="#4a5058" strokeWidth={0.8} />
          <Circle cx={27} cy={CY} r={4.2 * MM} fill="none" stroke="#6b7480" strokeWidth={0.6} strokeDasharray="1.2 1" />
          <Circle cx={27} cy={CY} r={3.2 * MM} fill="#000" />
          <Path d={`M ${27 - nutR * 0.8} ${CY - nutR * 0.35} L ${27 - nutR * 0.3} ${CY - nutR * 0.85}`} stroke="#ffffff" strokeWidth={0.8} opacity={0.35} />
        </G>
        <SvgText x={27} y={140} fill={hi('jack') ?? '#7d8590'} fontSize={10} textAnchor="middle">JACK</SvgText>

        {/* contacts: tip (ball + neck), insulator, ring, insulator, sleeve */}
        <G onPress={() => onSelect('contacts')}>
          <Path d={`M ${x(SHAFT.tipBall)} ${CY - R_SHAFT} L ${x(3)} ${CY - R_SHAFT} Q ${X_TIP} ${CY - R_SHAFT} ${X_TIP} ${CY} Q ${X_TIP} ${CY + R_SHAFT} ${x(3)} ${CY + R_SHAFT} L ${x(SHAFT.tipBall)} ${CY + R_SHAFT} Z`} fill={INK.metal} stroke={hi('contacts') ?? INK.metalDark} strokeWidth={sw('contacts')} />
          <Rect x={x(1.6)} y={CY - R_SHAFT * 0.72} width={x(SHAFT.tipBall) - x(1.6) - 0.4} height={R_SHAFT * 0.32} fill="#ffffff" opacity={0.45} />
          <Cyl x0={x(SHAFT.tipBall)} x1={x(SHAFT.neckEnd)} r={R_SHAFT * 0.68} fill={INK.metal} stroke={hi('contacts') ?? INK.metalDark} sw={sw('contacts')} />
          <Cyl x0={x(SHAFT.neckEnd)} x1={x(SHAFT.ins1)} r={R_SHAFT} fill="#141518" stroke="#000" hiOp={0.12} />
          <Cyl x0={x(SHAFT.ins1)} x1={x(SHAFT.ring)} r={R_SHAFT} fill={INK.metal} stroke={hi('contacts') ?? INK.metalDark} sw={sw('contacts')} />
          <Cyl x0={x(SHAFT.ring)} x1={x(SHAFT.ins2)} r={R_SHAFT} fill="#141518" stroke="#000" hiOp={0.12} />
          <Cyl x0={x(SHAFT.ins2)} x1={x(SHAFT.sleeve)} r={R_SHAFT} fill={INK.metal} stroke={hi('contacts') ?? INK.metalDark} sw={sw('contacts')} />
        </G>
        <SvgText x={(X_TIP + X_BARREL) / 2} y={58} fill={hi('contacts') ?? '#7d8590'} fontSize={10} textAnchor="middle">CONTACTS</SvgText>

        {/* plug handle: nose cone, barrel with grip grooves */}
        <G onPress={() => onSelect('plug')}>
          <Path d={`M ${X_BARREL} ${CY - R_SHAFT - 0.6} L ${X_BARREL + 5} ${CY - R_BARREL} L ${X_BARREL + 5} ${CY + R_BARREL} L ${X_BARREL} ${CY + R_SHAFT + 0.6} Z`} fill={INK.shell} stroke={hi('plug') ?? '#3a3f46'} strokeWidth={sw('plug')} />
          <Cyl x0={X_BARREL + 5} x1={X_BOOT} r={R_BARREL} fill={INK.shell} stroke={hi('plug') ?? '#3a3f46'} sw={sw('plug')} hiOp={0.16} />
          {[0.32, 0.42, 0.52].map((f) => (
            <Line key={f} x1={X_BARREL + (X_BOOT - X_BARREL) * f} y1={CY - R_BARREL + 0.8} x2={X_BARREL + (X_BOOT - X_BARREL) * f} y2={CY + R_BARREL - 0.8} stroke="#15171a" strokeWidth={1.2} />
          ))}
        </G>
        <SvgText x={(X_BARREL + X_BOOT) / 2} y={104} fill={hi('plug') ?? '#7d8590'} fontSize={10} textAnchor="middle">PLUG</SvgText>

        {/* strain-relief boot: ribbed, tapering from Ø10 to the cable */}
        <G onPress={() => onSelect('relief')}>
          <Path d={`M ${X_BOOT} ${CY - 5 * MM} L ${X_JACKET} ${CY - R_CABLE - 0.4} L ${X_JACKET} ${CY + R_CABLE + 0.4} L ${X_BOOT} ${CY + 5 * MM} Z`} fill="#202328" stroke={hi('relief') ?? '#3a3f46'} strokeWidth={sw('relief')} />
          {[0.15, 0.32, 0.49, 0.66, 0.83].map((f) => {
            const rx = X_BOOT + (X_JACKET - X_BOOT) * f;
            const rr = 5 * MM + (R_CABLE + 0.4 - 5 * MM) * f;
            return <Line key={f} x1={rx} y1={CY - rr + 0.5} x2={rx} y2={CY + rr - 0.5} stroke="#0e0f12" strokeWidth={1.4} />;
          })}
          <Path d={`M ${X_BOOT + 1} ${CY - 5 * MM + 1.6} L ${X_JACKET - 1} ${CY - R_CABLE + 0.9}`} stroke="#ffffff" strokeWidth={0.8} opacity={0.18} />
        </G>
        <SvgText x={(X_BOOT + X_JACKET) / 2} y={58} fill={hi('relief') ?? '#7d8590'} fontSize={10} textAnchor="middle">RELIEF</SvgText>

        {/* jacket */}
        <G onPress={() => onSelect('jacket')}>
          <Cyl x0={X_JACKET} x1={X_SHIELD} r={R_CABLE} fill={INK.jacket} stroke={hi('jacket') ?? '#164a9e'} sw={sw('jacket')} hiOp={0.3} />
          {/* the cut end of the jacket, a ring seen a little end-on */}
          <Path d={`M ${X_SHIELD} ${CY - R_CABLE} Q ${X_SHIELD + 1.8} ${CY} ${X_SHIELD} ${CY + R_CABLE}`} fill="none" stroke="#164a9e" strokeWidth={1} />
        </G>
        <SvgText x={(X_JACKET + X_SHIELD) / 2} y={100} fill={hi('jacket') ?? '#7d8590'} fontSize={10} textAnchor="middle">JACKET</SvgText>

        {/* braided shield: a woven sleeve, combed open at its end */}
        <G onPress={() => onSelect('shield')}>
          <Rect x={X_SHIELD} y={CY - R_BRAID} width={X_INSUL - X_SHIELD - 6} height={2 * R_BRAID} fill="#8b939c" stroke={hi('shield') ?? '#6b737c'} strokeWidth={sw('shield')} />
          {braid.map((b, i) => (
            <Line key={i} {...b} stroke={i % 2 ? '#d9dee4' : INK.shield} strokeWidth={0.9} />
          ))}
          {[-3, -1.5, 0, 1.5, 3].map((k) => (
            <Path key={k} d={`M ${X_INSUL - 6} ${CY + k * 1.1} Q ${X_INSUL - 3} ${CY + k * 2.2} ${X_INSUL - 0.5} ${CY + k * 3.4}`} fill="none" stroke={INK.shield} strokeWidth={0.6} />
          ))}
        </G>
        <SvgText x={(X_SHIELD + X_INSUL) / 2} y={58} fill={hi('shield') ?? '#7d8590'} fontSize={10} textAnchor="middle">SHIELD</SvgText>

        {/* insulation: the twisted pair (two coloured insulated conductors) */}
        <G onPress={() => onSelect('insulation')}>
          <Path d={wire(1)} fill="none" stroke={hi('insulation') ?? '#2b5ca3'} strokeWidth={R_WIRE * 2 + (selected === 'insulation' ? 1.4 : 0.6)} strokeLinecap="round" />
          <Path d={wire(1)} fill="none" stroke="#3d7dd6" strokeWidth={R_WIRE * 2} strokeLinecap="round" />
          <Path d={wire(0)} fill="none" stroke={hi('insulation') ?? '#a05f18'} strokeWidth={R_WIRE * 2 + (selected === 'insulation' ? 1.4 : 0.6)} strokeLinecap="round" />
          <Path d={wire(0)} fill="none" stroke={INK.insul} strokeWidth={R_WIRE * 2} strokeLinecap="round" />
        </G>
        <SvgText x={301} y={100} fill={hi('insulation') ?? '#7d8590'} fontSize={10} textAnchor="middle">INSUL.</SvgText>

        {/* conductors: bare stranded copper, the two ends splayed for soldering */}
        <G onPress={() => onSelect('conductors')}>
          {[0, 1]
            .map((ph) => CY + R_WIRE * 1.05 * Math.cos((((X_COND - X_INSUL) / lay) * 2 + ph) * Math.PI))
            .sort((a, b) => a - b)
            .map((y0, k) => ({ y0, y1: k === 0 ? CY - 7 : CY + 7 }))
            .map((c, i) => (
            <G key={i}>
              <Path d={`M ${X_COND} ${c.y0} C ${X_COND + 12} ${c.y0} ${X_COND + 14} ${c.y1} ${X_COND + 38} ${c.y1}`} fill="none" stroke={hi('conductors') ?? '#a8862c'} strokeWidth={1.1 * MM + (selected === 'conductors' ? 1.4 : 0.5)} strokeLinecap="round" />
              <Path d={`M ${X_COND} ${c.y0} C ${X_COND + 12} ${c.y0} ${X_COND + 14} ${c.y1} ${X_COND + 38} ${c.y1}`} fill="none" stroke={INK.copper} strokeWidth={1.1 * MM} strokeLinecap="round" />
              <Path d={`M ${X_COND} ${c.y0} C ${X_COND + 12} ${c.y0} ${X_COND + 14} ${c.y1} ${X_COND + 38} ${c.y1}`} fill="none" stroke="#fff3c4" strokeWidth={0.4} strokeDasharray="1.4 1.2" opacity={0.7} />
            </G>
          ))}
        </G>
        {/* Anchored at the right edge: centred on 334 it ran past the
            viewBox and read "CONDUCTOR" (full-screen pass 2026-09-30). */}
        <SvgText x={357} y={58} fill={hi('conductors') ?? '#7d8590'} fontSize={10} textAnchor="end">CONDUCTORS</SvgText>

        {/* full-height invisible tap zones on top — the real touch targets */}
        {HIT_ZONES.map((z) => (
          <Rect key={z.id} x={z.x} y={0} width={z.w} height={150} fill="transparent" onPress={() => onSelect(z.id)} />
        ))}
      </Svg>
    </View>
    )} />
  );
}

/* ── cross-sections ──────────────────────────────────────────────────────── */

function Pair({ cx, cy, r = 7, gap = 8, tint = INK.copper }: { cx: number; cy: number; r?: number; gap?: number; tint?: string }) {
  return (
    <G>
      <Circle cx={cx - gap / 2} cy={cy} r={r} fill="#d9822b" />
      <Circle cx={cx - gap / 2} cy={cy} r={r * 0.55} fill={tint} />
      <Circle cx={cx + gap / 2} cy={cy} r={r} fill="#3d7dd6" />
      <Circle cx={cx + gap / 2} cy={cy} r={r * 0.55} fill={tint} />
    </G>
  );
}

/** `width`: the inline size (the page sets it beside the photograph);
 *  `controls`: the page's construction picker + layer readout, docked under
 *  the section in FULL SCREEN (full-screen pass 2026-09-30). */
export function CrossSectionView({ kind, width = 120, a11y, controls }: { kind: SectionKind; width?: number; a11y?: string; controls?: ReactNode }) {
  const C = 60; // center
  let inner: React.ReactNode = null;
  let rings: { r: number; fill: string; stroke?: string }[] = [];
  switch (kind) {
    case 'balanced_pair':
      rings = [
        { r: 52, fill: INK.jacket },
        { r: 42, fill: INK.shield },
      ];
      inner = <Pair cx={C} cy={C} r={12} gap={22} />;
      break;
    case 'instrument':
      rings = [
        { r: 52, fill: '#2c2f34' },
        { r: 40, fill: INK.shield },
        { r: 28, fill: '#d9822b' },
      ];
      inner = <Circle cx={C} cy={C} r={10} fill={INK.copper} />;
      break;
    case 'stereo_common':
      rings = [
        { r: 52, fill: '#2c2f34' },
        { r: 42, fill: INK.shield },
      ];
      inner = <Pair cx={C} cy={C} r={11} gap={26} />;
      break;
    case 'speaker':
      rings = [{ r: 52, fill: '#1f1f22' }];
      inner = (
        <G>
          <Circle cx={C - 16} cy={C} r={17} fill="#d9822b" />
          <Circle cx={C - 16} cy={C} r={12} fill={INK.copper} />
          <Circle cx={C + 16} cy={C} r={17} fill="#3d7dd6" />
          <Circle cx={C + 16} cy={C} r={12} fill={INK.copper} />
        </G>
      );
      break;
    case 'coax75':
      rings = [
        { r: 52, fill: '#1f1f22' },
        { r: 42, fill: INK.shield },
        { r: 32, fill: '#e8e8ec' },
      ];
      inner = <Circle cx={C} cy={C} r={7} fill={INK.copper} />;
      break;
    case 'category':
      rings = [{ r: 52, fill: '#2b7de9' }];
      inner = (
        <G>
          <Pair cx={C - 20} cy={C - 20} r={6.5} gap={10} />
          <Pair cx={C + 20} cy={C - 20} r={6.5} gap={10} />
          <Pair cx={C - 20} cy={C + 20} r={6.5} gap={10} />
          <Pair cx={C + 20} cy={C + 20} r={6.5} gap={10} />
        </G>
      );
      break;
    case 'optical':
      rings = [
        { r: 52, fill: '#e05a2b' },
        { r: 38, fill: '#3a3f46' },
        { r: 24, fill: '#9fd7ff' },
      ];
      inner = <Circle cx={C} cy={C} r={6} fill="#ffffff" />;
      break;
    case 'multiconductor':
      rings = [
        { r: 52, fill: '#2c2f34' },
        { r: 44, fill: INK.shield },
      ];
      inner = (
        <G>
          <Pair cx={C - 16} cy={C - 14} r={6} gap={9} />
          <Pair cx={C + 16} cy={C - 14} r={6} gap={9} />
          <Pair cx={C} cy={C + 6} r={6} gap={9} />
          <Circle cx={C - 18} cy={C + 20} r={7} fill="#c23a3a" />
          <Circle cx={C + 18} cy={C + 20} r={7} fill="#1f1f22" stroke="#8b939c" strokeWidth={1} />
        </G>
      );
      break;
  }
  return (
    <ExpandableFigure aspect={1} width={width} title="CROSS-SECTION" controls={controls} render={(w, h) => (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" viewBox="0 0 120 120" width={w} height={h}>
      {rings.map((ring, i) => (
        <Circle key={i} cx={C} cy={C} r={ring.r} fill={ring.fill} stroke={ring.stroke ?? '#0c0d0f'} strokeWidth={1} />
      ))}
      {inner}
    </Svg>
    </View>
    )} />
  );
}

/* ── tester lamp ─────────────────────────────────────────────────────────── */

export function Lamp({ state, pulse }: { state: 'lit' | 'dark' | 'flicker'; pulse?: boolean }) {
  const fill = state === 'lit' ? colors.green : state === 'flicker' ? colors.gold : '#26262b';
  return (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" viewBox="0 0 28 28" width={28} height={28}>
      <Circle cx={14} cy={14} r={11} fill={fill} stroke="#0c0d0f" strokeWidth={2} opacity={state === 'flicker' && pulse ? 0.35 : 1} />
      {state !== 'dark' ? <Circle cx={10.5} cy={10.5} r={3} fill="#ffffff" opacity={0.5} /> : null}
    </Svg>
  );
}

const FACE_W = 340;
const FACE_H = 72;

/**
 * TesterFace — the continuity tester's face as ONE drawing: the lamp, the
 * two test points under probe and the lamp's word, all SVG so everything
 * zooms (D35, full-screen pass 2026-09-30). Rendered through
 * ExpandableFigure; the page docks its END A / END B keys and the FLEX ·
 * INSPECT · RESEAT actions under it (`controls`) so the whole bench works
 * in full screen. Text ≥ 9 in a 340-wide viewBox.
 */
export function TesterFace({ state, pulse, a, b, word, controls }: {
  state: 'lit' | 'dark' | 'flicker';
  pulse?: boolean;
  /** Contact names under probe at each end, or null before a pick. */
  a: string | null;
  b: string | null;
  /** The lamp's word (LIT / FLICKERING / DARK / PICK A + B). */
  word: string;
  controls?: ReactNode;
}) {
  const fill = state === 'lit' ? colors.green : state === 'flicker' ? colors.gold : '#26262b';
  const wordColor = state === 'lit' ? colors.green : state === 'flicker' ? colors.gold : colors.textMuted;
  const ready = a != null && b != null;
  const a11y = ready ? `Continuity lamp ${word}: end A ${a} to end B ${b}.` : 'Continuity tester: pick a test point on each end to read the lamp.';
  return (
    <ExpandableFigure aspect={FACE_W / FACE_H} title="THE TESTER" controls={controls} render={(w, h) => (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" viewBox={`0 0 ${FACE_W} ${FACE_H}`} width={w} height={h}>
      <Rect x={0} y={0} width={FACE_W} height={FACE_H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
      <SvgText x={10} y={14} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} letterSpacing={1.4}>CONTINUITY TESTER</SvgText>
      {/* the lamp */}
      <Circle cx={40} cy={42} r={18} fill="#141416" stroke="#2c2c33" strokeWidth={1} />
      <Circle cx={40} cy={42} r={14} fill={fill} stroke="#0c0d0f" strokeWidth={2} opacity={state === 'flicker' && pulse ? 0.35 : 1} />
      {state !== 'dark' ? <Circle cx={35.5} cy={37.5} r={4} fill="#ffffff" opacity={0.5} /> : null}
      <SvgText x={40} y={68} fontSize={9} fill={wordColor} textAnchor="middle" fontFamily={fonts.oswaldMedium} letterSpacing={1}>{ready ? word : 'LAMP'}</SvgText>
      {/* the two probes: END A → lamp → END B */}
      <SvgText x={80} y={32} fontSize={9} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} letterSpacing={1.4}>END A</SvgText>
      <SvgText x={80} y={48} fontSize={12} fill={a ? colors.textPrimary : colors.textMuted} fontFamily={fonts.oswaldMedium}>{a ?? '—'}</SvgText>
      <Line x1={178} y1={42} x2={200} y2={42} stroke={ready ? wordColor : '#3a3b41'} strokeWidth={2} strokeLinecap="round" />
      <Path d="M 196 37 L 202 42 L 196 47" fill="none" stroke={ready ? wordColor : '#3a3b41'} strokeWidth={2} strokeLinecap="round" />
      <SvgText x={212} y={32} fontSize={9} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} letterSpacing={1.4}>END B</SvgText>
      <SvgText x={212} y={48} fontSize={12} fill={b ? colors.textPrimary : colors.textMuted} fontFamily={fonts.oswaldMedium}>{b ?? '—'}</SvgText>
      <SvgText x={80} y={66} fontSize={9} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} letterSpacing={1}>{ready ? `PATH A→B: ${word}` : 'PICK A + B'}</SvgText>
    </Svg>
    </View>
    )} />
  );
}