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
import { markLabReviewed, useLabDone } from '../../../features/lab/labCompletion';
import { AlphaType, Canvas, ColorType, DashPathEffect, Image, LinearGradient, Path, Rect, Skia, Text as SkiaText, useFont, vec } from '@shopify/react-native-skia';
import { LinearGradient as GradientView } from 'expo-linear-gradient';
import {
  MIDLINE_BLUE,
  LOUDNESS_STOPS,
  WAVE_LEVEL_STOPS,
  heatColor,
  levelColor,
  rampColors,
  rampColorsSymmetric,
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
/** Second title — same size/colour/emphasis as the main title (owner 2026-08-12). */
export const AMP_ORIENT_TITLE2 = 'THE ACADEMY GLOBAL METHODOLOGY';
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

// Level-bar ramp helpers now live in features/tools/levelColor (rampColors /
// rampColorsSymmetric) so every visualizer shares the one standard.

// SPECTROGRAM (owner 2026-08-12): drawn as ONE fine SkImage — a per-pixel
// spectral model at 200×110 internal resolution (≈20× the old blocky 24×16
// grid), coloured through the amplitude ramp and scaled smoothly to the card.
// Soft fundamental + 3rd/5th-harmonic bands modulated by the shared envelope,
// plus the broadband transient streak — the SAME conceptual signal.
const SG_IW = 200;
const SG_IH = 110;

/** heatColor sampled to an RGB LUT once (pure JS — safe at module scope). */
const HEAT_LUT: ReadonlyArray<readonly [number, number, number]> = (() => {
  const N = 160;
  const lut: [number, number, number][] = [];
  for (let i = 0; i < N; i++) {
    const v = parseInt(heatColor(i / (N - 1)).slice(1), 16);
    lut.push([(v >> 16) & 255, (v >> 8) & 255, v & 255]);
  }
  return lut;
})();

const gaussian = (x: number, mu: number, sig: number) => Math.exp(-((x - mu) * (x - mu)) / (2 * sig * sig));

/** Smooth spectrogram magnitude at time `t` (0..1) and freq fraction `fy`
 *  (0 = low, 1 = high) — the same conceptual signal as every other card. */
function spectroMag(t: number, fy: number): number {
  const e = env(t);
  let m = 0.03; // faint floor
  m += 0.95 * e * gaussian(fy, 0.16, 0.045); // fundamental (low)
  m += 0.5 * e * gaussian(fy, 0.5, 0.055); // 3rd harmonic
  m += 0.22 * e * gaussian(fy, 0.78, 0.05); // 5th harmonic (faint)
  m += 0.78 * gaussian(t, 0.7, 0.022) * (0.6 + 0.4 * fy); // broadband transient
  return m > 1 ? 1 : m;
}

/** Build the spectrogram as one fine SkImage (memoised per mount). */
function buildSpectroImage() {
  const buf = new Uint8Array(SG_IW * SG_IH * 4);
  const last = HEAT_LUT.length - 1;
  for (let py = 0; py < SG_IH; py++) {
    const fy = 1 - py / (SG_IH - 1); // top row = high freq
    for (let px = 0; px < SG_IW; px++) {
      const [r, g, b] = HEAT_LUT[Math.round(spectroMag(px / (SG_IW - 1), fy) * last)];
      const o = (py * SG_IW + px) * 4;
      buf[o] = r;
      buf[o + 1] = g;
      buf[o + 2] = b;
      buf[o + 3] = 255;
    }
  }
  return Skia.Image.MakeImage(
    { width: SG_IW, height: SG_IH, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Opaque },
    Skia.Data.fromBytes(buf),
    SG_IW * 4,
  );
}

const METER_SEGS = 12;
// PEAK reads higher and hotter than RMS (the average) for the SAME signal — the
// crest factor made visible (owner 2026-08-12). Illustrative dBFS values.
const PEAK_LEVEL = 0.86; // ≈ −3 dBFS
const RMS_LEVEL = 0.56; // ≈ −14 dBFS
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
            {/* Gradient climbs from blue at the mid line to the peak colour at each tip. */}
            <GradientView
              colors={rampColorsSymmetric(a)}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ flex: Math.max(0.02, a * 2), borderRadius: 1 }}
            />
            <View style={{ flex: 1 - a, opacity: 0 }} />
          </View>
        ))}
      </View>
      <View style={styles.waveMidline} pointerEvents="none" />
      {/* Amplitude grows away from the midline on BOTH phases: ↑ top half, ↓ bottom. */}
      <View style={styles.ampArrowTopHalf} pointerEvents="none">
        <AmplitudeArrow w={14} h={VIZ_H / 2 - 6} dir="up" />
      </View>
      <View style={styles.ampArrowBottomHalf} pointerEvents="none">
        <AmplitudeArrow w={14} h={VIZ_H / 2 - 6} dir="down" />
      </View>
      <Text style={styles.axisBottom}>TIME →</Text>
    </View>
  );
}

