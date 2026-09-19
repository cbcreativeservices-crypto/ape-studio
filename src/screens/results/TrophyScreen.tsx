/**
 * S8 — Trophy: the VIEWER for a trophy the user already earned. Amber radial
 * ground, success haptic, trophy image, achievement title, and the badge
 * callout when one was earned (notification only, no routing button).
 *
 * ── NO LONGER THE QUIZ-WIN SCREEN (owner 2026-09-17) ─────────────────────────
 *
 * This route used to do two unrelated jobs behind one `entrySource` flag:
 * celebrate a freshly passed quiz, and let someone open a trophy from the
 * Gallery weeks later. The first is now the celebration engine's
 * ('topic-complete' / 'perfect-score' → CelebrationScreen), which is where the
 * congratulation, the tiering and the low-light rule belong.
 *
 * What remains is the second job, and it is a real one — so this screen was
 * NOT deleted. It simply stopped pretending to be two screens: there is no
 * auto-advance, the button always reads Back, and it always goes back to
 * wherever the trophy was tapped.
 *
 * `TrophyEntrySource` keeps 'quiz_win' in its union because saved navigation
 * state and any older deep link may still carry it; arriving here with it now
 * behaves exactly like the gallery, which is the safe reading.
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

export function TrophyScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  // `entrySource` is still in the params (older navigation state may carry it)
  // but nothing reads it any more — every entry behaves the same now.
  const { topicName, achievementId } = route.params;
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  /** Always back to whatever opened this trophy. */
  const exit = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    // Reached with no history — a deep link, or restored navigation state.
    navigation.reset({
      index: 0,
      routes: [
        { name: 'Main', params: { screen: 'Achievements', params: { screen: 'AchievementsHome' } } },
      ],
    });
  };

  useEffect(() => {
    supabase
      .from('achievements')
      .select('icon_url')
      .eq('id', achievementId)
      .single()
      .then(
        ({ data }) => {
          setIconUrl(data?.icon_url ?? null);
        },
        // [47] (2026-09-07): guard the rejection — leave the fallback icon.
        () => {},
      );
  }, [achievementId]);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // No auto-advance. This is a trophy the user deliberately opened, so it
    // stays open until they close it — the 5-second timer existed only for the
    // quiz-win path, which is now the celebration engine's.
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
            {/* Clean neutral mark, never the dev "Trophy 512²" placeholder text
                shown to real users on completion (honesty audit 2026-09-09). */}
            <Text style={styles.trophyPlaceholder}>★</Text>
          </View>
        }
      />

      <Text style={styles.title}>{(topicName ?? '').toUpperCase()}</Text>

      <View style={styles.buttonWrap}>
        <StudioButton label="Back" variant="white" onPress={exit} />
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
  buttonWrap: { alignSelf: 'stretch', marginTop: 20 },
});
