/**
 * LabScopeSweep — an occasional oscilloscope trace that runs along the frame
 * of the Audio Fundamentals LAB row (owner 2026-09-19).
 *
 * The lab is the one row on the Enrollments list that is not a study topic:
 * it is advanced by working through the labs. A trace crossing its border
 * every so often says "this one is instrumentation" without another badge or
 * another line of copy competing with the rows around it.
 *
 * ── IT SPELLS ───────────────────────────────────────────────────────────────
 * Each pass carries ONE letter, and successive passes on the same edge step
 * through that edge's word, so the row spells over time rather than shouting:
 *
 *     TOP,    left → right :  S · T · U · D · Y
 *     BOTTOM, right → left :  A · U · D · I · O
 *
 * Each edge keeps its own position in its own word, so they stay legible even
 * though the edge for each pass is chosen at random.
 *
 * ── WHY THE BOTTOM ONES ARE MIRRORED ────────────────────────────────────────
 * Because these are WAVEFORMS, not letterforms. The owner's reference ("The
 * Waveform Alphabet") is each spoken letter as a time-domain envelope, and a
 * waveform has a direction: time runs along the sweep. Carried right-to-left
 * unmirrored it would run backwards — the audio equivalent of reversed text.
 * Mirroring the geometry keeps time flowing the way the trace travels, which
 * is exactly what the owner asked for.
 *
 * ── THE WAVEFORMS ───────────────────────────────────────────────────────────
 * Synthesised here rather than traced off the reference: an envelope per
 * letter plus seeded jitter, mirrored about the centre line, drawn as dense
 * vertical bars — the shape a recorded letter makes in an editor.
 *
 * Shaped against the owner's labelled A–Z sheet, which corrected two things
 * the first attempt got wrong: the real letters are COMPACT and CENTRED, with
 * the silent baseline running clear on both sides, and most have a fast
 * attack with a decaying tail rather than a symmetric swell.
 *
 * Per letter, read off that sheet:
 *   A  hard onset, long taper to the right — the most asymmetric of the set
 *   S  a narrow spike, then a thin hiss trailing well past it
 *   T  compact, quick attack, short taper
 *   D  a short rounded burst, slightly left-weighted
 *   I  rounded with a longer right taper than D
 *   O  full and round, close to symmetric
 *   U  the largest — a broad even diamond
 *   Y  small and rounded, tapering right
 *
 * ⚠️ SEEDED, therefore stable: the same letter draws the same waveform every
 * time. Nothing outside `WAVEFORMS` knows their shape, so replacing them with
 * real sampled data is an edit to that one table.
 *
 * ⏱ `IDLE_MS` is 3 s WHILE THIS IS BEING REVIEWED. The owner's standing value
 * is 17 s, to be set once the look is approved — at 3 s it is deliberately too
 * frequent to live with, so that it can be judged at all.
 *
 * ⛔ MOTION GATES. It does not run under reduced motion (`animationsAllowed`),
 * and not in Low-Light Production Mode, where nothing may draw attention to
 * itself unbidden. Both leave a plain static frame, which is the correct
 * resting state — the row is legible without any of this.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { animationsAllowed } from '../../features/settings/a11y';
import { useOverlaysSuppressed } from '../../features/dev/popupSuppressStore';

const TRACE_W = 40;
const TRACE_H = 22;
const SWEEP_MS = 2400;
/** ⏱ REVIEW VALUE. 17_000 once the look is signed off. */
const IDLE_MS = 3000;
/** ⛔ ON. A waveform runs in time; see the note above. */
const MIRROR_BOTTOM = true;

const TOP_WORD = ['S', 'T', 'U', 'D', 'Y'] as const;
const BOTTOM_WORD = ['A', 'U', 'D', 'I', 'O'] as const;

/**
 * Deterministic jitter. A real waveform is not smooth, and a smooth envelope
 * reads as a blob rather than as audio — but it must not shimmer between
 * renders either, so the noise is seeded off the letter and the sample index.
 */
