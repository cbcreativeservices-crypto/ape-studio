/**
 * Understanding Level & Amplitude Displays — the Academy's color-language
 * orientation (owner spec 2026-08-12). ONE page, ONE source of truth, used two
 * ways:
 *
 *  - Path A: the START HERE step of Foundations of Sound renders
 *    <AmplitudeColorBody/> as its panel.
 *  - Path B: withAmplitudeOrientation() (wired ONCE in RootNavigator) renders
 *    <AmplitudeOrientationGatePage/> IN PLACE of any interactive audio lab /
 *    tool the learner opens before completing the orientation, then swaps to
 *    the selected destination the moment they confirm — no re-navigation, no
 *    losing where they were going.
 *
 * Both paths set the same flag (features/lab/amplitudeOrientation).
 *
 * TEACHING CLAIM (and its honesty bounds): the blue→red magnitude scale is an
 * ACADEMY LEARNING CONVENTION — the page says so explicitly and never implies
 * professional equipment universally uses it. All six displays are static
 * ILLUSTRATIVE drawings of one conceptual signal (§1.7: labeled, never posing
 * as live measurement). Color always ENCODES magnitude here — the six cards
 * render the SAME signal (strong low tone, weaker high harmonic, one short
 * burst) so the color correspondence is visibly consistent across displays.
 * Non-color cues stay everywhere (bar height, meter fill, scale text) so the
 * teaching never relies on color alone.
 *
 * Colors come ONLY from the app-wide amplitude standard
 * (features/tools/levelColor): levelColor() for meters/curves, heatColor() for
 * the 2-D spectrogram field, WAVE_LEVEL_STOPS for the ±full-scale trace.
 */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Canvas, LinearGradient, Path, Rect, Skia, vec } from '@shopify/react-native-skia';
import {
  MIDLINE_BLUE,
  LOUDNESS_STOPS,
  WAVE_LEVEL_STOPS,
  heatColor,
  levelColor,
} from '../../../features/tools/levelColor';
import {
  markAmplitudeOrientationComplete,
  useAmplitudeOrientationDone,
} from '../../../features/lab/amplitudeOrientation';
import { useOverlaysSuppressed } from '../../../features/dev/popupSuppressStore';
import { GlassButton } from '../../../components/GlassButton';
import { colors, fonts } from '../../../theme/tokens';

/** Full-scale red — top of the canonical ramp (kept SSoT, never hardcoded). */
const LOUD_RED = LOUDNESS_STOPS[0].color;

// ─────────────────────────────────────────────────────────────────────────────
// Copy (spec 2026-08-12 — near-verbatim; changes route back to the owner)

export const AMP_ORIENT_TITLE = 'UNDERSTANDING LEVEL & AMPLITUDE';
export const AMP_ORIENT_SUBTITLE = 'Different displays. Same visual language.';

/** Core explanation — also the START HERE step's paragraph text (Path A). */
export const AMP_ORIENT_PARAS: string[] = [
  'Throughout Pro Audio Training Academy, you will see the same color scale whenever level or amplitude is being visualized.',
  'Different displays organize audio in different ways. A waveform shows amplitude over time. A spectrum analyzer shows magnitude across frequency. A spectrogram shows magnitude across both frequency and time.',
  'The display changes, but the color language stays the same. Cooler colors indicate lower magnitude. Warmer colors indicate higher magnitude.',
];

const CONVENTION_TITLE = 'LEARNING CONVENTION';
const CONVENTION_BODY =
  'Professional audio equipment and software do not universally use this color system. ' +
  'Pro Audio Training Academy uses it consistently as a learning aid so you can recognize ' +
  'level and amplitude quickly across different tools and labs.';

const GATE_INTRO =
  'Before using our audio visualizers, learn the color language you will see throughout the Academy.';

const HONESTY_LINE = 'Illustrative training graphics — not live measurements.';

// ─────────────────────────────────────────────────────────────────────────────
// The ONE conceptual signal every card draws (deterministic, module-scope):
// a strong low tone, a weaker high harmonic, and one short transient burst.