/** 2 · OSCILLOSCOPE — the instantaneous two-component trace, stroked with the
 *  standing ±full-scale vertical gradient (WAVE_LEVEL_STOPS). */
function OscilloscopeCard() {
  const [w, onW] = useMeasuredWidth();
  const plotW = w > 0 ? w - ARROW_GUTTER : 0; // leave the left gutter for the arrow
  const path = useMemo(() => {
    if (plotW <= 0) return null;
    const p = Skia.Path.Make();
    const mid = VIZ_H / 2;
    const half = VIZ_H / 2 - 3;
    for (let i = 0; i <= 120; i++) {
      const x = (i / 120) * plotW;
      const y = mid - trace(i / 120) * half;
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [plotW]);
  return (
    <View style={styles.vizFill} onLayout={(e) => onW(Math.round(e.nativeEvent.layout.width))}>
      {plotW > 0 && path ? (
        <Canvas style={{ width: plotW, height: VIZ_H, marginLeft: ARROW_GUTTER }}>
          {/* zero line — always MIDI-0 blue */}
          <Rect x={0} y={VIZ_H / 2 - 0.75} width={plotW} height={1.5} color={MIDLINE_BLUE} opacity={0.55} />
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
      {/* Amplitude grows away from the zero line on BOTH phases: ↑ top, ↓ bottom. */}
      <View style={styles.ampArrowTopHalf} pointerEvents="none">
        <AmplitudeArrow w={14} h={VIZ_H / 2 - 6} dir="up" />
      </View>
      <View style={styles.ampArrowBottomHalf} pointerEvents="none">
        <AmplitudeArrow w={14} h={VIZ_H / 2 - 6} dir="down" />
      </View>
      <Text style={styles.axisBottom}>TIME →</Text>
    </View>
  );
}

/** One vertical meter — segments lit to `level`, each coloured by its height on
 *  the amplitude ramp, with a label and dB readout beneath. */
function MeterBar({ level, label, db }: { level: number; label: string; db: string }) {
  const lit = Math.round(level * METER_SEGS);
  return (
    <View style={styles.meterBarCol}>
      <View style={styles.meterCol}>
        {Array.from({ length: METER_SEGS }, (_, i) => {
          const idxFromBottom = METER_SEGS - 1 - i; // render top→bottom
          const frac = (idxFromBottom + 0.5) / METER_SEGS;
          const on = idxFromBottom < lit;
          return <View key={i} style={[styles.meterSeg, { backgroundColor: on ? levelColor(frac) : '#1b1c20' }]} />;
        })}
      </View>
      <Text style={styles.meterBarLabel}>{label}</Text>
      {/* The NUMBER carries the ramp too, so PEAK reads hotter than RMS in
          colour as well as in height (owner 2026-08-12). */}
      <Text style={[styles.meterBarDb, { color: levelColor(level) }]}>{db}</Text>
    </View>
  );
}

/** 3 · LEVEL METER — TWO meters for ONE signal (owner 2026-08-12): PEAK reads
 *  higher and hotter, RMS (the average) lower and cooler — the difference the
 *  learner should see. dB ticks on the left carry the value too. */
function LevelMeterCard() {
  return (
    <View style={[styles.vizFill, styles.meterWrap]}>
      {/* Amplitude grows bottom → top; full-height arrow in the left gutter. */}
      <View style={styles.ampArrowLevel} pointerEvents="none">
        <AmplitudeArrow w={14} h={72} dir="up" />
      </View>
      <View style={styles.meterTicks}>
        <Text style={styles.tickText}>0</Text>
        <Text style={styles.tickText}>−12</Text>
        <Text style={styles.tickText}>−24</Text>
        <Text style={styles.tickText}>−40</Text>
      </View>
      <MeterBar level={PEAK_LEVEL} label="PEAK" db="−3" />
      <MeterBar level={RMS_LEVEL} label="RMS" db="−14" />
    </View>
  );
}

/** 4 · SPL METER — horizontal sound-pressure-level bar (illustrative), filled
 *  segment-by-segment along the same ramp, with the dB SPL readout. */
function SplCard() {
  const n = 20;
  const frac = (SPL_DB - SPL_MIN) / (SPL_MAX - SPL_MIN);
  const lit = Math.round(frac * n);
  const [w, onW] = useMeasuredWidth();
  return (
    <View
      style={[styles.vizFill, { justifyContent: 'center', gap: 6 }]}
      onLayout={(e) => onW(Math.round(e.nativeEvent.layout.width))}
    >
      <Text style={[styles.splReadout, { color: levelColor(frac) }]}>
        {SPL_DB} <Text style={styles.splUnit}>dB SPL</Text>
      </Text>
      {/* Amplitude grows left → right, matching the horizontal SPL bar. */}
      {w > 0 ? <AmplitudeArrow w={w} h={ARROW_H} dir="right" /> : null}
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
            {/* Gradient climbs from blue at the base to the peak colour at the top. */}
            <GradientView
              colors={rampColors(m)}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={{ flex: Math.max(0.03, m), borderRadius: 1.5 }}
            />
          </View>
        ))}
      </View>
      {/* Magnitude grows bottom → top; full-height arrow at the left. */}
      <View style={styles.ampArrowRta} pointerEvents="none">
        <AmplitudeArrow w={14} h={VIZ_H - 8} dir="up" />
      </View>
      <Text style={styles.axisBottom}>LOW ← FREQUENCY → HIGH</Text>
    </View>
  );
}

/** 6 · SPECTROGRAM — frequency × time, magnitude as the same ramp with the
 *  deep-navy silence floor (the app's standing heat-map color). */
function SpectrogramCard() {
  const [w, onW] = useMeasuredWidth();
  const [arrowW, onArrowW] = useMeasuredWidth(); // width of the arrow strip between past/now
  const [nowW, onNowW] = useMeasuredWidth(); // width of the "now" label
  // One fine SkImage, built once and scaled smoothly to the card (no blocky grid).
  const img = useMemo(() => buildSpectroImage(), []);
  const specW = w > 0 && nowW > 0 ? Math.round(w - nowW / 2) : w; // right edge centred on the word "now"
  return (
    <View style={styles.vizFill} onLayout={(e) => onW(Math.round(e.nativeEvent.layout.width))}>
      {specW > 0 && img ? (
        <Canvas style={{ width: specW, height: VIZ_H }}>
          <Image image={img} x={0} y={0} width={specW} height={VIZ_H} fit="fill" />
        </Canvas>
      ) : null}
      {/* Live scrolling display: new sound enters at the RIGHT ("now") and scrolls
          LEFT into the "past". Dotted gray arrow points left, ending at "past". */}
      <View style={styles.spectroTimeRow}>
        <Text style={styles.spectroTimeLabel}>past</Text>
        <View style={{ flex: 1 }} onLayout={(e) => onArrowW(Math.round(e.nativeEvent.layout.width))}>
          {arrowW > 0 ? <AmplitudeArrow w={arrowW} h={13} dir="left" color={ARROW_GRAY} dotted /> : null}
        </View>
        <Text style={styles.spectroTimeLabel} onLayout={(e) => onNowW(Math.round(e.nativeEvent.layout.width))}>
          now
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The gradient bar + the shared page body

/** Musical dynamics on the level gradient (owner 2026-08-16): the same magnitude
 *  scale a musician already reads, rendered in the SMuFL music font (Bravura) so
 *  the marks are genuine engraved notation. Composed from the canonical SMuFL
 *  dynamic letters — p U+E520, m U+E521, f U+E522 — so the glyphs are always
 *  correct regardless of the font's ligature set. */
const SM_P = ''; // dynamicPiano
const SM_M = ''; // dynamicMezzo
const SM_F = ''; // dynamicForte

/** The four marks kept (ppp, p, mf, ff removed), each at its ORIGINAL position on
 *  the 8-zone bar — pp/mp/f/fff land on zones 1,3,5,7 → evenly spaced, no
 *  re-spacing. Drawn with Skia (below) at an exact baseline, so RN's text-layout
 *  quirks with this music font (clipping / disappearing / Dynamic-Type scaling)
 *  can't touch them. */
const DYN_MARKS: ReadonlyArray<{ g: string; frac: number }> = [
  { g: SM_P + SM_P, frac: 1.5 / 8 }, // pp
  { g: SM_M + SM_P, frac: 3.5 / 8 }, // mp
  { g: SM_F, frac: 5.5 / 8 }, // f
  { g: SM_F + SM_F + SM_F, frac: 7.5 / 8 }, // fff
];

const DYN_SIZE = 26; // glyph point size (owner: 2pt smaller); forte ink ≈ 0.6em
const DYN_SHIFT = 10; // px the whole marks group is nudged left (owner 2026-08-16)
const DYN_ROW_H = 24; // height of the dynamics row (now ABOVE the bar, between quiet/loud)
/** Baseline y centring the tallest glyph (forte) in the dynamics row: forte ink
 *  sits ~0.445em above / 0.15em below the baseline (ink centre 0.1475em above). */
const DYN_ROW_BASELINE = DYN_ROW_H / 2 + 0.1475 * DYN_SIZE;

// ── Amplitude arrow ──────────────────────────────────────────────────────────
// A gradient arrow in the SAME amplitude ramp as the bar — a reusable "amplitude
// grows THIS way" indicator (owner 2026-08-16). Drawn in Skia so it's crisp and
// can be dropped over any display. dir 'right' = low→high left→right; dir 'up' =
// low→high bottom→top (for the vertical displays).
const ARROW_STOP_T = [0, 0.2, 0.4, 0.6, 0.8, 1];
const ARROW_COLORS = ARROW_STOP_T.map((t) => heatColor(t));
const ARROW_H = 14; // horizontal-arrow canvas height (not too thick, not too thin)
const ARROW_GUTTER = 16; // reserved edge strip so a vertical arrow never covers the data
const ARROW_GRAY = '#b3b3bb'; // light gray for the spectrogram time-axis arrow + label

function AmplitudeArrow({
  w,
  h,
  dir = 'right',
  color,
  dotted,
}: {
  w: number;
  h: number;
  dir?: 'right' | 'up' | 'down' | 'left';
  color?: string; // solid fill instead of the amplitude gradient (e.g. the spectrogram time arrow)
  dotted?: boolean; // dotted shaft + solid head (horizontal only) — the spectrogram time arrow
}) {
  // Dotted variant (horizontal): a dashed line shaft + a solid arrowhead.
  const dashed = useMemo(() => {
    if (!(dotted && (dir === 'right' || dir === 'left'))) return null;
    const cy = h / 2;
    const head = 12;
    const wing = 6.5;
    const shaft = Skia.Path.Make();
    const tri = Skia.Path.Make();
    if (dir === 'left') {
      shaft.moveTo(w, cy);
      shaft.lineTo(head, cy);
      tri.moveTo(head, cy - wing);
      tri.lineTo(0, cy);
      tri.lineTo(head, cy + wing);
    } else {
      shaft.moveTo(0, cy);
      shaft.lineTo(w - head, cy);
      tri.moveTo(w - head, cy - wing);
      tri.lineTo(w, cy);
      tri.lineTo(w - head, cy + wing);
    }
    tri.close();
    return { shaft, tri };
  }, [w, h, dir, dotted]);
  const path = useMemo(() => {
    const p = Skia.Path.Make();
    const head = 12; // arrowhead length
    const shaft = 3; // shaft half-thickness
    const wing = 6.5; // arrowhead half-height
    if (dir === 'up') {
      const cx = w / 2;
      p.moveTo(cx - shaft, h);
      p.lineTo(cx - shaft, head);
      p.lineTo(cx - wing, head);
      p.lineTo(cx, 0);
      p.lineTo(cx + wing, head);
      p.lineTo(cx + shaft, head);
      p.lineTo(cx + shaft, h);
    } else if (dir === 'down') {
      const cx = w / 2;
      p.moveTo(cx - shaft, 0);
      p.lineTo(cx - shaft, h - head);
      p.lineTo(cx - wing, h - head);
      p.lineTo(cx, h);
      p.lineTo(cx + wing, h - head);
      p.lineTo(cx + shaft, h - head);
      p.lineTo(cx + shaft, 0);
    } else {
      const cy = h / 2;
      const end = w - head;
      p.moveTo(0, cy - shaft);
      p.lineTo(end, cy - shaft);
      p.lineTo(end, cy - wing);
      p.lineTo(w, cy);
      p.lineTo(end, cy + wing);
      p.lineTo(end, cy + shaft);
      p.lineTo(0, cy + shaft);
    }
    p.close();
    return p;
  }, [w, h, dir]);
  if (w <= 0 || h <= 0) return null;
  // Gradient runs low→high along the arrow (blue at the low end, red at the tip).
  const start = dir === 'up' ? vec(0, h) : vec(0, 0);
  const end = dir === 'up' ? vec(0, 0) : dir === 'down' ? vec(0, h) : vec(w, 0);
  return (
    <Canvas style={{ width: w, height: h }} pointerEvents="none">
      {dashed ? (
        <>
          <Path path={dashed.shaft} style="stroke" strokeWidth={2.5} strokeCap="round" color={color ?? '#000000'}>
            <DashPathEffect intervals={[2.5, 4]} />
          </Path>
          <Path path={dashed.tri} color={color ?? '#000000'} />
        </>
      ) : color ? (
        <Path path={path} color={color} />
      ) : (
        <Path path={path}>
          <LinearGradient start={start} end={end} colors={ARROW_COLORS} positions={ARROW_STOP_T} />
        </Path>
      )}
    </Canvas>
  );
}

function GradientBar() {
  const n = 48;
  const [dynW, setDynW] = useState(0); // width of the dynamics strip (== bar width)
  const [arrowW, setArrowW] = useState(0); // width of the gap between "less" and "more"
  // Skia loads its OWN copy of the font at the exact point size we draw at.
  const dynFont = useFont(require('../../../../assets/fonts/Bravura.otf'), DYN_SIZE);
  return (
    <View
      style={{ gap: 5 }}
      accessible
      accessibilityLabel="The Academy magnitude scale: dark blue for the lowest level, through blue, green, yellow and orange, to red for the highest level — marked with musical dynamics rising with level: pianissimo, mezzo-piano, forte, fortississimo"
    >
      {/* Musical dynamics ABOVE the bar, between quiet and loud — drawn in Skia at
          an exact baseline (no RN text-layout quirks), each mark coloured to match
          the gradient directly below it. Flanked by invisible LOW/HIGH spacers so
          the marks align to the bar; quiet/loud overlaid at the ends. */}
      <View style={styles.gradRow}>
        <View>
          <Text style={[styles.gradEnd, styles.lmSpacer]}>LOW</Text>
          <View style={[styles.lmLabelWrap, { alignItems: 'flex-start' }]}>
            <Text style={styles.qlText}>quiet</Text>
          </View>
        </View>
        <View style={{ flex: 1 }} onLayout={(e) => setDynW(Math.round(e.nativeEvent.layout.width))}>
          {dynW > 0 && dynFont ? (
            <Canvas style={{ width: dynW, height: DYN_ROW_H }} pointerEvents="none">
              {DYN_MARKS.map((m, i) => {
                const cx = m.frac * dynW - DYN_SHIFT; // glyph centre (matches the shift used on the bar)
                return (
                  <SkiaText
                    key={i}
                    x={cx - dynFont.getTextWidth(m.g) / 2}
                    y={DYN_ROW_BASELINE}
                    text={m.g}
                    font={dynFont}
                    color={heatColor(Math.max(0, Math.min(1, cx / dynW)))}
                  />
                );
              })}
            </Canvas>
          ) : (
            <View style={{ height: DYN_ROW_H }} />
          )}
        </View>
        <View>
          <Text style={[styles.gradEnd, styles.lmSpacer]}>HIGH</Text>
          <View style={[styles.lmLabelWrap, { alignItems: 'flex-end' }]}>
            <Text style={styles.qlText}>loud</Text>
          </View>
        </View>
      </View>
      <View style={styles.gradRow}>
        <Text style={styles.gradEnd}>LOW</Text>
        <View style={styles.gradBar}>
          {/* Color slices in their OWN clipped, rounded layer. */}
          <View style={styles.gradSlices}>
            {Array.from({ length: n }, (_, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: heatColor(i / (n - 1)) }} />
            ))}
          </View>
        </View>
        <Text style={[styles.gradEnd, { color: LOUD_RED }]}>HIGH</Text>
      </View>
      {/* Mirror of quiet/loud, beneath the bar. The gradient arrow spans EXACTLY
          the bar's width (invisible LOW/HIGH spacers align the flanks); "less" and
          "more" sit at those ends, over the spacers. */}
      <View style={styles.gradRow}>
        <View>
          <Text style={[styles.gradEnd, styles.lmSpacer]}>LOW</Text>
          <View style={[styles.lmLabelWrap, { alignItems: 'flex-start' }]}>
            <Text style={styles.qlText}>less</Text>
          </View>
        </View>
        <View style={{ flex: 1 }} onLayout={(e) => setArrowW(Math.round(e.nativeEvent.layout.width))}>
          {arrowW > 0 ? <AmplitudeArrow w={arrowW} h={ARROW_H} dir="right" /> : <View style={{ height: ARROW_H }} />}
        </View>
        <View>
          <Text style={[styles.gradEnd, styles.lmSpacer]}>HIGH</Text>
          <View style={[styles.lmLabelWrap, { alignItems: 'flex-end' }]}>
            <Text style={styles.qlText}>more</Text>
          </View>
        </View>
      </View>
      <Text style={styles.gradNames}>DARK BLUE → BLUE → GREEN → YELLOW → ORANGE → RED</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RAMP CHECK — three retrieval trials between exposure and credit.
//
// Design + learning pass 2026-08-31: this page's whole job is RECOGNITION — a
// student must later decode colour-as-level on meters they have never seen —
// yet it graded F on interaction and F on retention: rich exposure, zero
// practice, and a self-report "UNDERSTOOD" button (the classic
// illusion-of-knowing click). Three taps (~15 s) turn the credit into evidence:
//   Q1 DECODE     — read two swatches straight off the ramp.
//   Q2 TRANSFER   — an UNFAMILIAR display (pad grid, deliberately not one of
//                   the six cards) — literally the later task.
//   Q3 VIOLATION  — spot the display that breaks the convention. The broken
//                   RTA draws its LOUD band cool (blue). Never the reverse:
//                   even a deliberately-wrong stimulus never paints quiet red.
// Wrong answers cost nothing and re-show the ramp (corrective re-exposure);
// every colour is sampled from the levelColor SSoT.

const CHECK_TITLE = 'CHECK YOURSELF — THREE QUICK READS';
const CHECK_QS = [
  'Which shows MORE level?',
  'Same rule, new display. Where is the signal hotter?',
  'One of these breaks the Academy color rule. Which one?',
] as const;
const CHECK_WRONG = [
  'Read it from the ramp: warmer is more.',
  'The display changed — the rule did not. Warmer is more.',
  'Color follows level, never frequency. A loud band is never blue, and a quiet band is never red.',
] as const;
const CHECK_PASSED_LINE =
  'You just read three displays — one you had never seen. That is the skill.';

/** A tappable colour swatch at a fixed ramp level (Q1). */
function CheckSwatch({ level, label, onPress }: { level: number; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.checkSwatch, { backgroundColor: levelColor(level) }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.checkSwatchGlyph}>?</Text>
    </Pressable>
  );
}

/** A 3×2 pad grid glowing around one ramp level — a display the six cards do
 *  not include, so answering it IS transfer (Q2). */
function CheckPads({ base, onPress, label }: { base: number; onPress: () => void; label: string }) {
  const jit = [0.03, -0.02, 0.05, -0.04, 0.02, -0.01];
  return (
    <Pressable onPress={onPress} style={styles.checkPadWrap} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.checkPadGrid}>
        {jit.map((j, i) => (
          <View key={i} style={[styles.checkPad, { backgroundColor: levelColor(Math.max(0, Math.min(1, base + j))) }]} />
        ))}
      </View>
    </Pressable>
  );
}

/** A seven-bar mini RTA. `violate` draws the TALLEST bar cool (loud-as-blue),
 *  which is the convention break the student must spot (Q3). */
function CheckRta({ violate, onPress, label }: { violate: boolean; onPress: () => void; label: string }) {
  const H = [0.3, 0.45, 0.92, 0.55, 0.38, 0.62, 0.28];
  return (
    <Pressable onPress={onPress} style={styles.checkRtaWrap} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.checkRtaRow}>
        {H.map((h, i) => {
          const isTallest = h === 0.92;
          const color = violate && isTallest ? levelColor(0.14) : levelColor(h);
          return <View key={i} style={[styles.checkRtaBar, { height: `${Math.round(h * 100)}%`, backgroundColor: color }]} />;
        })}
      </View>
    </Pressable>
  );
}

