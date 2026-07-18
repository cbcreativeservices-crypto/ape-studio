/**
 * S0 — Splash (design-reference 09-s0-splash.dc.html + seed brief §3 S0).
 * BrandLogo 225px + wordmark, amber fade-in, auto-advance 2–3s on a session
 * check: session → Main (Dashboard), else → Auth. Uses navigation.reset so the
 * splash can't be returned to via back.
 */
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrandLogo } from '../components/BrandLogo';
import { colors, fonts } from '../theme/tokens';
import { supabase } from '../lib/supabase';
import { useCommercialMode } from '../features/commercial/EntitlementProvider';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  // CM2 (Booth 2026-07-11): with commercialMode ON, signed-out users land on
  // the pre-auth Landing (browse-first) instead of login-first Auth.
  const commercialMode = useCommercialMode();

  useEffect(() => {
    Animated.timing(logoOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
    Animated.timing(textOpacity, { toValue: 1, duration: 1600, useNativeDriver: true }).start();

    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      navigation.reset({
        index: 0,
        routes: [{ name: data.session ? 'Main' : commercialMode ? 'Landing' : 'Auth' }],
      });
      // Hold the intro ~2.5s before advancing (Booth 2026-07-11).
    }, 2500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigation, logoOpacity, textOpacity, commercialMode]);

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
