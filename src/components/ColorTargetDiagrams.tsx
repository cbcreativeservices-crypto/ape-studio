/**
 * ColorTargetDiagrams — "show, don't label" (owner redesign 2026-09-01, spec at
 * docs/APE_COLOR_PICKER_REDESIGN_SPEC_2026_09_01.md).
 *
 * The member colour pickers never SHOWED what each category recolours. Each
 * diagram here is a tiny SVG of the REAL instrument with the affected part lit
 * in the LIVE pref colour and everything else in fixed dim steel — so every
 * swatch tap repaints the mini instrument, and the popup doubles as a legend.
 *
 * Rules baked in:
 *  • The white peak-hold cap is drawn white in EVERY state (reference reading).
 *  • The LEVEL diagram decodes prefs through the same resolveLedFill() +
 *    stopsColorAt() the real meter uses, so it can never disagree with it.
 *  • Diagrams are decorative — hidden from screen readers; meaning is carried
 *    by PickerSectionHeader's title + subtitle.
 */
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { LED_AVG_DEFAULT, resolveLedFill } from '../features/tools/ledScheme';
import { stopsColorAt } from '../features/tools/levelColor';
import { colors, fonts } from '../theme/tokens';

/** Every flat-colour diagram takes the LIVE pref; null = that tool's default. */
export type DiagramTint = {
  /** '#rrggbb' flat pick, or null for the tool default. */
  tint: string | null;
  /** What null means for THIS instrument (e.g. the RTA teal, the tuner green). */
  defaultTint: string;
};

// Dim-steel palette — the "not the target" ink. Fixed, never the pref colour.
const DIM_LIT = '#3d4049'; // on, but not what this section colours
const DIM_UNLIT = '#1a1a1f'; // unlit LED segments
const DIM_LINE = '#565a63'; // dim marker lines / ticks
const HOUSING_STROKE = '#33333c';
const HOUSING_FILL = '#0b0b0e';

// ── LED miniature shared geometry (a faithful mini PeakAvgMeterView) ────────
// 13 segments; demo pose: average at the top of segment 3, peak at segment 9.
const SEG_N = 13;
const AVG_TOP = 3; // segments 0..3 = the avg fill
const PEAK_TOP = 9; // segments 4..9 = the moving peak fill
const segY = (i: number) => 52.6 - (i + 1) * 3.8;

function LedMini({ levelPref, avgTint, target }: { levelPref: string | null; avgTint: string | null; target: 'level' | 'avg' }) {
  const fill = resolveLedFill(levelPref);
  const avg = avgTint ?? LED_AVG_DEFAULT;
  const segs: ReactNode[] = [];
  for (let i = 0; i < SEG_N; i++) {
    let color: string;
    let opacity = 1;
    if (i <= AVG_TOP) {
      // The avg-fill region.
      if (target === 'avg') {
        color = avg;
        opacity = 0.8; // the real meter's avg fill reads quieter than its line
      } else {
        color = DIM_LIT;
      }
    } else if (i <= PEAK_TOP) {
      // The moving peak fill.
      if (target === 'level') {
        color = 'flat' in fill ? fill.flat : stopsColorAt(fill.stops, 1 - i / (SEG_N - 1));
      } else {
        color = DIM_LIT;
      }
    } else {
      color = DIM_UNLIT;
    }
    segs.push(<Rect key={i} x={11.5} y={segY(i)} width={13} height={3} fill={color} fillOpacity={opacity} />);
  }
  return (
    <Svg width={40} height={56} viewBox="0 0 36 56" preserveAspectRatio="xMidYMid meet">
      <Rect x={9} y={1.5} width={18} height={53} rx={3.5} fill={HOUSING_FILL} stroke={HOUSING_STROKE} strokeWidth={1} />
      {segs}
      {/* Average marker line — the AVG target's headline element. */}
      <Rect
        x={8}
        y={segY(AVG_TOP) - (target === 'avg' ? 0.9 : 0.8)}
        width={20}
        height={target === 'avg' ? 1.8 : 1.6}
        fill={target === 'avg' ? avg : DIM_LINE}
      />
      {/* White peak-hold cap — ALWAYS white (reference reading). */}
      <Rect x={11.5} y={segY(PEAK_TOP) - 2.8} width={13} height={2} fill="#ffffff" />
      {/* Scale ticks. */}
      {[2, 6, 10].map((i) => (
        <Line key={i} x1={28.5} x2={30.5} y1={segY(i)} y2={segY(i)} stroke="#3c3c3c" strokeWidth={1} />
      ))}
    </Svg>
  );
}

