/**
 * SpectrogramDemo — visual training demo for the Spectrogram tool (spec of
 * record docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §12; demo contract §4, user
 * ruling 2026-07-23: demos are visual/animated only — no audio path exists).
 *
 * MOTION MODEL (owner 2026-08-05): a real spectrogram STREAMS — the freshest
 * column is painted at the RIGHT edge ("now") and every older column scrolls
 * LEFT. So the demo scrolls its content right→left continuously (two identical
 * copies translated by −width → seamless, no seam, no reset flash). There is no
 * sweeping playhead any more (it read as a vertical "event" and confused the
 * picture). Because sustained tones are horizontal they sit visually still while
 * transient verticals scroll by — which is exactly the lesson.
 *
 * DESIGN PASS 2026-09-13 (tool-demo design brief): panels are now FULL WIDTH and
 * stacked (the old side-by-side halves were cramped at phone width — a
 * spectrogram is a READING skill and needs legible detail). Each scene annotates
 * INSIDE the picture with leader-line callouts (amber = the thing being taught,
 * salmon = the problem/limit, steel = neutral reference) drawn in a static
 * overlay SVG in percentage coordinates so the labels never distort. Captions
 * are structured WATCH FOR / body / FIELD NOTE. The FEEDBACK scene animates a
 * ring-up: the streak's glow swells over ~4 s, then is cut (the fader pull) —
 * native-driver opacity on Views only; all SVG geometry stays static.
 *
 * Three scenes, switched via rack-key tabs:
 *   1 SPEECH vs MUSIC — syllable bursts with bending harmonics + sibilance
 *     splashes, stacked over steady harmonic lines with vertical drum hits.
 *   2 FEEDBACK — one sustained horizontal streak intensifying over scrolling
 *     program material, with the two-step field move (pull fader → notch).
 *   3 FFT TRADE-OFF — the SAME signal under a long window (tones resolved,
 *     clicks smeared) and a short window (clicks pinned, tones merged), stacked
 *     so the identical click positions line up between the panels.
 *
 * Amplitude is drawn with the app MIDI level ramp (owner 2026-08-05, item 4):
 * loud = red → quiet = blue, via features/tools/levelColor. All content is fixed
 * precomputed data (no Math.random). Motion is RN core Animated only (native
 * transform/opacity). Nothing here is or resembles a live meter (spec §1.7).
 */
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { levelColor } from '../../features/tools/levelColor';
import { colors, fonts } from '../../theme/tokens';

/* ------------------------------------------------------------------ */
/* Fixed, deterministic scene data (computed once at module load)      */
/* ------------------------------------------------------------------ */

const VB_W = 320; // viewBox width of every (full-width) plot strip
const VB_H = 148; // viewBox height
const F_TOP = 8; // y of the highest drawn frequency
const F_BOTTOM = 140; // y of the lowest drawn frequency

/** Map a normalized frequency (0..1, 1 = top of plot) to a viewBox y. */
function yForFreq(f: number): number {
  return F_BOTTOM - f * (F_BOTTOM - F_TOP);
}

/** MIDI amplitude colour for a 0..1 loudness (1 = full scale/red, 0 = blue). */
const amp = (loud: number) => levelColor(loud);

/** Callout palette (shared demo contract): amber = taught/correct,
 *  salmon = problem/limit, steel = neutral reference. */
const CALL_AMBER = '#ffb400';
const CALL_SALMON = '#ff8d7a';
const CALL_STEEL = '#9aa3ad';

/** Voiced speech syllables (fractions of the time axis) with silent gaps.
 *  The 0.95→1→0.03 wrap is itself a between-words gap, so the seam is honest. */
