/**
 * DragRail — a CentsRail with one learner-draggable marker (spec ch.1–2):
 * tap or drag along the track, gentle snapping near landmarks, fine-step
 * buttons for accessibility, an optional Show Me that animates the marker
 * to a target while the readouts update. Final value is announced on
 * release, never per drag frame.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { LANDMARKS } from '../../../../features/tuning/tuningMath';
import { Btn, CentsRail, Row, type RailMarker } from './primitives';

/** Drag snap window (¢). */
const DRAG_SNAP = 9;
/** Step-button snap window (¢): a ±1 step that lands within a cent of a
 *  landmark settles ON it, so the button path can reach 701.955 exactly —
 *  but a step AWAY (1.0 ¢ off) is not pulled back. */
const STEP_SNAP = 1;

export function DragRail({
  cents, onChange, fixedMarkers = [], label, snap = true, hideLabel, showMeTarget, reduceMotion, onSettle,
}: {
  cents: number;
  onChange: (c: number) => void;
  fixedMarkers?: RailMarker[];
  label: string;
  snap?: boolean;
  /** Mini-challenge mode: the moving marker is unlabeled. */
  hideLabel?: boolean;
  /** Show Me animates the marker to this cents value. */
  showMeTarget?: number;
  reduceMotion?: boolean;
  onSettle?: (c: number) => void;
}) {
  const wRef = useRef(1);
  const anim = useRef(new Animated.Value(cents)).current;
  const [dragging, setDragging] = useState(false);

  const snapped = useCallback(
    (raw: number, window: number) => {
      const c = Math.max(0, Math.min(1200, raw));
      if (!snap) return c;
      for (const l of LANDMARKS) if (Math.abs(l.value.cents - c) < window) return l.value.cents;
      return c;
    },
    [snap],
  );

  // The PanResponder is created once; it must call the LATEST callbacks.
  // Chapters pass inline closures that read their own state (ch.2's "solved"
  // flag, the shell's markDone), so a responder bound to first-render props
  // would keep firing stale versions of them.
  const latest = useRef({ onChange, onSettle, label, snapped });
  latest.current = { onChange, onSettle, label, snapped };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: (e) => {
        setDragging(true);
        latest.current.onChange(latest.current.snapped((e.nativeEvent.locationX / wRef.current) * 1200, DRAG_SNAP));
      },
      onPanResponderMove: (e) => latest.current.onChange(latest.current.snapped((e.nativeEvent.locationX / wRef.current) * 1200, DRAG_SNAP)),
      onPanResponderRelease: (e) => {
        setDragging(false);
        const c = latest.current.snapped((e.nativeEvent.locationX / wRef.current) * 1200, DRAG_SNAP);
        latest.current.onChange(c);
        latest.current.onSettle?.(c);
        AccessibilityInfo.announceForAccessibility?.(`${latest.current.label} ${c.toFixed(2)} cents`);
      },
      onPanResponderTerminate: () => setDragging(false),
    }),
  ).current;

  const step = (d: number) => {
    const c = snapped(cents + d, STEP_SNAP);
    onChange(c);
    onSettle?.(c);
  };

  const showMe = () => {
    if (showMeTarget == null) return;
    if (reduceMotion) {
      onChange(showMeTarget);
      onSettle?.(showMeTarget);
      return;
    }
    anim.setValue(cents);
    const id = anim.addListener(({ value }) => onChange(value));
    Animated.timing(anim, { toValue: showMeTarget, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start(() => {
      anim.removeListener(id);
      onChange(showMeTarget);
      onSettle?.(showMeTarget);
    });
  };

  useEffect(() => () => anim.removeAllListeners(), [anim]);

  const markers: RailMarker[] = [
    ...fixedMarkers,
    { id: 'drag', cents, label: hideLabel ? '▲' : `${label} ${cents.toFixed(0)}¢`, role: 'active', emphasis: true, row: 1 },
  ];

  return (
    <View style={{ gap: 6 }}>
      <View
        {...pan.panHandlers}
        onLayout={(e: LayoutChangeEvent) => { wRef.current = Math.max(1, e.nativeEvent.layout.width); }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: `${cents.toFixed(2)} cents` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 10 : -10)}
      >
        <CentsRail markers={markers} reduceMotion={reduceMotion || dragging} height={110} />
      </View>
      <Row>
        <Btn label="−10 ¢" onPress={() => step(-10)} a11y="Lower by ten cents" />
        <Btn label="−1 ¢" onPress={() => step(-1)} a11y="Lower by one cent" />
        <Btn label="+1 ¢" onPress={() => step(1)} a11y="Raise by one cent" />
        <Btn label="+10 ¢" onPress={() => step(10)} a11y="Raise by ten cents" />
        {showMeTarget != null ? <Btn label="SHOW ME" onPress={showMe} a11y="Show me: move the marker to the answer" /> : null}
      </Row>
      <Text style={styles.hint}>Drag the marker, or use the step buttons. Nearby landmarks snap gently.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
});
