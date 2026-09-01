/**
 * SwitchButton — a photoreal ILLUMINATED pro-audio pushbutton (a lit "ON" cap),
 * built to the real part's construction (Booth 2026-07-09i → 07-09o):
 *  - the keycap STICKS THROUGH A CUTOUT in the equipment casing: the surround
 *    is a dark cavity (hole) that does NOT move — only its outline and subtle
 *    inner shadows convey it; the cap travels DOWN INTO it when depressed,
 *  - a thick CLEAR COVER: the LED glow diffuses through the glass depth nearly
 *    to the edge; where the glow is weak, the DARK HOLE BEHIND shows through
 *    the glass (a cast shadow from the cutout's top lip + a settled base),
 *  - gloss + specular sweep the whole cap; the INNER BUTTON (lit diffuser +
 *    dark engraved legend) is its own layer under the cover,
 *  - PRESS: the glass cover starts down a hair BEFORE the inner button
 *    (mechanical lag), the LED goes dark; release springs back (button first).
 *  - variant 'locked' renders as a plain flat 2D pill (no 3D, no light).
 * Pixel-space SVG; wide radials keep long buttons evenly lit edge-to-edge.
 * Variants: primary = amber · success = green · outline = blue ·
 * secondary = off/gray · locked = flat purple.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../features/settings/store';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { fonts } from '../theme/tokens';

export type SwitchVariant = 'primary' | 'success' | 'outline' | 'secondary' | 'clear' | 'glass' | 'locked';

type Def = {
  face: [string, string, string]; // radial: hot centre → color → deep edge
  body: [string, string]; // keycap wall: lit top rim → dark bottom wall
  label: string; // engraved legend
  glow: string | null; // LED halo (iOS)
};

// Incandescent palette (Booth 2026-07-09s): each lit face has a WARM-WHITE hot
// centre (the filament glow through the diffuser) falling off into a slightly
// desaturated, warm-shifted body color — colored caps over a warm bulb, not
// cold uniform LEDs. Halos warmed to match.
const VARIANTS: Record<Exclude<SwitchVariant, 'locked' | 'glass'>, Def> = {
  primary: { face: ['#ffeab0', '#ffae24', '#cf7404'], body: ['#e69518', '#5a3300'], label: '#3f2100', glow: 'rgba(255,168,28,.95)' },
  success: { face: ['#e0f6b8', '#5cc93e', '#1d7f1c'], body: ['#33aa30', '#062f0a'], label: '#06300a', glow: 'rgba(120,215,70,.85)' },
  // Start = the flashcard-icon blue (#2f9bff), darkened another step so the cap
  // reads as that flat icon blue instead of a bright glowy light-blue: the hot
  // centre is pulled off near-white and the mid/edge deepened (Booth 2026-07-15).
  outline: { face: ['#8bbdec', '#2585e6', '#0a3f7d'], body: ['#155fb0', '#04182e'], label: '#03182e', glow: 'rgba(47,155,255,.8)' },
  secondary: { face: ['#5e5e64', '#3c3c42', '#202025'], body: ['#48484e', '#0e0e11'], label: '#c8c8c8', glow: null },
  // CLEAR (Booth 2026-07-11): an UNLIT translucent cap — the physical clear
  // pushbutton with no lamp behind it (ref photo). Neutral white diffuser, no
  // colour, no glow; reads as "present but off", not greyed-out. Face dimmed
  // ~7% (less-intense white) per Booth 2026-07-11.
  clear: { face: ['#e3e4e5', '#cfd1d4', '#acafb3'], body: ['#c3c6ca', '#63666b'], label: '#4a4c50', glow: null },
};

const DEPTH = 2; // px the cap travels down when pressed (top stays proud)

/** Clear-glass tints (Booth 2026-07-09t): the glass aesthetic keeps each
 *  action's ORIGINAL state color — amber continue, green review, blue
 *  glossary — instead of painting everything blue. */