const VIZ_H = 92;

/** Amplitude envelope over normalized time 0..1: attack → sustain (gentle
 *  ripple) → short full-scale burst at ~0.7 → release. */
function env(t: number): number {
  if (t < 0.12) return (t / 0.12) * 0.72;
  if (t >= 0.66 && t <= 0.74) {
    const c = 1 - Math.abs((t - 0.7) / 0.04); // triangle peak
    return 0.72 + 0.28 * c;
  }
  if (t > 0.82) return Math.max(0.14, 0.72 - (t - 0.82) * 3.2);
  return 0.72 + 0.04 * Math.sin(t * 18);
}

/** Instantaneous two-component trace (fundamental + weaker 3rd harmonic). */
function trace(x01: number): number {
  return 0.62 * Math.sin(2 * Math.PI * 2 * x01) + 0.3 * Math.sin(2 * Math.PI * 6 * x01);
}

const N_WAVE = 56;
const WAVE_BARS: number[] = Array.from({ length: N_WAVE }, (_, i) => {
  const t = i / (N_WAVE - 1);
  return env(t) * (0.62 + 0.38 * Math.abs(Math.sin(i * 1.7)));
});

/** 15 RTA bands: dominant fundamental (band 3), weaker harmonic (band 8),
 *  sloping noise floor elsewhere. */
const RTA_MAGS = [0.1, 0.12, 0.3, 0.95, 0.38, 0.16, 0.12, 0.22, 0.45, 0.2, 0.12, 0.09, 0.07, 0.06, 0.05];

const SG_COLS = 24;
const SG_ROWS = 16;
const SG_F0_ROW = 3; // rows counted from the BOTTOM (low freq at bottom)
const SG_H3_ROW = 9;
const SG_BURST_COLS = new Set([16, 17]);
function spectroMag(col: number, rowFromBottom: number): number {
  const e = env(col / (SG_COLS - 1));
  let m = 0.04;
  if (rowFromBottom === SG_F0_ROW) m = 0.95 * e;
  else if (rowFromBottom === SG_H3_ROW) m = 0.45 * e;
  if (SG_BURST_COLS.has(col)) m = Math.max(m, 0.75); // broadband transient
  return m;
}

const METER_SEGS = 12;
const METER_LEVEL = 0.72; // sustain level — top of the healthy green band
const SPL_DB = 78;
const SPL_MIN = 40;
const SPL_MAX = 100;

// ─────────────────────────────────────────────────────────────────────────────
// Cards (static; Views where possible, Skia only for the trace + 2-D field)

function useMeasuredWidth(): [number, (w: number) => void] {
  const [w, setW] = useState(0);
  return [w, setW];
}

function VizCard({
  title,
  caption,
  a11y,
  children,
}: {
  title: string;
  caption: string;
  a11y: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card} accessible accessibilityLabel={a11y}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.cardViz}>{children}</View>
      <Text style={styles.cardCaption}>{caption}</Text>
    </View>
  );
}

/** 1 · WAVEFORM — |amplitude| bars over time around a MIDI-0 blue midline
 *  (the app's house waveform idiom: per-sample excursions, color = level). */
function WaveformCard() {
  return (
    <View style={styles.vizFill}>
      <View style={styles.waveRow}>
        {WAVE_BARS.map((a, i) => (
          <View key={i} style={styles.waveBarCol}>
            <View style={{ flex: 1 - a, opacity: 0 }} />
            <View style={{ flex: Math.max(0.02, a * 2), backgroundColor: levelColor(a), borderRadius: 1 }} />
            <View style={{ flex: 1 - a, opacity: 0 }} />
          </View>
        ))}
      </View>
      <View style={styles.waveMidline} pointerEvents="none" />
      <Text style={styles.axisBottom}>TIME →</Text>
    </View>
  );
}

/** 2 · OSCILLOSCOPE — the instantaneous two-component trace, stroked with the
 *  standing ±full-scale vertical gradient (WAVE_LEVEL_STOPS). */