function jitter(seed: number, i: number): number {
  const v = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * A letter occupies a WINDOW inside the box rather than the whole of it —
 * `from`/`to` in 0..1 — so the quiet baseline shows either side, which is
 * what makes these read as recordings rather than as bar charts. `env` is the
 * amplitude across that window, and `peak` its height.
 */
type Shape = { from: number; to: number; peak: number; env: (u: number) => number };

/** Attack in `a`, then taper with curve `c`. The shape most of these have. */
const hit = (a: number, c: number) => (u: number) =>
  u < a ? u / a : Math.pow(Math.max(0, 1 - (u - a) / (1 - a)), c);

const SHAPES: Record<string, Shape> = {
  A: { from: 0.17, to: 0.8, peak: 0.96, env: hit(0.1, 0.75) },
  S: {
    from: 0.19, to: 0.86, peak: 0.88,
    // Spike, then the hiss: a low floor that outlasts it.
    env: (u) => Math.max(hit(0.07, 2.2)(u), 0.3 * Math.pow(Math.max(0, 1 - u), 0.45)),
  },
  T: { from: 0.31, to: 0.67, peak: 0.8, env: hit(0.16, 0.7) },
  D: { from: 0.29, to: 0.69, peak: 0.74, env: hit(0.3, 0.85) },
  I: { from: 0.26, to: 0.74, peak: 0.72, env: hit(0.24, 0.6) },
  O: { from: 0.24, to: 0.76, peak: 0.84, env: (u) => Math.pow(Math.sin(Math.PI * u), 0.55) },
  U: { from: 0.19, to: 0.81, peak: 1, env: (u) => Math.pow(Math.sin(Math.PI * u), 0.45) },
  Y: { from: 0.3, to: 0.72, peak: 0.7, env: (u) => Math.pow(Math.sin(Math.PI * u), 0.8) * (1 - 0.3 * u) },
};

/** Thin and many, so the body reads as a solid mass the way a recording does. */
const BARS = 86;
const MID = TRACE_H / 2;

/** One letter as dense vertical bars, mirrored about the centre line. */
function waveformPath(letter: string): string {
  const sh = SHAPES[letter];
  if (!sh) return '';
  const seed = letter.charCodeAt(0);
  let d = '';
  for (let i = 0; i < BARS; i++) {
    const x = ((i + 0.5) / BARS) * TRACE_W;
    const u = (x / TRACE_W - sh.from) / (sh.to - sh.from);
    if (u < 0 || u > 1) continue;
    // The envelope is the ceiling; the jitter fills under it, so the outline
    // keeps the letter's shape while the body looks like audio and not like
    // a smooth blob.
    const a = sh.env(u) * sh.peak * (0.55 + 0.45 * jitter(seed, i)) * (MID - 1);
    if (a < 0.3) continue;
    d += `M${x.toFixed(2)} ${(MID - a).toFixed(2)}L${x.toFixed(2)} ${(MID + a).toFixed(2)}`;
  }
  return d;
}

/** Built once — the shapes never change. */
const WAVEFORMS: Record<string, string> = Object.fromEntries(
  [...TOP_WORD, ...BOTTOM_WORD].map((l) => [l, waveformPath(l)]),
);

/** The quiet baseline either side of the letter. */
const LEAD = `M0 ${MID} L${TRACE_W} ${MID}`;

export function LabScopeSweep({ color }: { color: string }) {
  const [w, setW] = useState(0);
  const [edge, setEdge] = useState<'top' | 'bottom'>('top');
  const [letter, setLetter] = useState<string>(TOP_WORD[0]);
  const x = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  /** Each edge walks its own word, independently of which edge comes up. */
  const at = useRef({ top: 0, bottom: 0 });
  const suppressed = useOverlaysSuppressed();

  useEffect(() => {
    if (w <= 0 || suppressed || !animationsAllowed()) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const runOnce = () => {
      if (!alive) return;
      const top = Math.random() < 0.5;
      const word = top ? TOP_WORD : BOTTOM_WORD;
      const key = top ? 'top' : 'bottom';
      const i = at.current[key] % word.length;
      at.current[key] = i + 1;

      setEdge(key);
      setLetter(word[i]);

      const from = top ? -TRACE_W : w;
      const to = top ? w : -TRACE_W;
      x.setValue(from);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.timing(x, { toValue: to, duration: SWEEP_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (!finished || !alive) return;
        timer = setTimeout(runOnce, IDLE_MS);
      });
    };

    timer = setTimeout(runOnce, IDLE_MS);
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      x.stopAnimation();
      opacity.stopAnimation();
    };
  }, [w, suppressed, x, opacity]);

  const onLayout = (e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width));
  const flip = MIRROR_BOTTOM && edge === 'bottom';

  return (
    <View style={s.host} pointerEvents="none" onLayout={onLayout}>
      <Animated.View
        style={[s.trace, edge === 'top' ? s.onTop : s.onBottom, { opacity, transform: [{ translateX: x }] }]}
      >
        <Svg width={TRACE_W} height={TRACE_H} viewBox={`0 0 ${TRACE_W} ${TRACE_H}`}>
          <G
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            transform={flip ? `translate(${TRACE_W},0) scale(-1,1)` : undefined}
          >
            <Path d={LEAD} strokeWidth={1} strokeOpacity={0.35} />
            <Path d={WAVEFORMS[letter] ?? ''} strokeWidth={0.75} />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  /**
   * ⛔ NOT CLIPPED. The trace has to straddle the frame line — half inside the
   * card, half outside it (owner 2026-09-19) — so `overflow: hidden` would cut
   * away exactly the half that makes it read as sitting ON the border rather
   * than inside the card. It also lets the trace enter and leave from beyond
   * the card, which is how a sweep should arrive.
   *
   * Safe to leave unclipped: it never takes touches, and it is a thin line on
   * a dark panel.
   */
  host: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  trace: { position: 'absolute', width: TRACE_W, height: TRACE_H },
  /* Centre the trace ON the border line: half the height above it, half
     below. TRACE_H/2 either way. */
  onTop: { top: -TRACE_H / 2 },
  onBottom: { bottom: -TRACE_H / 2 },
});
