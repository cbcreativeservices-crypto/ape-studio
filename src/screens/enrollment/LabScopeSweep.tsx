/**
 * LabScopeSweep — an occasional oscilloscope trace that runs along the frame
 * of the Audio Fundamentals LAB row (owner 2026-09-19).
 *
 * The lab is the one row on the Enrollments list that is not a study topic:
 * it is advanced by working through the labs. A trace crossing its border
 * every so often says "this one is alive and it is instrumentation" without
 * another badge or another line of copy competing with the rows around it.
 *
 * ── HOW IT BEHAVES ──────────────────────────────────────────────────────────
 * One pass at a time, ~2.4 s: either LEFT→RIGHT along the top edge or
 * RIGHT→LEFT along the bottom, chosen at random, then a pause before the next.
 * Never both edges at once — two traces would read as decoration rather than
 * as a single sweep.
 *
 * ⏱ `IDLE_MS` is 3 s WHILE THIS IS BEING REVIEWED. The owner's standing value
 * is 17 s, to be set once the look is approved — at 3 s it is deliberately
 * too frequent to live with, so that it can be judged at all.
 *
 * ⛔ MOTION GATES. It does not run when the user has asked for reduced motion
 * (`animationsAllowed`), and not in Low-Light Production Mode, where nothing
 * may draw attention to itself unbidden. Both make it render as a static
 * frame with no trace, which is the correct resting state — the row is
 * legible without it.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { animationsAllowed } from '../../features/settings/a11y';
import { useOverlaysSuppressed } from '../../features/dev/popupSuppressStore';

/** Length of the visible trace, and how long one crossing takes. */
const TRACE_W = 86;
const SWEEP_MS = 2400;
/** ⏱ REVIEW VALUE. 17_000 once the look is signed off. */
const IDLE_MS = 3000;

/** Two cycles of a sine, drawn once and translated — cheaper than redrawing. */
const WAVE = (() => {
  const h = 9;
  const mid = h / 2;
  let d = `M0 ${mid}`;
  for (let x = 0; x <= TRACE_W; x += 2) {
    const y = mid - Math.sin((x / TRACE_W) * Math.PI * 4) * (mid - 0.8) * Math.sin((x / TRACE_W) * Math.PI);
    d += ` L${x} ${y.toFixed(2)}`;
  }
  return d;
})();

export function LabScopeSweep({ color }: { color: string }) {
  const [w, setW] = useState(0);
  const [edge, setEdge] = useState<'top' | 'bottom'>('top');
  const x = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const suppressed = useOverlaysSuppressed();

  useEffect(() => {
    if (w <= 0 || suppressed || !animationsAllowed()) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const runOnce = () => {
      if (!alive) return;
      // Top edge travels left→right, bottom edge right→left, so successive
      // sweeps read as one trace going round rather than two unrelated ones.
      const top = Math.random() < 0.5;
      setEdge(top ? 'top' : 'bottom');
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

  return (
    <View style={s.host} pointerEvents="none" onLayout={onLayout}>
      <Animated.View
        style={[
          s.trace,
          edge === 'top' ? s.onTop : s.onBottom,
          { opacity, transform: [{ translateX: x }] },
        ]}
      >
        <Svg width={TRACE_W} height={9} viewBox={`0 0 ${TRACE_W} 9`}>
          <Path d={WAVE} stroke={color} strokeWidth={1.6} strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  // Sits over the card's own border, clipped to it, and never takes touches.
  host: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', borderRadius: 11 },
  trace: { position: 'absolute', width: TRACE_W, height: 9 },
  onTop: { top: -4 },
  onBottom: { bottom: -4 },
});