const SPEECH_SEGMENTS: ReadonlyArray<readonly [number, number]> = [
  [0.03, 0.17],
  [0.22, 0.34],
  [0.41, 0.56],
  [0.61, 0.73],
  [0.79, 0.95],
];
/** Fixed per-segment pitch-contour phases + per-harmonic jitter (seeded). */
const SEG_PHASE = [0.12, 0.38, 0.57, 0.74, 0.92] as const;
const HARM_JITTER = [0, 0.004, -0.003, 0.005, -0.002] as const;
const HARM_WIDTH = [3.4, 2.9, 2.4, 2.1, 1.9] as const;
/** Per-harmonic loudness → MIDI colour (fundamental loud, decaying upward). */
const HARM_LOUD = [0.96, 0.76, 0.58, 0.44, 0.32] as const;

function buildSpeechPaths(): string[] {
  const paths: string[] = [];
  for (let k = 1; k <= 5; k++) {
    const parts: string[] = [];
    SPEECH_SEGMENTS.forEach(([a, b], si) => {
      const steps = 16;
      for (let i = 0; i <= steps; i++) {
        const t = a + ((b - a) * i) / steps;
        const f0 =
          0.135 + (HARM_JITTER[k - 1] ?? 0) + 0.026 * Math.sin(2 * Math.PI * (1.15 * t + (SEG_PHASE[si] ?? 0)));
        const x = t * VB_W;
        const y = yForFreq(Math.min(0.95, k * f0));
        parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
      }
    });
    paths.push(parts.join(' '));
  }
  return paths;
}
const SPEECH_PATHS = buildSpeechPaths();

/** Sibilance splashes ("s" sounds): fixed clusters of short high-frequency
 *  strokes just after a syllable ends — broadband hiss, moderate level. */
const SIB_CENTERS = [0.36, 0.755] as const;
const SIB_OFFSETS = [-0.011, -0.0055, 0, 0.0055, 0.011] as const;
const SIB_TOPS = [0.9, 0.82, 0.93, 0.79, 0.87] as const;
const SIB_BOTS = [0.66, 0.6, 0.7, 0.63, 0.58] as const;
const SIB_STROKES: ReadonlyArray<{ x: number; y1: number; y2: number }> = SIB_CENTERS.flatMap((c) =>
  SIB_OFFSETS.map((o, i) => ({
    x: (c + o) * VB_W,
    y1: yForFreq(SIB_TOPS[i] ?? 0.85),
    y2: yForFreq(SIB_BOTS[i] ?? 0.62),
  })),
);

/** Music: sustained harmonic ladder + transient hits (fixed positions). */
const MUSIC_FREQS = [0.14, 0.28, 0.42, 0.56, 0.7] as const;
const MUSIC_WIDTH = [3.2, 2.8, 2.3, 2, 1.8] as const;
const MUSIC_LOUD = [0.95, 0.78, 0.6, 0.46, 0.34] as const;
const MUSIC_HITS = [0.07, 0.24, 0.41, 0.58, 0.75, 0.9] as const;

/** Feedback scene: dim program material behind the ringing frequency. */
const FB_BANDS = [0.1, 0.27, 0.42, 0.66] as const;
const FB_TICKS = [0.14, 0.38, 0.6, 0.86] as const;
const FB_RING_F = 0.55;
const FB_RING_Y = yForFreq(FB_RING_F);

/** FFT trade-off: two close tones + four clicks — the SAME "signal" in both
 *  panels (identical click x-positions, so stacked panels line up). */
const FFT_TONES = [0.52, 0.585] as const;
const FFT_CLICKS = [0.15, 0.38, 0.61, 0.84] as const;
const FFT_BAND_TOP = yForFreq(0.635);
const FFT_BAND_H = yForFreq(0.47) - FFT_BAND_TOP;

/* Plot heights (px). The feedback hero panel gets the most room. */
const H_STACKED = 134; // each of the two stacked comparison panels
const H_FEEDBACK = 192;
const H_FFT = 128;
/** Frame inset (padding 5 + border 1) — used to place the animated ring glow. */
const FRAME_INSET = 6;