/** The three-trial check. Calls onPassed exactly once, when all three are
 *  answered correctly. Free retries; wrong answers show the corrective line
 *  plus a slim re-render of the ramp. */
function RampCheck({ onPassed, practice = false }: { onPassed?: () => void; practice?: boolean }) {
  const [q, setQ] = useState(0); // 0..2 active question, 3 = passed
  const [wrong, setWrong] = useState(false);

  const answer = (correct: boolean) => {
    if (!correct) {
      setWrong(true);
      return;
    }
    setWrong(false);
    const next = q + 1;
    setQ(next);
    if (next === 3) onPassed?.();
  };

  if (q >= 3) {
    return (
      <View style={styles.checkCard}>
        <Text style={styles.checkPassed}>✓ {CHECK_PASSED_LINE}</Text>
      </View>
    );
  }

  return (
    <View style={styles.checkCard}>
      <View style={styles.checkHead}>
        <Text style={styles.checkTitle}>{practice ? 'TEST YOURSELF' : CHECK_TITLE}</Text>
        <Text style={styles.checkProgress}>{q + 1}/3</Text>
      </View>
      <Text style={styles.checkQ}>{CHECK_QS[q]}</Text>

      {q === 0 ? (
        <View style={styles.checkRow}>
          <CheckSwatch level={0.34} label="First color swatch" onPress={() => answer(false)} />
          <CheckSwatch level={0.8} label="Second color swatch" onPress={() => answer(true)} />
        </View>
      ) : null}
      {q === 1 ? (
        <View style={styles.checkRow}>
          <CheckPads base={0.72} label="Left pad grid" onPress={() => answer(true)} />
          <CheckPads base={0.12} label="Right pad grid" onPress={() => answer(false)} />
        </View>
      ) : null}
      {q === 2 ? (
        <View style={styles.checkRow}>
          <CheckRta violate={false} label="Display A" onPress={() => answer(false)} />
          <CheckRta violate label="Display B" onPress={() => answer(true)} />
        </View>
      ) : null}

      {wrong ? (
        <View style={styles.checkWrongWrap}>
          <Text style={styles.checkWrong}>{CHECK_WRONG[q]}</Text>
          <GradientView
            colors={rampColors(1, 24)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.checkMiniRamp}
          />
        </View>
      ) : null}
    </View>
  );
}