function OscilloscopeCard() {
  const [w, onW] = useMeasuredWidth();
  const path = useMemo(() => {
    if (w <= 0) return null;
    const p = Skia.Path.Make();
    const mid = VIZ_H / 2;
    const half = VIZ_H / 2 - 3;
    for (let i = 0; i <= 120; i++) {
      const x = (i / 120) * w;
      const y = mid - trace(i / 120) * half;
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [w]);
  return (
    <View style={styles.vizFill} onLayout={(e) => onW(Math.round(e.nativeEvent.layout.width))}>
      {w > 0 && path ? (
        <Canvas style={{ width: w, height: VIZ_H }}>
          {/* zero line — always MIDI-0 blue */}
          <Rect x={0} y={VIZ_H / 2 - 0.75} width={w} height={1.5} color={MIDLINE_BLUE} opacity={0.55} />
          <Path path={path} style="stroke" strokeWidth={2.5} strokeJoin="round" strokeCap="round">
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, VIZ_H)}
              colors={WAVE_LEVEL_STOPS.map((s) => s.color)}
              positions={WAVE_LEVEL_STOPS.map((s) => s.offset)}
            />
          </Path>
        </Canvas>
      ) : null}
      <Text style={styles.axisBottom}>TIME →</Text>
    </View>
  );
}

/** 3 · LEVEL METER — vertical segments, each colored by ITS height on the
 *  scale; lit to the sustain level. Height + dB ticks carry the value too. */
function LevelMeterCard() {
  const lit = Math.round(METER_LEVEL * METER_SEGS);
  return (
    <View style={[styles.vizFill, styles.meterWrap]}>
      <View style={styles.meterCol}>
        {Array.from({ length: METER_SEGS }, (_, i) => {
          const idxFromBottom = METER_SEGS - 1 - i; // render top→bottom
          const frac = (idxFromBottom + 0.5) / METER_SEGS;
          const on = idxFromBottom < lit;
          return (
            <View
              key={i}
              style={[styles.meterSeg, { backgroundColor: on ? levelColor(frac) : '#1b1c20' }]}
            />
          );
        })}
      </View>
      <View style={styles.meterTicks}>
        <Text style={styles.tickText}>0</Text>
        <Text style={styles.tickText}>−12</Text>
        <Text style={styles.tickText}>−24</Text>
        <Text style={styles.tickText}>−40 dB</Text>
      </View>
    </View>
  );
}

/** 4 · SPL METER — horizontal sound-pressure-level bar (illustrative), filled
 *  segment-by-segment along the same ramp, with the dB SPL readout. */
function SplCard() {
  const n = 20;
  const frac = (SPL_DB - SPL_MIN) / (SPL_MAX - SPL_MIN);
  const lit = Math.round(frac * n);
  return (
    <View style={[styles.vizFill, { justifyContent: 'center', gap: 6 }]}>
      <Text style={styles.splReadout}>
        {SPL_DB} <Text style={styles.splUnit}>dB SPL</Text>
      </Text>
      <View style={styles.splRow}>
        {Array.from({ length: n }, (_, i) => (
          <View
            key={i}
            style={[
              styles.splSeg,
              { backgroundColor: i < lit ? levelColor((i + 0.5) / n) : '#1b1c20' },
            ]}
          />
        ))}
      </View>
      <View style={styles.splTicks}>
        <Text style={styles.tickText}>40</Text>
        <Text style={styles.tickText}>60</Text>
        <Text style={styles.tickText}>80</Text>
        <Text style={styles.tickText}>100</Text>
      </View>
    </View>
  );
}

/** 5 · RTA — spectral magnitude across frequency bands; bar height AND color
 *  carry the same number. */
