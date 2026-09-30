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
import { memo, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../../features/settings/store';
import Svg, { Circle, Defs, Ellipse, Line, LinearGradient as SvgLinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
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

/** When the last tile (ANY tile) was activated. Each tile holds its own busy
 *  flag and 90 ms beat, so two different tiles tapped inside one beat both
 *  fired — two labs pushed on top of each other in the Ear Lab (toddler pass
 *  2026-09-30; the hub fixed the same thing with its one-open latch). Shared,
 *  so one activation per navigation across every GlassTile. */
let lastActivateAt = -Infinity;
const ACTIVATE_LATCH_MS = 450; // the beat + the push getting under way; short enough that a popup's own tiles stay tappable

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
  // The 90 ms beat's timer. Cleared on unmount so a tile that goes away
  // mid-press (the calc popup closed by its ✕/backdrop inside the beat, or a
  // second tile's popup-closing tap) never fires its navigation afterwards.
  const beat = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (beat.current) clearTimeout(beat.current);
  }, []);

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
    const now = Date.now();
    if (now - lastActivateAt < ACTIVATE_LATCH_MS) return;
    lastActivateAt = now;
    busy.current = true;
    if (hapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    // Hold the sunk + lit state a beat so the power-on reads (hub: 90 ms).
    beat.current = setTimeout(() => {
      beat.current = null;
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
        <PanelTexture />
        {children}
      </View>
    </View>
  );
}

/* ── PANEL TEXTURE (owner 2026-09-30: "like in audio tools - add texture to
 * the backgrounds … of the tile buttons (all 3 screens)"). The Audio Tools
 * hub's aged rack blank (ToolsHubScreen PanelFace): the same coat, the
 * softbox sheen, uneven anodising (dark / chalky-light / faintly warm
 * blotches), bead-blast grit, near-horizontal scuffs, hairline scratches and
 * the lit top lip / shadowed bottom edge. Generated ONCE per panel size from a
 * fixed seed, so the wear never shifts between launches. Tiles sit on top, so
 * only the margins and gutters show it — exactly as on the hub. Decorative. */
type PBlotch = { cx: number; cy: number; rx: number; ry: number; rot: number; kind: 'dark' | 'light' | 'warm' };
type PMark = { x1: number; y1: number; x2: number; y2: number; a: number; light: boolean };
type PSpeck = { cx: number; cy: number; r: number; a: number; light: boolean };

function seeded(seed: number) {
  let v = seed >>> 0;
  return () => {
    v ^= v << 13;
    v ^= v >>> 17;
    v ^= v << 5;
    return ((v >>> 0) % 1_000_000) / 1_000_000;
  };
}

function buildTexture(w: number, h: number) {
  const rnd = seeded(0x9e3779b9);
  const seg = (x: number, y: number, len: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return { x1: x, y1: y, x2: x + Math.cos(a) * len, y2: y + Math.sin(a) * len };
  };
  // Density scales with area so a small panel isn't crowded and a tall one
  // isn't bare (the hub's counts are for a ~360×620 blank).
  const k = Math.max(0.35, Math.min(2.5, (w * h) / (360 * 620)));
  const blotches: PBlotch[] = [];
  for (let i = 0; i < Math.round(26 * k); i++) {
    const kind: PBlotch['kind'] = i % 5 === 0 ? 'warm' : i % 2 ? 'dark' : 'light';
    const upper = kind === 'light' ? rnd() < 0.7 : rnd() < 0.3;
    const cy = upper ? rnd() * h * 0.5 : h * 0.5 + rnd() * h * 0.5;
    const rx = Math.min(w * 0.34, 30 + rnd() * 90);
    blotches.push({ cx: rnd() * w, cy, rx, ry: rx * (0.45 + rnd() * 0.5), rot: rnd() * 180, kind });
  }
  const scuffs: PMark[] = [];
  for (let i = 0; i < Math.round(34 * k); i++) {
    const light = rnd() < 0.25;
    scuffs.push({
      ...seg(rnd() * w, (0.2 + 0.8 * rnd()) * h, 5 + rnd() * 16, (rnd() - 0.5) * 30),
      a: light ? 0.09 + rnd() * 0.03 : 0.13 + rnd() * 0.07,
      light,
    });
  }
  const scratches: PMark[] = [
    { ...seg(w * (0.12 + rnd() * 0.2), h - 4 - rnd() * 5, w * (0.25 + rnd() * 0.25), (rnd() - 0.5) * 2.5), a: 0.14, light: true },
    { ...seg(w * (0.45 + rnd() * 0.25), 3 + rnd() * 5, w * (0.12 + rnd() * 0.18), (rnd() - 0.5) * 2), a: 0.14, light: true },
    { ...seg(w - 6 + (rnd() - 0.5) * 4, h * (0.55 + rnd() * 0.25), 24 + rnd() * 36, 90 + (rnd() - 0.5) * 10), a: 0.14, light: true },
  ];
  const specks: PSpeck[] = [];
  for (let i = 0; i < Math.round(290 * k); i++) {
    specks.push({ cx: rnd() * w, cy: rnd() * h, r: 0.5 + rnd() * 0.5, a: 0.09 + rnd() * 0.06, light: rnd() > 0.5 });
  }
  return { blotches, scuffs, scratches, specks };
}

const PanelTexture = memo(function PanelTexture() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  // Unique gradient ids per panel: several panels share a screen, and on the
  // web SVG ids are document-global.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const tex = useMemo(() => (size.w > 0 && size.h > 0 ? buildTexture(size.w, size.h) : null), [size.w, size.h]);
  const fill = { dark: `url(#pd${uid})`, light: `url(#pl${uid})`, warm: `url(#pw${uid})` } as const;
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize((p) => (p.w === Math.round(width) && p.h === Math.round(height) ? p : { w: Math.round(width), h: Math.round(height) }));
      }}
    >
      {tex ? (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <SvgLinearGradient id={`pf${uid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#3a3a3e" />
              <Stop offset="0.42" stopColor="#46464b" />
              <Stop offset="1" stopColor="#2c2c30" />
            </SvgLinearGradient>
            <RadialGradient id={`ps${uid}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#fff" stopOpacity={0.08} />
              <Stop offset="1" stopColor="#fff" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id={`pd${uid}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#000" stopOpacity={0.2} />
              <Stop offset="0.55" stopColor="#000" stopOpacity={0.08} />
              <Stop offset="1" stopColor="#000" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id={`pl${uid}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#fff" stopOpacity={0.16} />
              <Stop offset="0.55" stopColor="#fff" stopOpacity={0.07} />
              <Stop offset="1" stopColor="#fff" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id={`pw${uid}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#9a7d52" stopOpacity={0.18} />
              <Stop offset="1" stopColor="#9a7d52" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={size.w} height={size.h} fill={`url(#pf${uid})`} />
          <Ellipse cx={size.w / 2} cy={Math.min(size.h * 0.18, 140)} rx={size.w * 0.6} ry={Math.min(size.h * 0.45, 320)} fill={`url(#ps${uid})`} />
          {tex.blotches.map((b, i) => (
            <Ellipse
              key={`b${i}`}
              cx={b.cx}
              cy={b.cy}
              rx={b.rx}
              ry={b.ry}
              transform={`rotate(${b.rot.toFixed(1)} ${b.cx.toFixed(1)} ${b.cy.toFixed(1)})`}
              fill={fill[b.kind]}
            />
          ))}
          {tex.specks.map((g, i) => (
            <Circle key={`s${i}`} cx={g.cx} cy={g.cy} r={g.r} fill={g.light ? `rgba(255,255,255,${g.a.toFixed(3)})` : `rgba(0,0,0,${g.a.toFixed(3)})`} />
          ))}
          {tex.scuffs.map((m, i) => (
            <Line
              key={`m${i}`}
              x1={m.x1}
              y1={m.y1}
              x2={m.x2}
              y2={m.y2}
              stroke={m.light ? `rgba(255,255,255,${m.a.toFixed(3)})` : `rgba(0,0,0,${m.a.toFixed(3)})`}
              strokeWidth={1}
              strokeLinecap="round"
            />
          ))}
          {tex.scratches.map((m, i) => (
            <Line key={`sc${i}`} x1={m.x1} y1={m.y1 - 1} x2={m.x2} y2={m.y2 - 1} stroke="rgba(0,0,0,0.16)" strokeWidth={1} strokeLinecap="round" />
          ))}
          {tex.scratches.map((m, i) => (
            <Line key={`sl${i}`} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke={`rgba(255,255,255,${m.a})`} strokeWidth={1} strokeLinecap="round" />
          ))}
          <Line x1={0} y1={0.5} x2={size.w} y2={0.5} stroke={HUB_LIGHT.lip} strokeWidth={1} />
          <Line x1={0} y1={size.h - 0.5} x2={size.w} y2={size.h - 0.5} stroke={HUB_LIGHT.lipShadow} strokeWidth={1} />
        </Svg>
      ) : null}
    </View>
  );
});

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
