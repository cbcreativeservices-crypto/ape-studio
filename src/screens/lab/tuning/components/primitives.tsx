/**
 * Tuning lab shared primitives (spec Stage 1 §7–8): the visual grammar
 * (roles → theme tokens, never color alone), RatioTile, CentsRail,
 * EquationStage, DeviationMeter, AudioComparisonControls, and the text kit.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import type { DisplayValue } from '../../../../features/tuning/tuningMath';
import { fmtDecimal } from '../../../../features/tuning/tuningMath';
import type { PlayerStatus, TuningPlayer } from '../../../../features/tuning/tuningAudio';
import type { Mono } from '../../../../features/ear/earDsp';

/** Instructional color roles (spec §7) mapped onto Academy tokens. */
export const ROLE = {
  neutral: colors.textSecondary,
  active: colors.cyanBright, // current selection / note / system
  operation: colors.gold, // the factor being applied
  octave: colors.blue, // ×2 / ÷2 movement
  exact: colors.green, // exact alignment / target
  near: colors.gold, // moderate difference
  error: colors.red, // failure to close / wolf
  muted: colors.textMuted,
} as const;

/* ── text kit ───────────────────────────────────────────────────────────── */

export function Lead({ children }: { children: ReactNode }) {
  return <Text style={styles.lead}>{children}</Text>;
}
export function Body({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}
export function Prompt({ children }: { children: ReactNode }) {
  return <Text style={styles.prompt}>▸ {children}</Text>;
}
export function Card({ children, tone }: { children: ReactNode; tone?: 'plain' | 'math' | 'ok' | 'warn' }) {
  return (
    <View style={[styles.card, tone === 'math' && styles.cardMath, tone === 'ok' && styles.cardOk, tone === 'warn' && styles.cardWarn]}>
      {children}
    </View>
  );
}
export function MathLine({ children, emphasis }: { children: ReactNode; emphasis?: boolean }) {
  return <Text style={[styles.mathLine, emphasis && { color: ROLE.operation }]}>{children}</Text>;
}
export function Btn({ label, onPress, tone = 'plain', disabled, a11y }: { label: string; onPress: () => void; tone?: 'plain' | 'primary' | 'danger'; disabled?: boolean; a11y?: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, tone === 'primary' && styles.btnPrimary, tone === 'danger' && styles.btnDanger, disabled && { opacity: 0.4 }]}
      accessibilityRole="button"
      accessibilityLabel={a11y ?? label}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={[styles.btnText, tone === 'primary' && { color: colors.green }, tone === 'danger' && { color: colors.red }]}>{label}</Text>
    </Pressable>
  );
}
export function Row({ children, wrap = true }: { children: ReactNode; wrap?: boolean }) {
  return <View style={[styles.row, wrap && { flexWrap: 'wrap' }]}>{children}</View>;
}

/* ── RatioTile ──────────────────────────────────────────────────────────── */