function RtaCard() {
  return (
    <View style={styles.vizFill}>
      <View style={styles.rtaRow}>
        {RTA_MAGS.map((m, i) => (
          <View key={i} style={styles.rtaBarCol}>
            <View style={{ flex: 1 - m, opacity: 0 }} />
            <View style={{ flex: Math.max(0.03, m), backgroundColor: levelColor(m), borderRadius: 1.5 }} />
          </View>
        ))}
      </View>
      <Text style={styles.axisBottom}>LOW ← FREQUENCY → HIGH</Text>
    </View>
  );
}

/** 6 · SPECTROGRAM — frequency × time, magnitude as the same ramp with the
 *  deep-navy silence floor (the app's standing heat-map color). */
function SpectrogramCard() {
  const [w, onW] = useMeasuredWidth();
  const cells = useMemo(() => {
    if (w <= 0) return [];
    const cw = w / SG_COLS;
    const ch = VIZ_H / SG_ROWS;
    const out: { x: number; y: number; cw: number; ch: number; c: string }[] = [];
    for (let col = 0; col < SG_COLS; col++) {
      for (let row = 0; row < SG_ROWS; row++) {
        const fromBottom = SG_ROWS - 1 - row;
        out.push({
          x: col * cw,
          y: row * ch,
          cw: cw + 0.5, // overlap a hair so no grid seams
          ch: ch + 0.5,
          c: heatColor(spectroMag(col, fromBottom)),
        });
      }
    }
    return out;
  }, [w]);
  return (
    <View style={styles.vizFill} onLayout={(e) => onW(Math.round(e.nativeEvent.layout.width))}>
      {w > 0 ? (
        <Canvas style={{ width: w, height: VIZ_H }}>
          {cells.map((r, i) => (
            <Rect key={i} x={r.x} y={r.y} width={r.cw} height={r.ch} color={r.c} />
          ))}
        </Canvas>
      ) : null}
      <Text style={styles.axisBottom}>TIME → · FREQ ↑</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The gradient bar + the shared page body

function GradientBar() {
  const n = 48;
  return (
    <View
      style={{ gap: 5 }}
      accessible
      accessibilityLabel="The Academy magnitude scale: dark blue for the lowest level, through blue, green, yellow and orange, to red for the highest level"
    >
      <View style={styles.gradRow}>
        <Text style={styles.gradEnd}>LOW</Text>
        <View style={styles.gradBar}>
          {Array.from({ length: n }, (_, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: heatColor(i / (n - 1)) }} />
          ))}
        </View>
        <Text style={[styles.gradEnd, { color: LOUD_RED }]}>HIGH</Text>
      </View>
      <Text style={styles.gradNames}>DARK BLUE → BLUE → GREEN → YELLOW → ORANGE → RED</Text>
    </View>
  );
}

/**
 * The whole educational page (header optional — the Foundations step supplies
 * its own title/paragraphs). Owns the completion CTA so Path A and Path B
 * behave identically: pressing UNDERSTOOD — CONTINUE sets the one global flag.
 */
