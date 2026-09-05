/**
 * NavIcon — per-tab icon (bundled PNG) + label, lit (active: full color + iOS
 * glow) / unlit (dimmed).
 *   Home = amber house · Study = blue headphones · Progress = white faders
 *   · Profile = green person. (The "Achievements" tab is LABELED "PROGRESS".)
 * Art replaced hand-drawn SVG/View glyphs with bundled transparent PNGs
 * (assets/icons/nav/*, owner 2026-08-13). The PROGRESS glyph never tracks/shows/
 * mutates any user progress (album/record progression retired for commercial).
 *
 * PROGRESS animation (owner 2026-08-16): when the Progress tab is the ACTIVE
 * tab, the white faders come alive — the three fader BLOCKS drift slowly up and
 * down their slider paths (never fully to the top); the vertical track lines
 * stay perfectly still. Inactive tabs keep the static PNG exactly as before,
 * as does Reduce Motion. Decorative only — still shows no user data.
 */
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export type NavIconName = 'Home' | 'Study' | 'Achievements' | 'Profile';

/** Display label for each tab (the Achievements tab reads "PROGRESS"). */
const NAV_LABEL: Record<NavIconName, string> = {
  Home: 'HOME',
  Study: 'STUDY',
  Achievements: 'PROGRESS',
  Profile: 'PROFILE',
};

/** Bundled icon art per tab (transparent PNGs). */
const NAV_SOURCE: Record<NavIconName, number> = {
  Home: require('../../../assets/icons/nav/nav-home.png'),
  Study: require('../../../assets/icons/nav/nav-study.png'),
  Achievements: require('../../../assets/icons/nav/nav-progress.png'),
  Profile: require('../../../assets/icons/nav/nav-profile.png'),
};

type Def = { color: string; glowRgba: string; font: number; spacing: number };

/** Inactive-tab LABEL dim (owner 2026-09-05, global): the text under each icon
 *  shows in the tab's OWN colour, lightly dimmed — "subtle but noticeable" —
 *  instead of the old flat gray "off" look. Icons are untouched; the active
 *  tab is full colour with its glow. */
const NAV_LABEL_DIM = 0.62;

/** Label color + active-glow tint per tab (the art itself is already colored). */
function defFor(icon: NavIconName): Def {
  switch (icon) {
    case 'Home':
      // App amber (was orange) — user request 2026-07-23.
      return { color: colors.amber, glowRgba: 'rgba(255,198,77,.7)', font: 10, spacing: 1 };
    case 'Study':
      return { color: colors.blue, glowRgba: 'rgba(47,155,255,.7)', font: 10, spacing: 1 };
    case 'Achievements':
      // PROGRESS label stays silver-toned; glyph is the white faders PNG.
      return { color: '#d6d6d6', glowRgba: 'rgba(230,230,230,.6)', font: 9.5, spacing: 0.9 };
    case 'Profile':
      return { color: colors.green, glowRgba: 'rgba(55,224,95,.7)', font: 10, spacing: 1 };
  }
}

function glowStyle(lit: boolean, rgba: string) {
  if (!lit || Platform.OS === 'android') return null;
  return { shadowColor: rgba, shadowOpacity: 1, shadowRadius: 7, shadowOffset: { width: 0, height: 0 } };
}

// ── Animated PROGRESS faders (active tab only) ──────────────────────────────
// Code-drawn replica of nav-progress.png at icon size: three static vertical
// tracks, three grooved fader blocks. Only the BLOCKS move — slow independent
// drifts (different durations, so they never sync), clamped so no fader ever
// reaches fully up. Native-driver translateY.
const FADER_ICON = 22; // matches styles.icon
const FADER_COL_W = 6;
const FADER_TRACK_W = 3;
const FADER_BLOCK_H = 6.5;
const FADER_TOP_MIN = 2; // never fully all the way up — even on an excursion
const FADER_BOTTOM_MAX = FADER_ICON - FADER_BLOCK_H; // 15.5 — may rest at the bottom
// TOP-QUARTER rule (owner 2026-08-16): the top 1/4 of the fader travel
// (translateY < ~3.9) is off-limits to the normal drift; ONE fader may visit it
// at most ONCE EVERY 3 MINUTES (rotating), then resumes the normal range.
const FADER_EXC_TOP = FADER_TOP_MIN; // excursion peak — inside the top quarter
const FADER_NORMAL_TOP = [4, 6, 4]; // normal upper limits — all below the top quarter
const FADER_BOTTOM = [14, 15, 11];
/** Phase (0..1 over [EXC_TOP..bottom]) of each fader's NORMAL upper limit. */
const FADER_NORM_PHASE = FADER_NORMAL_TOP.map((t, i) => (t - FADER_EXC_TOP) / (FADER_BOTTOM[i] - FADER_EXC_TOP));
const FADER_MS = [4200, 5400, 6200]; // one direction; full cycle = ×2
const FADER_EXC_EVERY_MS = 180000; // 3 minutes
// Module-scope guard so remounting the tab can't produce excursions more often
// than once per 3 minutes.
let lastFaderExcursionAt = 0;
let nextExcursionFader = 0;

