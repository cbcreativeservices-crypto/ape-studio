/**
 * Final Exam result — the terminal screen of the R6b capstone flow.
 *
 * Renders the server's result_payload verbatim; it computes nothing itself.
 * The four outcomes come straight from submit_final_exam:
 *   pass      → credential issued (credential_awarded true on the first pass)
 *   no_pass   → retake allowed immediately, no cooldown (owner ruling D3)
 *   timed_out → past the 602-second grace
 *   voided    → 2+ app switches; lockout_until carries the 15-minute release
 */
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StudioButton } from '../../components/StudioButton';
import { colors, fonts } from '../../theme/tokens';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'FinalExamResult'>;

const COPY: Record<string, { title: string; body: string; tone: 'good' | 'bad' | 'warn' }> = {
  pass: {
    title: 'PASSED',
    body: 'You have met the standard for this credential. It has been added to your record.',
    tone: 'good',
  },
  no_pass: {
    title: 'NOT PASSED',
    body: 'You did not reach the pass mark this time. You may retake the Final Exam whenever you are ready — there is no waiting period.',
    tone: 'bad',
  },
  timed_out: {
    title: 'TIME EXPIRED',
    body: 'The exam was submitted past the ten-minute limit, so it could not be graded. You may retake it whenever you are ready.',
    tone: 'warn',
  },
  voided: {
    title: 'ATTEMPT VOIDED',
    body: 'This attempt was voided because the app was switched away from during the exam. The Final Exam is locked briefly before you can try again.',
    tone: 'warn',
  },
};

function fmtLockout(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function FinalExamResultScreen({ navigation, route }: Props) {
  const { result, awardName } = route.params;
  const insets = useSafeAreaInsets();

  const copy = COPY[result.outcome] ?? COPY.no_pass;
  const lockout = useMemo(() => fmtLockout(result.lockout_until), [result.lockout_until]);
  const graded = result.outcome === 'pass' || result.outcome === 'no_pass';

  const toneColor =
    copy.tone === 'good' ? colors.green : copy.tone === 'bad' ? colors.red : colors.amber;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.awardName} numberOfLines={2}>
          {awardName}
        </Text>
        <Text style={styles.kicker}>FINAL EXAM</Text>

        <Text style={[styles.outcome, { color: toneColor }]}>{copy.title}</Text>

        {graded && (
          <View style={styles.scoreBlock}>
            <Text style={[styles.score, { color: toneColor }]}>
              {result.score}
              <Text style={styles.scoreOf}> / {result.size}</Text>
            </Text>
            <Text style={styles.passMark}>PASS MARK {result.pass_mark}</Text>
          </View>
        )}

        <Text style={styles.body}>{copy.body}</Text>

        {result.credential_awarded && (
          <View style={styles.credentialBox}>
            <Text style={styles.credentialLabel}>CREDENTIAL ISSUED</Text>
            <Text style={styles.credentialBody}>
              This credential is now part of your permanent record and can be viewed from your profile.
            </Text>
          </View>
        )}

        {lockout && (
          <Text style={styles.lockout}>Locked until approximately {lockout}.</Text>
        )}

        <View style={styles.actions}>
          <StudioButton
            label="Done"
            variant={result.outcome === 'pass' ? 'success' : 'secondary'}
            onPress={() => navigation.goBack()}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  scroll: { padding: 24, gap: 14, alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
  awardName: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 20,
    lineHeight: 27,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  kicker: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textSubAlt,
  },
  outcome: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 28,
    letterSpacing: 2,
    marginTop: 10,
    textAlign: 'center',
  },
  scoreBlock: { alignItems: 'center', gap: 4, marginTop: 4 },
  score: { fontFamily: fonts.mono, fontSize: 44, letterSpacing: 1 },
  scoreOf: { fontSize: 24, color: colors.textSubAlt },
  passMark: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 1.5, color: colors.textSubAlt },
  body: {
    fontFamily: fonts.barlowRegular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  credentialBox: {
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.5)',
    borderRadius: 8,
    padding: 16,
    gap: 6,
    marginTop: 10,
  },
  credentialLabel: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1.6,
    color: '#37e05f',
    textAlign: 'center',
  },
  credentialBody: {
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  lockout: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSubAlt, marginTop: 4 },
  actions: { width: 220, marginTop: 18 },
});
