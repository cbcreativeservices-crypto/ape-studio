/**
 * Amp lab shared kit — the reusable presentation pieces every module uses
 * (build spec Part 4 §2): cards, sliders, learn-more expanders, formula and
 * misconception cards, fault banner, knowledge-check card.
 *
 * COLOR LANGUAGE (one meaning per color, everywhere in this lab; never the
 * only channel — line style / labels / icons back every state):
 *   input signal  cyan  · labels, legends, diagram arrows
 *   output signal green · labels, legends, diagram arrows
 *   + device path gold  · solid
 *   − device path purple· dashed
 *   supply energy amber · dotted arrows
 *   fault/unsafe  red   · banner + text label
 * The signal TRACES themselves and every LEVEL slider follow the app-wide
 * amplitude colour standard (owner 2026-09-05): MIDI-0 blue at silence →
 * green → yellow → orange → red at the rail (`features/tools/levelColor`).
 */
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, LayoutChangeEvent, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../../../theme/tokens';
import { levelColor, rampColors } from '../../../features/tools/levelColor';
import { usePulseStyle } from '../../../features/lab/attentionPulse';
import type { AmpCheck, Misconception } from '../../../features/amp/ampContent';
import { FAULT_COPY } from '../../../features/amp/ampContent';
import { hashSeed, shuffledIndices, type FaultId } from '../../../features/amp/ampModel';

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
        aria-expanded={open}
        style={styles.learnMoreHead}
      >
        <Text style={styles.learnMoreTitle}>{open ? '▾' : '▸'} {title}</Text>
      </Pressable>
      {open ? <View style={{ gap: 8, paddingBottom: 8 }}>{children}</View> : null}
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
      aria-expanded={open}
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

/** Cap width. MUST equal `styles.sliderCap.width`, and the travel lane must be
 *  inset by half of it at each end, or the touch map stops being the inverse of
 *  the cap position. */
const CAP_W = 24;

