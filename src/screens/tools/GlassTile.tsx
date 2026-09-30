/**
 * GlassTile — the Audio Tools hub's tile hardware, reusable (owner 2026-09-30:
 * "over the top of each of the calculator tiles now - put a reflective glass
 * layer on top with highlights. match the look of the glass, buttons,
 * recesses, animations, etc of the audio tools menu").
 *
 * The same build as ToolsHubScreen's ToolTile, under the same ONE overhead key
 * (HUB_LIGHT): a true-black RECESS cut into the panel (its rim is the panel's
 * lip), the recess's two walls (crevice at the top, lit cut-edge at the
 * bottom), and ONE raised, bevelled GLASS holding the content. Over the
 * content: the smoked tint, the softbox reflection band across the top, and
 * the bevel's two facet lines. Press: the glass sinks 1 px into its recess and
 * the display powers on (a cool glow ramps up), with the selection haptic tick
 * on the confirmed press — exactly the hub's timings.
 */
import { useRef, type ReactNode } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../../features/settings/store';
import { HUB_LIGHT, TILE_GAP } from './TileChassis';

const TILE_SINK = 1; // px the glass sinks when pressed (the hub's value)
const litRim = (top: string, side: string, bottom: string) => ({
  borderTopColor: top,
  borderLeftColor: side,
  borderRightColor: side,
  borderBottomColor: bottom,
});

/** The smoked glass over a display: tint, the softbox band, the bevel facets.
 *  Decorative; never blocks touches. Same values as the hub's TileGlass. */
export function GlassOverlay() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.glassTint} />
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.18)',
          'rgba(255,255,255,0.155)',
          'rgba(255,255,255,0.09)',
          'rgba(255,255,255,0.025)',
          'rgba(255,255,255,0)',
          'rgba(0,0,0,0.04)',
          'rgba(0,0,0,0.13)',
        ]}
        locations={[0, 0.1, 0.28, 0.42, 0.5, 0.74, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glassFacetTop} />
      <View style={styles.glassFacetBottom} />
    </View>
  );
}

export function GlassTile({
  children,
  onPress,
  accessibilityLabel,
  style,
  glassStyle,
}: {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  /** The recess (outer) — width / height from the caller. */
  style?: StyleProp<ViewStyle>;
  /** The glass (inner display) — background, padding, layout of the content. */
  glassStyle?: StyleProp<ViewStyle>;
}) {
  const sink = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const busy = useRef(false);

  const animateIn = () =>
    Animated.parallel([
      Animated.timing(sink, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 1, duration: 170, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  const animateOut = () =>
    Animated.parallel([
      Animated.timing(sink, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 240, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();

  const onIn = () => {
    if (!busy.current) animateIn();
  };
  const onOut = () => {
    setTimeout(() => {
      if (!busy.current) animateOut();
    }, 60);
  };
  const activate = () => {
    if (busy.current) return;
    busy.current = true;
    if (hapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    // Hold the sunk + lit state a beat so the power-on reads (hub: 90 ms).
    setTimeout(() => {
      onPress();
      sink.setValue(0);
      glow.setValue(0);
      busy.current = false;
    }, 90);
  };

  const translateY = sink.interpolate({ inputRange: [0, 1], outputRange: [0, TILE_SINK] });

  return (
    <Pressable
      onPress={activate}
      onPressIn={onIn}
      onPressOut={onOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.recess, style]}
    >
      <LinearGradient pointerEvents="none" colors={[HUB_LIGHT.crevice, 'rgba(0,0,0,0)']} style={styles.cavityTop} />
      <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0)', HUB_LIGHT.wall]} style={styles.cavityBottom} />
      <Animated.View style={[styles.glass, glassStyle, { transform: [{ translateY }] }]}>
        {children}
        <GlassOverlay />
        <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glow }]} />
      </Animated.View>
    </Pressable>
  );
}

/** The gray rack panel the recesses are cut into — the hub's panel coat
 *  (#3a3a3e → #46464b → #2c2c30, the dashboard study-method gray), the
 *  softbox's wide soft lift high on the face, square corners, black edge,
 *  and the panel's drop shadow. */
export function GlassPanel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={styles.panelShadow}>
      <View style={[styles.panel, style]}>
        <LinearGradient
          pointerEvents="none"
          colors={['#3a3a3e', '#46464b', '#2c2c30']}
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.07)', 'rgba(255,255,255,0)']}
          locations={[0, 0.3, 0.62]}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderRadius: 0, borderWidth: 1, borderColor: '#000', padding: 12, overflow: 'hidden' },
  panelShadow: {
    borderRadius: 0,
    backgroundColor: '#0a0a0c',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 8 },
      default: {},
    }),
  },
  // The black recess cut into the panel; its rim is the panel's lip.
  recess: {
    borderRadius: 10,
    borderWidth: 1,
    ...litRim('rgba(0,0,0,0.55)', 'rgba(255,255,255,0.08)', HUB_LIGHT.lip),
    backgroundColor: '#000',
    padding: TILE_GAP - 1,
    overflow: 'hidden',
  },
  cavityTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 8 },
  cavityBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: TILE_GAP - 1 },
  // The raised, bevelled glass.
  glass: {
    // flexGrow, not flex: 1 — flex: 1's zero basis ignored the content's own
    // height in an auto-height recess and clipped long text.
    flexGrow: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    ...litRim(HUB_LIGHT.specular, HUB_LIGHT.lip, HUB_LIGHT.bounce),
    backgroundColor: '#0b0c0e',
    overflow: 'hidden',
  },
  glassTint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.05)' },
  glassFacetTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: HUB_LIGHT.glassEdge },
  glassFacetBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.30)' },
  // Power-on illumination on press (the hub's peak).
  glow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(165,200,255,0.146)' },
});