const SCENES = [
  {
    key: 'speechMusic',
    label: 'SPEECH vs MUSIC',
    a11y: 'speech versus music',
    watch: 'SUSTAINED = HORIZONTAL · TRANSIENT = VERTICAL',
    body:
      'The display streams right to left — the newest sound always enters at the NOW edge. Speech draws ' +
      'syllable-sized bursts: stacked harmonics that bend with the pitch of the voice, silent gaps between words, ' +
      'and a splash of high-frequency sibilance on “s” sounds. Music holds a steadier harmonic ladder — those lines ' +
      'sit still while time scrolls — and every drum hit prints a vertical stripe, because a transient is a ' +
      'split-second event spread across many frequencies.',
    note: 'Freeze the display before reading fine detail — scrolling pixels invite guesses.',
  },
  {
    key: 'feedback',
    label: 'FEEDBACK',
    a11y: 'feedback ringing',
    watch: 'ONE THIN LINE THAT HOLDS STILL AND BRIGHTENS',
    body:
      'Feedback rings at one exact frequency, so it draws a single horizontal streak that never starts, stops, or ' +
      'moves — it only grows brighter as the loop gain builds. The program material scrolls past underneath; the ' +
      'ring sits still. Read its height off the frequency axis and you have the offending frequency — 2.4 kHz in ' +
      'this example — before you ever touch an EQ.',
    note: 'A held synth note also draws a horizontal line — but notes step with the music. Feedback never moves.',
  },
  {
    key: 'fft',
    label: 'FFT TRADE-OFF',
    a11y: 'FFT size trade-off',
    watch: 'SAME SIGNAL — TWO WINDOW LENGTHS',
    body:
      'Both panels analyze the same feed: two tones only 60 Hz apart, plus sharp clicks. The long 8192-sample ' +
      'window (≈171 ms at 48 kHz) resolves the tones as two separate lines but smears every click into a wide ' +
      'streak. The short 256-sample window (≈5 ms) pins each click crisply in time while the tones blur into one ' +
      'thick band. Sharpening one axis always smears the other — a mathematical limit, not a software flaw, and ' +
      'exactly why the tool ships presets like Feedback/Ringing and Transient.',
    note: 'Blur can be your window setting, not your signal — check the FFT preset before blaming the source.',
  },
] as const;

/* ------------------------------------------------------------------ */
/* In-plot callouts (static overlay, percentage coordinates)           */
/* ------------------------------------------------------------------ */

/** ViewBox-unit → percentage converters. The annotation overlay uses PERCENT
 *  coordinates (no viewBox) so callout text renders crisp and undistorted no
 *  matter how the plot rectangle is stretched. */
const px = (x: number) => `${((x / VB_W) * 100).toFixed(2)}%`;
const py = (y: number) => `${((y / VB_H) * 100).toFixed(2)}%`;

interface CalloutProps {
  /** Leader line, in viewBox units (from near the label to the feature). */
  lx1: number;
  ly1: number;
  lx2: number;
  ly2: number;
  /** Label anchor point, in viewBox units. */
  tx: number;
  ty: number;
  label: string;
  color: string;
  anchor?: 'start' | 'middle' | 'end';
}

