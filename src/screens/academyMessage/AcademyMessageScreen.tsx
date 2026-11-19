/**
 * AcademyMessageScreen — the academy's message, opened from the main menu's
 * green "New Messages" button (owner 2026-11-17). [MD:D68]
 * Opening it marks it read, so the button goes away.
 */
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BACK_HIT_SLOP } from '../../components/backHitSlop';
import { colors, fonts } from '../../theme/tokens';
import type { RootStackParamList } from '../../navigation/types';
import { readingColumn } from '../../theme/readingColumn';
import { safeGoBack } from '../../lib/safeGoBack';
import { markAcademyMessageRead } from '../../features/directory/CommunityBadge';

/** The owner-approved text (2026-11-17). */
const M = {
  from: 'Pro Audio Training Academy',
  title: 'Welcome, and thank you for joining us early!',
  paragraphs: [
    'Thank you to all of our new members for joining Pro Audio Training Academy so early, and welcome to the community!',
    'We launched the app on Friday, November 6, and we are still making improvements every week: fixes, clearer lessons, new pictures and new features.',
  ],
  howToTitle: 'How to get our latest version on your phone',
  howToIntro: 'We send each update straight to your phone, but you’ll only see it after the app fully restarts. To load it:',
  steps: [
    {
      text: 'Close the app completely.',
      sub: [
        'iPhone: swipe up from the bottom of the screen and pause, then swipe the app’s card up and off the screen.',
        'Android: open the recent-apps view (the square button, or swipe up and hold), then swipe the app away.',
      ],
    },
    { text: 'Open the app again.', sub: [] },
    { text: 'Do it one more time: close it completely and open it again.', sub: [] },
  ],
  after: [
    'The first restart downloads our update; the second one loads it in.',
    'We recommend doing this once a week so you always have our newest version.',
    'Thank you for learning with us. We’re glad you’re here.',
  ],
  signOff: '— Pro Audio Training Academy',
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'AcademyMessage'>;

export function AcademyMessageScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    markAcademyMessageRead();
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <Text accessibilityRole="header" style={styles.headerTitle}>MESSAGE FROM THE ACADEMY</Text>
        <Pressable onPress={() => safeGoBack(navigation)} hitSlop={BACK_HIT_SLOP} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.from}>FROM {M.from.toUpperCase()}</Text>
        <Text accessibilityRole="header" style={styles.title}>{M.title}</Text>
        {M.paragraphs.map((p) => (
          <Text key={p} style={styles.body}>{p}</Text>
        ))}

        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.cardTitle}>{M.howToTitle}</Text>
          <Text style={styles.body}>{M.howToIntro}</Text>
          {M.steps.map((s, i) => (
            <View key={s.text} style={styles.step}>
              <Text style={styles.stepNum}>{i + 1}.</Text>
              <View style={styles.stepBody}>
                <Text style={styles.stepText}>{s.text}</Text>
                {s.sub.map((line) => {
                  const [device, ...rest] = line.split(': ');
                  return (
                    <Text key={line} style={styles.body}>
                      <Text style={styles.device}>{device}: </Text>
                      {rest.join(': ')}
                    </Text>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {M.after.map((p) => (
          <Text key={p} style={styles.body}>{p}</Text>
        ))}
        <Text style={styles.signOff}>{M.signOff}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineDim,
    backgroundColor: '#121212',
  },
  headerTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.6, color: colors.textPrimary, flexShrink: 1 },
  close: { fontSize: 18, color: colors.textSubAlt },
  scroll: { padding: 20, gap: 16, ...readingColumn },
  from: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2.2, color: colors.amberLabel },
  title: { fontFamily: fonts.oswaldBold, fontSize: 22, lineHeight: 28, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 24, color: colors.textSecondary },
  card: {
    gap: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairlineDim,
    backgroundColor: '#161616',
  },
  cardTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: colors.amber },
  step: { flexDirection: 'row', gap: 8 },
  stepNum: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, lineHeight: 24, color: colors.amber, minWidth: 18 },
  stepBody: { flex: 1, gap: 4 },
  stepText: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 24, color: colors.textPrimary },
  device: { fontFamily: fonts.oswaldSemiBold, color: colors.textPrimary },
  signOff: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 24, color: colors.textPrimary, marginTop: 4 },
});
