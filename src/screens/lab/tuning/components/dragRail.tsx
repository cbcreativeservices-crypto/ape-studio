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
    (raw: number) => {
      const c = Math.max(0, Math.min(1200, raw));
      if (!snap) return c;
      for (const l of LANDMARKS) if (Math.abs(l.value.cents - c) < 9) return l.value.cents;
      return c;
    },
    [snap],
  );

  const fromX = useCallback((x: number) => snapped((x / wRef.current) * 1200), [snapped]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: (e) => {
        setDragging(true);
        onChange(fromX(e.nativeEvent.locationX));
      },
      onPanResponderMove: (e) => onChange(fromX(e.nativeEvent.locationX)),
      onPanResponderRelease: (e) => {
        setDragging(false);
        const c = fromX(e.nativeEvent.locationX);
        onChange(c);
        onSettle?.(c);
        AccessibilityInfo.announceForAccessibility?.(`${label} ${c.toFixed(2)} cents`);
      },
    }),
  ).current;

  const step = (d: number) => {
    const c = Math.max(0, Math.min(1200, cents + d));
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
        {showMeTarget != null ? <Btn label="SHOW ME" onPress={showMe} /> : null}
      </Row>
      <Text style={styles.hint}>Drag the marker, or use the step buttons. Nearby landmarks snap gently.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.textMutedDeep, fontFamily: fonts.barlowRegular, fontSize: 11 },
});
