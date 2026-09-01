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
import { LayoutAnimation, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { levelColor, rampColors } from '../../../features/tools/levelColor';
import { LinearGradient as GradientView } from 'expo-linear-gradient';
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

export function CheckQuestion({ spec, onSolved }: { spec: CheckSpec; onSolved?: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  // Collapsible (owner 2026-08-31): same expand/close triangle as the
  // WHAT'S HAPPENING sections, in the card's top-left. Starts open.
  const [open, setOpen] = useState(true);
  // SHUFFLE ON MOUNT (learning pass 2026-08-31). Authored specs had settled the
  // correct answer at index 1 in 10 of 11 Foundations checks — by Module 5 a
  // student can pass every check by picking the middle option, which trains
  // position, not the concept. The authored order stays authoritative; only the
  // presentation order is permuted, and correctness is checked by ORIGINAL
  // index so no spec ever needs re-authoring.
  const [order] = useState<number[]>(() => {
    const idx = spec.options.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  });
  const pick = (orig: number) => {
    if (solved) return;
    setPicked(orig);
    if (orig === spec.correctIdx) {
      setSolved(true);
      onSolved?.(); // optional: lets a host aggregate a "passed" state (R6c)
    }
  };
  return (
    <View style={styles.checkCard}>
      <Pressable
        style={styles.checkHeadRow}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpen((o) => !o);
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Check yourself, ${open ? 'expanded' : 'collapsed'}`}
        hitSlop={{ top: 8, bottom: 8 }}
      >
        <Text style={styles.checkCaret}>{open ? '▾' : '▸'}</Text>
        <Text style={styles.checkEyebrow}>CHECK YOURSELF{solved ? '  ·  ✓' : ''}</Text>
      </Pressable>
      {!open ? null : (
        <>
      <Text style={styles.checkQuestion}>{spec.question}</Text>
      <View style={{ gap: 8 }}>
        {order.map((i) => {
          const opt = spec.options[i];
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
        </>
      )}
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
  tint,
  levelTint,
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
  /** Accent colour for the fill / thumb / readout (defaults to amber). */
  tint?: string;
  /** LEVEL sliders (owner 2026-08-05): colour the moving fill/thumb by the MIDI
   *  amplitude ramp — blue at the low end → red at max. Overrides `tint`. */
  levelTint?: boolean;
}) {
  const accent = levelTint ? levelColor(value) : tint;
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

  // ANCHORED drag math (owner 2026-08-07 fix): the grant tap positions the
  // value once from locationX, then every move applies gestureState.dx to that
  // anchor. locationX becomes unreliable the moment the finger leaves the
  // track's bounds (it re-bases against whatever view is under the finger),
  // which made sliders "whip around" to the opposite end at the extremes —
  // dx never lies. Capture on start so the slider owns the touch immediately.
  const baseRef = useRef(0);
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: (e) => {
        setLock(true);
        if (wRef.current > 0) {
          const v = Math.max(0, Math.min(1, e.nativeEvent.locationX / wRef.current));
          baseRef.current = v;
          onChangeRef.current(v);
        }
      },
      onPanResponderMove: (_e, g) => {
        if (wRef.current > 0) {
          onChangeRef.current(Math.max(0, Math.min(1, baseRef.current + g.dx / wRef.current)));
        }
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
        {readout ? <Text style={[styles.sliderReadout, accent ? { color: accent } : null]}>{readout}</Text> : null}
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
        {levelTint ? (
          // LEVEL slider: the fill shows the ramp climbing to its peak, not a solid block.
          <GradientView
            pointerEvents="none"
            colors={rampColors(value)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.sliderFill, { width: `${value * 100}%`, opacity: 0.85 }]}
          />
        ) : (
          <View
            pointerEvents="none"
            style={[styles.sliderFill, { width: `${value * 100}%` }, accent ? { backgroundColor: accent, opacity: 0.85 } : null]}
          />
        )}
        <View
          pointerEvents="none"
          style={[styles.sliderThumb, { left: Math.max(0, value * w - 9) }, accent ? { backgroundColor: accent } : null]}
        />
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
        {/* The NUMBER carries the ramp too (owner 2026-08-12): a level readout
            speaks the same blue→red language as the bar beside it. */}
        <Text style={[styles.sliderReadout, { color: levelColor(frac) }]}>{levelDb.toFixed(0)} dBFS</Text>
      </View>
      <View style={styles.meterTrack}>
        {/* A bar whose SIZE encodes level shows the ramp CLIMBING to its tip —
            never a solid block of one colour (owner 2026-08-16). */}
        <GradientView
          colors={rampColors(frac)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.meterFill, { width: `${frac * 100}%` }]}
        />
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
  // CheckQuestion — PURPLE container + eyebrow (owner 2026-08-05).
  checkCard: {
    gap: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(180,91,255,.5)',
    backgroundColor: '#140f1a',
    padding: 12,
  },
  checkEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.4, color: '#c98bff' },
  checkHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  checkCaret: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: '#c98bff', width: 12, textAlign: 'center' },
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
  checkOptTextGood: { color: '#37e05f' },
  checkOptTextBad: { color: '#ff6b5e' },
  checkReveal: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: '#37e05f' },
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
  meterFill: { height: 10, opacity: 0.85 }, // colour comes from the ramp gradient, never a fixed fill

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