export function AmplitudeColorBody({ showHeader = true }: { showHeader?: boolean }) {
  const done = useAmplitudeOrientationDone();
  return (
    <View style={styles.body}>
      {showHeader ? (
        <View style={{ gap: 2 }}>
          <Text style={styles.title}>{AMP_ORIENT_TITLE}</Text>
          <Text style={styles.subtitle}>{AMP_ORIENT_SUBTITLE}</Text>
        </View>
      ) : null}

      <GradientBar />

      <View style={{ gap: 3 }}>
        <Text style={styles.sixViews}>SIX VIEWS · ONE SIGNAL</Text>
        <Text style={styles.sixViewsSub}>
          Every card draws the SAME example signal — a strong low tone, a weaker high harmonic, and
          one short burst — in the same level colors.
        </Text>
      </View>

      <View style={styles.grid}>
        <VizCard
          title="WAVEFORM"
          caption="Amplitude over time"
          a11y="Waveform example: signal amplitude drawn over time; taller bars are hotter colors"
        >
          <WaveformCard />
        </VizCard>
        <VizCard
          title="OSCILLOSCOPE"
          caption="Instantaneous amplitude"
          a11y="Oscilloscope example: the waveform trace; far from the zero line the trace turns hotter"
        >
          <OscilloscopeCard />
        </VizCard>
        <VizCard
          title="LEVEL METER"
          caption="Overall signal level"
          a11y="Level meter example: a vertical meter lit to its level; higher segments are hotter colors"
        >
          <LevelMeterCard />
        </VizCard>
        <VizCard
          title="SPL METER"
          caption="Sound-pressure level (illustrative)"
          a11y="SPL meter example: a horizontal sound pressure level bar reading 78 dB SPL"
        >
          <SplCard />
        </VizCard>
        <VizCard
          title="SPECTRUM (RTA)"
          caption="Spectral magnitude across frequency"
          a11y="Spectrum analyzer example: magnitude across frequency bands; the strong band is red, the weak band green"
        >
          <RtaCard />
        </VizCard>
        <VizCard
          title="SPECTROGRAM"
          caption="Magnitude across frequency × time"
          a11y="Spectrogram example: frequency over time; the strong tone is a hot stripe, quiet regions are dark blue"
        >
          <SpectrogramCard />
        </VizCard>
      </View>

      <Text style={styles.honesty}>{HONESTY_LINE}</Text>

      <View style={styles.explain}>
        {AMP_ORIENT_PARAS.map((p) => (
          <Text key={p} style={styles.explainText}>
            {p}
          </Text>
        ))}
      </View>

      <View style={styles.convention}>
        <Text style={styles.conventionTitle}>{CONVENTION_TITLE}</Text>
        <Text style={styles.conventionBody}>{CONVENTION_BODY}</Text>
      </View>

      <View style={styles.finale} accessible accessibilityLabel="Blue means less. Red means more.">
        <Text style={[styles.finaleLine, { color: MIDLINE_BLUE }]}>BLUE = LESS</Text>
        <Text style={[styles.finaleLine, { color: LOUD_RED }]}>RED = MORE</Text>
      </View>

      {done ? (
        <View style={styles.doneChip}>
          <Text style={styles.doneChipText}>✓ ORIENTATION COMPLETE</Text>
        </View>
      ) : (
        <GlassButton
          label="UNDERSTOOD — CONTINUE"
          tint="green"
          height={52}
          onPress={markAmplitudeOrientationComplete}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Path B — the first-use gate page + the centralized navigator wrapper

/**
 * Standalone lab — the FIRST entry in Audio Fundamentals (owner 2026-08-12).
 * Same body as the gate; opened voluntarily from the lab list. Pressing
 * UNDERSTOOD — CONTINUE here marks the orientation complete (Path A), so a
 * learner who reads it in the list is never gated later. NOT wrapped in the
 * orientation gate (it IS the orientation).
 */
export function AmplitudeLabScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.gateHeader}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.gateBack}>‹</Text>
        </Pressable>
        <Text style={styles.labHeaderKicker}>AUDIO FUNDAMENTALS</Text>
      </View>
      <ScrollView contentContainerStyle={styles.gateScroll}>
        <AmplitudeColorBody />
      </ScrollView>
    </View>
  );
}

/** Full-screen one-time orientation shown IN PLACE of a gated destination. */
export function AmplitudeOrientationGatePage() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.gateHeader}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.gateBack}>‹</Text>
        </Pressable>
        <Text style={styles.gateIntro}>{GATE_INTRO}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.gateScroll}>
        <AmplitudeColorBody />
      </ScrollView>
    </View>
  );
}

/**
 * The reusable orientation gate (spec's openAudioExperience, inverted): wrap a
 * screen's component ONCE in RootNavigator and every path into it — hub tile,
 * deep link, banner — funnels through the orientation until it is completed.
 * The destination screen does not mount (no audio prompts, no engine starts)
 * until the learner confirms; completing flips the store and this re-renders
 * straight into the originally selected screen. Exiting first marks nothing.
 *
 * Dev/low-light overlay suppression (D6) skips the gate WITHOUT marking it.
 */
