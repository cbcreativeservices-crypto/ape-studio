/**
 * The three short "what is this?" cards (owner 2026-10-14): Specialist
 * Certificates, Program Certificates, Pro Registry. ONE wording, shown under
 * the Explore glance graphic (tappable, each opens its page) and at the top of
 * each of those three pages. Brief and low on purpose.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

export type BlurbKey = 'specialization' | 'program' | 'directory';

export const CREDENTIAL_BLURBS: Record<BlurbKey, { title: string; body: string; tone: string }> = {
  specialization: {
    title: 'SPECIALIST CERTIFICATES',
    body: 'Focused credentials in one area of audio. Complete the topics and labs, then pass the final exam.',
    tone: colors.blue,
  },
  program: {
    title: 'PROGRAM CERTIFICATES',
    body: 'Career-path credentials across many subjects. Complete every part, then pass the final exam.',
    tone: colors.purple,
  },
  directory: {
    title: 'PRO REGISTRY',
    body: 'Your opt-in professional profile: certificate record, networking and messaging, and employer verification.',
    tone: '#ffffff',
  },
};

export const BLURB_ORDER: BlurbKey[] = ['specialization', 'program', 'directory'];

/** One card. With `onPress` it is a button with a › (Explore); without, plain (top of its own page). */
export function CredentialBlurb({ kind, onPress }: { kind: BlurbKey; onPress?: () => void }) {
  const c = CREDENTIAL_BLURBS[kind];
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.card, { borderLeftColor: c.tone }]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${c.title}. ${c.body}`}
    >
      <View style={styles.head}>
        <Text style={[styles.title, { color: c.tone }]}>{c.title}</Text>
        {onPress ? <Text style={styles.go}>›</Text> : null}
      </View>
      <Text style={styles.body}>{c.body}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#161616', borderWidth: 1, borderColor: '#232323', borderLeftWidth: 3, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 11 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1 },
  go: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.textSub },
  body: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 17, color: colors.textSecondary, marginTop: 2 },
});