export type GlassTint = 'blue' | 'amber' | 'green';
const GLASS_TINTS: Record<GlassTint, { border: string; label: string; glow: string }> = {
  blue: { border: 'rgba(91,176,255,.65)', label: '#5bb0ff', glow: 'rgba(91,176,255,.5)' },
  amber: { border: 'rgba(255,180,0,.65)', label: '#ffc64d', glow: 'rgba(255,180,0,.5)' },
  green: { border: 'rgba(70,214,78,.6)', label: '#5bff85', glow: 'rgba(70,214,78,.5)' },
};

export function SwitchButton({
  label,
  a11yLabel,
  variant = 'primary',
  tint = 'blue',
  width = 92,
  height = 58,
  disabled = false,
  onPress,
}: {
  label: string;
  /** Optional screen-reader name when the visible label is empty (e.g. a
   *  locked blank cap) — QA night 2026-08-31. */
  a11yLabel?: string;
  variant?: SwitchVariant;
  /** Color of the clear-glass aesthetic (variant="glass" only). */
  tint?: GlassTint;
  width?: number;
  height?: number;
  disabled?: boolean;
  onPress?: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  // ONE press value: the glass and the button beneath it are a single molded
  // part — they travel together (Booth 2026-07-09q; the earlier staggered lag
  // made the cap's back edge look like it sank below the recess surface).
  const press = useRef(new Animated.Value(0)).current;
  // The LAMP is separate from the mechanism (Booth 2026-07-09s, incandescent):
  // the filament cools quickly when power cuts but WARMS BACK UP slower than
  // the cap springs up — the light lags the mechanics like a real bulb.
  const lamp = useRef(new Animated.Value(0)).current;
  // Idle filament drift — a slow, barely-perceptible brightness wander (mains
  // hum / filament wobble) that makes the light read analog, not LED-steady.
  const flicker = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.35, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0.8, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flicker]);

  // Tactile "click" on touch-down for EVERY hardware key press — including the
  // inactive keys that don't navigate (Booth 2026-07-11). iOS haptics are
  // discrete presets (no numeric intensity), so a ~7% stronger click = stepping
  // the selection tick up to a RIGID impact: still short and crisp, no sustain,
  // fired immediately on touch-down. Honours the Settings › Haptic toggle.
  const click = () => {
    if (hapticsEnabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
  };

  // Rate-limit the hardware keys: a press (haptic + travel + onPress) fires at
  // most once every 400ms — mashing it quickly is ignored until the window
  // elapses (Booth 2026-07-11). blockedRef flags a press that was throttled so
  // its release skips the spring-back + onPress too.
  const lastFireRef = useRef(0);
  const blockedRef = useRef(false);
  const THROTTLE_MS = 400;

  const animate = (dir: 'in' | 'out') => {
    // Mechanics: snappy. Lamp: cools in ~150ms, warms back up in ~320ms.
    Animated.timing(press, { toValue: dir === 'in' ? 1 : 0, duration: 90, useNativeDriver: true }).start();
    Animated.timing(lamp, {
      toValue: dir === 'in' ? 1 : 0,
      duration: dir === 'in' ? 150 : 320,
      easing: dir === 'in' ? Easing.out(Easing.quad) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  // The cap travels down INTO the cutout but its top NEVER drops below the
  // casing surface — travel is capped shallow (Booth 2026-07-09q).
  const capTranslate = press.interpolate({ inputRange: [0, 1], outputRange: [0, DEPTH] });
  // Press dim is now only 13% of the full bulb-off level (0.7 -> 0.091): the cap
  // barely darkens when pressed (Booth 2026-07-11).
  const offOpacity = lamp.interpolate({ inputRange: [0, 1], outputRange: [0, 0.091] }); // bulb dark
  const flickerOpacity = flicker.interpolate({ inputRange: [0, 1], outputRange: [0, 0.045] });

  // Locked = a plain flat 2D pill (Booth 2026-07-09o) — no 3D, no LED.
  if (variant === 'locked') {
    return (
      <LinearGradient
        colors={['#3a2a5e', '#241640']}
        style={[styles.flatLocked, { width, height }]}
      >
        <Text style={styles.flatLockedText}>{label.toUpperCase()}</Text>
      </LinearGradient>
    );
  }

  // Glass = CLEAR fill — blue outline + glowing blue label only (the original
  // chip look, Booth 2026-07-09r) — but WITH the hardware press travel.
  if (variant === 'glass') {
    const dim = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.75] });
    const t = GLASS_TINTS[tint];
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => animate('in')}
        onPressOut={() => animate('out')}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={6}
        style={{ width, height }}
      >
        <Animated.View
          style={[
            styles.glassClear,
            { borderColor: t.border, transform: [{ translateY: capTranslate }], opacity: dim },
          ]}
        >
          {/* Reflective glass top (Booth 2026-07-09r): still see-through, but
              a specular sheen + streak lie on the surface like curved glass. */}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0)']}
            locations={[0, 0.5, 1]}
            style={styles.glassClearSheen}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.6 }}
            locations={[0.15, 0.38, 0.62]}
            style={styles.glassClearStreak}
          />
          <Text style={[styles.glassClearText, { color: t.label, textShadowColor: t.glow }]}>
            {label.toUpperCase()}
          </Text>
        </Animated.View>
      </Pressable>
    );
  }

  // Disabled greys the cap (secondary) — EXCEPT a 'clear' key, which stays an
  // unlit clear cap even when inert (Booth 2026-07-11).
  const v = VARIANTS[disabled && variant !== 'clear' ? 'secondary' : variant];
  // Clear caps have their surface reflections dialled back 7% (Booth 2026-07-11).
  const reflect = variant === 'clear' ? 0.93 : 1;

  const minSide = Math.min(width, height);
  // 25% harder corners app-wide (Booth 2026-07-09u).
  const cutoutRadius = Math.round(minSide * 0.12);
  const capBorderRadius = Math.round(minSide * 0.09);
  const fontSize = Math.round(height * 0.2) + 1;

  const drop =
    Platform.OS !== 'android' && !pressed
      ? { shadowColor: '#000', shadowOpacity: 0.8, shadowRadius: 3.5, shadowOffset: { width: 0, height: 4 } }
      : null;
  const glow =
    v.glow && Platform.OS !== 'android' && !pressed
      ? { shadowColor: v.glow, shadowOpacity: 0.55, shadowRadius: 6, shadowOffset: { width: 0, height: -1 } }
      : null;

  // Pixel-space SVG geometry (rectangular-safe). Thin glass ring; the inner
  // lit face fills most of the cap (grown 7% outward, Booth 2026-07-09l).
  const { w, h } = dims;
  const edge = 1.5;
  const r = Math.max(2, Math.round(minSide * 0.11));
  const glassW = Math.max(3, Math.round(minSide * 0.06));
  const rf = Math.max(2, Math.round(r - glassW * 0.5));
  const gx = edge;
  const gw = w - edge * 2;
  const gh = h - edge * 2;
  const fx0 = edge + glassW;
  const fy0 = edge + glassW * 0.8;
  const fb0 = edge + glassW * 1.3;
  const growX = (w - fx0 * 2) * 0.035;
  const growY = (h - fy0 - fb0) * 0.035;
  const fx = Math.max(edge + 1, fx0 - growX);
  const fy = Math.max(edge + 1, fy0 - growY);
  const fw = w - fx * 2;
  const fh = h - fy - Math.max(edge + 1, fb0 - growY);

  return (
    <Pressable
      // NOTE: the Pressable is NEVER disabled — inactive keys must still travel
      // and click on touch (Booth 2026-07-11 #4). `disabled` only greys the cap
      // (secondary palette) and suppresses navigation on release.
      onPress={() => {
        if (blockedRef.current || disabled) return;
        onPress?.();
      }}
      onPressIn={() => {
        const now = Date.now();
        if (now - lastFireRef.current < THROTTLE_MS) {
          blockedRef.current = true; // too soon — ignore this press entirely
          return;
        }
        lastFireRef.current = now;
        blockedRef.current = false;
        setPressed(true);
        animate('in');
        click();
      }}
      onPressOut={() => {
        if (blockedRef.current) return; // throttled press: no spring-back
        setPressed(false);
        animate('out');
      }}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? label}
      accessibilityState={{ disabled }}
      hitSlop={6}
      style={{ width, height }}
    >
      {/* CUTOUT in the casing — STATIC (a hole doesn't move): a dark cavity
          conveyed only by its outline + subtle inner shadows. The cap travels
          down INTO it when depressed (Booth 2026-07-09o). */}
      <View style={[styles.cutout, { borderRadius: cutoutRadius }]}>
        {/* shadow the casing edge casts into the cavity's top */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
          style={[styles.cavityTop, { borderTopLeftRadius: cutoutRadius, borderTopRightRadius: cutoutRadius }]}
        />
        {/* The CAP assembly — glass + button as one part; the only mover. */}
        <Animated.View style={[styles.fill, drop, { borderRadius: capBorderRadius, transform: [{ translateY: capTranslate }] }]}>
          <View
            onLayout={(e) =>
              setDims({ w: Math.round(e.nativeEvent.layout.width), h: Math.round(e.nativeEvent.layout.height) })
            }
            style={[styles.capWrap, glow, { borderRadius: capBorderRadius }]}
          >
            {w > 0 && h > 0 && (
              <>
                {/* ---- COVER, lower layers: body + glass glow ring ---- */}
                <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={styles.abs}>
                  <Defs>
                    <RadialGradient id="glassFace" cx="50%" cy="40%" rx="80%" ry="70%">
                      <Stop offset="0" stopColor={v.face[0]} />
                      <Stop offset="0.55" stopColor={v.face[1]} />
                      <Stop offset="1" stopColor={v.face[2]} />
                    </RadialGradient>
                    <SvgLinearGradient id="body" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={v.body[0]} />
                      <Stop offset="1" stopColor={v.body[1]} />
                    </SvgLinearGradient>
                    {/* the dark hole behind, showing through the glass: a cast
                        shadow from the cutout's top lip... */}
                    <SvgLinearGradient id="holeShadow" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#000000" stopOpacity={0.24} />
                      <Stop offset="0.35" stopColor="#000000" stopOpacity={0} />
                    </SvgLinearGradient>
                    {/* ...and the cavity's darkness settling at the base */}
                    <SvgLinearGradient id="glassBot" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0.45" stopColor="#000000" stopOpacity={0} />
                      <Stop offset="1" stopColor="#000000" stopOpacity={0.5} />
                    </SvgLinearGradient>
                  </Defs>
                  {/* keycap body — the outermost plastic edge sliver */}
                  <Rect x={0.5} y={0.5} width={w - 1} height={h - 1} rx={r} ry={r} fill="url(#body)" />
                  {/* LED light seen THROUGH the glass — falloff weakened another
                      13% (Booth 2026-07-09o): the glow reaches the edge */}
                  <Rect x={gx} y={gx} width={gw} height={gh} rx={r} ry={r} fill="url(#glassFace)" />
                  {/* overall intensity pulled DOWN (Booth 2026-07-09p): cool,
                      dimmed pro-gear brightness, not cartoon-bright */}
                  <Rect x={gx} y={gx} width={gw} height={gh} rx={r} ry={r} fill="#000000" fillOpacity={0.14} />
                  <Rect
                    x={gx + 2}
                    y={gx + 2}
                    width={gw - 4}
                    height={gh - 4}
                    rx={Math.max(2, r - 2)}
                    ry={Math.max(2, r - 2)}
                    fill="none"
                    stroke="#000000"
                    strokeOpacity={0.05}
                    strokeWidth={1.5}
                  />
                  <Rect
                    x={gx + 0.75}
                    y={gx + 0.75}
                    width={gw - 1.5}
                    height={gh - 1.5}
                    rx={Math.max(2, r - 1)}
                    ry={Math.max(2, r - 1)}
                    fill="none"
                    stroke="#000000"
                    strokeOpacity={0.11}
                    strokeWidth={1.5}
                  />
                  {/* the dark cutout behind, visible through the diffused glow */}
                  <Rect x={gx} y={gx} width={gw} height={gh} rx={r} ry={r} fill="url(#holeShadow)" />
                  <Rect x={gx} y={gx} width={gw} height={gh} rx={r} ry={r} fill="url(#glassBot)" fillOpacity={0.45} />
                </Svg>

                {/* ---- INNER BUTTON — rides WITH the glass (one molded part) ---- */}
                <View style={[styles.inner, { left: fx, top: fy, width: fw, height: fh }]}>
                  <Svg width={fw} height={fh} viewBox={`0 0 ${fw} ${fh}`} style={styles.abs}>
                    <Defs>
                      {/* wide rx: long buttons stay evenly lit horizontally */}
                      <RadialGradient id="innerFace" cx="50%" cy="40%" rx="85%" ry="72%">
                        <Stop offset="0" stopColor={v.face[0]} />
                        <Stop offset="0.55" stopColor={v.face[1]} />
                        <Stop offset="1" stopColor={v.face[2]} />
                      </RadialGradient>
                      <SvgLinearGradient id="innerBot" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0.45" stopColor="#000000" stopOpacity={0} />
                        <Stop offset="1" stopColor="#000000" stopOpacity={0.4} />
                      </SvgLinearGradient>
                      <SvgLinearGradient id="innerEdge" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#ffffff" stopOpacity={0.05} />
                        <Stop offset="0.7" stopColor="#ffffff" stopOpacity={0.14} />
                        <Stop offset="1" stopColor="#ffffff" stopOpacity={0.38} />
                      </SvgLinearGradient>
                    </Defs>
                    <Rect x={0} y={0} width={fw} height={fh} rx={rf} ry={rf} fill="url(#innerFace)" />
                    <Rect x={0} y={0} width={fw} height={fh} rx={rf} ry={rf} fill="url(#innerBot)" />
                    {/* internal glow dimmed for the sleek pro look (07-09p) */}
                    <Rect x={0} y={0} width={fw} height={fh} rx={rf} ry={rf} fill="#000000" fillOpacity={0.16} />
                    {/* soft light-exit line where the glow meets the cover */}
                    <Rect
                      x={0.75}
                      y={0.75}
                      width={fw - 1.5}
                      height={fh - 1.5}
                      rx={Math.max(2, rf - 1)}
                      ry={Math.max(2, rf - 1)}
                      fill="none"
                      stroke="url(#innerEdge)"
                      strokeWidth={1.25}
                    />
                  </Svg>
                  <View style={styles.labelWrap} pointerEvents="none">
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                      style={[styles.label, { color: v.label, fontSize }]}
                    >
                      {label.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* ---- COVER, top layers: gloss + specular ON the glass ---- */}
                <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={styles.abs} pointerEvents="none">
                  <Defs>
                    {/* reflectivity boosted for a glassier top (07-09r) */}
                    <SvgLinearGradient id="bevel" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#ffffff" stopOpacity={0.38 * reflect} />
                      <Stop offset="0.4" stopColor="#ffffff" stopOpacity={0.06 * reflect} />
                      <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
                    </SvgLinearGradient>
                    {/* warm-white specular — tungsten room light, not LED-white */}
                    <RadialGradient id="spec" cx="50%" cy="50%" rx="50%" ry="50%">
                      <Stop offset="0" stopColor="#fff2d9" stopOpacity={0.7 * reflect} />
                      <Stop offset="0.65" stopColor="#fff2d9" stopOpacity={0.1 * reflect} />
                      <Stop offset="1" stopColor="#fff2d9" stopOpacity={0} />
                    </RadialGradient>
                    <SvgLinearGradient id="topEdge" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#ffffff" stopOpacity={0.5 * reflect} />
                      <Stop offset="0.25" stopColor="#ffffff" stopOpacity={0.11 * reflect} />
                      <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
                    </SvgLinearGradient>
                    {/* upper-LEFT diagonal highlight (matches the nav caps). */}
                    <SvgLinearGradient id="ulHi" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0" stopColor="#ffffff" stopOpacity={0.34 * reflect} />
                      <Stop offset="0.45" stopColor="#ffffff" stopOpacity={0.05 * reflect} />
                      <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
                    </SvgLinearGradient>
                  </Defs>
                  {/* the sheen lies on the cover — it sweeps ring AND face */}
                  <Rect x={gx} y={gx} width={gw} height={gh * 0.48} rx={r} ry={r} fill="url(#bevel)" />
                  {/* upper-left glass highlight over the whole cover */}
                  <Rect x={gx} y={gx} width={gw} height={gh} rx={r} ry={r} fill="url(#ulHi)" />
                  <Ellipse cx={w / 2} cy={gx + gh * 0.18} rx={gw * 0.44} ry={gh * 0.16} fill="url(#spec)" />
                  {/* second smaller reflection streak — the double-highlight
                      that reads as curved glass */}
                  <Ellipse cx={w * 0.28} cy={gx + gh * 0.4} rx={gw * 0.14} ry={gh * 0.07} fill="url(#spec)" opacity={0.45} />
                  <Rect
                    x={gx + 0.75}
                    y={gx + 0.75}
                    width={gw - 1.5}
                    height={gh - 1.5}
                    rx={r}
                    ry={r}
                    fill="none"
                    stroke="url(#topEdge)"
                    strokeWidth={1.5}
                  />
                </Svg>
              </>
            )}

            {/* Idle filament drift — a whisper of brightness wander. */}
            <Animated.View
              pointerEvents="none"
              style={[styles.offOverlay, { borderRadius: capBorderRadius, opacity: flickerOpacity }]}
            />
            {/* Bulb-off overlay — warm-dark (a cooling filament, not a hard
                LED cut); fades with the lamp value, lagging the mechanics. */}
            <Animated.View
              pointerEvents="none"
              style={[styles.offOverlay, { backgroundColor: '#0a0502', borderRadius: capBorderRadius, opacity: offOpacity }]}
            />
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // The hole in the casing: dark cavity, top edge casts a shadow inward, the
  // bottom lip catches a sliver of light. Static — only the cap moves.
  cutout: {
    flex: 1,
    backgroundColor: '#040405',
    padding: 1.5,
    borderWidth: 1,
    borderColor: '#000',
    borderBottomColor: 'rgba(255,255,255,0.09)',
  },
  cavityTop: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    height: 7,
  },
  fill: { flex: 1 },
  capWrap: { flex: 1 },
  abs: { position: 'absolute', top: 0, left: 0 },
  inner: { position: 'absolute' },
  labelWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  offOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#050507',
  },
  label: {
    fontFamily: fonts.oswaldBold,
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowRadius: 0.5,
    textShadowOffset: { width: 0, height: 1 },
  },
  // Clear glass chip — transparent fill, blue outline + glowing blue label
  // (the original GlossaryChip look), animated like the hardware switches.
  glassClear: {
    flex: 1,
    borderRadius: 4.5,
    borderWidth: 1,
    borderColor: 'rgba(91,176,255,.65)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Drop shadow under the blue frame — lifts the clear chip off the panel
    // for a stronger 3D read (Booth 2026-07-09s).
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 4, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 4 },
      default: {},
    }),
  },
  // Specular sheen over the upper half of the clear cap.
  glassClearSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  // Diagonal reflection streak across the glass.
  glassClearStreak: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  glassClearText: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1,
    color: '#5bb0ff',
    textShadowColor: 'rgba(91,176,255,.5)',
    textShadowRadius: 7,
    textShadowOffset: { width: 0, height: 0 },
  },
  // Flat 2D locked pill (no 3D, no light).
  flatLocked: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(150,90,220,.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flatLockedText: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 15,
    letterSpacing: 1.5,
    color: '#d9c6ff',
  },
});