function Callout({ lx1, ly1, lx2, ly2, tx, ty, label, color, anchor }: CalloutProps) {
  return (
    <>
      <Line x1={px(lx1)} y1={py(ly1)} x2={px(lx2)} y2={py(ly2)} stroke='rgba(255,255,255,0.35)' strokeWidth={1} />
      <SvgText
        x={px(tx)}
        y={py(ty)}
        fill={color}
        fontSize={10}
        letterSpacing={1}
        fontFamily={fonts.oswaldSemiBold}
        textAnchor={anchor ?? 'start'}
      >
        {label}
      </SvgText>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Plot shell: recessed frame + seamless right→left streaming scroll   */
/* ------------------------------------------------------------------ */

interface ScrollPlotProps {
  scroll: Animated.Value;
  height: number;
  /** Renders one width-`w` copy of the spectrogram content (SVG). */
  strip: (w: number) => ReactNode;
  /** Static annotation layer (Callouts etc.) — drawn over the scroll, never moves. */
  overlay?: ReactNode;
  /** Animated View layers (e.g. the feedback ring glow) — above the strip. */
  children?: ReactNode;
}

/** Two identical copies side by side, translated 0 → −w over the loop: the left
 *  copy exits left exactly as the right copy arrives, so the scroll is seamless
 *  and needs no reset flash. New content therefore always enters at the right. */
function ScrollPlot({ scroll, height, strip, overlay, children }: ScrollPlotProps) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const translateX = scroll.interpolate({ inputRange: [0, 1], outputRange: [0, -Math.max(1, w)] });
  return (
    <View style={[styles.plotFrame, { height }]}>
      <View style={styles.plot} onLayout={onLayout}>
        {w > 0 ? (
          <Animated.View style={[styles.scrollStrip, { width: w * 2, transform: [{ translateX }] }]}>
            <View style={{ width: w, height: '100%' }}>{strip(w)}</View>
            <View style={{ width: w, height: '100%' }}>{strip(w)}</View>
          </Animated.View>
        ) : null}
        {children}
        {overlay ? (
          <View pointerEvents='none' style={StyleSheet.absoluteFill}>
            <Svg width='100%' height='100%'>
              {overlay}
            </Svg>
          </View>
        ) : null}
        {/* "Now" edge — the right edge is the freshest column. */}
        <View pointerEvents='none' style={styles.nowGlow} />
        <View pointerEvents='none' style={styles.nowEdge} />
        <Text style={styles.nowLabel}>NOW</Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Scene strip renderers (one width-`w` copy each)                     */
/* ------------------------------------------------------------------ */

function speechStrip(w: number) {
  return (
    <Svg width={w} height='100%' viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio='none'>
      {/* Sibilance splashes — broadband high-frequency hiss after a syllable. */}
      {SIB_STROKES.map((s, i) => (
        <Line
          key={`sib${i}`}
          x1={s.x}
          y1={s.y1}
          x2={s.x}
          y2={s.y2}
          stroke={amp(0.5)}
          strokeWidth={2.2}
          strokeOpacity={0.5}
          strokeLinecap='round'
        />
      ))}
      {/* Voiced syllables — stacked harmonics bending with the pitch contour. */}
      {SPEECH_PATHS.map((d, i) => (
        <Path
          key={`sp${i}`}
          d={d}
          fill='none'
          stroke={amp(HARM_LOUD[i] ?? 0.3)}
          strokeWidth={HARM_WIDTH[i] ?? 2}
          strokeOpacity={0.92}
          strokeLinecap='round'
        />
      ))}
    </Svg>
  );
}

function musicStrip(w: number) {
  return (
    <Svg width={w} height='100%' viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio='none'>
      {/* Transient attacks — broadband verticals (loud, warm); these scroll. */}
      {MUSIC_HITS.map((t, i) => (
        <Line
          key={`mh${i}`}
          x1={t * VB_W}
          y1={F_TOP}
          x2={t * VB_W}
          y2={F_BOTTOM}
          stroke={amp(0.82)}
          strokeWidth={2.6}
          strokeOpacity={0.4}
        />
      ))}
      {/* Sustained harmonic ladder — horizontal, sits still as time scrolls.
          Full-bleed x (0..VB_W) so the two-copy seam never shows a break. */}
      {MUSIC_FREQS.map((f, i) => (
        <Line
          key={`mf${i}`}
          x1={0}
          y1={yForFreq(f)}
          x2={VB_W}
          y2={yForFreq(f)}
          stroke={amp(MUSIC_LOUD[i] ?? 0.3)}
          strokeWidth={MUSIC_WIDTH[i] ?? 2}
          strokeOpacity={0.95}
        />
      ))}
    </Svg>
  );
}

function feedbackStrip(w: number) {
  return (
    <Svg width={w} height='100%' viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio='none'>
      {/* Passing transients — dim verticals; these are what visibly scroll. */}
      {FB_TICKS.map((t, i) => (
        <Line
          key={`ft${i}`}
          x1={t * VB_W}
          y1={F_TOP}
          x2={t * VB_W}
          y2={F_BOTTOM}
          stroke={amp(0.28)}
          strokeWidth={2}
          strokeOpacity={0.35}
        />
      ))}
      {/* Dim program material — quiet horizontal bands (cool colours). */}
      {FB_BANDS.map((f, i) => (
        <Line
          key={`fb${i}`}
          x1={0}
          y1={yForFreq(f)}
          x2={VB_W}
          y2={yForFreq(f)}
          stroke={amp(0.22)}
          strokeWidth={2.5}
          strokeOpacity={0.5}
        />
      ))}
      {/* The ring's base line — sustained, HORIZONTAL, always present. The
          intensifying glow is an animated View layered above (ring-up → cut). */}
      <Line x1={0} y1={FB_RING_Y} x2={VB_W} y2={FB_RING_Y} stroke={amp(1)} strokeWidth={6.5} strokeOpacity={0.14} />
      <Line x1={0} y1={FB_RING_Y} x2={VB_W} y2={FB_RING_Y} stroke={amp(0.95)} strokeWidth={2.4} strokeOpacity={0.55} />
    </Svg>
  );
}

function fftBigStrip(w: number) {
  return (
    <Svg width={w} height='100%' viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio='none'>
      {/* Clicks smeared wide across time (soft warm blur). */}
      {FFT_CLICKS.map((t, i) => (
        <Rect
          key={`bc${i}`}
          x={t * VB_W - 11}
          y={F_TOP}
          width={22}
          height={F_BOTTOM - F_TOP}
          fill={amp(0.7)}
          fillOpacity={0.16}
        />
      ))}
      {/* Two close tones crisply resolved (loud → red). */}
      {FFT_TONES.map((f, i) => (
        <Line
          key={`bt${i}`}
          x1={0}
          y1={yForFreq(f)}
          x2={VB_W}
          y2={yForFreq(f)}
          stroke={amp(0.95)}
          strokeWidth={1.8}
          strokeOpacity={0.97}
        />
      ))}
    </Svg>
  );
}

function fftSmallStrip(w: number) {
  return (
    <Svg width={w} height='100%' viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio='none'>
      {/* Tones smeared into one thick band (medium loudness → yellow/orange). */}
      <Rect x={0} y={FFT_BAND_TOP} width={VB_W} height={FFT_BAND_H} fill={amp(0.6)} fillOpacity={0.22} />
      <Line
        x1={0}
        y1={yForFreq(0.5525)}
        x2={VB_W}
        y2={yForFreq(0.5525)}
        stroke={amp(0.72)}
        strokeWidth={4}
        strokeOpacity={0.4}
      />
      {/* Clicks crisply resolved in time (loud verticals; these scroll). */}
      {FFT_CLICKS.map((t, i) => (
        <Line
          key={`sc${i}`}
          x1={t * VB_W}
          y1={F_TOP}
          x2={t * VB_W}
          y2={F_BOTTOM}
          stroke={amp(0.92)}
          strokeWidth={2.2}
          strokeOpacity={0.97}
        />
      ))}
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

interface SceneProps {
  scroll: Animated.Value;
}

function SpeechMusicScene({ scroll }: SceneProps) {
  return (
    <>
      <Text style={styles.plotLabel}>SPEECH</Text>
      <ScrollPlot
        scroll={scroll}
        height={H_STACKED}
        strip={speechStrip}
        overlay={
          <>
            <Callout
              lx1={30}
              ly1={23}
              lx2={52}
              ly2={52}
              tx={6}
              ty={17}
              label='SYLLABLES · PITCH BENDS'
              color={CALL_AMBER}
            />
            {/* ty below the NOW tag's band — at ty 17 the label ran into
                "NOW" and read "SIBILANCENOW" (integration pass 2026-09-13). */}
            <Callout
              lx1={286}
              ly1={30}
              lx2={270}
              ly2={38}
              tx={296}
              ty={34}
              label='SIBILANCE'
              color={CALL_STEEL}
              anchor='end'
            />
          </>
        }
      />
      <Text style={styles.plotLabel}>MUSIC</Text>
      <ScrollPlot
        scroll={scroll}
        height={H_STACKED}
        strip={musicStrip}
        overlay={
          <>
            <Callout
              lx1={252}
              ly1={39}
              lx2={240}
              ly2={46}
              tx={312}
              ty={35}
              label='HARMONICS HOLD STILL'
              color={CALL_AMBER}
              anchor='end'
            />
            <Callout
              lx1={36}
              ly1={136}
              lx2={52}
              ly2={122}
              tx={6}
              ty={144}
              label='DRUM HIT = VERTICAL'
              color={CALL_STEEL}
            />
          </>
        }
      />
    </>
  );
}

function FeedbackScene({ scroll }: SceneProps) {
  // Ring-up story (native-driver opacity on Views only): the glow swells over
  // ~4 s as loop gain builds, then is CUT — the engineer pulled the fader —
  // holds low, and the cycle repeats. Calm, no strobe.
  const ring = useRef(new Animated.Value(0.12)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(450),
        Animated.timing(ring, { toValue: 0.12, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(1700),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [ring]);

  const innerH = H_FEEDBACK - FRAME_INSET * 2;
  const ringCenter = innerH * (FB_RING_Y / VB_H);
  const outerOpacity = ring.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });

  return (
    <>
      <View style={styles.headRow}>
        <Text style={styles.plotLabel}>FEEDBACK RING-UP</Text>
        <Text style={styles.monoTag}>2.4 kHz</Text>
      </View>
      <ScrollPlot
        scroll={scroll}
        height={H_FEEDBACK}
        strip={feedbackStrip}
        overlay={
          <>
            {/* Frequency-axis tick at the ring height — read the frequency
                straight off the display. */}
            <Line x1={px(0)} y1={py(FB_RING_Y)} x2={px(8)} y2={py(FB_RING_Y)} stroke={CALL_STEEL} strokeWidth={1.5} />
            <SvgText x={px(11)} y={py(FB_RING_Y + 3.5)} fill={CALL_STEEL} fontSize={10} fontFamily={fonts.mono}>
              2.4 kHz
            </SvgText>
            <Callout
              lx1={110}
              ly1={39}
              lx2={128}
              ly2={62}
              tx={60}
              ty={34}
              label='FEEDBACK RING — HOLDS · BRIGHTENS'
              color={CALL_SALMON}
            />
            <Callout
              lx1={272}
              ly1={126}
              lx2={258}
              ly2={109}
              tx={312}
              ty={133}
              label='PROGRAM — SCROLLS PAST'
              color={CALL_STEEL}
              anchor='end'
            />
          </>
        }
      >
        {/* Animated ring glow — swells (ring-up), then cut (fader pulled). */}
        <Animated.View
          pointerEvents='none'
          style={[styles.ringGlowOuter, { top: ringCenter - 8, opacity: outerOpacity }]}
        />
        <Animated.View pointerEvents='none' style={[styles.ringGlowCore, { top: ringCenter - 2, opacity: ring }]} />
      </ScrollPlot>

      {/* The field move — what a live engineer does when this line appears. */}
      <Text style={styles.moveEyebrow}>THE FIELD MOVE</Text>
      <View style={styles.moveRow}>
        <View style={styles.moveCard}>
          <Text style={styles.moveNum}>1</Text>
          <View style={styles.moveBody}>
            <Text style={styles.moveTitle}>PULL THE FADER</Text>
            <Text style={styles.moveSub}>Stop the ring-up first — loop gain is the cause.</Text>
          </View>
        </View>
        <View style={styles.moveCard}>
          <Text style={styles.moveNum}>2</Text>
          <View style={styles.moveBody}>
            <Text style={styles.moveTitle}>NOTCH 2.4 kHz</Text>
            <Text style={styles.moveSub}>Narrow cut, a few dB — not a wide scoop.</Text>
          </View>
        </View>
      </View>
    </>
  );
}

function FftScene({ scroll }: SceneProps) {
  return (
    <>
      <View style={styles.headRow}>
        <Text style={styles.plotLabel}>
          LONG WINDOW <Text style={styles.monoInline}>8192 ≈ 171 ms</Text>
        </Text>
        <Text style={styles.tradeLabel}>SHARP FREQ · SMEARED TIME</Text>
      </View>
      <ScrollPlot
        scroll={scroll}
        height={H_FFT}
        strip={fftBigStrip}
        overlay={
          <>
            <Callout
              lx1={252}
              ly1={48}
              lx2={240}
              ly2={60}
              tx={312}
              ty={44}
              label='TWO TONES RESOLVED'
              color={CALL_AMBER}
              anchor='end'
            />
            <Callout lx1={30} ly1={23} lx2={46} ly2={42} tx={6} ty={17} label='CLICKS SMEAR WIDE' color={CALL_SALMON} />
          </>
        }
      />
      <View style={styles.headRow}>
        <Text style={styles.plotLabel}>
          SHORT WINDOW <Text style={styles.monoInline}>256 ≈ 5 ms</Text>
        </Text>
        <Text style={styles.tradeLabel}>SHARP TIME · SMEARED FREQ</Text>
      </View>
      <ScrollPlot
        scroll={scroll}
        height={H_FFT}
        strip={fftSmallStrip}
        overlay={
          <>
            <Callout
              lx1={250}
              ly1={44}
              lx2={240}
              ly2={56}
              tx={312}
              ty={40}
              label='TONES MERGE — ONE BAND'
              color={CALL_SALMON}
              anchor='end'
            />
            <Callout
              lx1={30}
              ly1={23}
              lx2={46}
              ly2={42}
              tx={6}
              ty={17}
              label='CLICKS PINNED SHARP'
              color={CALL_AMBER}
            />
          </>
        }
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* MIDI amplitude legend (item 4)                                      */
/* ------------------------------------------------------------------ */

function AmpLegend() {
  return (
    <View style={styles.legendRow}>
      <Text style={styles.legendCap}>QUIET</Text>
      <View style={styles.legendBar}>
        <Svg width='100%' height='100%' preserveAspectRatio='none' viewBox='0 0 100 10'>
          <Defs>
            <LinearGradient id='specAmp' x1='0' y1='0' x2='100' y2='0' gradientUnits='userSpaceOnUse'>
              {[0, 0.25, 0.5, 0.75, 1].map((s) => (
                <Stop key={s} offset={String(s)} stopColor={levelColor(s)} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={100} height={10} rx={2} fill='url(#specAmp)' />
        </Svg>
      </View>
      <Text style={styles.legendCap}>LOUD</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Demo component                                                      */
/* ------------------------------------------------------------------ */

export function SpectrogramDemo() {
  const [scene, setScene] = useState(0);
  const scroll = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scroll.setValue(0);
    // Linear, gapless loop: 0 → 1 maps to a full-width leftward shift. Because
    // the two strip copies are identical, value 1 is pixel-for-pixel value 0, so
    // the restart is invisible and the scroll never stutters.
    const anim = Animated.loop(
      Animated.timing(scroll, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [scene, scroll]);

  const current = SCENES[scene] ?? SCENES[0];

  return (
    <View style={styles.panel}>
      <View style={styles.chipRow} accessibilityRole='tablist'>
        {SCENES.map((s, i) => {
          const active = i === scene;
          return (
            <Pressable
              key={s.key}
              accessibilityRole='tab'
              accessibilityState={{ selected: active }}
              aria-selected={active}
              accessibilityLabel={`Show ${s.a11y} scene`}
              onPress={() => setScene(i)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {scene === 0 ? (
        <SpeechMusicScene scroll={scroll} />
      ) : scene === 1 ? (
        <FeedbackScene scroll={scroll} />
      ) : (
        <FftScene scroll={scroll} />
      )}

      <View style={styles.axisRow}>
        <Text style={styles.axisText}>FREQ ↑</Text>
        <Text style={styles.axisText}>◄ OLDER · TIME · NEWEST ►</Text>
      </View>

      <AmpLegend />

      <View style={styles.captionBlock}>
        <Text style={styles.watchFor}>WATCH FOR — {current.watch}</Text>
        <Text style={styles.captionBody}>{current.body}</Text>
        <Text style={styles.fieldNote}>FIELD NOTE — {current.note}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
    gap: 8,
  },

  // Scene tabs — shared rack-key spec (demo design brief 2026-09-13).
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 2 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.steelBorder,
    backgroundColor: '#141414',
  },
  chipActive: { borderColor: colors.amber, backgroundColor: 'rgba(255,180,0,0.10)' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textMuted },
  chipTextActive: { color: colors.amber },

  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  plotLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.4,
    color: colors.amberLabel,
  },
  monoInline: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 0, color: colors.amber },
  monoTag: { fontFamily: fonts.mono, fontSize: 12, color: colors.amber },
  tradeLabel: {
    fontFamily: fonts.barlowCondensedMedium,
    fontSize: 12,
    letterSpacing: 0.4,
    color: colors.textSub,
  },

  // Recessed glass instrumentation frame around each plot.
  plotFrame: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: '#0b0c0e',
    padding: 5,
  },
  plot: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: '#040507', // near-black floor: dark = nothing there (honest)
    overflow: 'hidden',
  },
  scrollStrip: { position: 'absolute', top: 0, bottom: 0, left: 0, flexDirection: 'row' },

  // Right-edge "now" indicator — where the freshest column is painted.
  nowGlow: { position: 'absolute', top: 0, bottom: 0, right: 0, width: 16, backgroundColor: 'rgba(255,255,255,0.05)' },
  nowEdge: { position: 'absolute', top: 0, bottom: 0, right: 0, width: 1.5, backgroundColor: 'rgba(255,255,255,0.35)' },
  nowLabel: {
    position: 'absolute',
    top: 3,
    right: 5,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: 'rgba(230,230,235,0.7)',
  },

  // Feedback ring glow (animated Views — opacity only, native driver).
  ringGlowOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff5f4e',
  },
  ringGlowCore: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ff5f4e',
  },

  // The field move (feedback scene) — the two-step live-sound response.
  moveEyebrow: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.6,
    color: colors.amber,
    marginTop: 2,
  },
  moveRow: { flexDirection: 'row', gap: 8 },
  moveCard: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#141414',
    padding: 9,
  },
  moveNum: { fontFamily: fonts.mono, fontSize: 14, color: colors.amber, marginTop: 1 },
  moveBody: { flex: 1, gap: 2 },
  moveTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textPrimary },
  moveSub: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub },

  axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  axisText: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub },

  // MIDI amplitude legend.
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendCap: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.textSub },
  legendBar: { flex: 1, height: 8, borderRadius: 2, overflow: 'hidden' },

  // Structured caption: WATCH FOR / body / FIELD NOTE.
  captionBlock: { gap: 5, marginTop: 2 },
  watchFor: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.amber },
  captionBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  fieldNote: {
    fontFamily: fonts.barlowRegular,
    fontStyle: 'italic',
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textMuted,
  },
});
