/**
 * Amp lab shared kit — the reusable presentation pieces every module uses
 * (build spec Part 4 §2): cards, sliders, learn-more expanders, formula and
 * misconception cards, fault banner, knowledge-check card.
 *
 * COLOR LANGUAGE (one meaning per color, everywhere in this lab; never the
 * only channel — line style / labels / icons back every state):
 *   input signal  cyan  · thin solid line
 *   output signal green · thick solid line
 *   + device path gold  · solid
 *   − device path purple· dashed
 *   supply energy amber · dotted arrows
 *   fault/unsafe  red   · banner + text label
 */
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, LayoutChangeEvent, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { AmpCheck, Misconception } from '../../../features/amp/ampContent';
import { FAULT_COPY } from '../../../features/amp/ampContent';
import type { FaultId } from '../../../features/amp/ampModel';

export const AMP_COLORS = {
  input: colors.cyan,
  output: colors.green,
  pos: colors.gold,
  neg: colors.purple,
  supply: colors.amber,
  fault: colors.red,
  recovered: colors.greenBright,
} as const;

/* ── text + layout primitives ───────────────────────────────────────────── */

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Body({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function Card({ children, tone }: { children: ReactNode; tone?: 'plain' | 'accent' }) {
  return <View style={[styles.card, tone === 'accent' && styles.cardAccent]}>{children}</View>;
}

/** Small caps badge for honesty labels: CONCEPTUAL / THEORETICAL / RELATIVE. */
export function HonestyBadge({ label }: { label: string }) {
  return <Text style={styles.honesty}>{label.toUpperCase()}</Text>;
}

export function LearnMore({ title = 'LEARN MORE', children }: { title?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.learnMore}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.learnMoreHead}
      >
        <Text style={styles.learnMoreTitle}>{open ? '▾' : '▸'} {title}</Text>
      </Pressable>
      {open ? <View style={{ gap: 8 }}>{children}</View> : null}
    </View>
  );
}

export function FormulaCard({ title, lines, note }: { title: string; lines: string[]; note?: string }) {
  return (
    <Card>
      <Text style={styles.formulaTitle}>{title}</Text>
      {lines.map((l) => (
        <Text key={l} style={styles.formula}>{l}</Text>
      ))}
      {note ? <Text style={styles.formulaNote}>{note}</Text> : null}
    </Card>
  );
}

export function TakeawayCard({ children }: { children: ReactNode }) {
  return (
    <View style={styles.takeaway}>
      <Text style={styles.takeawayLabel}>TAKEAWAY</Text>
      <Text style={styles.takeawayText}>{children}</Text>
    </View>
  );
}

export function MisconceptionCard({ m }: { m: Misconception }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen(!open)}
      style={styles.miscon}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={`Misconception: ${m.statement}`}
    >
      <Text style={styles.misconVerdict}>{m.verdict === 'false' ? 'MYTH' : 'IT DEPENDS'}</Text>
      <Text style={styles.misconStatement}>“{m.statement}”</Text>
      <Text style={styles.misconCorrection}>{m.correction}</Text>
      {open ? <Text style={styles.misconDetail}>{m.detail}</Text> : <Text style={styles.misconMore}>tap for the full story ▸</Text>}
    </Pressable>
  );
}

/* ── fault banner (Part 3 §7: cause, action, check) ─────────────────────── */

export function FaultBanner({ primary, secondary }: { primary: FaultId | null; secondary?: FaultId[] }) {
  if (!primary) return null;
  const c = FAULT_COPY[primary];
  return (
    <View style={styles.fault} accessibilityRole="alert">
      <Text style={styles.faultTitle}>⚠ {c.title}</Text>
      <Text style={styles.faultLine}>{c.detected} {c.action}</Text>
      <Text style={styles.faultCheck}>Check: {c.check}</Text>
      {secondary && secondary.length ? (
        <Text style={styles.faultSecondary}>
          Also present: {secondary.map((f) => FAULT_COPY[f].title.toLowerCase()).join(' · ')}
        </Text>
      ) : null}
    </View>
  );
}

/* ── slider (≥44pt target, accessible, tap + drag) ──────────────────────── */

export function ControlSlider({
  label, value, min, max, step = 0.01, unit = '', onChange, format, disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  disabled?: boolean;
}) {
  const wRef = useRef(1);
  const set = useCallback(
    (x: number) => {
      const frac = Math.min(1, Math.max(0, x / wRef.current));
      const raw = min + frac * (max - min);
      const snapped = Math.round(raw / step) * step;
      onChange(Math.min(max, Math.max(min, snapped)));
    },
    [min, max, step, onChange],
  );
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: (_e, g) => !disabled && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: (e) => set(e.nativeEvent.locationX),
      onPanResponderMove: (e) => set(e.nativeEvent.locationX),
    }),
  ).current;
  const frac = (value - min) / (max - min || 1);
  const shown = format ? format(value) : `${Math.round(value * 100) / 100}${unit}`;
  return (
    <View style={[styles.sliderWrap, disabled && { opacity: 0.4 }]}>
      <View style={styles.sliderHead}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{shown}</Text>
      </View>
      <View
        {...pan.panHandlers}
        onLayout={(e: LayoutChangeEvent) => { wRef.current = Math.max(1, e.nativeEvent.layout.width); }}
        style={styles.sliderTrack}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: shown }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          const d = (max - min) / 10;
          if (e.nativeEvent.actionName === 'increment') onChange(Math.min(max, value + d));
          if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(min, value - d));
        }}
      >
        <View style={[styles.sliderFill, { width: `${Math.round(frac * 100)}%` }]} />
        <View style={[styles.sliderThumb, { left: `${Math.round(frac * 100)}%` }]} />
      </View>
    </View>
  );
}