export function RatioTile({
  note, value, hz, selected, fresh, onPress, showDecimal, compact,
}: {
  note: string;
  value: DisplayValue;
  hz?: number;
  selected?: boolean;
  fresh?: boolean;
  onPress?: () => void;
  showDecimal?: boolean;
  compact?: boolean;
}) {
  const a11y = `${note}, ratio ${value.exactLabel}${showDecimal ? `, decimal ${value.decimalLabel}` : ''}, ${value.cents.toFixed(2)} cents${hz != null ? `, ${hz.toFixed(2)} hertz` : ''}${selected ? ', selected' : ''}${fresh ? ', new' : ''}`;
  const inner = (
    <View style={[styles.tile, compact && styles.tileCompact, selected && styles.tileSelected, fresh && styles.tileFresh]} accessible accessibilityLabel={a11y} accessibilityRole={onPress ? 'button' : 'text'} accessibilityState={{ selected: !!selected }}>
      <Text style={[styles.tileNote, selected && { color: ROLE.active }]}>{note}{fresh ? ' ✦' : ''}</Text>
      <Text style={[styles.tileRatio, fresh && { color: ROLE.operation }]}>{value.exactLabel}</Text>
      {showDecimal ? <Text style={styles.tileSub}>≈ {value.decimalLabel}</Text> : null}
      {hz != null ? <Text style={styles.tileSub}>{hz.toFixed(2)} Hz</Text> : null}
      {!compact ? <Text style={styles.tileSub}>{value.cents.toFixed(2)} ¢</Text> : null}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
}

/* ── CentsRail (logarithmic pitch axis 0–1200 ¢) ────────────────────────── */

export type RailMarker = {
  id: string;
  cents: number;
  label: string;
  role?: keyof typeof ROLE;
  /** Draw above (default) or below the axis to separate systems. */
  lane?: 0 | 1;
  emphasis?: boolean;
  /** Label row above the axis (0 = nearest); lets a moving marker's label
   *  sit above fixed ones instead of colliding. */
  row?: number;
};

const RAIL_W = 340;

const xOfCents = (c: number) => 14 + (Math.max(0, Math.min(1200, c)) / 1200) * (RAIL_W - 28);

export function CentsRail({
  markers, divisions = true, brackets, height = 96, onPressMarker, selectedId, reduceMotion,
}: {
  markers: RailMarker[];
  divisions?: boolean;
  /** Deviation brackets between two cents positions with a label. */
  brackets?: { fromCents: number; toCents: number; label: string; role?: keyof typeof ROLE }[];
  height?: number;
  onPressMarker?: (id: string) => void;
  selectedId?: string | null;
  reduceMotion?: boolean;
}) {
  const axisY = height - 30;
  // With a lower lane in use, the endpoint labels tuck under the axis so the
  // lane-1 marker labels (further down) never collide with them.
  const hasLane1 = markers.some((m) => m.lane === 1);
  const endY = hasLane1 ? axisY + 11 : height - 8;
  const summary = `Cents rail from 0 to 1200. ${markers.map((m) => `${m.label} at ${m.cents.toFixed(2)} cents`).join('; ')}.`;
  return (
    <View accessible accessibilityLabel={summary} accessibilityRole="image" style={{ width: '100%' }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${RAIL_W} ${height}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={RAIL_W} height={height} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {divisions
          ? Array.from({ length: 13 }, (_, k) => (
              <Line key={k} x1={xOfCents(k * 100)} y1={axisY - (k % 12 === 0 ? 14 : 6)} x2={xOfCents(k * 100)} y2={axisY + 4} stroke={k % 12 === 0 ? colors.textSub : 'rgba(255,255,255,0.14)'} strokeWidth={k % 12 === 0 ? 1.5 : 1} />
            ))
          : null}
        <Line x1={xOfCents(0)} y1={axisY} x2={xOfCents(1200)} y2={axisY} stroke={colors.textSub} strokeWidth={1.5} />
        <SvgText x={xOfCents(0)} y={endY} fontSize={9.5} fill={colors.textSecondary} textAnchor="start" fontFamily={fonts.oswaldMedium}>1:1 · 0 ¢</SvgText>
        <SvgText x={xOfCents(1200)} y={endY} fontSize={9.5} fill={colors.textSecondary} textAnchor="end" fontFamily={fonts.oswaldMedium}>2:1 · 1200 ¢</SvgText>
        {brackets?.map((b, i) => {
          const x1 = xOfCents(b.fromCents), x2 = xOfCents(b.toCents);
          const y = 14 + i * 12;
          const col = ROLE[b.role ?? 'near'];
          return (
            <Svg key={i}>
              <Line x1={x1} y1={y} x2={x2} y2={y} stroke={col} strokeWidth={1.5} />
              <Line x1={x1} y1={y - 4} x2={x1} y2={y + 4} stroke={col} strokeWidth={1.5} />
              <Line x1={x2} y1={y - 4} x2={x2} y2={y + 4} stroke={col} strokeWidth={1.5} />
              <SvgText x={(x1 + x2) / 2} y={y - 5} fontSize={8.5} fill={col} textAnchor="middle" fontFamily={fonts.barlowMedium}>{b.label}</SvgText>
            </Svg>
          );
        })}
        {markers.map((m) => (
          <RailMarkerGlyph key={m.id} m={m} axisY={axisY} selected={selectedId === m.id} onPress={onPressMarker ? () => onPressMarker(m.id) : undefined} reduceMotion={reduceMotion} />
        ))}
      </Svg>
    </View>
  );
}

function RailMarkerGlyph({ m, axisY, selected, onPress, reduceMotion }: { m: RailMarker; axisY: number; selected: boolean; onPress?: () => void; reduceMotion?: boolean }) {
  const x = useRef(new Animated.Value(xOfCents(m.cents))).current;
  useEffect(() => {
    if (reduceMotion) {
      x.setValue(xOfCents(m.cents));
      return;
    }
    Animated.timing(x, { toValue: xOfCents(m.cents), duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [m.cents, reduceMotion, x]);
  const col = ROLE[m.role ?? 'neutral'];
  const faint = m.role === 'muted';
  const lane = m.lane ?? 0;
  const tipY = axisY - (lane === 0 ? 2 : -2);
  const baseY = lane === 0 ? axisY - 16 : axisY + 16;
  const labelY = lane === 0 ? axisY - 20 - (m.row ?? 0) * 13 : axisY + 27;
  // Labels at the extremes anchor inward so they never clip the rail edge.
  const anchor = m.cents < 80 ? 'start' : m.cents > 1120 ? 'end' : 'middle';
  const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
  const AnimatedText = Animated.createAnimatedComponent(SvgText);
  const points = x.interpolate({
    inputRange: [0, RAIL_W],
    outputRange: [
      `0,${tipY} -6,${baseY} 6,${baseY}`,
      `${RAIL_W},${tipY} ${RAIL_W - 6},${baseY} ${RAIL_W + 6},${baseY}`,
    ],
  });
  return (
    <Svg onPress={onPress}>
      <AnimatedPolygon points={points as unknown as string} fill={selected || m.emphasis ? col : 'none'} stroke={col} strokeWidth={selected ? 2 : 1.4} opacity={faint ? 0.35 : 1} />
      <AnimatedText x={x as unknown as number} y={labelY} fontSize={m.emphasis || selected ? 10 : 9} fill={col} textAnchor={anchor} fontFamily={fonts.oswaldMedium} opacity={faint ? 0.6 : 1}>
        {m.label}
      </AnimatedText>
    </Svg>
  );
}

/* ── EquationStage (one operation at a time, learner-advanced, replayable) ── */

export type EqStep = { text: string; note?: string; emphasis?: boolean };

export function EquationStage({ steps, title, reduceMotion, autoAdvance }: { steps: EqStep[]; title?: string; reduceMotion?: boolean; autoAdvance?: boolean }) {
  const [shown, setShown] = useState(autoAdvance ? steps.length : 1);
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    setShown(autoAdvance ? steps.length : 1);
  }, [steps, autoAdvance]);
  const reveal = () => {
    if (shown >= steps.length) return;
    setShown(shown + 1);
    if (!reduceMotion) {
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }).start();
    }
    AccessibilityInfo.announceForAccessibility?.(steps[shown].text);
  };
  return (
    <Card tone="math">
      {title ? <Eyebrow>{title}</Eyebrow> : null}
      {steps.slice(0, shown).map((s, i) => (
        <Animated.View key={i} style={{ opacity: i === shown - 1 && !reduceMotion ? fade : 1 }}>
          <MathLine emphasis={s.emphasis || i === shown - 1}>{s.text}</MathLine>
          {s.note ? <Text style={styles.mathNote}>{s.note}</Text> : null}
        </Animated.View>
      ))}
      <Row>
        {shown < steps.length ? <Btn label={`NEXT STEP (${shown}/${steps.length})`} onPress={reveal} tone="primary" /> : null}
        {shown > 1 ? <Btn label="REPLAY" onPress={() => setShown(1)} /> : null}
      </Row>
    </Card>
  );
}

/* ── DeviationMeter (labeled zero, signed cents) ────────────────────────── */

export function DeviationMeter({ cents, rangeCents = 30, label }: { cents: number; rangeCents?: number; label?: string }) {
  const w = 300, h = 40;
  const x = 150 + (Math.max(-rangeCents, Math.min(rangeCents, cents)) / rangeCents) * 140;
  const exact = Math.abs(cents) < 0.05;
  const role = exact ? 'exact' : Math.abs(cents) < 8 ? 'near' : 'error';
  const state = exact ? 'exact' : cents > 0 ? 'wider' : 'narrower';
  return (
    <View accessible accessibilityLabel={`${label ?? 'Deviation'}: ${exact ? 'exact' : `${cents > 0 ? '+' : ''}${cents.toFixed(2)} cents, ${state}`}`} style={{ gap: 3 }}>
      {label ? <Eyebrow>{label}</Eyebrow> : null}
      <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
        <Rect x={0} y={0} width={w} height={h} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        <Line x1={10} y1={h / 2} x2={w - 10} y2={h / 2} stroke="rgba(255,255,255,0.15)" />
        <Line x1={150} y1={6} x2={150} y2={h - 6} stroke={colors.textSub} strokeWidth={1.5} />
        <SvgText x={150} y={h - 3} fontSize={7.5} fill={colors.textMuted} textAnchor="middle">0</SvgText>
        <SvgText x={12} y={h - 3} fontSize={7.5} fill={colors.textMuted}>−{rangeCents}¢ narrower</SvgText>
        <SvgText x={w - 12} y={h - 3} fontSize={7.5} fill={colors.textMuted} textAnchor="end">wider +{rangeCents}¢</SvgText>
        <Polygon points={`${x},${h / 2 - 9} ${x - 6},${h / 2 + 3} ${x + 6},${h / 2 + 3}`} fill={ROLE[role]} />
      </Svg>
      <Text style={[styles.meterText, { color: ROLE[role] }]}>
        {exact ? '● EXACT' : `${cents > 0 ? '+' : ''}${cents.toFixed(2)} ¢ · ${state.toUpperCase()}`}
      </Text>
    </View>
  );
}

/* ── AudioComparisonControls (A / B / Alternate / Together / Stop) ───────── */

export function AudioComparisonControls({
  player, a, b, labelA, labelB, together, note,
}: {
  player: TuningPlayer;
  a: () => Mono;
  b: () => Mono;
  labelA: string;
  labelB: string;
  /** Optional simultaneous render (e.g. C + B♯ together). */
  together?: () => Mono;
  note?: string;
}) {
  const [status, setStatus] = useState<PlayerStatus>({ playing: false, label: null });
  useEffect(() => player.subscribe(setStatus), [player]);
  return (
    <View style={{ gap: 6 }}>
      <Row>
        <Btn label={`▶ A · ${labelA}`} onPress={() => void player.play(a(), labelA)} a11y={`Play A, ${labelA}`} />
        <Btn label={`▶ B · ${labelB}`} onPress={() => void player.play(b(), labelB)} a11y={`Play B, ${labelB}`} />
        <Btn label="A → B" onPress={() => void player.play(concatAB(a(), b()), `${labelA} then ${labelB}`)} a11y="Play A then B" />
        {together ? <Btn label="TOGETHER" onPress={() => void player.play(together(), `${labelA} + ${labelB}`)} /> : null}
        <Btn label="■ STOP" tone="danger" onPress={() => player.stop()} a11y="Stop audio" />
      </Row>
      <Text style={styles.status} accessibilityLiveRegion="polite">
        {status.playing ? `♪ Playing: ${status.label}` : 'Sound: stopped'}
        {note ? ` · ${note}` : ''}
      </Text>
    </View>
  );
}

function concatAB(a: Mono, b: Mono): Mono {
  const gap = Math.round(0.35 * 48000);
  const out = new Float32Array(a.length + gap + b.length);
  out.set(a, 0);
  out.set(b, a.length + gap);
  return out;
}

/** Single play/stop pair for one clip. */
export function PlayStop({ player, render, label }: { player: TuningPlayer; render: () => Mono; label: string }) {
  const [status, setStatus] = useState<PlayerStatus>({ playing: false, label: null });
  useEffect(() => player.subscribe(setStatus), [player]);
  const mine = status.playing && status.label === label;
  return (
    <Row>
      <Btn label={mine ? `♪ ${label}` : `▶ ${label}`} onPress={() => void player.play(render(), label)} a11y={`Play ${label}`} />
      <Btn label="■" tone="danger" onPress={() => player.stop()} a11y="Stop audio" />
    </Row>
  );
}

/* ── decimal helpers for copy ───────────────────────────────────────────── */
export const hz2 = (v: number) => `${v.toFixed(2)} Hz`;
export const c2 = (v: number) => `${v.toFixed(2)} ¢`;
export const dec = (v: number, p = 6) => fmtDecimal(v, p);

const styles = StyleSheet.create({
  lead: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 16, lineHeight: 22 },
  body: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  eyebrow: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 2 },
  prompt: { color: colors.cyanBright, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19 },
  card: { borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#131315', padding: 12, gap: 6 },
  cardMath: { borderColor: '#2a2f3a', backgroundColor: '#0f1116' },
  cardOk: { borderColor: colors.green, backgroundColor: '#0f2416' },
  cardWarn: { borderColor: colors.red, backgroundColor: '#241012' },
  mathLine: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 16, lineHeight: 24 },
  mathNote: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  btn: { minHeight: 44, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center', backgroundColor: '#131315' },
  btnPrimary: { borderColor: colors.green, backgroundColor: '#173021' },
  btnDanger: { borderColor: '#4a2020', backgroundColor: '#1a0f10' },
  btnText: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.2 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  tile: { minWidth: 76, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', padding: 8, gap: 2 },
  tileCompact: { minWidth: 58, padding: 6 },
  tileSelected: { borderColor: colors.cyanBright, backgroundColor: '#0f1a22' },
  tileFresh: { borderColor: colors.gold },
  tileNote: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 15 },
  tileRatio: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 14 },
  tileSub: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11 },
  meterText: { fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1 },
  status: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12 },
});