export function ControlSlider({
  label, value, min, max, step = 0.01, unit = '', onChange, format, disabled, level,
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
  /** This slider sets a LEVEL (input level, drive, gain-staging level…): the
   *  fill climbs the amplitude ramp from silence-blue to the level's colour and
   *  the thumb takes that colour, so the control speaks the same colour language
   *  as the traces it drives (owner standard 2026-09-05). Leave off for bias,
   *  turns, rail voltage, ratios and other non-level parameters. */
  level?: boolean;
}) {
  // Every slider thumb breathes (5 s: 2.5 s brighter, 2.5 s dimmer) so the
  // control reads as interactable — owner 2026-09-05.
  const pulseStyle = usePulseStyle(!disabled);
  const wRef = useRef(1);
  const set = useCallback(
    (x: number) => {
      // Read the touch in the SAME inset lane the cap travels in. The cap's
      // centre sits at `frac*(W - CAP_W) + CAP_W/2`, so mapping a raw `x/W`
      // is not its inverse: the two agree only at dead centre and diverge to
      // CAP_W/2 at each end (3.75% of range on a 320pt track). The felt bug
      // was that PUTTING A FINGER ON THE CAP moved it — up to 1.5 dB on the
      // de-esser's threshold — and that the cap ran ahead of the finger
      // through a drag, crossing under it at the midpoint. Introduced with
      // the inset travel lane in the 2026-09-11 gear pass, which took the
      // rack lane's look without its geometry contract; ParamLane.tsx has
      // always done this correctly.
      const frac = Math.min(1, Math.max(0, (x - CAP_W / 2) / Math.max(1, wRef.current - CAP_W)));
      const raw = min + frac * (max - min);
      const snapped = Math.round(raw / step) * step;
      onChange(Math.min(max, Math.max(min, snapped)));
    },
    [min, max, step, onChange],
  );
  // The PanResponder is created ONCE; its handlers must read the CURRENT
  // `set`/`disabled` through refs — the first render's closure would otherwise
  // drive every later drag with a stale onChange/min/max/step (callers pass
  // inline arrows that close over their own state) and a stale disabled flag.
  const setRef = useRef(set);
  setRef.current = set;
  const disabledRef = useRef(!!disabled);
  disabledRef.current = !!disabled;
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: (_e, g) => !disabledRef.current && Math.abs(g.dx) > Math.abs(g.dy),
      // Once a horizontal drag is ours, the parent ScrollView must not take it back.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => setRef.current(e.nativeEvent.locationX),
      onPanResponderMove: (e) => setRef.current(e.nativeEvent.locationX),
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
        // RNW 0.21 drops the accessibilityValue object. aria-valuenow is REQUIRED
        // on role=slider, so the numeric bounds ride alongside the formatted text.
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={shown}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        // A disabled slider is dimmed and ignores touch, but said nothing to a
        // screen reader and still moved on an increment action. No caller
        // passes `disabled` today; this keeps the first one that does honest.
        accessibilityState={{ disabled: !!disabled }}
        aria-disabled={!!disabled}
        onAccessibilityAction={(e) => {
          if (disabled) return;
          const d = (max - min) / 10;
          if (e.nativeEvent.actionName === 'increment') onChange(Math.min(max, value + d));
          if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(min, value - d));
        }}
      >
        {level ? (
          <LinearGradient
            colors={rampColors(frac)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.sliderFill, { width: `${Math.round(frac * 100)}%`, opacity: 0.55 }]}
          />
        ) : (
          <View style={[styles.sliderFill, { width: `${Math.round(frac * 100)}%` }]} />
        )}
        {/* A brushed CAP with a coloured indicator line, not a bare coloured
            bar (gear design pass 2026-09-11). This one component is the
            continuous control in the whole amp lab, the de-esser, the envelope
            lab and the patchbay pages, so the fader vocabulary the mixing
            console and the rack dock speak reaches all of them from here.
            The LEVEL ramp keeps its colour — it moves to the line, which is
            what you read against the scale. */}
        {/* The cap travels inside an INSET lane, not the full width. A 24 pt
            cap positioned at 0% / 100% of a clipped track loses half of itself
            at each end — the old 5 pt bar never showed the problem. A real cap
            travels within its slot and stays whole. */}
        <View pointerEvents="none" style={styles.sliderCapTravel}>
          {/* Unrounded percent: `Math.round(frac*100)` pinned the cap to 101
              stops, so a control with more steps than that (the de-esser's
              detector frequency, the envelope's attack/decay/release/hold)
              moved its readout without moving its cap. */}
          <View style={[styles.sliderCap, { left: `${frac * 100}%` }]}>
            {/* The PULSE rides the indicator LINE, not the cap body. It is an
                opacity animation, so on the body it faded the brushed metal
                and its border to 42% twice a cycle and the track showed
                through the "metal" — the same mistake as flooding a cap with
                tint, which the owner ruled against on 2026-09-11. */}
            <Animated.View
              style={[styles.sliderCapLine, { backgroundColor: level ? levelColor(frac) : colors.green }, pulseStyle]}
            />
          </View>
        </View>
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
            aria-selected={value === o.key}
          >
            <Text style={[styles.segText, value === o.key && styles.segTextOn]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/* ── knowledge check (instructional: explain, allow retry) ──────────────── */

/**
 * Options are dealt in a presentation order (stable for this mount) and
 * judged by AUTHORED index. Only the FIRST pick is reported to `onAnswered`
 * (that is the mastery record); later picks are the learner applying the
 * explanation — which is why a wrong pick shows the explanation but does NOT
 * light up the correct option (it used to, then asked you to "pick again").
 */
export function CheckCard({
  check, onAnswered,
}: {
  check: AmpCheck;
  onAnswered?: (correct: boolean) => void;
}) {
  const mountSeed = useRef(Math.floor(Math.random() * 0x7fffffff)).current;
  const order = useMemo(
    () => (check.keepOrder ? check.options.map((_, i) => i) : shuffledIndices(check.options.length, hashSeed(check.id) ^ mountSeed)),
    [check.id, check.keepOrder, check.options.length, mountSeed],
  );
  const [picked, setPicked] = useState<number | null>(null); // authored index
  const [attempts, setAttempts] = useState(0);
  const reported = useRef(false);
  const answered = picked != null;
  const correct = picked === check.correct;
  return (
    <Card tone="accent">
      <Text style={styles.checkQ}>{check.q}</Text>
      <View style={{ gap: 6 }}>
        {order.map((i) => {
          const o = check.options[i];
          const isRight = answered && correct && i === check.correct;
          const isWrongPick = answered && picked === i && !correct;
          return (
            <Pressable
              key={i}
              disabled={answered && correct}
              onPress={() => {
                const ok = i === check.correct;
                setPicked(i);
                setAttempts((a) => a + 1);
                if (!reported.current) {
                  reported.current = true;
                  onAnswered?.(ok);
                }
                AccessibilityInfo.announceForAccessibility?.(ok ? 'Correct.' : 'Not quite — read the explanation, then choose again.');
              }}
              style={[styles.checkOpt, isRight && styles.checkRight, isWrongPick && styles.checkWrong]}
              accessibilityRole="button"
              accessibilityState={{ disabled: answered && correct, selected: picked === i }}
              aria-disabled={answered && correct}
              aria-pressed={picked === i}
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
          {correct
            ? `✓ ${check.explain}${attempts > 1 ? ' (Got there on the retry — the first pick is what the summary records.)' : ''}`
            : `✗ Not quite. ${check.explain} — now choose the option that fits.`}
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
  // Honesty labels CARRY MEANING (illustrative / relative / conceptual) — they
  // sit at the chrome floor's top, not below it.
  honesty: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.5 },
  learnMore: { borderRadius: 10, borderWidth: 1, borderColor: colors.hairlineDim, paddingHorizontal: 10, paddingVertical: 2, gap: 4, backgroundColor: '#101013' },
  learnMoreHead: { minHeight: 44, justifyContent: 'center' }, // 44pt target
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
    height: 44, borderRadius: 10, backgroundColor: '#141418', borderWidth: 1, borderColor: colors.hairline,
    // Caught light along the top edge — the difference between a panel and a
    // card, and the same cue the console strip and the rack lane use.
    borderTopColor: '#3a3a42',
    justifyContent: 'center', overflow: 'hidden',
  },
  sliderFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#1d2b22' },
  /** The cap: brushed body standing proud of the panel, with the value line
   *  inside it. Geometry deliberately matches the rack dock lane so a student
   *  meets ONE fader across the whole app. */
  /** Inset by half a cap at each end so the cap never clips. */
  sliderCapTravel: { position: 'absolute', left: 12, right: 12, top: 0, bottom: 0 },
  sliderCap: {
    position: 'absolute',
    width: 24,
    top: 5,
    bottom: 5,
    marginLeft: -12,
    borderRadius: 4,
    backgroundColor: '#26262c',
    borderWidth: 1,
    borderColor: '#3d3d46',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sliderCapLine: { width: 2.5, height: 20, borderRadius: 1.25 },
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
