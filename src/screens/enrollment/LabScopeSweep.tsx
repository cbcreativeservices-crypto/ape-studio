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
 * Each envelope is chosen for how that letter is actually SPOKEN, which is
 * what makes them distinguishable at a glance:
 *   S  a long even hiss — a fricative, no attack to speak of
 *   T  a hard transient that collapses almost at once — a plosive
 *   D  a burst, then a short voiced tail
 *   A/U/I/O/Y  vowels: a swell, differing in how fast they open and close
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

/** 0..1 amplitude envelope for a spoken letter, over t in 0..1. */
const ENVELOPE: Record<string, (t: number) => number> = {
  // Fricative: comes up fast, holds, trails off. No transient.
  S: (t) => Math.min(1, t * 6) * (1 - 0.35 * t) * 0.72,
  // Plosive: everything in the first instant.
  T: (t) => Math.exp(-11 * t) * 0.98 + Math.exp(-40 * Math.abs(t - 0.02)) * 0.3,
  // Burst then a short voiced tail.
  D: (t) => Math.exp(-14 * t) * 0.85 + Math.sin(Math.PI * Math.min(1, t * 1.25)) * 0.45,
  // Vowels — the difference is how quickly each opens and closes.
  U: (t) => Math.pow(Math.sin(Math.PI * t), 0.75) * 0.85,
  Y: (t) => Math.pow(Math.sin(Math.PI * t), 1.35) * 0.9,
  A: (t) => Math.pow(Math.sin(Math.PI * t), 0.45) * 1,
  I: (t) => Math.pow(Math.sin(Math.PI * t), 0.6) * 0.86 * (1 - 0.25 * t),
  O: (t) => Math.pow(Math.sin(Math.PI * t), 0.85) * 0.95,
};

const BARS = 46;
const MID = TRACE_H / 2;

/** One letter as dense vertical bars, mirrored about the centre line. */
function waveformPath(letter: string): string {
  const env = ENVELOPE[letter];
  if (!env) return '';
  const seed = letter.charCodeAt(0);
  let d = '';
  for (let i = 0; i < BARS; i++) {
    const t = i / (BARS - 1);
    const x = ((i + 0.5) / BARS) * TRACE_W;
    // Envelope sets the ceiling; the jitter fills underneath it, so the
    // outline stays the letter's shape while the body looks like audio.
    const a = env(t) * (0.42 + 0.58 * jitter(seed, i)) * (MID - 1);
    if (a < 0.35) continue;
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
            <Path d={WAVEFORMS[letter] ?? ''} strokeWidth={1.1} />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  // Sits over the card's own border, clipped to it, and never takes touches.
  host: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', borderRadius: 11 },
  trace: { position: 'absolute', width: TRACE_W, height: TRACE_H },
  onTop: { top: -11 },
  onBottom: { bottom: -11 },
});
