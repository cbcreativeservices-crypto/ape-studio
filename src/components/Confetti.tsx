/**
 * Confetti — 3s celebratory burst (S5/S8 spec). Small rotated squares in the
 * five accent hues falling with drift, native-driver Animated only (no deps).
 */
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const COLORS = ['#ffc233', '#37e05f', '#ff4b3a', '#2f9bff', '#b45bff'];
const PIECES = 26;
const DURATION_MS = 3000;

type Piece = {
  x: number;
  size: number;
  color: string;
  delay: number;
  drift: number;
  spin: string;
  progress: Animated.Value;
};

export function Confetti() {
  const { width, height } = Dimensions.get('window');

  const pieces = useRef<Piece[]>(
    Array.from({ length: PIECES }, (_, i) => ({
      x: ((i * 137) % 100) / 100 * width, // deterministic spread
      size: 6 + ((i * 53) % 5),
      color: COLORS[i % COLORS.length],
      delay: (i * 83) % 700,
      drift: (((i * 71) % 60) - 30),
      spin: `${180 + ((i * 97) % 540)}deg`,
      progress: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    const anims = pieces.map((p) =>
      Animated.timing(p.progress, {
        toValue: 1,
        duration: DURATION_MS - p.delay,
        delay: p.delay,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    );
    Animated.parallel(anims).start();
    return () => anims.forEach((a) => a.stop());
  }, [pieces]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: -20,
            width: p.size,
            height: p.size,
            borderRadius: 2,
            backgroundColor: p.color,
            shadowColor: p.color,
            shadowOpacity: 0.8,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 0 },
            transform: [
              { translateY: p.progress.interpolate({ inputRange: [0, 1], outputRange: [0, height + 40] }) },
              { translateX: p.progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
              { rotate: p.progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', p.spin] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
