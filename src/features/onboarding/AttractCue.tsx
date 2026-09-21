/**
 * AttractCue — tasteful first-run "start here" cues for the Home screen
 * (owner 2026-09-14). Two drop-in pieces, each a slow ~3.2 s breathe:
 *   • <AttractRing active/> — a breathing amber border+glow ring, absolutely
 *     positioned to overlay a framed button (the Explore chip). Renders nothing
 *     when inactive.
 *   • <AttractText active …/> — a text that breathes its opacity (the About
 *     link, which has no frame). Renders a normal, static text when inactive.
 *
 * Reduce-motion (a11y): both hold a gentle STATIC level instead of animating,
 * so the intent survives without movement. Built on reanimated to match the
 * Home screen's existing animation stack.
 */
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { animationsAllowed } from '../settings/a11y';

const HALF = 1600; // ms per half-cycle → ~3.2 s full breathe (calm, not gimmicky)

/** Drives a 0↔1 value: breathing when (active && motion), else parked at a
 *  fixed level — `staticT` when active-but-reduce-motion, 1 when inactive. */
function useBreathe(active: boolean, motion: boolean, staticT: number) {
  const t = useSharedValue(active ? (motion ? 0 : staticT) : 1);
  useEffect(() => {
    cancelAnimation(t);
    if (active && motion) {
      t.value = 0;
      t.value = withRepeat(withTiming(1, { duration: HALF, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      t.value = active ? staticT : 1;
    }
    return () => cancelAnimation(t);
  }, [active, motion, staticT, t]);
  return t;
}

/** Breathing border+glow ring to overlay a framed button (Explore = amber, the
 *  next-step Enrollments cue = green). */
export function AttractRing({
  active,
  variant = 'amber',
  inset = -1,
  radius = 8,
  width = 1,
}: {
  active: boolean;
  variant?: 'amber' | 'green';
  /** How far OUTSIDE the host's box the ring sits, in px (negative = outside).
   *  The default -1 overlays a button's own 1px frame. Use a larger negative
   *  with a matching `radius` to sit just beyond a thicker frame, so the two
   *  read as one object with a gold outer edge (owner 2026-09-20: "a gold
   *  outer frame touching the green frame"). */
  inset?: number;
  /** Corner radius — match the host button's, plus |inset|, or the corners
   *  will not follow it. */
  radius?: number;
  width?: number;
}) {
  const motion = active && animationsAllowed();
  const t = useBreathe(active, motion, 0.43); // 0.43 → ~0.6 static opacity
  const aStyle = useAnimatedStyle(() => ({ opacity: 0.3 + t.value * 0.7 }));
  if (!active) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        variant === 'green' ? styles.ringGreen : styles.ring,
        { top: inset, left: inset, right: inset, bottom: inset, borderRadius: radius, borderWidth: width },
        aStyle,
      ]}
    />
  );
}

/** Text that breathes its opacity when active (the About link). With `glow`, a
 *  very subtle amber text-shadow is added while active; the opacity breathe makes
 *  that glow breathe with it. */
export function AttractText({
  active,
  style,
  glow,
  children,
}: {
  active: boolean;
  style?: StyleProp<TextStyle>;
  glow?: boolean;
  children: ReactNode;
}) {
  const motion = active && animationsAllowed();
  const t = useBreathe(active, motion, 1);
  const aStyle = useAnimatedStyle(() => ({ opacity: 0.6 + t.value * 0.4 }));
  return (
    <Animated.Text style={[style, active && glow ? styles.textGlow : null, aStyle]}>
      {children}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc64d',
    boxShadow: '0px 0px 8px 1px rgba(255,198,77,0.6)',
  },
  // Green variant for the Enrollments "next step" cue.
  ringGreen: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#37e05f',
    boxShadow: '0px 0px 8px 1px rgba(55,224,95,0.55)',
  },
  // Very subtle amber glow for a bare text button (About) — soft, no offset.
  textGlow: {
    textShadowColor: 'rgba(255,198,77,0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
});
