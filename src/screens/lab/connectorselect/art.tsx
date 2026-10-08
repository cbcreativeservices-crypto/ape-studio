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

/** Full-height invisible hit zones (design pass: the drawn shapes are far
 *  below 44 pt — conductors render ~3 pt tall). Each zone spans its part's
 *  whole horizontal band INCLUDING the label, the full 150-unit height
 *  (≈44+ pt at any phone width). `fill="transparent"` is required —
 *  `fill="none"` does not receive presses in react-native-svg. */
const HIT_ZONES: readonly { id: string; x: number; w: number }[] = [
  { id: 'jack', x: 0, w: 54 },
  { id: 'contacts', x: 54, w: 62 },
  { id: 'plug', x: 116, w: 52 },
  { id: 'relief', x: 168, w: 28 },
  { id: 'jacket', x: 196, w: 54 },
  { id: 'shield', x: 250, w: 38 },
  { id: 'insulation', x: 288, w: 26 },
  { id: 'conductors', x: 314, w: 46 },
];

const EXPLODED_W = 360;
const EXPLODED_H = 150;

/** `controls`: the page's readout for the selected part, docked under the
 *  drawing in FULL SCREEN (D35, full-screen pass 2026-09-30); the SVG hit
 *  zones are the control itself and keep working at every zoom. The drawing
 *  is rendered through ExpandableFigure at (w, w ÷ aspect) — it used to be a
 *  fixed 150 pt tall and letterboxed at every width. */
export function ExplodedCable({ selected, onSelect, controls }: { selected: string | null; onSelect: (id: string) => void; controls?: ReactNode }) {
  const hi = (id: string) => (selected === id ? INK.hi : undefined);
  const sw = (id: string) => (selected === id ? 2.5 : 1);
  return (
    <ExpandableFigure aspect={EXPLODED_W / EXPLODED_H} title="THE CABLE" controls={controls} render={(w, h) => (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel="Exploded cable diagram: equipment jack on the left, then the plug, strain relief, and the cable opened up layer by layer — jacket, shield, insulation, signal conductors. Tap a zone or use the part list below.">
      <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" viewBox={`0 0 ${EXPLODED_W} ${EXPLODED_H}`} width={w} height={h}>
        {/* equipment panel + jack */}
        <Rect x={4} y={30} width={46} height={90} rx={6} fill={INK.panel} stroke={hi('jack') ?? '#33373d'} strokeWidth={sw('jack')} onPress={() => onSelect('jack')} />
        <Circle cx={27} cy={75} r={14} fill="#0c0d0f" stroke={hi('jack') ?? INK.metalDark} strokeWidth={sw('jack')} onPress={() => onSelect('jack')} />
        <Circle cx={27} cy={75} r={5} fill="#000" stroke={INK.metalDark} strokeWidth={1} />
        <SvgText x={27} y={140} fill={hi('jack') ?? '#7d8590'} fontSize={10} textAnchor="middle">JACK</SvgText>

        {/* contacts (plug tip area) */}
        <G onPress={() => onSelect('contacts')}>
          <Rect x={66} y={68} width={26} height={14} rx={7} fill={INK.metal} stroke={hi('contacts') ?? INK.metalDark} strokeWidth={sw('contacts')} />
          <Rect x={92} y={70} width={8} height={10} fill={INK.shell} />
          <Rect x={100} y={68} width={16} height={14} fill={INK.metal} stroke={hi('contacts') ?? INK.metalDark} strokeWidth={sw('contacts')} />
        </G>
        <SvgText x={90} y={58} fill={hi('contacts') ?? '#7d8590'} fontSize={10} textAnchor="middle">CONTACTS</SvgText>

        {/* plug body */}
        <Rect x={116} y={62} width={52} height={26} rx={5} fill={INK.shell} stroke={hi('plug') ?? '#3a3f46'} strokeWidth={sw('plug')} onPress={() => onSelect('plug')} />
        <SvgText x={142} y={104} fill={hi('plug') ?? '#7d8590'} fontSize={10} textAnchor="middle">PLUG</SvgText>

        {/* strain relief */}
        <Path d="M168 64 L196 68 L196 82 L168 86 Z" fill="#24272c" stroke={hi('relief') ?? '#3a3f46'} strokeWidth={sw('relief')} onPress={() => onSelect('relief')} />
        <Line x1={174} y1={66} x2={174} y2={84} stroke="#3a3f46" strokeWidth={1} />
        <Line x1={181} y1={67} x2={181} y2={83} stroke="#3a3f46" strokeWidth={1} />
        <Line x1={188} y1={67} x2={188} y2={83} stroke="#3a3f46" strokeWidth={1} />
        <SvgText x={182} y={58} fill={hi('relief') ?? '#7d8590'} fontSize={10} textAnchor="middle">RELIEF</SvgText>

        {/* jacket */}
        <Rect x={196} y={68} width={54} height={14} rx={7} fill={INK.jacket} stroke={hi('jacket') ?? '#164a9e'} strokeWidth={sw('jacket')} onPress={() => onSelect('jacket')} />
        <SvgText x={223} y={100} fill={hi('jacket') ?? '#7d8590'} fontSize={10} textAnchor="middle">JACKET</SvgText>

        {/* shield (peeled braid) */}
        <G onPress={() => onSelect('shield')}>
          <Rect x={250} y={70} width={38} height={10} rx={5} fill={INK.shield} stroke={hi('shield') ?? '#8b939c'} strokeWidth={sw('shield')} />
          <Line x1={254} y1={70} x2={262} y2={80} stroke="#8b939c" strokeWidth={0.8} />
          <Line x1={262} y1={70} x2={270} y2={80} stroke="#8b939c" strokeWidth={0.8} />
          <Line x1={270} y1={70} x2={278} y2={80} stroke="#8b939c" strokeWidth={0.8} />
          <Line x1={278} y1={70} x2={286} y2={80} stroke="#8b939c" strokeWidth={0.8} />
        </G>
        <SvgText x={269} y={60} fill={hi('shield') ?? '#7d8590'} fontSize={10} textAnchor="middle">SHIELD</SvgText>

        {/* insulation */}
        <G onPress={() => onSelect('insulation')}>
          <Rect x={288} y={66} width={26} height={7} rx={3.5} fill={INK.insul} stroke={hi('insulation') ?? '#a05f18'} strokeWidth={sw('insulation')} />
          <Rect x={288} y={77} width={26} height={7} rx={3.5} fill="#3d7dd6" stroke={hi('insulation') ?? '#2b5ca3'} strokeWidth={sw('insulation')} />
        </G>
        <SvgText x={301} y={100} fill={hi('insulation') ?? '#7d8590'} fontSize={10} textAnchor="middle">INSUL.</SvgText>

        {/* conductors */}
        <G onPress={() => onSelect('conductors')}>
          <Rect x={314} y={68} width={40} height={3.4} fill={INK.copper} stroke={hi('conductors') ?? '#a8862c'} strokeWidth={sw('conductors') - 0.5} />
          <Rect x={314} y={79} width={40} height={3.4} fill={INK.copper} stroke={hi('conductors') ?? '#a8862c'} strokeWidth={sw('conductors') - 0.5} />
        </G>
        {/* Anchored at the right edge: centred on 334 it ran past the
            viewBox and read "CONDUCTOR" (full-screen pass 2026-09-30). */}
        <SvgText x={357} y={60} fill={hi('conductors') ?? '#7d8590'} fontSize={10} textAnchor="end">CONDUCTORS</SvgText>

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