/** LEVEL section: the moving peak fill lit in the live pref (scheme or flat). */
export function LedLevelDiagram({ pref }: { pref: string | null }): ReactNode {
  return <LedMini levelPref={pref} avgTint={null} target="level" />;
}

/** AVERAGE MARKER section: the avg line + bottom fill lit; peak dimmed.
 *  (levelPref is irrelevant in avg mode — the peak region draws DIM_LIT.) */
export function LedAvgDiagram({ tint }: { tint: string | null }): ReactNode {
  return <LedMini levelPref={null} avgTint={tint} target="avg" />;
}

/** RTA BAR COLOUR: a 10-bar spectrum silhouette in the live tint. */
export function RtaBarsDiagram({ tint, defaultTint }: DiagramTint): ReactNode {
  const c = tint ?? defaultTint;
  const heights = [10, 17, 26, 34, 38, 33, 25, 18, 12, 8];
  return (
    <Svg width={62} height={44} viewBox="0 0 88 44" preserveAspectRatio="xMidYMid meet">
      <Line x1={3} x2={85} y1={40} y2={40} stroke="#2b2b33" strokeWidth={1} />
      {heights.map((h, i) => (
        <Rect key={i} x={4 + i * 8.2} y={40 - h} width={6.2} height={h} rx={1} fill={c} />
      ))}
      {/* Peak-hold caps stay dim — the pref does not colour PK-hold. */}
      {heights.map((h, i) => (
        <Rect key={`c${i}`} x={4 + i * 8.2} y={40 - h - 3.5} width={6.2} height={1} fill={DIM_LINE} />
      ))}
    </Svg>
  );
}

/** Waveform TRACE COLOUR: a decaying sine in the live tint over a dim midline. */
export function WaveTraceDiagram({ tint, defaultTint }: DiagramTint): ReactNode {
  const c = tint ?? defaultTint;
  return (
    <Svg width={62} height={44} viewBox="0 0 88 44" preserveAspectRatio="xMidYMid meet">
      {/* Deliberately dim (not MIDLINE_BLUE): a blue line in a colour picker
          would read as a pickable colour. */}
      <Line x1={2} x2={86} y1={22} y2={22} stroke="#2b2b33" strokeWidth={1} />
      <Path
        d="M2 22 C7 5 12 5 17 22 C22 39 27 39 32 22 C37 7 42 7 47 22 C52 36 57 36 62 22 C67 12 72 12 77 22 C80 27 83 27 86 24"
        stroke={c}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/** TUNER COLOUR: the in-tune needle, centre marker and glow in the live tint. */
export function TunerDiagram({ tint, defaultTint }: DiagramTint): ReactNode {
  const c = tint ?? defaultTint;
  return (
    <Svg width={62} height={44} viewBox="0 0 88 44" preserveAspectRatio="xMidYMid meet">
      {[0, 1, 2, 4, 5, 6].map((i) => (
        <Line key={i} x1={14 + i * 10} x2={14 + i * 10} y1={6} y2={14} stroke={DIM_LINE} strokeWidth={1.5} />
      ))}
      {/* Centre marker, glow, needle — the target, drawn dead-vertical (in tune). */}
      <Line x1={44} x2={44} y1={3} y2={16} stroke={c} strokeWidth={2.5} />
      <Circle cx={44} cy={12} r={6} fill={c} fillOpacity={0.25} />
      <Line x1={44} y1={41} x2={44} y2={11} stroke={c} strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx={44} cy={41} r={2.5} fill={DIM_LINE} />
    </Svg>
  );
}

/**
 * PickerSectionHeader — the shared header anatomy: a recessed diagram well
 * (live-updating) beside a left-aligned title + one-line "what this colours"
 * subtitle. The diagram is decorative; title+subtitle are one a11y element.
 */
export function PickerSectionHeader({ diagram, title, subtitle }: { diagram: ReactNode; title: string; subtitle: string }): ReactNode {
  return (
    <View style={hdr.row}>
      <View style={hdr.well} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {diagram}
      </View>
      <View style={hdr.textCol} accessible accessibilityLabel={`${title}. ${subtitle}`}>
        <Text style={hdr.title}>{title}</Text>
        <Text style={hdr.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const hdr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  well: {
    width: 64,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2b2b33',
    backgroundColor: '#101014',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textMuted, marginTop: 2 },
});
