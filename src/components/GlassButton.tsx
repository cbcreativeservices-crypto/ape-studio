/**
 * GlassButton — digital-mixer scribble-strip glass cap (Booth 2026-07-08):
 * dark metal rim → smoked-glass body → BACKLIT label (LED glow under the
 * glass) → curved specular gloss on top. Pressing the key:
 *  - travels ~2px down (≈1/16" at phone scale — subtle, physical)
 *  - dims the backlight and the gloss (LED dip under key travel)
 * Tints: gold (amber backlight, default) · steel (blue-gray backlight).
 */
import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../theme/tokens';

export type GlassTint = 'gold' | 'steel' | 'green' | 'orange' | 'blue' | 'teal' | 'purple';

const TINTS: Record<
  GlassTint,
  { color: string; glow: string; pressedColor: string; pressedGlow: string }
> = {
  gold: {
    // Richer app-gold, less pale-yellow (Booth 2026-07-11).
    color: '#ffcb52',
    glow: 'rgba(255,176,0,0.75)',
    pressedColor: '#b08a4a',
    pressedGlow: 'rgba(255,180,0,0.25)',
  },
  steel: {
    color: '#c9d6e4',
    glow: 'rgba(120,160,200,0.6)',
    pressedColor: '#76828f',
    pressedGlow: 'rgba(120,160,200,0.22)',
  },
  green: {
    // Normal app-green backlight (owner 2026-08-05) — was a pale mint (#b9f5c4).
    color: '#37e05f',
    glow: 'rgba(55,224,95,0.7)',
    pressedColor: '#3f8a52',
    pressedGlow: 'rgba(55,224,95,0.25)',
  },
  orange: {
    color: '#ffd0a0',
    glow: 'rgba(255,138,30,0.65)',
    pressedColor: '#a06a3a',
    pressedGlow: 'rgba(255,138,30,0.25)',
  },
  // Glossary blue (Booth 2026-07-09u) — for the Dashboard GLOSSARY key and
  // the course-card glossary action.
  blue: {
    color: '#a8d4ff',
    glow: 'rgba(91,176,255,0.65)',
    pressedColor: '#5f7f9e',
    pressedGlow: 'rgba(91,176,255,0.25)',
  },
  // Measurement-tools accents (Booth 2026-07-09v): waveform teal · spectrogram purple.
  teal: {
    color: '#9ff0e0',
    glow: 'rgba(45,212,191,0.6)',
    pressedColor: '#5e9a8e',
    pressedGlow: 'rgba(45,212,191,0.22)',
  },
  purple: {
    color: '#dcc9ff',
    glow: 'rgba(167,110,255,0.6)',
    pressedColor: '#8a72b0',
    pressedGlow: 'rgba(167,110,255,0.22)',
  },
};

export function GlassButton({
  label,
  onPress,
  disabled = false,
  height = 56,
  tint = 'gold',
  fontSize = 16,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  height?: number;
  tint?: GlassTint;
  fontSize?: number;
}) {
  const [pressed, setPressed] = useState(false);
  const travel = useRef(new Animated.Value(0)).current;
  const t = TINTS[tint];

  const pressIn = () => {
    setPressed(true);
    Animated.timing(travel, { toValue: 2, duration: 60, useNativeDriver: true }).start();
  };
  const pressOut = () => {
    setPressed(false);
    Animated.timing(travel, { toValue: 0, duration: 90, useNativeDriver: true }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={pressIn}
      onPressOut={pressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={disabled && { opacity: 0.45 }}
    >
      {/* Key travel: the whole cap depresses; the seat's shadow shortens. */}
      <Animated.View
        style={[
          styles.rim,
          { height, transform: [{ translateY: travel }] },
          pressed && styles.rimPressed,
        ]}
      >
        <LinearGradient
          colors={pressed ? ['#232327', '#131316', '#0a0a0c'] : ['#3d3d44', '#1c1c21', '#0e0e11']}
          locations={[0, 0.55, 1]}
          style={styles.glass}
        >
          {/* bright top hairline — the glass edge catching light */}
          <View style={styles.topEdge} />
          {/* BACKLIT label — LED shining up from beneath the glass */}
          <Text
            style={[
              styles.label,
              {
                fontSize,
                color: pressed ? t.pressedColor : t.color,
                textShadowColor: pressed ? t.pressedGlow : t.glow,
                textShadowRadius: pressed ? 4 : 9,
              },
            ]}
          >
            {label}
          </Text>
          {/* curved specular gloss OVER the lit text — the clear-coat layer */}
          <LinearGradient
            pointerEvents="none"
            colors={
              pressed
                ? ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0)']
                : ['rgba(255,255,255,0.26)', 'rgba(255,255,255,0.07)', 'rgba(255,255,255,0)']
            }
            locations={[0, 0.65, 1]}
            style={styles.gloss}
          />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rim: {
    // 25% harder corners app-wide (Booth 2026-07-09u).
    borderRadius: 7.5,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#4a4a50', // metal rim peeking around the glass
    padding: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  rimPressed: {
    // Depressed key sits lower in its seat — shorter drop shadow.
    shadowRadius: 1.5,
    shadowOffset: { width: 0, height: 0.5 },
  },
  glass: {
    flex: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: 6,
    right: 6,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 1,
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  label: {
    fontFamily: fonts.oswaldSemiBold,
    letterSpacing: 1.2,
    textShadowOffset: { width: 0, height: 0 },
  },
});