export function withAmplitudeOrientation<P extends object>(
  Screen: React.ComponentType<P>,
): React.ComponentType<P> {
  function Gated(props: P) {
    const done = useAmplitudeOrientationDone();
    const suppressed = useOverlaysSuppressed();
    if (done === null) return null; // hydration beat (ms at boot) — no flash either way
    if (done || suppressed) return <Screen {...props} />;
    return <AmplitudeOrientationGatePage />;
  }
  Gated.displayName = `WithAmplitudeOrientation(${Screen.displayName ?? Screen.name ?? 'Screen'})`;
  return Gated;
}

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  body: { gap: 14 },

  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 19, letterSpacing: 1.6, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 13.5, color: colors.textSub },

  // Gradient bar
  gradRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gradEnd: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.2, color: MIDLINE_BLUE },
  gradBar: {
    flex: 1,
    height: 26,
    flexDirection: 'row',
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2c2c33',
  },
  gradNames: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: colors.textSub,
    textAlign: 'center',
  },

  sixViews: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.amber },
  sixViewsSub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },

  // Cards
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232329',
    backgroundColor: '#0e0e12',
    padding: 8,
    gap: 6,
  },
  cardTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.textSecondary },
  cardViz: { height: VIZ_H + 14 },
  cardCaption: { fontFamily: fonts.barlowRegular, fontSize: 10.5, lineHeight: 13, color: colors.textSub },
  vizFill: { flex: 1 },
  axisBottom: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 8,
    letterSpacing: 0.8,
    color: '#5a5b63',
    textAlign: 'center',
    marginTop: 2,
  },

  // Waveform
  waveRow: { height: VIZ_H, flexDirection: 'row', alignItems: 'stretch', gap: 1 },
  waveBarCol: { flex: 1, flexDirection: 'column' },
  waveMidline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: VIZ_H / 2 - 0.75,
    height: 1.5,
    backgroundColor: MIDLINE_BLUE,
    opacity: 0.8,
  },

  // Level meter
  meterWrap: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 1 },
  meterCol: { width: 30, height: VIZ_H + 8, gap: 2 },
  meterSeg: { flex: 1, borderRadius: 2 },
  meterTicks: { height: VIZ_H + 8, justifyContent: 'space-between' },
  tickText: { fontFamily: fonts.oswaldSemiBold, fontSize: 8.5, letterSpacing: 0.5, color: '#5a5b63' },

  // SPL
  splReadout: { fontFamily: fonts.oswaldBold, fontSize: 22, color: colors.textPrimary, textAlign: 'center' },
  splUnit: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textSub },
  splRow: { height: 20, flexDirection: 'row', gap: 2 },
  splSeg: { flex: 1, borderRadius: 2 },
  splTicks: { flexDirection: 'row', justifyContent: 'space-between' },

  // RTA
  rtaRow: { height: VIZ_H, flexDirection: 'row', alignItems: 'stretch', gap: 2 },
  rtaBarCol: { flex: 1, flexDirection: 'column' },

  honesty: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 9.5,
    letterSpacing: 1,
    color: '#8a8b93',
    textAlign: 'center',
  },

  explain: { gap: 8 },
  explainText: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },

  convention: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.45)',
    backgroundColor: '#1a1409',
    padding: 12,
    gap: 5,
  },
  conventionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.6, color: colors.amber },
  conventionBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },

  finale: { alignItems: 'center', gap: 2, paddingVertical: 4 },
  finaleLine: { fontFamily: fonts.oswaldBold, fontSize: 28, letterSpacing: 2 },

  doneChip: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(91,255,133,.5)',
    backgroundColor: 'rgba(91,255,133,.08)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.4, color: colors.green },

  // Gate page
  gateHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingBottom: 8 },
  gateBack: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  labHeaderKicker: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amber },
  gateIntro: {
    flex: 1,
    fontFamily: fonts.barlowMedium,
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  gateScroll: { padding: 16, paddingTop: 6, paddingBottom: 30 },
});