function ProgressFadersLit() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (live) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);

  // Phase 0 = excursion peak, FADER_NORM_PHASE[i] = normal upper limit,
  // 1 = bottom. Start mid-window, desynced.
  const phases = useRef([new Animated.Value(0.55), new Animated.Value(0.8), new Animated.Value(0.45)]).current;

  useEffect(() => {
    if (reduceMotion) return;
    const ease = Easing.inOut(Easing.sin);
    // react-native-web's vendored NativeAnimatedHelper references Platform
    // without importing it and throws when native-driver paths run on web —
    // JS driver there; native driver on device.
    const nativeDriver = Platform.OS !== 'web';
    // Normal drift: between the fader's NORMAL upper limit and its bottom —
    // never into the top quarter. resetBeforeIteration:false is CRITICAL:
    // without it loop() snaps back to the initial phase each cycle (the jump
    // the owner saw); with it every cycle continues from the current position.
    const makeLoop = (i: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(phases[i], { toValue: FADER_NORM_PHASE[i], duration: FADER_MS[i], easing: ease, useNativeDriver: nativeDriver }),
          Animated.timing(phases[i], { toValue: 1, duration: FADER_MS[i], easing: ease, useNativeDriver: nativeDriver }),
        ]),
        { resetBeforeIteration: false },
      );
    const loops = phases.map((_, i) => makeLoop(i));
    loops.forEach((l) => l.start());
    let stopped = false;
    // Top-quarter excursion: at most once every 3 minutes (module-guarded), one
    // fader (rotating) glides up into the top quarter, back to the bottom, and
    // rejoins its normal loop.
    const iv = setInterval(() => {
      if (stopped) return;
      const now = Date.now();
      if (now - lastFaderExcursionAt < FADER_EXC_EVERY_MS) return;
      lastFaderExcursionAt = now;
      const i = nextExcursionFader;
      nextExcursionFader = (nextExcursionFader + 1) % phases.length;
      loops[i].stop();
      Animated.sequence([
        Animated.timing(phases[i], { toValue: 0, duration: FADER_MS[i], easing: ease, useNativeDriver: nativeDriver }),
        Animated.timing(phases[i], { toValue: 1, duration: Math.round(FADER_MS[i] * 1.2), easing: ease, useNativeDriver: nativeDriver }),
      ]).start(({ finished }) => {
        if (finished && !stopped) {
          loops[i] = makeLoop(i);
          loops[i].start();
        }
      });
    }, FADER_EXC_EVERY_MS);
    return () => {
      stopped = true;
      clearInterval(iv);
      loops.forEach((l) => l.stop());
    };
  }, [reduceMotion, phases]);

  return (
    <View style={styles.faderRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {FADER_BOTTOM.map((bottom, i) => (
        <View key={i} style={styles.faderCol}>
          {/* Track — static, never animates. */}
          <View style={styles.faderTrack} />
          <Animated.View
            style={[
              styles.faderBlock,
              {
                transform: [
                  { translateY: phases[i].interpolate({ inputRange: [0, 1], outputRange: [FADER_EXC_TOP, bottom] }) },
                ],
              },
            ]}
          >
            <View style={styles.faderGroove} />
          </Animated.View>
        </View>
      ))}
    </View>
  );
}

export function NavIcon({
  icon,
  lit,
  showLabel = true,
}: {
  icon: NavIconName;
  lit: boolean;
  showLabel?: boolean;
}) {
  const d = defFor(icon);
  const glow = glowStyle(lit, d.glowRgba);

  // ACTIVE Progress tab: swap the static PNG for the animated faders (the
  // ProgressFadersLit component itself falls back to still blocks under
  // Reduce Motion). Every other state keeps the PNG untouched.
  const animatedProgress = icon === 'Achievements' && lit;

  return (
    <View style={[styles.wrap, { opacity: lit ? 1 : 0.4 }]}>
      {animatedProgress ? (
        <View style={[styles.icon, glow]}>
          <ProgressFadersLit />
        </View>
      ) : (
        <Image
          accessible={false}
          importantForAccessibility="no"
          source={NAV_SOURCE[icon]}
          style={[styles.icon, glow]}
          resizeMode="contain"
        />
      )}

      {showLabel && (
        <Text style={[styles.label, { fontSize: d.font, letterSpacing: d.spacing, color: d.color, opacity: lit ? 1 : NAV_LABEL_DIM }, glow]}>
          {NAV_LABEL[icon]}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { fontFamily: fonts.oswaldSemiBold },
  icon: { width: 22, height: 22 },
  // Animated PROGRESS faders (drawn at icon size, white like the PNG art)
  faderRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  faderCol: { width: FADER_COL_W, height: FADER_ICON },
  faderTrack: {
    position: 'absolute',
    left: (FADER_COL_W - FADER_TRACK_W) / 2,
    top: 0,
    bottom: 0,
    width: FADER_TRACK_W,
    borderRadius: FADER_TRACK_W / 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  faderBlock: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: FADER_COL_W,
    height: FADER_BLOCK_H,
    borderRadius: 1.8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },
  faderGroove: { height: 1, marginHorizontal: 1, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 0.5 },
});
