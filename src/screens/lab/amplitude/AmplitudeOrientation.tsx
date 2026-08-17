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
import { LabReviewButton } from '../../../features/lab/LabReviewButton';
import { AlphaType, Canvas, ColorType, Image, LinearGradient, Path, Rect, Skia, Text as SkiaText, useFont, vec } from '@shopify/react-native-skia';
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
            <View style={{ flex: Math.max(0.02, a * 2), backgroundColor: levelColor(a), borderRadius: 1 }} />
            <View style={{ flex: 1 - a, opacity: 0 }} />
          </View>
        ))}
      </View>
      <View style={styles.waveMidline} pointerEvents="none" />
      {/* Amplitude grows midline → top; arrow on the top half (bipolar display). */}
      <View style={styles.ampArrowTopHalf} pointerEvents="none">
        <AmplitudeArrow w={14} h={VIZ_H / 2 - 6} dir="up" />
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
      {/* Amplitude grows zero-line → top; arrow on the top half (bipolar). */}
      <View style={styles.ampArrowTopHalf} pointerEvents="none">
        <AmplitudeArrow w={14} h={VIZ_H / 2 - 6} dir="up" />
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
      <Text style={styles.meterBarDb}>{db}</Text>
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
      <Text style={styles.splReadout}>
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
            <View style={{ flex: Math.max(0.03, m), backgroundColor: levelColor(m), borderRadius: 1.5 }} />
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
  // One fine SkImage, built once and scaled smoothly to the card (no blocky grid).
  const img = useMemo(() => buildSpectroImage(), []);
  return (
    <View style={styles.vizFill} onLayout={(e) => onW(Math.round(e.nativeEvent.layout.width))}>
      {w > 0 && img ? (
        <Canvas style={{ width: w, height: VIZ_H }}>
          <Image image={img} x={0} y={0} width={w} height={VIZ_H} fit="fill" />
        </Canvas>
      ) : null}
      <Text style={styles.axisBottom}>TIME → · FREQ ↑</Text>
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

const DYN_BAR_H = 36; // gradient bar height (matches styles.gradBar)
const DYN_SIZE = 26; // glyph point size (owner: 2pt smaller); forte ink ≈ 0.6em
const DYN_SHIFT = 10; // px the whole marks group is nudged left (owner 2026-08-16)
/** Baseline y that vertically centers the tallest glyph (forte) in the bar:
 *  forte ink sits ~0.445em above / 0.15em below baseline, so its ink centre is
 *  0.1475em above the baseline. */
const DYN_BASELINE = DYN_BAR_H / 2 + 0.1475 * DYN_SIZE;

// ── Amplitude arrow ──────────────────────────────────────────────────────────
// A gradient arrow in the SAME amplitude ramp as the bar — a reusable "amplitude
// grows THIS way" indicator (owner 2026-08-16). Drawn in Skia so it's crisp and
// can be dropped over any display. dir 'right' = low→high left→right; dir 'up' =
// low→high bottom→top (for the vertical displays).
const ARROW_STOP_T = [0, 0.2, 0.4, 0.6, 0.8, 1];
const ARROW_COLORS = ARROW_STOP_T.map((t) => heatColor(t));
const ARROW_H = 14; // horizontal-arrow canvas height (not too thick, not too thin)
const ARROW_GUTTER = 16; // reserved edge strip so a vertical arrow never covers the data

function AmplitudeArrow({ w, h, dir = 'right' }: { w: number; h: number; dir?: 'right' | 'up' }) {
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
  const end = dir === 'up' ? vec(0, 0) : vec(w, 0);
  return (
    <Canvas style={{ width: w, height: h }} pointerEvents="none">
      <Path path={path}>
        <LinearGradient start={start} end={end} colors={ARROW_COLORS} positions={ARROW_STOP_T} />
      </Path>
    </Canvas>
  );
}

function GradientBar() {
  const n = 48;
  const [barW, setBarW] = useState(0);
  // Skia loads its OWN copy of the font at the exact point size we draw at.
  const dynFont = useFont(require('../../../../assets/fonts/Bravura.otf'), DYN_SIZE);
  return (
    <View
      style={{ gap: 5 }}
      accessible
      accessibilityLabel="The Academy magnitude scale: dark blue for the lowest level, through blue, green, yellow and orange, to red for the highest level — marked with musical dynamics rising with level: pianissimo, mezzo-piano, forte, fortississimo"
    >
      {/* Plain-language gloss above the bar: the dynamics run quiet → loud. */}
      <View style={styles.qlRow}>
        <Text style={styles.qlText}>quiet</Text>
        <Text style={styles.qlText}>loud</Text>
      </View>
      {/* Complementary gradient arrow, aligned above the bar via invisible LOW/HIGH
          spacers so it spans exactly the bar's width. */}
      <View
        style={styles.gradRow}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={[styles.gradEnd, styles.gradEndHidden]}>LOW</Text>
        <View style={{ flex: 1 }}>
          {barW > 0 ? <AmplitudeArrow w={barW} h={ARROW_H} dir="right" /> : <View style={{ height: ARROW_H }} />}
        </View>
        <Text style={[styles.gradEnd, styles.gradEndHidden]}>HIGH</Text>
      </View>
      <View style={styles.gradRow}>
        <Text style={styles.gradEnd}>LOW</Text>
        <View
          style={styles.gradBar}
          onLayout={(e) => setBarW(Math.round(e.nativeEvent.layout.width))}
        >
          {/* Color slices in their OWN clipped, rounded layer. */}
          <View style={styles.gradSlices}>
            {Array.from({ length: n }, (_, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: heatColor(i / (n - 1)) }} />
            ))}
          </View>
          {/* Musical dynamics drawn in Skia at an exact baseline — no RN text
              layout, so no clipping / disappearing / Dynamic-Type scaling. Each
              glyph is horizontally centred on its position (frac × width). */}
          {barW > 0 && dynFont ? (
            <Canvas style={{ position: 'absolute', top: 0, left: 0, width: barW, height: DYN_BAR_H }} pointerEvents="none">
              {DYN_MARKS.map((m, i) => (
                <SkiaText
                  key={i}
                  x={m.frac * barW - dynFont.getTextWidth(m.g) / 2 - DYN_SHIFT}
                  y={DYN_BASELINE}
                  text={m.g}
                  font={dynFont}
                  color="#000000"
                />
              ))}
            </Canvas>
          ) : null}
        </View>
        <Text style={[styles.gradEnd, { color: LOUD_RED }]}>HIGH</Text>
      </View>
      {/* Mirror of quiet/loud, beneath LOW/HIGH: the magnitude gloss. */}
      <View style={styles.qlRow}>
        <Text style={styles.qlText}>less</Text>
        <Text style={styles.qlText}>more</Text>
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
          {/* Second title — same size/weight/colour as the main title (owner 2026-08-12). */}
          <Text style={styles.title}>{AMP_ORIENT_TITLE2}</Text>
          <Text style={styles.subtitle}>{AMP_ORIENT_SUBTITLE}</Text>
        </View>
      ) : null}

      {/* Core methodology explanation leads (owner 2026-08-12): the text sits
          directly under the titles, above the low→high colour spectrum. */}
      <View style={styles.explain}>
        {AMP_ORIENT_PARAS.map((p) => (
          <Text key={p} style={styles.explainText}>
            {p}
          </Text>
        ))}
      </View>

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

      <Text style={styles.honesty}>{HONESTY_LINE}</Text>

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
        {/* R6c: this read-through has no modules/challenge — an explicit review
            records its Audio Fundamentals credit (§1.7: no fabricated progress). */}
        <LabReviewButton labKey="af_amplitude" />
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
  gradEndHidden: { opacity: 0 }, // invisible spacer copy that keeps the arrow aligned to the bar
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
  ampArrowTopHalf: { position: 'absolute', left: 1, top: 4 }, // waveform / oscilloscope (top half)
  ampArrowLevel: { position: 'absolute', left: 1, top: 1 }, // level meter (full height, left gutter)
  ampArrowRta: { position: 'absolute', left: 1, top: 2 }, // spectrum/RTA (full height)
  // (Dynamics are drawn in a Skia Canvas now — see GradientBar — so no RN text styles here.)
  qlRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
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
  axisBottom: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 8,
    letterSpacing: 0.8,
    color: '#5a5b63',
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
  tickText: { fontFamily: fonts.oswaldSemiBold, fontSize: 8.5, letterSpacing: 0.5, color: '#5a5b63' },

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