/* ── segmented choice row (class selector, view toggles) ────────────────── */

export function SegRow<T extends string | number>({
  options, value, onChange, label,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      {label ? <Text style={styles.sliderLabel}>{label}</Text> : null}
      <View style={styles.segRow} accessibilityRole="tablist">
        {options.map((o) => (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[styles.segBtn, value === o.key && styles.segBtnOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: value === o.key }}
          >
            <Text style={[styles.segText, value === o.key && styles.segTextOn]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/* ── knowledge check (instructional: explain, allow retry) ──────────────── */

export function CheckCard({
  check, onAnswered,
}: {
  check: AmpCheck;
  onAnswered?: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked != null;
  const correct = picked === check.correct;
  return (
    <Card tone="accent">
      <Text style={styles.checkQ}>{check.q}</Text>
      <View style={{ gap: 6 }}>
        {check.options.map((o, i) => {
          const isRight = answered && i === check.correct;
          const isWrongPick = answered && picked === i && !correct;
          return (
            <Pressable
              key={i}
              disabled={answered && correct}
              onPress={() => {
                setPicked(i);
                onAnswered?.(i === check.correct);
                AccessibilityInfo.announceForAccessibility?.(
                  i === check.correct ? 'Correct.' : 'Not quite — see the explanation.',
                );
              }}
              style={[styles.checkOpt, isRight && styles.checkRight, isWrongPick && styles.checkWrong]}
              accessibilityRole="button"
              accessibilityLabel={o}
            >
              <Text style={[styles.checkOptText, isRight && { color: colors.green }, isWrongPick && { color: colors.red }]}>
                {o}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {answered ? (
        <Text style={[styles.checkExplain, { color: correct ? colors.green : colors.gold }]}>
          {correct ? '✓ ' : ''}{check.explain}{!correct ? ' — pick again with that in mind.' : ''}
        </Text>
      ) : null}
    </Card>
  );
}

/* ── styles ─────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  sectionTitle: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 2, marginTop: 12 },
  body: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  card: { borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#131315', padding: 12, gap: 6 },
  cardAccent: { borderColor: colors.steelBorder, backgroundColor: '#121216' },
  honesty: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.5 },
  learnMore: { borderRadius: 10, borderWidth: 1, borderColor: colors.hairlineDim, padding: 10, gap: 6, backgroundColor: '#101013' },
  learnMoreHead: { minHeight: 32, justifyContent: 'center' },
  learnMoreTitle: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 1.5 },
  formulaTitle: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 13 },
  formula: { color: colors.cyanBright, fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 21 },
  formulaNote: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  takeaway: { borderRadius: 12, borderWidth: 1, borderColor: colors.green, backgroundColor: '#0f2416', padding: 14, gap: 4, marginTop: 8 },
  takeawayLabel: { color: colors.green, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 2 },
  takeawayText: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 20 },
  miscon: { borderRadius: 12, borderWidth: 1, borderColor: colors.steelBorder, backgroundColor: '#15121a', padding: 12, gap: 5 },
  misconVerdict: { color: colors.purple, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 2 },
  misconStatement: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, fontStyle: 'italic' },
  misconCorrection: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  misconDetail: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  misconMore: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11 },
  fault: { borderRadius: 12, borderWidth: 1.5, borderColor: colors.red, backgroundColor: '#241012', padding: 12, gap: 4 },
  faultTitle: { color: colors.red, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1 },
  faultLine: { color: colors.textPrimary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  faultCheck: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  faultSecondary: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11.5 },
  sliderWrap: { gap: 6, minHeight: 56 },
  sliderHead: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
  sliderValue: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 13 },
  sliderTrack: {
    height: 44, borderRadius: 10, backgroundColor: '#101013', borderWidth: 1, borderColor: colors.hairline,
    justifyContent: 'center', overflow: 'hidden',
  },
  sliderFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#1d2b22' },
  sliderThumb: {
    position: 'absolute', width: 4, top: 4, bottom: 4, marginLeft: -2, borderRadius: 2, backgroundColor: colors.green,
  },
  segRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  segBtn: {
    minHeight: 44, minWidth: 52, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#131315',
  },
  segBtnOn: { borderColor: colors.green, backgroundColor: '#12241a' },
  segText: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
  segTextOn: { color: colors.green },
  checkQ: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19 },
  checkOpt: {
    minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, justifyContent: 'center',
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#101013',
  },
  checkRight: { borderColor: colors.green, backgroundColor: '#0f2416' },
  checkWrong: { borderColor: colors.red, backgroundColor: '#241012' },
  checkOptText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13.5 },
  checkExplain: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
