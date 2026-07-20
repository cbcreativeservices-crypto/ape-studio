/**
 * S8 — Trophy (visuals from 14-s8-trophy.dc.html): amber radial ground,
 * confetti 3s + haptic, trophy image slot (512² placeholder until artwork
 * ships), achievement title, badge callout when earned ("You earned [Badge]
 * — View on Profile", notification only, no routing button).
 * Exit by entry_source: quiz_win → [Next] + auto-advance 5s; gallery /
 * achievements_grid / practice → [Back], no auto-advance (M7 wires those).
 */
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StudioButton } from '../../components/StudioButton';
import { TrophyImage } from '../../components/TrophyImage';
import { supabase } from '../../lib/supabase';
import { colors, fonts } from '../../theme/tokens';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Trophy'>;

const AUTO_ADVANCE_MS = 5000;

export function TrophyScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { topicName, achievementId, badgeEarned, entrySource } = route.params;
  const [badgeName, setBadgeName] = useState<string | null>(null);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const isQuizWin = entrySource === 'quiz_win';

  const exit = () => {
    if (isQuizWin) {
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] }); // → Dashboard
    } else {
      navigation.goBack();
    }
  };

  useEffect(() => {
    supabase
      .from('achievements')
      .select('badge_trigger, icon_url')
      .eq('id', achievementId)
      .single()
      .then(({ data }) => {
        setIconUrl(data?.icon_url ?? null);
        if (badgeEarned) setBadgeName(data?.badge_trigger?.toUpperCase() ?? null);
      });
  }, [badgeEarned, achievementId]);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!isQuizWin) return;
    const t = setTimeout(exit, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 28 }]}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="ground" cx="50%" cy="38%" r="58%">
            <Stop offset="0%" stopColor="#ffb400" stopOpacity={0.22} />
            <Stop offset="100%" stopColor="#ffb400" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#ground)" />
      </Svg>

      {/* Confetti removed — no award animation is used (user request 2026-07-18). */}

      <TrophyImage
        iconUrl={iconUrl}
        size={150}
        style={styles.trophyImg}
        fallback={
          <View style={styles.trophySlot}>
            <Text style={styles.trophyPlaceholder}>Trophy 512²</Text>
          </View>
        }
      />

      <Text style={styles.title}>{topicName.toUpperCase()}</Text>

      {badgeEarned && (
        <View style={styles.badgeCallout}>
          <Text style={styles.badgeText}>
            You earned <Text style={styles.badgeName}>{badgeName ?? 'a badge'}</Text> — View on Profile
          </Text>
        </View>
      )}

      <View style={styles.buttonWrap}>
        <StudioButton label={isQuizWin ? 'Next' : 'Back'} variant="white" onPress={exit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.screenBgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 28,
  },
  trophySlot: {
    width: 150,
    height: 150,
    borderRadius: 10,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(255,180,0,.25)',
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  trophyImg: {
    shadowColor: 'rgba(255,180,0,.25)',
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  trophyPlaceholder: { fontFamily: fonts.mono, fontSize: 12, color: '#5a5a5a' },
  title: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 21,
    letterSpacing: 1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 16,
  },
  badgeCallout: {
    backgroundColor: '#1d1607',
    borderWidth: 1,
    borderColor: 'rgba(255,194,51,.5)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  badgeText: { fontFamily: fonts.barlowMedium, fontSize: 14, color: '#ffd27a', textAlign: 'center' },
  badgeName: { fontFamily: fonts.barlowSemiBold, color: colors.amber },
  buttonWrap: { alignSelf: 'stretch', marginTop: 20 },
});
