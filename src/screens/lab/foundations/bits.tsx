/**
 * Foundations of Sound — shared non-Skia building blocks (owner 2026-07-26).
 * These run on ANY installed client (no native dependency):
 *
 *  • CheckQuestion — the answer→reveal primitive designed into the course
 *    shell from day one (owner decision): tap an answer; wrong = red + hint,
 *    keep trying; correct = green + the reveal explanation. Never graded,
 *    never tracked (the course is freely open).
 *  • DragSlider — a minimal in-house horizontal slider (RN core has none).
 *  • LevelMeterBar — "LEVEL (dBFS · relative)" (owner ruling: this is the
 *    commanded output level, NOT acoustic SPL — "SPL" stays reserved for the
 *    real mic-based meter).
 *  • VizUnavailableCard — honest gate for pre-Skia clients (§1.7).
 *  • ConceptBadge — the standing "CONCEPTUAL MODEL — SLOWED FOR VISIBILITY"
 *    disclosure every animated panel carries.
 */
import { useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { useScrollLock } from '../LabShell';

export type CheckSpec = {
  question: string;
  options: string[];
  correctIdx: number;
  /** Shown after the correct answer — the actual teaching moment. */
  reveal: string;
  /** Shown after a wrong answer (gentle nudge, stays until solved). */
  wrongHint?: string;
};

export function CheckQuestion({ spec }: { spec: CheckSpec }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const pick = (i: number) => {
    if (solved) return;
    setPicked(i);
    if (i === spec.correctIdx) setSolved(true);
  };
  return (
    <View style={styles.checkCard}>
      <Text style={styles.checkEyebrow}>CHECK YOURSELF</Text>
      <Text style={styles.checkQuestion}>{spec.question}</Text>
      <View style={{ gap: 8 }}>
        {spec.options.map((opt, i) => {
          const isPicked = picked === i;
          const good = solved && i === spec.correctIdx;
          const bad = isPicked && !solved && i !== spec.correctIdx;
          return (
            <Pressable
              key={i}
              style={[styles.checkOpt, good && styles.checkOptGood, bad && styles.checkOptBad]}
              onPress={() => pick(i)}
              accessibilityRole="button"
              accessibilityState={{ selected: isPicked }}
              accessibilityLabel={opt}
            >
              <Text
                style={[styles.checkOptText, good && styles.checkOptTextGood, bad && styles.checkOptTextBad]}
              >
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {solved ? (
        <Text style={styles.checkReveal}>✓ {spec.reveal}</Text>
      ) : picked != null ? (
        <Text style={styles.checkHint}>{spec.wrongHint ?? 'Not quite — try again.'}</Text>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/** Minimal horizontal drag slider: value 0..1; onChange fires at drag rate
 *  (callers throttle/map as needed).
 *
 *  DRAG vs SCROLL (owner 2026-07-30): once a finger is DOWN on the track the
 *  slider claims the responder at touch-start and refuses handoff, but inside a
 *  vertical ScrollView a near-vertical drag could still steal to scroll. So the
 *  slider disables the host scroll for the gesture's duration: it grabs the
 *  scroll-lock setter from context automatically when a LabShell / ScrollLock-
 *  Provider is above it (NO prop threading), and also accepts an explicit
 *  `onDragActive` for hosts that wire their own. Value/onChange math unchanged. */
export function DragSlider({
  value,
  onChange,
  label,
  readout,
  onHelp,
  onDragActive,
}: {
  value: number; // 0..1
  onChange: (v: number) => void;
  label: string;
  readout?: string;
  /** When set, an ⓘ next to the label opens this control's help popup. */
  onHelp?: () => void;
  /** Fires true on drag start, false on release/terminate — for hosts that
   *  are NOT under a LabShell/ScrollLockProvider and wire their own lock. */
  onDragActive?: (active: boolean) => void;
}) {
  const [w, setW] = useState(0);
  const wRef = useRef(0);
  wRef.current = w;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // Scroll-lock plumbing: context (auto) + explicit prop, kept in a ref so the
  // once-created PanResponder always calls the current setters.
  const ctxLock = useScrollLock();
  const lockRef = useRef({ ctx: ctxLock, prop: onDragActive });
  lockRef.current = { ctx: ctxLock, prop: onDragActive };
  const setLock = (v: boolean) => {
    lockRef.current.ctx?.(v);
    lockRef.current.prop?.(v);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: (e) => {
        setLock(true);
        if (wRef.current > 0)
          onChangeRef.current(Math.max(0, Math.min(1, e.nativeEvent.locationX / wRef.current)));
      },
      onPanResponderMove: (e) => {
        if (wRef.current > 0)
          onChangeRef.current(Math.max(0, Math.min(1, e.nativeEvent.locationX / wRef.current)));
      },
      onPanResponderRelease: () => setLock(false),
      onPanResponderTerminate: () => setLock(false),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <View style={{ gap: 4 }}>
      <View style={styles.sliderHead}>
        <View style={styles.sliderLabelRow}>
          <Text style={styles.sliderLabel}>{label}</Text>
          {onHelp ? (
            <Pressable onPress={onHelp} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${label} — what it does`}>
              <Text style={styles.sliderInfo}>ⓘ</Text>
            </Pressable>
          ) : null}
        </View>
        {readout ? <Text style={styles.sliderReadout}>{readout}</Text> : null}
      </View>
      <View
        style={styles.sliderTrackWrap}
        onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}
        {...pan.panHandlers}
      >
        {/* pointerEvents 'none' on every child: RN reports locationX relative to
            the touched TARGET view, so a hittable child (esp. the thumb) would
            report thumb-local coords and snap the value toward 0. Making the
            children transparent keeps the wrap itself the touch target. */}
        <View pointerEvents="none" style={styles.sliderTrack} />
        <View pointerEvents="none" style={[styles.sliderFill, { width: `${value * 100}%` }]} />
        <View pointerEvents="none" style={[styles.sliderThumb, { left: Math.max(0, value * w - 9) }]} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/** Output-level bar. Owner ruling 2026-07-26: labeled "LEVEL (dBFS · relative)"
 *  — the COMMANDED generator level, honest by construction; never "SPL". */
export function LevelMeterBar({ levelDb, minDb = -48, maxDb = -12 }: { levelDb: number; minDb?: number; maxDb?: number }) {
  const frac = Math.max(0, Math.min(1, (levelDb - minDb) / (maxDb - minDb)));
  return (
    <View style={{ gap: 3 }}>
      <View style={styles.sliderHead}>
        <Text style={styles.meterLabel}>LEVEL (dBFS · relative)</Text>
        <Text style={styles.sliderReadout}>{levelDb.toFixed(0)} dBFS</Text>
      </View>
      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${frac * 100}%` }]} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/** Honest card for clients built before the Skia dependency (§1.7): the text
 *  and audio still work; the animated model views need the new dev build. */
export function VizUnavailableCard() {
  return (
    <View style={styles.unavailCard}>
      <Text style={styles.unavailTitle}>ANIMATED VIEWS NEED THE NEW DEV BUILD</Text>
      <Text style={styles.unavailBody}>
        This dev client predates the graphics engine the air-particle and speaker animations run
        on. The lesson text and audio work fully — install the newest dev build to see the motion.
      </Text>
    </View>
  );
}

/** The standing disclosure on every animated model panel. */
export function ConceptBadge({ extra }: { extra?: string }) {
  return (
    <Text style={styles.badge}>
      CONCEPTUAL MODEL — SLOWED FOR VISIBILITY (real air moves at the audio rate, thousands of
      times faster){extra ? ` · ${extra}` : ''}
    </Text>
  );
}

const styles = StyleSheet.create({
  // CheckQuestion
  checkCard: {
    gap: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.4)',
    backgroundColor: '#17140c',
    padding: 12,
  },
  checkEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.4, color: colors.amber },
  checkQuestion: { fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 20, color: colors.textPrimary },
  checkOpt: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2c2c33',
    backgroundColor: '#131316',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  checkOptGood: { borderColor: 'rgba(55,224,95,.7)', backgroundColor: '#0e130f' },
  checkOptBad: { borderColor: 'rgba(255,80,70,.7)', backgroundColor: '#161010' },
  checkOptText: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18, color: colors.textSecondary },
  checkOptTextGood: { color: '#5bff85' },
  checkOptTextBad: { color: '#ff6b5e' },
  checkReveal: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: '#5bff85' },
  checkHint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: '#ff8d7a' },

  // DragSlider
  sliderHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sliderLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sliderInfo: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.amber },
  sliderLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.textSecondary },
  sliderReadout: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.5, color: colors.amber },
  sliderTrackWrap: { height: 30, justifyContent: 'center' },
  sliderTrack: { height: 4, borderRadius: 2, backgroundColor: '#26262c' },
  sliderFill: { position: 'absolute', height: 4, borderRadius: 2, backgroundColor: 'rgba(255,198,77,.55)' },
  sliderThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.amber,
    top: 6,
  },

  // LevelMeterBar
  meterLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.textSecondary },
  meterTrack: { height: 10, borderRadius: 5, backgroundColor: '#1c1c22', overflow: 'hidden' },
  meterFill: { height: 10, backgroundColor: '#5bff85', opacity: 0.85 },

  // VizUnavailableCard
  unavailCard: {
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 14,
  },
  unavailTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2, color: colors.textSecondary },
  unavailBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSub },

  badge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 1, lineHeight: 13, color: colors.textSub },
});