/**
 * The whole educational page (header optional — the Foundations step supplies
 * its own title/paragraphs). Owns the completion CTA so Path A and Path B
 * behave identically: passing the ramp check enables the one green button.
 */
export function AmplitudeColorBody({
  showHeader = true,
  alsoReviewLab = false,
}: {
  showHeader?: boolean;
  /** Standalone lab (Path A): completing here ALSO records the Audio
   *  Fundamentals R6c credit — one button instead of the two stacked
   *  completion controls that let students press the green one and never earn
   *  the credit sitting a card lower (design pass 2026-08-31). */
  alsoReviewLab?: boolean;
}) {
  const done = useAmplitudeOrientationDone();
  // The credit is gated on the RAMP CHECK: three retrieval trials replace the
  // self-report tap, so "reviewed" means demonstrated rather than claimed —
  // which STRENGTHENS the §1.7 no-fabricated-progress rule.
  const [checkPassed, setCheckPassed] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  // B-152 (owner 2026-09-03, option b): when this page is reached already-done
  // via a lab gate, the orientation flag is set but the af_amplitude lab credit
  // is not — a VISIBLE Mark reviewed button keeps that credit reachable.
  const labReviewed = useLabDone('af_amplitude');
  return (
    <View style={styles.body}>
      {showHeader ? (
        <View style={{ gap: 2 }}>
          {/* Two identical 19pt titles competed instead of ranking (design pass
              2026-08-31): the methodology line is now the house amber eyebrow
              ABOVE the title — same words, ranked — which also pulls the ramp
              above the fold on a phone. */}
          <Text style={styles.titleEyebrow}>{AMP_ORIENT_TITLE2}</Text>
          <Text style={styles.title}>{AMP_ORIENT_TITLE}</Text>
          <Text style={styles.subtitle}>{AMP_ORIENT_SUBTITLE}</Text>
        </View>
      ) : null}

      {/* Contiguity (learning pass 2026-08-31): only paragraph 1 leads. The
          RULE (paragraph 3) sits directly above the ramp it describes, priming
          the invariant the finale later echoes; paragraph 2 moved down to the
          six cards it actually describes. All three paragraphs keep their
          ratified wording — they were re-seated, not rewritten. */}
      <View style={styles.explain}>
        <Text style={styles.explainText}>{AMP_ORIENT_PARAS[0]}</Text>
      </View>

      <Text style={styles.ruleLine}>{AMP_ORIENT_PARAS[2]}</Text>

      <GradientBar />

      <View style={{ gap: 3 }}>
        <Text style={styles.sixViews}>SIX VIEWS · ONE SIGNAL</Text>
        <Text style={styles.sixViewsSub}>{AMP_ORIENT_PARAS[1]}</Text>
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
          caption="Peak vs RMS — same signal"
          a11y="Level meter example: two meters for one signal — PEAK reads higher and hotter, RMS (average) reads lower and cooler"
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

      {/* The honesty line no longer floats as fine print between the grid and
          the callout — it closes the LEARNING CONVENTION card as a badge line
          (design pass 2026-08-31). Same words; more authority. One
          consolidated epistemic block. */}
      <View style={styles.convention}>
        <Text style={styles.conventionTitle}>{CONVENTION_TITLE}</Text>
        <Text style={styles.conventionBody}>{CONVENTION_BODY}</Text>
        <Text style={styles.honesty}>{HONESTY_LINE}</Text>
      </View>

      <View style={styles.finale} accessible accessibilityLabel="Blue means less. Red means more.">
        <Text style={[styles.finaleLine, { color: MIDLINE_BLUE }]}>BLUE = LESS</Text>
        <Text style={[styles.finaleLine, { color: LOUD_RED }]}>RED = MORE</Text>
      </View>

      {done ? (
        <>
          <View style={styles.doneChip}>
            <Text style={styles.doneChipText}>✓ ORIENTATION COMPLETE</Text>
          </View>
          {alsoReviewLab && !labReviewed ? (
            <GlassButton
              label="MARK REVIEWED"
              tint="green"
              height={52}
              onPress={() => markLabReviewed('af_amplitude')}
            />
          ) : null}
          {/* Cheap spaced retrieval: on revisits the dead chip gains a live
              practice affordance — the only retention mechanism available to a
              one-shot orientation page (learning pass 2026-08-31). */}
          {practiceOpen ? (
            <RampCheck practice />
          ) : (
            <Pressable
              onPress={() => setPracticeOpen(true)}
              style={styles.practiceBtn}
              accessibilityRole="button"
              accessibilityLabel="Test yourself again"
            >
              <Text style={styles.practiceBtnText}>TEST YOURSELF AGAIN ›</Text>
            </Pressable>
          )}
        </>
      ) : (
        <>
          <RampCheck onPassed={() => setCheckPassed(true)} />
          <GlassButton
            label={alsoReviewLab ? 'UNDERSTOOD — MARK REVIEWED' : 'UNDERSTOOD — CONTINUE'}
            tint="green"
            height={52}
            disabled={!checkPassed}
            onPress={() => {
              markAmplitudeOrientationComplete();
              if (alsoReviewLab) markLabReviewed('af_amplitude');
            }}
          />
        </>
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
          style={styles.gateBackBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.gateBack}>‹</Text>
        </Pressable>
        <Text style={styles.labHeaderKicker}>AUDIO FUNDAMENTALS</Text>
      </View>
      <ScrollView contentContainerStyle={styles.gateScroll}>
        {/* One completion control (design pass 2026-08-31): the old stacked
            pair — green CTA + a separate MARK AS REVIEWED card — let students
            press the obvious button and never earn the R6c credit below it.
            The body's single check-gated button now records BOTH; a passed
            retrieval check is stronger review evidence than a self-report tap,
            so §1.7 is strengthened, not bent. */}
        <AmplitudeColorBody alsoReviewLab />
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
          style={styles.gateBackBtn}
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
    height: 36, // a little taller so the glyphs have margin top and bottom
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#2c2c33',
    // No overflow:hidden — that clipped the tall SMuFL glyphs. The color slices
    // get their own clipped layer (gradSlices) instead.
  },
  gradSlices: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
  },
  // Amplitude-arrow overlays on the display cards (absolute, so no layout shift)
  ampArrowTopHalf: { position: 'absolute', left: 1, top: 4 }, // waveform / oscilloscope (+phase, top half)
  ampArrowBottomHalf: { position: 'absolute', left: 1, top: VIZ_H / 2 + 2 }, // (−phase, bottom half)
  ampArrowLevel: { position: 'absolute', left: 1, top: 1 }, // level meter (full height, left gutter)
  ampArrowRta: { position: 'absolute', left: 1, top: 2 }, // spectrum/RTA (full height)
  // Spectrogram time axis: light-gray arrow + "time" label, below the display
  spectroTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  spectroTimeLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 8.5, letterSpacing: 1, color: ARROW_GRAY },
  // (Dynamics are drawn in a Skia Canvas now — see GradientBar — so no RN text styles here.)
  qlRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  lmSpacer: { opacity: 0 }, // invisible LOW/HIGH copy sizing the flank so the arrow == bar width
  lmLabelWrap: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center' }, // overlay less/more
  qlText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.4, color: colors.textSub },
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
  // The axis caption is the ONE thing that differs between the six cards —
  // the discriminative feature the recognition task depends on — so it must
  // not be the least legible text on the page (was 8px #5a5b63 ≈ 2.6:1).
  axisBottom: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: colors.textSubAlt,
    textAlign: 'center',
    marginTop: 2,
  },

  // Waveform
  waveRow: { height: VIZ_H, flexDirection: 'row', alignItems: 'stretch', gap: 1, paddingLeft: ARROW_GUTTER },
  waveBarCol: { flex: 1, flexDirection: 'column' },
  waveMidline: {
    position: 'absolute',
    left: ARROW_GUTTER,
    right: 0,
    top: VIZ_H / 2 - 0.75,
    height: 1.5,
    backgroundColor: MIDLINE_BLUE,
    opacity: 0.8,
  },

  // Level meter
  meterWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 12, paddingVertical: 1 },
  meterBarCol: { alignItems: 'center', gap: 1 },
  meterCol: { width: 22, height: 72, gap: 2 },
  meterSeg: { flex: 1, borderRadius: 2 },
  meterBarLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 0.8, color: colors.textSub, marginTop: 3 },
  meterBarDb: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, color: colors.textSecondary },
  meterTicks: { height: 72, justifyContent: 'space-between', paddingRight: 1 },
  tickText: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.5, color: colors.textSubAlt },

  // SPL
  splReadout: { fontFamily: fonts.oswaldBold, fontSize: 22, color: colors.textPrimary, textAlign: 'center' },
  splUnit: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textSub },
  splRow: { height: 20, flexDirection: 'row', gap: 2 },
  splSeg: { flex: 1, borderRadius: 2 },
  splTicks: { flexDirection: 'row', justifyContent: 'space-between' },

  // RTA
  rtaRow: { height: VIZ_H, flexDirection: 'row', alignItems: 'stretch', gap: 2, paddingLeft: ARROW_GUTTER },
  rtaBarCol: { flex: 1, flexDirection: 'column' },

  honesty: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10.5,
    letterSpacing: 1.1,
    color: colors.amberLabel,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,198,77,.25)',
    paddingTop: 8,
    marginTop: 2,
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
  titleEyebrow: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11.5,
    letterSpacing: 2,
    color: colors.amberLabel,
  },
  // The rule, primed directly above the artifact it governs (ratified para 3).
  ruleLine: {
    fontFamily: fonts.barlowMedium,
    fontSize: 13.5,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  // ── RAMP CHECK ──
  checkCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.4)',
    backgroundColor: '#141210',
    padding: 14,
    gap: 10,
  },
  checkHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  checkTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.6, color: colors.amber },
  checkProgress: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.textSub },
  checkQ: { fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 20, color: colors.textPrimary },
  checkRow: { flexDirection: 'row', gap: 12 },
  checkSwatch: {
    flex: 1,
    height: 64,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,.4)',
  },
  checkSwatchGlyph: { fontFamily: fonts.oswaldBold, fontSize: 18, color: 'rgba(0,0,0,.55)' },
  checkPadWrap: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a30',
    backgroundColor: '#0b0b0e',
    padding: 10,
    minHeight: 64,
    justifyContent: 'center',
  },
  checkPadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  checkPad: { width: 26, height: 20, borderRadius: 4 },
  checkRtaWrap: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a30',
    backgroundColor: '#0b0b0e',
    padding: 10,
    height: 76,
    justifyContent: 'flex-end',
  },
  checkRtaRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  checkRtaBar: { flex: 1, borderRadius: 2 },
  checkWrongWrap: { gap: 6 },
  checkWrong: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 17, color: colors.amber },
  checkMiniRamp: { height: 8, borderRadius: 4 },
  checkPassed: { fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19, color: colors.green },
  practiceBtn: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  practiceBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.4, color: colors.amberLabel },

  // Gate page
  gateHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingBottom: 8 },
  gateBackBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  gateBack: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4 },
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
