/**
 * S5 — Trophy Unlock Animation (trigger: quiz full-pass; visuals from
 * 13-s5-trophy-anim.dc.html — amber radial burst on near-black, which
 * supersedes the seed brief's #003366→#330066→#cc9900 gradient per the
 * ratified design-reference precedence).
 * Confetti 3s · haptic 230 BPM crescendo 4.5s · auto-advance 5s → Trophy (S8).
 * Trophy artwork ships later — 512² image slot rendered as a glowing disc.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Confetti } from '../../components/Confetti';
import { TrophyImage } from '../../components/TrophyImage';
import { supabase } from '../../lib/supabase';
import { colors, fonts } from '../../theme/tokens';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TrophyAnim'>;

const BEAT_MS = Math.round(60_000 / 230); // 230 BPM ≈ 261ms
const CRESCENDO_MS = 4500;
const AUTO_ADVANCE_MS = 5000;

export function TrophyAnimScreen({ navigation, route }: Props) {
  const { topicName, achievementId, badgeEarned } = route.params;
  const scale = useRef(new Animated.Value(0.6)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('achievements')
      .select('icon_url')
      .eq('id', achievementId)
      .single()
      .then(({ data }) => setIconUrl(data?.icon_url ?? null));
  }, [achievementId]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]).start();

    // Haptic crescendo: steady 230 BPM, intensity stepping up over 4.5s.
    const start = Date.now();
    const beat = setInterval(() => {
      const t = Date.now() - start;
      if (t >= CRESCENDO_MS) {
        clearInterval(beat);
        return;
      }
      const style =
        t < 1500
          ? Haptics.ImpactFeedbackStyle.Light
          : t < 3000
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Heavy;
      void Haptics.impactAsync(style);
    }, BEAT_MS);

    const advance = setTimeout(() => {
      navigation.replace('Trophy', {
        topicName,
        achievementId,
        badgeEarned,
        entrySource: 'quiz_win',
      });
    }, AUTO_ADVANCE_MS);

    return () => {
      clearInterval(beat);
      clearTimeout(advance);
    };
  }, [navigation, topicName, achievementId, badgeEarned, scale, fade]);

  return (
    <View style={styles.root}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="burst" cx="50%" cy="42%" r="58%">
            <Stop offset="0%" stopColor="#ffb400" stopOpacity={0.25} />
            <Stop offset="100%" stopColor="#ffb400" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#burst)" />
      </Svg>

      <Confetti />

      <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
        <TrophyImage
          iconUrl={iconUrl}
          size={140}
          radius={70}
          style={styles.trophyImg}
          fallback={
            <View style={styles.trophySlot}>
              <Text style={styles.trophyPlaceholder}>Trophy 512²</Text>
            </View>
          }
        />
      </Animated.View>

      <Animated.Text style={[styles.title, { opacity: fade }]}>TOPIC COMPLETE!</Animated.Text>
      <Animated.Text style={[styles.subtitle, { opacity: fade }]}>UNLOCKING TROPHY…</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.screenBgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophySlot: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(255,180,0,.45)',
    shadowOpacity: 1,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  trophyImg: {
    shadowColor: 'rgba(255,180,0,.45)',
    shadowOpacity: 1,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  trophyPlaceholder: { fontFamily: fonts.mono, fontSize: 12, color: '#5a5a5a' },
  title: {
    fontFamily: fonts.oswaldBold,
    fontSize: 26,
    letterSpacing: 1,
    color: '#e8e8e8',
    marginTop: 26,
  },
  subtitle: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 2.9,
    color: colors.amber,
    marginTop: 8,
    textShadowColor: 'rgba(255,180,0,.5)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
});
