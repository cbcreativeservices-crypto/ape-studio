/**
 * S0 — Splash (design-reference 09-s0-splash.dc.html + seed brief §3 S0).
 * BrandLogo 225px + wordmark, amber fade-in, auto-advance 2–3s on a session
 * check: session → Main (Dashboard), else → Auth. Uses navigation.reset so the
 * splash can't be returned to via back.
 */
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { PartialRoute, Route } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrandLogo } from '../components/BrandLogo';
import { colors, fonts } from '../theme/tokens';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../navigation/types';
import { clearPendingLink } from '../navigation/pendingLink';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(logoOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
    Animated.timing(textOpacity, { toValue: 1, duration: 1600, useNativeDriver: true }).start();

    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      // Boot: session → Main (Dashboard), else → the finished login screen.
      // The pre-auth commercial Landing is still WIP, so startup does NOT route
      // to it (owner 2026-08-06) — reinstate that branch when Landing is done.
      //
      // KEEP WHAT WAS PUSHED OVER THE SPLASH (B-047): a cold start from a
      // push/local-notification tap navigates (WeeklyConcept / Awards / Main)
      // within milliseconds of the container being ready — i.e. on top of this
      // screen, before the timer fires. A bare reset threw that away, so the
      // tapped card showed for ~2.5 s and vanished. Carry those routes over the
      // new base instead (same keys → the mounted screens survive). Without a
      // session, the Main shell must not be kept; anything else still closes
      // back onto Auth.
      // A signed-in user needs no resume: React Navigation's linking already
      // pushed the deep-linked screen over this one, and the carry-over below
      // keeps it. Drop the remembered destination so a later sign-out →
      // sign-in in the same launch cannot replay a stale link (2026-09-05).
      if (data.session) clearPendingLink();
      const base = data.session ? 'Main' : 'Auth';
      const pushed: PartialRoute<Route<keyof RootStackParamList>>[] = navigation
        .getState()
        .routes.filter((r) => r.name !== 'Splash')
        .map((r) => ({ key: r.key, name: r.name, params: r.params }));
      const baseRoute = pushed.find((r) => r.name === base) ?? { name: base };
      const above = pushed.filter((r) => r !== baseRoute && (data.session || r.name !== 'Main'));
      navigation.reset({
        index: above.length,
        routes: [baseRoute, ...above],
      });
      // Hold the intro ~2.5s before advancing (Booth 2026-07-11).
    }, 2500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigation, logoOpacity, textOpacity]);

  return (
    <View style={styles.root}>
      {/* Amber radial glow centered at 50%/42% (approximates the CSS radial-gradient). */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="42%" r="55%">
            <Stop offset="0%" stopColor="#ffb400" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="#ffb400" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
      </Svg>

      <Animated.View style={{ opacity: logoOpacity }}>
        <BrandLogo size={225} />
      </Animated.View>

      <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
        <Text style={styles.proAudio}>PRO AUDIO</Text>
        <Text style={styles.trainingAcademy}>TRAINING ACADEMY</Text>
        <Text style={styles.glossary}>PROFESSIONAL AUDIO GLOSSARY</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.splashBg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  textBlock: { alignItems: 'center' },
  // Silver gradient wordmark approximated with a light silver (RN text has no
  // background-clip gradient without MaskedView; revisit if pixel-matched needed).
  proAudio: {
    fontFamily: fonts.oswaldBold,
    fontSize: 34,
    letterSpacing: 1.36,
    color: '#e8e8e8',
  },
  trainingAcademy: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 13,
    letterSpacing: 5.2,
    color: colors.amber,
    marginTop: 2,
    textShadowColor: 'rgba(255,180,0,.5)',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },
  glossary: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    letterSpacing: 2.7,
    color: '#777',
    marginTop: 12,
  },
});
